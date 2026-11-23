/* plan-bridge.js - Zero-touch bridge from index.html Upgrade Plan to plans.html */
(function () {
  "use strict";

  function goToPlansPage() {
    try {
      var target = "plans.html";
      if (window.location && window.location.href) {
        var base = window.location.href.split("?")[0].split("#")[0];
        if (/\.html?$/i.test(base)) {
          target = base.replace(/[^/]+$/, "plans.html");
        }
      }
      window.location.href = target;
    } catch (e) {
      window.location.href = "plans.html";
    }
  }

  window.omOpenPlansPage = goToPlansPage;

  // Wrap openMod if present so openMod('modLicense') opens plans.html cleanly
  function hookOpenMod() {
    if (typeof window.openMod === "function" && !window.openMod.__omPlansHooked) {
      var origOpenMod = window.openMod;
      var wrapped = function (id) {
        if (id === "modLicense") {
          goToPlansPage();
          return;
        }
        return origOpenMod.apply(this, arguments);
      };
      wrapped.__omPlansHooked = true;
      window.openMod = wrapped;
    }
  }

  // Also intercept clicks on elements targeting modLicense or Upgrade Plan
  document.addEventListener(
    "click",
    function (ev) {
      var el = ev.target && ev.target.closest ? ev.target.closest("[onclick]") : null;
      if (!el) return;
      var attr = el.getAttribute("onclick") || "";
      if (/modLicense|openUpgradeModal/i.test(attr)) {
        ev.preventDefault();
        ev.stopPropagation();
        goToPlansPage();
      }
    },
    true
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hookOpenMod);
  } else {
    hookOpenMod();
  }
  setTimeout(hookOpenMod, 300);
})();
