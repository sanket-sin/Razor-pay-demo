import { Creator, User } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';
import { RazorpayService } from '../services/payment/razorpayService.js';
import { syncDefaultCreatorCatalogIfNeeded } from '../services/creatorCatalogService.js';

const razorpayService = new RazorpayService();

export const getMe = asyncHandler(async (req, res) => {
  let creator = await Creator.findOne({ where: { userId: req.user.id } });
  if (!creator) throw AppError.notFound('Creator profile not found');

  if (!creator.defaultCatalogSeeded) {
    await syncDefaultCreatorCatalogIfNeeded(creator.id);
    creator = await Creator.findOne({ where: { userId: req.user.id } });
  }

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

/** Returns URL for creator to open Razorpay Route / linked account (create or manage). */
export const getRazorpayConnectUrl = asyncHandler(async (req, res) => {
  const url = config.razorpay?.routeConnectUrl || 'https://dashboard.razorpay.com/app/route';
  res.json({ success: true, data: { url } });
});

/** Create Razorpay Route linked account via API and save `acc_…` on creator profile. */
export const createRazorpayLinkedAccount = asyncHandler(async (req, res) => {
  const creator = await Creator.findOne({ where: { userId: req.user.id } });
  if (!creator) throw AppError.notFound('Creator profile not found');
  if (creator.razorpayLinkedAccountId) {
    throw AppError.conflict('You already have a Razorpay linked account. Remove it first or use “Open Razorpay Route” to finish KYC.');
  }

  const user = await User.findByPk(req.user.id);
  if (!user?.email) throw AppError.badRequest('User email is required for Razorpay');

  const b = req.validated.body;
  const { accountId } = await razorpayService.createRouteLinkedAccount({
    email: user.email,
    phone: b.phone,
    legalBusinessName: b.legalBusinessName,
    businessType: b.businessType,
    contactName: b.contactName,
    customerFacingBusinessName: b.customerFacingBusinessName,
    category: b.category,
    subcategory: b.subcategory,
    businessModel: b.businessModel,
    registeredStreet1: b.registeredStreet1,
    registeredStreet2: b.registeredStreet2,
    city: b.city,
    state: b.state,
    postalCode: b.postalCode,
    country: b.country,
    pan: b.pan,
    gst: b.gst,
    referenceId: b.referenceId || creator.id.replace(/-/g, ''),
  });

  await creator.update({ razorpayLinkedAccountId: accountId });
  res.status(201).json({
    success: true,
    data: {
      id: creator.id,
      razorpayLinkedAccountId: accountId,
      message:
        'Linked account created. Complete stakeholder, product config, and bank details in Razorpay if required for payouts.',
    },
  });
});
