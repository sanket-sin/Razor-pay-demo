# Creator Platform — Backend

Express + Sequelize + MySQL. JWT auth, session/group/product flows, payment abstraction (Stripe live path; Razorpay in step 3).

## Setup

1. Create MySQL database and import `../database/schema.sql` (phpMyAdmin) **or** run sync (dev only):

   ```bash
   cp .env.example .env
   # edit DB_* and JWT_SECRET, STRIPE_*
   npm install
   DB_SYNC_ALTER=true node src/scripts/syncDb.js   # optional; prefer schema.sql in prod
   npm run seed
   npm run dev
   ```

2. API: `http://localhost:4000` — routes under `/api`. See `../docs/API.md`.

3. Stripe webhooks: point to `POST /webhooks/stripe` (raw body). Events: `payment_intent.succeeded`, `payment_intent.payment_failed`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Nodemon |
| `npm start` | Production |
| `npm run seed` | Sample users + session/product |
| `npm test` | Jest unit tests |

## Structure

- `src/controllers/` — HTTP layer  
- `src/services/` — business logic + `payment/` providers  
- `src/models/` — Sequelize  
- `src/routes/` — routes + Zod validation  
- `src/middleware/` — auth, errors  

## Security notes

- Use strong `JWT_SECRET` in production (`assertProductionSecrets`).
- Refund endpoint: payer or owning creator only.
- Rate limit on auth routes.
