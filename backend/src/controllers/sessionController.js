import * as sessionService from '../services/sessionService.js';
import * as paymentFlow from '../services/paymentFlowService.js';
import { Creator } from '../models/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

async function getCreatorId(userId) {
  const c = await Creator.findOne({ where: { userId } });
  if (!c) throw AppError.forbidden('Creator profile required');
  return c.id;
}

export const createSession = asyncHandler(async (req, res) => {
  const creatorId = await getCreatorId(req.user.id);
  const session = await sessionService.createSession(creatorId, req.validated.body);
  const full = await sessionService.getSessionById(session.id);
  res.status(201).json({ success: true, data: full });
});

export const listSessions = asyncHandler(async (req, res) => {
  const { creatorId, fromDate, toDate } = req.validated.query;
  const rows = await sessionService.listSessions({ creatorId, fromDate, toDate });
  res.json({ success: true, data: rows });
});

export const bookSlot = asyncHandler(async (req, res) => {
  const { slotId, provider } = req.validated.body;
  const result = await paymentFlow.createPaymentOrder({
    userId: req.user.id,
    providerName: provider,
    purpose: 'slot',
    slotId,
  });
  res.status(201).json({ success: true, data: result });
});
