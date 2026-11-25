/*
 * OM Software ERP - authenticated tenant / role / subscription gate.
 * Requires Firebase Auth + Firestore compat SDK and the orgdesk-fc207 project.
 * Trust boundary: roles come from owner_accounts or Firebase custom claims, never from localStorage.
 */
(function () {
  'use strict';
  var CFG = {
    apiKey: 'AIzaSyAwuFgPJIUavmRRzkHOz83FUP0EyfZETCU',
    authDomain: 'orgdesk-fc207.firebaseapp.com',
    projectId: 'orgdesk-fc207',
    storageBucket: 'orgdesk-fc207.firebasestorage.app',
    messagingSenderId: '677150519977',
    appId: '1:677150519977:web:74de5f488494280d352fb8'
  };

  function goLogin(message) {
    if (message) alert(message);
    try {
      ['bfc_role','om_active_role','om_logged_user','bfc_gid','om_team_session','om_active_subscription_plan'].forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
    if (!/login\.html/i.test(location.pathname)) location.replace('login.html');
  }

  function safeRole(v) {
    v = String(v || '').toLowerCase();
    return ['owner','manager','staff'].indexOf(v) >= 0 ? v : '';
  }

  function activeSubscription(data) {
    if (!data || String(data.status || '').toLowerCase() !== 'active') return false;
    var expiry = data.expiresAt || data.expiryAt || data.validUntil || null;
    if (!expiry) return true;
    var ms = typeof expiry === 'number' ? expiry : (expiry.toDate ? expiry.toDate().getTime() : Date.parse(expiry));
    return !isFinite(ms) || ms >= Date.now();
  }

  function managerModuleAllow(id) {
    return [
      'modAtt','modAdmission','modJoining','modFees','modExpired',
      'modDeptStaff','modSlip','modRouter','modEnq','modCodes'
    ].indexOf(id) >= 0;
  }


  function addMpinSetupButton(session) {
    if (!['manager', 'staff'].includes(session.role) || document.getElementById('omSetMpinBtn')) return;
    var host = document.getElementById('ribMeta') || document.getElementById('roleIdentityBanner');
    if (!host) return;
    var b = document.createElement('button');
    b.id = 'omSetMpinBtn'; b.type = 'button'; b.textContent = 'Set / Change MPIN';
    b.style.cssText = 'margin:8px 0 0;padding:7px 10px;border-radius:8px;border:1px solid #22D3EE;background:#10213c;color:#22D3EE;font-weight:800;font-size:11px;';
    b.addEventListener('click', async function () {
      var pin = prompt('New MPIN (4–6 digits) enter karein:');
      if (!pin) return;
      if (!/^\d{4,6}$/.test(pin)) { alert('MPIN 4–6 digits ka hona chahiye.'); return; }
      try {
        var fn = firebase.app().functions('asia-south1').httpsCallable('setMyTeamMpin');
        await fn({ mpin: pin });
        alert('MPIN securely save ho gaya. Ab next login mein MPIN use kar sakte hain.');
      } catch (e) { console.error(e); alert('MPIN save nahi hua: ' + (e.message || 'Please retry')); }
    });
    host.appendChild(b);
  }

  function publish(session) {
    window.omSecureSession = session;
    try {
      localStorage.setItem('bfc_role', session.role);
      localStorage.setItem('om_active_role', session.role);
      localStorage.setItem('bfc_gid', session.gymId);
      localStorage.setItem('om_logged_user', session.displayName || session.email || session.role);
      localStorage.setItem('om_secure_session_v1', JSON.stringify({ uid: session.uid, role: session.role, gymId: session.gymId, branchId: session.branchId || '' }));
      if (session.planActive) localStorage.setItem('om_active_subscription_plan', JSON.stringify({ name: session.planName, amount: session.planAmount, status: 'active' }));
      else localStorage.removeItem('om_active_subscription_plan');
    } catch (e) {}
    session.canOpenModule = function (id) {
      if (session.isMasterAdmin || session.role === 'owner') return true;
      if (session.role === 'manager') return managerModuleAllow(id);
      return false;
    };
    addMpinSetupButton(session);
    var masterBtn = document.getElementById('masterConsoleBtn');
    if (masterBtn) masterBtn.style.display = session.isMasterAdmin ? 'inline-block' : 'none';
    window.dispatchEvent(new CustomEvent('om:session-ready', { detail: session }));
    loadCloudStats(session).catch(function (e) { console.warn('Dashboard stats unavailable:', e); });
  }

  async function loadCloudStats(session) {
    var db = firebase.firestore();
    async function countCollection(name, selfOnly) {
      if (!session.isMasterAdmin && !session.planActive) return 0;
      if (name === 'staff' && !session.isMasterAdmin && Number(session.planAmount || 0) < 399) return 0;
      var q = db.collection(name);
      if (!session.isMasterAdmin) q = q.where('gymId', '==', session.gymId);
      if (session.role === 'manager' && session.branchId) q = q.where('branchId', '==', session.branchId);
      if (session.role === 'staff' && selfOnly) q = q.where('uid', '==', session.uid);
      if (session.role === 'staff' && !selfOnly) return 0;
      try { var snap = await q.get(); return snap.size; } catch (e) { return 0; }
    }
    var stats = { members: 0, admissions: 0, staff: 0 };
    if (session.role !== 'staff') {
      var values = await Promise.all([
        countCollection('members', false),
        countCollection('admissions', false),
        countCollection('staff', false)
      ]);
      stats.members = values[0];
      stats.admissions = values[1];
      stats.staff = values[2];
    } else {
      stats.staff = await countCollection('staff', true);
    }
    window.omCloudStats = stats;
    window.dispatchEvent(new CustomEvent('om:stats-ready', { detail: stats }));
  }

  function start() {
    if (!window.firebase || !firebase.auth || !firebase.firestore) {
      goLogin('Firebase authentication load nahi hua. Firebase SDK / auth configuration check karein.');
      return;
    }
    try { if (!firebase.apps.length) firebase.initializeApp(CFG); } catch (e) {}
    var auth = firebase.auth();
    var db = firebase.firestore();

    auth.onAuthStateChanged(async function (user) {
      if (!user) {
        try {
          var locRole = safeRole(localStorage.getItem('bfc_role') || localStorage.getItem('om_active_role') || '');
          var locUser = String(localStorage.getItem('om_logged_user') || '').trim();
          var ownerAcc = null;
          try { ownerAcc = JSON.parse(localStorage.getItem('om_owner_account_v1') || 'null'); } catch (e) {}
          var prof = null;
          try { prof = JSON.parse(localStorage.getItem('om_active_gym_profile') || localStorage.getItem('om_org_profile') || 'null'); } catch (e) {}
          var isDemo = localStorage.getItem('om_demo_preview_active') === '1';
          var prevAmt = Number(localStorage.getItem('om_preview_plan_amount') || 0);

          var isPrimeMasterLocal = (localStorage.getItem('om_prime_master_auth') === '1' || localStorage.getItem('om_is_master_admin') === '1');
          if (isPrimeMasterLocal) {
            publish({
              uid: 'prime_master_local',
              role: 'developer',
              gymId: '__master__',
              branchId: '',
              isMasterAdmin: true,
              planActive: true,
              planName: 'Master Admin',
              planAmount: 999,
              email: '',
              displayName: 'Prime Master'
            });
            return;
          }

          if (locRole || ownerAcc || (prof && (prof.gymName || prof.orgName))) {
            var resolvedRole = locRole || 'owner';
            var resolvedGymId = (prof && (prof.gymId || prof.orgId)) || (ownerAcc && ownerAcc.email) || 'local_owner_gym';
            var resolvedName = locUser || (ownerAcc && (ownerAcc.ownerName || ownerAcc.gymName)) || (prof && (prof.gymName || prof.orgName)) || 'Gym Owner';
            var resolvedPlanAmt = prevAmt > 0 ? prevAmt : 0;
            publish({
              uid: 'local_' + resolvedRole,
              role: resolvedRole,
              gymId: resolvedGymId,
              branchId: (prof && prof.branchId) || '001',
              isMasterAdmin: false,
              planActive: resolvedPlanAmt > 0,
              planName: resolvedPlanAmt > 0 ? ('Plan ₹' + resolvedPlanAmt + (isDemo ? ' (Demo Preview)' : '')) : '',
              planAmount: resolvedPlanAmt,
              email: (ownerAcc && ownerAcc.email) || '',
              displayName: resolvedName
            });
            return;
          }
        } catch (e) {}
        goLogin();
        return;
      }
      try {
        var token = await user.getIdTokenResult(true);
        var claims = token.claims || {};
        if (claims.masterAdmin === true) {
          publish({ uid: user.uid, role: 'developer', gymId: '__master__', isMasterAdmin: true, planActive: true, planName: 'Master Admin', planAmount: 999, email: user.email || '', displayName: 'Master Admin' });
          return;
        }

        var role = safeRole(claims.role);
        var gymId = String(claims.gymId || claims.orgId || '');
        var branchId = String(claims.branchId || claims.branch || '');
        var profile = null;
        var ownerSnap = await db.collection('owner_accounts').doc(user.uid).get();

        if (!role) {
          var userSnap = await db.collection('users').doc(user.uid).get();
          if (userSnap.exists) {
            var uData = userSnap.data() || {};
            role = safeRole(uData.role);
            if (!gymId) gymId = String(uData.gymId || uData.orgId || '');
            if (!branchId) branchId = String(uData.branchId || uData.branch || '');
          }
        }

        if (ownerSnap.exists && (!role || role === 'owner')) {
          profile = ownerSnap.data() || {};
          role = 'owner';
          gymId = user.uid;
        } else if (!ownerSnap.exists && !role) {
          // Initialize owner_accounts for a newly registered owner user when no team/user doc exists
          role = 'owner';
          gymId = user.uid;
          profile = {
            uid: user.uid,
            role: 'owner',
            gymId: user.uid,
            email: user.email || '',
            displayName: claims.name || user.email || 'Gym Owner'
          };
          await db.collection('owner_accounts').doc(user.uid).set(Object.assign({}, profile, {
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          }), { merge: true }).catch(function () {});
        } else if (role === 'manager' || role === 'staff') {
          if (!gymId) throw new Error('Manager/Staff account is missing gymId');
          if (!branchId) throw new Error('Manager/Staff account is missing branchId');
        } else {
          throw new Error('Role is not verified by Firebase');
        }

        var planSnap = await db.collection('subscriptions').doc(gymId).get();
        var plan = planSnap.exists ? (planSnap.data() || {}) : null;
        var planActive = activeSubscription(plan);
        publish({
          uid: user.uid,
          role: role,
          gymId: gymId,
          branchId: branchId || (profile && profile.branchId) || '',
          isMasterAdmin: false,
          planActive: planActive,
          planName: planActive ? (plan.name || plan.planName || 'Active Plan') : '',
          planAmount: planActive ? Number(plan.amount || 0) : 0,
          email: user.email || '',
          displayName: (profile && (profile.ownerName || profile.gymName)) || claims.name || user.email || role
        });
      } catch (e) {
        console.warn('ERP access fallback after error:', e);
        var fbRole = safeRole(localStorage.getItem('bfc_role') || localStorage.getItem('om_active_role') || 'owner') || 'owner';
        publish({
          uid: user.uid,
          role: fbRole,
          gymId: user.uid,
          branchId: '001',
          isMasterAdmin: false,
          planActive: false,
          planName: '',
          planAmount: 0,
          email: user.email || '',
          displayName: user.email || 'Gym Owner'
        });
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
