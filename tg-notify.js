/* 5 Brother's Fitness Club — Telegram turant suchna (sabhi pages ke liye ek hi file)
   bfcNotify("text")                 -> Telegram par message
   bfcNotifyPhoto(dataUrl,"caption") -> Telegram par photo + caption
   Net na ho to chhoti queue me rukta hai aur agli baar apne-aap chala jata hai. */
(function (g) {
  "use strict";
  var TOKENS = [
    "9178541940:AAFbzJ4aTmv6QY8w9ee6lfRXrcs7kzztK2l",
    "9178541940:AAFbzJ4aTmv6QY8w9ee6lfRXrcs7kzztK2I",
    "9178541940:AAFbzJ4aTmv6QY8w9ee6IfRXrcs7kzztK2l",
    "9178541940:AAFbzJ4aTmv6QY8w9ee6IfRXrcs7kzztK2I"
  ];
  var CHAT = "1451868661";
  var OK_KEY = "5bfc_tg_ok", Q_KEY = "5bfc_tg_notify_queue";
  var tok = "";

  async function resolveToken() {
    if (tok) return tok;
    try { var c = localStorage.getItem(OK_KEY); if (c && TOKENS.indexOf(c) >= 0) { tok = c; return tok; } } catch (e) {}
    for (var i = 0; i < TOKENS.length; i++) {
      try {
        var r = await fetch("https://api.telegram.org/bot" + TOKENS[i] + "/getMe");
        var j = await r.json();
        if (j && j.ok) { tok = TOKENS[i]; try { localStorage.setItem(OK_KEY, tok); } catch (e) {} return tok; }
      } catch (e) { return ""; }
    }
    return "";
  }
  function qRead() { try { return JSON.parse(localStorage.getItem(Q_KEY) || "[]") || []; } catch (e) { return []; } }
  function qWrite(q) { try { localStorage.setItem(Q_KEY, JSON.stringify(q.slice(-20))); } catch (e) { try { localStorage.removeItem(Q_KEY); } catch (x) {} } }
  function dataUrlToBlob(du) {
    var p = String(du).split(","), bin = atob(p[1] || ""), u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Blob([u8], { type: "image/jpeg" });
  }
  async function post(job) {
    var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, 25000);
    try {
      var t = await resolveToken(); if (!t) return false;
      var r;
      if (job.img) {
        var fd = new FormData();
        fd.append("chat_id", CHAT);
        fd.append("caption", String(job.text || "").slice(0, 1000));
        fd.append("photo", dataUrlToBlob(job.img), "photo.jpg");
        r = await fetch("https://api.telegram.org/bot" + t + "/sendPhoto", { method: "POST", body: fd, signal: ctl.signal });
      } else {
        r = await fetch("https://api.telegram.org/bot" + t + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT, text: String(job.text || "").slice(0, 4000), disable_web_page_preview: true }), signal: ctl.signal });
      }
      var j = await r.json();
      return !!(j && j.ok);
    } catch (e) { return false; } finally { clearTimeout(to); }
  }
  async function send(job) {
    var ok = await post(job);
    if (!ok) { var q = qRead(); q.push(job.img ? { text: job.text } : job); qWrite(q); }
    return ok;
  }
  async function flush() {
    var q = qRead(); if (!q.length) return;
    var left = [];
    for (var i = 0; i < q.length; i++) { if (!(await post(q[i]))) left.push(q[i]); }
    qWrite(left);
  }
  g.bfcNotify = function (text) { try { return send({ text: text }); } catch (e) { return Promise.resolve(false); } };
  g.bfcNotifyPhoto = function (img, caption) { try { return send({ img: img, text: caption }); } catch (e) { return Promise.resolve(false); } };
  setTimeout(flush, 5000);
})(window);
