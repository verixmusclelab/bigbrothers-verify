/**
 * 5 Brother's Fitness Club — Secure Auth Gate
 * -------------------------------------------
 * - Firebase Email/Password Auth (recommended)
 * - Session: firebase.auth().currentUser (sessionStorage bypass nahi chalega)
 * - Optional PIN hash ONLY as second factor AFTER Firebase login (PIN alone se data nahi)
 * - Brute-force lock (local)
 *
 * Usage in HTML:
 *   <script src="auth-gate.js" data-mode="page"></script>   // full page lock
 *   <script src="auth-gate.js" data-mode="ondemand"></script> // call bfcLogin() when needed
 *
 * Firebase Console me ek admin user banao:
 *   Authentication → Sign-in method → Email/Password ON
 *   Users → Add user → email + strong password
 */
(function (global) {
  "use strict";

  var FB_CFG = {
    apiKey: "AIzaSyA9z1gXZDB3W0lJxyHV9x2vWeb0Ees7z-g",
    authDomain: "brother-s-fitness-club.firebaseapp.com",
    projectId: "brother-s-fitness-club",
    storageBucket: "brother-s-fitness-club.firebasestorage.app",
    messagingSenderId: "781489019006",
    appId: "1:781489019006:web:4a230698f2195e7208202f"
  };

  var LOCK_KEY = "5bfc_auth_lock";
  var MAX_FAIL = 5;
  var LOCK_MS = 15 * 60 * 1000; // 15 min

  function ensureFirebase() {
    if (typeof firebase === "undefined") {
      console.error("auth-gate: Firebase SDK missing");
      return null;
    }
    try {
      if (!firebase.apps.length) firebase.initializeApp(FB_CFG);
    } catch (e) {}
    return firebase;
  }

  function lockState() {
    try {
      return JSON.parse(localStorage.getItem(LOCK_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }
  function saveLock(s) {
    try {
      localStorage.setItem(LOCK_KEY, JSON.stringify(s));
    } catch (e) {}
  }
  function isBruteLocked() {
    var s = lockState();
    if (!s.until) return false;
    if (Date.now() < s.until) return true;
    saveLock({ fails: 0, until: 0 });
    return false;
  }
  function registerFail() {
    var s = lockState();
    s.fails = (s.fails || 0) + 1;
    if (s.fails >= MAX_FAIL) {
      s.until = Date.now() + LOCK_MS;
      s.fails = 0;
    }
    saveLock(s);
    return s;
  }
  function registerSuccess() {
    saveLock({ fails: 0, until: 0 });
  }

  function waitForUser(timeoutMs) {
    timeoutMs = timeoutMs || 4000;
    return new Promise(function (resolve) {
      var fb = ensureFirebase();
      if (!fb || !fb.auth) return resolve(null);
      var done = false;
      var t = setTimeout(function () {
        if (!done) {
          done = true;
          resolve(fb.auth().currentUser || null);
        }
      }, timeoutMs);
      fb.auth().onAuthStateChanged(function (u) {
        if (done) return;
        done = true;
        clearTimeout(t);
        resolve(u || null);
      });
    });
  }

  /** Returns true if Firebase admin session active */
  async function bfcIsAdmin() {
    var u = await waitForUser(2500);
    return !!(u && u.uid);
  }

  /**
   * Login modal — Email + Password (Firebase Auth)
   * Returns true on success
   */
  async function bfcLogin(opts) {
    opts = opts || {};
    if (isBruteLocked()) {
      var s = lockState();
      var mins = Math.ceil((s.until - Date.now()) / 60000);
      alert("🔒 Bahut galat attempts. " + mins + " minute baad try karo.");
      return false;
    }

    var existing = await waitForUser(1500);
    if (existing) {
      registerSuccess();
      return true;
    }

    // Build simple modal
    var overlay = document.getElementById("bfcAuthOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "bfcAuthOverlay";
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.94);display:flex;align-items:center;justify-content:center;padding:16px;";
      overlay.innerHTML =
        '<div style="background:#111;border:2px solid #ffcc00;border-radius:14px;max-width:360px;width:100%;padding:20px;color:#fff;font-family:system-ui,sans-serif">' +
        '<div style="text-align:center;font-size:28px;margin-bottom:6px">🔒</div>' +
        '<h3 style="margin:0 0 4px;color:#ffcc00;text-align:center;font-size:16px">Admin Login</h3>' +
        '<p style="margin:0 0 12px;color:#888;font-size:11px;text-align:center">5 Brother\'s Fitness Club · Secure</p>' +
        '<label style="font-size:11px;color:#aaa">Email</label>' +
        '<input id="bfcAuthEmail" type="email" autocomplete="username" placeholder="admin@email.com" style="width:100%;box-sizing:border-box;background:#181818;border:1.5px solid #444;color:#fff;padding:10px;border-radius:8px;margin:4px 0 10px;font-size:14px">' +
        '<label style="font-size:11px;color:#aaa">Password</label>' +
        '<input id="bfcAuthPass" type="password" autocomplete="current-password" placeholder="••••••••" style="width:100%;box-sizing:border-box;background:#181818;border:1.5px solid #444;color:#fff;padding:10px;border-radius:8px;margin:4px 0 12px;font-size:14px">' +
        '<div id="bfcAuthErr" style="color:#ff6666;font-size:12px;min-height:16px;margin-bottom:8px"></div>' +
        '<button type="button" id="bfcAuthGo" style="width:100%;background:#ffcc00;color:#000;border:none;padding:12px;border-radius:8px;font-weight:900;cursor:pointer">🔓 Login</button>' +
        '<button type="button" id="bfcAuthCancel" style="width:100%;margin-top:8px;background:#333;color:#ccc;border:none;padding:10px;border-radius:8px;cursor:pointer">Cancel</button>' +
        "</div>";
      document.body.appendChild(overlay);
    }
    overlay.style.display = "flex";

    return new Promise(function (resolve) {
      var emailEl = document.getElementById("bfcAuthEmail");
      var passEl = document.getElementById("bfcAuthPass");
      var errEl = document.getElementById("bfcAuthErr");
      var go = document.getElementById("bfcAuthGo");
      var cancel = document.getElementById("bfcAuthCancel");

      function close(ok) {
        overlay.style.display = "none";
        resolve(!!ok);
      }

      cancel.onclick = function () {
        close(false);
      };

      async function doLogin() {
        errEl.textContent = "";
        if (isBruteLocked()) {
          errEl.textContent = "Locked — baad me try karo";
          return;
        }
        var email = (emailEl.value || "").trim();
        var pass = passEl.value || "";
        if (!email || !pass) {
          errEl.textContent = "Email aur password dono likho";
          return;
        }
        go.disabled = true;
        go.textContent = "Checking…";
        try {
          var fb = ensureFirebase();
          await fb.auth().signInWithEmailAndPassword(email, pass);
          registerSuccess();
          go.disabled = false;
          go.textContent = "🔓 Login";
          close(true);
        } catch (e) {
          registerFail();
          go.disabled = false;
          go.textContent = "🔓 Login";
          var msg = (e && e.code) || "";
          if (msg.indexOf("user-not-found") >= 0 || msg.indexOf("wrong-password") >= 0 || msg.indexOf("invalid-credential") >= 0)
            errEl.textContent = "❌ Galat email / password";
          else if (msg.indexOf("too-many") >= 0) errEl.textContent = "Bahut attempts — thoda wait";
          else errEl.textContent = "❌ Login fail: " + (e.message || e);
        }
      }

      go.onclick = doLogin;
      passEl.onkeydown = function (ev) {
        if (ev.key === "Enter") doLogin();
      };
      emailEl.focus();
    });
  }

  /** Logout */
  async function bfcLogout() {
    try {
      var fb = ensureFirebase();
      if (fb && fb.auth) await fb.auth().signOut();
    } catch (e) {}
    try {
      sessionStorage.removeItem("5bfc_members_ok");
      sessionStorage.removeItem("5bfc_master_ok");
      sessionStorage.removeItem("5bfc_admin_ok");
    } catch (e) {}
  }

  /**
   * Legacy helper: kuch pages PIN prompt expect karte hain.
   * Ab PIN alone KAFI NAHI — pehle Firebase login.
   * PIN parameter ignore (security).
   */
  async function bfcPinCheck(pin) {
    // Agar already logged in
    if (await bfcIsAdmin()) return true;
    // PIN text se login nahi — Firebase email/password modal
    return await bfcLogin();
  }

  /** Page mode: poori page lock jab tak login na ho */
  async function gatePage() {
    var ok = await bfcIsAdmin();
    if (ok) return true;
    ok = await bfcLogin();
    if (!ok) {
      // Optional redirect home
      var back = document.querySelector('a[href="app.html"], a[href="index.html"], a[href="home.html"]');
      if (back) {
        alert("Login zaroori hai");
        location.href = back.getAttribute("href") || "app.html";
      } else {
        document.body.innerHTML =
          '<div style="background:#050505;color:#ffcc00;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:system-ui">' +
          "<h2>🔒 Admin Login Required</h2>" +
          '<p style="color:#888">Refresh karke login karo</p>' +
          '<button onclick="location.reload()" style="margin-top:12px;background:#ffcc00;color:#000;border:none;padding:12px 20px;border-radius:8px;font-weight:900">Retry</button></div>';
      }
      return false;
    }
    return true;
  }

  // Public API
  global.bfcLogin = bfcLogin;
  global.bfcLogout = bfcLogout;
  global.bfcIsAdmin = bfcIsAdmin;
  global.bfcPinCheck = bfcPinCheck;
  global.bfcAuthGate = gatePage;

  // Auto page lock
  var mode = "ondemand";
  try {
    var sc = document.currentScript || document.querySelector('script[src*="auth-gate"]');
    if (sc && sc.getAttribute("data-mode")) mode = sc.getAttribute("data-mode");
  } catch (e) {}

  if (mode === "page") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        gatePage();
      });
    } else {
      gatePage();
    }
  }
})(typeof window !== "undefined" ? window : this);
