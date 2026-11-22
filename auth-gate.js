
  // Anti-Tamper Check: If someone manually tries to change localStorage bfc_role to 'owner' while staff session exists
  function verifyRoleIntegrity() {
    var hasStaffSess = !!staffSess();
    var r = LS.getItem("bfc_role");
    if (hasStaffSess && r === "owner") {
      // Tampering detected: staff session cannot claim owner privileges
      console.warn("Security Alert: Role tampering detected! Resetting to staff.");
      LS.setItem("bfc_role", "staff");
    }
  }

// auth-gate.js v2 - Role Lock, Staff Page Allowlist, Background Lock & Continue/New Session
(function () {
  var LS = localStorage;
  var SS = sessionStorage;
  var IDLE_MS = 60 * 1000;          // 1 minute inactivity -> auto logout (resume option milega)
  var BG_MS = 30 * 1000;            // app background me 30 sec se zyada raha -> dubara login
  var BG_MS_PAY = 5 * 60 * 1000;    // Pay page par UPI app kholne ka time (payment beech me na toote)
  var RESUME_TTL = 12 * 60 * 60 * 1000;
  var idleTimer = null;

  var FILE = (window.location.pathname.toLowerCase().split("/").pop() || "index.html");
  var IS_AUTH_PAGE = (FILE === "login.html" || FILE === "reset.html");
  // Sirf asli public pages. (Pehle "staff-join.html" bhi "join.html" se match ho kar public ban jata tha)
  var IS_PUBLIC = (FILE === "join.html" || FILE === "join10000.html" || window.location.search.indexOf("doc=") !== -1);

  var AUTH_KEYS = ["om_org_profile", "bfc_org_profile", "bfc_org_id", "bfc_role", "bfc_active_staff",
    "bfc_admin_logged_in", "om_staff_session", "om_last_active_url", "om_hidden_at"];

  function jget(k, d) {
    try { var v = JSON.parse(LS.getItem(k)); return v == null ? d : v; } catch (e) { return d; }
  }
  function orgIdNow() {
    return LS.getItem("bfc_org_id") || ((jget("om_org_profile", {}) || {}).orgId) || "";
  }
  function staffSess() { return jget("om_staff_session", null); }

  // Link se bani hui (bina code wali) staff session ko kabhi valid nahi maante
  function isLinkOnlySession() {
    var s = staffSess();
    return !!s && (s.code === "STF-LINK" || LS.getItem("bfc_org_id") === "staff_link_org");
  }

  function currentRole() {
    var r = LS.getItem("bfc_role");
    if (r === "staff" || r === "owner") return r;
    return staffSess() ? "staff" : "owner";
  }
  window.bfcRole = currentRole;

  function whoId() {
    if (currentRole() === "staff") {
      var s = staffSess() || {};
      return "staff:" + (s.code || "") + "@" + (s.branchCode || "");
    }
    return "owner:" + orgIdNow();
  }

  // Staff ko sirf ye pages: Dashboard (3 option), Admission, Pay Fees, Staff Joining, Staff Salary
    // Staff ko sirf ye limited pages allowed hain:
  // Dashboard (limited 4-tile view), Admission Form, Pay Fees, Staff Joining
  // Staff-Salary aur Branch-Report kisi bhi keemat par staff ke liye khula nahi rahega!
  function staffAllowed(file) {
    file = (file || "").toLowerCase().split("?")[0];
    if (file === "" || file === "index.html") return true;
    if (file === "staff-join.html") return true;
    if (file.indexOf("join") === 0) return true;
    if (file.indexOf("pay") === 0) return true;
    // Disallow staff-salary.html and branch-report.html
    return false;
  }

  window.bfcLogin = async function () {
    var storedPin = LS.getItem("om_admin_pin") || "1234";
    if (currentRole() === "staff") { alert("Ye option sirf Admin ke liye hai."); return false; }
    var pin = prompt("Admin PIN darj karein (default 1234):", "");
    if (pin === null) return false;
    if (pin.trim() === storedPin) return true;
    alert("Galat PIN!");
    return false;
  };

  window.bfcIsAdmin = async function () {
    return currentRole() !== "staff";
  };

  function pageLabel(url) {
    var f = String(url || "").split("?")[0].toLowerCase();
    if (f === "" || f === "index.html") return "Dashboard";
    if (f.indexOf("staff-salary") === 0) return "Staff Salary & Payroll";
    if (f.indexOf("staff-join") === 0) return "Staff Joining";
    if (f.indexOf("branch-report") === 0) return "Branch Report";
    if (f.indexOf("pay") === 0) return "Pay Fees Desk";
    if (f.indexOf("join") === 0) return "Admission Form";
    return f;
  }

  function saveResume() {
    try {
      if (!orgIdNow() || IS_AUTH_PAGE || IS_PUBLIC) return;
      LS.setItem("om_resume", JSON.stringify({
        url: FILE + window.location.search,
        role: currentRole(),
        who: whoId(),
        ts: Date.now()
      }));
    } catch (e) {}
  }

  function clearSessionAndGoLogin(keepResume) {
    try {
      if (window.firebase && firebase.auth) {
        firebase.auth().signOut().catch(function () {});
      }
    } catch (e) {}
    AUTH_KEYS.forEach(function (k) { LS.removeItem(k); });
    try { SS.removeItem("om_landed"); } catch (e) {}
    if (!keepResume) LS.removeItem("om_resume");

    if (!IS_AUTH_PAGE) {
      window.location.replace("login.html?logout=1");
    }
  }

  // Button wala Logout = poora logout, resume option nahi milega
  window.omLogoutNow = function () { clearSessionAndGoLogin(false); };

  function autoLogout() {
    saveResume();
    clearSessionAndGoLogin(true);
  }

  // ---------- Idle ----------
  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (IS_AUTH_PAGE || IS_PUBLIC) return;
    if (!orgIdNow()) return;
    idleTimer = setTimeout(autoLogout, IDLE_MS);
  }
  function bindActivityListeners() {
    ["click", "touchstart", "mousemove", "keydown", "scroll"].forEach(function (ev) {
      window.addEventListener(ev, resetIdleTimer, { passive: true });
    });
    resetIdleTimer();
  }

  // ---------- Background lock ----------
  function bgLimit() { return FILE.indexOf("pay") === 0 ? BG_MS_PAY : BG_MS; }
  function checkBackground() {
    var t = parseInt(LS.getItem("om_hidden_at") || "0", 10);
    LS.removeItem("om_hidden_at");
    if (!t || IS_AUTH_PAGE || IS_PUBLIC || !orgIdNow()) return;
    if (Date.now() - t > bgLimit()) autoLogout();
  }
  document.addEventListener("visibilitychange", function () {
    if (IS_AUTH_PAGE || IS_PUBLIC || !orgIdNow()) return;
    if (document.visibilityState === "hidden") {
      LS.setItem("om_hidden_at", String(Date.now()));
    } else {
      checkBackground();
    }
  });

  // ---------- Guard (page load par turant) ----------
  function guard() {
    verifyRoleIntegrity();
    if (IS_AUTH_PAGE) return true;
    var params = new URLSearchParams(window.location.search);

    // Link se bani purani/fake staff session hatao
    if (isLinkOnlySession() || orgIdNow() === "preview_org_001") { AUTH_KEYS.forEach(function (k) { LS.removeItem(k); }); }

    var hasSession = !!orgIdNow();

    // Staff link (?role=staff) se ab seedha login NAHI milta - staff code dalna padega
    if (params.get("role") === "staff" && !hasSession) {
      LS.setItem("om_staff_link_branch", params.get("branch") || "001");
      window.location.replace("login.html?staffonly=1&branch=" + encodeURIComponent(params.get("branch") || "001"));
      return false;
    }

    if (!hasSession && !IS_PUBLIC) {
      window.location.replace("login.html");
      return false;
    }
    if (!hasSession) return true;

    // Role lock: staff sirf apne allowed pages dekh sakta hai
    if (currentRole() === "staff") {
      LS.setItem("bfc_role", "staff");
      var landed = false;
      try { landed = SS.getItem("om_landed") === "1"; } catch (e) {}
      if (!staffAllowed(FILE) || (!landed && FILE !== "index.html")) {
        try { SS.setItem("om_landed", "1"); } catch (e) {}
        window.location.replace("index.html");
        return false;
      }
    }
    try { SS.setItem("om_landed", "1"); } catch (e) {}

    // Background me 30 sec+ raha (ya app band hui) to dubara login
    var t = parseInt(LS.getItem("om_hidden_at") || "0", 10);
    if (t && Date.now() - t > bgLimit()) { autoLogout(); return false; }
    LS.removeItem("om_hidden_at");

    if (!IS_PUBLIC && (currentRole() !== "staff" || staffAllowed(FILE))) {
      LS.setItem("om_last_active_url", FILE + window.location.search);
    }
    return true;
  }

  var guardOk = guard();

  // bfcache (back se purana page wapas) me bhi guard dobara chale
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) { guard(); checkBackground(); }
  });

  // ---------- Continue last session / New session ----------
  function showResumePrompt(r) {
    if (document.getElementById("omResumeOv")) return;
    var ov = document.createElement("div");
    ov.id = "omResumeOv";
    ov.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:18px;font-family:'Segoe UI',Roboto,sans-serif";
    var box = document.createElement("div");
    box.style.cssText = "width:100%;max-width:380px;background:#0F1730;border:2px solid #FFB800;border-radius:18px;padding:20px;color:#EAF0FF;text-align:center";
    var h = document.createElement("div");
    h.style.cssText = "font-size:18px;font-weight:900;color:#FFB800;margin-bottom:6px";
    h.textContent = "Pichla session mila";
    var p = document.createElement("div");
    p.style.cssText = "font-size:13px;color:#B8C3E0;margin-bottom:16px;line-height:1.5";
    p.textContent = "Aap pichli baar \"" + pageLabel(r.url) + "\" par the. Wahin se aage continue karna hai ya naya session shuru karna hai?";
    var b1 = document.createElement("button");
    b1.type = "button";
    b1.textContent = "▶ Continue Last Session";
    b1.style.cssText = "width:100%;padding:13px;border:0;border-radius:12px;background:#FFB800;color:#000;font-weight:900;font-size:14px;margin-bottom:10px;cursor:pointer";
    var b2 = document.createElement("button");
    b2.type = "button";
    b2.textContent = "🆕 Naya Session";
    b2.style.cssText = "width:100%;padding:13px;border:1px solid #334E81;border-radius:12px;background:#121A2E;color:#EAF0FF;font-weight:900;font-size:14px;cursor:pointer";
    b1.onclick = function () {
      LS.removeItem("om_resume");
      ov.remove();
      var target = r.url;
      var f = String(target).split("?")[0].toLowerCase();
      if (currentRole() === "staff" && !staffAllowed(f)) target = "index.html";
      if (target !== FILE + window.location.search) window.location.replace(target);
    };
    b2.onclick = function () {
      LS.removeItem("om_resume");
      ov.remove();
      if (FILE !== "index.html") window.location.replace("index.html");
    };
    box.appendChild(h); box.appendChild(p); box.appendChild(b1); box.appendChild(b2);
    ov.appendChild(box);
    document.body.appendChild(ov);
  }

  function maybeResume() {
    var r = jget("om_resume", null);
    if (!r) return;
    if (!orgIdNow() || IS_AUTH_PAGE || IS_PUBLIC) return;
    if (!r.ts || Date.now() - r.ts > RESUME_TTL || r.role !== currentRole() || r.who !== whoId()) {
      LS.removeItem("om_resume");   // alag banda / alag role -> koi purana session nahi dikhana
      return;
    }
    if (r.url === FILE + window.location.search) { LS.removeItem("om_resume"); return; }
    showResumePrompt(r);
  }

  // ---------- Back lock ----------
  function setupBackLock() {
    if (!guardOk) return;
    if (!IS_AUTH_PAGE && orgIdNow() && window.history && window.history.pushState) {
      window.history.pushState({ locked: true }, "", window.location.href);
      window.onpopstate = function () {
        window.history.pushState({ locked: true }, "", window.location.href);
      };
    }
    bindActivityListeners();
    maybeResume();
  }

  window.addEventListener("DOMContentLoaded", setupBackLock);
})();
