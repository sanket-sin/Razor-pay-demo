import { sequelize, Product, Creator } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

export async function createProduct(creatorId, payload) {
  const { name, description, priceAmount, currency, stock, deliveryRegions, imageUrl } = payload;
  return Product.create({
    creatorId,
    name,
    description,
    priceAmount,
    currency: (currency || 'usd').toLowerCase(),
    stock,
    deliveryRegions: Array.isArray(deliveryRegions) ? deliveryRegions : [],
    imageUrl,
  });
}

export async function listProducts({ creatorId, region }) {
  const where = {};
  if (creatorId) where.creatorId = creatorId;
  const products = await Product.findAll({
    where,
    include: [{ model: Creator, as: 'creator' }],
    order: [['createdAt', 'DESC']],
  });
  if (!region) return products;
  return products.filter((p) => {
    const regions = p.deliveryRegions || [];
    return regions.length === 0 || regions.includes(region) || regions.includes('*');
  });
}

export async function getProductForUpdate(productId, transaction) {
  return Product.findByPk(productId, { transaction, lock: transaction.LOCK.UPDATE });
}

export async function decrementStock(productId, qty, transaction) {
  const p = await Product.findByPk(productId, { transaction, lock: transaction.LOCK.UPDATE });
  if (!p) throw AppError.notFound('Product not found');
  if (p.stock < qty) throw AppError.conflict('Insufficient stock');
  await p.update({ stock: p.stock - qty }, { transaction });
  return p;
}
