# OneUPay gateway implementation plan

## Product model
OneUPay should initially operate as a merchant-facing payment technology platform. It can own the UI, merchant workspace, payment-link lifecycle, transaction experience, developer API and reporting. Actual payment execution, settlement and regulated fund handling must remain with an authorised/acquiring payment partner until OneUPay has applicable authorisation and operational controls.

## Stage 0 — preview (current branch)
- Public account signup and login.
- Strict per-UID workspaces and Firebase security rules.
- Merchant-specific manual UPI payment links only.
- UTR claim is not a payment confirmation.
- Checkout sessions and provider webhooks fail closed with HTTP 503.
- Legacy paymentRequests remain read-compatible and are not migrated or deleted.

## Stage 1 — partner and legal readiness
1. Decide whether OneUPay is a technology/payment-gateway layer or seeks Payment Aggregator activity. Do not blur these roles.
2. Confirm the operating legal entity and obtain PAN, bank account, tax registrations as applicable, registered/principal address, beneficial ownership and governance details.
3. Contact authorised payment aggregators/acquiring banks and apply for the relevant platform/technology/partner programme. Request written confirmation for multi-merchant onboarding, connected merchant accounts, hosted checkout, refunds, settlements and webhook/API scopes.
4. Obtain partner legal/compliance approval for product scope, merchant onboarding, KYC/KYB, risk rules, pricing, support, complaints, marketing and data flows.
5. Create a merchant prohibited-business policy, underwriting workflow and audit trail.

## Stage 2 — server-side provider adapter
- Build a backend-only provider interface: createOrder, createCheckoutSession, fetchPayment, refund, verifyWebhook and reconcileSettlement.
- Store provider API keys only in Render secret environment variables / managed secrets. Never send secrets to React, Firebase client config, logs or browser responses.
- Use provider-hosted checkout or its approved tokenisation approach. Do not collect or proxy raw card PAN/CVV.
- Bind every provider order to OneUPay merchant UID, provider sub-merchant/account ID, order ID, amount in paise, INR currency and an idempotency key.
- Store a server-created payment order as created; never trust the browser's success callback as proof.
- Verify webhook signatures against the exact raw request body. Enforce timestamps, replay protection, event-ID uniqueness and idempotent processing.
- Only a verified provider event or server-side provider API fetch may transition a payment to captured/paid. Match order ID, payment ID, merchant account, amount, currency and final provider status.
- Preserve immutable event logs and reconcile provider settlements, refunds, disputes and chargebacks.
- If the partner supports connected merchant accounts/platform APIs, use merchant-scoped IDs and permissions; do not receive every merchant's funds into one personal UPI ID or bank account.

## Stage 3 — payment products
- UPI intent, QR and collect only where provider/acquirer supports and approves.
- Cards and wallets through partner-hosted or partner-tokenised checkout.
- Net banking, payment links, invoices and customer records.
- Refunds, partial refunds, disputes, settlement reports, fees/taxes and webhooks.

## Stage 4 — production controls
- Legal entity and contractual disclosures; public business address and grievance/support contact.
- Merchant risk and KYB, prohibited-business screening, velocity controls, fraud operations and escalation.
- Security threat model, dependency scanning, secret scanning, independent VAPT/penetration test, access logging, backups, disaster recovery and incident plan.
- Privacy notice with itemised purposes, processors, data retention, user requests/rights and breach process; legal review under Indian DPDP law.
- Accessibility, performance, observability, operational SLOs, customer support, rollback and incident drills.

## Current implementation boundary
The Express API in this repository only exposes /api/health, /api/gateway/status, a fail-closed /api/payment-sessions endpoint and a disabled webhook placeholder. It does not move money and does not create provider orders. Keep live payment UI hidden until the chosen provider's commercial/technical approval and end-to-end sandbox tests are complete.