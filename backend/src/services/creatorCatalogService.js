import { Product, Creator, sequelize } from '../models/index.js';
import { config } from '../config/index.js';
import * as sessionService from './sessionService.js';

function isoDatePlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * One default 1:1 session + one default product for a new creator (visible on /browse for buyers).
 */
export async function seedDefaultCreatorCatalog(creatorId, { displayName }, transaction) {
  const useInr = String(config.defaultPaymentProvider || '').toLowerCase() === 'razorpay';
  const currency = useInr ? 'inr' : 'usd';
  const tz = useInr ? 'Asia/Kolkata' : 'UTC';
  const label = (displayName || 'Creator').trim().slice(0, 80);

  await sessionService.createSession(
    creatorId,
    {
      title: `1:1 session — ${label}`,
      sessionDate: isoDatePlusDays(2),
      sessionTz: tz,
      windowStartMinute: 10 * 60,
      windowEndMinute: 17 * 60,
      slotDurationMinutes: 30,
      priceAmount: useInr ? 15000 : 1500,
      currency,
    },
    { transaction }
  );

  await Product.create(
    {
      creatorId,
      name: 'Starter product',
      description: 'Default listing for new creators — buyers can purchase with one-time checkout.',
      priceAmount: useInr ? 29900 : 2999,
      currency,
      stock: 100,
      deliveryRegions: ['*'],
    },
    { transaction }
  );
}

/** One-time default session + product for creators who never got catalog (e.g. old signup or API not restarted). */
export async function syncDefaultCreatorCatalogIfNeeded(creatorId) {
  await sequelize.transaction(async (t) => {
    const row = await Creator.findByPk(creatorId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!row || row.defaultCatalogSeeded) return;
    await seedDefaultCreatorCatalog(row.id, { displayName: row.displayName }, t);
    await row.update({ defaultCatalogSeeded: true }, { transaction: t });
  });
}
