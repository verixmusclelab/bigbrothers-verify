/* 5 BFC Admin MPIN gate
   - PIN is NEVER stored in this file. Each phone sets its own PIN once (stored only as a salted hash).
   - No PIN set on a device  -> Admin stays LOCKED (never opens by itself).
   - Wrong PIN 3 times       -> locked for 5 min (doubles each repeat, max 1 hour).
   - First-time setup / change: open the page with  #setpin  at the end of the address.
*/
(function () {
  var PIN_LEN = 5;                 // <-- 4 ya 5: sirf yeh ek number badlo
  var SESSION_MS = 30 * 60 * 1000; // Admin 30 min ke baad apne aap band
  var K_PIN = "bfc_pin_v1", K_FAIL = "bfc_pin_fail_v1";
  var unlockedUntil = 0;

  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  async function hashPin(pin, saltHex) {
    var enc = new TextEncoder();
    var key = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveBits"]);
    var bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: enc.encode(saltHex), iterations: 100000, hash: "SHA-256" }, key, 256);
    return hex(bits);
  }
  function newSalt() { var a = new Uint8Array(16); crypto.getRandomValues(a); return hex(a); }

  function lockLeftMs() { var f = lsGet(K_FAIL) || {}; return Math.max(0, (f.lockUntil || 0) - Date.now()); }
  function registerFail() {
    var f = lsGet(K_FAIL) || { count: 0, level: 0, lockUntil: 0 };
    f.count++;
    if (f.count >= 3) {
      f.count = 0;
      f.level = Math.min((f.level || 0) + 1, 4);
      f.lockUntil = Date.now() + Math.min(5 * 60000 * Math.pow(2, f.level - 1), 60 * 60000);
    }
    lsSet(K_FAIL, f);
    return f;
  }
  function clearFail() { lsSet(K_FAIL, { count: 0, level: 0, lockUntil: 0 }); }

  // ---------- mobile-style keypad screen ----------
  function keypad(opts) {
    // opts: {title, sub, len, onDone(pin) -> Promise<{ok, msg}>, onCancel}
    return new Promise(function (resolve) {
      var old = document.getElementById("bfcPinScreen"); if (old) old.remove();
      var el = document.createElement("div");
      el.id = "bfcPinScreen";
      el.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:#050505;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:20px;box-sizing:border-box;";
      var dots = ""; for (var i = 0; i < opts.len; i++) dots += '<span class="d" style="width:16px;height:16px;border-radius:50%;border:2px solid #ffcc00;display:inline-block;margin:0 7px;transition:.1s"></span>';
      var keys = ""; ["1","2","3","4","5","6","7","8","9","","0","⌫"].forEach(function (k) {
        keys += k === "" ? "<span></span>" : '<button type="button" data-k="' + k + '" style="height:64px;border-radius:50%;border:1px solid #333;background:#151515;color:#fff;font-size:26px;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;">' + k + "</button>";
      });
      el.innerHTML =
        '<div style="font-size:40px;margin-bottom:6px">🔒</div>' +
        '<div style="font-size:19px;font-weight:800;color:#ffcc00">' + opts.title + "</div>" +
        '<div id="bfcPinMsg" style="font-size:13px;color:#aaa;margin:8px 0 22px;text-align:center;min-height:18px">' + (opts.sub || "") + "</div>" +
        '<div id="bfcPinDots" style="margin-bottom:26px">' + dots + "</div>" +
        '<div style="display:grid;grid-template-columns:repeat(3,72px);gap:14px;justify-content:center">' + keys + "</div>" +
        '<button type="button" id="bfcPinCancel" style="margin-top:26px;background:none;border:0;color:#888;font-size:14px;cursor:pointer">रद्द करो</button>';
      document.body.appendChild(el);

      var pin = "", busy = false;
      var msg = el.querySelector("#bfcPinMsg");
      function paint() { var ds = el.querySelectorAll(".d"); for (var i = 0; i < ds.length; i++) ds[i].style.background = i < pin.length ? "#ffcc00" : "transparent"; }
      function close(v) { document.removeEventListener("keydown", onKey); el.remove(); resolve(v); }
      async function push(k) {
        if (busy) return;
        if (k === "⌫") { pin = pin.slice(0, -1); paint(); return; }
        if (pin.length >= opts.len) return;
        pin += k; paint();
        if (pin.length === opts.len) {
          busy = true;
          var r = await opts.onDone(pin);
          if (r && r.ok) { close(true); return; }
          msg.style.color = "#ff5555"; msg.textContent = (r && r.msg) || "गलत PIN";
          el.querySelector("#bfcPinDots").animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }], { duration: 220 });
          pin = ""; paint(); busy = false;
          if (r && r.close) close(false);
        }
      }
      function onKey(e) { if (/^[0-9]$/.test(e.key)) push(e.key); else if (e.key === "Backspace") push("⌫"); else if (e.key === "Escape") close(false); }
      document.addEventListener("keydown", onKey);
      el.querySelectorAll("button[data-k]").forEach(function (b) { b.onclick = function () { push(b.getAttribute("data-k")); }; });
      el.querySelector("#bfcPinCancel").onclick = function () { close(false); };
    });
  }

  function msgScreen(text) { alert(text); return false; }

  async function checkPin(pin, rec) {
    var left = lockLeftMs();
    if (left > 0) return { ok: false, close: true, msg: "" };
    var h = await hashPin(pin, rec.salt);
    if (h === rec.hash) { clearFail(); return { ok: true }; }
    var f = registerFail();
    if (lockLeftMs() > 0) return { ok: false, close: true, msg: "" };
    return { ok: false, msg: "गलत PIN — " + (3 - f.count) + " कोशिश बाकी" };
  }

  async function setPinFlow() {
    var rec = lsGet(K_PIN);
    if (rec && rec.hash) {
      var okOld = await keypad({ title: "पुराना PIN", sub: "बदलने के लिए पहले पुराना PIN डालो", len: rec.len || PIN_LEN, onDone: function (p) { return checkPin(p, rec); } });
      if (!okOld) return false;
    }
    var first = null;
    var ok1 = await keypad({ title: "नया Admin PIN", sub: PIN_LEN + " अंक का नया PIN डालो", len: PIN_LEN, onDone: async function (p) { first = p; return { ok: true }; } });
    if (!ok1) return false;
    var ok2 = await keypad({ title: "PIN फिर से डालो", sub: "वही PIN दोबारा", len: PIN_LEN, onDone: async function (p) { return p === first ? { ok: true } : { ok: false, msg: "PIN मेल नहीं खाया" }; } });
    if (!ok2) return false;
    var salt = newSalt();
    lsSet(K_PIN, { salt: salt, hash: await hashPin(first, salt), len: PIN_LEN });
    clearFail();
    return true;
  }

  window.bfcIsAdmin = async function () { return Date.now() < unlockedUntil; };

  window.bfcLogout = async function () { unlockedUntil = 0; return true; };

  window.bfcLogin = async function () {
    if (Date.now() < unlockedUntil) return true;
    if (!(window.crypto && crypto.subtle)) return msgScreen("Is browser me secure PIN nahi chal sakta (https chahiye).");
    var wantSetup = /(^|[#&])setpin\b/.test(location.hash);
    var rec = lsGet(K_PIN);
    if (wantSetup) {
      var done = await setPinFlow();
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      if (done) { alert("✅ PIN set ho gaya. Ab Admin dabao aur PIN daalo."); }
      return false;
    }
    if (!rec || !rec.hash) return msgScreen("🔒 Is phone me Admin PIN set nahi hai.\nPage ke address ke aakhir me  #setpin  lagakar kholo aur PIN set karo.");
    var left = lockLeftMs();
    if (left > 0) return msgScreen("🔒 Bahut galat koshish. " + Math.ceil(left / 60000) + " minute baad phir try karo.");
    var ok = await keypad({ title: "Admin PIN", sub: rec.len + " अंक का PIN डालो", len: rec.len || PIN_LEN, onDone: function (p) { return checkPin(p, rec); } });
    if (!ok) { var l2 = lockLeftMs(); if (l2 > 0) msgScreen("🔒 3 galat koshish — " + Math.ceil(l2 / 60000) + " minute ke liye band."); return false; }
    unlockedUntil = Date.now() + SESSION_MS;
    return true;
  };
})();
