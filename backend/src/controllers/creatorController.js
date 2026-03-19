import { Creator } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getMe = asyncHandler(async (req, res) => {
  const creator = await Creator.findOne({ where: { userId: req.user.id } });
  if (!creator) throw AppError.notFound('Creator profile not found');
  res.json({
    success: true,
    data: {
      id: creator.id,
      displayName: creator.displayName,
      bio: creator.bio,
      razorpayLinkedAccountId: creator.razorpayLinkedAccountId || null,
      stripeConnectAccountId: creator.stripeConnectAccountId || null,
    },
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const creator = await Creator.findOne({ where: { userId: req.user.id } });
  if (!creator) throw AppError.notFound('Creator profile not found');
  const { razorpayLinkedAccountId, stripeConnectAccountId, displayName, bio } = req.validated.body || {};
  const updates = {};
  if (razorpayLinkedAccountId !== undefined) updates.razorpayLinkedAccountId = razorpayLinkedAccountId || null;
  if (stripeConnectAccountId !== undefined) updates.stripeConnectAccountId = stripeConnectAccountId || null;
  if (displayName !== undefined) updates.displayName = displayName;
  if (bio !== undefined) updates.bio = bio;
  await creator.update(updates);
  res.json({
    success: true,
    data: {
      id: creator.id,
      displayName: creator.displayName,
      bio: creator.bio,
      razorpayLinkedAccountId: creator.razorpayLinkedAccountId || null,
      stripeConnectAccountId: creator.stripeConnectAccountId || null,
    },
  });
});
