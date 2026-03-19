import { sequelize, Order, Product } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { decrementStock } from './productService.js';

export async function createOrderPending(userId, { productId, quantity, shippingAddress }) {
  const qty = Math.max(1, Number(quantity) || 1);
  return sequelize.transaction(async (t) => {
    const product = await Product.findByPk(productId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!product) throw AppError.notFound('Product not found');
    if (product.stock < qty) throw AppError.conflict('Insufficient stock');

    return Order.create(
      {
        userId,
        productId,
        quantity: qty,
        status: 'pending_payment',
        shippingAddress: shippingAddress || null,
      },
      { transaction: t }
    );
  });
}

export async function confirmOrder(orderId, paymentId, transaction) {
  const order = await Order.findByPk(orderId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!order || order.status !== 'pending_payment') throw AppError.conflict('Invalid order');
  await decrementStock(order.productId, order.quantity, transaction);
  await order.update({ status: 'paid', paymentId }, { transaction });
}

export async function failOrder(orderId, transaction) {
  const order = await Order.findByPk(orderId, { transaction });
  if (order && order.status === 'pending_payment') {
    await order.destroy({ transaction });
  }
}

