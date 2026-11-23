/* Trusted Master Admin script: node set-subscription.js GYM_ID 99|199|399|499|999 */
const admin = require('firebase-admin');
const [gymId, amountText] = process.argv.slice(2);
const plans = {
  99: 'First Plan (₹99)',
  199: 'Growth Value Plan (₹199)',
  399: 'Pro Business Plan (₹399)',
  499: 'Advanced Audit Plan (₹499)',
  999: 'Complete Enterprise ERP (₹999)'
};
const amount = Number(amountText);
if (!gymId || !plans[amount]) {
  console.error('Usage: node set-subscription.js GYM_ID 99|199|399|499|999');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: 'bfc-gym-215ae' });
admin.firestore().collection('subscriptions').doc(gymId).set({
  gymId, amount, name: plans[amount], status: 'active', activatedAt: admin.firestore.FieldValue.serverTimestamp(),
  activatedBy: 'masterAdmin'
}, { merge: true })
.then(async () => {
  await admin.firestore().collection('plan_requests').doc(gymId).set({ status: 'approved', approvedAmount: amount, approvedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true }).catch(() => {});
  console.log('Subscription activated:', gymId, plans[amount]);
})
.catch(err => { console.error(err); process.exitCode = 1; });
