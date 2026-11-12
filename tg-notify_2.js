/* 5BFC Telegram notification — store.html isse bfcNotify() aur bfcNotifyPhoto() chalata hai.
   Bot: @fivebfc_selfie_bot   |   Chat: aapka personal chat id */
(function () {
  "use strict";
  var CHAT_ID = "1451868661";
  var BOT_ID  = "9178541940";
  // Screenshot me 'l' (chhota L) aur 'I' (bada i) ek jaise dikhte the, isliye '#' ki jagah dono try honge.
  // Jo chalega wo is phone/browser me yaad rakh liya jayega.
  var SECRET  = "AAFbzJ4aTmv6QY8w9ee6#fRXrcs7kzztK2#";
  var CACHE   = "5bfc_tg_secret";
  var API     = "https://api.telegram.org/bot";

  function variants() {
    var out = [], opts = ["l", "I"];
    for (var a = 0; a < 2; a++) for (var b = 0; b < 2; b++) {
      var n = 0;
      out.push(SECRET.replace(/#/g, function () { return opts[n++ === 0 ? a : b]; }));
    }
    return out;
  }
  function ok(secret) {
    return fetch(API + BOT_ID + ":" + secret + "/getMe")
      .then(function (r) { return r.json(); })
      .then(function (j) { return !!(j && j.ok); })
      .catch(function () { return false; });
  }
  var ready = null;
  function token() {
    if (ready) return ready;
    ready = new Promise(function (resolve) {
      var cached = ""; try { cached = localStorage.getItem(CACHE) || ""; } catch (e) {}
      var list = variants(); if (cached) list.unshift(cached);
      (function next(i) {
        if (i >= list.length) { ready = null; return resolve(""); }
        ok(list[i]).then(function (good) {
          if (good) { try { localStorage.setItem(CACHE, list[i]); } catch (e) {} resolve(BOT_ID + ":" + list[i]); }
          else next(i + 1);
        });
      })(0);
    });
    return ready;
  }
  function dataUrlToBlob(u) {
    var p = String(u).split(","), mime = (p[0].match(/:(.*?);/) || [, "image/jpeg"])[1];
    var bin = atob(p[1] || ""), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  window.bfcNotify = function (text) {
    return token().then(function (t) {
      if (!t) return false;
      var body = new URLSearchParams();           // simple request: CORS preflight nahi lagta
      body.set("chat_id", CHAT_ID);
      body.set("text", String(text).slice(0, 4000));
      return fetch(API + t + "/sendMessage", { method: "POST", body: body })
        .then(function (r) { return r.json(); })
        .then(function (j) { return !!(j && j.ok); });
    }).catch(function () { return false; });
  };

  window.bfcNotifyPhoto = function (dataUrl, caption) {
    return token().then(function (t) {
      if (!t) return false;
      var fd = new FormData();
      fd.append("chat_id", CHAT_ID);
      fd.append("caption", String(caption || "").slice(0, 1000));
      fd.append("photo", dataUrlToBlob(dataUrl), "proof.jpg");
      return fetch(API + t + "/sendPhoto", { method: "POST", body: fd })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.ok) return true; return window.bfcNotify(caption); });
    }).catch(function () { return window.bfcNotify(caption); });
  };
})();
