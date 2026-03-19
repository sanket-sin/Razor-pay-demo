import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as sessionController from '../controllers/sessionController.js';
import * as groupSessionController from '../controllers/groupSessionController.js';
import * as productController from '../controllers/productController.js';
import * as orderController from '../controllers/orderController.js';
import * as paymentController from '../controllers/paymentController.js';
import * as cancellationController from '../controllers/cancellationController.js';

const router = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50, standardHeaders: true });

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(255),
  role: z.enum(['creator', 'buyer']).optional(),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/auth/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/auth/login', authLimiter, validateBody(loginSchema), authController.login);

const sessionCreateSchema = z.object({
  title: z.string().min(1).max(500),
  sessionDate: z.string(),
  sessionTz: z.string().min(1).max(64).default('UTC'),
  windowStartMinute: z.number().int().min(0).max(1439),
  windowEndMinute: z.number().int().min(1).max(1440),
  slotDurationMinutes: z.number().int().min(5).max(480),
  priceAmount: z.number().int().positive(),
  currency: z.string().length(3).optional(),
});

router.post(
  '/sessions',
  authenticate,
  requireRole('creator'),
  validateBody(sessionCreateSchema),
  sessionController.createSession
);

router.get(
  '/sessions',
  validateQuery(
    z.object({
      creatorId: z.string().uuid().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
    })
  ),
  sessionController.listSessions
);

const bookSlotSchema = z.object({
  slotId: z.string().uuid(),
  provider: z.enum(['stripe', 'razorpay']).optional(),
});

router.post(
  '/sessions/book-slot',
  authenticate,
  requireRole('buyer'),
  validateBody(bookSlotSchema),
  sessionController.bookSlot
);

const groupCreateSchema = z.object({
  title: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  sessionTz: z.string().optional(),
  dailyStartMinute: z.number().int().min(0).max(1439),
  dailyEndMinute: z.number().int().min(1).max(1440),
  maxParticipants: z.number().int().min(1).max(10000),
  priceAmount: z.number().int().positive(),
  currency: z.string().length(3).optional(),
});

router.post(
  '/group-sessions',
  authenticate,
  requireRole('creator'),
  validateBody(groupCreateSchema),
  groupSessionController.createGroupSession
);

router.get(
  '/group-sessions',
  validateQuery(z.object({ creatorId: z.string().uuid().optional() })),
  groupSessionController.listGroupSessions
);

router.post(
  '/group-sessions/join',
  authenticate,
  requireRole('buyer'),
  validateBody(
    z.object({
      groupSessionId: z.string().uuid(),
      provider: z.enum(['stripe', 'razorpay']).optional(),
    })
  ),
  groupSessionController.joinGroupSession
);

const productCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priceAmount: z.number().int().positive(),
  currency: z.string().length(3).optional(),
  stock: z.number().int().min(0),
  deliveryRegions: z.array(z.string()).min(1),
  imageUrl: z.string().max(2048).optional(),
});

router.post(
  '/products',
  authenticate,
  requireRole('creator'),
  validateBody(productCreateSchema),
  productController.createProduct
);

router.get(
  '/products',
  validateQuery(
    z.object({
      creatorId: z.string().uuid().optional(),
      region: z.string().optional(),
    })
  ),
  productController.listProducts
);

router.post(
  '/orders',
  authenticate,
  requireRole('buyer'),
  validateBody(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1).optional(),
      shippingAddress: z.record(z.unknown()).optional(),
      provider: z.enum(['stripe', 'razorpay']).optional(),
    })
  ),
  orderController.createOrder
);

router.get('/orders/me', authenticate, orderController.listMyOrders);

const paymentCreateSchema = z.object({
  provider: z.enum(['stripe', 'razorpay']).optional(),
  purpose: z.enum(['slot', 'group', 'product']),
  slotId: z.string().uuid().optional(),
  groupSessionId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  quantity: z.number().int().min(1).optional(),
  shippingAddress: z.record(z.unknown()).optional(),
});

router.post(
  '/payments/create-order',
  authenticate,
  requireRole('buyer'),
  validateBody(paymentCreateSchema),
  paymentController.createOrder
);

router.post(
  '/payments/verify',
  authenticate,
  validateBody(
    z.object({
      paymentId: z.string().uuid(),
      paymentIntentId: z.string().optional(),
    })
  ),
  paymentController.verify
);

router.post(
  '/payments/refund',
  authenticate,
  validateBody(
    z.object({
      paymentId: z.string().uuid(),
      amount: z.number().int().positive().optional(),
      reason: z.string().optional(),
    })
  ),
  paymentController.refund
);

router.post(
  '/cancellations/session-booking',
  authenticate,
  validateBody(
    z.object({
      bookingId: z.string().uuid(),
      asCreator: z.boolean().optional(),
    })
  ),
  cancellationController.cancelSessionBooking
);

router.post(
  '/cancellations/group-booking',
  authenticate,
  validateBody(
    z.object({
      groupBookingId: z.string().uuid(),
      asCreator: z.boolean().optional(),
    })
  ),
  cancellationController.cancelGroupBooking
);

router.post(
  '/cancellations/order',
  authenticate,
  validateBody(
    z.object({
      orderId: z.string().uuid(),
      asCreator: z.boolean().optional(),
    })
  ),
  cancellationController.cancelOrder
);

export default router;
