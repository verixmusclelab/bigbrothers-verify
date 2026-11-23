OM SOFTWARE ERP — ROLE / TENANT / PLAN ACCESS PATCH

Files in this patch
1. index.html                 Dashboard preview, zero-data defaults, role-aware page/module gate.
2. login.html                 Firebase Owner login plus callable Employee Code / Password / MPIN login from role-specific invite links.
3. plans.html                 Reads the signed-in gym's cloud subscription; sends a pending request only.
4. plan-bridge.js             Existing Upgrade Plan navigation bridge (unchanged).
5. tenant-access.js           Firebase-authenticated owner / manager / staff / Master Admin verification.
6. firestore.rules            Tenant-scoped Firestore rules; default deny; Master Admin custom claim bypass.
7. pay (15) (29).html         Aligns Firebase project, tenant-scopes member queries/writes and local member cache.
8. staff-records.html         Tenant-scopes staff and KYC document reads/writes.
9. set-master-admin.js        One-time trusted script to grant Master Admin custom claim.
10. set-team-role.js           Trusted script to set manager/staff role + gym/branch claims.
11. set-subscription.js       Trusted script to activate a paid subscription after payment verification.
12. team-access-admin.html    Gym Owner screen to create Manager/Staff codes, invite links and reset passwords.
13. functions/index.js        Callable backend for hashed team passwords, Employee Code login, MPIN and owner resets.
14. functions/package.json    Cloud Functions dependencies and Node runtime.
15. master-admin.html         Master Admin console: all gyms, pending plan requests, activate/suspend subscriptions.
16. firebase.json / .firebaserc Firebase project deployment configuration.

IMPORTANT DEPLOYMENT NOTES
- The Master Admin is NOT determined by a browser/localStorage value. The Firebase Auth user must have the custom claim masterAdmin=true.
- Deploy team authentication backend first (region asia-south1):
    cd functions
    npm install
    cd ..
    firebase deploy --only functions
- To assign Master Admin, use a trusted machine with Firebase Admin SDK credentials:
    npm install firebase-admin
    export GOOGLE_APPLICATION_CREDENTIALS=/secure/path/service-account.json
    node set-master-admin.js FIREBASE_AUTH_UID
- Assign a team account only after its Firebase Auth user exists:
    node set-team-role.js FIREBASE_AUTH_UID manager GYM_OWNER_UID 001
    node set-team-role.js FIREBASE_AUTH_UID staff GYM_OWNER_UID 001
- Master Admin can approve requests from master-admin.html, or activate from a trusted machine:
    node set-subscription.js GYM_OWNER_UID 399
  Supported plan amounts: 99, 199, 399, 499, 999.
- Publish firestore.rules in Firebase Console / Firebase CLI only after reviewing the data migration notes below.

DATA MIGRATION REQUIRED BEFORE PUBLISHING STRICT RULES
- Every members, public_members, admissions, attendance, attendance_attempts, ex_members, staff, staff_docs, leaves, complaints and staffatt document must contain the correct gymId.
- The pay portal now reads members with where('gymId','==',currentGymId) and writes tenant-prefixed document IDs. It was aligned to project bfc-gym-215ae; data left in the old brother-s-fitness-club Firebase project must be exported and migrated separately. Old unscoped records will not appear until migrated.
- Existing staff documents must have gymId. Staff docs also need gymId and uid fields. Existing staff-records queries are now gym-scoped.
- Any other writer (admission, staff joining, attendance kiosk, payment receipt, branch uploads) must add gymId to every Firestore record before the new rules are published. Do not leave old permissive rules active in production.
- The current admission.html and some index modules still use browser LocalStorage. This patch does not magically migrate those local-only records to Firestore. Existing unscoped LocalStorage records and older plan docs under default_gym are not automatically imported.
- Manager and Staff accounts are created from team-access-admin.html after Functions are deployed. Employee Code + password login is verified in Cloud Functions; the returned custom token carries role, gymId and branchId. A role string in LocalStorage is not trusted.

PLAN BEHAVIOUR
- Plan cards and feature descriptions remain visible for preview.
- Clicking a plan creates/updates a pending plan_requests document; it does NOT activate a subscription.
- Only Master Admin (or the trusted set-subscription.js script) can write subscriptions/{gymId}.
- A new Gym with no subscription remains in preview mode. Dashboard counters start at zero; only records belonging to that gym may be read.

SECURITY LIMITATION
The HTML gate is a user-interface layer. Firestore Rules are the actual data security boundary. Do not claim tenant isolation is complete until the rules are published, all writers include gymId, and old records are migrated. The rules intentionally deny unscoped legacy documents instead of exposing one gym's data to another.

DEPLOY ORDER (DO NOT SKIP)
1. Upload the website files into the same site root, replacing index.html and login.html and adding tenant-access.js, plans.html, plan-bridge.js, team-access-admin.html, master-admin.html, pay.html and staff-records.html.
2. In the Firebase project bfc-gym-215ae, deploy Cloud Functions first:
     npm install -g firebase-tools   (if needed)
     firebase login
     firebase deploy --only functions
3. Find your Firebase Auth UID in Firebase Console → Authentication → Users. On a trusted machine with Admin SDK credentials, run:
     node set-master-admin.js YOUR_AUTH_UID
   Then log out/in once so the new Master Admin claim refreshes. Open master-admin.html.
4. Master Admin approves plan requests in master-admin.html. Do not mark a plan active before payment is verified.
5. A Gym Owner on ₹499+ can open team-access-admin.html, create Manager/Staff accounts, and send each generated invite link. Manager/Staff sign in only through their role-specific invite URL.
6. Migrate old records so every document has correct gymId and branchId where applicable. The old payment Firebase project was brother-s-fitness-club; this patched portal uses bfc-gym-215ae. Move old data deliberately before expecting it to appear.
7. Only after the migration and all writers have been updated, publish strict Firestore rules:
     firebase deploy --only firestore:rules

NOT DEPLOYED / NOT VERIFIED FROM THIS CHAT
- No Firebase deployment was run. The JavaScript files passed Node syntax checks; Firestore rules were reviewed for balanced structure but not compiled in a Firebase Emulator here.
- Some older admission, attendance, and dashboard modules still store records in browser LocalStorage rather than Firestore. Those modules need a tenant-aware cloud-writer migration before production tenant isolation can be called complete. The UI preview gate is not a replacement for Firestore Rules.
- Strict rules will intentionally reject legacy documents without gymId (and branchId for branch-restricted manager access). Back up and migrate first; do not simply publish rules against old unscoped data.
