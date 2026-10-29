'use strict';
{
  // ===========================================================================
  // Town Library, game 1: Letter Detective (learn: first sounds, CVC words, missing vowels).
  // A bookworm nibbled letters out of Miss Whiskers' picture cards. Each case shows a hand-drawn
  // picture and its word with blanks, plus a sound clue ("starts with buh"). The missing letters
  // are hiding around the cosy library in invisible ink: sweep the magnifying glass over the
  // bookshelves, armchair, globe, lamp and sleeping cat to reveal them, tap to collect, then drag
  // (or tap, then tap the word) a letter into the blank. Decoy letters hide too, so listen!
  // When the word is complete it is sounded out ("kuh... ah... tuh... cat!") and the picture
  // comes alive.
  //   tier 1: 3-letter words, the first (or last) letter missing, one decoy
  //   tier 2: 3-letter words, first AND last letters missing, one decoy
  //   tier 3: missing vowels (two decoy vowels) and 4-letter words with two letters missing
  // Keys: arrows move the glass, space collects, 1-4 put a found letter in the next blank.
  // ===========================================================================
  const TAU = Math.PI * 2;
  const SND = { b: 'buh', c: 'kuh', d: 'duh', f: 'fuh', g: 'guh', h: 'huh', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm', n: 'nnn', p: 'puh', r: 'rrr', s: 'sss', t: 'tuh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz', a: 'aah', e: 'eh', i: 'ih', o: 'aw', u: 'uh', sh: 'shh', ck: 'kuh' };
  const VOWELS = ['a', 'e', 'i', 'o', 'u'];
  const DECOY_CONS = ['b', 'd', 'f', 'g', 'h', 'j', 'l', 'm', 'n', 'p', 'r', 's', 't', 'w', 'z'];
  const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);
  const E = (x, y, rx, ry = rx, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); return p; };
  const R = (x, y, w, h, r = 4) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
  // outline every shape first, then fill them all, so overlapping parts read as one shape
  function grp(list, lw = 3) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2;
    for (const [p] of list) ctx.stroke(p);
    for (const [p, f] of list) { ctx.fillStyle = f; ctx.fill(p); }
  }
  function line(path, col, w, outline = true) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (outline) { ctx.strokeStyle = OL; ctx.lineWidth = w + 5; ctx.stroke(path); }
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(path);
  }
  const curve = (...pts) => { const p = new Path2D(); p.moveTo(pts[0], pts[1]); if (pts.length === 6) p.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); else if (pts.length === 8) p.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]); else p.lineTo(pts[2], pts[3]); return p; };
  function eye(x, y, r, shut = false) {
    if (shut) { ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y - r * 0.2, r, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); return; }
    ctx.fillStyle = '#2a1838'; circle(x, y, r);
    ctx.fillStyle = '#fff'; circle(x - r * 0.3, y - r * 0.35, r * 0.38);
  }
  function smile(x, y, r, open = false) {
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, 0.15 * Math.PI, 0.85 * Math.PI);
    if (open) { ctx.closePath(); ctx.fillStyle = '#c83a5a'; ctx.fill(); }
    ctx.stroke();
  }
  const cheeks = (x1, x2, y, r = 5) => { ctx.fillStyle = 'rgba(255,110,150,.45)'; circle(x1, y, r); circle(x2, y, r); };
  const blinkShut = seed => ((S.t + seed) % 3.7) < 0.12;

  // --- the word pictures (each drawn around (0,0), ~110px tall; a = seconds since it came alive, or -1) ---
  const ART = {
    cat(a) {
      const live = a >= 0, sw = Math.sin(S.t * (live ? 9 : 2)) * (live ? 0.5 : 0.2);
      const st = live ? 1 + Math.sin(Math.min(a, 1.2) / 1.2 * Math.PI) * 0.12 : 1;
      ctx.save(); ctx.scale(1, st); ctx.translate(0, (1 - st) * 40);
      line(curve(24, 40, 56, 30 + sw * 10, 50 + sw * 20, -10, 36 + sw * 30, -18), '#ff9b3d', 9);
      const ear = s => { const p = new Path2D(); p.moveTo(s * 10, -34); p.lineTo(s * 26, -60); p.lineTo(s * 30, -26); p.closePath(); return p; };
      grp([[E(0, 26, 34, 28), '#ffa64d'], [ear(-1), '#ffa64d'], [ear(1), '#ffa64d'], [E(0, -18, 30, 26), '#ffa64d'], [E(-16, 50, 10, 7), '#ffe2c2'], [E(16, 50, 10, 7), '#ffe2c2']]);
      ctx.fillStyle = '#ffd0d8'; tri(-14, -36, -24, -54, -26, -30); tri(14, -36, 24, -54, 26, -30);
      ctx.fillStyle = '#e07a26'; for (const x of [-8, 0, 8]) ellipse(x, -40, 2.5, 6);
      ctx.fillStyle = '#ffe2c2'; ellipse(0, 30, 18, 18);
      const shut = !live && blinkShut(0.3);
      eye(-11, -20, 5, shut || (live && a < 0.6)); eye(11, -20, 5, shut || (live && a < 0.6));
      ctx.fillStyle = '#ff7aa8'; tri(-4, -10, 4, -10, 0, -6);
      smile(-4, -8, 4); smile(4, -8, 4); cheeks(-20, 20, -8);
      ctx.strokeStyle = OL; ctx.lineWidth = 1.8;
      for (const s of [-1, 1]) for (const dy of [-2, 3]) { ctx.beginPath(); ctx.moveTo(s * 14, -8 + dy); ctx.lineTo(s * 34, -10 + dy * 2); ctx.stroke(); }
      ctx.restore();
    },
    dog(a) {
      const live = a >= 0, wag = Math.sin(S.t * (live ? 16 : 3)) * (live ? 0.6 : 0.25), hop = live ? -Math.abs(Math.sin(a * 6)) * 8 * Math.max(0, 1 - a / 3) : 0;
      ctx.save(); ctx.translate(0, hop);
      line(curve(26, 34, 48, 26, 52 + wag * 20, 2 - wag * 6), '#c98a52', 8);
      const ear = s => { const p = new Path2D(); p.moveTo(s * 18, -40); p.bezierCurveTo(s * 40, -44, s * 42, -10, s * 30, -2); p.bezierCurveTo(s * 22, 2, s * 16, -20, s * 18, -40); return p; };
      grp([[E(0, 28, 30, 28), '#e0a86a'], [E(0, -18, 30, 27), '#e0a86a'], [ear(-1), '#8a5a3a'], [ear(1), '#8a5a3a'], [E(-14, 52, 10, 7), '#f6dcc0'], [E(14, 52, 10, 7), '#f6dcc0']]);
      ctx.fillStyle = '#f6dcc0'; ellipse(0, -6, 16, 12); ellipse(0, 32, 15, 17);
      ctx.fillStyle = '#8a5a3a'; ellipse(14, -24, 8, 7);
      eye(-10, -22, 5, blinkShut(1.1)); eye(10, -22, 5, blinkShut(1.1));
      ctx.fillStyle = '#2a1838'; ellipse(0, -11, 6, 4.5);
      smile(-4, -6, 4); smile(4, -6, 4);
      if (live) { ctx.fillStyle = '#ff7a9a'; ellipse(2, 0 + Math.sin(S.t * 12) * 1.5, 5, 7); }
      cheeks(-20, 20, -8);
      ctx.fillStyle = '#ff6fb5'; ctx.fillRect(-20, 2, 40, 6); ctx.fillStyle = '#ffd23f'; circle(0, 10, 4);
      ctx.restore();
    },
    pig(a) {
      const live = a >= 0, hop = live ? -Math.abs(Math.sin(a * 5)) * 14 * Math.max(0, 1 - a / 3) : 0;
      ctx.save(); ctx.translate(0, hop);
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(40, 20, 8, Math.PI, TAU * 0.95); ctx.stroke();
      ctx.strokeStyle = '#ffa0c0'; ctx.lineWidth = 3; ctx.stroke();
      const ear = s => { const p = new Path2D(); p.moveTo(s * 10, -40); p.lineTo(s * 30, -54); p.lineTo(s * 30, -26); p.closePath(); return p; };
      grp([[E(0, 26, 38, 28), '#ffb6cf'], [ear(-1), '#ffb6cf'], [ear(1), '#ffb6cf'], [E(0, -14, 32, 28), '#ffb6cf'], [R(-26, 44, 12, 14, 4), '#ffb6cf'], [R(14, 44, 12, 14, 4), '#ffb6cf']]);
      grp([[E(0, -4, 13, 10), '#ff8fb2']], 2);
      ctx.fillStyle = '#c84a78'; ellipse(-5, -4, 2.6, 4); ellipse(5, -4, 2.6, 4);
      eye(-13, -22, 4.5, blinkShut(2)); eye(13, -22, 4.5, blinkShut(2));
      smile(0, 6, 7, live); cheeks(-22, 22, -8, 6);
      ctx.restore();
    },
    sun(a) {
      const live = a >= 0, grow = live ? 1 + 0.18 * Math.sin(Math.min(a, 1) * Math.PI) + 0.06 : 1;
      const rot = S.t * (live ? 0.9 : 0.25);
      ctx.save(); ctx.scale(grow, grow);
      if (live) { const gr = ctx.createRadialGradient(0, 0, 20, 0, 0, 80); gr.addColorStop(0, 'rgba(255,240,140,.9)'); gr.addColorStop(1, 'rgba(255,240,140,0)'); ctx.fillStyle = gr; circle(0, 0, 80); }
      const rays = new Path2D();
      for (let i = 0; i < 12; i++) { const an = rot + i * TAU / 12, r1 = 38, r2 = i % 2 ? 54 : 62; rays.moveTo(Math.cos(an - 0.16) * r1, Math.sin(an - 0.16) * r1); rays.lineTo(Math.cos(an) * r2, Math.sin(an) * r2); rays.lineTo(Math.cos(an + 0.16) * r1, Math.sin(an + 0.16) * r1); rays.closePath(); }
      grp([[rays, '#ffb13d'], [E(0, 0, 40), '#ffd84a']]);
      ctx.fillStyle = '#ffe98a'; ellipse(-12, -14, 12, 8, -0.5);
      if (live) { eye(-13, -6, 5, true); eye(13, -6, 5, true); } else { eye(-13, -6, 5, blinkShut(0.7)); eye(13, -6, 5, blinkShut(0.7)); }
      smile(0, 6, 12, live); cheeks(-24, 24, 8, 6);
      ctx.restore();
    },
    hat(a) {
      const live = a >= 0, tip = live ? Math.sin(Math.min(a, 1.4) / 1.4 * Math.PI) : 0;
      const peek = live ? ease((a - 0.3) / 0.6) : 0;
      if (peek > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(-60, -110, 120, 92); ctx.clip();
        const by = 4 - peek * 52;
        grp([[E(-10, by - 34, 7, 20, -0.15), '#fff'], [E(10, by - 34, 7, 20, 0.15), '#fff'], [E(0, by, 22, 19), '#fff']]);
        ctx.fillStyle = '#ffc0d8'; ellipse(-10, by - 34, 3, 13, -0.15); ellipse(10, by - 34, 3, 13, 0.15);
        eye(-8, by - 2, 3.5); eye(8, by - 2, 3.5); ctx.fillStyle = '#ff7aa8'; circle(0, by + 6, 3); cheeks(-14, 14, by + 6, 4);
        ctx.restore();
      }
      ctx.save(); ctx.translate(0, -tip * 26); ctx.rotate(-tip * 0.35);
      grp([[E(0, 34, 58, 14), '#5a4aa0'], [R(-34, -26, 68, 62, 8), '#5a4aa0']]);
      ctx.fillStyle = '#ff6fb5'; ctx.fillRect(-34, 14, 68, 14);
      ctx.fillStyle = '#7a6ac8'; ctx.fillRect(-26, -20, 10, 32);
      flowerDot(22, 20);
      ctx.restore();
      if (live && a < 2.5) for (let i = 0; i < 4; i++) star(Math.cos(S.t * 3 + i * 1.6) * 52, -40 + Math.sin(S.t * 3 + i * 1.6) * 18, 6, '#ffe36b', 5);
    },
    bug(a) {
      const live = a >= 0, open = live ? 0.25 + 0.15 * Math.sin(S.t * 30) : 0, fly = live ? Math.sin(a * 3) * 10 - 6 : 0;
      ctx.save(); ctx.translate(Math.sin(S.t * (live ? 2 : 0)) * 6, fly);
      ctx.strokeStyle = OL; ctx.lineWidth = 3.5;
      for (const s of [-1, 1]) for (const k of [-1, 0, 1]) { const w = live ? Math.sin(S.t * 14 + k) * 4 : 0; ctx.beginPath(); ctx.moveTo(s * 24, 10 + k * 14); ctx.lineTo(s * 44, 16 + k * 18 + w); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-8, -38); ctx.quadraticCurveTo(-16, -60, -26, -58); ctx.moveTo(8, -38); ctx.quadraticCurveTo(16, -60, 26, -58); ctx.stroke();
      ctx.fillStyle = '#2a1838'; circle(-26, -58, 4); circle(26, -58, 4);
      grp([[E(0, -30, 20, 16), '#3a2a48'], [E(0, 10, 34, 40), '#3a2a48']]);
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(0, -24); ctx.rotate(s * open);
        const w = new Path2D(); w.moveTo(0, 0); w.bezierCurveTo(s * 40, 0, s * 42, 50, s * 2, 62); w.closePath();
        grp([[w, '#ff4a4a']], 2.5);
        ctx.fillStyle = '#2a1838'; circle(s * 18, 16, 6); circle(s * 22, 38, 5); circle(s * 8, 48, 4);
        ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(s * 14, 6, 8, 4, s * 0.4);
        ctx.restore();
      }
      eye(-8, -32, 4.5); eye(8, -32, 4.5);
      ctx.restore();
    },
    bus(a) {
      const live = a >= 0, dx = live ? Math.sin(a * 2.4) * 16 : 0, bob = live ? Math.abs(Math.sin(S.t * 14)) * -2 : 0;
      ctx.save(); ctx.translate(dx, bob);
      if (live) { ctx.fillStyle = 'rgba(200,190,210,.7)'; for (let i = 0; i < 3; i++) circle(-66 - i * 9 - ((S.t * 40) % 9), 30 - i * 4, 6 - i); }
      grp([[R(-60, -40, 120, 74, 14), '#ffc93d'], [E(-34, 36, 13), '#3a2a48'], [E(34, 36, 13), '#3a2a48']]);
      for (let i = 0; i < 3; i++) grp([[R(-50 + i * 30, -30, 24, 24, 5), '#bfe6ff']], 2);
      grp([[R(40, -30, 14, 46, 4), '#bfe6ff']], 2);
      ctx.fillStyle = '#ff7a3d'; ctx.fillRect(-58, 6, 96, 7);
      ctx.fillStyle = '#fff6a8'; circle(55, 20, 5);
      ctx.fillStyle = '#ffe9a8'; ellipse(-40, -34, 16, 3);
      for (const x of [-34, 34]) { ctx.save(); ctx.translate(x, 36); ctx.rotate(live ? S.t * 10 : 0); ctx.fillStyle = '#c9c0d8'; circle(0, 0, 6); ctx.fillStyle = '#3a2a48'; ctx.fillRect(-1.5, -6, 3, 12); ctx.restore(); }
      ctx.restore();
    },
    cup(a) {
      const live = a >= 0;
      for (let i = 0; i < 3; i++) {
        const x = -16 + i * 16, p = new Path2D(), ph = S.t * (live ? 4 : 1.5) + i * 2;
        p.moveTo(x, -34); p.bezierCurveTo(x + Math.sin(ph) * 10, -48, x - Math.sin(ph) * 10, -60, x + Math.sin(ph + 1) * 6, -74);
        ctx.globalAlpha = 0.75; line(p, '#fff', 5, false); ctx.globalAlpha = 1;
      }
      if (live && a < 3) heart(0, -92 + Math.sin(S.t * 3) * 4, 26 * ease(a / 0.6), '#ff7aa8');
      const h = new Path2D(); h.arc(38, 6, 18, -Math.PI / 2, Math.PI / 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 15; ctx.stroke(h); ctx.strokeStyle = '#7fc8f0'; ctx.lineWidth = 9; ctx.stroke(h);
      const body = new Path2D(); body.moveTo(-40, -28); body.lineTo(40, -28); body.lineTo(34, 40); body.quadraticCurveTo(32, 48, 22, 48); body.lineTo(-22, 48); body.quadraticCurveTo(-32, 48, -34, 40); body.closePath();
      grp([[body, '#7fc8f0'], [E(0, 52, 46, 8), '#fff6fb']]);
      ctx.fillStyle = '#8a5a3a'; ellipse(0, -28, 38, 7);
      if (live) { const n = Math.min(3, Math.floor(a * 3)); for (let i = 0; i < n; i++) { ctx.fillStyle = '#fff'; ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-20 + i * 14, -36, 11, 9, 3); ctx.fill(); ctx.stroke(); } }
      heart(0, 0, 26, '#ff8fc8');
      eye(-14, 22, 3.5); eye(14, 22, 3.5); smile(0, 26, 6);
    },
    hen(a) {
      const live = a >= 0, peck = live ? Math.max(0, Math.sin(a * 9)) * Math.max(0, 1 - a / 2) : 0;
      if (live) { const k = ease((a - 0.4) / 0.7); if (k > 0) { grp([[E(-48 + k * 0, 46, 12, 15), '#fff3dc']], 2); } }
      const tail = new Path2D(); tail.moveTo(26, 0); tail.lineTo(56, -26); tail.lineTo(52, 4); tail.lineTo(60, 10); tail.lineTo(30, 30); tail.closePath();
      ctx.save(); ctx.translate(0, 0);
      ctx.strokeStyle = OL; ctx.lineWidth = 4; for (const x of [-10, 10]) { ctx.beginPath(); ctx.moveTo(x, 44); ctx.lineTo(x, 58); ctx.lineTo(x + 6, 60); ctx.stroke(); }
      ctx.strokeStyle = '#ffa63d'; ctx.lineWidth = 2; for (const x of [-10, 10]) { ctx.beginPath(); ctx.moveTo(x, 44); ctx.lineTo(x, 58); ctx.stroke(); }
      ctx.save(); ctx.translate(-14, -14); ctx.rotate(-peck * 0.5); ctx.translate(14, 14);
      const comb = new Path2D(); comb.moveTo(-26, -40); comb.bezierCurveTo(-30, -60, -18, -60, -16, -48); comb.bezierCurveTo(-14, -62, 0, -62, -2, -44); comb.closePath();
      const beak = new Path2D(); beak.moveTo(-40, -26); beak.lineTo(-56, -20); beak.lineTo(-40, -14); beak.closePath();
      grp([[tail, '#fffaf0'], [E(0, 14, 40, 32), '#fffaf0'], [E(-22, -24, 22, 22), '#fffaf0'], [comb, '#ff4a5a'], [beak, '#ffb13d'], [E(-36, -8, 5, 8), '#ff4a5a']]);
      ctx.restore();
      ctx.fillStyle = '#efe0c8'; ellipse(8, 14, 22, 14, -0.3);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(8, 10, 16, 0.2, 2.4); ctx.stroke();
      eye(-26 - peck * 4, -28 + peck * 6, 4.5, blinkShut(0.4)); cheeks(-18, -18, -18, 4);
      ctx.restore();
    },
    fox(a) {
      const live = a >= 0, sw = Math.sin(S.t * (live ? 8 : 2)) * (live ? 0.35 : 0.12);
      ctx.save(); ctx.translate(30, 40); ctx.rotate(sw);
      const tail = new Path2D(); tail.moveTo(0, 0); tail.bezierCurveTo(30, 0, 44, -30, 30, -60); tail.bezierCurveTo(20, -40, 6, -20, -6, -12); tail.closePath();
      grp([[tail, '#ff8a3a']]); ctx.fillStyle = '#fff'; ctx.save(); ctx.clip(tail); circle(32, -62, 16); ctx.restore();
      ctx.restore();
      const ear = s => { const p = new Path2D(); p.moveTo(s * 8, -40); p.lineTo(s * 28, -66); p.lineTo(s * 32, -28); p.closePath(); return p; };
      const head = new Path2D(); head.moveTo(-34, -30); head.quadraticCurveTo(-30, -52, 0, -50); head.quadraticCurveTo(30, -52, 34, -30); head.quadraticCurveTo(26, -4, 0, 4); head.quadraticCurveTo(-26, -4, -34, -30); head.closePath();
      grp([[E(0, 30, 28, 30), '#ff8a3a'], [ear(-1), '#ff8a3a'], [ear(1), '#ff8a3a'], [head, '#ff8a3a'], [E(-12, 56, 9, 6), '#3a2a48'], [E(12, 56, 9, 6), '#3a2a48']]);
      ctx.fillStyle = '#3a2a48'; tri(-14, -40, -24, -58, -27, -32); tri(14, -40, 24, -58, 27, -32);
      ctx.fillStyle = '#fff'; ellipse(0, 32, 15, 20);
      ctx.save(); ctx.clip(head); ctx.fillStyle = '#fff'; ellipse(-18, -8, 16, 12); ellipse(18, -8, 16, 12); ctx.restore();
      eye(-12, -24, 4.5, live && Math.sin(a * 2) > 0.6); eye(12, -24, 4.5, blinkShut(1.7));
      ctx.fillStyle = '#2a1838'; ellipse(0, -6, 5, 4);
      smile(0, -2, 5); cheeks(-22, 22, -12, 4);
    },
    fish(a) {
      const live = a >= 0, sx = live ? Math.sin(a * 1.6) * 22 : 0, sy = Math.sin(S.t * (live ? 4 : 1.5)) * (live ? 10 : 3), wig = Math.sin(S.t * (live ? 14 : 4)) * 0.25;
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2;
      for (let i = 0; i < (live ? 5 : 2); i++) { const by = 30 - ((S.t * 30 + i * 22) % 100); ctx.beginPath(); ctx.arc(-40 + sx + i * 7 + Math.sin(by * 0.1) * 4, by, 3 + (i % 3), 0, TAU); ctx.stroke(); }
      ctx.save(); ctx.translate(sx, sy); ctx.scale(live && Math.cos(a * 1.6) < 0 ? -1 : 1, 1);
      ctx.save(); ctx.translate(30, 0); ctx.rotate(wig);
      const tail = new Path2D(); tail.moveTo(0, 0); tail.lineTo(30, -24); tail.quadraticCurveTo(22, 0, 30, 24); tail.closePath();
      ctx.restore();
      const t2 = new DOMMatrix().translate(30, 0).rotate(wig * 57.3); const tp = new Path2D(); tp.addPath(tail, t2);
      const fin = new Path2D(); fin.moveTo(-10, -26); fin.quadraticCurveTo(4, -48, 18, -24); fin.closePath();
      grp([[tp, '#4fb0f0'], [fin, '#4fb0f0'], [E(0, 0, 40, 28), '#ffa040']]);
      ctx.save(); ctx.clip(E(0, 0, 40, 28)); ctx.fillStyle = '#ffd25a'; ellipse(0, 14, 40, 14); ctx.fillStyle = '#ff7a2a'; for (const x of [-4, 10]) { ctx.fillRect(x, -30, 6, 60); } ctx.restore();
      eye(-20, -6, 6); smile(-28, 8, 4); cheeks(-14, -14, 6, 4);
      ctx.restore();
    },
    frog(a) {
      const live = a >= 0, hop = live ? -Math.max(0, Math.sin(a * 4)) * 26 * Math.max(0, 1 - a / 3) : 0;
      ctx.fillStyle = 'rgba(60,160,90,.35)'; ellipse(0, 54, 54, 8);
      ctx.save(); ctx.translate(0, hop);
      grp([[E(-34, 40, 18, 10), '#6fd36a'], [E(34, 40, 18, 10), '#6fd36a'], [E(0, 14, 44, 34), '#6fd36a'], [E(-22, -20, 16), '#6fd36a'], [E(22, -20, 16), '#6fd36a']]);
      ctx.fillStyle = '#c8f2a8'; ellipse(0, 24, 28, 20);
      ctx.fillStyle = '#fff'; circle(-22, -22, 10); circle(22, -22, 10);
      eye(-22, -22, 6, blinkShut(2.4)); eye(22, -22, 6, blinkShut(2.4));
      smile(0, 2, 18); cheeks(-28, 28, 6, 6);
      if (live && a % 1.6 < 0.25) { ctx.strokeStyle = '#ff6a8a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, 40); ctx.stroke(); }
      ctx.restore();
    },
    duck(a) {
      const live = a >= 0, bob = Math.sin(S.t * (live ? 6 : 2)) * (live ? 5 : 2), tilt = live ? Math.sin(a * 5) * 0.15 : 0;
      ctx.save(); ctx.translate(0, bob); ctx.rotate(tilt);
      const body = new Path2D(); body.moveTo(-42, 12); body.quadraticCurveTo(-40, 46, 0, 46); body.quadraticCurveTo(44, 46, 46, 8); body.lineTo(56, -6); body.quadraticCurveTo(40, -4, 28, 4); body.quadraticCurveTo(0, -4, -42, 12); body.closePath();
      const beak = new Path2D(); beak.moveTo(-42, -24); beak.quadraticCurveTo(-66, -26, -64, -14); beak.quadraticCurveTo(-56, -8, -40, -12); beak.closePath();
      grp([[body, '#ffd83a'], [E(-24, -24, 22, 21), '#ffd83a'], [beak, '#ff9a2a']]);
      ctx.fillStyle = '#ffc21a'; ellipse(10, 22, 22, 12, -0.3);
      eye(-26, -30, 4.5, blinkShut(0.9)); cheeks(-16, -16, -18, 4);
      ctx.restore();
      ctx.fillStyle = '#6ac8f0'; ctx.fillRect(-70, 42, 140, 18);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath();
      for (let x = -66; x < 66; x += 22) { ctx.moveTo(x, 46 + Math.sin(S.t * 3 + x) * 2); ctx.quadraticCurveTo(x + 6, 41, x + 12, 46); } ctx.stroke();
    },
    drum(a) {
      const live = a >= 0, hitL = live ? Math.max(0, Math.sin(S.t * 12)) : 0, hitR = live ? Math.max(0, Math.sin(S.t * 12 + Math.PI)) : 0;
      ctx.save(); ctx.translate(0, live ? -Math.max(hitL, hitR) * 3 : 0);
      grp([[R(-46, -20, 92, 60, 10), '#ff5a6a'], [E(0, -20, 46, 13), '#fff6e8'], [E(0, 40, 46, 13), '#ff5a6a']]);
      ctx.fillStyle = '#fff6e8'; ellipse(0, -20, 40, 9);
      ctx.strokeStyle = '#ffe36b'; ctx.lineWidth = 4; ctx.beginPath();
      for (let i = 0; i <= 6; i++) { const x = -42 + i * 14; ctx.lineTo(x, i % 2 ? 30 : -6); } ctx.stroke();
      ctx.restore();
      for (const [s, h] of [[-1, hitL], [1, hitR]]) {
        ctx.save(); ctx.translate(s * 50, -66); ctx.rotate(s * (-0.5 + h * 0.5));
        line(curve(0, 0, -s * 16, 36), '#d8a060', 6); grp([[E(-s * 18, 40, 7), '#fff']], 2);
        ctx.restore();
      }
      if (live) for (let i = 0; i < 2; i++) { const k = (S.t * 0.8 + i * 0.5) % 1; ctx.globalAlpha = 1 - k; text(i ? '♪' : '♫', (i ? 40 : -44) + k * 10 * (i ? 1 : -1), -60 - k * 40, 22, '#9a6ae0', 'center', 700); ctx.globalAlpha = 1; }
    },
    nest(a) {
      const live = a >= 0, k = live ? ease((a - 0.2) / 0.6) : 0;
      // eggs
      grp([[E(-24, 8, 15, 19), '#a8dcff'], [E(24, 8, 15, 19), '#a8dcff']], 2.5);
      if (k > 0) {
        const cy = 4 - k * 18;
        grp([[E(0, cy, 20, 18), '#ffe14a'], [E(0, cy - 20, 15, 14), '#ffe14a']], 2.5);
        ctx.fillStyle = '#ff9a2a'; tri(-5, cy - 18, 5, cy - 18, 0, cy - 10 + Math.sin(S.t * 16) * 2);
        eye(-6, cy - 23, 3); eye(6, cy - 23, 3);
        ctx.fillStyle = '#ffd80a'; ellipse(-18, cy, 6, 9, 0.6 + Math.sin(S.t * 18) * 0.4); ellipse(18, cy, 6, 9, -0.6 - Math.sin(S.t * 18) * 0.4);
        // the cracked shell bottom
        const sh = new Path2D(); sh.moveTo(-17, 6); for (let i = 0; i <= 6; i++) sh.lineTo(-17 + i * 5.7, i % 2 ? 0 : 6); sh.lineTo(17, 18); sh.quadraticCurveTo(0, 32, -17, 18); sh.closePath();
        grp([[sh, '#a8dcff']], 2.5);
      } else {
        grp([[E(0, 2, 16, 21), '#a8dcff']], 2.5);
        if (live) { ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-4, -6); ctx.lineTo(2, 0); ctx.lineTo(8, -6); ctx.stroke(); }
      }
      ctx.fillStyle = '#fff'; for (const x of [-28, 20]) ellipse(x, 0, 4, 6, -0.4);
      const nest = new Path2D(); nest.moveTo(-58, 12); nest.quadraticCurveTo(-54, 52, 0, 52); nest.quadraticCurveTo(54, 52, 58, 12); nest.quadraticCurveTo(0, 30, -58, 12); nest.closePath();
      grp([[nest, '#b07a46']]);
      ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-50 + i * 15, 22 + (i % 2) * 6); ctx.quadraticCurveTo(-40 + i * 15, 36, -30 + i * 15, 26 + (i % 3) * 5); ctx.stroke(); }
    },
    crab(a) {
      const live = a >= 0, dx = live ? Math.sin(a * 4) * 16 : 0, snap = live ? Math.abs(Math.sin(S.t * 10)) : 0.2;
      ctx.save(); ctx.translate(dx, 0);
      ctx.strokeStyle = OL; ctx.lineWidth = 4;
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const w = live ? Math.sin(S.t * 16 + k * 2) * 4 : 0; ctx.beginPath(); ctx.moveTo(s * 30, 20 + k * 6); ctx.lineTo(s * (46 + k * 4), 34 + k * 8 + w); ctx.lineTo(s * (50 + k * 4), 48 + k * 4 + w); ctx.stroke(); }
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10, -10); ctx.lineTo(s * 14, -34); ctx.stroke(); }
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 46, -18);
        const up = new Path2D(); up.moveTo(0, 6); up.bezierCurveTo(s * 6, -24, s * 26, -22, s * 22, -6); up.closePath();
        const lo = new Path2D(); lo.moveTo(0, 6); lo.bezierCurveTo(s * 10, 4 + snap * 8, s * 22, 4 + snap * 4, s * 22, -4 + snap * 6); lo.closePath();
        line(curve(-s * 18, 26, -s * 6, 14, 0, 6), '#ff5a4a', 7);
        grp([[up, '#ff5a4a'], [lo, '#ff5a4a']], 2.5);
        ctx.restore();
      }
      grp([[E(0, 12, 38, 26), '#ff5a4a'], [E(-14, -36, 9), '#fff'], [E(14, -36, 9), '#fff']]);
      eye(-14, -36, 5, blinkShut(3.1)); eye(14, -36, 5, blinkShut(3.1));
      ctx.fillStyle = '#ff8a7a'; ellipse(-12, 4, 6, 4); ellipse(14, 10, 5, 3);
      smile(0, 14, 10); cheeks(-24, 24, 18, 5);
      ctx.restore();
    },
  };
  function flowerDot(x, y) { ctx.fillStyle = '#fff'; for (let i = 0; i < 5; i++) circle(x + Math.cos(i * TAU / 5) * 4, y + Math.sin(i * TAU / 5) * 4, 3.4); ctx.fillStyle = '#ffd23f'; circle(x, y, 2.6); }

  // the case words. ph = phoneme chunks (for sounding out), say = how the picture is introduced
  const CVC = [
    { w: 'cat', say: 'A cat' }, { w: 'dog', say: 'A dog' }, { w: 'pig', say: 'A pig' }, { w: 'sun', say: 'The sun' },
    { w: 'hat', say: 'A hat' }, { w: 'bug', say: 'A bug' }, { w: 'bus', say: 'A bus' }, { w: 'cup', say: 'A cup' },
    { w: 'hen', say: 'A hen' }, { w: 'fox', say: 'A fox' },
  ].map(o => ({ ...o, ph: [...o.w] }));
  const FOUR = [
    { w: 'fish', say: 'A fish', ph: ['f', 'i', 'sh'], blanks: [0, 1] },
    { w: 'frog', say: 'A frog', ph: ['f', 'r', 'o', 'g'], blanks: [0, 2] },
    { w: 'duck', say: 'A duck', ph: ['d', 'u', 'ck'], blanks: [0, 1] },
    { w: 'drum', say: 'A drum', ph: ['d', 'r', 'u', 'm'], blanks: [0, 2] },
    { w: 'nest', say: 'A nest', ph: ['n', 'e', 's', 't'], blanks: [1, 3] },
    { w: 'crab', say: 'A crab', ph: ['c', 'r', 'a', 'b'], blanks: [0, 2] },
  ];
  const ROUNDS = { 1: 4, 2: 4, 3: 5 };
  // which phoneme chunk each letter index belongs to
  const chunkOf = (word, i) => { let n = 0; for (let k = 0; k < word.ph.length; k++) { n += word.ph[k].length; if (i < n) return k; } return word.ph.length - 1; };
  const soundAt = (word, i) => { const c = word.ph[chunkOf(word, i)]; return SND[c.length > 1 && c !== 'sh' && c !== 'ck' ? word.w[i] : c] || SND[word.w[i]]; };
  function clueFor(word, blanks) {
    const parts = blanks.map(i => {
      const s = soundAt(word, i);
      if (i === 0) return { txt: `starts with “${s}”`, say: `starts with ${s}` };
      if (i === word.w.length - 1) return { txt: `ends with “${s}”`, say: `ends with ${s}` };
      return { txt: `“${s}” in the middle`, say: `has ${s} in the middle` };
    });
    const txt = parts.map(p => p.txt).join(', ');
    const say = parts.map(p => p.say).join(', and ');
    return { txt: txt[0].toUpperCase() + txt.slice(1), say };
  }
  function makeCases(tier) {
    const n = ROUNDS[tier], cases = [], cvc = shuffle([...CVC]), four = shuffle([...FOUR]);
    for (let r = 0; r < n; r++) {
      let word, blanks, decoys = [];
      const used = new Set();
      if (tier === 1) {
        word = cvc[r]; blanks = [r === n - 1 ? 2 : 0];
      } else if (tier === 2) {
        word = cvc[r]; blanks = [0, 2];
      } else if (r % 2 === 0) {
        word = cvc[r]; blanks = [1];
      } else {
        word = four[r]; blanks = word.blanks;
      }
      [...word.w].forEach(l => used.add(l)); used.add('c'); used.add('k');
      if (tier === 3 && blanks.length === 1) decoys = shuffle(VOWELS.filter(v => !used.has(v))).slice(0, 2);
      else if (tier === 3) decoys = [pick(VOWELS.filter(v => !used.has(v)))];
      else decoys = [pick(DECOY_CONS.filter(c => !used.has(c)))];
      cases.push({ word, blanks, decoys, clue: clueFor(word, blanks) });
    }
    return cases;
  }

  // --- the library ------------------------------------------------------------------
  const CARD = { x: 250, y: 66, w: 460, h: 170 };
  const PIC = { x: 264, y: 78, w: 140, h: 146, cx: 334, cy: 154 };
  const WORD = { cx: 558, y: 84, h: 78 };
  const TRAY = { cx: 480, y: 246, h: 68 };
  const TILE_W = 54, TILE_H = 60;
  const SPOTS = [
    { x: 96, y: 124, prop: 'shelfL', name: 'the bookshelf' },
    { x: 176, y: 300, prop: 'shelfL', name: 'the bookshelf' },
    { x: 66, y: 392, prop: 'shelfL', name: 'the bookshelf' },
    { x: 800, y: 124, prop: 'shelfR', name: 'the bookshelf' },
    { x: 876, y: 214, prop: 'shelfR', name: 'the bookshelf' },
    { x: 318, y: 404, prop: 'chair', name: 'the armchair' },
    { x: 452, y: 360, prop: 'globe', name: 'the globe' },
    { x: 560, y: 344, prop: 'lamp', name: 'the lamp' },
    { x: 672, y: 470, prop: 'cat', name: 'the sleepy cat' },
  ];
  const PROPS = {
    shelfL: { x: 18, y: 62, w: 212, h: 406 },
    shelfR: { x: 732, y: 62, w: 210, h: 330 },
    chair: { x: 244, y: 330, w: 150, h: 160 },
    globe: { x: 406, y: 320, w: 92, h: 170 },
    lamp: { x: 512, y: 296, w: 96, h: 196 },
    cat: { x: 610, y: 444, w: 124, h: 64 },
  };
  const BOOKS = ['#ff7eb6', '#4fa8f5', '#ffd23f', '#5fca62', '#a77bff', '#ff9a4a', '#50d0c0', '#e85a6a', '#8a7ae0'];
  function seeded(n) { let s = n * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }
  function shelfBooks(seed, x0, w, n) {
    const r = seeded(seed), out = [];
    let x = x0 + 6;
    while (x < x0 + w - 18) {
      const bw = 12 + Math.floor(r() * 12), bh = 50 + Math.floor(r() * 26), lean = r() < 0.12 ? 0.18 : 0;
      if (r() < 0.12 && out.length) { x += 18; continue; } // a gap
      out.push({ x, bw, bh, lean, c: BOOKS[Math.floor(r() * BOOKS.length)], band: r() < 0.5 });
      x += bw + 1 + lean * 40;
      if (out.length >= n) break;
    }
    return out;
  }
  const SHELF_ROWS = y0 => [y0 + 96, y0 + 186, y0 + 276, y0 + 366];
  const shelfCache = {};
  function drawShelf(key, P, poke) {
    const rows = key === 'shelfL' ? SHELF_ROWS(P.y) : [P.y + 96, P.y + 186, P.y + 276];
    ctx.fillStyle = 'rgba(70,30,40,.18)'; ctx.fillRect(P.x + 8, P.y + 8, P.w, P.h);
    inkRect(P.x, P.y, P.w, P.h, '#a8663e', 3, 8);
    inkRect(P.x + 12, P.y + 12, P.w - 24, P.h - 24, '#6e3a2a', 2.5, 4);
    rows.forEach((by, ri) => {
      const books = (shelfCache[key + ri] ||= shelfBooks(ri * 7 + (key === 'shelfL' ? 1 : 50), P.x + 12, P.w - 24, 14));
      books.forEach((b, bi) => {
        const wig = poke > 0 && (bi + ri) % 3 === 0 ? Math.sin(poke * 30) * 0.12 * poke : 0;
        ctx.save(); ctx.translate(b.x + b.bw / 2, by); ctx.rotate(-b.lean + wig);
        inkRect(-b.bw / 2, -b.bh, b.bw, b.bh, b.c, 2, 2);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        if (b.band) { ctx.fillRect(-b.bw / 2 + 2, -b.bh + 8, b.bw - 4, 3); ctx.fillRect(-b.bw / 2 + 2, -14, b.bw - 4, 3); } else circle(0, -b.bh / 2, Math.min(3.5, b.bw / 4));
        ctx.restore();
      });
      inkRect(P.x + 8, by, P.w - 16, 12, '#c47e4c', 2.5, 3);
    });
    inkRect(P.x - 6, P.y - 6, P.w + 12, 16, '#c47e4c', 3, 5);
  }
  function drawLibrary(g) {
    const t = S.t;
    // wall: warm striped wallpaper, wainscot, wooden floor
    const wg = ctx.createLinearGradient(0, 0, 0, 470); wg.addColorStop(0, '#ffe7d2'); wg.addColorStop(1, '#ffd8c0');
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,170,190,.22)'; for (let x = 0; x < W; x += 48) ctx.fillRect(x, 0, 22, 330);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let x = 24; x < W; x += 48) for (let y = 30; y < 330; y += 60) heart(x + 11, y, 9, 'rgba(255,255,255,.4)');
    inkRect(-4, 326, W + 8, 146, '#c98a5e', 3, 0);
    ctx.strokeStyle = 'rgba(90,50,40,.35)'; ctx.lineWidth = 3;
    for (let x = 30; x < W; x += 120) { ctx.strokeRect(x, 346, 96, 104); }
    inkRect(-4, 320, W + 8, 12, '#e0a676', 2.5, 2);
    const fg = ctx.createLinearGradient(0, 466, 0, H); fg.addColorStop(0, '#b06e44'); fg.addColorStop(1, '#8e5434');
    ctx.fillStyle = fg; ctx.fillRect(0, 466, W, H - 466);
    ctx.strokeStyle = 'rgba(60,30,20,.3)'; ctx.lineWidth = 2;
    for (let y = 486; y < H; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let i = 0; i < 16; i++) { const y = 466 + (i % 4) * 22, x = ((i * 137) % W); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 22); ctx.stroke(); }
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 466); ctx.lineTo(W, 466); ctx.stroke();
    // bunting lights strung across the top
    ctx.strokeStyle = '#7a5a8a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 54); ctx.quadraticCurveTo(480, 82, W, 54); ctx.stroke();
    for (let i = 0; i < 20; i++) { const x = 24 + i * 48, y = 54 + Math.sin((x / W) * Math.PI) * 14 + 6, on = 0.6 + 0.4 * Math.sin(t * 2 + i); ctx.globalAlpha = on; ctx.fillStyle = ['#ffe36b', '#ff9ad0', '#9ae0ff', '#b8f0a0'][i % 4]; circle(x, y, 5); ctx.globalAlpha = 1; }
    // rug
    grp([[E(560, 506, 190, 30), '#9a6ae0']], 2.5);
    ctx.strokeStyle = '#ffd6f0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(560, 506, 160, 22, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ffe36b'; for (let i = 0; i < 10; i++) { const an = i * TAU / 10; star(560 + Math.cos(an) * 120, 506 + Math.sin(an) * 14, 5, '#ffe36b', 4); }
    drawShelf('shelfL', PROPS.shelfL, g.poke.shelfL);
    drawShelf('shelfR', PROPS.shelfR, g.poke.shelfR);
    // (the plant sits on the lamp table and the owl on the floor book stack, clear of the header)


    // the cheeky bookworm peeking out of a book on the right shelf
    const wy = 300 + Math.sin(t * 2) * 4;
    grp([[E(780, wy, 10, 9), '#9ae070'], [E(790, wy + 10, 8, 7), '#9ae070']], 2); eye(777, wy - 2, 2.5); eye(784, wy - 2, 2.5); smile(781, wy + 2, 3);
    ctx.fillStyle = '#5a4aa0'; circle(781, wy - 12, 3.5); // tiny detective cap pompom
    // armchair (the reading nook)
    const C = PROPS.chair, cp = g.poke.chair, squish = cp > 0 ? Math.sin(cp * 20) * 4 * cp : 0;
    grp([[R(C.x + 6, C.y, C.w - 12, 110, 30), '#d05a8a'], [R(C.x - 4, C.y + 66, 34, 90, 14), '#d05a8a'], [R(C.x + C.w - 30, C.y + 66, 34, 90, 14), '#d05a8a'], [R(C.x + 16, C.y + 96, C.w - 32, 56, 10), '#e06a9a']]);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 4; i++) circle(C.x + 40 + i * 24, C.y + 34, 4);
    ink(R(C.x + 40, C.y + 70 - squish, 70, 36 + squish, 14), '#ffe36b', 2.5);
    ctx.fillStyle = '#ff9ad0'; ctx.fillRect(C.x + 52, C.y + 74 - squish, 10, 28 + squish); ctx.fillRect(C.x + 88, C.y + 74 - squish, 10, 28 + squish);
    inkRect(C.x + 6, C.y + 152, 10, 12, '#6e3a2a', 2, 2); inkRect(C.x + C.w - 16, C.y + 152, 10, 12, '#6e3a2a', 2, 2);
    ctx.save(); ctx.translate(C.x + 12, C.y + 66); ctx.rotate(-0.2); inkRect(-14, -8, 30, 8, '#4fa8f5', 2, 2); inkRect(-12, -15, 26, 7, '#ffd23f', 2, 2); ctx.restore();
    // globe on its stand
    const G = { x: 452, y: 372 }, spin = g.globeSpin;
    line(curve(G.x, G.y + 40, G.x, G.y + 106), '#c47e4c', 8);
    grp([[E(G.x, G.y + 112, 30, 8), '#c47e4c']], 2.5);
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(G.x, G.y, 44, -1.9, 1.9 - Math.PI * 0, false); ctx.stroke();
    ctx.strokeStyle = '#e0b84a'; ctx.lineWidth = 3; ctx.stroke();
    inkCircle(G.x, G.y, 38, '#6ac8f0', 2.5);
    ctx.save(); ctx.beginPath(); ctx.arc(G.x, G.y, 38, 0, TAU); ctx.clip();
    ctx.fillStyle = '#7ad36a';
    for (let k = -1; k < 2; k++) { const ox = G.x + ((spin * 40) % 90) + k * 90 - 30; ellipse(ox, G.y - 12, 16, 11, 0.4); ellipse(ox + 10, G.y + 14, 9, 14, -0.3); ellipse(ox + 46, G.y - 2, 12, 18, 0.2); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(G.x - 14, G.y - 18, 12, 7, -0.6);
    ctx.restore();
    // side table and lamp (tap to switch it)
    const L = PROPS.lamp, lx = L.x + L.w / 2;
    if (g.lampOn) { const lg = ctx.createRadialGradient(lx, 350, 10, lx, 380, 150); lg.addColorStop(0, 'rgba(255,236,150,.55)'); lg.addColorStop(1, 'rgba(255,236,150,0)'); ctx.fillStyle = lg; ctx.fillRect(lx - 160, 240, 320, 260); }
    grp([[R(L.x, 420, L.w, 14, 4), '#c47e4c'], [R(L.x + 8, 432, 10, 58, 3), '#a8663e'], [R(L.x + L.w - 18, 432, 10, 58, 3), '#a8663e'], [R(L.x + 12, 450, L.w - 24, 8, 3), '#a8663e']], 2.5);
    grp([[R(lx - 4, 360, 8, 50, 3), '#e0b84a'], [E(lx, 414, 22, 7), '#e0b84a']], 2.5);
    const shade = new Path2D(); shade.moveTo(lx - 22, 306); shade.lineTo(lx + 22, 306); shade.lineTo(lx + 40, 362); shade.lineTo(lx - 40, 362); shade.closePath();
    grp([[shade, g.lampOn ? '#fff0a0' : '#e8c8a8']], 2.5);
    ctx.fillStyle = 'rgba(255,111,181,.5)'; ctx.fillRect(lx - 38, 352, 76, 5);
    ctx.save(); ctx.translate(L.x + 8, 420); ctx.rotate(0.1); inkRect(0, -10, 34, 10, '#5fca62', 2, 2); ctx.restore();
    // a teacup on the table
    grp([[R(L.x + 64, 400, 24, 20, 5), '#ff9a6a']], 2); for (const [dx, r] of [[-10, -0.5], [0, 0], [10, 0.5]]) { ctx.save(); ctx.translate(L.x + 76 + dx * 0.4, 402); ctx.rotate(r + Math.sin(t * 1.5 + dx) * 0.05); ink(E(0, -11, 6, 13), '#5fca62', 2); ctx.restore(); }
    // the sleeping cat curled on the rug
    const K = PROPS.cat, kx = K.x + 62, ky = 492, cp2 = g.poke.cat, awake = cp2 > 0.05;
    const breathe = 1 + Math.sin(t * 2) * 0.03;
    ctx.save(); ctx.translate(kx, ky); ctx.scale(1, awake ? 1 + Math.sin(cp2 * Math.PI) * 0.12 : breathe);
    line(curve(40, 8, 60, 6, 56, -18, 30, -14), '#a8a0c0', 9);
    const ear = s => { const p = new Path2D(); p.moveTo(-44 + s * 8, -22); p.lineTo(-44 + s * 14, -42); p.lineTo(-44 + s * 20, -20); p.closePath(); return p; };
    grp([[E(0, -8, 48, 22), '#c8c0e0'], [ear(-1), '#c8c0e0'], [ear(1), '#c8c0e0'], [E(-40, -12, 20, 17), '#c8c0e0']]);
    ctx.fillStyle = '#a8a0c8'; for (const x of [-6, 8, 22]) ellipse(x, -24, 4, 8, 0.2);
    ctx.fillStyle = '#ffd0d8'; ellipse(-40, -4, 4, 2.6);
    if (awake) { eye(-48, -14, 3.5); eye(-32, -14, 3.5); } else { eye(-48, -12, 4, true); eye(-32, -12, 4, true); }
    ctx.restore();
    if (!awake) for (let i = 0; i < 3; i++) { const k = (t * 0.4 + i / 3) % 1; ctx.globalAlpha = Math.sin(k * Math.PI); text('z', kx - 40 + k * 26 + i * 4, ky - 40 - k * 40, 14 + i * 4, '#7a6ac8', 'center', 700); ctx.globalAlpha = 1; }
    else outlined('Meow!', kx - 40, ky - 60, 18, '#fff');
    // book stack on the floor
    ctx.save(); ctx.translate(214, 498); inkRect(-30, -10, 60, 12, '#4fa8f5', 2, 3); inkRect(-26, -20, 54, 10, '#ff7eb6', 2, 3); inkRect(-22, -30, 46, 10, '#ffd23f', 2, 3); ctx.restore();
    const ox = 214, oy = 450;
    grp([[E(ox, oy, 16, 18), '#b08a60'], [E(ox - 8, oy - 12, 6), '#b08a60'], [E(ox + 8, oy - 12, 6), '#b08a60']], 2); ctx.fillStyle = '#fff'; circle(ox - 6, oy - 4, 5); circle(ox + 6, oy - 4, 5); eye(ox - 6, oy - 4, 3, blinkShut(5)); eye(ox + 6, oy - 4, 3, blinkShut(5)); ctx.fillStyle = '#ffb13d'; tri(ox - 3, oy + 2, ox + 3, oy + 2, ox, oy + 8);
  }

  // --- the letter tile ---
  function drawTile(x, y, l, o = {}) {
    const s = o.s ?? 1, rot = o.rot ?? 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    if (o.glow) { const gr = ctx.createRadialGradient(0, 0, 10, 0, 0, 52); gr.addColorStop(0, `rgba(255,240,140,${0.8 * o.glow})`); gr.addColorStop(1, 'rgba(255,240,140,0)'); ctx.fillStyle = gr; circle(0, 0, 52); }
    ctx.fillStyle = 'rgba(60,30,70,.25)'; ctx.beginPath(); ctx.roundRect(-TILE_W / 2 + 3, -TILE_H / 2 + 5, TILE_W, TILE_H, 10); ctx.fill();
    const col = o.bad ? '#ffd0d0' : o.good ? '#d8ffd8' : '#fff6dc';
    ink(R(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H, 10), col, 2.5);
    ctx.fillStyle = 'rgba(255,200,120,.35)'; ctx.fillRect(-TILE_W / 2 + 4, TILE_H / 2 - 12, TILE_W - 8, 6);
    text(l, 0, -2, 40, o.bad ? '#c83a5a' : '#5a2a6e', 'center', 700);
    ctx.restore();
  }

  function layoutWord(g) {
    const w = g.case.word.w, n = w.length, sw = n > 3 ? 58 : 64, gap = 10, x0 = WORD.cx - ((n - 1) * (sw + gap)) / 2;
    g.slots = [...w].map((l, i) => ({ l, i, x: x0 + i * (sw + gap), y: WORD.y + WORD.h / 2, w: sw, blank: g.case.blanks.includes(i) }));
  }
  function layoutTray(g) {
    const tr = g.tiles.filter(t => t.inTray && !t.placed && t !== g.held);
    const n = Math.max(g.tiles.length, 1), gap = 66, x0 = TRAY.cx - ((n - 1) * gap) / 2;
    g.trayX0 = x0; g.trayGap = gap;
    tr.forEach(t => { t.slot = g.trayOrder.indexOf(t); t.tx = x0 + t.slot * gap; t.ty = TRAY.y + TRAY.h / 2; });
  }

  function startCase(g) {
    g.case = g.cases[g.ci];
    g.ct = 0; g.cs = 'search'; g.st = 0; g.wrongs = 0; g.hinted = false; g.held = null; g.trayOrder = [];
    layoutWord(g);
    const letters = [...g.case.blanks.map(i => ({ l: g.case.word.w[i], need: true })), ...g.case.decoys.map(l => ({ l, need: false }))];
    const avoid = new Set(g.lastSpots || []);
    let spots = shuffle(SPOTS.map((s, i) => i).filter(i => !avoid.has(i)));
    if (spots.length < letters.length) spots = shuffle(SPOTS.map((s, i) => i));
    // spread the hidden letters over different props where possible
    const chosen = [], props = new Set();
    for (const i of spots) if (!props.has(SPOTS[i].prop) && chosen.length < letters.length) { chosen.push(i); props.add(SPOTS[i].prop); }
    for (const i of spots) if (!chosen.includes(i) && chosen.length < letters.length) chosen.push(i);
    g.lastSpots = chosen;
    g.tiles = shuffle(letters).map((o, k) => {
      const sp = SPOTS[chosen[k]];
      return { ...o, spot: sp, x: sp.x + rand(-10, 10), y: sp.y + rand(-8, 8), rot: rand(-0.25, 0.25), found: false, inTray: false, placed: false, fly: 0, shake: 0, seen: 0 };
    });
    const intro = g.ci === 0
      ? `Case number one! ${g.case.word.say}. ${cap(g.case.word.w)} ${g.case.clue.say}. Search the library with your magnifying glass to find the missing ${g.case.blanks.length > 1 ? 'letters' : 'letter'}!`
      : `Case number ${NUM_WORDS[g.ci + 1]}! ${g.case.word.say}. ${cap(g.case.word.w)} ${g.case.clue.say}.`;
    g.say = `${g.case.word.say}. ${cap(g.case.word.w)} ${g.case.clue.say}. Find the missing ${g.case.blanks.length > 1 ? 'letters' : 'letter'}!`;
    g.bubble = { str: g.ci === 0 ? 'Use your magnifying glass!' : pick(['A new case!', 'Another clue!', 'Keep looking!']), t: 3 };
    g.cardIn = 0;
    if (g.phase === 'play') speak(intro);
    g.introSay = intro;
  }
  const cap = s => s[0].toUpperCase() + s.slice(1);

  function collect(g, tile) {
    tile.found = true; tile.inTray = true; tile.fly = 0; tile.fx = tile.x; tile.fy = tile.y;
    g.trayOrder.push(tile);
    SFX.sparkle(); burst(tile.x, tile.y, 14, { colors: ['#fff6a8', '#ffe36b', '#ffffff'] });
    speak(`${tile.l.toUpperCase()}. ${tile.l.toUpperCase()} says ${SND[tile.l]}.`);
    const left = g.tiles.filter(t => t.need && !t.found).length;
    g.bubble = { str: left ? 'Ooh, a clue! Keep looking!' : 'Now drag it into the word!', t: 2.6 };
    if (!left && g.tiles.filter(t => t.found).length === 1) g.bubble.str = 'Drag it into the word!';
  }
  function poke(g, prop) {
    g.poke[prop] = 1;
    if (prop === 'globe') { g.globeV = 6; tone(500, 0.3, 'triangle', 0.06, 0, 900); }
    else if (prop === 'lamp') { g.lampOn = !g.lampOn; SFX.click(); }
    else if (prop === 'cat') { tone(700, 0.18, 'sawtooth', 0.04, 0, 1000); tone(1000, 0.3, 'sawtooth', 0.035, 0.18, 600); }
    else if (prop === 'chair') { tone(220, 0.2, 'sine', 0.1, 0, 140); }
    else { tone(330, 0.08, 'triangle', 0.06); tone(392, 0.08, 'triangle', 0.06, 0.07); }
  }
  // put a found tile into the word. x/y = where it was dropped (null = next blank, from a key)
  function tryPlace(g, tile, x, y) {
    const empty = g.slots.filter(s => s.blank && !s.filled);
    if (!empty.length) return false;
    let target = null;
    if (x != null) {
      const inWord = x > CARD.x + 150 && x < CARD.x + CARD.w + 10 && y > CARD.y - 10 && y < CARD.y + CARD.h + 4;
      const near = empty.map(s => [s, Math.hypot(s.x - x, s.y - y)]).sort((a, b) => a[1] - b[1]);
      if (!inWord && near[0][1] > 70) return false; // dropped somewhere else: back to the tray
      target = near[0][0];
    } else target = empty[0];
    // a letter that belongs in a different blank is fine
    const match = empty.find(s => s.l === tile.l);
    if (match) {
      match.filled = true; match.pop = 0; tile.placed = true; tile.inTray = false;
      g.trayOrder.splice(g.trayOrder.indexOf(tile), 1);
      g.pts += [1, 0.3][g.wrongs] ?? 0; g.wrongs = 0; g.helpOn = false;
      SFX.hit(); burst(match.x, match.y, 16);
      if (empty.length > 1) { speak(`Yes! ${SND[tile.l]}! Now find the next one.`); g.bubble = { str: 'Yes! One more letter!', t: 2.4 }; }
      else solve(g);
      return true;
    }
    g.wrongs++; g.misses++;
    tile.shake = 0.6; tile.bad = 0.9;
    SFX.miss();
    const want = target.l;
    speak(`Hmm, ${tile.l.toUpperCase()} says ${SND[tile.l]}. Listen: ${g.case.word.w}. We need ${soundAt(g.case.word, target.i)}.`);
    g.bubble = { str: `Hmm, that says “${SND[tile.l]}”.`, t: 2.6 };
    if (g.wrongs >= 2) g.helpOn = true;
    return true;
  }
  function solve(g) {
    g.cs = 'solved'; g.st = 0; g.solved++;
    const w = g.case.word;
    speak(`${w.ph.map(p => SND[p] || SND[p[0]]).join('... ')}... ${w.w}!`);
    g.bubble = { str: 'Case solved!', t: 4 };
  }

  MG.letter = {
    kind: 'learn', title: () => 'Letter Detective', icon: () => '🔍',
    how: g => g.tier === 3
      ? 'Read the clue and listen to the sounds. Use the magnifying glass to find the hidden vowels and letters, then drag the right ones into the word. Watch out for tricky decoys!'
      : 'Listen to the sound clue. Move the magnifying glass around the library to find hidden letters, tap them, then drag the right letter into the word!',
    init(g) {
      Object.assign(g, { cases: makeCases(g.tier), ci: 0, pts: 0, misses: 0, solved: 0, poke: {}, globeSpin: 0, globeV: 0, lampOn: true, lx: W / 2, ly: 380, bubble: null, helpOn: false });
      g.totalBlanks = g.cases.reduce((n, c) => n + c.blanks.length, 0);
      startCase(g);
    },
    start(g) { speak(g.introSay); },
    update(g, dt, id) {
      g.ct += dt; g.cardIn = Math.min(1, g.cardIn + dt * 3);
      for (const k in g.poke) g.poke[k] = Math.max(0, g.poke[k] - dt * (k === 'cat' ? 0.5 : 1.2));
      g.globeSpin += g.globeV * dt + dt * 0.15; g.globeV = Math.max(0, g.globeV - dt * 3);
      if (g.bubble) { g.bubble.t -= dt; if (g.bubble.t <= 0) g.bubble = null; }
      for (const t of g.tiles) { t.fly = Math.min(1, t.fly + dt * 2.2); t.shake = Math.max(0, t.shake - dt); t.bad = Math.max(0, (t.bad || 0) - dt); }
      for (const s of g.slots) if (s.filled) s.pop = Math.min(1, (s.pop || 0) + dt * 3);
      layoutTray(g);
      g.progress = `Case ${g.ci + 1} of ${g.cases.length}`;
      g.score = g.pts / g.totalBlanks;
      // the magnifying glass follows the mouse/finger, or the arrow keys
      if (pointerMoved(g) && (pointer.x !== g.lx || pointer.y !== g.ly)) { g.lx = pointer.x; g.ly = pointer.y; }
      const sp = 360 * dt;
      if (goLeft()) g.lx -= sp; if (goRight()) g.lx += sp;
      if (keys.arrowup || keys.w) g.ly -= sp; if (goDown()) g.ly += sp;
      g.lx = clamp(g.lx, 20, W - 20); g.ly = clamp(g.ly, 70, H - 20);
      for (const t of g.tiles) if (!t.found && Math.hypot(t.x - g.lx, t.y - g.ly) < 58) t.seen = Math.min(1, t.seen + dt * 4); else if (!t.found) t.seen = Math.max(0, t.seen - dt * 3);

      if (g.cs === 'solved') {
        g.st += dt;
        const n = g.case.word.ph.length, aliveAt = 0.5 + n * 0.62;
        const k = Math.floor((g.st - 0.5) / 0.62);
        if (k >= 0 && k < n && g.lastBeat !== k) { g.lastBeat = k; tone(523 * Math.pow(1.122, k * 2), 0.18, 'triangle', 0.09); }
        if (g.st >= aliveAt && !g.aliveFired) { g.aliveFired = true; SFX.fanfare(); burst(PIC.cx, PIC.cy, 34); burst(WORD.cx, WORD.y + 40, 20, { colors: ['#ffe36b', '#ff9ad0', '#9ae0ff'] }); }
        if (g.st >= aliveAt + 3) {
          g.lastBeat = -1; g.aliveFired = false;
          if (++g.ci >= g.cases.length) { g.ci = g.cases.length - 1; g.done = true; return; }
          startCase(g);
        }
        return;
      }
      if (!g.hinted && g.ct > 16 && g.tiles.some(t => t.need && !t.found)) {
        g.hinted = true;
        const t = g.tiles.find(t => t.need && !t.found);
        g.bubble = { str: `Psst! Look near ${t.spot.name}!`, t: 5 };
        speak(`Psst! Try looking near ${t.spot.name}!`);
      }
      if (id) return; // the speaker button was pressed

      // keyboard: space collects under the glass, number keys place a found letter
      if (!g.held && (pressed[' '] || pressed.enter)) {
        const t = g.tiles.filter(t => !t.found).sort((a, b) => Math.hypot(a.x - g.lx, a.y - g.ly) - Math.hypot(b.x - g.lx, b.y - g.ly))[0];
        if (t && Math.hypot(t.x - g.lx, t.y - g.ly) < 58) collect(g, t);
      }
      const kk = ['1', '2', '3', '4'].findIndex(k => pressed[k]);
      if (!g.held && kk >= 0 && g.trayOrder[kk]) tryPlace(g, g.trayOrder[kk], null, null);

      // pointer: grab and drag (or tap, then tap) found letters
      if (g.held) {
        const h = g.held;
        h.hx = pointer.x; h.hy = pointer.y; g.holdT += dt;
        if (Math.hypot(pointer.x - g.holdX, pointer.y - g.holdY) > 18) g.dragged = true;
        const release = g.sticky ? pointer.clicked : !pointer.down;
        if (!g.sticky && !pointer.down && !g.dragged && g.holdT < 0.4) { g.sticky = true; return; }
        if (release) {
          g.held = null;
          if (!tryPlace(g, h, pointer.x, pointer.y)) { h.fly = 0; h.fx = pointer.x; h.fy = pointer.y; SFX.pop(); }
          else if (!h.placed) { h.fly = 0; h.fx = pointer.x; h.fy = pointer.y; }
          else { h.fx = pointer.x; h.fy = pointer.y; }
        }
        return;
      }
      if (!pointer.clicked) return;
      const px = pointer.x, py = pointer.y;
      const hid = g.tiles.filter(t => !t.found && Math.hypot(t.x - px, t.y - py) < 46)[0];
      if (hid) return collect(g, hid);
      const tr = g.tiles.find(t => t.inTray && !t.placed && t.fly > 0.6 && Math.abs(t.tx - px) < TILE_W / 2 + 6 && Math.abs(t.ty - py) < TILE_H / 2 + 6);
      if (tr) { g.held = tr; g.holdT = 0; g.holdX = px; g.holdY = py; g.dragged = false; g.sticky = false; tr.hx = px; tr.hy = py; SFX.pick(); speak(SND[tr.l]); return; }
      if (px > PIC.x && px < PIC.x + PIC.w && py > PIC.y && py < PIC.y + PIC.h) return speak(g.say);
      for (const [k, P] of Object.entries(PROPS)) if (px > P.x && px < P.x + P.w && py > P.y && py < P.y + P.h) return poke(g, k);
    },
    draw(g) {
      drawLibrary(g);
      // faint twinkles where invisible-ink letters hide (stronger after the hint)
      for (const t of g.tiles) {
        if (t.found) continue;
        const ph = (S.t * 0.6 + t.x * 0.013) % 1, strong = g.hinted && t.need;
        if (ph < 0.25 || strong) {
          const a = strong ? 0.5 + 0.4 * Math.sin(S.t * 6) : Math.sin(ph / 0.25 * Math.PI) * 0.6;
          ctx.globalAlpha = a; star(t.x + 14, t.y - 18, strong ? 10 : 6, '#fffbd0', 4); ctx.globalAlpha = 1;
          if (strong) { ctx.globalAlpha = 0.18 + 0.1 * Math.sin(S.t * 6); drawTile(t.x, t.y, t.l, { rot: t.rot }); ctx.globalAlpha = 1; }
        }
      }
      // the case card
      const ci = ease(g.cardIn), cy = (1 - ci) * -30;
      ctx.save(); ctx.translate(0, cy); ctx.globalAlpha = ci;
      ctx.save(); ctx.shadowColor = 'rgba(60,20,40,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
      rrect(CARD.x, CARD.y, CARD.w, CARD.h, 18, '#fffaf0'); ctx.restore();
      rrect(CARD.x, CARD.y, CARD.w, CARD.h, 18, null, OL, 3);
      rrect(CARD.x + 6, CARD.y + 6, CARD.w - 12, CARD.h - 12, 14, null, '#ffc0dc', 2);
      // a paperclip
      ctx.strokeStyle = '#9a9ab0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(CARD.x + 22, CARD.y - 12, 16, 40, 8); ctx.stroke();
      const alive = g.cs === 'solved' ? g.st - (0.5 + g.case.word.ph.length * 0.62) : -1;
      const pg = ctx.createLinearGradient(0, PIC.y, 0, PIC.y + PIC.h); pg.addColorStop(0, alive >= 0 ? '#fff3a8' : '#dff3ff'); pg.addColorStop(1, alive >= 0 ? '#ffd0ea' : '#ffe8f4');
      rrect(PIC.x, PIC.y, PIC.w, PIC.h, 12, pg, OL, 2.5);
      ctx.save(); ctx.beginPath(); ctx.roundRect(PIC.x, PIC.y, PIC.w, PIC.h, 12); ctx.clip();
      ctx.translate(PIC.cx, PIC.cy + 4); ctx.scale(0.92, 0.92);
      ART[g.case.word.w](alive >= 0 ? alive : -1);
      ctx.restore();
      emoji('🔊', PIC.x + PIC.w - 14, PIC.y + 14, 14);
      // the word, with blanks
      const n = g.case.word.ph.length;
      g.slots.forEach(s => {
        const ch = chunkOf(g.case.word, s.i), beat = g.cs === 'solved' ? g.st - 0.5 - ch * 0.62 : -1;
        const bounce = beat >= 0 && beat < 0.5 ? Math.sin(beat / 0.5 * Math.PI) : 0;
        const fin = alive >= 0 ? Math.sin(Math.min(alive, 0.6) / 0.6 * Math.PI) * 0.15 : 0;
        const y = s.y - bounce * 16, sc = 1 + bounce * 0.15 + fin;
        if (s.blank && !s.filled) {
          const pulse = 0.5 + 0.5 * Math.sin(S.t * 4);
          rrect(s.x - s.w / 2, y - 36, s.w, 72, 12, `rgba(255,200,230,${0.35 + pulse * 0.2})`, '#ff6fb5', 3);
          ctx.setLineDash([6, 6]); rrect(s.x - s.w / 2 + 6, y - 30, s.w - 12, 60, 8, null, 'rgba(255,111,181,.6)', 2); ctx.setLineDash([]);
          outlined('?', s.x, y + 2, 34, '#ff6fb5', 'center', '#fff');
        } else {
          const pop = s.filled ? 1 + Math.sin(s.pop * Math.PI) * 0.25 : 1;
          ctx.save(); ctx.translate(s.x, y); ctx.scale(sc * pop, sc * pop);
          if (s.filled) rrect(-s.w / 2, -36, s.w, 72, 12, bounce > 0 ? '#fff3a0' : '#e6ffe0', '#5fb87a', 3);
          else if (bounce > 0) rrect(-s.w / 2, -36, s.w, 72, 12, '#fff3a0', '#ffb13d', 3);
          text(s.l, 0, -2, 52, s.filled ? '#2f8a4a' : '#5a2a6e', 'center', 700);
          ctx.restore();
        }
      });
      // the sound clue
      const clue = g.case.clue.txt, lines = wrap(clue, 300, 16, 600);
      ctx.globalAlpha = ci * (g.held ? 0.25 : 1);
      if (alive < 0) emoji('👂', WORD.cx - 140, CARD.y + 140 - (lines.length - 1) * 9, 18);
      ctx.globalAlpha = ci * (g.held ? 0.25 : 1);
      if (alive < 0) lines.forEach((l, i) => text(l, WORD.cx + 10, CARD.y + 140 + (i - (lines.length - 1) / 2) * 20, 16, '#8a4a9e', 'center', 600));
      ctx.globalAlpha = ci;
      // SOLVED stamp
      if (alive >= 0) {
        const k = ease(alive / 0.35), sc = 1 + (1 - k) * 1.5;
        ctx.save(); ctx.globalAlpha = ci * k; ctx.translate(WORD.cx, CARD.y + 142); ctx.rotate(-0.08); ctx.scale(sc, sc);
        rrect(-62, -18, 124, 36, 8, 'rgba(255,255,255,.7)', '#e0436a', 4);
        text('SOLVED!', 0, 1, 24, '#e0436a', 'center', 700);
        ctx.restore();
      }
      ctx.restore();
      // the evidence tray
      const nt = Math.max(1, g.tiles.length), tw = nt * 66 + 24;
      rrect(TRAY.cx - tw / 2, TRAY.y, tw, TRAY.h, 16, 'rgba(110,58,42,.88)', OL, 3);
      rrect(TRAY.cx - tw / 2 + 5, TRAY.y + 5, tw - 10, TRAY.h - 10, 12, null, 'rgba(255,220,180,.35)', 2);
      for (let i = 0; i < nt; i++) { const x = g.trayX0 + i * g.trayGap; rrect(x - 27, TRAY.y + 8, 54, 52, 10, 'rgba(0,0,0,.22)'); if (!g.trayOrder[i]) text('?', x, TRAY.y + 34, 22, 'rgba(255,230,200,.45)', 'center', 700); }
      text('found letters', TRAY.cx, TRAY.y + TRAY.h + 11, 13, '#fff', 'center', 600);
      for (const t of g.tiles) {
        if (!t.inTray || t.placed || t === g.held) continue;
        const k = ease(t.fly), x = lerp(t.fx, t.tx, k), y = lerp(t.fy, t.ty, k) - Math.sin(k * Math.PI) * 60;
        const sh = t.shake > 0 ? Math.sin(t.shake * 40) * 6 * t.shake : 0;
        const help = g.helpOn && t.need ? 0.6 + 0.4 * Math.sin(S.t * 6) : 0;
        drawTile(x + sh, y, t.l, { s: 0.92 + (1 - k) * 0.2, bad: t.bad > 0, glow: help });
        if (k >= 1 && g.trayOrder.length > 1) text(String(g.trayOrder.indexOf(t) + 1), x + 22, y + 24, 11, 'rgba(90,42,110,.6)', 'center', 700);
      }
      // Miss Whiskers, the head librarian, and her speech bubble
      drawCritter('Miss Whiskers', 878, H - 6, 0.74, -1);
      if (g.bubble) {
        const b = g.bubble, a = clamp(b.t * 3, 0, 1), lines = wrap(b.str, 178, 16, 600), bh = 18 + lines.length * 20;
        ctx.globalAlpha = a;
        const bx = 724, by = 386 - bh;
        rrect(bx, by, 206, bh, 14, '#fff', OL, 2.5);
        ctx.fillStyle = '#fff'; tri(bx + 150, by + bh - 2, bx + 176, by + bh - 2, bx + 172, by + bh + 16);
        ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx + 150, by + bh); ctx.lineTo(bx + 172, by + bh + 16); ctx.lineTo(bx + 176, by + bh); ctx.stroke();
        lines.forEach((l, i) => text(l, bx + 103, by + 19 + i * 20, 16, '#5a2a6e', 'center', 600));
        ctx.globalAlpha = 1;
      }
      // the magnifying glass: magnifies the scene and shows the invisible ink
      if (g.held) {
        drawTile(g.held.hx, g.held.hy, g.held.l, { s: 1.12, rot: Math.sin(S.t * 8) * 0.05 });
      } else if (g.cs !== 'solved') {
        const lx = g.lx, ly = g.ly, r = 56, m = 1.3;
        ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, r, 0, TAU); ctx.clip();
        const k = canvas.width / W, sr = r / m;
        try { ctx.drawImage(canvas, (lx - sr) * k, (ly - sr) * k, sr * 2 * k, sr * 2 * k, lx - r, ly - r, r * 2, r * 2); } catch (e) { /* off-canvas edges */ }
        ctx.fillStyle = 'rgba(160,220,255,.16)'; ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
        for (const t of g.tiles) {
          if (t.found) continue;
          const d = Math.hypot(t.x - lx, t.y - ly);
          if (d > r + 34) continue;
          const tx = lx + (t.x - lx) * m, ty = ly + (t.y - ly) * m;
          drawTile(tx, ty, t.l, { s: 1.15, rot: t.rot, glow: 0.8 });
        }
        ctx.restore();
        const hp = new Path2D(); hp.moveTo(lx + r * 0.7, ly + r * 0.7); hp.lineTo(lx + r * 0.7 + 40, ly + r * 0.7 + 40);
        ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 20; ctx.stroke(hp); ctx.strokeStyle = '#8a4a2a'; ctx.lineWidth = 13; ctx.stroke(hp);
        ctx.strokeStyle = OL; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(lx, ly, r, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#e8b840'; ctx.lineWidth = 8; ctx.stroke();
        ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(lx, ly, r - 1, -2.6, -1.5); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(lx, ly, r - 14, -2.5, -1.9); ctx.stroke();
      }
    },
  };

  restage('library', {
    intro: [
      'N:Shhh! Welcome to the library. Oh, whiskers! A sneaky bookworm nibbled letters right off my picture cards!',
      'N:Now the letters are hiding all over the library in invisible ink. Will you be my Letter Detective?',
      "A:excited:A real case? I'll get my magnifying glass!",
    ],
  });
}
