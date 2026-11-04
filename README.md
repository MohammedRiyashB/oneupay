# RIYASH PAY — Render Edition

Personal UPI payment-request app built with React, Vite and Firebase.

## Render deployment

This repository contains the extracted application source at its root. **Do not unzip an archive during the Render build.**

- Service type: Static Site
- Branch: main
- Root directory: leave blank
- Build command: `npm install && npm run build`
- Publish directory: `dist`

The root `render.yaml` contains the same Blueprint configuration. In Render, use **Manual Sync** to sync the Blueprint, then deploy the static site.

## Firebase setup required

1. Create a Firebase project and add a Web App.
2. Enable Authentication → Email/Password.
3. Create a Cloud Firestore database.
4. Copy the Firebase Web App config into `src/firebase.js`, replacing the placeholder values.
5. Create your own admin account in the app.
6. Copy that account's Firebase Authentication UID.
7. Replace `REPLACE_WITH_YOUR_ADMIN_UID` in `firestore.rules` with the UID and publish those rules in Firebase Console → Firestore Database → Rules.

Do not leave the admin UID placeholder in the rules: admin actions will be denied. Secure account creation after creating your own account; do not share the admin password.

## How it works

1. Admin signs in and creates a payment request (default ₹349).
2. Share the unique request link with the payer.
3. Payer opens the link, pays using their UPI app, and submits the UPI transaction reference (UTR).
4. Admin checks their own bank/UPI app and manually approves only after the matching money is actually credited.

## Important payment limitation

This app does **not** connect to your bank and does **not** automatically verify incoming payments. A submitted UTR, screenshot or success screen is only a claim—not proof of credit. Approve only after confirming the matching credit in your own bank/UPI transaction history.

Never collect a UPI PIN, OTP, card PIN, bank password or other banking credentials. Do not store sensitive personal data in public payment-request documents.
