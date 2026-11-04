# RIYASH PAY Ultimate

A personal UPI payment-request web app built with React, Vite and Firebase Authentication + Realtime Database.

## Features
- Firebase email/password admin authentication and UID-protected admin actions
- Persistent, shareable payment request links
- UPI deep-link checkout and downloadable SVG QR code
- Payer UTR submission; receiver manually verifies incoming bank/UPI credit
- Search, status filters, seven-day verified collections chart and CSV export
- Printable / Save-as-PDF receipts for manually verified payments
- English / Tamil interface toggle
- Installable PWA shell with offline app-shell caching (Firebase data still requires internet)
- Responsive mobile-first layout

## Render
- Static Site, branch `main`
- Build: `npm install && npm run build`
- Publish directory: `dist`
- Root directory blank

## Firebase
Uses the existing Firebase project config in `src/firebase.js` and Realtime Database URL.
Realtime Database security rules are in `database.rules.json`. Confirm the admin UID in those rules matches the intended Firebase Authentication user before publishing. Never use open public write rules.

## Payment safety
This is a personal UPI request and record-keeping tool, not a bank or payment gateway. It does not verify incoming payments automatically. A UTR, screenshot or payer statement is not proof of credit. Approve only after independently matching the credit in your own bank/UPI transaction history. Never collect UPI PINs, OTPs, card PINs or bank passwords.

## PWA note
The app shell may load from cache when offline, but live requests, sign-in, payment status and UPI checkout require connectivity. Do not rely on cached data as payment confirmation.
