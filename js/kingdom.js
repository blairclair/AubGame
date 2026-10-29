'use strict';
// The road to the show: after the last day, Aubrey and the unicorn bounce up through the Fairy Kingdom
// to the Starlight Glade. Like Cloud Bounce, she bounces on everything and you steer; there is no timer and
// no way to fail, because the story can't go on without it. A fall just gets a sparkly catch from the fairy.

const KR_V = 820, KR_G = 1500, KR_SY = 430, KR_TOP = 4900, KR_W = 128;
// four parts of the kingdom, bottom to top
const KR_ZONES = [
  { name: 'The Enchanted Garden', to: 1250, sky: ['#7fd4ff', '#dff7ff'], say: 'The Enchanted Garden! Bounce on the leaves. Red mushrooms bounce extra high!' },
  { name: 'Castle Town', to: 2500, sky: ['#ff9ac0', '#ffe2b8'], say: 'Castle Town! Some balconies slide back and forth.' },
  { name: 'The Rainbow Bridges', to: 3700, sky: ['#b28cff', '#ffd0ec'], say: 'The Rainbow Bridges! Careful, the crystal ones crack after one bounce!' },
  { name: 'The Starry Sky', to: KR_TOP, sky: ['#1e1a5a', '#6a4ab8'], say: 'The Starry Sky! The glade is just above the moon!' },
];
function krGlow(x, y, r, rgb, a = 0.6) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
const krZone = wy => KR_ZONES.findIndex(z => wy < z.to) < 0 ? 3 : KR_ZONES.findIndex(z => wy < z.to);

function krPlatform(p, x, y, t) {
  const z = p.zone, w = p.w, sq = p.sq ? 1 - Math.sin(p.sq / 0.25 * Math.PI) * 0.2 : 1;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, sq);
  if (p.kind === 'crumble') {
    // a pale crystal slab with cracks
    ink(P2(`M${-w / 2},0 L${w / 2},0 L${w / 2 - 12},16 L${-w / 2 + 12},16 Z`), '#c8f0ff', 2);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-w / 2 + 10, 3, w - 30, 3);
    ctx.strokeStyle = 'rgba(80,120,170,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-6, 9); ctx.lineTo(-12, 16); ctx.moveTo(20, 0); ctx.lineTo(26, 10); ctx.stroke();
  } else if (p.kind === 'spring') {
    if (z === 0) { // a red spotty mushroom
      inkRect(-10, 0, 20, 26, '#fff4e0', 1.5, 6);
      ink(P2(`M${-w / 2 + 16},4 C${-w / 2 + 10},-30 ${w / 2 - 10},-30 ${w / 2 - 16},4 Z`), '#ff4a5a', 2);
      ctx.fillStyle = '#ffffff'; circle(-24, -8, 7); circle(10, -14, 6); circle(30, -2, 5); circle(-4, -2, 4);
    } else if (z === 1) { // a striped trampoline drum
      inkRect(-w / 2 + 14, 2, w - 28, 22, '#ffd23f', 2, 6);
      ctx.fillStyle = '#ff5f9a'; for (let i = 0; i < 5; i++) ctx.fillRect(-w / 2 + 22 + i * ((w - 44) / 5), 4, 9, 18);
      inkEllipse(0, 2, w / 2 - 12, 7, 0, '#5ad0ff', 2);
    } else if (z === 2) { // a pink rainbow puff
      puffCluster([[-30, 4, 20], [0, -2, 26], [30, 4, 20]], '#ffb8e0', 2, OL);
      for (const [c, k] of [['#ff7fb5', 0], ['#ffd23f', 1], ['#7fd8ff', 2]]) { ctx.fillStyle = c; ctx.fillRect(-36 + k * 24, 10, 20, 4); }
    } else { // a shooting star
      vecStar(0, -6, 26, '#ffe14a', 2);
      ctx.strokeStyle = 'rgba(255,240,170,.7)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-26, 4); ctx.lineTo(-60, 14); ctx.stroke();
    }
  } else if (z === 0) { // a big leaf
    ink(P2(`M${-w / 2},4 Q0,${-16} ${w / 2},4 Q0,${24} ${-w / 2},4 Z`), '#5ac85a', 2);
    ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-w / 2 + 8, 4); ctx.lineTo(w / 2 - 8, 4); ctx.stroke();
    flower(w / 2 - 20, -2, 6, '#ffffff', '#ffd84a', 1);
  } else if (z === 1) { // a stone balcony with a little awning underneath
    inkRect(-w / 2, 0, w, 14, '#efe2d0', 2, 4);
    for (let i = 0; i < 6; i++) { const ax = -w / 2 + 8 + i * ((w - 16) / 6); ink(P2(`M${ax},14 L${ax + (w - 16) / 6},14 L${ax + (w - 16) / 12},28 Z`), i % 2 ? '#ff7fb5' : '#ffffff', 1.2); }
    if (p.kind === 'move') { ctx.fillStyle = '#4fa8e0'; tri(-w / 2 - 14, 7, -w / 2 - 4, 0, -w / 2 - 4, 14); tri(w / 2 + 14, 7, w / 2 + 4, 0, w / 2 + 4, 14); }
  } else if (z === 2) { // a rainbow bar
    ['#ff6f8a', '#ffb83a', '#ffe14a', '#6fdc7a', '#6fb8ff'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(-w / 2 + i * 2, i * 4, w - i * 4, 5, 3); ctx.fill(); });
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-w / 2, 0, w, 20, 8); ctx.stroke();
  } else { // a glowing moon slab
    ink(P2(`M${-w / 2},2 Q0,${-10} ${w / 2},2 Q${w / 2 - 6},18 0,18 Q${-w / 2 + 6},18 ${-w / 2},2 Z`), '#fff2b0', 2);
    ctx.fillStyle = 'rgba(220,190,110,.6)'; circle(-20, 8, 5); circle(16, 6, 4); circle(36, 10, 3);
  }
  ctx.restore();
}

// scenery for each part of the kingdom, scrolling slower than the platforms
function krScenery(cam) {
  const par = 0.55;
  for (let i = 0; i < 22; i++) {
    const wy = i * 230 + 80, y = KR_SY - (wy - cam * par) * 1, side = i % 2 ? 1 : -1, x = side < 0 ? 60 + (i * 37) % 60 : W - 60 - (i * 53) % 60;
    if (y < -260 || y > H + 260) continue;
    const z = krZone(wy / par);
    ctx.globalAlpha = 0.85;
    if (z === 0) { // giant flowers and toadstools
      ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x, y + 200); ctx.quadraticCurveTo(x + side * 20, y + 80, x, y); ctx.stroke();
      flower(x, y, 34, ['#ff9ac8', '#ffd84a', '#c6a2ff'][i % 3], '#ff9a3a', 2);
    } else if (z === 1) { // castle towers with pointy roofs and flags
      inkRect(x - 34, y - 20, 68, 260, '#f4e6ff', 2.5, 4);
      ink(P2(`M${x - 44},${y - 18} L${x},${y - 100} L${x + 44},${y - 18} Z`), ['#6a8af0', '#ff6f9a', '#9a6ae0'][i % 3], 2.5);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 100); ctx.lineTo(x, y - 130); ctx.stroke();
      ink(P2(`M${x},${y - 130} L${x + 26 + Math.sin(S.t * 4 + i) * 4},${y - 122} L${x},${y - 114} Z`), '#ffd23f', 1.5);
      inkRect(x - 12, y + 30, 24, 34, '#ffe08a', 2, 12);
    } else if (z === 2) { // floating crystal islands
      ink(P2(`M${x - 50},${y} L${x + 50},${y} L${x + 10},${y + 70} Z`), '#a88ad8', 2);
      for (const [dx, h, c] of [[-24, 50, '#8ae0ff'], [0, 74, '#d8b0ff'], [24, 40, '#ffb0e0']]) ink(P2(`M${x + dx - 10},${y} L${x + dx},${y - h} L${x + dx + 10},${y} Z`), c, 1.5);
    } else { // the moon and twinkly constellations
      for (let k = 0; k < 5; k++) star(x + Math.cos(k * 1.3 + i) * 50, y + Math.sin(k * 2.1 + i) * 40, 3 + 2 * Math.abs(Math.sin(S.t * 2 + k + i)), '#fff6c8', 4);
    }
    ctx.globalAlpha = 1;
  }
}

SCENES.kingdom = {
  enter() {
    const plats = [{ x: 480, x0: 480, wy: 0, w: 1300, kind: 'floor', zone: 0 }];
    let x = 480;
    for (let wy = 120; wy < KR_TOP - 110; wy += rand(100, 135)) {
      const zone = krZone(wy), r = Math.random();
      x = clamp(x + (Math.random() < 0.5 ? -1 : 1) * rand(120, 260), 90, 870);
      // each part of the kingdom adds one new kind of platform
      const kind = r < 0.12 ? 'spring' : zone >= 1 && r < 0.32 ? 'move' : zone >= 2 && r < 0.45 ? 'crumble' : 'plain';
      plats.push({ x, x0: x, wy, w: KR_W, kind, zone, ph: rand(0, 6), sq: 0, gem: Math.random() < 0.4, gone: 0 });
    }
    // a normal bounce only rises ~224, so always leave a plain step close enough to reach the glade
    let top = plats[plats.length - 1].wy;
    while (KR_TOP - top > 140) { top += 110; plats.push({ x: clamp(480 + rand(-200, 200), 90, 870), x0: 0, wy: top, w: KR_W, kind: 'plain', zone: 3, ph: 0, sq: 0, gem: false, gone: 0 }); }
    plats.push({ x: 480, x0: 480, wy: KR_TOP, w: 460, kind: 'glade', zone: 3, sq: 0 });
    Object.assign(this, { plats, x: 480, wy: 0, vy: KR_V, vx: 0, cam: 0, maxH: 0, falls: 0, gems: 0, last: plats[0], facing: 1, state: 'play', t2: 0, rescue: 0, land: 0, zone: 0, banner: 3, trail: [], usePointer: false });
    this.banner = 3.5;
    say([
      ['fairy', '🧚', `The moon is rising, Aubrey! The fashion show is in the Starlight Glade, at the very top of the Fairy Kingdom!`, () => SFX.sparkle()],
      ['fairy', '🧚', `There's no road up there. You and ${S.name} will have to BOUNCE! Steer left and right, and keep going up, up, up!`],
      ['aubrey', 'determined', `Ready, ${S.name}? Let's bounce all the way to the show!`],
    ]);
  },
  update(dt) {
    const g = this;
    g.rescue = Math.max(0, g.rescue - dt); g.land = Math.max(0, g.land - dt); g.banner = Math.max(0, g.banner - dt);
    for (const p of g.plats) {
      p.sq = Math.max(0, (p.sq || 0) - dt);
      if (p.kind === 'move') p.x = p.x0 + Math.sin(S.t * 1.1 + p.ph) * 85;
      if (p.gone > 0) p.gone = Math.max(0, p.gone - dt); // broken crystal grows back
    }
    if (g.state === 'play') {
      let want = 0;
      if (goLeft()) want = -1; else if (goRight()) want = 1;
      if (want) { g.vx = lerp(g.vx, want * 400, Math.min(1, dt * 10)); g.usePointer = false; }
      else if (pointerMoved(g)) g.vx = clamp((pointer.x - g.x) * 6, -420, 420);
      else g.vx = lerp(g.vx, 0, Math.min(1, dt * 6));
      if (Math.abs(g.vx) > 20) g.facing = Math.sign(g.vx);
    }
    g.x += g.vx * dt;
    if (g.x < -20) g.x = W + 20; if (g.x > W + 20) g.x = -20;
    const prev = g.wy;
    g.vy -= KR_G * dt; g.wy += g.vy * dt;
    if (g.vy < 0) for (const p of g.plats) {
      if (p.gone > 0) continue;
      if (prev >= p.wy && g.wy <= p.wy && Math.abs(g.x - p.x) < p.w / 2 + 12) {
        g.wy = p.wy; p.sq = 0.25; g.land = 0.12;
        g.vy = p.kind === 'spring' ? KR_V * 1.45 : KR_V;
        if (p.kind === 'spring') { tone(500, 0.3, 'sine', 0.08, 0, 1200); burst(p.x, KR_SY - (p.wy - g.cam), 12, { colors: ['#ffb0d8', '#fff6a8'] }); } else SFX.jump();
        if (p.kind === 'crumble') { p.gone = 4; tone(1400, 0.12, 'triangle', 0.05, 0, 700); burst(p.x, KR_SY - (p.wy - g.cam) + 8, 10, { colors: ['#c8f0ff', '#ffffff'] }); }
        else g.last = p;
        if (p.kind === 'glade' && g.state === 'play') {
          g.state = 'win'; g.t2 = 2.4; SFX.fanfare(); burst(g.x, 200, 40); speak('We made it! The Starlight Glade!');
          S.shine = Math.min(100, S.shine + Math.round(g.gems / 3));
        }
        break;
      }
    }
    if (g.state === 'win') { g.wy = KR_TOP; g.vy = 0; }
    g.maxH = Math.max(g.maxH, g.wy);
    // sparkle gems above some platforms
    for (const p of g.plats) if (p.gem && Math.abs(g.x - p.x) < 34 && Math.abs(g.wy + 50 - (p.wy + 60)) < 46) { p.gem = false; g.gems++; SFX.sparkle(); floatText(p.x, KR_SY - (p.wy + 60 - g.cam) - 20, '+✨', '#fff6a8', false, 22); }
    // a fall: the fairy's sparkles float them both back to the last safe platform
    if (g.wy < g.cam - 140 && g.state === 'play') {
      g.falls++; g.wy = g.last.wy; g.x = g.last.x; g.vy = KR_V; g.rescue = 1.4; g.trail = [];
      g.cam = Math.min(g.cam, g.last.wy + 40); tone(900, 0.25, 'sine', 0.06, 0, 1500); speak(pick(['Whoops! Fizzlewick caught you!', 'Fairy sparkles to the rescue!', 'Up you go again!']));
    }
    g.cam = Math.max(g.cam, lerp(g.cam, g.wy - 200, Math.min(1, dt * 5)));
    if (g.state === 'win') g.cam = lerp(g.cam, KR_TOP - 10, Math.min(1, dt * 2));
    g.cam = Math.min(g.cam, KR_TOP - 10);
    // a new part of the kingdom
    const z = krZone(g.maxH);
    if (z > g.zone) { g.zone = z; g.banner = 3; SFX.sparkle(); speak(KR_ZONES[z].say); }
    // the unicorn bounces along right behind, following Aubrey's path
    g.trail.push([g.x, g.wy]); if (g.trail.length > 18) g.trail.shift();
    if (g.state === 'win' && (g.t2 -= dt) <= 0 && !g.ending) {
      g.ending = true;
      say([
        ['aubrey', 'excited', `We did it, ${S.name}! Look at all the lights!`],
        ['fairy', '🧚', `You bounced through the whole kingdom! ${g.gems ? `And those ${g.gems} sparkles you caught make ${S.name} shine even brighter.` : ''} Now, on to the stage!`, () => SFX.sparkle()],
      ], () => startShow());
    }
  },
  draw() {
    buttons = [];
    const g = this, sy = wy => KR_SY - (wy - g.cam);
    // the sky blends from one part of the kingdom to the next
    const camZ = krZone(g.cam + 200), zA = KR_ZONES[camZ], zB = KR_ZONES[Math.min(3, camZ + 1)];
    const from = camZ ? KR_ZONES[camZ - 1].to : 0, k = clamp((g.cam + 200 - from) / (zA.to - from) * 1.6 - 0.9, 0, 1);
    ctx.fillStyle = vgrad(0, H, mix(zA.sky[0], zB.sky[0], k), mix(zA.sky[1], zB.sky[1], k)); ctx.fillRect(0, 0, W, H);
    const night = clamp((g.cam - 3000) / 900, 0, 1);
    if (night > 0) { ctx.globalAlpha = night; bdStars(60); ctx.globalAlpha = 1; }
    if (g.cam > 3300) bdMoon(800, sy(KR_TOP + 160) * 0.3 + 60, mix(zA.sky[0], zB.sky[0], k));
    // soft clouds drifting by (fewer as night falls), and bunting strung across Castle Town
    ctx.globalAlpha = 0.75 * (1 - night);
    for (let i = 0; i < 7; i++) { const x = ((i * 293 + S.t * (10 + i * 3)) % (W + 300)) - 150, y = ((i * 173 + g.cam * 0.35) % (H + 160)) - 80; puffCluster([[x - 40, y + 6, 22], [x, y - 8, 32], [x + 42, y + 4, 24]], '#ffffff', 0, 'rgba(0,0,0,0)'); }
    ctx.globalAlpha = 1;
    krScenery(g.cam);
    for (let i = 0; i < 6; i++) {
      const wy = 1400 + i * 200, y = KR_SY - (wy - g.cam * 0.75); if (y < -40 || y > H + 40) continue;
      ctx.strokeStyle = 'rgba(91,63,115,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(W / 2, y + 50, W, y); ctx.stroke();
      for (let k = 1; k < 16; k++) { const fx = k * W / 16, fy = y + Math.sin(k / 16 * Math.PI) * 25 + 1; ink(P2(`M${fx - 9},${fy} L${fx + 9},${fy} L${fx},${fy + 18} Z`), ['#ff7fb5', '#ffd23f', '#7fd8ff', '#a6f0b8'][(k + i) % 4], 1); }
    }
    // the Starlight Glade and its stage at the very top
    const gy = sy(KR_TOP);
    if (gy > -100) {
      krGlow(480, gy - 150, 340, '255,236,190', 0.55);
      drawStage(480, gy + 4, true);
    }
    for (const p of g.plats) {
      const y = sy(p.wy); if (y < -80 || y > H + 80) continue;
      if (p.kind === 'floor') {
        // the meadow behind Aubrey's house, where the climb begins
        ctx.fillStyle = '#7fcc66'; ctx.fillRect(0, y + 10, W, H); ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, y + 10); ctx.lineTo(W, y + 10); ctx.stroke();
        for (let i = 0; i < 14; i++) flower(30 + i * 70, y + 30 + (i % 2) * 20, 7, ['#ffd84a', '#fff', '#ff9ac0'][i % 3], '#ff9a3a', 1);
        continue;
      }
      if (p.kind === 'glade') { ink(P2(`M${p.x - p.w / 2},${y} L${p.x + p.w / 2},${y} L${p.x + p.w / 2 - 30},${y + 26} L${p.x - p.w / 2 + 30},${y + 26} Z`), '#9ad86a', 2.5); continue; }
      if (p.gone > 0) {
        // shards falling, then it fades back in
        if (p.gone > 3.4) { const f = (4 - p.gone) * 300; ctx.fillStyle = '#c8f0ff'; for (let i = 0; i < 5; i++) circle(p.x - 40 + i * 20, y + 8 + f * (0.6 + i * 0.1), 5); }
        else if (p.gone < 0.8) { ctx.globalAlpha = 1 - p.gone / 0.8; krPlatform(p, p.x, y, S.t); ctx.globalAlpha = 1; }
        continue;
      }
      krPlatform(p, p.x, y, S.t);
      if (p.gem) { const gy2 = sy(p.wy + 60) + Math.sin(S.t * 3 + p.ph) * 4; krGlow(p.x, gy2, 30, '255,240,160', 0.7); star(p.x, gy2, 13, '#fff6a8', 4); }
    }
    // the unicorn, a few moments behind Aubrey
    const [ux, uwy] = g.trail[0] || [g.x, g.wy];
    drawUnicorn(ux - g.facing * 46, sy(uwy) + 8, 0.3, uniLook(), { facing: g.facing, moving: true, glow: 0.4 + night * 0.4 });
    const ay = sy(g.wy);
    if (g.rescue) { ctx.globalAlpha = Math.min(1, g.rescue); for (let i = 0; i < 8; i++) star(g.x + Math.cos(S.t * 6 + i) * 50, ay - 60 + Math.sin(S.t * 6 + i) * 40, 6, '#fff6a8', 4); emoji('🧚', g.x + 60, ay - 130, 38); ctx.globalAlpha = 1; }
    drawAubrey(g.x, ay + 6, g.land ? 'crouch' : g.vy > 0 ? 'jump' : 'twirl', g.facing, 0, 0.42);
    // how far up: a meter with the four parts of the kingdom
    darkPanel(W - 52, 70, 36, 300, 18);
    emoji('👑', W - 34, 88, 22);
    KR_ZONES.forEach((z, i) => { const zy = 356 - (z.to / KR_TOP) * 252; ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(W - 46, zy, 24, 2); });
    const hy = 356 - clamp(g.maxH / KR_TOP, 0, 1) * 252;
    rrect(W - 40, hy - 2, 12, 356 - hy + 6, 6, '#ff9ac8');
    inkCircle(W - 34, hy, 8, '#ffd8b8', 1.5);
    darkPanel(16, 14, 150, 40, 20); text(`✨ ${g.gems}`, 40, 34, 20, '#fff6a8', 'left', 800);
    // a big banner when a new part of the kingdom begins
    if (g.banner > 0 && !dlg) {
      ctx.globalAlpha = Math.min(1, g.banner * 2);
      panel(W / 2 - 220, 70, 440, 64, 22); outlined(KR_ZONES[g.zone].name, W / 2, 103, 32, '#ff6fb5', 'center', '#fff');
      ctx.globalAlpha = 1;
    }
    if (g.state === 'play' && g.maxH < 60 && !dlg) outlined('Steer with ← → or the mouse!', W / 2, 170, 26, '#fff6a8');
    if (g.state === 'win') { panel(W / 2 - 230, 448, 460, 66, 22); outlined('The Starlight Glade!', W / 2, 481, 32, '#ff6fb5', 'center', '#fff'); }
  },
};
