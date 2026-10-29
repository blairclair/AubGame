'use strict';
// Inside the shed: the nightly Workshop (crafting & dressing up) and Mom's surprise visits.

const HUB_UNI = { x: 400, y: 494, s: 1.12 };

// the inside of the shed, painted once and cached (see scenery.js sprite())
function paintShedInterior() {
  const R = rng(4242);
  // honey-wood plank walls with grain and knots
  for (let x = 0; x < W; x += 44) {
    ctx.fillStyle = vgrad(0, 340, mix('#d8a066', '#c88e56', R()), '#b87a48'); ctx.fillRect(x, 0, 44, 340);
    ctx.strokeStyle = 'rgba(110,60,25,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 340); ctx.stroke();
    ctx.strokeStyle = 'rgba(140,80,35,.3)'; ctx.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) { const gx = x + 6 + R() * 30; ctx.beginPath(); ctx.moveTo(gx, 0); ctx.bezierCurveTo(gx + 6, 100, gx - 6, 220, gx + 3, 340); ctx.stroke(); }
    if (R() < 0.5) { const ky = 60 + R() * 240; ctx.fillStyle = 'rgba(110,60,25,.5)'; ellipse(x + 22, ky, 4, 6); ctx.strokeStyle = 'rgba(110,60,25,.3)'; ctx.beginPath(); ctx.ellipse(x + 22, ky, 7, 10, 0, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#6a4a3a'; circle(x + 6, 20, 1.6); circle(x + 38, 20, 1.6); circle(x + 6, 320, 1.6); circle(x + 38, 320, 1.6);
  }
  // rafters
  box(-10, -6, W + 20, 26, 0, vgrad(-6, 20, '#8a5a34', '#6a4226'), '#4a2a18', 2.5);
  for (const x of [120, 480, 840]) { ctx.save(); ctx.translate(x, 20); ctx.rotate(0.5); box(-8, -10, 16, 90, 2, '#7a4e2e', '#4a2a18', 2); ctx.restore(); }
  // mint wainscoting
  for (let x = 0; x < W; x += 30) { ctx.fillStyle = vgrad(330, 470, x % 60 ? '#7fe0c8' : '#74d6be', '#52b8a0'); ctx.fillRect(x, 330, 30, 140); ctx.strokeStyle = 'rgba(20,90,80,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, 330); ctx.lineTo(x, 470); ctx.stroke(); }
  box(-4, 322, W + 8, 14, 2, '#ffffff', '#9ab8b0', 2);
  // floorboards
  ctx.fillStyle = vgrad(468, H, '#c08a58', '#9a6a40'); ctx.fillRect(0, 468, W, H - 468);
  ctx.strokeStyle = 'rgba(90,50,25,.45)'; ctx.lineWidth = 1.5;
  for (let y = 482; y < H; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let y = 468, row = 0; y < H; y += 16, row++) for (let x = (row % 2) * 90; x < W; x += 180) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke(); }
  ctx.fillStyle = 'rgba(60,30,15,.3)'; ctx.fillRect(0, 466, W, 5);
  // window with gingham curtains and a flower box
  box(70, 58, 176, 140, 8, '#ffffff', '#9a8aa0', 3);
  ctx.fillStyle = vgrad(68, 190, '#24226a', '#5a4a9a'); ctx.fillRect(82, 70, 152, 116);
  ctx.fillStyle = '#fff8d8'; circle(200, 100, 15); ctx.fillStyle = '#3a3488'; circle(193, 96, 13);
  for (let i = 0; i < 9; i++) star(92 + (i * 37) % 130, 80 + (i * 29) % 90, 1.6 + (i % 2), '#ffffff');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(155, 70, 6, 116); ctx.fillRect(82, 125, 152, 6);
  for (const side of [-1, 1]) {
    const cx = side < 0 ? 64 : 252;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx, 50); ctx.lineTo(cx - side * 46, 50); ctx.quadraticCurveTo(cx - side * 16, 130, cx - side * 30, 206); ctx.lineTo(cx, 206); ctx.closePath();
    ctx.fillStyle = '#ffd6e6'; ctx.fill(); ctx.clip();
    ctx.fillStyle = 'rgba(255,100,160,.35)';
    for (let gx = cx - 60; gx < cx + 60; gx += 12) ctx.fillRect(gx, 40, 6, 180);
    for (let gy = 46; gy < 210; gy += 12) ctx.fillRect(cx - 60, gy, 120, 6);
    ctx.restore();
    ctx.strokeStyle = '#e0709a'; ctx.lineWidth = 2; ctx.stroke();
  }
  box(56, 46, 204, 10, 4, '#a07850', '#6a4a30', 2);
  box(66, 198, 184, 18, 4, '#b5713f', '#6a4228', 2);
  for (let i = 0; i < 9; i++) { ctx.fillStyle = '#4fae4a'; ellipse(76 + i * 21, 196, 7, 4, i); tinyFlower(76 + i * 21, 190, 6, ['#ff5fa2', '#ffe24a', '#ffffff', '#c6a2ff'][i % 4]); }
  // Aubrey's crayon drawings pinned to the wall
  [[280, 76, -0.08, '#fff8f0'], [292, 196, 0.06, '#f0f8ff']].forEach(([x, y, rot, paper], i) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    box(0, 0, 70, 84, 2, paper, '#c8b8c8', 1.5);
    ctx.lineWidth = 2.5;
    if (i === 0) {
      ctx.strokeStyle = '#c86ae8'; ctx.beginPath(); ctx.ellipse(34, 54, 18, 10, 0, 0, TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(48, 48); ctx.lineTo(56, 30); ctx.stroke(); ctx.beginPath(); ctx.arc(58, 28, 7, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ffb81a'; ctx.beginPath(); ctx.moveTo(60, 21); ctx.lineTo(64, 10); ctx.stroke();
      ctx.strokeStyle = '#ff5fa2'; for (const lx of [22, 30, 40, 46]) { ctx.beginPath(); ctx.moveTo(lx, 62); ctx.lineTo(lx, 74); ctx.stroke(); }
      ctx.strokeStyle = '#40b0ff'; ctx.beginPath(); ctx.moveTo(52, 30); ctx.quadraticCurveTo(42, 34, 44, 46); ctx.stroke();
    } else {
      ctx.strokeStyle = '#ff5fa2'; heart(35, 26, 40, '#ffb0d0');
      ctx.fillStyle = '#c86ae8'; ctx.font = `700 13px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('MY BFF', 35, 72);
    }
    ctx.fillStyle = '#ff4a4a'; circle(35, 4, 4);
    ctx.restore();
  });
  // shelf of glass jars
  box(596, 178, 308, 14, 3, '#9a6a40', '#5a3a20', 2.5);
  for (const bx of [610, 880]) { ctx.beginPath(); ctx.moveTo(bx, 192); ctx.lineTo(bx + 6, 210); ctx.lineTo(bx + 12, 192); ctx.closePath(); fillLine('#7a5030', '#5a3a20', 1.5); }
  [['#ffb3d6', '🌸'], ['#b8e6ff', '🐚'], ['#fff1a8', '⭐'], ['#d6c2ff', '💎'], ['#c8f0c0', '🧶']].forEach(([c, e], i) => {
    const jx = 612 + i * 58;
    box(jx, 126, 44, 52, 12, mix(c, '#ffffff', 0.35), mix(c, '#5a3a60', 0.4), 2);
    ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(jx + 4, 146, 36, 28, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(jx + 7, 132, 5, 36);
    box(jx + 4, 118, 36, 12, 4, '#c8a070', '#7a5030', 1.5);
    emoji(e, jx + 22, 160, 22);
  });
  // hanging garden tools
  box(820, 226, 110, 90, 4, '#c89a68', '#7a5030', 2);
  ctx.fillStyle = '#7a5030'; for (let y = 236; y < 312; y += 12) for (let x = 830; x < 926; x += 12) circle(x, y, 1.5);
  ctx.strokeStyle = '#8a5a34'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(846, 236); ctx.lineTo(846, 300); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(834, 300); ctx.lineTo(858, 300); ctx.moveTo(838, 300); ctx.lineTo(838, 310); ctx.moveTo(846, 300); ctx.lineTo(846, 312); ctx.moveTo(854, 300); ctx.lineTo(854, 310); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(876, 240); ctx.lineTo(876, 282); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(876, 282); ctx.quadraticCurveTo(866, 296, 876, 306); ctx.quadraticCurveTo(886, 296, 876, 282); fillLine('#b8b8c8', '#6a6a7a', 1.5);
  ctx.beginPath(); ctx.moveTo(898, 262); ctx.lineTo(924, 262); ctx.lineTo(920, 290); ctx.lineTo(902, 290); ctx.closePath(); fillLine('#ff8fc8', '#a03a6a', 2);
  ctx.strokeStyle = '#a03a6a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(911, 262, 10, Math.PI, 0); ctx.stroke();
  // workbench with ribbon spools and a sewing kit
  box(650, 396, 290, 16, 3, vgrad(396, 412, '#b8804a', '#8a5a30'), '#5a3a20', 2.5);
  for (const lx of [664, 916]) box(lx, 410, 14, 62, 2, '#8a5a30', '#5a3a20', 2);
  [['#ff5fa2', 690], ['#9b6ae8', 722], ['#40b0ff', 754]].forEach(([c, sx]) => {
    box(sx - 12, 366, 24, 30, 4, c, mix(c, '#2a1050', 0.45), 2);
    box(sx - 15, 362, 30, 6, 2, '#e8c890', '#8a6a3a', 1.2); box(sx - 15, 392, 30, 6, 2, '#e8c890', '#8a6a3a', 1.2);
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1; for (let y = 370; y < 392; y += 4) { ctx.beginPath(); ctx.moveTo(sx - 11, y); ctx.lineTo(sx + 11, y); ctx.stroke(); }
  });
  box(790, 376, 70, 22, 6, '#ff9ec7', '#a03a6a', 2); box(794, 370, 62, 10, 4, '#ffd0e4', '#a03a6a', 1.5);
  inkCircle(890, 386, 9, '#ffe24a', 0.8, '#a08020'); ctx.fillStyle = '#c0a020'; for (let i = 0; i < 6; i++) circle(886 + (i % 3) * 4, 382 + Math.floor(i / 3) * 6, 1);
  ctx.strokeStyle = '#8a8aa0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(910, 394); ctx.lineTo(930, 380); ctx.moveTo(910, 380); ctx.lineTo(930, 394); ctx.stroke();
  // hay bale
  box(560, 420, 120, 58, 8, vgrad(420, 478, '#f2d070', '#d4a840'), '#9a7020', 2.5);
  ctx.strokeStyle = 'rgba(150,100,20,.55)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 26; i++) { const sx = 566 + R() * 108, sy = 426 + R() * 46; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 10 - R() * 20, sy + 4); ctx.stroke(); }
  ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 3; for (const tx of [590, 650]) { ctx.beginPath(); ctx.moveTo(tx, 420); ctx.lineTo(tx, 478); ctx.stroke(); }
  // braided rug and a soft hay bed
  for (let i = 0; i < 7; i++) {
    ctx.strokeStyle = ['#ff6fa8', '#b88af0', '#fff0e0', '#ff9ec7', '#8ad4ff', '#ffd23f', '#ff6fa8'][i]; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.ellipse(HUB_UNI.x, 508, 290 - i * 34, 36 - i * 4.2, 0, 0, TAU); ctx.stroke();
  }
  ctx.fillStyle = vgrad(470, 520, '#f6d878', '#d8ac48'); ellipse(HUB_UNI.x - 170, 500, 110, 26);
  ctx.strokeStyle = 'rgba(160,110,30,.6)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 40; i++) { const sx = HUB_UNI.x - 270 + R() * 200, sy = 482 + R() * 30; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 14 - R() * 28, sy - 6 + R() * 4); ctx.stroke(); }
}
function drawShedInterior(dim = 0) {
  blit(sprite('shedInterior', W, H, 0, 0, paintShedInterior), 0, 0);
  // a warm lantern glow, flickering a little
  const f = 0.85 + Math.sin(S.t * 7) * 0.05 + Math.sin(S.t * 13) * 0.04;
  const lg = ctx.createRadialGradient(540, 70, 4, 540, 70, 260);
  lg.addColorStop(0, `rgba(255,210,130,${0.35 * f})`); lg.addColorStop(1, 'rgba(255,210,130,0)');
  ctx.fillStyle = lg; ctx.fillRect(280, 0, 520, 340);
  ctx.strokeStyle = '#4a2a18'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(540, 18); ctx.lineTo(540, 48); ctx.stroke();
  box(526, 48, 28, 34, 6, `rgba(255,220,140,${f})`, '#4a2a18', 2.5);
  box(522, 44, 36, 8, 3, '#5a3a20', '#3a2010', 1.5);
  // fairy lights
  ctx.strokeStyle = '#3d2c22'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, 30); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 30 + Math.sin(x / 80) * 14 + 10); ctx.stroke();
  for (let x = 20; x < W; x += 40) {
    const y = 30 + Math.sin(x / 80) * 14 + 16, i = (x / 40) | 0;
    const c = ['#ff6fb5', '#ffe36b', '#6fd0ff', '#8ff0a8'][i % 4];
    ctx.fillStyle = c; ctx.globalAlpha = 0.22 + 0.12 * Math.sin(S.t * 3 + i); circle(x, y, 13); ctx.globalAlpha = 1; circle(x, y, 5);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(x - 1.5, y - 1.5, 1.6);
  }
  if (dim) { ctx.fillStyle = `rgba(20,10,30,${dim})`; ctx.fillRect(0, 0, W, H); }
}

function drawMats(x, y, w, rows = 1) {
  const perRow = Math.ceil(MAT_ORDER.length / rows);
  darkPanel(x, y - (rows - 1) * 32, w, 40 + (rows - 1) * 32, 14);
  const step = (w - 20) / perRow;
  MAT_ORDER.forEach((k, i) => {
    const cx = x + 22 + (i % perRow) * step, cy = y + 20 - (rows - 1 - Math.floor(i / perRow)) * 32;
    ctx.globalAlpha = S.mats[k] ? 1 : 0.35;
    emoji(MATS[k].icon, cx, cy, 20);
    text(String(S.mats[k]), cx + 13, cy + 2, 14, '#fff', 'left', 700);
  });
  ctx.globalAlpha = 1;
}
const TIER_COLORS = { 0: '#b9aac4', 1: '#5fb87a', 2: '#4fa8e0', 3: '#9a6ae0' };

// --- the Workshop: craft at night, or just peek at the plans during the day ---------------------
const WS_UNI = [168, 0.9]; // the unicorn's x and scale beside the crafting panel
SCENES.style = {
  enter({ mode = 'peek', onDone } = {}) {
    Object.assign(this, { mode, onDone, shake: 0, joy: 0 });
    if (!petSlots().some(sl => sl.id === this.tab)) this.tab = petSlots()[0].id;
    if (mode === 'craft') speak(isDino() ? `Dress-up time! Use your supplies to make cosy things for ${S.name}.` : `Workshop time! Use your treasures to make things for ${S.name}.`);
  },
  update(dt) {
    this.shake = Math.max(0, this.shake - dt); this.joy = Math.max(0, this.joy - dt);
    if (pressed.escape) return this.onDone();
    const id = clickedButton();
    if (!id) return;
    if (id === 'done') return this.onDone();
    if (id.startsWith('tab:')) { this.tab = id.slice(4); return; }
    if (!id.startsWith('item:')) return;
    const it = ITEM[id.slice(5)];
    if (S.owned[it.id]) {
      const optional = it.slot !== 'mane' && it.slot !== 'style';
      S.equip[it.slot] = S.equip[it.slot] === it.id && optional ? null : it.id;
      this.joy = 0.6;
    } else if (canAfford(it.cost) && this.mode === 'craft') {
      pay(it.cost); S.owned[it.id] = true; S.equip[it.slot] = it.id;
      SFX.sparkle(); this.joy = 1.2;
      burst(WS_UNI[0], 300, 30);
      floatText(WS_UNI[0], 160, isDino() ? `Made: ${it.name}!` : `Made: ${it.name}! +${it.pts} points`, '#fff6a8', false, 24);
      speak(`You made the ${it.name}!`);
    } else if (canAfford(it.cost)) {
      SFX.click();
      floatText(730, 470, 'You can make this tonight in the shed!', '#ffd1ec', false, 17);
    } else {
      SFX.miss(); this.shake = 0.4;
      const need = Object.entries(it.cost).filter(([k, n]) => S.mats[k] < n).map(([k, n]) => `${MATS[k].icon}${n - S.mats[k]}`).join(' ');
      floatText(730, 470, `Still need ${need}`, '#ffd1ec', false, 17);
    }
  },
  draw() {
    buttons = [];
    drawShedInterior(0.15);
    // she stands in the open space left of the crafting panel (it starts at x 340), so none of her is hidden
    drawPet(WS_UNI[0], 428, WS_UNI[1], petLook(), { facing: 1, mood: this.joy > 0 ? 'joy' : undefined, glow: 0.5 });
    const craft = this.mode === 'craft';
    darkPanel(12, 12, 316, 46, 23);
    emoji(craft ? '🔨' : '📖', 36, 35, 22);
    const dino = isDino(), slots = petSlots();
    text(craft ? `${dino ? 'Dress-up' : 'Workshop'} · Night ${S.day}` : dino ? 'Dress-up Ideas' : 'Outfit Plans', 56, 35, 19, '#fff', 'left', 700);
    darkPanel(12, 66, 316, 68, 18);
    if (dino) {
      // the journey kit: everything she has made for him so far
      const kit = dinoKit();
      text(`Journey kit: ${kit.length} thing${kit.length === 1 ? '' : 's'}`, 28, 88, 18, '#fff6a8', 'left', 700);
      if (kit.length) kit.slice(0, 11).forEach((it, i) => emoji(it.icon, 38 + i * 26, 116, 20));
      else text('Make him something cosy!', 28, 116, 14, 'rgba(255,255,255,.8)', 'left', 600);
    } else {
      // outfit score against the rivals
      const score = outfitScore();
      text(`Show score: ${score}`, 28, 88, 18, '#fff6a8', 'left', 700);
      RIVALS.forEach((r, i) => {
        const x = 28 + i * 100, beat = score > r.score;
        emoji(r.icon, x + 12, 116, 20);
        text(String(r.score), x + 28, 117, 15, beat ? '#9ff0b8' : 'rgba(255,255,255,.7)', 'left', 700);
        if (beat) text('✓', x + 56, 117, 14, '#9ff0b8', 'left', 700);
      });
    }

    const px = 340, pw = W - px - 12;
    panel(px, 12, pw, H - 84, 18);
    slots.forEach((sl, i) => {
      const n = slots.length, tx = px + 10 + i * ((pw - 20) / n), tw = (pw - 20) / n - 6, on = this.tab === sl.id;
      const b = { id: `tab:${sl.id}`, x: tx, y: 22, w: tw, h: 52, on: true, key: String(i + 1) };
      buttons.push(b);
      rrect(tx, 22, tw, 52, 12, on ? '#ff6fb5' : inRect(b) ? '#ffd1ec' : '#f3e6fb', on ? null : '#e2c6f5', 2);
      emoji(sl.icon, tx + tw / 2, 42, 22);
      const eq = S.equip[sl.id] && ITEM[S.equip[sl.id]].pts;
      if (eq && !dino) { rrect(tx + tw - 22, 18, 26, 18, 9, '#ffc83d'); text(String(eq), tx + tw - 9, 27, 11, '#5a2a00', 'center', 700); }
      text(sl.name.split(' ')[0], tx + tw / 2, 66, 11, on ? '#fff' : '#7a5a8a', 'center', 600);
    });
    const slot = slots.find(s => s.id === this.tab);
    text(slot.name, px + 18, 96, 19, '#5a2a6e', 'left', 700);
    text(craft ? 'Tap to craft or wear' : 'Craft these at night in the shed', px + pw - 16, 96, 13, '#9a7aaa', 'right', 500);

    const items = WARDROBE.filter(i => i.slot === this.tab);
    const cw = (pw - 40) / 2, ch = 72;
    items.forEach((it, i) => {
      const cx = px + 14 + (i % 2) * (cw + 12), cy = 112 + Math.floor(i / 2) * (ch + 8);
      const owned = S.owned[it.id], worn = S.equip[it.slot] === it.id, afford = !owned && canAfford(it.cost);
      const b = { id: `item:${it.id}`, x: cx, y: cy, w: cw, h: ch, on: true };
      buttons.push(b);
      const hover = inRect(b);
      const shakeX = !owned && !afford && hover && this.shake > 0 ? Math.sin(S.t * 60) * 3 : 0;
      rrect(cx + shakeX, cy, cw, ch, 14, worn ? '#ffe3f1' : hover ? '#fbf3ff' : '#fff', worn ? '#ff6fb5' : '#e2c6f5', worn ? 3.5 : 2);
      rrect(cx + shakeX, cy + 10, 5, ch - 20, 3, TIER_COLORS[it.tier]);
      const ix = cx + 36 + shakeX, iy = cy + ch / 2;
      if (it.slot === 'mane') {
        const pal = MANES[it.id];
        pal.forEach((c, j) => { const a = j / pal.length * Math.PI * 2; ctx.fillStyle = c; circle(ix + Math.cos(a) * 10, iy + Math.sin(a) * 10, 9); });
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy, 21, 0, Math.PI * 2); ctx.stroke();
      } else if (it.slot === 'hooves') {
        rrect(ix - 16, iy - 14, 32, 28, 8, HOOF_COLORS[it.value], OL, 2.5);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(ix - 6, iy - 5, 4);
      } else emoji(it.icon, ix, iy, 30);
      ctx.globalAlpha = owned || afford ? 1 : 0.6;
      text(it.name, cx + 66 + shakeX, cy + 22, 15, '#4a2060', 'left', 700);
      ctx.globalAlpha = 1;
      if (it.pts && !dino) { rrect(cx + cw - 52, cy + 8, 44, 22, 11, TIER_COLORS[it.tier]); text(`+${it.pts}`, cx + cw - 30, cy + 19, 13, '#fff', 'center', 700); }
      let status, col;
      if (worn) { status = 'Wearing ✓'; col = '#d0407e'; }
      else if (owned) { status = 'Tap to wear'; col = '#7a5a8a'; }
      else if (afford) { status = craft ? `Craft: ${costText(it.cost)}` : `Ready: ${costText(it.cost)}`; col = '#2f9a55'; }
      else { status = `Need: ${costText(it.cost)}`; col = '#b07a90'; }
      text(status, cx + 66 + shakeX, cy + 50, 14, col, 'left', 600);
    });
    drawMats(12, H - 52, 316, 2);
    const doneLabel = !craft ? 'Back to the map' : dino ? `Back to ${S.name} 🦕` : S.day === SHOW_DAY ? 'To the show! ✨' : 'Bedtime 😴';
    button('done', W - 222, H - 64, 210, 52, doneLabel, { color: craft ? '#ff6fb5' : '#9a6ae0', size: 17 });
    drawFx(false);
  },
};

// --- Mom's surprise visit: hide everything! ---------------------------------------------
const EVIDENCE_SPOTS = [[110, 236], [200, 250], [560, 230], [650, 260], [90, 420], [560, 470], [680, 440], [800, 470], [880, 300], [740, 240]];
SCENES.hide = {
  enter(onDone) {
    const n = 3 + Math.floor(S.day / 2);
    const icons = MAT_ORDER.map(k => MATS[k].icon);
    const spots = [...EVIDENCE_SPOTS].sort(() => Math.random() - 0.5).slice(0, n);
    Object.assign(this, {
      onDone, time: 8 - S.day * 0.4, max: 8 - S.day * 0.4, tarp: false, result: null, stepT: 0, intro: 1.4,
      items: spots.map(([x, y]) => ({ x, y, icon: pick(icons), gone: false, fly: 0 })),
    });
    SFX.alert();
    speak(`Oh no! Mom is coming! Click everything sparkly, and click ${S.name} to hide ${isDino() ? 'him' : 'her'} under the tarp!`);
  },
  update(dt) {
    if (this.result) return;
    if (this.intro > 0) { this.intro -= dt; return; }
    this.time -= dt; this.stepT -= dt;
    if (this.stepT <= 0) { SFX.step(); this.stepT = Math.max(0.25, this.time / this.max * 0.6); }
    for (const it of this.items) if (it.gone) it.fly = Math.min(1, it.fly + dt * 3);
    if (pointer.clicked) {
      const it = this.items.find(i => !i.gone && Math.hypot(pointer.x - i.x, pointer.y - i.y) < 40);
      if (it) { it.gone = true; SFX.pick(); }
      else if (!this.tarp && Math.abs(pointer.x - (HUB_UNI.x + 20)) < 130 && pointer.y > 200 && pointer.y < 500) {
        this.tarp = true; SFX.pop(); burst(HUB_UNI.x, HUB_UNI.y - 120, 12, { colors: ['#9aa870', '#7a8a5a'] });
      }
    }
    const allDone = this.tarp && this.items.every(i => i.gone);
    if (allDone || this.time <= 0) {
      this.result = allDone ? 'ok' : 'fail';
      allDone ? momVisitOk(this.onDone) : momVisitFail(this.onDone);
    }
  },
  draw() {
    buttons = [];
    drawShedInterior();
    if (this.tarp) drawTarp(HUB_UNI.x + 20, HUB_UNI.y, 1.15);
    else drawPet(HUB_UNI.x, HUB_UNI.y, HUB_UNI.s, petLook(), { facing: 1, mood: isDino() ? 'scared' : 'wow' });
    inkRect(850, 448, 90, 56, '#c99a5a', 3, 10);
    ctx.strokeStyle = 'rgba(91,63,115,.4)'; ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(850 + i * 18, 450); ctx.lineTo(850 + i * 18, 502); ctx.stroke(); }
    for (const it of this.items) {
      if (it.fly >= 1) continue;
      const k = easeOut(it.fly), x = lerp(it.x, 895, k), y = lerp(it.y, 470, k) - Math.sin(k * Math.PI) * 80;
      if (!it.gone) { ctx.fillStyle = `rgba(255,255,200,${0.4 + 0.3 * Math.sin(S.t * 8)})`; circle(x, y, 32); }
      emoji(it.icon, x, y, 38 * (1 - k * 0.5));
    }
    const left = this.items.filter(i => !i.gone).length;
    panel(W / 2 - 270, 14, 540, 92, 18);
    outlined("Mom's coming! Hide everything!", W / 2, 40, 24, '#ff6fb5', 'center', '#fff');
    text(`Click the sparkly things (${left} left)${this.tarp ? '' : ` and click ${S.name} to throw a tarp over ${isDino() ? 'him' : 'her'}!`}`, W / 2, 68, 14, '#5a2a6e', 'center', 600);
    bar(W / 2 - 240, 84, 480, 12, (this.time / this.max) * 100, this.time / this.max < 0.35 ? '#ff5a5a' : '#ffb15c');
    const k = 1 - clamp(this.time / this.max, 0, 1);
    ctx.save(); ctx.beginPath(); ctx.rect(86, 74, 144, 108); ctx.clip();
    ctx.fillStyle = 'rgba(40,20,60,.7)'; circle(110 + k * 60, 160 - k * 30, 20 + k * 14); ellipse(110 + k * 60, 210 - k * 30, 30 + k * 14, 40);
    ctx.restore();
    if (this.intro > 0) { ctx.fillStyle = `rgba(255,255,255,${this.intro * 0.3})`; ctx.fillRect(0, 0, W, H); outlined('Footsteps outside...!', W / 2, H / 2, 40, '#ffd23f'); }
    drawFx(false);
  },
};
function momVisitOk(onDone) {
  const visits = [
    [['mom', null, 'Aubrey? Oh, there you are! What are you doing out in the shed?'], ['aubrey', 'silly', 'Just... organising flowerpots!'], ['mom', null, "Well, aren't you a helper. ...Is that tarp breathing?"], ['aubrey', 'winky', "It's a very old lawnmower."], ['mom', null, "Hm! Okay, sweetie. Don't stay out too long."]],
    [['mom', null, 'Knock knock! I brought you a snack, honey.'], ['aubrey', 'happy', 'Thanks, Mom! Everything is totally normal in here!'], ['mom', null, "I never said it wasn't... Okay! Love you!"]],
  ];
  say([...pick(visits), ['narrator', null, 'Phew! The secret is safe.']], onDone);
}
// failing doesn't end the game — Mom just tidies away some of the evidence
function momVisitFail(onDone) {
  const have = MAT_ORDER.filter(k => S.mats[k] > 0);
  let lost = '';
  if (have.length) {
    const k = have.sort((a, b) => MATS[a].tier - MATS[b].tier)[0];
    const n = Math.min(S.mats[k], 2);
    S.mats[k] -= n;
    lost = ` Mom took away ${n} ${MATS[k].name} ${MATS[k].icon}.`;
  }
  say([
    isDino() ? ['mom', 'shock', 'Aubrey, why are there LEAVES all over the floor? And is that a... tiny three-toed footprint?']
      : ['mom', 'shock', 'Aubrey, why is there GLITTER all over the floor? And is that a... hoofprint?'],
    isDino() ? ['aubrey', 'serious', "It's for a school project! About... dinosaurs. Pretend ones."]
      : ['aubrey', 'serious', "It's for a school project! About... horses. Sparkly horses."],
    ['mom', null, "Hmm. I'm tidying up this mess, missy."],
    ['narrator', null, `Phew — she didn't spot ${S.name}!${lost}`],
  ], onDone);
}
