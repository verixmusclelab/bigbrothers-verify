/* 5 BROTHER'S FITNESS CLUB — दहाड़ता शेर Welcome Pop-up
 * Kisi bhi page me:  <script src="roar-welcome.js"></script>
 * Phir:  showRoarWelcome({ name: "Vivek Kumar" });
 */
(function () {
  if (window.showRoarWelcome) return;

  var CSS = [
    "#roarOv{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;flex-direction:column;overflow:hidden;",
    "background:radial-gradient(circle at 50% 42%,#4a3300 0%,#140d00 45%,#000 80%);opacity:0;animation:roarFadeIn .35s forwards;font-family:'Segoe UI',Arial,sans-serif;}",
    "#roarOv.out{animation:roarFadeOut .45s forwards}",
    "@keyframes roarFadeIn{to{opacity:1}} @keyframes roarFadeOut{to{opacity:0;transform:scale(1.08)}}",
    "#roarOv canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}",
    "#roarOv .stage{position:relative;width:min(78vw,300px);height:min(78vw,300px);display:flex;align-items:center;justify-content:center;animation:roarShake .12s linear 1.0s 9}",
    "#roarOv .ring{position:absolute;inset:0;border-radius:50%;border:4px solid #ffcc00;opacity:0;transform:scale(.3);animation:roarRing 1.6s ease-out infinite}",
    "#roarOv .ring.r2{animation-delay:.35s}#roarOv .ring.r3{animation-delay:.7s}",
    "@keyframes roarRing{0%{opacity:.9;transform:scale(.3)}100%{opacity:0;transform:scale(1.7)}}",
    "#roarOv .lion{line-height:1;filter:drop-shadow(0 0 28px #ffb300) drop-shadow(0 0 60px #ff7b00);transform:scale(0) rotate(-12deg);",
    "animation:roarPop .7s cubic-bezier(.2,1.6,.4,1) .15s forwards,roarRoar .9s ease-in-out 1.0s 2}",
    "@keyframes roarPop{to{transform:scale(1) rotate(0)}}",
    "@keyframes roarRoar{0%,100%{transform:scale(1)}35%{transform:scale(1.28) rotate(-3deg)}65%{transform:scale(1.18) rotate(3deg)}}",
    "@keyframes roarShake{0%{transform:translate(0,0)}25%{transform:translate(4px,-3px)}50%{transform:translate(-4px,3px)}75%{transform:translate(3px,4px)}100%{transform:translate(0,0)}}",
    "#roarOv .t1{color:#ffe08a;font-weight:800;letter-spacing:5px;font-size:min(5vw,19px);margin-top:10px;opacity:0;transform:translateY(20px);animation:roarUp .6s ease-out .9s forwards}",
    "#roarOv .t2{font-weight:900;text-align:center;font-size:min(8.6vw,36px);line-height:1.15;margin:4px 14px 0;opacity:0;transform:scale(.6);",
    "background:linear-gradient(90deg,#b8860b,#ffe066,#fff6c4,#ffcc00,#b8860b);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;",
    "animation:roarZoom .6s cubic-bezier(.2,1.5,.4,1) 1.15s forwards,roarShine 2.2s linear 1.8s infinite;text-shadow:0 0 22px rgba(255,190,0,.35)}",
    "#roarOv .t3{color:#fff;font-weight:800;text-align:center;font-size:min(5.6vw,22px);margin:14px 18px 0;opacity:0;animation:roarUp .6s ease-out 1.6s forwards,roarPulse 1.3s ease-in-out 2.3s infinite}",
    "#roarOv .nm{color:#25D366;font-weight:900;font-size:min(6vw,24px);margin-top:12px;opacity:0;animation:roarUp .6s ease-out 1.9s forwards}",
    "#roarOv .tap{position:absolute;bottom:18px;color:#777;font-size:11px;opacity:0;animation:roarUp .5s ease-out 2.4s forwards}",
    "@keyframes roarUp{to{opacity:1;transform:translateY(0)}} @keyframes roarZoom{to{opacity:1;transform:scale(1)}}",
    "@keyframes roarShine{0%{background-position:0 0}100%{background-position:250% 0}}",
    "@keyframes roarPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}",
    "#roarOv.flash::after{content:'';position:absolute;inset:0;background:#fff;opacity:0;animation:roarFlash .35s ease-out 1.0s}",
    "@keyframes roarFlash{0%{opacity:.55}100%{opacity:0}}",
    "#roarOv .lion svg,#roarOv .lion video,#roarOv .lion img{width:min(72vw,290px);height:min(72vw,290px);display:block;object-fit:contain}",
    "#roarOv .lion{font-size:0}",
    "#roarOv .m1,#roarOv .m2,#roarOv .m3{transform-box:view-box;transform-origin:150px 150px}",
    "#roarOv .m1{animation:roarSpinA 5s ease-in-out infinite}#roarOv .m2{animation:roarSpinB 4s ease-in-out infinite}#roarOv .m3{animation:roarSpinA 3.2s ease-in-out infinite}",
    "@keyframes roarSpinA{0%,100%{transform:rotate(-3deg) scale(1)}50%{transform:rotate(3deg) scale(1.04)}}",
    "@keyframes roarSpinB{0%,100%{transform:rotate(3deg) scale(1.03)}50%{transform:rotate(-3deg) scale(1)}}",
    "#roarOv .mouth{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(.2);animation:roarJaw .9s ease-in-out 1.0s 2 forwards}",
    "@keyframes roarJaw{0%{transform:scaleY(.2)}40%,70%{transform:scaleY(1)}100%{transform:scaleY(.55)}}",
    "#roarOv .eyeglow{animation:roarEye 1.2s ease-in-out infinite}",
    "@keyframes roarEye{0%,100%{opacity:.75}50%{opacity:1}}"
  ].join("");

  function injectCss() {
    if (document.getElementById("roarCss")) return;
    var st = document.createElement("style"); st.id = "roarCss"; st.textContent = CSS;
    document.head.appendChild(st);
  }

  // Original (copyright-free) dahadta sher — SVG
  function star(cx, cy, ro, ri, n, rot) {
    var d = "";
    for (var i = 0; i < n * 2; i++) {
      var a = rot + i * Math.PI / n, r = (i % 2 === 0) ? ro : ri;
      d += (i ? "L" : "M") + (cx + Math.cos(a) * r).toFixed(1) + " " + (cy + Math.sin(a) * r).toFixed(1);
    }
    return d + "Z";
  }
  function lionSVG() {
    return '<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">' +
      '<defs>' +
        '<radialGradient id="rlFace" cx="50%" cy="42%" r="62%"><stop offset="0" stop-color="#ffd27a"/><stop offset=".7" stop-color="#e29a2c"/><stop offset="1" stop-color="#b9701a"/></radialGradient>' +
        '<radialGradient id="rlGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff3a0"/><stop offset="1" stop-color="#ffb300"/></radialGradient>' +
        '<linearGradient id="rlMane1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a4a05"/><stop offset="1" stop-color="#4b2200"/></linearGradient>' +
        '<linearGradient id="rlMane2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d98a12"/><stop offset="1" stop-color="#8f4c06"/></linearGradient>' +
        '<linearGradient id="rlMane3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc247"/><stop offset="1" stop-color="#c8741a"/></linearGradient>' +
      '</defs>' +
      '<g class="m1"><path d="' + star(150, 150, 146, 104, 16, 0.1) + '" fill="url(#rlMane1)"/></g>' +
      '<g class="m2"><path d="' + star(150, 150, 128, 92, 15, 0.35) + '" fill="url(#rlMane2)"/></g>' +
      '<g class="m3"><path d="' + star(150, 150, 110, 80, 14, 0.6) + '" fill="url(#rlMane3)"/></g>' +
      // ears
      '<circle cx="92" cy="96" r="20" fill="#b9701a"/><circle cx="92" cy="96" r="11" fill="#5a2a05"/>' +
      '<circle cx="208" cy="96" r="20" fill="#b9701a"/><circle cx="208" cy="96" r="11" fill="#5a2a05"/>' +
      // face
      '<ellipse cx="150" cy="158" rx="64" ry="72" fill="url(#rlFace)"/>' +
      // forehead wrinkles (growl)
      '<path d="M138 92 L144 122 M150 88 L150 120 M162 92 L156 122" stroke="#b86a10" stroke-width="3.5" stroke-linecap="round" fill="none"/>' +
      // eyes
      '<path d="M98 128 Q120 112 142 130 Q120 140 98 128Z" fill="url(#rlGlow)" class="eyeglow"/>' +
      '<path d="M202 128 Q180 112 158 130 Q180 140 202 128Z" fill="url(#rlGlow)" class="eyeglow"/>' +
      '<ellipse cx="121" cy="129" rx="4" ry="8" fill="#1a0a00"/><ellipse cx="179" cy="129" rx="4" ry="8" fill="#1a0a00"/>' +
      // angry brows
      '<path d="M94 116 L144 136" stroke="#3a1a00" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M206 116 L156 136" stroke="#3a1a00" stroke-width="9" stroke-linecap="round"/>' +
      // muzzle + nose
      '<ellipse cx="150" cy="180" rx="40" ry="27" fill="#f3c777"/>' +
      '<path d="M130 152 Q150 143 170 152 Q165 170 150 174 Q135 170 130 152Z" fill="#4a2200"/>' +
      // open mouth (roar)
      '<g class="mouth">' +
        '<path d="M110 186 Q150 176 190 186 Q182 238 150 244 Q118 238 110 186Z" fill="#5a0f0f"/>' +
        '<path d="M128 214 Q150 204 172 214 Q165 238 150 240 Q135 238 128 214Z" fill="#e0607a"/>' +
        '<path d="M123 186 L135 186 L129 210Z M165 186 L177 186 L171 210Z" fill="#fffdf2"/>' +
        '<path d="M128 240 L137 240 L132 222Z M163 240 L172 240 L168 222Z" fill="#fffdf2"/>' +
      '</g>' +
      '<path d="M150 174 L150 186" stroke="#4a2200" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M110 186 Q130 190 150 184 Q170 190 190 186" stroke="#4a2200" stroke-width="4" fill="none" stroke-linecap="round"/>' +
    '</svg>';
  }
  function lionHTML(opts) {
    var m = opts && opts.media;
    if (m) {
      if (/\.(mp4|webm|mov)(\?|$)/i.test(m)) return '<video src="' + m + '" autoplay muted playsinline loop></video>';
      return '<img src="' + m + '" alt="">';
    }
    return lionSVG();
  }

  // Sound: synthesized roar (koi audio file nahi chahiye)
  function playRoar() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      var ctx = new AC(), t0 = ctx.currentTime + 0.95, dur = 1.8;
      var master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      master.gain.setValueAtTime(0.0001, t0);
      master.gain.exponentialRampToValueAtTime(0.9, t0 + 0.12);
      master.gain.setValueAtTime(0.9, t0 + 0.9);
      master.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      // growl: low sawtooth with fast tremolo
      var osc = ctx.createOscillator(); osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, t0);
      osc.frequency.exponentialRampToValueAtTime(95, t0 + 0.5);
      osc.frequency.exponentialRampToValueAtTime(60, t0 + dur);
      var trem = ctx.createGain(); trem.gain.value = 0.6;
      var lfo = ctx.createOscillator(); lfo.frequency.value = 26;
      var lfoG = ctx.createGain(); lfoG.gain.value = 0.4; lfo.connect(lfoG); lfoG.connect(trem.gain);
      var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t0); lp.frequency.exponentialRampToValueAtTime(250, t0 + dur);
      osc.connect(trem); trem.connect(lp); lp.connect(master);
      // breath / rasp: filtered noise
      var len = ctx.sampleRate * dur, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
      var ns = ctx.createBufferSource(); ns.buffer = buf;
      var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 420; bp.Q.value = 0.7;
      var ng = ctx.createGain(); ng.gain.value = 0.55;
      ns.connect(bp); bp.connect(ng); ng.connect(master);
      osc.start(t0); lfo.start(t0); ns.start(t0);
      osc.stop(t0 + dur); lfo.stop(t0 + dur); ns.stop(t0 + dur);
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, (dur + 1.2) * 1000);
    } catch (e) {}
  }

  // Gold sparks
  function sparks(canvas, startDelay) {
    var ctx = canvas.getContext("2d"), W, H, P = [], run = true;
    function size() { W = canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1); H = canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1); }
    size();
    function burst() {
      for (var i = 0; i < 110; i++) {
        var a = Math.random() * Math.PI * 2, sp = (2 + Math.random() * 7) * (window.devicePixelRatio || 1);
        P.push({ x: W / 2, y: H * 0.40, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5, life: 1, r: (1 + Math.random() * 3) * (window.devicePixelRatio || 1), h: 38 + Math.random() * 20 });
      }
    }
    setTimeout(burst, startDelay); setTimeout(burst, startDelay + 900);
    (function loop() {
      if (!run) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.vx *= 0.985; p.life -= 0.012;
        if (p.life <= 0) { P.splice(i, 1); continue; }
        ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = "hsl(" + p.h + ",100%,60%)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    })();
    return function () { run = false; };
  }

  window.showRoarWelcome = function (opts) {
    opts = opts || {};
    if (document.getElementById("roarOv")) return;
    injectCss();
    var ov = document.createElement("div"); ov.id = "roarOv"; ov.className = "flash";
    var name = opts.name ? String(opts.name).replace(/[<>&]/g, "") : "";
    ov.innerHTML =
      '<canvas></canvas>' +
      '<div class="stage"><div class="ring"></div><div class="ring r2"></div><div class="ring r3"></div><div class="lion">' + lionHTML(opts) + '</div></div>' +
      '<div class="t1">WELCOME TO</div>' +
      '<div class="t2">5 BROTHER\u2019S<br>FITNESS CLUB</div>' +
      '<div class="t3">शेर बनकर आए हैं, दहाड़ते हुए जाएँगे! 🔥</div>' +
      (name ? '<div class="nm">💪 ' + name + '</div>' : '') +
      '<div class="tap">बंद करने के लिए टैप करें</div>';
    document.body.appendChild(ov);

    var stopSparks = sparks(ov.querySelector("canvas"), 950);
    if (opts.sound !== false) playRoar();
    try { if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 260, 80, 260]); } catch (e) {}

    var closed = false;
    function close() {
      if (closed) return; closed = true;
      ov.classList.add("out");
      setTimeout(function () { stopSparks(); if (ov.parentNode) ov.parentNode.removeChild(ov); if (typeof opts.onDone === "function") opts.onDone(); }, 460);
    }
    ov.addEventListener("click", close);
    setTimeout(close, opts.duration || 5200);
  };
})();
