import { sequelize, Payment, Creator, Order, Product, Refund } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { splitPayment } from '../utils/fees.js';
import { config } from '../config/index.js';
import { getPaymentProvider } from './payment/getProvider.js';
import * as sessionService from './sessionService.js';
import * as groupSessionService from './groupSessionService.js';
import * as orderService from './orderService.js';
import { releaseExpiredSlotLocks } from './slotLockService.js';

function scheduleTransferAt() {
  return new Date(Date.now() + config.creatorPayoutDelayHours * 60 * 60 * 1000);
}

export async function createPaymentOrder({
  userId,
  providerName,
  purpose,
  slotId,
  groupSessionId,
  productId,
  quantity,
  shippingAddress,
  captureLater = false,
}) {
  const provider = getPaymentProvider(providerName);
  const creatorProfile = async (creatorId) => Creator.findByPk(creatorId);

  const buildReturn = (pay, order, extra = {}) => {
    const base = {
      paymentId: pay.id,
      provider: provider.name,
      clientSecret: order.externalClientSecret,
      amountTotal: pay.amountTotal,
      currency: pay.currency,
      platformFee: pay.platformFee,
      creatorAmount: pay.creatorAmount,
      ...extra,
    };
    if (provider.name === 'razorpay') {
      base.orderId = order.externalOrderId;
      base.keyId = config.razorpay.keyId || '';
    }
    return base;
  };

  if (purpose === 'slot') {
    if (!slotId) throw AppError.badRequest('slotId required');
    return sequelize.transaction(async (t) => {
      await releaseExpiredSlotLocks(t);
      const { booking, session } = await sessionService.lockSlotForUser(userId, slotId, t);
      const cr = await creatorProfile(session.creatorId);
      if (!cr) throw AppError.notFound('Creator not found');
      const { platformFee, creatorAmount, amountTotal } = splitPayment(session.priceAmount);
      const pay = await Payment.create(
        {
          provider: provider.name,
          purpose: 'slot',
          userId,
          creatorId: session.creatorId,
          amountTotal,
          platformFee,
          creatorAmount,
          currency: session.currency,
          status: 'pending',
          bookingId: booking.id,
          scheduledTransferAt: scheduleTransferAt(),
        },
        { transaction: t }
      );
      const order = await provider.createOrder({
        amountMinor: amountTotal,
        currency: session.currency,
        paymentId: pay.id,
        description: `Slot: ${session.title}`,
        metadata: { purpose: 'slot', bookingId: booking.id, paymentId: pay.id },
        captureLater,
      });
      await pay.update(
        {
          externalOrderId: order.externalOrderId,
          externalClientSecret: order.externalClientSecret,
        },
        { transaction: t }
      );
      return buildReturn(pay, order, { bookingId: booking.id });
    });
  }

  if (purpose === 'group') {
    if (!groupSessionId) throw AppError.badRequest('groupSessionId required');
    return sequelize.transaction(async (t) => {
      const { groupSession, booking } = await groupSessionService.reserveGroupSeat(
        userId,
        groupSessionId,
        t
      );
      const { platformFee, creatorAmount, amountTotal } = splitPayment(groupSession.priceAmount);
      const pay = await Payment.create(
        {
          provider: provider.name,
          purpose: 'group',
          userId,
          creatorId: groupSession.creatorId,
          amountTotal,
          platformFee,
          creatorAmount,
          currency: groupSession.currency,
          status: 'pending',
          groupBookingId: booking.id,
          scheduledTransferAt: scheduleTransferAt(),
        },
        { transaction: t }
      );
      const order = await provider.createOrder({
        amountMinor: amountTotal,
        currency: groupSession.currency,
        paymentId: pay.id,
        description: `Group: ${groupSession.title}`,
        metadata: { purpose: 'group', groupBookingId: booking.id, paymentId: pay.id },
        captureLater,
      });
      await pay.update(
        {
          externalOrderId: order.externalOrderId,
          externalClientSecret: order.externalClientSecret,
        },
        { transaction: t }
      );
      return buildReturn(pay, order, { groupBookingId: booking.id });
    });
  }

  if (purpose === 'product') {
    if (!productId) throw AppError.badRequest('productId required');
    const qty = Math.max(1, Number(quantity) || 1);
    return sequelize.transaction(async (t) => {
      const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!product) throw AppError.notFound('Product not found');
      if (product.stock < qty) throw AppError.conflict('Insufficient stock');
      const lineTotal = Number(product.priceAmount) * qty;
      const { platformFee, creatorAmount, amountTotal } = splitPayment(lineTotal);
      const order = await Order.create(
        {
          userId,
          productId,
          quantity: qty,
          status: 'pending_payment',
          shippingAddress: shippingAddress || null,
        },
        { transaction: t }
      );
      const pay = await Payment.create(
        {
          provider: provider.name,
          purpose: 'product',
          userId,
          creatorId: product.creatorId,
          amountTotal,
          platformFee,
          creatorAmount,
          currency: product.currency,
          status: 'pending',
          orderId: order.id,
          scheduledTransferAt: scheduleTransferAt(),
        },
        { transaction: t }
      );
      const ext = await provider.createOrder({
        amountMinor: amountTotal,
        currency: product.currency,
        paymentId: pay.id,
        description: `Order ${order.id}`,
        metadata: { purpose: 'product', orderId: order.id, paymentId: pay.id },
        captureLater,
      });
      await pay.update(
        {
          externalOrderId: ext.externalOrderId,
          externalClientSecret: ext.externalClientSecret,
        },
        { transaction: t }
      );
      await order.update({ paymentId: pay.id }, { transaction: t });
      return buildReturn(pay, ext, { orderId: order.id });
    });
  }

  throw AppError.badRequest('Invalid purpose');
}

export async function verifyAndFulfillPayment({
  paymentId,
  paymentIntentId,
  userId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw AppError.notFound('Payment not found');
  if (userId && payment.userId !== userId) throw AppError.forbidden();
  if (payment.status === 'captured') {
    return { alreadyProcessed: true, payment };
  }

  const provider = getPaymentProvider(payment.provider);
  let verified;
  if (payment.provider === 'razorpay') {
    verified = await provider.verifyPayment({
      paymentId,
      razorpayOrderId: razorpayOrderId || payment.externalOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
  } else {
    const piId = paymentIntentId || payment.externalOrderId;
    verified = await provider.verifyPayment({ paymentIntentId: piId });
  }

  if (!verified.success) {
    await handlePaymentFailure(payment);
    throw AppError.badRequest('Payment not completed');
  }

  const captureId = payment.provider === 'razorpay'
    ? (verified.externalPaymentId || payment.externalPaymentId)
    : (paymentIntentId || payment.externalOrderId);
  if (payment.provider === 'razorpay' && verified.needsCapture) {
    await provider.capturePayment({ externalPaymentId: captureId });
  } else if (payment.provider !== 'razorpay') {
    await provider.capturePayment({ paymentIntentId: captureId });
  }

  return sequelize.transaction(async (t) => {
    await payment.reload({ transaction: t, lock: t.LOCK.UPDATE });
    if (payment.status === 'captured') {
      return { success: true, payment };
    }
    await payment.update(
      {
        status: 'captured',
        externalPaymentId: verified.externalPaymentId || payment.externalPaymentId,
      },
      { transaction: t }
    );

    if (payment.purpose === 'slot' && payment.bookingId) {
      await sessionService.confirmSlotBooking(payment.bookingId, payment.id, t);
    } else if (payment.purpose === 'group' && payment.groupBookingId) {
      await groupSessionService.confirmGroupBooking(payment.groupBookingId, payment.id, t);
    } else if (payment.purpose === 'product' && payment.orderId) {
      await orderService.confirmOrder(payment.orderId, payment.id, t);
    }

    return { success: true, payment };
  });
}

async function handlePaymentFailure(payment) {
  const provider = payment.provider;
  try {
    await sequelize.transaction(async (t) => {
      await payment.update({ status: 'failed' }, { transaction: t });
      if (payment.purpose === 'slot' && payment.bookingId) {
        await sessionService.failSlotBooking(payment.bookingId, t);
      } else if (payment.purpose === 'group' && payment.groupBookingId) {
        await groupSessionService.releaseGroupBooking(payment.groupBookingId, t);
      } else if (payment.purpose === 'product' && payment.orderId) {
        await orderService.failOrder(payment.orderId, t);
      }
    });
  } catch (e) {
    console.error('handlePaymentFailure', e);
  }
}

export async function refundPayment({ paymentId, amountMinor, reason, actorUserId }) {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw AppError.notFound('Payment not found');
  if (payment.userId !== actorUserId) {
    const cr = await Creator.findOne({ where: { userId: actorUserId } });
    if (!cr || cr.id !== payment.creatorId) {
      throw AppError.forbidden('Not allowed to refund this payment');
    }
  }
  if (payment.status !== 'captured' && payment.status !== 'refunded_partial') {
    throw AppError.conflict('Payment cannot be refunded');
  }
  const provider = getPaymentProvider(payment.provider);
  const refundAmt = amountMinor != null ? amountMinor : payment.amountTotal;
  const ext = await provider.refund({
    paymentIntentId: payment.externalOrderId,
    externalPaymentId: payment.externalPaymentId,
    amountMinor: refundAmt < payment.amountTotal ? refundAmt : undefined,
    reason: reason || 'api_refund',
  });
  await Refund.create({
    paymentId: payment.id,
    amount: refundAmt,
    reason,
    status: 'succeeded',
    externalRefundId: ext.externalRefundId,
  });
  const newStatus = refundAmt >= payment.amountTotal ? 'refunded_full' : 'refunded_partial';
  await payment.update({ status: newStatus });
  return { refundId: ext.externalRefundId, amount: refundAmt };
}

/** Called from Razorpay webhook when payment.captured — no signature check. */
export async function fulfillPaymentFromWebhook(paymentId, externalPaymentId) {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) return;
  if (payment.status === 'captured') return;
  return sequelize.transaction(async (t) => {
    await payment.reload({ transaction: t, lock: t.LOCK.UPDATE });
    if (payment.status === 'captured') return;
    await payment.update(
      { status: 'captured', externalPaymentId },
      { transaction: t }
    );
    if (payment.purpose === 'slot' && payment.bookingId) {
      await sessionService.confirmSlotBooking(payment.bookingId, payment.id, t);
    } else if (payment.purpose === 'group' && payment.groupBookingId) {
      await groupSessionService.confirmGroupBooking(payment.groupBookingId, payment.id, t);
    } else if (payment.purpose === 'product' && payment.orderId) {
      await orderService.confirmOrder(payment.orderId, payment.id, t);
    }
  });
}

/** Manual capture for Razorpay (Capture Later / freeze payment). */
export async function capturePayment(paymentId, userId) {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw AppError.notFound('Payment not found');
  if (payment.userId !== userId) throw AppError.forbidden();
  if (payment.provider !== 'razorpay') {
    throw AppError.badRequest('Manual capture is only for Razorpay (Capture Later)');
  }
  if (payment.status === 'captured') {
    return { alreadyProcessed: true, payment };
  }
  if (!payment.externalPaymentId) {
    throw AppError.badRequest('Payment has no external payment id yet; complete payment on client first');
  }
  const provider = getPaymentProvider(payment.provider);
  await provider.capturePayment({ externalPaymentId: payment.externalPaymentId });
  return sequelize.transaction(async (t) => {
    await payment.reload({ transaction: t, lock: t.LOCK.UPDATE });
    await payment.update({ status: 'captured' }, { transaction: t });
    if (payment.purpose === 'slot' && payment.bookingId) {
      await sessionService.confirmSlotBooking(payment.bookingId, payment.id, t);
    } else if (payment.purpose === 'group' && payment.groupBookingId) {
      await groupSessionService.confirmGroupBooking(payment.groupBookingId, payment.id, t);
    } else if (payment.purpose === 'product' && payment.orderId) {
      await orderService.confirmOrder(payment.orderId, payment.id, t);
    }
    return { success: true, payment };
  });
}

export { handlePaymentFailure };
