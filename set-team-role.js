/* Trusted admin script: node set-team-role.js FIREBASE_UID manager GYM_ID BRANCH_ID */
const admin = require('firebase-admin');
const [uid, role, gymId, branchId = ''] = process.argv.slice(2);
if (!uid || !['manager', 'staff'].includes(String(role).toLowerCase()) || !gymId || !branchId) {
  console.error('Usage: node set-team-role.js FIREBASE_UID manager|staff GYM_ID BRANCH_ID');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'bfc-gym-215ae' });
admin.auth().getUser(uid)
  .then(user => admin.auth().setCustomUserClaims(uid, { ...(user.customClaims || {}), role: String(role).toLowerCase(), gymId, branchId }))
  .then(() => console.log('Verified team role assigned:', role, 'Gym:', gymId, 'Branch:', branchId))
  .catch(err => { console.error(err); process.exitCode = 1; });
