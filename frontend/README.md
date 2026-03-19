# Creator Platform — Frontend

React 18 + Vite + Tailwind + Zustand + Axios. Consumes the backend API under `/api`.

## Setup

```bash
cp .env.example .env
# VITE_API_URL=http://localhost:4000/api  (or rely on Vite proxy — leave default /api)
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
npm install
npm run dev
```

Open **http://localhost:5173**. Run the API on **http://localhost:4000** (Vite proxies `/api` and `/health`).

## Flows

| Page | Role | API |
|------|------|-----|
| Register / Login | — | `POST /auth/*` |
| Creator dashboard & forms | Creator | `POST /sessions`, `/group-sessions`, `/products` |
| Book session | Buyer | `GET /sessions`, `POST /sessions/book-slot` → Stripe |
| Groups | Buyer | `GET /group-sessions`, `POST /group-sessions/join` |
| Shop / Checkout | Buyer | `GET /products`, `POST /orders` → Stripe |
| Orders | Auth | `GET /orders/me` |

After card payment, the app calls `POST /payments/verify` with the PaymentIntent id.

## Structure

- `src/services/` — API clients
- `src/store/` — Zustand (auth + persisted token)
- `src/pages/` — route screens
- `src/components/` — Layout, Stripe modal, UI bits
