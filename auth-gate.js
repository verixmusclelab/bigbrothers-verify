/* 5BFC — Staff Login (Firebase Auth, free)
   Do mode:
   data-mode="page"      -> poora page tab tak band jab tak staff login na kare (master, members-portal, udhar)
   data-mode="ondemand"  -> page sabke liye khula; admin kaam par window.bfcLogin() login maangta hai (admission, attendance)
   Login "pakka" hai: password code me nahi, Firebase ke server par check hota hai. */
(function () {
  var cfg = {
    apiKey: "AIzaSyA9z1gXZDB3W0lJxyHV9x2vWeb0Ees7z-g",
    authDomain: "brother-s-fitness-club.firebaseapp.com",
    projectId: "brother-s-fitness-club",
    storageBucket: "brother-s-fitness-club.firebasestorage.app",
    messagingSenderId: "781489019006",
    appId: "1:781489019006:web:4a230698f2195e7208202f"
  };
  var tag = document.currentScript;
  var MODE = (tag && tag.getAttribute("data-mode")) || "ondemand";
  var IDLE_MIN = 15; // ondemand me itne minute baad apne aap logout

  if (typeof firebase === "undefined" || !firebase.auth) { console.error("auth-gate: firebase-auth script missing"); return; }
  if (!firebase.apps.length) firebase.initializeApp(cfg);
  var auth = firebase.auth();
  try { auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) {}

  var overlay = null, chip = null, idleTimer = null, waiters = [], typed = false;

  function el(html) { var d = document.createElement("div"); d.innerHTML = html; return d.firstChild; }

  function errText(e) {
    var c = (e && e.code) || "";
    if (c.indexOf("invalid-credential") >= 0 || c.indexOf("wrong-password") >= 0 || c.indexOf("user-not-found") >= 0 || c.indexOf("invalid-login") >= 0) return "❌ Email या Password गलत है";
    if (c.indexOf("too-many-requests") >= 0) return "🔒 बहुत बार गलत कोशिश — कुछ देर बाद दोबारा करें";
    if (c.indexOf("network") >= 0) return "📶 इंटरनेट की समस्या";
    if (c.indexOf("invalid-email") >= 0) return "❌ Email सही लिखें";
    return "❌ लॉगिन नहीं हुआ" + (c ? " (" + c + ")" : "");
  }

  function showLogin(closable) {
    if (overlay) return;
    overlay = el(
      '<div id="bfcAuthOverlay" style="position:fixed;inset:0;z-index:2147483647;background:#050505;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;">' +
      '<div style="width:100%;max-width:360px;background:#111;border:2px solid #ffcc00;border-radius:16px;padding:22px 18px;text-align:center;color:#fff;box-shadow:0 0 30px rgba(255,204,0,.25);position:relative;">' +
      (closable ? '<button type="button" id="bfcAuthClose" style="position:absolute;top:8px;right:10px;background:#333;color:#fff;border:none;border-radius:6px;padding:3px 9px;cursor:pointer;">✕</button>' : '') +
      '<div style="font-size:38px;margin-bottom:6px;">🔐</div>' +
      '<div style="color:#ffcc00;font-weight:900;font-size:17px;">5 Brother\'s Fitness Club</div>' +
      '<div style="color:#aaa;font-size:12px;margin:4px 0 14px;">केवल Admin / Staff — लॉगिन करें</div>' +
      '<input id="bfcEmail" type="email" autocomplete="username" placeholder="Email" style="width:100%;box-sizing:border-box;background:#181818;border:1.5px solid #444;color:#fff;padding:12px;border-radius:8px;font-size:14px;margin-bottom:8px;outline:none;">' +
      '<input id="bfcPass" type="password" autocomplete="current-password" placeholder="Password" style="width:100%;box-sizing:border-box;background:#181818;border:1.5px solid #444;color:#fff;padding:12px;border-radius:8px;font-size:14px;margin-bottom:10px;outline:none;">' +
      '<button type="button" id="bfcLoginBtn" style="width:100%;background:#ffcc00;color:#000;border:none;padding:12px;border-radius:8px;font-weight:900;font-size:14px;cursor:pointer;">🔓 लॉगिन</button>' +
      '<div id="bfcAuthMsg" style="color:#ff6666;font-size:12px;margin-top:10px;min-height:16px;font-weight:bold;"></div>' +
      '<a href="app.html" style="display:inline-block;margin-top:8px;color:#888;font-size:12px;text-decoration:none;">⬅ मुख्य मेन्यू</a>' +
      '</div></div>'
    );
    document.documentElement.appendChild(overlay);
    var email = overlay.querySelector("#bfcEmail"), pass = overlay.querySelector("#bfcPass"), msg = overlay.querySelector("#bfcAuthMsg"), btn = overlay.querySelector("#bfcLoginBtn");
    function go() {
      var e = email.value.trim(), p = pass.value;
      if (!e || !p) { msg.textContent = "Email और Password दोनों लिखें"; return; }
      btn.disabled = true; btn.textContent = "⏳ जाँच रहे हैं...";
      auth.signInWithEmailAndPassword(e, p).then(function () {
        typed = true;
        msg.style.color = "#00ff66"; msg.textContent = "✅ लॉगिन हो गया";
        // onAuthStateChanged baaki kaam karega
      }).catch(function (err) {
        btn.disabled = false; btn.textContent = "🔓 लॉगिन";
        pass.value = ""; msg.style.color = "#ff6666"; msg.textContent = errText(err);
      });
    }
    btn.onclick = go;
    pass.onkeydown = function (ev) { if (ev.key === "Enter") go(); };
    email.onkeydown = function (ev) { if (ev.key === "Enter") pass.focus(); };
    var c = overlay.querySelector("#bfcAuthClose");
    if (c) c.onclick = function () { hideLogin(); settle(false); };
    setTimeout(function () { try { email.focus(); } catch (e) {} }, 100);
  }
  function hideLogin() { if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay); overlay = null; }
  function settle(ok) { var w = waiters; waiters = []; w.forEach(function (f) { f(ok); }); }

  function showChip(user) {
    if (chip || !document.body) return;
    chip = el('<div style="position:fixed;right:8px;bottom:8px;z-index:2147483000;display:flex;gap:6px;font:700 10px system-ui;">' +
      '<span id="bfcPinChip" style="background:rgba(0,0,0,.78);border:1px solid #00ff99;color:#00ff99;padding:5px 9px;border-radius:14px;cursor:pointer;">🔑 PIN बदलें</span>' +
      '<span id="bfcOutChip" style="background:rgba(0,0,0,.78);border:1px solid #ffcc00;color:#ffcc00;padding:5px 9px;border-radius:14px;cursor:pointer;">🔒 Logout</span></div>');
    chip.title = user && user.email ? user.email : "";
    chip.querySelector("#bfcOutChip").onclick = function () { auth.signOut(); };
    chip.querySelector("#bfcPinChip").onclick = function () { window.bfcPinChange(); };
    document.body.appendChild(chip);
  }
  function hideChip() { if (chip && chip.parentNode) chip.parentNode.removeChild(chip); chip = null; }

  function armIdle() {
    if (MODE !== "ondemand") return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { auth.signOut(); }, IDLE_MIN * 60 * 1000);
  }

  var firstState = true;
  auth.onAuthStateChanged(function (user) {
    if (user && user.isAnonymous) user = null; // anonymous (guest) login ko staff na maane
    if (user) {
      hideLogin();
      var addChip = function () { showChip(user); };
      if (document.body) addChip(); else document.addEventListener("DOMContentLoaded", addChip);
      armIdle();
      if (MODE === "page" && typed) { location.reload(); return; } // saaf shuruaat, ab data permission ke saath load hoga
      settle(true);
    } else {
      hideChip();
      clearTimeout(idleTimer);
      if (MODE === "page") showLogin(false);
    }
    firstState = false;
  });

  // pehle se login hone par flash na ho: page-mode me turant parda
  if (MODE === "page") showLogin(false);

  /* ===== ADMIN PIN (4–6 ank) — aap khud kabhi bhi badal sakte hain =====
     PIN code me nahi likha; sirf uska hash Firestore "settings/appPin" me rehta hai (rules ke baad sirf Staff padh sakta hai).
     Sab pages (Master, Members Portal, Udhar, Admission Admin Desk) isi ek PIN ko use karte hain. */
  function h53(str, seed) {
    var h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
    for (var i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  function pinHash(p) { return h53("5bfc|" + String(p) + "|apppin"); }
  var DEFAULT_PIN_HASH = pinHash("5555"); // jab tak aap PIN nahi badalte
  var PIN_CACHE = "5bfc_app_pin_hash";

  // returns hash, ya null agar pata nahi chal paya (internet nahi + cache nahi)
  async function getPinHash() {
    try {
      var d = await firebase.firestore().collection("settings").doc("appPin").get();
      if (d.exists && d.data() && d.data().hash) { try { localStorage.setItem(PIN_CACHE, d.data().hash); } catch (e) {} return d.data().hash; }
      try { localStorage.removeItem(PIN_CACHE); } catch (e) {}
      return DEFAULT_PIN_HASH; // cloud ne bataya: abhi tak PIN badla nahi gaya
    } catch (e) {
      try { var c = localStorage.getItem(PIN_CACHE); if (c) return c; } catch (e2) {}
      return null;
    }
  }
  function lockLeftMin() {
    try { var st = JSON.parse(localStorage.getItem("5bfc_pinlock") || "{}"); if (st.until && Date.now() < st.until) return Math.ceil((st.until - Date.now()) / 60000); } catch (e) {}
    return 0;
  }
  // await bfcPinCheck("1234") -> true/false  (3 galat par 15 minute lock)
  window.bfcPinCheck = async function (pin) {
    if (pin === null || pin === undefined) return false;
    var left = lockLeftMin();
    if (left > 0) { alert("🔒 3 बार गलत PIN। " + left + " मिनट बाद कोशिश करें।"); return false; }
    var real = await getPinHash();
    if (!real) { alert("📶 PIN जाँचने के लिए इंटरनेट चाहिए।"); return false; }
    var st = {}; try { st = JSON.parse(localStorage.getItem("5bfc_pinlock") || "{}"); } catch (e) {}
    if (pinHash(String(pin).trim()) === real) { try { localStorage.removeItem("5bfc_pinlock"); } catch (e) {} return true; }
    st.fails = (st.fails || 0) + 1;
    if (st.fails >= 3) { st.until = Date.now() + 15 * 60 * 1000; st.fails = 0; alert("❌ गलत PIN। 3 बार गलत — 15 मिनट के लिए लॉक।"); }
    else alert("❌ गलत PIN! (" + st.fails + "/3)");
    try { localStorage.setItem("5bfc_pinlock", JSON.stringify(st)); } catch (e) {}
    return false;
  };
  // PIN badalna: purana PIN + naya (4-6 ank) 2 baar. Sirf logged-in Staff kar sakta hai.
  window.bfcPinChange = async function () {
    if (!(await window.bfcLogin())) return;
    var old = prompt("🔑 पुराना PIN डालें (अभी तक नहीं बदला तो 5555):");
    if (old === null) return;
    if (!(await window.bfcPinCheck(old))) return;
    var n1 = prompt("🔑 नया PIN डालें (4 से 6 अंक, सिर्फ़ नंबर):");
    if (n1 === null) return;
    n1 = String(n1).trim();
    if (!/^\d{4,6}$/.test(n1)) { alert("❌ PIN सिर्फ़ अंकों का, 4 से 6 अंक लंबा होना चाहिए।"); return; }
    if (/^(\d)\1+$/.test(n1) || n1 === "1234" || n1 === "123456" || n1 === "5555") { alert("❌ यह PIN बहुत आसान है। कोई और चुनें।"); return; }
    var n2 = prompt("🔑 नया PIN दोबारा डालें:");
    if (n2 === null) return;
    if (String(n2).trim() !== n1) { alert("❌ दोनों PIN अलग हैं, बदला नहीं गया।"); return; }
    try {
      var h = pinHash(n1);
      await firebase.firestore().collection("settings").doc("appPin").set({ hash: h, updated: Date.now() });
      try { localStorage.setItem(PIN_CACHE, h); } catch (e) {}
      alert("✅ नया PIN सेट हो गया। अब सारे पेजों पर यही चलेगा।");
    } catch (e) {
      console.error(e);
      alert("❌ PIN सेव नहीं हुआ (इंटरनेट / permission): " + (e.message || e));
    }
  };

  // On-demand: await window.bfcLogin()  -> true agar staff login hai
  window.bfcLogin = function () {
    return new Promise(function (resolve) {
      if (auth.currentUser && !auth.currentUser.isAnonymous) { armIdle(); resolve(true); return; }
      waiters.push(resolve);
      showLogin(true);
    });
  };
  window.bfcLogout = function () { return auth.signOut(); };
  window.bfcIsStaff = function () { return !!auth.currentUser && !auth.currentUser.isAnonymous; };
})();
