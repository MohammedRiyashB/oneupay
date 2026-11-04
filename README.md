# OneUPay

OneUPay is an early-stage merchant-workspace and payment-link product initiative under BMR Inc., founded by Mohammed Riyash B. This repository contains a public multi-user preview, not a live payment gateway.

## Current preview features
- Original OneUPay branding and responsive animated landing page.
- Open Firebase email/password signup and login.
- UID-isolated merchant profiles, payment links and payer claims.
- Merchant-created UPI QR / intent links using each merchant's own UPI ID.
- Public hosted payment-link page and payer-submitted UTR claims.
- Merchant-controlled manual verification, transaction history, CSV export and analytics.
- About, Terms, Privacy, Security, Acceptable Use, Payment Disclosure and developer preview pages.
- Legacy ?request=<id> reads from the existing paymentRequests path are retained; legacy records are not migrated or deleted.
- Installable PWA shell. Offline cache never stores /api/ responses or Firebase payment data.

## Current payment capability: preview only
The preview does not accept card, wallet, net-banking or automatically verified UPI payments. A UTR, message or screenshot is an unverified payer claim. A merchant must check their own bank / UPI app before manually marking a payment as received. OneUPay does not hold, pool, escrow or settle funds.

No provider credentials are present in the repository. The Node service exposes health and gateway-readiness endpoints only; checkout-session creation remains disabled until a lawful provider integration is implemented and approved.

## Gateway strategy
The intended initial model is a payment-technology platform connected to an authorised payment provider, not OneUPay acting as an unauthorised Payment Aggregator. RBI's consolidated Payment Aggregator Directions, 2025 were issued on 15 September 2025. Payment Aggregator activity involving merchant onboarding, handling or settlement of funds requires a compliant authorised arrangement. Payment Gateway technology and Payment Aggregator fund-handling are different roles. Review the current RBI directions, NPCI UPI merchant/acquirer requirements and provider partnership terms before any live rollout.

A Razorpay-style partner/API route is not automatically available to every developer account. Provider partner access and platform/onboarding APIs may require an approved partner relationship, agreements and merchant due diligence. OneUPay must never represent itself as approved or authorised before that actually occurs.

## Architecture
- Frontend: React, Vite, Framer Motion, Lucide and QRCode React.
- Auth/data: Firebase Authentication + Realtime Database.
- API shell: Express on Node.js, served with the Vite build by Render.
- Future provider adapter: server-side only, with credentials in managed secrets, idempotency, signature-verified webhooks and reconciliation.
- Database ownership: oneupayProfiles/{uid}, oneupayLinks/{uid}/{linkId}, oneupayClaims/{uid}/{linkId}/{claimId}. Minimal public checkout view: oneupayPublicLinks/{linkId}.
- Legacy path paymentRequests remains intact for older personal request links.

## Local development
Run npm install, then npm run dev.
Build and run the combined web service with npm run build, then npm start.

## Render
Use a Node web service with build command npm install && npm run build and start command npm start. Health check: /api/health. Do not add provider secrets until a provider integration and approval are actually in place.

The Render service type changes from Static Site to Node Web Service. Check the existing Render dashboard configuration before changing or replacing the service so the production URL and settings are not accidentally lost.

## Firebase setup
1. Deploy database.rules.json to the existing airseeds Realtime Database after reviewing the rules in Firebase.
2. Enable Email/Password Authentication.
3. Test signup with two distinct accounts and confirm each account only reads its own workspace.
4. Keep the existing Firebase project and paymentRequests subtree. Never replace the database with a blank instance.
5. Configure Firebase authorized domains for the final OneUPay domain.

## Production checklist before public payments
- Confirm the operating legal entity, incorporation status, business address, tax details, support and grievance contact.
- Get written approval / agreement from an authorised payment provider or relevant RBI authorisation for any regulated activity.
- Complete merchant KYC/KYB, prohibited-business screening, settlement/refund/dispute workflows, fees/taxes and reconciliation.
- Implement server-created payment orders/sessions, provider-hosted/tokenised checkout, idempotency keys, signature-verified webhooks, replay protection and server-only state transitions.
- Complete threat modelling, privacy impact assessment, penetration testing, security monitoring, backups, incident response and access reviews.
- Finalise and legally review Terms, Privacy Notice, retention schedule, grievance process and data-principal rights workflow under applicable Indian data-protection law.

## Security and privacy
Never collect UPI PINs, OTPs, CVVs, card PINs, bank passwords or other authentication secrets. Never store raw card credentials. Browser clients must never hold payment-provider secret keys. Never set a transaction to paid based only on a client message, UTR, receipt image or query-string parameter.