import * as paymentFlow from '../services/paymentFlowService.js';
import { Order, Product } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { productId, quantity, shippingAddress, provider } = req.validated.body;
  const result = await paymentFlow.createPaymentOrder({
    userId: req.user.id,
    providerName: provider,
    purpose: 'product',
    productId,
    quantity,
    shippingAddress,
  });
  res.status(201).json({ success: true, data: result });
});

export const listMyOrders = asyncHandler(async (req, res) => {
  const rows = await Order.findAll({
    where: { userId: req.user.id },
    include: [{ model: Product, as: 'product' }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: rows });
});
