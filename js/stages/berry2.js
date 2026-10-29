'use strict';
{
  // ===========================================================================
  // The Bramble Berry Patch becomes DIGBY'S BUILDING SITE: a sunny construction site with a tall
  // tower crane, a half-built clubhouse in scaffolding, a spinning cement mixer and cones everywhere.
  // The boss is Digby the Mole, in a yellow hard hat with a headlamp.
  //   game 1 (action) Digger Scoop: drive a real two-joint digger arm. Push the bucket into the
  //            pile to scoop, swing it over the dump truck and dump it. Move too fast and the dirt
  //            spills out, and a cheeky bird can bump the bucket. Tier 2+: trucks want SAND or ROCKS.
  //   game 2 (learn) Brick Order: place value. Load the truck with stacks of TEN and single ONES to
  //            make Digby's number (ten ones snap together into a ten!). Some rounds flip it round:
  //            read a loaded truck and say how many bricks. Every order adds a floor to the clubhouse.
  // ===========================================================================
  const FRIEND = 'Digby the Mole';
  const say = (g, s) => { g.say = s; speak(s); };
  // outline every shape first, then fill them all, so overlapping parts read as one shape
  const inkAll = (items, lw, line = OL) => {
    ctx.strokeStyle = line; ctx.lineWidth = lw * 2;
    for (const [p] of items) ctx.stroke(p);
    for (const [p, f] of items) { ctx.fillStyle = f; ctx.fill(p); }
  };
  const TENS_W = ['', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const numWord = n => (n <= 20 ? NUM_WORDS[n] : TENS_W[Math.floor(n / 10)] + (n % 10 ? '-' + NUM_WORDS[n % 10] : ''));
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const bubble = (x, y, str, col = '#5a2a6e') => {
    ctx.font = `700 17px ${FONT}`; const w = ctx.measureText(str).width + 26;
    const bx = clamp(x, w / 2 + 8, W - w / 2 - 8);
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(bx - w / 2 - 2.5, y - 20.5, w + 5, 41, 20); ctx.fill(); tri(x - 10, y + 16, x + 10, y + 16, x + 2, y + 32);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(bx - w / 2, y - 18, w, 36, 18); ctx.fill(); tri(x - 7, y + 14, x + 7, y + 14, x + 2, y + 28);
    text(str, bx, y, 17, col, 'center', 700);
  };

  // --- Digby the Mole: a hard hat with a headlamp, and a little shovel ----------------------------
  CR_HATS.bb2hardhat = (r, L, sp, t) => {
    const brim = P2(`M${-r * 1.08},${r * 0.2} C${-r * 0.95},${r * 0.02} ${r * 0.95},${r * 0.02} ${r * 1.08},${r * 0.2} C${r * 0.8},${r * 0.34} ${-r * 0.8},${r * 0.34} ${-r * 1.08},${r * 0.2} Z`);
    const dome = P2(`M${-r * 0.8},${r * 0.16} C${-r * 0.84},${-r * 0.8} ${r * 0.84},${-r * 0.8} ${r * 0.8},${r * 0.16} Z`);
    const lamp = new Path2D(); lamp.arc(r * 0.5, -r * 0.12, r * 0.17, 0, TAU);
    inkAll([[brim, '#f0aa18'], [dome, '#ffd23a'], [lamp, '#fff6c0']], 1.2, L);
    ctx.fillStyle = '#f0b020'; ctx.beginPath(); ctx.roundRect(-r * 0.1, -r * 0.6, r * 0.2, r * 0.74, r * 0.08); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-r * 0.4, -r * 0.3, r * 0.18, r * 0.08, -0.6);
    const glowA = 0.35 + 0.25 * Math.sin(t * 3);
    const gr = ctx.createRadialGradient(r * 0.5, -r * 0.12, 1, r * 0.5, -r * 0.12, r * 0.6);
    gr.addColorStop(0, `rgba(255,250,190,${glowA})`); gr.addColorStop(1, 'rgba(255,250,190,0)');
    ctx.fillStyle = gr; circle(r * 0.5, -r * 0.12, r * 0.6);
  };
  CR_HOLD.bb2shovel = (L) => {
    ctx.save(); ctx.rotate(0.25);
    ctx.lineCap = 'round';
    ctx.strokeStyle = L; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(0, 34); ctx.stroke();
    ctx.strokeStyle = '#c8864a'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = L; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-9, -40); ctx.lineTo(9, -40); ctx.stroke();
    ctx.strokeStyle = '#ff6f5a'; ctx.lineWidth = 5; ctx.stroke();
    ink(P2('M-13,30 L13,30 L14,48 C14,62 0,70 0,70 C0,70 -14,62 -14,48 Z'), '#b8c4d8', 1.1, L);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-8, 36, 4, 16);
    ctx.restore();
  };
  CHARACTERS[FRIEND] = {
    col: '#7a6890', belly: '#b8a8cc', bw: 40, bh: 64, hr: 40, ears: 'none', nose: 'pig', noseCol: '#ff8ab0',
    eyes: 'tiny', mouth: 'grin', whiskers: true, hat: 'bb2hardhat', hatTilt: -0.06, hold: 'bb2shovel',
    bigFeet: true, feetCol: '#ff9ab8', handCol: '#ff9ab8', apron: '#ff8a2a', tail: 'stub', shape: 'pear', seed: 3.3,
  };

  // =============================================================================================
  // small props (shared by the backdrop and the games)
  // =============================================================================================
  function drawCone(x, gy, s) {
    ctx.save(); ctx.translate(x, gy); ctx.scale(s, s);
    inkAll([[P2('M-18,0 L18,0 L18,-6 L-18,-6 Z'), '#ff7a2a'], [P2('M-11,-6 L-3,-40 L3,-40 L11,-6 Z'), '#ff8a2a']], 1.2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-7.5, -26, 15, 6); ctx.fillRect(-5, -36, 10, 4);
    ctx.restore();
  }
  function drawBrick(x, y, w, h, col) {
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(x - 1.5, y - 1.5, w + 3, h + 3, 3); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x, y, w, h, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 2, y + 1.5, w - 4, h * 0.25);
  }
  function drawBrickStack(x, gy, cols, rows) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols - (r % 2 ? 1 : 0); c++)
      drawBrick(x + c * 26 + (r % 2 ? 13 : 0), gy - (r + 1) * 13, 24, 11, ['#e0603a', '#d8543a', '#e8704a'][(r + c) % 3]);
  }
  function drawPipes(x, gy) {
    for (const [px, py, pr] of [[x, gy - 26, 26], [x + 54, gy - 26, 26], [x + 27, gy - 70, 26]]) {
      inkCircle(px, py, pr, '#c8c4d4', 1.4);
      ctx.fillStyle = '#8a86a0'; circle(px, py, pr * 0.62);
      ctx.fillStyle = '#6a6680'; circle(px + 3, py + 3, pr * 0.5);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ellipse(px - pr * 0.5, py - pr * 0.5, pr * 0.22, pr * 0.1, -0.7);
    }
  }
  function drawMixer(x, gy, t) {
    // a little cement mixer with a spinning, stripy drum
    ctx.save(); ctx.translate(x, gy);
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(-8, -40); ctx.lineTo(10, 0); ctx.stroke();
    ctx.strokeStyle = '#4a7ae0'; ctx.lineWidth = 3; ctx.stroke();
    inkCircle(16, -8, 9, '#3a3248', 1.2); ctx.fillStyle = '#a8a4b8'; circle(16, -8, 3.5);
    ctx.save(); ctx.translate(-4, -56); ctx.rotate(-0.45);
    const drum = P2('M-34,-22 C-14,-30 14,-26 30,-12 L36,0 L30,12 C14,26 -14,30 -34,22 C-42,10 -42,-10 -34,-22 Z');
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke(drum); ctx.fillStyle = '#ff8a2a'; ctx.fill(drum);
    ctx.save(); ctx.clip(drum);
    const ph = (t * 40) % 24;
    ctx.fillStyle = '#ffd23a';
    for (let i = -4; i < 5; i++) { const sx = -40 + i * 24 + ph; ctx.beginPath(); ctx.moveTo(sx, -32); ctx.lineTo(sx + 10, -32); ctx.lineTo(sx + 2, 32); ctx.lineTo(sx - 8, 32); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    inkEllipse(36, 0, 5, 9, 0, '#3a3248', 1);
    ctx.restore();
    ctx.restore();
  }
  function drawWheelbarrow(x, gy) {
    ctx.save(); ctx.translate(x, gy);
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-50, -34); ctx.lineTo(18, -18); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-28, -22); ctx.lineTo(-30, 0); ctx.stroke();
    ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-50, -34); ctx.lineTo(18, -18); ctx.stroke();
    inkCircle(22, -12, 12, '#3a3248', 1.2); ctx.fillStyle = '#c8c4d4'; circle(22, -12, 4);
    ink(P2('M-36,-40 L26,-40 L16,-18 L-26,-18 Z'), '#3ab06a', 1.2);
    ctx.fillStyle = '#d8a050'; ellipse(-5, -40, 28, 7);
    ctx.restore();
  }
  function drawBarrier(x, gy, t, i) {
    ctx.save(); ctx.translate(x, gy);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(k * 30, 0); ctx.lineTo(k * 24, -34); ctx.stroke(); }
    inkRect(-38, -46, 76, 16, '#ffffff', 2.5, 3);
    ctx.save(); ctx.beginPath(); ctx.rect(-37, -45, 74, 14); ctx.clip(); ctx.fillStyle = '#ff5a3a';
    for (let s = -50; s < 50; s += 16) { ctx.beginPath(); ctx.moveTo(s, -45); ctx.lineTo(s + 8, -45); ctx.lineTo(s + 2, -31); ctx.lineTo(s - 6, -31); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // a blinking amber lamp
    const on = Math.sin(t * 5 + i * 2) > 0;
    if (on) { ctx.fillStyle = 'rgba(255,190,60,.4)'; circle(0, -56, 14); }
    inkCircle(0, -56, 7, on ? '#ffc23a' : '#c8862a', 1.2);
    ctx.restore();
  }

  // =============================================================================================
  // BACKDROP: Digby's Building Site
  // =============================================================================================
  const SITE_Y = 404; // where the far side of the site meets the ground
  function drawTowerCrane(t) {
    const mx = 128, top = 96, jy = 96;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const beam = (x1, y1, x2, y2, w, col) => {
      ctx.strokeStyle = OL; ctx.lineWidth = w + 3; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    };
    // mast: two rails with zigzag braces
    for (let y = SITE_Y; y > top + 20; y -= 28) { beam(mx, y, mx + 30, y - 28, 2.5, '#ffc83a'); beam(mx + 30, y - 28, mx + 30, y - 28, 1, '#ffc83a'); }
    beam(mx, SITE_Y, mx, top + 8, 5, '#ffcc2a'); beam(mx + 30, SITE_Y, mx + 30, top + 8, 5, '#ffcc2a');
    // apex and tie cables
    ctx.strokeStyle = 'rgba(70,50,90,.7)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(mx + 15, 66); ctx.lineTo(660, jy); ctx.moveTo(mx + 15, 66); ctx.lineTo(36, jy); ctx.stroke();
    beam(mx + 2, jy, mx + 15, 66, 4, '#ffcc2a'); beam(mx + 28, jy, mx + 15, 66, 4, '#ffcc2a');
    // jib: a long lattice arm
    beam(30, jy, 664, jy, 5, '#ffcc2a'); beam(160, jy + 16, 664, jy + 6, 4, '#ffcc2a');
    for (let x = 166; x < 650; x += 26) beam(x, jy + 15, x + 13, jy + 1, 2, '#ffd84a');
    // counterweights and the driver's cab
    inkRect(36, jy + 2, 52, 30, '#a8a4b8', 2.5, 3); ctx.fillStyle = '#8a86a0'; ctx.fillRect(38, jy + 16, 48, 3);
    inkRect(mx + 30, jy + 6, 30, 26, '#ffcc2a', 2.5, 4); inkRect(mx + 40, jy + 10, 16, 14, '#bfe6ff', 2, 3);
    // trolley, cable and a swinging bundle of planks
    const tx = 470 + Math.sin(t * 0.25) * 130, len = 150 + Math.sin(t * 0.4) * 24, sw = Math.sin(t * 1.2) * 0.06;
    inkRect(tx - 14, jy + 2, 28, 12, '#5a5a70', 2, 3);
    const hx = tx + Math.sin(sw) * len, hy = jy + 14 + Math.cos(sw) * len;
    ctx.strokeStyle = '#3a3248'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx - 4, jy + 14); ctx.lineTo(hx - 3, hy); ctx.moveTo(tx + 4, jy + 14); ctx.lineTo(hx + 3, hy); ctx.stroke();
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(sw * 2);
    inkRect(-8, -2, 16, 12, '#ff6f5a', 2, 3);
    ctx.strokeStyle = '#3a3248'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-2, 10); ctx.lineTo(-40, 26); ctx.moveTo(2, 10); ctx.lineTo(40, 26); ctx.stroke();
    for (let i = 0; i < 3; i++) inkRect(-46, 24 + i * 9, 92, 9, ['#ffb0d0', '#ffc8e0', '#ff9ac0'][i], 2, 2);
    ctx.restore();
  }
  function drawClubhouse(t) {
    // the half-built clubhouse: two finished floors, a steel frame on top, scaffolding and a net
    const x0 = 560, x1 = 800, fh = 70;
    ctx.fillStyle = 'rgba(60,40,80,.12)'; ctx.fillRect(x0 + 10, SITE_Y - 6, x1 - x0, 10);
    for (let f = 0; f < 2; f++) {
      const y = SITE_Y - (f + 1) * fh;
      inkRect(x0, y, x1 - x0, fh, f ? '#ffd8b8' : '#ffc8a8', 3, 2);
      ctx.fillStyle = 'rgba(200,90,60,.22)';
      for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) ctx.fillRect(x0 + 4 + c * 24 + (r % 2 ? 12 : 0), y + 4 + r * 13, 20, 2);
      inkRect(x0 - 6, y - 6, x1 - x0 + 12, 8, '#c8c4d4', 2.5, 2);
      for (let w = 0; w < 4; w++) {
        const wx = x0 + 22 + w * 56;
        if (f === 0 && w === 1) { inkRect(wx, y + 18, 40, fh - 18, '#8a5a3a', 2.5, 4); ctx.fillStyle = '#ffd84a'; circle(wx + 32, y + 46, 3); continue; }
        inkRect(wx, y + 18, 40, 34, '#bfe6ff', 2.5, 4);
        ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(wx + 6, y + 22, 6, 24);
      }
    }
    // the steel frame on top
    const ty = SITE_Y - 2 * fh;
    ctx.lineCap = 'butt';
    const ibeam = (x1_, y1_, x2_, y2_) => { ctx.strokeStyle = OL; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x1_, y1_); ctx.lineTo(x2_, y2_); ctx.stroke(); ctx.strokeStyle = '#e8483a'; ctx.lineWidth = 6; ctx.stroke(); };
    for (const bx of [x0 + 4, x0 + 82, x0 + 160, x1 - 4]) ibeam(bx, ty - 6, bx, ty - fh);
    ibeam(x0 - 2, ty - fh, x1 + 2, ty - fh); ibeam(x0 + 4, ty - 36, x0 + 160, ty - 36);
    // scaffolding up the left side
    ctx.lineCap = 'round';
    for (const px of [x0 - 44, x0 - 10]) { ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(px, SITE_Y); ctx.lineTo(px, ty - fh - 10); ctx.stroke(); ctx.strokeStyle = '#a8b4c8'; ctx.lineWidth = 3; ctx.stroke(); }
    for (let y = SITE_Y - 48; y > ty - fh; y -= 52) inkRect(x0 - 50, y, 46, 7, '#d8a050', 2, 2);
    ctx.strokeStyle = '#a8b4c8'; ctx.lineWidth = 2;
    for (let y = SITE_Y; y > ty - fh + 40; y -= 52) { ctx.beginPath(); ctx.moveTo(x0 - 44, y); ctx.lineTo(x0 - 10, y - 52); ctx.stroke(); }
    // orange safety net over the right half of the frame, bellying in the breeze
    ctx.save(); ctx.globalAlpha = 0.55; ctx.strokeStyle = '#ff7a2a'; ctx.lineWidth = 1.5;
    const nb = Math.sin(t * 1.4) * 4;
    for (let x = x0 + 166; x <= x1 - 6; x += 9) { ctx.beginPath(); ctx.moveTo(x, ty - fh + 4); ctx.quadraticCurveTo(x + nb, ty - 36, x, ty - 6); ctx.stroke(); }
    for (let y = ty - fh + 6; y < ty - 4; y += 9) { ctx.beginPath(); ctx.moveTo(x0 + 166, y); ctx.lineTo(x1 - 6, y); ctx.stroke(); }
    ctx.restore();
    // bunting from the frame to the crane, and a little flag on top
    const flags = ['#ff5f7e', '#ffd83a', '#5adc7a', '#40b0ff', '#c6a2ff'];
    for (let i = 0; i < 9; i++) {
      const k = i / 8, fx = x0 + 2 + k * (x1 - x0 - 4), fy = ty - fh + 4 + Math.sin(k * Math.PI) * 16;
      const flap = Math.sin(t * 3 + i) * 2;
      ctx.fillStyle = OL; tri(fx - 8, fy - 1, fx + 8, fy - 1, fx + flap, fy + 15);
      ctx.fillStyle = flags[i % 5]; tri(fx - 6, fy, fx + 6, fy, fx + flap, fy + 12);
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1 - 4, ty - fh); ctx.lineTo(x1 - 4, ty - fh - 40); ctx.stroke();
    const fw = Math.sin(t * 4) * 4;
    ink(P2(`M${x1 - 4},${ty - fh - 40} Q${x1 + 14},${ty - fh - 36 + fw} ${x1 + 30},${ty - fh - 34} Q${x1 + 14},${ty - fh - 28 - fw} ${x1 - 4},${ty - fh - 24} Z`), '#5adc7a', 1);
  }
  function drawSite() {
    const t = S.t;
    bdSky('#62bfff', '#d8f2ff');
    bdSunburst(872, 118);
    bdClouds(4, 'rgba(255,255,255,.92)', 96);
    // the town far away
    const town = [[0, 70, 120, '#c8c0ec'], [62, 56, 160, '#b8d0f4'], [112, 80, 96, '#d8c4ec'], [300, 64, 140, '#c4d8f4'], [358, 90, 110, '#d8cce8'], [440, 60, 176, '#c0c8f0'], [800, 70, 130, '#d0c4ec'], [864, 96, 100, '#c4d4f4']];
    for (const [x, w, h, c] of town) {
      ctx.fillStyle = c; ctx.fillRect(x, SITE_Y - 40 - h, w, h + 40);
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (let wy = SITE_Y - 28 - h; wy < SITE_Y - 50; wy += 22) for (let wx = x + 9; wx < x + w - 12; wx += 17) ctx.fillRect(wx, wy, 8, 10);
    }
    bdHills('#a4dc8e', SITE_Y - 30, 10, 0.012, 2);
    bdHills('#8ad07a', SITE_Y - 8, 8, 0.02, 0.5);
    drawTowerCrane(t);
    drawClubhouse(t);
    // the site ground: packed sandy dirt with tyre tracks and pebbles
    const gr = ctx.createLinearGradient(0, SITE_Y, 0, H);
    gr.addColorStop(0, '#e8bc78'); gr.addColorStop(1, '#d8a060');
    ctx.fillStyle = gr; ctx.fillRect(0, SITE_Y, W, H - SITE_Y);
    ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, SITE_Y); ctx.lineTo(W, SITE_Y); ctx.stroke();
    ctx.fillStyle = 'rgba(150,90,50,.18)';
    for (const [x, y, rx] of [[120, 470, 90], [520, 500, 120], [840, 466, 70], [330, 432, 60]]) ellipse(x, y, rx, rx * 0.16);
    ctx.fillStyle = 'rgba(120,70,40,.22)';
    for (let x = -20; x < W; x += 22) { ctx.fillRect(x, 506, 14, 5); ctx.fillRect(x + 6, 524, 14, 5); }
    for (let i = 0; i < 40; i++) { ctx.fillStyle = ['#c08850', '#f4d49a', '#a87848'][i % 3]; ellipse((i * 157) % W, SITE_Y + 10 + (i * 53) % (H - SITE_Y - 14), 3 + (i % 3), 2 + (i % 2)); }
    // a puddle with the sky in it
    inkEllipse(640, 452, 46, 9, 0, '#9ad8ff', 1); ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(628 + Math.sin(t) * 3, 450, 14, 2.5);
    // props along the back of the site
    drawBrickStack(286, SITE_Y + 30, 4, 4);
    drawMixer(440, SITE_Y + 30, t);
    drawPipes(838, SITE_Y + 36);
    drawBarrier(206, SITE_Y + 34, t, 0);
    drawBarrier(500, SITE_Y + 30, t, 1);
    // a sand pile with a spade stuck in it
    ctx.fillStyle = OL; ellipse(54, SITE_Y + 46, 64, 40); ctx.fillStyle = '#f4cc70'; ellipse(54, SITE_Y + 47, 61, 37);
    ctx.fillStyle = '#ffe098'; ellipse(40, SITE_Y + 26, 26, 9); ctx.fillStyle = '#d8a848'; for (let i = 0; i < 8; i++) circle(14 + i * 11, SITE_Y + 56 + (i % 2) * 6, 2);
    ctx.save(); ctx.translate(74, SITE_Y + 16); ctx.rotate(0.35); CR_HOLD.bb2shovel(OL, t); ctx.restore();
    // the sign
    ctx.strokeStyle = OL; ctx.lineWidth = 6; for (const px of [326, 414]) { ctx.beginPath(); ctx.moveTo(px, SITE_Y + 10); ctx.lineTo(px, SITE_Y - 46); ctx.stroke(); }
    inkRect(296, SITE_Y - 92, 148, 54, '#ffd23a', 3, 8);
    ctx.save(); ctx.beginPath(); ctx.roundRect(298, SITE_Y - 46, 144, 7, 2); ctx.clip(); ctx.fillStyle = '#3a3248';
    for (let s = 290; s < 450; s += 14) { ctx.beginPath(); ctx.moveTo(s, SITE_Y - 46); ctx.lineTo(s + 7, SITE_Y - 46); ctx.lineTo(s + 2, SITE_Y - 39); ctx.lineTo(s - 5, SITE_Y - 39); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    text("DIGBY'S", 370, SITE_Y - 78, 16, '#5a2a1a', 'center', 800);
    text('BUILDING SITE', 370, SITE_Y - 59, 14, '#5a2a1a', 'center', 800);
    // cones and a wheelbarrow near the front edges, leaving the middle clear for walking
    drawCone(28, 498, 0.9); drawCone(934, 502, 0.95); drawCone(476, 528, 0.7); drawCone(160, 530, 0.62);
    drawWheelbarrow(890, 452);
    // a butterfly passing through
    const bx = (t * 40) % (W + 200) - 100, by = 300 + Math.sin(t * 2) * 20, k = 0.4 + 0.6 * Math.abs(Math.sin(t * 9));
    for (const d of [-1, 1]) { ctx.fillStyle = OL; ellipse(bx + d * 7 * k, by - 3, 8 * k + 1.5, 7); ctx.fillStyle = '#ff9ac0'; ellipse(bx + d * 7 * k, by - 3, 8 * k, 5.5); }
    ctx.fillStyle = OL; ellipse(bx, by, 2, 6);
  }
  BACKDROPS.buildsite_bb2 = () => drawSite();

  // =============================================================================================
  // GAME 1 (action): DIGGER SCOOP
  // =============================================================================================
  const DG = { px: 452, py: 352, L1: 205, L2: 185, spill: 620, maxV: 1150 };
  const MATC = { dirt: ['#b07440', '#7a4a22'], sand: ['#f8d070', '#d8a040'], rock: ['#b4b4c4', '#70708a'] };
  const MATN = { dirt: 'DIRT', sand: 'SAND', rock: 'ROCKS' };
  const MATW = { dirt: 'dirt', sand: 'sand', rock: 'rocks' };
  const BED = { x0: 612, x1: 778, top: 372 }; // the truck bed when the truck is parked (tx = 0)
  const pileTop = (p, x) => { const u = (x - p.cx) / p.hw; return u * u >= 1 ? GY : GY - p.h * Math.pow(1 - u * u, 0.8); };
  const overBed = (g, x, y) => g.tstate === 'wait' && x > BED.x0 + 6 && x < BED.x1 - 6 && y < BED.top + 6 && y > BED.top - 250;

  function solveArm(tx, ty) {
    let dx = tx - DG.px, dy = ty - DG.py, d = Math.hypot(dx, dy);
    const dmax = DG.L1 + DG.L2 - 4, dmin = 60;
    if (d > dmax) { dx *= dmax / d; dy *= dmax / d; d = dmax; }
    if (d < dmin) { dx *= dmin / d; dy *= dmin / d; d = dmin; }
    const a = Math.atan2(dy, dx), b = Math.acos(clamp((DG.L1 * DG.L1 + d * d - DG.L2 * DG.L2) / (2 * DG.L1 * d), -1, 1));
    // pick the elbow that sits higher up (like a real digger's boom)
    const e1 = [DG.px + Math.cos(a - b) * DG.L1, DG.py + Math.sin(a - b) * DG.L1], e2 = [DG.px + Math.cos(a + b) * DG.L1, DG.py + Math.sin(a + b) * DG.L1];
    return { ex: (e1[1] < e2[1] ? e1 : e2)[0], ey: (e1[1] < e2[1] ? e1 : e2)[1], x: DG.px + dx, y: DG.py + dy };
  }
  function addClods(g, x, y, n, type, vx = 0, to = null) {
    for (let i = 0; i < n; i++) g.clods.push({ x: x + rand(-14, 14), y: y + rand(-6, 6), vx: vx + rand(-50, 50), vy: rand(-60, 10), r: rand(3, 6.5), type, life: 2.2, rest: false, to });
  }
  function dgFinish(g, all) {
    if (g.endT > 0) return;
    g.endT = 1.6;
    if (all) { SFX.sparkle(); say(g, 'All the trucks are full! Great digging!'); burst(700, 300, 26); }
    else say(g, 'Time is up! Good digging!');
  }
  function dgDump(g) {
    if (g.load <= 0.02 || g.dumpT > 0) return;
    const load = g.load, type = g.ltype, x = g.bx, y = g.by;
    g.dumpT = 0.55; g.load = 0;
    const truck = g.trucks[g.ti];
    if (overBed(g, x, y)) {
      if (type === truck.want) {
        const add = Math.min(load, truck.need - truck.got);
        truck.got += add; g.delivered += add;
        addClods(g, x, y + 14, Math.ceil(load * 14), type, 0, 'bed');
        SFX.hit(); floatText(x, y - 40, load > 0.9 ? 'Full scoop!' : '+ scoop', '#fff', false, 20);
        if (truck.got >= truck.need - 0.12) {
          truck.got = truck.need; g.tstate = 'leave';
          tone(392, 0.18, 'square', 0.05); tone(392, 0.18, 'square', 0.05, 0.25);
          say(g, g.ti + 1 < g.trucks.length ? 'Beep beep! That truck is full!' : 'Beep beep! The last truck is full!');
          burst(700, 330, 18);
        } else if (load < 0.6) say(g, 'Only a little bit. Fill the bucket right up!');
      } else {
        addClods(g, x, y + 14, Math.ceil(load * 12), type, 0, null);
        SFX.miss(); say(g, `Oops! This truck wants ${MATW[truck.want]}!`);
      }
      return;
    }
    const p = g.piles.find(p => Math.abs(x - p.cx) < p.hw * 0.9 && y > pileTop(p, x) - 120);
    if (p && p.type === type) { p.h = Math.min(p.h0, p.h + load * 4); addClods(g, x, y + 14, Math.ceil(load * 10), type, 0, null); tone(300, 0.1, 'triangle', 0.06); return; }
    addClods(g, x, y + 14, Math.ceil(load * 14), type, 0, null);
    g.spilled += load;
    SFX.miss(); say(g, 'Oops! That went on the ground. Dump it in the truck!');
  }

  function drawBucket(x, y, tilt, load, type, shake) {
    ctx.save(); ctx.translate(x + (shake ? rand(-2, 2) : 0), y + (shake ? rand(-2, 2) : 0)); ctx.rotate(tilt);
    const body = P2('M-28,-14 L26,-14 L22,8 C16,26 -14,28 -22,12 Z');
    const teeth = P2('M22,-14 L34,-18 L30,-10 L36,-8 L28,-2 Z');
    inkAll([[teeth, '#c8c4d4'], [body, '#ffc42a']], 1.3);
    ctx.fillStyle = '#e8a018'; ctx.fillRect(-24, -8, 44, 4);
    ctx.fillStyle = '#3a3248'; circle(0, -22, 5);
    if (load > 0.02 && type) {
      const [c, d] = MATC[type], h = 4 + load * 14, w = 26 * Math.min(1, 0.6 + load * 0.4);
      ctx.save(); ctx.beginPath(); ctx.rect(-40, -60, 80, 46); ctx.clip();
      ctx.fillStyle = OL; ellipse(-1, -14, w + 2.5, h + 2.5); ctx.fillStyle = c; ellipse(-1, -14, w, h);
      ctx.fillStyle = d; for (let i = 0; i < 5; i++) circle(-16 + i * 8, -14 - (i % 2 ? h * 0.5 : h * 0.2), type === 'rock' ? 4 : 2.2);
      ctx.restore();
    }
    ctx.restore();
  }
  function drawDigger(g) {
    const arm = solveArm(g.bx, g.by - 24), face = g.bx < DG.px ? -1 : 1, t = g.t;
    // tracks
    inkRect(352, GY - 40, 210, 36, '#3a3248', 3, 18);
    for (let i = 0; i < 6; i++) { inkCircle(372 + i * 34, GY - 22, 11, '#8a86a0', 1.2); ctx.fillStyle = '#5a5670'; circle(372 + i * 34, GY - 22, 4); }
    ctx.fillStyle = '#5a5670'; const tp = (g.t * 30) % 18; for (let x = 362 + tp; x < 552; x += 18) ctx.fillRect(x, GY - 41, 8, 4);
    // the body (turns to face the bucket)
    ctx.save(); ctx.translate(457, 0); ctx.scale(face, 1);
    const cab = P2(`M-78,${GY - 44} L80,${GY - 44} L80,${GY - 110} L10,${GY - 110} L-2,${GY - 182} L-74,${GY - 182} L-78,${GY - 110} Z`);
    const weight = P2(`M-96,${GY - 52} L-70,${GY - 52} L-70,${GY - 104} L-96,${GY - 104} C-104,${GY - 90} -104,${GY - 64} -96,${GY - 52} Z`);
    inkAll([[weight, '#e8a018'], [cab, '#ffcc2a']], 1.5);
    ctx.fillStyle = '#3a3248'; ctx.fillRect(-78, GY - 62, 158, 8);
    ctx.fillStyle = '#e8a018'; ctx.fillRect(-74, GY - 106, 150, 6);
    // the window, with Aubrey at the controls
    const win = P2(`M-66,${GY - 118} L-6,${GY - 118} L-14,${GY - 172} L-62,${GY - 172} Z`);
    ink(win, '#bfe6ff', 1.2);
    ctx.save(); ctx.clip(win);
    ctx.scale(face, 1); drawAubrey(-36 * face, GY - 88, 'idle_front', 1, 0, 0.36); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; tri(-60, GY - 168, -46, GY - 168, -62, GY - 140);
    // exhaust pipe with puffs
    inkRect(52, GY - 140, 10, 32, '#5a5670', 2, 3);
    for (let i = 0; i < 3; i++) { const k = ((t * 0.8 + i / 3) % 1); ctx.fillStyle = `rgba(200,200,215,${0.6 * (1 - k)})`; circle(57 + k * 14, GY - 146 - k * 40, 5 + k * 10); }
    // a flashing beacon
    const on = Math.sin(t * 8) > 0;
    if (on) { ctx.fillStyle = 'rgba(255,170,40,.45)'; circle(-40, GY - 192, 16); }
    inkRect(-48, GY - 194, 16, 12, on ? '#ffa22a' : '#c8762a', 2, 5);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#3a3248' : '#ffcc2a'; ctx.fillRect(14 + i * 14, GY - 96, 14, 26); }
    ctx.restore();
    // the arm: boom, piston and stick
    const seg = (x1, y1, x2, y2, w, col) => { ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = w + 6; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
    const mx = lerp(DG.px, arm.ex, 0.55), my = lerp(DG.py, arm.ey, 0.55);
    seg(DG.px + face * 30, DG.py + 40, mx, my, 6, '#c8c4d4');
    seg(DG.px, DG.py, arm.ex, arm.ey, 20, '#ffcc2a');
    seg(arm.ex, arm.ey, arm.x, arm.y, 13, '#ffc42a');
    seg(lerp(arm.ex, arm.x, 0.15), lerp(arm.ey, arm.y, 0.15), lerp(arm.ex, arm.x, 0.75), lerp(arm.ey, arm.y, 0.75), 4, '#c8c4d4');
    for (const [jx, jy] of [[DG.px, DG.py], [arm.ex, arm.ey]]) { inkCircle(jx, jy, 8, '#5a5670', 1.2); ctx.fillStyle = '#c8c4d4'; circle(jx, jy, 3); }
    const tiltDir = g.bx < DG.px ? 1 : -1;
    const tilt = g.dumpT > 0 ? Math.sin(clamp((0.55 - g.dumpT) / 0.25, 0, 1) * Math.PI / 2) * 2.1 * tiltDir * -1 * (g.dumpT < 0.2 ? g.dumpT / 0.2 : 1) : 0;
    drawBucket(g.bx, g.by, tilt, g.load, g.ltype, g.shake > 0);
  }
  function drawTruck(g, truck, ox) {
    ctx.save(); ctx.translate(ox, 0);
    const spin = g.tstate === 'wait' ? 0 : g.t * 8;
    // chassis and bed
    inkRect(600, GY - 50, 296, 18, '#5a5670', 2.5, 4);
    const bed = P2(`M${BED.x0 - 8},${BED.top} L${BED.x1 + 6},${BED.top} L${BED.x1},${GY - 48} L${BED.x0 + 2},${GY - 48} Z`);
    // the load mound peeks over the bed walls
    const k = truck.got / truck.need;
    if (k > 0) {
      const [c, d] = MATC[truck.want], h = 10 + k * 44;
      ctx.fillStyle = OL; ellipse((BED.x0 + BED.x1) / 2, BED.top + 4, 78, h + 3); ctx.fillStyle = c; ellipse((BED.x0 + BED.x1) / 2, BED.top + 4, 75, h);
      ctx.fillStyle = d; for (let i = 0; i < 9; i++) circle(BED.x0 + 26 + i * 15, BED.top + 2 - Math.sin(i / 8 * Math.PI) * h * 0.6, truck.want === 'rock' ? 5 : 2.5);
    }
    ink(bed, '#40a8f0', 1.5);
    ctx.fillStyle = '#2a88d0'; ctx.fillRect(BED.x0 - 4, BED.top + 4, BED.x1 - BED.x0 + 8, 5);
    // scoop dots: how many bucketfuls this truck needs
    const n = truck.need, sp = Math.min(38, (BED.x1 - BED.x0 - 20) / n), x0 = (BED.x0 + BED.x1) / 2 - (n - 1) * sp / 2;
    for (let i = 0; i < n; i++) {
      const f = clamp(truck.got - i, 0, 1);
      inkCircle(x0 + i * sp, BED.top + 34, 13, '#ffffff', 1.2);
      if (f > 0) { ctx.save(); ctx.beginPath(); ctx.rect(x0 + i * sp - 14, BED.top + 47 - 27 * f, 28, 27 * f); ctx.clip(); ctx.fillStyle = MATC[truck.want][0]; circle(x0 + i * sp, BED.top + 34, 12); ctx.restore(); }
      if (f >= 1) star(x0 + i * sp, BED.top + 34, 7, '#ffffff', 5);
    }
    // cab
    const cab = P2(`M786,${GY - 46} L894,${GY - 46} L894,${GY - 96} C894,${GY - 112} 884,${GY - 136} 864,${GY - 140} L800,${GY - 140} C790,${GY - 140} 786,${GY - 132} 786,${GY - 122} Z`);
    ink(cab, '#ff6f5a', 1.5);
    inkRect(842, GY - 132, 40, 34, '#bfe6ff', 2.5, 6);
    emoji('🐹', 860, GY - 112, 26);
    // the sign on the door says what this truck wants
    inkRect(796, GY - 128, 40, 58, '#fff8e8', 2.5, 6);
    const [c] = MATC[truck.want];
    inkCircle(816, GY - 108, 11, c, 1);
    if (truck.want === 'rock') { ctx.fillStyle = '#70708a'; circle(812, GY - 110, 3.5); circle(820, GY - 104, 3); }
    text(MATN[truck.want], 816, GY - 84, truck.want === 'rock' ? 10 : 11, '#5a2a1a', 'center', 800);
    inkRect(890, GY - 70, 10, 16, '#ffe680', 2, 3);
    for (const wx of [650, 740, 852]) {
      inkCircle(wx, GY - 20, 20, '#3a3248', 1.3); inkCircle(wx, GY - 20, 9, '#c8c4d4', 1);
      ctx.strokeStyle = '#8a86a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx + Math.cos(spin) * 7, GY - 20 + Math.sin(spin) * 7); ctx.lineTo(wx - Math.cos(spin) * 7, GY - 20 - Math.sin(spin) * 7); ctx.stroke();
    }
    ctx.restore();
  }
  function drawPile(p, g) {
    const [c, d] = MATC[p.type];
    ctx.beginPath(); ctx.moveTo(p.cx - p.hw - 6, GY);
    for (let x = p.cx - p.hw; x <= p.cx + p.hw; x += 6) ctx.lineTo(x, pileTop(p, x) + Math.sin(x * 0.3) * 1.5);
    ctx.lineTo(p.cx + p.hw + 6, GY); ctx.closePath();
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
    const gr = ctx.createLinearGradient(0, GY - p.h, 0, GY); gr.addColorStop(0, mix(c, '#ffffff', 0.2)); gr.addColorStop(1, mix(c, d, 0.5));
    ctx.fillStyle = gr; ctx.fill();
    ctx.save(); ctx.clip();
    for (let i = 0; i < 30; i++) {
      const x = p.cx - p.hw + ((i * 37) % (p.hw * 2)), y = GY - ((i * 53) % Math.max(10, p.h));
      ctx.fillStyle = i % 3 ? d : mix(c, '#ffffff', 0.4);
      if (p.type === 'rock') { ctx.fillStyle = OL; circle(x, y, 7.5); ctx.fillStyle = i % 2 ? '#c8c8d8' : '#9a9ab0'; circle(x, y, 6); }
      else ellipse(x, y, 3, 2);
    }
    ctx.restore();
    // a wiggly worm pokes out of the dirt now and then
    if (p.type === 'dirt' && Math.sin(g.t * 0.7) > 0.6) {
      const wx = p.cx + 40, wy = pileTop(p, p.cx + 40) + 4, up = (Math.sin(g.t * 0.7) - 0.6) * 40;
      ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + Math.sin(g.t * 6) * 6, wy - up * 0.5, wx + 3, wy - up); ctx.stroke();
      ctx.strokeStyle = '#ff9ab8'; ctx.lineWidth = 6; ctx.stroke();
      ctx.fillStyle = '#1a0a14'; circle(wx + 1, wy - up - 1, 1.3); circle(wx + 5, wy - up - 1, 1.3);
    }
  }
  function drawBird(b, t) {
    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(b.dir, 1); ctx.rotate(b.hit ? Math.sin(t * 20) * 0.4 : 0);
    const flap = Math.sin(t * 16) * 0.8;
    const body = new Path2D(); body.ellipse(0, 0, 18, 14, 0, 0, TAU);
    const wing = P2(`M-4,-2 C-10,${-20 - flap * 10} -26,${-16 - flap * 12} -22,${-4 - flap * 6} Z`);
    const beak = P2('M15,-3 L27,1 L15,5 Z');
    inkAll([[beak, '#ffa22a'], [body, '#6ab0ff'], [wing, '#4a8ae0']], 1.2);
    ctx.fillStyle = '#ffe8f0'; ellipse(4, 6, 10, 6);
    ctx.fillStyle = '#1a0a14'; circle(8, -4, 2.6); ctx.fillStyle = '#fff'; circle(8.8, -4.8, 0.9);
    if (b.hit) text('!', 0, -30, 20, '#ff3a5a', 'center', 800);
    ctx.restore();
  }
  function drawGauge(g) {
    // a slow-and-steady meter: green is safe, red spills
    const x = 457, y = 520, r = 30, v = clamp(g.speed / (DG.spill * 1.6), 0, 1);
    darkPanel(x - 92, y - 40, 184, 54, 16);
    ctx.lineCap = 'butt';
    ctx.strokeStyle = '#5adc7a'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(x, y, r, Math.PI, Math.PI * (1 + 0.625)); ctx.stroke();
    ctx.strokeStyle = '#ff5a5a'; ctx.beginPath(); ctx.arc(x, y, r, Math.PI * (1 + 0.625), TAU); ctx.stroke();
    const a = Math.PI * (1 + v);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4)); ctx.stroke();
    text('slow', x - 62, y - 16, 13, '#a8f0b8', 'center', 700); text('& steady', x - 62, y - 1, 12, '#a8f0b8', 'center', 700);
    text(g.speed > DG.spill ? 'SPILL!' : 'OK', x + 62, y - 16, 15, g.speed > DG.spill ? '#ff9a9a' : '#ffffff', 'center', 800);
    text(`spilled ${Math.round(g.spilled)}`, x + 62, y + 1, 12, g.spilled >= 0.5 ? '#ffc0a0' : '#c8b8d8', 'center', 700);
  }

  MG.digbyscoop = {
    kind: 'action',
    title: () => 'Digger Scoop',
    icon: () => '🚜',
    how: g => `Drive the big digger! Move the bucket with the mouse or the arrow keys. Push it into the ${g.tier === 1 ? 'dirt pile' : 'piles'} to scoop, then tap the truck (or press SPACE) to dump.${g.tier > 1 ? ' Check the truck sign: SAND or ROCKS?' : ''} Slow and steady, or it spills!`,
    init(g) {
      const T = g.tier;
      g.piles = T === 1 ? [{ type: 'dirt', cx: 150, hw: 132, h: 176 }] : [{ type: 'sand', cx: 92, hw: 80, h: 160 }, { type: 'rock', cx: 254, hw: 78, h: 150 }];
      for (const p of g.piles) p.h0 = p.h;
      const n = [2, 3, 3][T - 1], need = [3, 3, 4][T - 1];
      const wants = T === 1 ? ['dirt', 'dirt'] : shuffle(['sand', 'rock', pick(['sand', 'rock'])]);
      g.trucks = wants.map(want => ({ want, need, got: 0 }));
      g.total = n * need; g.delivered = 0; g.spilled = 0;
      g.ti = 0; g.tx = 560; g.tstate = 'arrive';
      g.bx = g.tgx = 460; g.by = g.tgy = 200; g.speed = 0; g.shake = 0;
      g.load = 0; g.ltype = null; g.dumpT = 0; g.clods = []; g.clodAcc = 0;
      g.tipT = 0; g.full = false;
      g.bird = null; g.birdT = [9, 6, 4.5][T - 1];
      g.timeLeft = [80, 95, 105][T - 1];
      g.endT = 0; g.usePointer = false;
      g.progress = `Truck 1 of ${n}`;
    },
    start(g) { say(g, g.tier === 1 ? 'Scoop up the dirt and fill the truck! Slow and steady!' : 'Fill each truck with what its sign says!'); },
    update(g, dt, id) {
      // clods fall with gravity and land in the truck bed or on the ground
      for (const c of g.clods) {
        if (c.rest) { c.life -= dt; continue; }
        c.vy += 900 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
        const floor = c.to === 'bed' ? BED.top + 10 : GY - 2;
        if (c.y > floor) { c.y = floor; c.rest = true; c.life = c.to === 'bed' ? 0.3 : 1.6; }
      }
      g.clods = g.clods.filter(c => c.life > 0);
      g.tipT -= dt; g.dumpT = Math.max(0, g.dumpT - dt); g.shake -= dt;
      // the truck drives in, waits, then drives away full
      if (g.tstate === 'arrive') { g.tx = Math.max(0, g.tx - 360 * dt); if (g.tx === 0) { g.tstate = 'wait'; if (g.tier > 1) say(g, `This truck wants ${MATW[g.trucks[g.ti].want]}!`); } }
      else if (g.tstate === 'leave') {
        g.tx += 420 * dt;
        if (g.tx > 560) {
          if (g.ti + 1 >= g.trucks.length) { g.tstate = 'gone'; dgFinish(g, true); }
          else { g.ti++; g.tx = 560; g.tstate = 'arrive'; }
        }
      }
      g.score = Math.max(0, g.delivered / g.total - Math.min(0.5, g.spilled * 0.07));
      g.progress = `Truck ${Math.min(g.ti + 1, g.trucks.length)} of ${g.trucks.length}`;
      if (g.endT > 0) { g.endT -= dt; if (g.endT <= 0) g.done = true; return; }
      g.timeLeft -= dt;
      if (g.timeLeft <= 0) { g.timeLeft = 0; dgFinish(g, false); return; }

      // steer: arrow keys nudge the target, or the bucket follows the pointer
      const kx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0), ky = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
      if (kx || ky) { g.usePointer = false; g.tgx += kx * 330 * dt; g.tgy += ky * 330 * dt; g.lpx = pointer.x; g.lpy = pointer.y; }
      else if (pointerMoved(g)) { g.tgx = pointer.x; g.tgy = pointer.y; }
      g.tgx = clamp(g.tgx, 20, 940); g.tgy = clamp(g.tgy, 120, GY - 26);
      // keep the target where the arm can reach
      const reach = DG.L1 + DG.L2 - 6, dx = g.tgx - DG.px, dy = g.tgy - 24 - DG.py, dd = Math.hypot(dx, dy);
      let tx = g.tgx, ty = g.tgy;
      if (dd > reach) { tx = DG.px + dx * reach / dd; ty = DG.py + 24 + dy * reach / dd; }
      if (tx > 350 && tx < 565 && ty > GY - 210) ty = GY - 210; // not into the digger itself
      const vx0 = (tx - g.bx) * 9, vy0 = (ty - g.by) * 9, vm = Math.hypot(vx0, vy0), k = vm > DG.maxV ? DG.maxV / vm : 1;
      g.bx += vx0 * k * dt; g.by += vy0 * k * dt; g.speed = vm * k;
      g.by = Math.min(g.by, GY - 26);
      // too fast with a full bucket: it spills!
      if (g.load > 0.02 && g.speed > DG.spill && g.dumpT <= 0) {
        const lost = Math.min(g.load, (g.speed - DG.spill) / 200 * dt);
        g.load -= lost; g.spilled += lost; g.shake = 0.1;
        g.clodAcc += lost * 16;
        while (g.clodAcc > 1) { g.clodAcc--; addClods(g, g.bx, g.by, 1, g.ltype, g.speed * 0.15 * Math.sign(vx0)); }
        if (g.tipT <= 0) { g.tipT = 5; say(g, 'Whoa! Slow and steady, or it spills!'); }
      }
      if (g.load <= 0.02) { g.load = 0; if (g.dumpT <= 0) g.ltype = g.ltype && g.load ? g.ltype : null; }
      // scooping: push the bucket into a pile
      for (const p of g.piles) {
        if (Math.abs(g.bx - p.cx) < p.hw && g.by + 22 > pileTop(p, g.bx) && g.dumpT <= 0) {
          if (g.load > 0.02 && g.ltype !== p.type) { if (g.tipT <= 0) { g.tipT = 4; say(g, `The bucket is full of ${MATW[g.ltype]}. Dump it first!`); } continue; }
          if (g.load < 1) {
            g.load = Math.min(1, g.load + dt / 0.55); g.ltype = p.type; p.h = Math.max(70, p.h - dt * 9);
            if (Math.random() < dt * 12) { noise(0.05, 0.03); addClods(g, g.bx, g.by - 10, 1, p.type, rand(-80, 80)); }
            if (g.load >= 1) { SFX.pop(); floatText(g.bx, g.by - 50, 'Full!', '#fff', false, 22); }
          }
        }
      }
      // dumping: SPACE, or tap the bucket or the truck
      const tapTruck = pointer.clicked && pointer.x > BED.x0 - 20 && pointer.x < 900 && pointer.y > 120 && pointer.y < GY && overBed(g, g.bx, g.by);
      const tapBucket = pointer.clicked && Math.hypot(pointer.x - g.bx, pointer.y - g.by) < 90;
      if (pressed[' '] || pressed.enter || tapTruck || tapBucket) dgDump(g);
      // the bird
      g.birdT -= dt;
      if (!g.bird && g.birdT <= 0) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        g.bird = { x: dir > 0 ? -40 : W + 40, y: rand(160, 300), dir, v: [95, 135, 175][g.tier - 1], hit: false };
        tone(1400, 0.08, 'sine', 0.05); tone(1700, 0.08, 'sine', 0.05, 0.1);
      }
      if (g.bird) {
        const b = g.bird;
        b.x += b.dir * b.v * dt * (b.hit ? 2 : 1); b.y += (b.hit ? -140 : Math.sin(g.t * 3) * 30) * dt;
        if (!b.hit && Math.hypot(b.x - g.bx, b.y - g.by) < 44) {
          b.hit = true; SFX.miss(); tone(1800, 0.12, 'square', 0.04, 0, 900);
          if (g.load > 0.05) { addClods(g, g.bx, g.by, Math.ceil(g.load * 14), g.ltype, b.dir * 120); g.spilled += g.load; g.load = 0; say(g, 'Squawk! The bird bumped the bucket! Wait for it to fly by.'); }
        }
        if (b.x < -60 || b.x > W + 60 || b.y < -40) { g.bird = null; g.birdT = rand(...[[10, 14], [7, 10], [5, 8]][g.tier - 1]); }
      }
    },
    draw(g) {
      // the dig site ground strip
      ctx.fillStyle = '#d8a060'; ctx.fillRect(0, GY - 4, W, H - GY + 4);
      ctx.strokeStyle = 'rgba(91,63,115,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, GY - 4); ctx.lineTo(W, GY - 4); ctx.stroke();
      ctx.fillStyle = 'rgba(120,70,40,.25)'; for (let x = 0; x < W; x += 26) ctx.fillRect(x, GY + 40, 14, 4);
      for (const p of g.piles) {
        drawPile(p, g);
        inkRect(p.cx - 36, GY + 10, 72, 26, '#fff8e8', 2.5, 8);
        text(MATN[p.type], p.cx, GY + 23, 15, '#5a2a1a', 'center', 800);
      }
      if (g.tstate !== 'gone') drawTruck(g, g.trucks[g.ti], g.tx);
      drawDigger(g);
      for (const c of g.clods) {
        const [col, d] = MATC[c.type];
        ctx.globalAlpha = clamp(c.life * 2, 0, 1);
        ctx.fillStyle = OL; circle(c.x, c.y, c.r + 1.5); ctx.fillStyle = c.type === 'rock' ? (c.r > 5 ? '#9a9ab0' : '#c8c8d8') : (c.r > 5 ? d : col); circle(c.x, c.y, c.r);
      }
      ctx.globalAlpha = 1;
      if (g.bird) drawBird(g.bird, g.t);
      // a hint ring where the bucket is heading
      if (g.usePointer && Math.hypot(g.tgx - g.bx, g.tgy - g.by) > 30) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(g.tgx, g.tgy, 22, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
      // helpful arrows: where to go next
      if (g.endT <= 0 && g.dumpT <= 0) {
        const bob = Math.sin(g.t * 5) * 6;
        if (g.load >= 0.95 && g.tstate === 'wait') {
          const tr = g.trucks[g.ti];
          if (!overBed(g, g.bx, g.by)) { if (tr.want === g.ltype) { emoji('⬇️', (BED.x0 + BED.x1) / 2, BED.top - 60 + bob, 34); } }
          else bubble(g.bx, g.by - 74, g.usePointer ? 'Tap to dump!' : 'SPACE to dump!');
        } else if (g.load < 0.05 && g.t < 12) {
          const p = g.tier === 1 ? g.piles[0] : (g.piles.find(p => p.type === g.trucks[g.ti].want) || g.piles[0]);
          emoji('⬇️', p.cx, GY - p.h - 40 + bob, 34);
        }
      }
      drawGauge(g);
    },
  };

  // =============================================================================================
  // GAME 2 (learn): BRICK ORDER (tens and ones)
  // =============================================================================================
  const BO = { bw: 20, bh: 11, tensX: 346, tensStep: 25, onesX: 572, bedTop: 372, truckX: 330 };
  const BIN_T = { x: 22, y: 236, w: 176, h: 234 }, BIN_O = { x: 206, y: 330, w: 112, h: 140 };
  const BED_R = { x: 320, y: 200, w: 400, h: 250 };
  const BRICK_COLS = ['#e8603a', '#e05a3a', '#ec7048'];
  const FLOOR_COLS = ['#ffb0c8', '#ffd890', '#a8e0ff', '#b8f0b0', '#d8c0ff', '#ffc8a0'];
  const tenX = i => BO.tensX + i * BO.tensStep, oneXY = i => [BO.onesX + (i % 2) * 23, BO.bedTop - 13 - Math.floor(i / 2) * 13];
  function drawTenStack(x, gy, glow = false, ghost = false) {
    // ten bricks stacked up with a strap round them and a "10" tag
    if (ghost) {
      ctx.save(); ctx.globalAlpha = 0.45; ctx.setLineDash([4, 4]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
      ctx.strokeRect(x - 1, gy - 10 * 12 - 1, BO.bw + 2, 10 * 12 + 2); ctx.setLineDash([]); ctx.restore(); return;
    }
    if (glow) { ctx.fillStyle = 'rgba(255,255,160,.55)'; ctx.beginPath(); ctx.roundRect(x - 6, gy - 128, BO.bw + 12, 132, 8); ctx.fill(); }
    for (let i = 0; i < 10; i++) drawBrick(x, gy - (i + 1) * 12, BO.bw, BO.bh, BRICK_COLS[i % 3]);
    ctx.fillStyle = '#4a7ae0'; ctx.fillRect(x - 2, gy - 84, BO.bw + 4, 4); ctx.fillRect(x - 2, gy - 40, BO.bw + 4, 4);
  }
  function drawOne(x, y, ghost = false) {
    if (ghost) { ctx.save(); ctx.globalAlpha = 0.45; ctx.setLineDash([3, 3]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x, y, BO.bw, BO.bh); ctx.setLineDash([]); ctx.restore(); return; }
    drawBrick(x, y, BO.bw, BO.bh, '#ff8a4a');
  }
  function boCount(g) { return g.tens * 10 + g.ones; }
  function boNewRound(g) {
    const r = g.rounds[g.ri];
    g.tens = 0; g.ones = 0; g.tries = 0; g.hint = false; g.choices = null; g.msg = null; g.locked = false;
    g.truckIn = 1;
    if (r.read) {
      g.tens = Math.floor(r.n / 10); g.ones = r.n % 10;
      const opts = new Set([r.n]);
      if (r.n % 10 && r.n % 10 !== Math.floor(r.n / 10)) opts.add((r.n % 10) * 10 + Math.floor(r.n / 10));
      opts.add(g.tens + g.ones);
      while (opts.size < 3) opts.add(clamp(r.n + pick([-10, 10, -1, 1, 2]), 1, 99));
      g.choices = shuffle([...opts].slice(0, 3));
      say(g, 'How many bricks are on the truck? Count the tens, then the ones!');
    } else say(g, r.word ? `Digby needs ${numWord(r.n)} bricks!` : `Digby needs ${numWord(r.n)} bricks! That's ${plural(Math.floor(r.n / 10), 'ten')} and ${plural(r.n % 10, 'one')}.`);
  }
  function boAdd(g, kind) {
    if (g.locked || g.choices) return;
    if (kind === 'ten') {
      if (g.tens >= 9) { say(g, 'The truck is full of tens!'); return; }
      g.tens++; tone(523, 0.1, 'triangle', 0.08); g.pops.push({ kind: 'ten', i: g.tens - 1, t: 0 });
    } else {
      if (g.ones >= 9) {
        if (g.tens >= 9) { say(g, 'The truck is full!'); return; }
        // the tenth one: ten ones snap together into a ten!
        g.ones = 0; g.tens++; g.snap = 1; SFX.sparkle();
        g.pops.push({ kind: 'ten', i: g.tens - 1, t: 0 });
        say(g, `Ten ones make one ten! ${numWord(boCount(g))}.`);
        return;
      }
      g.ones++; tone(784, 0.07, 'triangle', 0.07); g.pops.push({ kind: 'one', i: g.ones - 1, t: 0 });
    }
    speak(numWord(boCount(g)));
  }
  function boRemove(g, kind) {
    if (g.locked || g.choices) return;
    if (kind === 'ten' && g.tens > 0) g.tens--;
    else if (kind === 'one' && g.ones > 0) g.ones--;
    else return;
    tone(330, 0.08, 'triangle', 0.06);
  }
  function boCredit(g, c) {
    g.credit += c; g.locked = true; g.flyT = 0; g.msg = null;
    SFX.hit(); setTimeout(() => SFX.sparkle(), 120);
    const n = g.rounds[g.ri].n;
    say(g, pick(['Perfect!', 'Brick-tastic!', 'Just right!', 'You did it!']) + ` ${numWord(n)} is ${plural(Math.floor(n / 10), 'ten')} and ${plural(n % 10, 'one')}.`);
  }
  function boCheck(g) {
    if (g.locked) return;
    const r = g.rounds[g.ri], have = boCount(g), want = r.n;
    if (have === 0) { say(g, 'The truck is empty! Load some bricks first.'); return; }
    if (have === want) { boCredit(g, [1, 0.6, 0.3][Math.min(g.tries, 2)]); return; }
    g.tries++; SFX.miss();
    const wt = Math.floor(want / 10), wo = want % 10;
    if (g.tries >= 3) {
      g.tens = wt; g.ones = wo; g.credit += 0; g.locked = true; g.flyT = -1.4;
      g.msg = `${want} is ${wt} tens and ${wo} ones.`;
      say(g, `Let's do it together. ${numWord(want)} is ${plural(wt, 'ten')} and ${plural(wo, 'one')}.`);
      return;
    }
    if (g.tries >= 2) g.hint = true;
    if (g.tens === wo && g.ones === wt) g.msg = 'The tens and ones swapped places!';
    else if (have > want) g.msg = `That's ${have}. Too many!`;
    else g.msg = `That's ${have}. Not enough!`;
    say(g, `${g.msg} We need ${numWord(want)}: ${plural(wt, 'ten')} and ${plural(wo, 'one')}.`);
  }
  function boPick(g, i) {
    if (g.locked || !g.choices) return;
    const n = g.rounds[g.ri].n, c = g.choices[i];
    if (c === n) { g.choices = null; boCredit(g, [1, 0.5, 0.2][Math.min(g.tries, 2)]); return; }
    g.tries++; SFX.miss(); g.wrongPick = i; g.wrongT = 0.6;
    const wt = Math.floor(n / 10);
    g.msg = g.tries >= 2 ? `Count the tens: ${wt}. Ten, twenty...` : `Not ${c}. Count the tens first!`;
    say(g, g.tries >= 2 ? `Count the tens: ${TENS_W.slice(1, wt + 1).join(', ')}. Then the ones!` : `Not ${numWord(c)}. Count the tens first, then the ones!`);
    if (g.tries >= 3) { g.choices = null; g.locked = true; g.flyT = -1.4; g.msg = `It's ${n}!`; say(g, `It's ${numWord(n)}!`); }
  }
  function drawFlatbed(g, ox) {
    ctx.save(); ctx.translate(ox, 0);
    inkRect(322, BO.bedTop, 300, 16, '#40a8f0', 2.5, 3);
    ctx.fillStyle = '#2a88d0'; ctx.fillRect(324, BO.bedTop + 10, 296, 4);
    inkRect(330, BO.bedTop + 16, 300, 24, '#5a5670', 2.5, 4);
    // a divider between the tens side and the ones side
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(564, BO.bedTop); ctx.lineTo(564, BO.bedTop - 30); ctx.stroke();
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.stroke();
    text('TENS', 452, BO.bedTop + 8, 11, '#ffffff', 'center', 800);
    text('ONES', 594, BO.bedTop + 8, 11, '#ffffff', 'center', 800);
    const cab = P2(`M626,${BO.bedTop + 40} L716,${BO.bedTop + 40} L716,${BO.bedTop - 18} C716,${BO.bedTop - 34} 704,${BO.bedTop - 58} 684,${BO.bedTop - 62} L636,${BO.bedTop - 62} C630,${BO.bedTop - 62} 626,${BO.bedTop - 56} 626,${BO.bedTop - 48} Z`);
    ink(cab, '#ff6f5a', 1.5);
    inkRect(664, BO.bedTop - 54, 42, 34, '#bfe6ff', 2.5, 6);
    emoji('🐹', 684, BO.bedTop - 36, 26);
    inkRect(712, BO.bedTop + 12, 9, 14, '#ffe680', 2, 3);
    const spin = g.t * 6 * (g.truckIn < 1 ? 1 : 0);
    for (const wx of [372, 470, 676]) {
      inkCircle(wx, GY - 18, 19, '#3a3248', 1.3); inkCircle(wx, GY - 18, 8, '#c8c4d4', 1);
      ctx.strokeStyle = '#8a86a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx + Math.cos(spin) * 7, GY - 18 + Math.sin(spin) * 7); ctx.lineTo(wx - Math.cos(spin) * 7, GY - 18 - Math.sin(spin) * 7); ctx.stroke();
    }
    ctx.restore();
  }
  function drawClubhouseBuild(g) {
    const x0 = 742, x1 = 906, fh = 44, n = g.floors;
    // scaffolding poles and a crane hook bringing bricks
    for (const px of [x0 - 10, x1 + 10]) { ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(px, GY); ctx.lineTo(px, GY - 5 * fh - 30); ctx.stroke(); ctx.strokeStyle = '#a8b4c8'; ctx.lineWidth = 3; ctx.stroke(); }
    // dashed outlines of the floors still to build
    ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.5;
    for (let f = n; f < 5; f++) ctx.strokeRect(x0, GY - (f + 1) * fh, x1 - x0, fh);
    ctx.restore();
    for (let f = 0; f < n; f++) {
      const y = GY - (f + 1) * fh, pop = g.floorPop > 0 && f === n - 1 ? 1 + g.floorPop * 0.12 : 1;
      ctx.save(); ctx.translate((x0 + x1) / 2, y + fh); ctx.scale(pop, pop); ctx.translate(-(x0 + x1) / 2, -(y + fh));
      inkRect(x0, y, x1 - x0, fh, FLOOR_COLS[f % FLOOR_COLS.length], 2.5, 2);
      ctx.fillStyle = 'rgba(160,60,40,.2)';
      for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) ctx.fillRect(x0 + 4 + c * 23 + (r % 2 ? 11 : 0), y + 6 + r * 13, 18, 2);
      if (f === 0) { inkRect(x0 + 64, y + 8, 34, fh - 8, '#8a5a3a', 2.5, 4); ctx.fillStyle = '#ffd84a'; circle(x0 + 91, y + 26, 3); }
      for (const wx of f === 0 ? [x0 + 14, x1 - 46] : [x0 + 14, x0 + 66, x1 - 46]) { inkRect(wx, y + 9, 32, 24, '#bfe6ff', 2, 4); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(wx + 5, y + 12, 4, 17); }
      ctx.restore();
    }
    if (n >= 5) {
      const ry = GY - 5 * fh;
      ink(P2(`M${x0 - 14},${ry} L${(x0 + x1) / 2},${ry - 56} L${x1 + 14},${ry} Z`), '#ff5f7e', 1.5);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo((x0 + x1) / 2, ry - 56); ctx.lineTo((x0 + x1) / 2, ry - 92); ctx.stroke();
      ink(P2(`M${(x0 + x1) / 2},${ry - 92} L${(x0 + x1) / 2 + 30},${ry - 84 + Math.sin(g.t * 5) * 3} L${(x0 + x1) / 2},${ry - 74} Z`), '#5adc7a', 1);
      text('CLUB', (x0 + x1) / 2, ry - 20, 15, '#ffffff', 'center', 800);
    }
  }
  function drawCounter(g) {
    // "2 tens + 3 ones = 23", with tens in blue and ones in orange
    darkPanel(330, 482, 392, 50, 18);
    const tc = '#8ac8ff', oc = '#ffb46a';
    ctx.font = `800 21px ${FONT}`;
    const hide = !!g.choices, parts = [[hide ? '? tens' : `${g.tens} ${g.tens === 1 ? 'ten' : 'tens'}`, tc], [' + ', '#ffffff'], [hide ? '? ones' : `${g.ones} ${g.ones === 1 ? 'one' : 'ones'}`, oc], [' = ', '#ffffff']];
    const widths = parts.map(([s]) => ctx.measureText(s).width), numW = 54, total = widths.reduce((a, b) => a + b, 0) + numW;
    let x = 526 - total / 2;
    parts.forEach(([s, c], i) => { text(s, x, 507, 21, c, 'left', 800); x += widths[i]; });
    if (g.choices) text('?', x + 4, 507, 26, '#ffffff', 'left', 800);
    else { text(String(g.tens || ''), x, 507, 26, tc, 'left', 800); ctx.font = `800 26px ${FONT}`; text(String(g.ones), x + (g.tens ? ctx.measureText(String(g.tens)).width : 0), 507, 26, oc, 'left', 800); }
  }
  function drawOrderBoard(g) {
    const r = g.rounds[Math.min(g.ri, g.rounds.length - 1)];
    const x = 330, y = 66, w = 392, h = 104;
    panel(x, y, w, h, 18);
    if (r.read) {
      text('How many bricks?', x + w / 2, y + 22, 19, '#5a2a6e', 'center', 700);
      return; // the answer buttons sit inside the board
    }
    text('Digby needs', x + 76, y + 26, 18, '#9a6aaa', 'center', 700);
    if (r.word) {
      outlined(numWord(r.n), x + w / 2 + 36, y + 58, 34, '#ff8a2a', 'center', '#fff');
    } else {
      const ts = String(Math.floor(r.n / 10)), os = String(r.n % 10);
      ctx.font = `700 60px ${FONT}`; const tw = ctx.measureText(ts).width, ow = ctx.measureText(os).width, cx = x + w / 2 + 30;
      outlined(ts, cx - (tw + ow) / 2 + tw / 2, y + 58, 60, '#3a8ae0', 'center', '#fff');
      outlined(os, cx + (tw + ow) / 2 - ow / 2, y + 58, 60, '#ff8a2a', 'center', '#fff');
      text('bricks', cx + (tw + ow) / 2 + 40, y + 70, 18, '#9a6aaa', 'center', 700);
      text('tens', cx - (tw + ow) / 2 + tw / 2, y + 96, 12, '#3a8ae0', 'center', 800);
      text('ones', cx + (tw + ow) / 2 - ow / 2, y + 96, 12, '#ff8a2a', 'center', 800);
    }
    for (let i = 0; i < 3; i++) emoji('🧱', x + 34 + i * 22, y + 66 - (i === 1 ? 10 : 0), 22);
  }

  MG.digbybricks = {
    kind: 'learn',
    title: () => 'Brick Order',
    icon: () => '🧱',
    how: () => 'Digby needs bricks for the clubhouse! Bricks come in stacks of TEN, and single ONES. Drag or tap them onto the truck to make the number, then press SEND. Tap a brick on the truck to take it off.',
    init(g) {
      const T = g.tier;
      const lo = [11, 21, 31][T - 1], hi = [20, 59, 99][T - 1];
      const nums = [];
      while (nums.length < 5) { const n = randInt(lo, hi); if (!nums.includes(n) && (T > 1 || n % 10 || nums.every(m => m % 10)) && (n % 10 !== Math.floor(n / 10) || T === 1)) nums.push(n); }
      g.rounds = nums.map((n, i) => ({ n, read: i === 2 || (T === 3 && i === 4), word: T === 3 && (i === 1 || i === 3) }));
      // reading rounds need a number whose digits can be swapped into a trap
      for (const r of g.rounds) if (r.read && r.n % 10 === 0) r.n -= randInt(1, 9);
      g.ri = 0; g.credit = 0; g.floors = 0; g.floorPop = 0;
      g.tens = 0; g.ones = 0; g.pops = []; g.snap = 0; g.drag = null; g.flyT = 0; g.endT = 0;
      g.truckIn = 1; g.wrongT = 0;
      g.progress = 'Order 1 of 5';
    },
    start(g) { g.truckIn = 0; boNewRound(g); },
    update(g, dt, id) {
      g.pops.forEach(p => (p.t += dt)); g.pops = g.pops.filter(p => p.t < 0.35);
      g.snap = Math.max(0, g.snap - dt * 1.5); g.floorPop = Math.max(0, g.floorPop - dt * 2); g.wrongT -= dt;
      g.truckIn = Math.min(1, g.truckIn + dt * 1.6);
      g.score = g.credit / g.rounds.length;
      g.progress = `Order ${Math.min(g.ri + 1, 5)} of 5`;
      if (g.endT > 0) { g.endT -= dt; if (g.endT <= 0) g.done = true; return; }
      if (g.locked) {
        // the bricks fly up to the clubhouse and a new floor appears
        g.flyT += dt;
        if (g.flyT >= 0.9 && !g.flown) { g.flown = true; g.floors++; g.floorPop = 1; tone(660, 0.15, 'triangle', 0.08); burst(824, GY - g.floors * 44 + 20, 16); }
        if (g.flyT >= 1.8) {
          g.flown = false;
          g.ri++;
          if (g.ri >= g.rounds.length) { g.endT = 2; g.locked = true; SFX.fanfare(); say(g, 'Hooray! The clubhouse is finished!'); burst(824, 200, 40); return; }
          g.truckIn = 0; g.tens = 0; g.ones = 0;
          boNewRound(g);
        }
        return;
      }
      if (g.truckIn < 1) return;
      // answer buttons for the reading rounds
      if (g.choices) {
        if (id && id.startsWith('bo_pick')) boPick(g, +id.slice(7));
        return;
      }
      if (id === 'bo_send') { boCheck(g); return; }
      if (id === 'bo_clear') { g.tens = 0; g.ones = 0; tone(300, 0.1, 'triangle', 0.06); return; }
      if (pressed.arrowup || pressed.t) boAdd(g, 'ten');
      if (pressed.arrowright || pressed.o) boAdd(g, 'one');
      if (pressed.arrowdown) boRemove(g, 'ten');
      if (pressed.arrowleft || pressed.backspace) boRemove(g, 'one');
      // pointer: grab from a bin, drop on the truck (a plain tap works too); tap a loaded brick to take it off
      if (pointer.clicked && !id) {
        if (inRect(BIN_T)) g.drag = { kind: 'ten', x0: pointer.x, y0: pointer.y, moved: false };
        else if (inRect(BIN_O)) g.drag = { kind: 'one', x0: pointer.x, y0: pointer.y, moved: false };
        else {
          for (let i = g.tens - 1; i >= 0; i--) if (pointer.x > tenX(i) - 2 && pointer.x < tenX(i) + BO.bw + 2 && pointer.y > BO.bedTop - 124 && pointer.y < BO.bedTop) { boRemove(g, 'ten'); return; }
          for (let i = g.ones - 1; i >= 0; i--) { const [ox, oy] = oneXY(i); if (pointer.x > ox - 2 && pointer.x < ox + BO.bw + 2 && pointer.y > oy - 2 && pointer.y < oy + BO.bh + 2) { boRemove(g, 'one'); return; } }
        }
      }
      if (g.drag) {
        if (Math.hypot(pointer.x - g.drag.x0, pointer.y - g.drag.y0) > 12) g.drag.moved = true;
        if (!pointer.down) {
          if (!g.drag.moved || inRect(BED_R)) boAdd(g, g.drag.kind);
          g.drag = null;
        }
      }
    },
    draw(g) {
      ctx.fillStyle = 'rgba(240,250,255,.5)'; ctx.fillRect(0, 0, W, GY);
      ctx.fillStyle = '#d8a060'; ctx.fillRect(0, GY - 4, W, H - GY + 4);
      ctx.strokeStyle = 'rgba(91,63,115,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, GY - 4); ctx.lineTo(W, GY - 4); ctx.stroke();
      const r = g.rounds[Math.min(g.ri, g.rounds.length - 1)];
      const active = !g.locked && !g.choices && g.truckIn >= 1;
      // the brick yard: a pallet of ten-stacks and a crate of single bricks
      panel(BIN_T.x - 6, BIN_T.y - 40, BIN_T.w + 12, 36, 14);
      text('TENS  (10)', BIN_T.x + BIN_T.w / 2, BIN_T.y - 22, 17, '#3a8ae0', 'center', 800);
      inkRect(BIN_T.x, GY - 16, BIN_T.w, 14, '#c8864a', 2.5, 2);
      ctx.fillStyle = '#a86a3a'; for (let x = BIN_T.x + 10; x < BIN_T.x + BIN_T.w; x += 30) ctx.fillRect(x, GY - 6, 14, 6);
      const hov = active && inRect(BIN_T);
      for (let i = 0; i < 6; i++) drawTenStack(BIN_T.x + 10 + i * 27, GY - 16, hov && i === 5);
      panel(BIN_O.x - 6, BIN_O.y - 40, BIN_O.w + 12, 36, 14);
      text('ONES  (1)', BIN_O.x + BIN_O.w / 2, BIN_O.y - 22, 17, '#e0702a', 'center', 800);
      const crate = P2(`M${BIN_O.x},${GY - 60} L${BIN_O.x + BIN_O.w},${GY - 60} L${BIN_O.x + BIN_O.w - 8},${GY - 2} L${BIN_O.x + 8},${GY - 2} Z`);
      if (active && inRect(BIN_O)) { ctx.fillStyle = 'rgba(255,255,160,.55)'; ctx.beginPath(); ctx.roundRect(BIN_O.x - 8, GY - 120, BIN_O.w + 16, 122, 10); ctx.fill(); }
      for (let i = 0; i < 12; i++) drawOne(BIN_O.x + 10 + (i % 4) * 23 + (Math.floor(i / 4) % 2) * 8, GY - 72 - Math.floor(i / 4) * 12 + (i % 2) * 2);
      ink(crate, '#c8864a', 1.4);
      ctx.fillStyle = '#a86a3a'; ctx.fillRect(BIN_O.x + 6, GY - 40, BIN_O.w - 12, 4); ctx.fillRect(BIN_O.x + 8, GY - 22, BIN_O.w - 16, 4);
      if (active) {
        text('⬆ key', BIN_T.x + BIN_T.w / 2, GY + 18, 13, '#5a2a1a', 'center', 700);
        text('➡ key', BIN_O.x + BIN_O.w / 2, GY + 18, 13, '#5a2a1a', 'center', 700);
      }
      // the clubhouse going up, floor by floor
      drawClubhouseBuild(g);
      // the truck
      const ox = (1 - easeOut(g.truckIn)) * -460;
      drawFlatbed(g, ox);
      ctx.save(); ctx.translate(ox, 0);
      const fly = g.locked && g.flyT > 0 ? clamp(g.flyT / 0.9, 0, 1) : 0;
      const flyTo = (x, y) => [lerp(x, 824, fly), lerp(y, GY - (g.floors + (g.flown ? 0 : 1)) * 44 + 20, fly) - Math.sin(fly * Math.PI) * 120];
      if (!(g.locked && g.flown)) {
        for (let i = 0; i < g.tens; i++) {
          const pop = g.pops.find(p => p.kind === 'ten' && p.i === i), dy = pop ? -Math.sin(pop.t / 0.35 * Math.PI) * 14 : 0;
          if (fly > 0) { const [fx, fy] = flyTo(tenX(i), BO.bedTop); ctx.save(); ctx.translate(fx, fy); ctx.scale(1 - fly * 0.6, 1 - fly * 0.6); drawTenStack(0, 0); ctx.restore(); }
          else drawTenStack(tenX(i), BO.bedTop + dy);
        }
        for (let i = 0; i < g.ones; i++) {
          const [x, y] = oneXY(i), pop = g.pops.find(p => p.kind === 'one' && p.i === i), dy = pop ? -Math.sin(pop.t / 0.35 * Math.PI) * 10 : 0;
          if (fly > 0) { const [fx, fy] = flyTo(x, y); drawOne(fx, fy); } else drawOne(x, y + dy);
        }
      }
      // hint: dashed outlines of the right answer
      if (g.hint && !g.locked) {
        for (let i = g.tens; i < Math.floor(r.n / 10); i++) drawTenStack(tenX(i), BO.bedTop, false, true);
        for (let i = g.ones; i < r.n % 10; i++) { const [x, y] = oneXY(i); drawOne(x, y, true); }
      }
      if (g.snap > 0) { ctx.globalAlpha = g.snap; outlined('10 ones = 1 ten!', 470, BO.bedTop - 150, 26, '#ffd23a', 'center'); ctx.globalAlpha = 1; }
      ctx.restore();
      drawOrderBoard(g);
      drawCounter(g);
      // reading round answers
      if (g.choices) g.choices.forEach((c, i) => {
        const shake = g.wrongPick === i && g.wrongT > 0 ? Math.sin(g.wrongT * 40) * 5 : 0;
        button('bo_pick' + i, 350 + i * 124 + shake, 104, 108, 56, String(c), { color: ['#3a8ae0', '#9a6ae0', '#ff8a2a'][i], size: 30, key: String(i + 1) });
      });
      else if (active) {
        button('bo_send', 736, 482, 206, 50, 'Send!', { icon: '🚚', color: '#5fb87a', size: 22, key: 'Enter' });
        button('bo_clear', 518, 436, 100, 30, 'Empty', { color: '#b07ad0', size: 14 });
      }
      // Digby and what he says
      drawCritter(FRIEND, 928, GY + 2, 0.5, -1);
      if (g.msg) bubble(470, 200, g.msg);
      // the dragged brick follows the pointer
      if (g.drag && g.drag.moved) {
        if (g.drag.kind === 'ten') drawTenStack(pointer.x - BO.bw / 2, pointer.y + 60);
        else drawOne(pointer.x - BO.bw / 2, pointer.y - BO.bh / 2);
        if (inRect(BED_R)) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.strokeRect(340, BO.bedTop - 134, 270, 134); ctx.setLineDash([]); }
      }
    },
  };
  const easeOut = k => 1 - Math.pow(1 - k, 3);

  restage('berrypatch', {
    name: "Digby's Building Site", icon: '🏗️', bg: 'buildsite_bb2',
    npc: { name: FRIEND, icon: '👷' },
    games: [['digbyscoop', 'berry', {}], ['digbybricks', 'berry', {}]],
    intro: [
      '*:Beep, beep, beep! A big yellow digger is backing up, and a little mole in a hard hat pops out of the ground.',
      "N:Hello! I'm Digby the Mole, the boss of this building site. We're building a brand-new clubhouse for everyone in town!",
      'N:First we need to move the dirt. Hop in my digger, scoop up the dirt and fill the trucks. Slow and steady, so nothing spills!',
      'A:excited:I get to drive a REAL digger? Yes, yes, YES!',
    ],
    mid: [
      'N:Great digging! Now we need bricks to build the walls. Bricks come in stacks of TEN, and single ONES.',
      'N:Load the truck with just the right number. Twenty-three is two tens and three ones!',
      'A:thinking:Tens first, then the ones. I can do that!',
    ],
    outro: [
      "N:Look at our clubhouse! It's the tallest, brick-iest clubhouse in the whole town!",
      'N:I found these berries while I was digging my tunnels. Take them for your journey!',
      'A:laughing:Thanks, Digby! Best. Building site. EVER!',
    ],
  });
}
