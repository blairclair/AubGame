'use strict';
{
  // ===========================================================================
  // SKIPPING STONE CREEK, game 1 (action, shell): Creek Clean-Up Raft.
  // Aubrey rides Tilly's little log raft downstream. Steer it up, down, forwards and back
  // (arrow keys or the mouse) to scoop up floating rubbish, thread the gaps between rocks,
  // go around the duck families and (later) slide past drifting logs and whirlpools.
  // Tilly coaches with short facts: downstream is the way the water flows, plastic floats
  // a long way, clean water keeps fish and ducks healthy.
  // Replaces Busy Beaver Dam; Singing Stones (MG.creekchimes) stays as game 2.
  // ===========================================================================
  const TAU = Math.PI * 2;
  const Y0 = 228, Y1 = 466;            // where the raft's waterline can go (far bank .. near bank)
  const WATER_TOP = 196, WATER_BOT = 500;
  const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const depth = y => 0.8 + 0.28 * (y - Y0) / (Y1 - Y0);   // things nearer the bottom are closer, so bigger
  const vgrad = (y0, y1, c0, c1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };

  // --- art ---------------------------------------------------------------------------------
  function ringRipple(x, y, w, k) {
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, w * (0.6 + k * 0.7), w * 0.22 * (0.6 + k * 0.7), 0, 0, TAU); ctx.stroke();
  }
  // a boulder sticking out of the water with foam round it
  function boulder(x, y, r, seed) {
    const s = r / 40;
    ctx.fillStyle = 'rgba(20,60,100,.28)'; ellipse(x + 6 * s, y + 4 * s, r * 1.15, r * 0.36);
    const p = P2(`M${x - 42 * s},${y} C${x - 46 * s},${y - 32 * s} ${x - 14 * s},${y - 52 * s} ${x + 6 * s},${y - 48 * s} C${x + 34 * s},${y - 44 * s} ${x + 48 * s},${y - 18 * s} ${x + 42 * s},${y} Z`);
    ink(p, vgrad(y - 50 * s, y, ['#d8d2e2', '#d6ccbc', '#c9d2dc'][seed % 3], ['#8a84a0', '#968a7a', '#7f8ea0'][seed % 3]), 2);
    ctx.fillStyle = '#6cc04e'; ellipse(x - 4 * s, y - 43 * s, 20 * s, 6 * s, -0.15);
    ctx.fillStyle = '#9be070'; ellipse(x - 10 * s, y - 46 * s, 9 * s, 3 * s, -0.15);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ellipse(x - 24 * s, y - 28 * s, 7 * s, 4 * s, -0.5);
    // white water foaming round the bottom
    const f = Math.sin(S.t * 6 + seed) * 2;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (i / 6);
      circle(x - Math.cos(a) * 44 * s, y + Math.sin(a) * 7 * s + 2, (6 + ((i + seed) % 3) * 2) * s + (i % 2 ? f : -f) * 0.5);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 2; i++) {
      const k = (S.t * 0.9 + i * 0.5 + seed * 0.13) % 1;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath(); ctx.moveTo(x + 40 * s + k * 50, y - 4 + i * 8); ctx.quadraticCurveTo(x + 52 * s + k * 60, y - 8 + i * 8, x + 64 * s + k * 70, y - 2 + i * 8); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // a floating log (an obstacle that drifts across the creek)
  function floatLog(x, y, s) {
    ctx.fillStyle = 'rgba(20,60,100,.25)'; ellipse(x, y + 4, 78 * s, 9 * s);
    const body = P2(`M${x - 70 * s},${y - 22 * s} L${x + 64 * s},${y - 22 * s} A${11 * s},${11 * s} 0 0 1 ${x + 64 * s},${y} L${x - 70 * s},${y} Z`);
    ink(body, vgrad(y - 22 * s, y, '#c0814a', '#7a4a26'), 2);
    ctx.strokeStyle = 'rgba(90,50,20,.55)'; ctx.lineWidth = 1.6;
    for (const dx of [-50, -22, 8, 36]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y - 17 * s); ctx.lineTo(x + (dx + 18) * s, y - 15 * s); ctx.stroke(); }
    inkEllipse(x - 70 * s, y - 11 * s, 8 * s, 11 * s, 0, '#e8c08a', 1.8);
    ctx.strokeStyle = '#b07a46'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x - 70 * s, y - 11 * s, 4 * s, 6 * s, 0, 0, TAU); ctx.stroke();
    // a little leafy twig
    ctx.strokeStyle = '#7a4a26'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 20 * s, y - 22 * s); ctx.lineTo(x + 30 * s, y - 38 * s); ctx.stroke();
    inkEllipse(x + 34 * s, y - 40 * s, 8 * s, 4 * s, -0.5, '#6cc04e', 1.2);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ellipse(x - 76 * s, y + 1, 9 * s, 3 * s); ellipse(x + 74 * s, y + 1, 9 * s, 3 * s);
  }
  // a swirly whirlpool on the water surface
  function whirlpool(x, y, r) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.34);
    const gr = ctx.createRadialGradient(0, 0, 4, 0, 0, r);
    gr.addColorStop(0, 'rgba(20,70,130,.75)'); gr.addColorStop(1, 'rgba(40,120,180,0)');
    ctx.fillStyle = gr; circle(0, 0, r);
    ctx.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) {
      ctx.strokeStyle = arm % 2 ? 'rgba(255,255,255,.85)' : 'rgba(200,240,255,.8)'; ctx.lineWidth = 4;
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) {
        const a = -S.t * 4 + arm * TAU / 3 + k * 0.2, rr = r * (1 - k / 32);
        k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  // floating rubbish: bottle, can, crisp packet, bag
  function litter(kind, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(rot);
    if (kind === 0) {        // plastic bottle on its side
      const p = P2('M-30,-8 C-30,-18 -22,-20 -14,-20 L10,-20 C18,-20 20,-14 26,-12 L32,-12 L32,-2 L26,-2 C20,0 18,6 10,6 L-14,6 C-22,6 -30,4 -30,-8 Z');
      ink(p, 'rgba(150,215,255,.95)', 2.2);
      ctx.fillStyle = '#3a8ae0'; ctx.fillRect(-16, -16, 18, 18);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-12, -13, 10, 4);
      inkRect(31, -14, 7, 14, '#ff5a6a', 1.6, 2);
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ellipse(-20, -14, 6, 2.5);
    } else if (kind === 1) { // fizzy drink can
      const p = P2('M-22,-20 L18,-20 C24,-20 24,4 18,4 L-22,4 C-28,4 -28,-20 -22,-20 Z');
      ink(p, vgrad(-20, 4, '#ff6a6a', '#c42a3a'), 2.2);
      inkEllipse(20, -8, 6, 12, 0, '#d8dce6', 1.6);
      ctx.fillStyle = '#fff'; ellipse(-4, -8, 9, 5);
      ctx.fillStyle = '#ff6a6a'; ellipse(-4, -8, 4, 2.5);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-20, -17, 32, 3);
    } else if (kind === 2) { // crisp packet with crinkly ends
      const p = P2('M-26,-22 L-20,-18 L-26,-14 L-20,-10 L-26,-6 L-20,-2 L-26,2 L22,2 L16,-2 L22,-6 L16,-10 L22,-14 L16,-18 L22,-22 Z');
      ink(p, vgrad(-22, 2, '#ffe25a', '#ffaa2a'), 2);
      ctx.fillStyle = '#ff5a8a'; circle(-2, -10, 7);
      ctx.fillStyle = '#fff'; circle(-4, -12, 2.4);
    } else {                 // floppy plastic bag
      const p = P2('M-24,2 C-30,-10 -22,-24 -12,-22 L-14,-32 L-6,-30 L-4,-22 L6,-22 L8,-30 L16,-32 L14,-22 C26,-22 30,-8 22,2 Z');
      ink(p, 'rgba(250,250,255,.92)', 2);
      ctx.strokeStyle = 'rgba(160,170,200,.7)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-14, -12); ctx.quadraticCurveTo(-6, -6, -10, 0); ctx.moveTo(8, -14); ctx.quadraticCurveTo(14, -6, 10, 0); ctx.stroke();
    }
    ctx.restore();
  }
  // a fluffy duckling paddling
  function duckling(x, y, s, flip) {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    ctx.strokeStyle = OL; ctx.lineWidth = 4;
    const body = P2('M-16,0 C-20,-14 -6,-18 6,-14 C14,-12 18,-4 14,0 Z');
    ctx.stroke(body); ctx.beginPath(); ctx.arc(10, -20, 9, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.fill(body); circle(10, -20, 9);
    ctx.fillStyle = '#ffeb8a'; ellipse(-2, -10, 7, 3);
    inkEllipse(20, -19, 6, 3, 0.1, '#ff9a2a', 1.2);
    ctx.fillStyle = '#1a1a22'; circle(13, -22, 2);
    ctx.restore();
  }
  function jumpFish(x, y, k, s) {
    // k 0..1 along a little leap arc
    const fx = x + k * 70 * s, fy = y - Math.sin(k * Math.PI) * 60 * s, a = Math.cos(k * Math.PI) * -0.9;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(a); ctx.scale(s, s);
    const p = P2('M-22,0 C-12,-12 10,-12 20,0 C10,12 -12,12 -22,0 Z M-20,0 L-32,-10 L-30,0 L-32,10 Z');
    ink(p, vgrad(-10, 10, '#ffb0d0', '#ff6a9a'), 1.8);
    ctx.fillStyle = '#1a1a22'; circle(12, -2, 2.4);
    ctx.restore();
    if (k < 0.12 || k > 0.88) { ctx.fillStyle = 'rgba(255,255,255,.85)'; for (let i = -2; i <= 2; i++) circle(fx + i * 6, y - Math.abs(i) * 3, 3); }
  }
  // Tilly's log raft, with Aubrey crouched on top holding a paddle and the rubbish basket behind her
  function raft(g, x, y, s) {
    const rock = Math.sin(S.t * 2.6) * 0.03 + (g.wob > 0 ? Math.sin(g.wob * 40) * g.wob * 0.25 : 0) + (g.spin || 0);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rock); ctx.scale(s, s);
    // wake
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-70, 0, 12 + Math.sin(S.t * 8) * 3, 4);
    ctx.fillStyle = 'rgba(20,60,100,.25)'; ellipse(0, 4, 78, 10);
    // the mast and pink flag at the back
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-52, -24); ctx.lineTo(-52, -96); ctx.stroke();
    ctx.strokeStyle = '#a06a3a'; ctx.lineWidth = 3.5; ctx.stroke();
    const fl = Math.sin(S.t * 7) * 4;
    ink(P2(`M-50,-96 C-34,${-98 + fl} -20,${-90 - fl} -6,${-88 + fl} C-20,${-82 - fl} -34,${-76 + fl} -50,-76 Z`), '#ff6fb5', 1.8);
    ctx.fillStyle = '#fff'; star(-30, -86, 5, '#fff', 5);
    // three logs, back to front
    for (let i = 0; i < 3; i++) {
      const ly = -20 + i * 8, lx = -66 + i * 3;
      const p = P2(`M${lx},${ly - 9} L${lx + 124},${ly - 9} A9,9 0 0 1 ${lx + 124},${ly + 9} L${lx},${ly + 9} A9,9 0 0 1 ${lx},${ly - 9} Z`);
      ink(p, vgrad(ly - 9, ly + 9, ['#d8a066', '#c98e52', '#b87c42'][i], ['#9a6232', '#8a5428', '#7a4820'][i]), 2);
      inkEllipse(lx + 124, ly, 6, 8.5, 0, '#f0cf9a', 1.4);
      ctx.strokeStyle = '#c08a52'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(lx + 124, ly, 2.5, 4, 0, 0, TAU); ctx.stroke();
    }
    // rope lashings
    for (const rx of [-40, 34]) {
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(rx, -30); ctx.lineTo(rx + 6, 6); ctx.stroke();
      ctx.strokeStyle = '#f0dc9a'; ctx.lineWidth = 3; ctx.stroke();
    }
    // the rubbish basket at the back, filling up
    const bx = -40, by = -26;
    const n = Math.min(g.got, 6);
    for (let i = 0; i < n; i++) litter(g.gotKinds[i % g.gotKinds.length] ?? 0, bx - 8 + (i % 3) * 8, by - 22 - Math.floor(i / 3) * 7, 0.45, (i % 2 ? 0.5 : -0.4));
    ink(P2(`M${bx - 20},${by - 22} L${bx + 20},${by - 22} L${bx + 15},${by} L${bx - 15},${by} Z`), vgrad(by - 22, by, '#ffcf6a', '#e09a3a'), 1.8);
    ctx.strokeStyle = 'rgba(140,80,30,.6)'; ctx.lineWidth = 1.3;
    for (const k of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(bx + k, by - 21); ctx.lineTo(bx + k * 0.8, by - 1); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(bx - 18, by - 12); ctx.lineTo(bx + 18, by - 12); ctx.stroke();
    ctx.restore();
    // Aubrey (not rotated with the raft art, so the photo stays crisp), with her paddle
    const ax = x + 10 * s, ay = y - 24 * s + Math.sin(S.t * 2.6) * 1.5;
    const pa = Math.sin(g.paddle) * 0.5;
    const paddle = (front) => {
      ctx.save(); ctx.translate(ax + 8 * s, ay - 46 * s); ctx.rotate(0.55 + pa);
      if (front) {
        ctx.strokeStyle = OL; ctx.lineWidth = 7 * s; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, -30 * s); ctx.lineTo(0, 62 * s); ctx.stroke();
        ctx.strokeStyle = '#c98e52'; ctx.lineWidth = 4 * s; ctx.stroke();
        ink(P2(`M${-9 * s},${58 * s} C${-11 * s},${80 * s} ${11 * s},${80 * s} ${9 * s},${58 * s} Z`), '#ff9ac0', 1.6);
      }
      ctx.restore();
    };
    drawAubrey(ax, ay, 'crouch', 1, 0, AUB_SCALE * s);
    paddle(true);
    // splashes from the paddle when she paddles
    if (g.paddling > 0.1) {
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      const sx = ax + 8 * s + Math.sin(0.55 + pa) * -60 * s;
      for (let i = 0; i < 4; i++) circle(sx + Math.sin(S.t * 20 + i) * 8, y + 2 - Math.abs(Math.sin(S.t * 12 + i * 2)) * 8, 2.5);
    }
  }

  // --- scenery (scrolls with the raft, in layers) ----------------------------------------
  function scenery(g) {
    const cam = g.cam;
    // sky
    ctx.fillStyle = vgrad(0, WATER_TOP, '#8fd4ff', '#e6f7ff'); ctx.fillRect(0, 0, W, WATER_TOP + 4);
    ctx.fillStyle = 'rgba(255,240,160,.4)'; circle(850, 96, 52);
    inkCircle(850, 96, 32, '#ffe066', 2.2);
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 260 - cam * 0.05 - S.t * 6) % (W + 260) + W + 260) % (W + 260) - 130, cy = 82 + (i % 3) * 20;
      ellipse(cx, cy, 46, 15); ellipse(cx + 26, cy - 10, 32, 17); ellipse(cx - 28, cy + 3, 26, 12);
    }
    // far hills
    for (const [col, base, amp, p, f] of [['#b6e3a0', 150, 26, 0.08, 0.006], ['#8fd07a', 168, 18, 0.18, 0.011]]) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, WATER_TOP + 2);
      for (let x = 0; x <= W; x += 16) { const wx = x + cam * p; ctx.lineTo(x, base - Math.sin(wx * f) * amp - Math.sin(wx * f * 2.3 + 1) * amp * 0.4); }
      ctx.lineTo(W, WATER_TOP + 2); ctx.fill();
    }
    // far-bank trees (parallax)
    const tp = 0.35, tsp = 150;
    for (let i = Math.floor(cam * tp / tsp) - 1; i <= Math.floor((cam * tp + W) / tsp) + 1; i++) {
      const x = i * tsp - cam * tp + hash(i) * 60;
      drawTree(x, 196, 95 + hash(i + 9) * 35, 0, Math.floor(hash(i + 3) * 3));
    }
    // far bank grass strip with bushes, flowers and cattails
    const bp = 0.6;
    ctx.fillStyle = vgrad(178, 204, '#7fd05a', '#4fae4a');
    ctx.beginPath(); ctx.moveTo(0, 204);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 186 + Math.sin((x + cam * bp) * 0.03) * 4);
    ctx.lineTo(W, 204); ctx.fill();
    const bsp = 230;
    for (let i = Math.floor(cam * bp / bsp) - 1; i <= Math.floor((cam * bp + W) / bsp) + 1; i++) {
      const x = i * bsp - cam * bp + hash(i + 40) * 80;
      ctx.save(); ctx.translate(x, 200); ctx.scale(0.42, 0.42); drawBush(0, 0, 0, i & 3); ctx.restore();
      for (let k = 0; k < 3; k++) {
        const fx = x + 60 + k * 22, fy = 192 + (k % 2) * 6;
        ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, fy + 8); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.fillStyle = ['#ff6fae', '#ffffff', '#ffd84a', '#c6a2ff'][(i + k) & 3]; circle(fx, fy, 3.6);
      }
      // cattails at the water's edge
      for (let k = 0; k < 3; k++) {
        const cx = x + 140 + k * 8, sw = Math.sin(S.t * 1.4 + k + i) * 3;
        ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx, 204); ctx.quadraticCurveTo(cx + sw * 0.4, 186, cx + sw, 166 + k * 4); ctx.stroke();
        inkEllipse(cx + sw, 172 + k * 4, 3.5, 9, 0, '#8a5232', 0.8);
      }
    }
    // the water
    ctx.fillStyle = vgrad(WATER_TOP, WATER_BOT, '#9fe4f6', '#3d9fd6'); ctx.fillRect(0, WATER_TOP, W, WATER_BOT - WATER_TOP + 10);
    // light bands
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    for (const [y, h] of [[230, 14], [300, 10], [380, 16], [440, 10]]) ctx.fillRect(0, y, W, h);
    // the far edge's soft froth
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (let x = -((cam * bp) % 24); x < W + 24; x += 24) ellipse(x, WATER_TOP + 6, 14, 3);
    // current streaks flowing downstream (they drift slower than the raft, so they slide back)
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const y = WATER_TOP + 20 + ((i * 53) % (WATER_BOT - WATER_TOP - 30));
      const span = W + 120, x = ((i * 191 - cam * 0.3) % span + span) % span - 60;
      const len = 26 + (i % 3) * 10;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len * 0.4, y - 3, x + len * 0.8, y); ctx.quadraticCurveTo(x + len * 0.9, y + 2, x + len, y); ctx.stroke();
    }
    // sparkles
    for (let i = 0; i < 12; i++) {
      const k = Math.max(0, Math.sin(S.t * 3 + i * 1.7));
      if (k > 0.1) star(((i * 233 - cam * 0.3) % W + W) % W, WATER_TOP + 30 + (i * 97) % 260, 6 * k, `rgba(255,255,255,${0.85 * k})`, 4);
    }
    // lily pads drifting by (decoration, not in the way)
    const lsp = 520;
    for (let i = Math.floor(cam / lsp) - 1; i <= Math.floor((cam + W) / lsp) + 1; i++) {
      const x = i * lsp - cam + hash(i + 70) * 200, y = hash(i + 71) < 0.5 ? 214 : 488;
      const p = new Path2D(); p.ellipse(x, y, 26, 8, 0, 0.35, TAU - 0.35); p.lineTo(x, y); p.closePath();
      ink(p, '#5fc95a', 1.3);
      if (hash(i + 72) < 0.5) { ctx.fillStyle = '#ffb0d6'; circle(x + 8, y - 4, 5); ctx.fillStyle = '#ffd84a'; circle(x + 8, y - 5, 2); }
    }
  }
  function nearBank(g) {
    const cam = g.cam, p = 1.25;
    ctx.fillStyle = vgrad(496, H, '#7cd35a', '#4aa648');
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 504 + Math.sin((x + cam * p) * 0.025) * 5);
    ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    for (let x = -((cam * p) % 30); x < W + 30; x += 30) ellipse(x, 502 + Math.sin((x + cam * p) * 0.025) * 5, 12, 2.5);
    const sp = 170;
    for (let i = Math.floor(cam * p / sp) - 1; i <= Math.floor((cam * p + W) / sp) + 1; i++) {
      const x = i * sp - cam * p + hash(i + 90) * 60;
      // pebbles
      for (let k = 0; k < 3; k++) inkEllipse(x + k * 16, 522 + (k % 2) * 6, 8 - k, 5 - k * 0.6, 0, ['#d6cfe0', '#c8bfae', '#b9c6d2'][k], 1.2);
      // tall reeds in the foreground
      if (hash(i + 91) < 0.55) for (let k = 0; k < 4; k++) {
        const rx = x + 70 + k * 7, sw = Math.sin(S.t * 1.6 + k + i) * 4;
        ctx.strokeStyle = k % 2 ? '#3f9a3a' : '#5fbf4a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(rx, H); ctx.quadraticCurveTo(rx + sw * 0.4, 500, rx + sw, 470 + k * 6); ctx.stroke();
      }
      else { ctx.fillStyle = ['#ff6fae', '#ffd84a', '#c6a2ff'][i & 1 ? 0 : 2]; for (let k = 0; k < 3; k++) circle(x + 80 + k * 10, 516 - (k % 2) * 4, 4); }
    }
  }

  // --- the dock at the finish, with Tilly waiting -------------------------------------------
  function dock(x, g) {
    const y = 300;
    ctx.fillStyle = 'rgba(20,60,100,.25)'; ellipse(x + 60, y + 10, 120, 12);
    for (const px of [0, 60, 120]) inkRect(x + px - 6, y - 30, 12, 60, '#8a5428', 1.8, 3);
    ink(P2(`M${x - 30},${y - 34} L${x + 150},${y - 34} L${x + 160},${y - 22} L${x - 20},${y - 22} Z`), '#d8a066', 2);
    ctx.strokeStyle = 'rgba(120,70,30,.6)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(x - 24 + k * 26, y - 34); ctx.lineTo(x - 16 + k * 26, y - 22); ctx.stroke(); }
    drawCritter('Tilly the Turtle', x + 70, y - 34, 0.55, -1);
    // finish flags
    for (const fx of [x - 24, x + 150]) {
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx, y - 34); ctx.lineTo(fx, y - 100); ctx.stroke();
      ink(P2(`M${fx},${y - 100} L${fx + 28},${y - 92} L${fx},${y - 84} Z`), '#ffd84a', 1.4);
    }
    if (g.finished) star(x + 60, y - 160 + Math.sin(S.t * 3) * 4, 20, '#fff6a8', 5);
  }

  // --- the level -----------------------------------------------------------------------------
  function buildLevel(g) {
    const t = g.tier;
    const obs = [];
    const add = o => { obs.push(o); return o; };
    const L = [5600, 6200, 6800][t - 1], step = [270, 250, 235][t - 1];
    const ry = () => rand(Y0 + 6, Y1 - 6);
    // a shuffled deck of patterns, so every run mixes steering, gaps and dodging
    const deck = { 1: ['litter', 'litter', 'rock', 'gap', 'ducks', 'pair', 'litter', 'rock', 'gap', 'ducks', 'litter', 'pair', 'rock', 'litter', 'gap', 'litter', 'rock', 'litter'],
      2: ['litter', 'rock', 'gap', 'ducks', 'pair', 'log', 'litter', 'gap', 'rock', 'ducks', 'pair', 'log', 'litter', 'gap', 'rock2', 'litter', 'log', 'pair', 'litter', 'gap'],
      3: ['litter', 'gap', 'rock2', 'ducks', 'pair', 'log', 'whirl', 'litter', 'gap', 'rock2', 'ducks', 'pair', 'log', 'whirl', 'litter', 'gap', 'pair', 'log', 'whirl', 'litter', 'rock2', 'litter'] }[t];
    const seq = ['litter', ...shuffle(deck.slice(1))];
    let x = 1000, last = 'litter', lastY = 350;
    for (let i = 0; i < seq.length && x < L - 500; i++) {
      let p = seq[i];
      if (p !== 'litter' && p === last) p = 'litter';
      if (p === 'litter') { lastY = lastY > (Y0 + Y1) / 2 ? rand(Y0 + 8, lastY - 90) : rand(lastY + 90, Y1 - 8); add({ k: 'litter', x, y: lastY, kind: randInt(0, 3) }); }
      else if (p === 'pair') {
        const a = ry(), b = clamp(a + (Math.random() < 0.5 ? -1 : 1) * rand(80, 130), Y0 + 8, Y1 - 8);
        add({ k: 'litter', x, y: a, kind: randInt(0, 3) }); add({ k: 'litter', x: x + 170, y: b, kind: randInt(0, 3) }); x += 90; lastY = b;
      } else if (p === 'rock') add({ k: 'rock', x, y: ry(), r: rand(30, 40), seed: i });
      else if (p === 'gap' || p === 'rock2') {
        // two rocks with a channel between them; a gap has a piece of rubbish waiting in the channel
        const gc = rand(Y0 + 70, Y1 - 70), half = p === 'gap' ? rand(78, 92) : rand(72, 86);
        add({ k: 'rock', x, y: gc - half - 6, r: 34, seed: i });
        add({ k: 'rock', x: x + 20, y: gc + half + 6, r: 36, seed: i + 1 });
        if (gc - half - 100 > Y0 && Math.random() < 0.5) add({ k: 'rock', x: x + 10, y: Y0 + 4, r: 26, seed: i + 2 });
        if (p === 'gap') { add({ k: 'litter', x: x + 10, y: gc, kind: randInt(0, 3) }); lastY = gc; }
      } else if (p === 'ducks') add({ k: 'ducks', x, y: ry(), vy: t === 1 ? (Math.random() < 0.5 ? 0 : 22) : 38, dir: Math.random() < 0.5 ? 1 : -1 });
      else if (p === 'log') add({ k: 'log', x, y: ry(), vy: 45 + t * 8, dir: Math.random() < 0.5 ? 1 : -1 });
      else if (p === 'whirl') add({ k: 'whirl', x, y: rand(Y0 + 50, Y1 - 50) });
      last = p;
      x += step + rand(-20, 30);
    }
    // nothing may sit on top of anything else: drop rubbish that landed in a hazard
    const hz = obs.filter(o => o.k !== 'litter');
    g.obs = obs.filter(o => o.k !== 'litter' || !hz.some(h => Math.abs(h.x - o.x) < 110 && Math.abs(h.y - o.y) < (h.k === 'whirl' ? 90 : 55)));
    for (const o of g.obs) { o.ph = Math.random() * TAU; o.got = false; }
    g.L = Math.max(x + 500, L);
    g.total = g.obs.filter(o => o.k === 'litter').length;
  }

  const FACTS = {
    start: 'Downstream means the way the water flows. Off we go!',
    first: 'Great scoop! Plastic floats, so it can drift all the way to the sea.',
    third: 'Rubbish can hurt fish and ducks. You are saving them!',
    rock: 'Bonk! Steer around the rocks.',
    duck: 'Oops! Go around the ducks. This creek is their home.',
    log: 'Watch out for floating logs! Wood floats, just like our raft.',
    whirl: 'Whee! Whirlpools spin you round. Steer away from them!',
    miss: 'One floated past! Steer up and down to scoop it.',
    fish: 'Look, the fish are jumping! Clean water makes happy fish.',
    end: 'You did it! A sparkly clean creek for everyone!',
  };
  function coach(g, key, force = false) {
    if (g.told[key] && !force) return;
    g.told[key] = true;
    g.bubble = { str: FACTS[key], t: 4.2 };
    speak(FACTS[key]);
  }

  // where the raft's footprint is (an ellipse round its logs)
  const RAFT_RX = 58, RAFT_RY = 15;
  function hits(g, o, rx, ry) {
    const dx = o.x - g.cam - g.rx, dy = o.y - (g.ry - 6);
    return (dx / (RAFT_RX + rx)) ** 2 + (dy / (RAFT_RY + ry)) ** 2 < 1;
  }
  function bump(g, o, key) {
    g.inv = 1.3; g.wob = 0.7; g.bumps++;
    g.kick = (g.ry - 6 < o.y ? -1 : 1) * 280;
    SFX.hit();
    floatText(g.rx, g.ry - 90, key === 'duck' ? 'Quack!' : 'Bonk!', '#ffb0b0', false, 26);
    burst(g.rx + 40, g.ry, 12, { colors: ['#ffffff', '#bfe9ff', '#8fd4ff'] });
    if (key === 'duck') { o.scared = 1.2; }
    coach(g, key);
  }

  MG.creekraft = {
    kind: 'action',
    title: () => 'Creek Clean-Up Raft',
    icon: () => '🛶',
    how: () => 'Steer the raft with the arrow keys or the mouse. Scoop up the floating rubbish, and go around the rocks and ducks!',
    init(g) {
      Object.assign(g, { cam: 0, rx: 230, ry: 350, got: 0, gotKinds: [], bumps: 0, missed: 0, inv: 0, wob: 0, kick: 0, spin: 0, paddle: 0, paddling: 0,
        told: {}, bubble: null, finished: false, endT: 0, fish: [], fishT: 3, speed: [150, 172, 195][g.tier - 1] });
      buildLevel(g);
      g.progress = `🧺 0 / ${g.total}`;
      g.say = 'Steer the raft. Scoop up the rubbish, and go around the rocks and ducks!';
    },
    start(g) { coach(g, 'start'); },
    update(g, dt) {
      g.inv = Math.max(0, g.inv - dt); g.wob = Math.max(0, g.wob - dt);
      if (g.bubble && (g.bubble.t -= dt) <= 0) g.bubble = null;
      // the creek carries us downstream until the dock comes into view
      const stopAt = g.L - 640;
      if (!g.finished) {
        g.cam = Math.min(stopAt, g.cam + g.speed * dt);
        if (g.cam >= stopAt) { g.finished = true; SFX.sparkle(); coach(g, 'end', true); }
      }
      // steering: arrows / WASD move the raft; the mouse pulls it towards the pointer
      const bx = g.rx, by = g.ry;
      if (g.finished) {
        g.rx = lerp(g.rx, 470, Math.min(1, dt * 2)); g.ry = lerp(g.ry, 330, Math.min(1, dt * 2));
        g.endT += dt;
        if (g.endT > 2.4) g.done = true;
      } else {
        const up = keys.arrowup || keys.w, dn = goDown(), lf = goLeft(), rt = goRight();
        const VS = 300, HS = 240;
        if (up) g.ry -= VS * dt;
        if (dn) g.ry += VS * dt;
        if (lf) g.rx -= HS * dt;
        if (rt) g.rx += HS * dt;
        if (pointerMoved(g) && !(up || dn || lf || rt)) {
          const tx = clamp(pointer.x, 120, 600), ty = clamp(pointer.y + 10, Y0, Y1);
          const dx = tx - g.rx, dy = ty - g.ry, d = Math.hypot(dx, dy), m = Math.min(d, 340 * dt);
          if (d > 1) { g.rx += dx / d * m; g.ry += dy / d * m; }
        }
        g.ry += g.kick * dt; g.kick *= Math.pow(0.02, dt);
      }
      // whirlpools tug the raft towards their middle
      for (const o of g.obs) if (o.k === 'whirl') {
        const dx = o.x - g.cam - g.rx, dy = (o.y - g.ry) * 2.2, d = Math.hypot(dx, dy);
        if (d < 170 && d > 1) { const pull = 110 * (1 - d / 170); g.rx += dx / d * pull * dt; g.ry += dy / d * pull * dt / 2.2; }
      }
      g.rx = clamp(g.rx, 110, 610); g.ry = clamp(g.ry, Y0, Y1);
      const moved = Math.hypot(g.rx - bx, g.ry - by) / Math.max(dt, 1e-3);
      g.paddling = lerp(g.paddling, moved > 30 ? 1 : 0, Math.min(1, dt * 6));
      g.paddle += dt * (2 + g.paddling * 9);
      g.spin = g.spin ? g.spin * Math.pow(0.05, dt) : 0;
      if (Math.abs(g.spin) < 0.01) g.spin = 0;

      // moving things
      for (const o of g.obs) {
        if ((o.k === 'ducks' || o.k === 'log') && o.vy) {
          o.y += o.vy * o.dir * dt;
          if (o.y < Y0 + 10 || o.y > Y1 - 10) { o.dir *= -1; o.y = clamp(o.y, Y0 + 10, Y1 - 10); }
        }
        if (o.scared) { o.scared = Math.max(0, o.scared - dt); o.x += 120 * dt; }
      }
      // scooping and bumping
      for (const o of g.obs) {
        const sx = o.x - g.cam;
        if (sx < -200 || sx > W + 200) continue;
        if (o.k === 'litter' && !o.got) {
          // the net reaches a little in front of and around the raft
          const dx = sx - (g.rx + 14), dy = o.y - (g.ry - 4);
          if ((dx / 84) ** 2 + (dy / 34) ** 2 < 1) {
            o.got = true; g.got++; g.gotKinds.push(o.kind);
            SFX.pop(); SFX.pick();
            burst(sx, o.y - 10, 10, { colors: ['#fff6a8', '#b8ffcf', '#ffffff'] });
            floatText(sx, o.y - 40, '+1', '#fff6a8', false, 26);
            if (g.got === 1) coach(g, 'first'); else if (g.got === 3) coach(g, 'third');
          } else if (sx < g.rx - 90 && !o.missed) {
            o.missed = true; g.missed++;
            if (g.missed === 1) coach(g, 'miss');
          }
        }
        if (g.inv > 0 || g.finished) continue;
        if (o.k === 'rock' && hits(g, o, o.r * 0.75, o.r * 0.36)) bump(g, o, 'rock');
        else if (o.k === 'log' && hits(g, o, 66, 8)) bump(g, o, 'log');
        else if (o.k === 'ducks' && !o.scared && hits(g, o, 46, 12)) bump(g, o, 'duck');
        else if (o.k === 'whirl') {
          const dx = sx - g.rx, dy = (o.y - g.ry) * 2.2;
          if (Math.hypot(dx, dy) < 40) { bump(g, o, 'whirl'); g.spin = 2.4; g.kick = (g.ry < o.y ? -1 : 1) * 340; g.rx -= 30; }
        }
      }
      // decorative jumping fish, in clear water ahead
      if ((g.fishT -= dt) <= 0) {
        g.fishT = rand(2.5, 4.5);
        g.fish.push({ x: rand(620, 900), y: rand(Y0 + 20, Y1 - 30), k: 0 });
        if (g.got >= 4 && !g.finished) coach(g, 'fish');
      }
      for (const f of g.fish) f.k += dt * 0.9;
      g.fish = g.fish.filter(f => f.k < 1);

      // score: mostly rubbish scooped, the rest for a gentle, bump-free ride
      const clean = g.total ? g.got / g.total : 1;
      const safe = Math.max(0, 1 - g.bumps * 0.25);
      g.score = clamp(clean * (0.65 + 0.35 * safe), 0, 1);
      g.progress = `🧺 ${g.got} / ${g.total}`;
    },
    draw(g) {
      scenery(g);
      // sort everything on the water by depth (y), raft included
      const list = [];
      for (const o of g.obs) {
        const sx = o.x - g.cam;
        if (sx < -160 || sx > W + 160) continue;
        if (o.k === 'litter' && o.got) continue;
        list.push(o);
      }
      for (const o of list) if (o.k === 'whirl') whirlpool(o.x - g.cam, o.y, 70 * depth(o.y));
      list.push({ k: 'raft', y: g.ry });
      for (const f of g.fish) list.push({ k: 'fish', y: f.y, f });
      if (g.L - g.cam < W + 200) list.push({ k: 'dock', y: 300 });
      list.sort((a, b) => a.y - b.y);
      for (const o of list) {
        const sx = o.x - g.cam, s = depth(o.y);
        if (o.k === 'litter') {
          const bob = Math.sin(S.t * 3 + o.ph) * 3;
          ringRipple(sx, o.y + 2, 40 * s, (S.t * 0.7 + o.ph) % 1);
          // a soft yellow glow so rubbish is easy to spot
          const gr = ctx.createRadialGradient(sx, o.y - 8, 4, sx, o.y - 8, 44 * s);
          gr.addColorStop(0, 'rgba(255,250,170,.55)'); gr.addColorStop(1, 'rgba(255,250,170,0)');
          ctx.fillStyle = gr; ctx.fillRect(sx - 50, o.y - 58, 100, 100);
          litter(o.kind, sx, o.y + bob * 0.5, s * 1.05, Math.sin(S.t * 1.8 + o.ph) * 0.18);
          ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(sx, o.y + 4, 30 * s, 4);
        } else if (o.k === 'rock') boulder(sx, o.y, o.r * s, o.seed);
        else if (o.k === 'log') floatLog(sx, o.y + Math.sin(S.t * 2 + o.ph) * 2, s);
        else if (o.k === 'ducks') {
          const flip = o.scared ? false : true, bob = Math.sin(S.t * 3 + o.ph) * 2;
          ringRipple(sx, o.y + 2, 60 * s, (S.t * 0.6 + o.ph) % 1);
          drawDuckSpecies('mallard', sx, o.y + 4 + bob, 0.54 * s, flip);
          duckling(sx + 50 * s, o.y + 2 - bob, 0.9 * s, flip);
          duckling(sx + 82 * s, o.y + 2 + bob, 0.8 * s, flip);
          if (o.scared) outlined('Quack!', sx, o.y - 70, 18, '#fff');
        } else if (o.k === 'raft') {
          if (g.inv > 0 && Math.floor(g.inv * 10) % 2) ctx.globalAlpha = 0.55;
          raft(g, g.rx, g.ry, depth(g.ry));
          ctx.globalAlpha = 1;
        } else if (o.k === 'fish') jumpFish(o.f.x, o.f.y, o.f.k, depth(o.f.y) * 0.9);
        else if (o.k === 'dock') dock(g.L - g.cam - 60, g);
      }
      nearBank(g);
      // route bar: how far to Tilly's dock
      const rbx = 450, rbw = 290, rby = 76;
      darkPanel(rbx - 16, rby - 16, rbw + 64, 32, 16);
      rrect(rbx, rby - 4, rbw, 8, 4, 'rgba(255,255,255,.35)');
      const k = clamp(g.cam / (g.L - 640), 0, 1);
      rrect(rbx, rby - 4, rbw * k, 8, 4, '#7fe0ff');
      emoji('🛶', rbx + rbw * k, rby - 4, 26);
      emoji('🐢', rbx + rbw + 22, rby - 2, 20);
      // Tilly's coaching bubble
      if (g.bubble) {
        const a = clamp(g.bubble.t * 3, 0, 1);
        ctx.globalAlpha = a;
        const lines = wrap(g.bubble.str, 330, 17);
        const h = 22 + lines.length * 22;
        panel(14, 66, 410, h, 16);
        ctx.save(); ctx.beginPath(); ctx.arc(48, 66 + h / 2, 26, 0, TAU); ctx.clip();
        ctx.fillStyle = '#d8f4c0'; ctx.fillRect(20, 66 + h / 2 - 28, 56, 56);
        drawCritterPortrait('Tilly the Turtle', 22, 66 + h / 2 - 26, 52, 52);
        ctx.restore();
        lines.forEach((l, i) => text(l, 84, 66 + 22 + i * 22, 17, '#5a2a6e', 'left', 600));
        ctx.globalAlpha = 1;
      }
    },
  };

  restage('creek', {
    games: [['creekraft', 'shell', {}], ['creekchimes', 'berry', {}]],
    intro: [
      "N:Hello, Aubrey! Oh dear... someone dropped rubbish in my creek, and it's floating away downstream!",
      'N:Hop on my little log raft. Steer around the rocks, mind the duck families, and scoop up every bit of rubbish!',
      'A:determined:Creek Clean-Up Crew, ready to paddle!',
    ],
    mid: [
      'N:A sparkly clean creek! The fish are jumping for joy. Now listen... can you hear my creek stones singing?',
      'N:When a water drop taps a stone, it rings! Big stones sing low, and little stones sing high.',
      'A:excited:A creek xylophone! Teach me your songs, Tilly!',
    ],
  });
}
