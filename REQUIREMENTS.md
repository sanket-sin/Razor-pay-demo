# Creator Platform — Requirements & Flow

## 1. Creator: Connector account (receive payments)

- Creator **creates / links a connector account** (Razorpay Route linked account) so they can receive payouts.
- Payments from users go to platform; after capture and optional hold period, **creator’s share is transferred to this linked account**.
- Implementation: Creator has `razorpayLinkedAccountId` (and Stripe Connect ID). **Create connector:** Creator Dashboard form → `POST /creators/me/razorpay-linked-account` → Razorpay `POST /v2/accounts` (Route); `acc_…` is saved automatically. **Or** paste ID manually / **Open Razorpay Route** for dashboard KYC (stakeholder, product config, bank). Route must be enabled on the merchant account. Payout job uses `transferToCreator` (Razorpay POST /v1/transfers) to send `creatorAmount` to this account.

---

## 2. User sees and books

### Single session (1:1)

- User sees **single sessions** (and optionally **weekly sessions** — multiple dates/slots).
- User **books a slot** → pays via **Razorpay** → that **slot is assigned to the user**.
- One booking = one slot = one payment. If a user has multiple bookings (e.g. 5 slots), each has its own payment; cancelling one = refund for that booking only.

### Group session

- User **books / joins a group session** → pays via **Razorpay** → that **seat is assigned** to the user.
- Other users can join the **same group session** up to the **max participants** set by the creator.
- One group booking = one payment per participant; cancel = refund for that participant’s payment per policy.

### Product

- User **buys a product** → pays via **Razorpay** → order created; product is **delivered** to the user (fulfilment flow).
- One order = one payment; cancel before shipping = refund per policy.

---

## 3. Cancellation & refunds

### User cancels

- **Single slot:** One slot = one booking = one payment. User cancels **one slot** → only that booking’s payment is refunded (full / 50% / 0% by time policy). Other slots (other bookings) are unchanged.
- **Group session:** Refund = **one participant’s cost** for the entire group session (full / 50% / 0% by time policy).
- **Product:** Refund per policy (e.g. 90% buyer when cancelled before shipping).

### Creator cancels

- Creator can cancel **session**, **group session**, or **product order** (e.g. “Cancel as creator”).
- **User gets full refund** when creator cancels.
- **Creator is charged a cancellation fee**: a fee is **deducted from the creator** (e.g. from future payouts). Refund still goes to the user; the platform records the creator’s fee and deducts it when next transferring to that creator.

---

## 4. Current implementation summary

| Requirement                         | Status |
|-------------------------------------|--------|
| Creator connector (Razorpay linked) | Field exists; Dashboard can set/link account (to add/verify). |
| Single session: book slot → Razorpay → slot assigned | Done. |
| Group session: join → Razorpay → seat assigned, max limit | Done. |
| Product: buy → Razorpay → order → delivery | Done (order flow; delivery is fulfilment). |
| User cancel single slot → partial refund for that slot | Done (one booking = one payment; time-based ratio). |
| User cancel group → refund one participant’s cost | Done. |
| User cancel product | Done. |
| Creator cancel → full refund to user | Done (asCreator = full refund). |
| Creator cancellation fee deducted from creator | Fee recorded in `creator_cancellation_fees` when creator cancels. Deduct from creator's next payout using `getUndeductedCancellationFeeTotal(creatorId)` and mark fees as deducted. |

---

## 5. Adding more requirements

- New requirements can be added below or in separate docs; refer to this flow for consistency (connector account, who pays, who gets refund, creator fee on creator-initiated cancel).
