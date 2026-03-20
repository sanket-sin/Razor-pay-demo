import bcrypt from 'bcryptjs';
import { User, Creator, sequelize } from '../models/index.js';
import { signToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';
import { RazorpayService } from './payment/razorpayService.js';
import { seedDefaultCreatorCatalog, syncDefaultCreatorCatalogIfNeeded } from './creatorCatalogService.js';

const SALT = 12;
const razorpayService = new RazorpayService();

export async function register({ email, password, name, role }) {
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) throw AppError.conflict('Email already registered');

  const passwordHash = await bcrypt.hash(password, SALT);
  const userRole = role === 'creator' ? 'creator' : 'buyer';

  const t = await sequelize.transaction();
  let user;
  try {
    user = await User.create(
      {
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: userRole,
      },
      { transaction: t }
    );

    if (user.role === 'creator') {
      const creator = await Creator.create(
        {
          userId: user.id,
          displayName: name,
        },
        { transaction: t }
      );
      await seedDefaultCreatorCatalog(creator.id, { displayName: name }, t);
      await creator.update({ defaultCatalogSeeded: true }, { transaction: t });
    }

    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }

  if (config.razorpay.keyId && config.razorpay.keySecret) {
    try {
      const { customerId } = await razorpayService.createCustomer({
        name: user.name,
        email: user.email,
        notes: { platform_user_id: user.id, role: user.role },
      });
      await user.update({ razorpayCustomerId: customerId });
      await user.reload();
    } catch (e) {
      console.error('[auth] Razorpay customer create failed after signup (account exists; catalog saved)', e);
    }
  }

  const token = signToken({ sub: user.id, role: user.role });
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.razorpayCustomerId && { razorpayCustomerId: user.razorpayCustomerId }),
    },
    token,
  };
}

export async function login({ email, password }) {
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) throw AppError.unauthorized('Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw AppError.unauthorized('Invalid credentials');

  if (user.role === 'creator') {
    const cr = await Creator.findOne({ where: { userId: user.id } });
    if (cr && !cr.defaultCatalogSeeded) {
      try {
        await syncDefaultCreatorCatalogIfNeeded(cr.id);
      } catch (e) {
        console.error('[auth] syncDefaultCreatorCatalogIfNeeded on login failed', e);
      }
    }
  }

  const token = signToken({ sub: user.id, role: user.role });
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ...(user.razorpayCustomerId && { razorpayCustomerId: user.razorpayCustomerId }),
    },
    token,
  };
}
