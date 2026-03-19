import bcrypt from 'bcryptjs';
import { User, Creator } from '../models/index.js';
import { signToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';

const SALT = 12;

export async function register({ email, password, name, role }) {
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) throw AppError.conflict('Email already registered');

  const passwordHash = await bcrypt.hash(password, SALT);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    name,
    role: role === 'creator' ? 'creator' : 'buyer',
  });

  if (user.role === 'creator') {
    await Creator.create({
      userId: user.id,
      displayName: name,
    });
  }

  const token = signToken({ sub: user.id, role: user.role });
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
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
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}
