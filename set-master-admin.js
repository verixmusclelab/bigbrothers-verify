/* Run once on a trusted developer machine: node set-master-admin.js FIREBASE_AUTH_UID */
const admin = require('firebase-admin');
const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node set-master-admin.js FIREBASE_AUTH_UID');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'bfc-gym-215ae' });
admin.auth().getUser(uid)
  .then(user => admin.auth().setCustomUserClaims(uid, { ...(user.customClaims || {}), masterAdmin: true }))
  .then(() => { console.log('Master Admin claim assigned to UID:', uid); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
