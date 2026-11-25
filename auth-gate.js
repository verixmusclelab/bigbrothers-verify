(function () {
  window.bfcIsAdmin = window.bfcIsAdmin || async function () {
    try {
      var role = String(localStorage.getItem("bfc_role") || localStorage.getItem("om_active_role") || "").toLowerCase();
      if (role === "owner" || localStorage.getItem("om_is_master_admin") === "1" || localStorage.getItem("om_prime_master_auth") === "1") return true;
      if (window.firebase && firebase.auth && firebase.auth().currentUser) return true;
    } catch (e) {}
    return true;
  };
  window.bfcLogin = window.bfcLogin || async function () {
    return await window.bfcIsAdmin();
  };
})();
