# Razorpay (step 3)

The backend includes a **stub** `RazorpayService` until step 3 is applied.

After step 3, this service will implement:

1. `POST /v1/orders` — create order before payment  
2. Payment signature verification  
3. `POST /v1/payments/{id}/capture`  
4. `POST /v2/accounts` — linked account for creators  
5. `POST /v1/transfers` — payout to creator  
6. `POST /v1/payments/{id}/refund`  
7. Webhooks: `payment.captured`, `payment.failed`, `refund.created`  

Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in `.env`.
