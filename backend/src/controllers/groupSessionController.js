import * as groupSessionService from '../services/groupSessionService.js';
import * as paymentFlow from '../services/paymentFlowService.js';
import { Creator } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

async function getCreatorId(userId) {
  const c = await Creator.findOne({ where: { userId } });
  if (!c) throw AppError.forbidden('Creator profile required');
  return c.id;
}

export const createGroupSession = asyncHandler(async (req, res) => {
  const creatorId = await getCreatorId(req.user.id);
  const gs = await groupSessionService.createGroupSession(creatorId, req.validated.body);
  res.status(201).json({ success: true, data: gs });
});

export const joinGroupSession = asyncHandler(async (req, res) => {
  const { groupSessionId, provider } = req.validated.body;
  const result = await paymentFlow.createPaymentOrder({
    userId: req.user.id,
    providerName: provider,
    purpose: 'group',
    groupSessionId,
  });
  res.status(201).json({ success: true, data: result });
});

export const listGroupSessions = asyncHandler(async (req, res) => {
  const creatorId = req.query.creatorId;
  const rows = await groupSessionService.listGroupSessions({ creatorId });
  res.json({ success: true, data: rows });
});
