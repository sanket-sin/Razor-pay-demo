import * as productService from '../services/productService.js';
import { Creator } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

async function getCreatorId(userId) {
  const c = await Creator.findOne({ where: { userId } });
  if (!c) throw AppError.forbidden('Creator profile required');
  return c.id;
}

export const createProduct = asyncHandler(async (req, res) => {
  const creatorId = await getCreatorId(req.user.id);
  const p = await productService.createProduct(creatorId, req.validated.body);
  res.status(201).json({ success: true, data: p });
});

export const listProducts = asyncHandler(async (req, res) => {
  const { creatorId, region } = req.validated.query;
  const rows = await productService.listProducts({ creatorId, region });
  res.json({ success: true, data: rows });
});
