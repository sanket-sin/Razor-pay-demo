# Creator Platform API

Base URL: `http://localhost:4000/api` (configurable via `PORT`).

All JSON responses: `{ success: boolean, data?: ..., error?: { message, code, details } }`.

## Auth

| Method | Path | Body | Auth |
|--------|------|------|------|
| POST | `/auth/register` | `email`, `password` (min 8), `name`, `role?` (`creator` \| `buyer`) | No |
| POST | `/auth/login` | `email`, `password` | No |

Returns `{ user, token }`. Use header: `Authorization: Bearer <token>`.

## Sessions (individual)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/sessions` | Creator | Create session + auto-generate slots |
| GET | `/sessions` | No | Query: `creatorId?`, `fromDate?`, `toDate?` |
| POST | `/sessions/book-slot` | Buyer | Body: `slotId`, `provider?` (`stripe` \| `razorpay`) — locks slot, returns payment client payload |

**Create session body:** `title`, `sessionDate` (YYYY-MM-DD), `sessionTz` (IANA), `windowStartMinute`, `windowEndMinute`, `slotDurationMinutes`, `priceAmount` (minor units), `currency?`.

## Group sessions

| Method | Path | Auth |
|--------|------|------|
| POST | `/group-sessions` | Creator |
| GET | `/group-sessions` | No | `creatorId?` |
| POST | `/group-sessions/join` | Buyer | `groupSessionId`, `provider?` |

## Products & orders

| Method | Path | Auth |
|--------|------|------|
| POST | `/products` | Creator |
| GET | `/products` | No | `creatorId?`, `region?` |
| POST | `/orders` | Buyer | `productId`, `quantity?`, `shippingAddress?`, `provider?` |
| GET | `/orders/me` | Buyer | List my orders |

## Payments

| Method | Path | Auth | Body |
|--------|------|------|------|
| POST | `/payments/create-order` | Buyer | `purpose`: `slot` \| `group` \| `product` + ids per purpose |
| POST | `/payments/verify` | Yes | `paymentId`, `paymentIntentId?` (Stripe PI id) |
| POST | `/payments/refund` | User/creator on payment | `paymentId`, `amount?` (partial), `reason?` |

**Stripe flow:** After `create-order`, use `clientSecret` with Stripe.js; on success call `/payments/verify` with `paymentId` and `paymentIntentId`.

## Cancellations

| Method | Path | Body |
|--------|------|------|
| POST | `/cancellations/session-booking` | `bookingId`, `asCreator?` |
| POST | `/cancellations/group-booking` | `groupBookingId`, `asCreator?` |
| POST | `/cancellations/order` | `orderId`, `asCreator?` |

## Webhooks (no `/api` prefix)

- `POST /webhooks/stripe` — raw body, Stripe signature
- `POST /webhooks/razorpay` — step 3

## Health

`GET /health`

---

Razorpay provider is wired in **step 3**; until then use `provider: "stripe"` (default).
