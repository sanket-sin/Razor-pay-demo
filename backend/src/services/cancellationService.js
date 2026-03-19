import {
  Booking,
  GroupBooking,
  GroupSession,
  Order,
  Payment,
  Product,
  Creator,
  Refund,
  sequelize,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';
import { getPaymentProvider } from './payment/getProvider.js';

function hoursUntil(targetDate) {
  return (new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60);
}

/** Full refund if >= SESSION_FULL_REFUND_HOURS before slot start; else 50% if >= 6h else 0 */
function sessionRefundRatio(hoursBeforeStart) {
  const full = config.sessionFullRefundHours;
  if (hoursBeforeStart >= full) return 1;
  if (hoursBeforeStart >= 6) return 0.5;
  return 0;
}

export async function cancelSlotBooking(bookingId, actorUserId, asCreator) {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: Slot, as: 'slot', include: [{ model: Session, as: 'session', include: [{ model: Creator, as: 'creator' }] }] },
    ],
  });
  if (!booking) throw AppError.notFound('Booking not found');
  const session = booking.slot?.session;
  if (!session) throw AppError.notFound('Session not found');

  const creator = await Creator.findOne({ where: { userId: actorUserId } });
  const isOwner = creator && session.creatorId === creator.id;

  if (asCreator && !isOwner) throw AppError.forbidden();
  if (!asCreator && booking.userId !== actorUserId) throw AppError.forbidden();
  if (!['confirmed', 'pending_payment'].includes(booking.status)) {
    throw AppError.conflict('Booking cannot be cancelled');
  }

  const slotStart = booking.slot.startUtc;
  const ratio = asCreator ? 1 : sessionRefundRatio(hoursUntil(slotStart));
  const payment = booking.paymentId
    ? await Payment.findByPk(booking.paymentId)
    : null;

  return sequelize.transaction(async (t) => {
    if (booking.status === 'pending_payment') {
      await booking.slot.update({ status: 'available', lockExpiresAt: null }, { t });
      await booking.destroy({ transaction: t });
      return { refunded: false, message: 'Lock released' };
    }

    await booking.update(
      { status: asCreator ? 'cancelled_creator' : 'cancelled_user', cancelledAt: new Date() },
      { transaction: t }
    );
    await booking.slot.update({ status: 'available', lockExpiresAt: null }, { transaction: t });

    if (!payment || payment.status !== 'captured' || ratio === 0) {
      return { refunded: false, refundAmount: 0, message: ratio === 0 ? 'No refund per policy' : 'No payment to refund' };
    }

    const refundAmount = Math.floor(payment.amountTotal * ratio);
    if (refundAmount <= 0) {
      return { refunded: false, refundAmount: 0 };
    }

    const provider = getPaymentProvider(payment.provider);
    const ext = await provider.refund({
      paymentIntentId: payment.externalOrderId,
      amountMinor: refundAmount < payment.amountTotal ? refundAmount : undefined,
      reason: 'session_cancellation',
    });

    await Refund.create(
      {
        paymentId: payment.id,
        amount: refundAmount,
        reason: 'session_cancellation',
        status: 'succeeded',
        externalRefundId: ext.externalRefundId,
      },
      { transaction: t }
    );

    const newStatus = refundAmount >= payment.amountTotal ? 'refunded_full' : 'refunded_partial';
    await payment.update({ status: newStatus }, { transaction: t });

    return { refunded: true, refundAmount, externalRefundId: ext.externalRefundId };
  });
}

export async function cancelGroupBooking(groupBookingId, actorUserId, asCreator) {
  const gb = await GroupBooking.findByPk(groupBookingId, {
    include: [{ model: GroupSession, as: 'groupSession' }],
  });
  if (!gb) throw AppError.notFound('Group booking not found');
  const gs = gb.groupSession;
  const creator = await Creator.findOne({ where: { userId: actorUserId } });
  const isOwner = creator && gs.creatorId === creator.id;
  if (asCreator && !isOwner) throw AppError.forbidden();
  if (!asCreator && gb.userId !== actorUserId) throw AppError.forbidden();

  const firstDay = new Date(gs.startDate);
  firstDay.setHours(12, 0, 0, 0);
  const ratio = asCreator ? 1 : sessionRefundRatio(hoursUntil(firstDay));

  const payment = gb.paymentId ? await Payment.findByPk(gb.paymentId) : null;

  return sequelize.transaction(async (t) => {
    if (gb.status === 'pending_payment') {
      await gb.destroy({ transaction: t });
      return { refunded: false };
    }
    await gb.update(
      { status: asCreator ? 'cancelled_creator' : 'cancelled_user', cancelledAt: new Date() },
      { transaction: t }
    );

    if (!payment || payment.status !== 'captured' || ratio === 0) {
      return { refunded: false, refundAmount: 0 };
    }
    const refundAmount = Math.floor(payment.amountTotal * ratio);
    const provider = getPaymentProvider(payment.provider);
    const ext = await provider.refund({
      paymentIntentId: payment.externalOrderId,
      amountMinor: refundAmount < payment.amountTotal ? refundAmount : undefined,
      reason: 'group_cancellation',
    });
    await Refund.create(
      {
        paymentId: payment.id,
        amount: refundAmount,
        status: 'succeeded',
        externalRefundId: ext.externalRefundId,
      },
      { transaction: t }
    );
    await payment.update(
      {
        status: refundAmount >= payment.amountTotal ? 'refunded_full' : 'refunded_partial',
      },
      { transaction: t }
    );
    return { refunded: true, refundAmount };
  });
}

export async function cancelProductOrder(orderId, actorUserId, asCreator) {
  const order = await Order.findByPk(orderId, { include: [{ model: Product, as: 'product' }] });
  if (!order) throw AppError.notFound('Order not found');
  const creator = await Creator.findOne({ where: { userId: actorUserId } });
  const isOwner = creator && order.product.creatorId === creator.id;
  if (asCreator && !isOwner) throw AppError.forbidden();
  if (!asCreator && order.userId !== actorUserId) throw AppError.forbidden();

  if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
    throw AppError.conflict('Order cannot be cancelled at this stage');
  }

  if (order.status === 'pending_payment') {
    await order.destroy();
    return { refunded: false };
  }

  const payment = order.paymentId ? await Payment.findByPk(order.paymentId) : null;
  const ratio = asCreator ? 1 : 0.9;

  return sequelize.transaction(async (t) => {
    await order.update({ status: 'cancelled', cancelledAt: new Date() }, { transaction: t });
    await Product.increment(
      { stock: order.quantity },
      { where: { id: order.productId }, transaction: t }
    );

    if (!payment || payment.status !== 'captured') {
      return { refunded: false };
    }
    const refundAmount = Math.floor(payment.amountTotal * ratio);
    const provider = getPaymentProvider(payment.provider);
    const ext = await provider.refund({
      paymentIntentId: payment.externalOrderId,
      amountMinor: refundAmount < payment.amountTotal ? refundAmount : undefined,
      reason: 'product_cancel',
    });
    await Refund.create(
      {
        paymentId: payment.id,
        amount: refundAmount,
        status: 'succeeded',
        externalRefundId: ext.externalRefundId,
      },
      { transaction: t }
    );
    await payment.update(
      { status: refundAmount >= payment.amountTotal ? 'refunded_full' : 'refunded_partial' },
      { transaction: t }
    );
    return { refunded: true, refundAmount };
  });
}
