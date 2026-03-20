import bcrypt from 'bcryptjs';
import { User, Creator, sequelize } from '../models/index.js';
import { signToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';
import { RazorpayService } from './payment/razorpayService.js';

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
      await Creator.create(
        {
          userId: user.id,
          displayName: name,
        },
        { transaction: t }
      );
    }

    if (config.razorpay.keyId && config.razorpay.keySecret) {
      const { customerId } = await razorpayService.createCustomer({
        name: user.name,
        email: user.email,
        notes: { platform_user_id: user.id, role: user.role },
      });
      await user.update({ razorpayCustomerId: customerId }, { transaction: t });
    }

    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
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
