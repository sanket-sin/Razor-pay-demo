import bcrypt from 'bcryptjs';
import { sequelize, User, Creator, Session, Slot, GroupSession, Product } from '../models/index.js';
import { generateSlotIntervals } from '../utils/dateSlots.js';

async function main() {
  await sequelize.authenticate();
  const hash = await bcrypt.hash('Password123!', 12);

  const [creatorUser] = await User.findOrCreate({
    where: { email: 'creator@example.com' },
    defaults: {
      email: 'creator@example.com',
      passwordHash: hash,
      name: 'Demo Creator',
      role: 'creator',
    },
  });
  if (creatorUser.passwordHash !== hash) {
    await creatorUser.update({ passwordHash: hash });
  }

  let creator = await Creator.findOne({ where: { userId: creatorUser.id } });
  if (!creator) {
    creator = await Creator.create({
      userId: creatorUser.id,
      displayName: 'Demo Creator',
      bio: 'Seed creator',
    });
  }

  const [buyer] = await User.findOrCreate({
    where: { email: 'buyer@example.com' },
    defaults: {
      email: 'buyer@example.com',
      passwordHash: hash,
      name: 'Demo Buyer',
      role: 'buyer',
    },
  });
  if (buyer.passwordHash !== hash) await buyer.update({ passwordHash: hash });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);

  const existing = await Session.findOne({ where: { creatorId: creator.id, sessionDate: dateStr } });
  if (!existing) {
    const session = await Session.create({
      creatorId: creator.id,
      title: '1:1 Coaching (seed)',
      sessionDate: dateStr,
      sessionTz: 'UTC',
      windowStartMinute: 14 * 60,
      windowEndMinute: 21 * 60,
      slotDurationMinutes: 30,
      priceAmount: 5000,
      currency: 'usd',
    });
    const intervals = generateSlotIntervals(dateStr, 'UTC', 14 * 60, 21 * 60, 30);
    await Slot.bulkCreate(
      intervals.map((iv) => ({
        sessionId: session.id,
        startUtc: iv.startUtc,
        endUtc: iv.endUtc,
        status: 'available',
      }))
    );
    console.log('Seeded session', session.id);
  }

  const gs = await GroupSession.findOne({ where: { creatorId: creator.id, title: 'Group Bootcamp (seed)' } });
  if (!gs) {
    const end = new Date();
    end.setDate(end.getDate() + 14);
    await GroupSession.create({
      creatorId: creator.id,
      title: 'Group Bootcamp (seed)',
      startDate: dateStr,
      endDate: end.toISOString().slice(0, 10),
      sessionTz: 'UTC',
      dailyStartMinute: 14 * 60,
      dailyEndMinute: 16 * 60,
      maxParticipants: 5,
      priceAmount: 19900,
      currency: 'usd',
    });
    console.log('Seeded group session');
  }

  const prod = await Product.findOne({ where: { creatorId: creator.id, name: 'Seed Jewellery' } });
  if (!prod) {
    await Product.create({
      creatorId: creator.id,
      name: 'Seed Jewellery',
      description: 'Handmade piece',
      priceAmount: 7500,
      currency: 'usd',
      stock: 10,
      deliveryRegions: ['US', 'IN', '*'],
    });
    console.log('Seeded product');
  }

  console.log('Seed done. Login: creator@example.com / buyer@example.com — Password123!');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
