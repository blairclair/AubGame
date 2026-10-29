'use strict';
// The road to the show: after the last day, Aubrey and the unicorn bounce up through the Fairy Kingdom
// to the Starlight Glade. Doodle-Jump style: she bounces on everything and you steer. There is no timer and
// no way to fail, because the story can't go on without it. A fall just gets a sparkly catch from the fairy.
// Aubrey has a wand: SPACE (or the star button) zaps the mischief-makers into flowers, butterflies and stars.
// Bouncing on top of one charms it too. Near the top, Grumbles the storm cloud sits over the glade until
// he has been zapped (or bopped) enough times, then he turns into a rainbow that carries her up.

const KR_V = 820, KR_G = 1500, KR_SY = 430, KR_TOP = 5500, KR_W = 128, KR_SC = 0.42;
const KR_BOSS_Y = KR_TOP - 170;      // Grumbles' middle
const KR_CEIL = KR_TOP - 325;        // while he's there, her feet can't rise past this (her head bops his tummy)
const KR_ARENA = KR_TOP - 500;       // the wide clouds under him
const KR_BOSS_HP = 6;
const KR_CAST = { x: W - 76, y: H - 104, r: 42 };
// four parts of the kingdom, bottom to top
const KR_ZONES = [
  { name: 'The Enchanted Garden', icon: '🌷', to: 1350, sky: ['#6fcaff', '#e4fbff'], tip: 'Mushrooms and flowers bounce extra high!',
    say: 'The Enchanted Garden! Red mushrooms and spring flowers bounce extra high. Bubbles pop! Zap the grumpy rain clouds with your wand!' },
  { name: 'Castle Town', icon: '🏰', to: 2700, sky: ['#ff8fbf', '#ffe6bf'], tip: 'Pillows, nets and cannons!',
    say: 'Castle Town! Bounce on the pillows and the nets. Hop in a cannon for a big boom! Watch out for cheeky imps.' },
  { name: 'The Rainbow Bridges', icon: '🌈', to: 4000, sky: ['#a98aff', '#ffd3ee'], tip: 'Wobbly jelly and rainbow boosters!',
    say: 'The Rainbow Bridges! Wobbly jelly, rainbow boosters, and crystal that cracks. Gremlins want your sparkles!' },
  { name: 'The Starry Sky', icon: '🌙', to: KR_TOP, sky: ['#120e40', '#3d2c8a'], tip: 'Spinning stars and sleepy bats!',
    say: 'The Starry Sky! Bounce on the spinning stars. Sleepy bats are flapping about. The glade is just above!' },
];
// how high each kind of platform sends her (1 = a normal bounce, about 224 high)
const KR_BOUNCE = { plain: 1, move: 1, crumble: 1, cloud: 1, arena: 1, spring: 1.45, mushroom: 1.45, flower: 1.25, bubble: 1.12,
  pillow: 1.2, net: 1.35, cannon: 1.8, jelly: 1.15, boost: 1.6, star: 1.2 };
const KR_WIDTH = { mushroom: 120, flower: 92, bubble: 104, pillow: 132, net: 232, cannon: 92, jelly: 112, cloud: 142, star: 100 };
// which platforms turn up where
const KR_MIX = [
  { plain: 44, mushroom: 13, flower: 18, bubble: 13 },
  { plain: 34, move: 16, pillow: 18, net: 11, cannon: 8 },
  { plain: 28, crumble: 14, jelly: 18, boost: 10, cloud: 14, bubble: 6 },
  { plain: 32, star: 26, cloud: 18, bubble: 8, spring: 10 },
];
const KR_FOE = ['cloud', 'imp', 'gremlin', 'bat'];
const KR_INTO = { cloud: 'flower', imp: 'butterfly', gremlin: 'butterfly', bat: 'star' };
const KR_RAINBOW = ['#ff6f8a', '#ffb83a', '#ffe14a', '#6fdc7a', '#6fb8ff', '#b58aff'];
const KR_POWER = { shield: { icon: '🛡️', col: '170,220,255', name: 'Shield bubble!' }, burst: { icon: '🌟', col: '255,236,140', name: 'Star burst!' }, rocket: { icon: '🚀', col: '255,170,210', name: 'Fairy-dust rocket!' } };

function krGlow(x, y, r, rgb, a = 0.6) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
const krZone = wy => { const i = KR_ZONES.findIndex(z => wy < z.to); return i < 0 ? 3 : i; };
// screen y of item i of n repeating items `gap` apart that scroll at `par` of the camera speed
const krRep = (i, gap, n, cam, par) => { const span = gap * n; return ((i * gap + cam * par) % span + span) % span - gap; };
function krPick(m) { let tot = 0; for (const k in m) tot += m[k]; let r = Math.random() * tot; for (const k in m) if ((r -= m[k]) < 0) return k; return 'plain'; }

// --- little hand-drawn helpers ------------------------------------------------------
function krButterfly(x, y, s, col, t, tilt = 0) {
  const f = 0.25 + 0.75 * Math.abs(Math.sin(t * 11));
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
  const wings = [[-1, -6, 10, 9], [1, -6, 10, 9], [-1, 6, 7, 6], [1, 6, 7, 6]];
  ctx.strokeStyle = OL; ctx.lineWidth = 3;
  for (const [sx, wy, rx, ry] of wings) { ctx.beginPath(); ctx.ellipse(sx * rx * f, wy, rx * f, ry, 0, 0, Math.PI * 2); ctx.stroke(); }
  for (const [sx, wy, rx, ry] of wings) { ctx.fillStyle = wy < 0 ? col : mix(col, '#ffffff', 0.4); ellipse(sx * rx * f, wy, rx * f, ry); }
  ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(-6 * f, -7, 2.2); circle(6 * f, -7, 2.2);
  ctx.fillStyle = OL; ellipse(0, 0, 2.4, 10);
  ctx.strokeStyle = OL; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(-3, -16, -6, -17); ctx.moveTo(0, -9); ctx.quadraticCurveTo(3, -16, 6, -17); ctx.stroke();
  ctx.restore();
}
function krFace(x, y, s, mood) { // mood: 'grump' | 'cheeky' | 'happy' | 'sleepy'
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = OL; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  if (mood === 'sleepy') { ctx.beginPath(); ctx.arc(-8, -2, 4, 0.1, Math.PI - 0.1); ctx.moveTo(12, -2); ctx.arc(8, -2, 4, 0.1, Math.PI - 0.1); ctx.stroke(); }
  else {
    ctx.fillStyle = '#fff'; circle(-8, -3, 5); circle(8, -3, 5);
    ctx.fillStyle = OL; circle(-7, -2, 2.6); circle(9, -2, 2.6);
    ctx.fillStyle = '#fff'; circle(-6, -3, 1); circle(10, -3, 1);
  }
  if (mood === 'grump') { ctx.beginPath(); ctx.moveTo(-14, -12); ctx.lineTo(-3, -8); ctx.moveTo(14, -12); ctx.lineTo(3, -8); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 10, 6, Math.PI + 0.4, -0.4); ctx.stroke(); }
  else if (mood === 'cheeky') { ctx.beginPath(); ctx.moveTo(-14, -10); ctx.lineTo(-3, -11); ctx.moveTo(14, -12); ctx.lineTo(4, -9); ctx.stroke(); ctx.beginPath(); ctx.arc(1, 4, 7, 0.2, Math.PI - 0.2); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-2, 9, 4, 4); }
  else { ctx.beginPath(); ctx.arc(0, 4, 6, 0.3, Math.PI - 0.3); ctx.stroke(); ctx.fillStyle = 'rgba(255,120,160,.45)'; circle(-13, 5, 3.5); circle(13, 5, 3.5); }
  ctx.restore();
}

// --- the platforms ------------------------------------------------------------------
function krPlatform(p, x, y) {
  const w = p.w, z = p.zone, k = p.sq > 0 ? Math.sin(p.sq / 0.25 * Math.PI) : 0; // 0..1..0 on a bounce
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const squash = (sx, sy, ay = 0) => { ctx.translate(0, ay); ctx.scale(1 + k * sx, 1 - k * sy); ctx.translate(0, -ay); };
  switch (p.kind) {
    case 'mushroom': { // a red spotty toadstool trampoline
      squash(0.16, 0.32, 40);
      ink(P2('M-14,14 Q-18,34 -16,44 L16,44 Q18,34 14,14 Z'), '#fff4e0', 2);
      ink(P2(`M${-w / 2},22 C${-w / 2 + 6},-10 ${w / 2 - 6},-10 ${w / 2},22 Q0,32 ${-w / 2},22 Z`), vgradL(-6, 28, '#ff6a78', '#e8304a'), 2);
      for (const [sx, sy2, r] of [[-30, 10, 8], [0, 3, 9], [28, 9, 7], [-12, 18, 4], [14, 17, 4]]) inkCircle(sx, sy2, r, '#fffaf0', 0.7);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-14, 18, 26, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
      break;
    }
    case 'flower': { // a spring flower: a coil stem and a big flat bloom
      const len = 52 * (1 - k * 0.45);
      ctx.beginPath(); ctx.moveTo(0, 12); for (let i = 1; i <= 8; i++) ctx.lineTo(i % 2 ? -9 : 9, 12 + len * i / 8);
      ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = '#4fc04a'; ctx.lineWidth = 3.5; ctx.stroke();
      inkAt(-14, 12 + len * 0.7, -0.5, P2('M0,0 Q-14,-10 -24,0 Q-14,8 0,0 Z'), '#5ad05a', 1.4);
      ctx.save(); ctx.scale(1 + k * 0.12, 1 - k * 0.2);
      const pc = ['#ff8fc8', '#ffd23f', '#c6a2ff'][Math.floor(p.ph) % 3];
      puffCluster([[-36, 8, 13], [-19, 2, 14], [0, 0, 15], [19, 2, 14], [36, 8, 13], [-26, 14, 11], [26, 14, 11], [0, 16, 13]], (px, py, r) => mix(pc, '#ffffff', (py - 0) / 40), 2, OL);
      inkEllipse(0, 6, 22, 8, 0, '#ffb020', 1.5); ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-6, 4, 8, 3);
      ctx.restore();
      break;
    }
    case 'bubble': { // pops after one bounce
      squash(0.2, 0.3, 12);
      const wob = Math.sin(S.t * 3 + p.ph) * 0.05;
      ctx.scale(1 + wob, 1 - wob);
      ctx.beginPath(); ctx.ellipse(0, 12, w / 2, 19, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(205,238,255,.42)'; ctx.fill(); ctx.strokeStyle = 'rgba(90,120,200,.85)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,140,210,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 12, w / 2 - 6, 13, 0, 0.3, 1.5); ctx.stroke();
      ctx.strokeStyle = 'rgba(140,255,220,.6)'; ctx.beginPath(); ctx.ellipse(0, 12, w / 2 - 6, 13, 0, 3.4, 4.2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ellipse(-w / 4, 4, 12, 4, -0.2); circle(w / 4, 20, 3);
      break;
    }
    case 'pillow': { // a puffy pillow on a castle balcony
      inkRect(-w / 2 - 8, 24, w + 16, 11, '#efe2d0', 2, 4);
      for (let i = 0; i < 6; i++) { const ax = -w / 2 - 4 + i * ((w + 8) / 6); ink(P2(`M${ax},35 L${ax + (w + 8) / 6},35 L${ax + (w + 8) / 12},46 Z`), i % 2 ? '#8a7af0' : '#ffffff', 1.1); }
      squash(0.2, 0.42, 24);
      ink(P2(`M${-w / 2 + 8},2 Q0,-8 ${w / 2 - 8},2 Q${w / 2 + 6},13 ${w / 2 - 8},24 Q0,30 ${-w / 2 + 8},24 Q${-w / 2 - 6},13 ${-w / 2 + 8},2 Z`), vgradL(-6, 28, '#ffd0ea', '#f59ad0'), 2);
      ctx.strokeStyle = 'rgba(200,90,160,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-w / 2 + 18, 13); ctx.quadraticCurveTo(-12, 9, 0, 13); ctx.quadraticCurveTo(12, 17, w / 2 - 18, 13); ctx.stroke();
      inkCircle(0, 13, 4, '#ffe14a', 0.8);
      for (const [tx, ty] of [[-w / 2 + 6, 2], [w / 2 - 6, 2], [-w / 2 + 6, 24], [w / 2 - 6, 24]]) inkCircle(tx, ty, 4.5, '#ffd23f', 0.8);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(-w / 4, 5, 14, 3);
      break;
    }
    case 'net': { // a trampoline net strung between two little towers
      const sag = 10 + k * 30;
      for (const s of [-1, 1]) {
        const tx = s * (w / 2 + 4);
        inkRect(tx - 13, -6, 26, 96, '#f4e6ff', 2, 3);
        ctx.fillStyle = 'rgba(150,120,190,.35)'; for (let r = 0; r < 4; r++) ctx.fillRect(tx - 11, 10 + r * 20, 22, 2);
        ink(P2(`M${tx - 18},-4 L${tx},-44 L${tx + 18},-4 Z`), s < 0 ? '#ff6f9a' : '#6a8af0', 2);
        ctx.strokeStyle = OL; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(tx, -44); ctx.lineTo(tx, -60); ctx.stroke();
        ink(P2(`M${tx},-60 L${tx + s * (16 + Math.sin(S.t * 5 + s) * 3)},-55 L${tx},-50 Z`), '#ffd23f', 1.2);
      }
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(0, sag * 2, w / 2, 0);
      ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(0, sag * 2 + 14, w / 2, 0);
      for (let i = -5; i <= 5; i++) { const nx = i * w / 12, ny = sag * (1 - (i / 6) ** 2); ctx.moveTo(nx - w / 24, ny - 2); ctx.lineTo(nx + w / 24, ny + 12); ctx.moveTo(nx + w / 24, ny - 2); ctx.lineTo(nx - w / 24, ny + 12); }
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = '#fff6e8'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(0, sag * 2, w / 2, 0); ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = '#ff9ac8'; ctx.lineWidth = 3.5; ctx.stroke();
      break;
    }
    case 'cannon': { // a pastel cannon pointing straight up
      const loaded = p.loaded > 0, shake = loaded ? Math.sin(S.t * 60) * 2 : 0;
      ctx.translate(shake, k * 10);
      for (const s of [-1, 1]) { inkCircle(s * 30, 60, 15, '#ff8fc8', 2); ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.beginPath(); for (let a = 0; a < 3; a++) { ctx.moveTo(s * 30 + Math.cos(a) * 13, 60 + Math.sin(a) * 13); ctx.lineTo(s * 30 - Math.cos(a) * 13, 60 - Math.sin(a) * 13); } ctx.stroke(); inkCircle(s * 30, 60, 4, '#ffd23f', 0.8); }
      ink(P2('M-27,2 L-34,62 Q0,76 34,62 L27,2 Z'), vgradL(0, 70, '#9ad8ff', '#5aa8e8'), 2);
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-20, 10, 6, 46);
      vecStar(2, 36, 11, '#fff6a8', 1.2);
      inkEllipse(0, 2, 32, 9, 0, '#ffd23f', 2); inkEllipse(0, 2, 22, 5.5, 0, '#3a2a5a', 1);
      if (loaded) { star(36, 30 + Math.sin(S.t * 30) * 3, 7, '#fff6a8', 4); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30, 44); ctx.quadraticCurveTo(40, 40, 36, 30); ctx.stroke(); }
      break;
    }
    case 'jelly': { // a wobbly jelly block with a happy face
      const wb = Math.sin(p.wob * 22) * 0.18 * p.wob, col = ['#9af07a', '#ff9ac8', '#ffb35a'][Math.floor(p.ph) % 3];
      ctx.translate(0, 32); ctx.scale(1 + wb + k * 0.15, 1 - wb - k * 0.28); ctx.translate(0, -32);
      const jp = new Path2D(); jp.roundRect(-w / 2, 0, w, 32, 11);
      ctx.globalAlpha *= 0.92; ink(jp, vgradL(0, 32, mix(col, '#ffffff', 0.35), col), 2); ctx.globalAlpha /= 0.92;
      ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 8, 4, w - 34, 6, 3); ctx.fill(); circle(w / 2 - 14, 7, 3);
      krFace(0, 18, 0.7, 'happy');
      break;
    }
    case 'boost': { // a rainbow booster pad with chevrons racing up it
      ink(P2(`M${-w / 2},4 Q${-w / 2},-2 ${-w / 2 + 8},-2 L${w / 2 - 8},-2 Q${w / 2},-2 ${w / 2},4 L${w / 2 - 10},24 L${-w / 2 + 10},24 Z`), '#ffffff', 2);
      ctx.save(); ctx.clip(P2(`M${-w / 2},4 Q${-w / 2},-2 ${-w / 2 + 8},-2 L${w / 2 - 8},-2 Q${w / 2},-2 ${w / 2},4 L${w / 2 - 10},24 L${-w / 2 + 10},24 Z`));
      KR_RAINBOW.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-w / 2 + i * w / 6, -4, w / 6 + 1, 30); });
      ctx.restore();
      for (let i = 0; i < 3; i++) {
        const cy = 18 - ((S.t * 40 + i * 12) % 36);
        ctx.globalAlpha = clamp(1 - Math.abs(cy - 4) / 18, 0, 1);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-14, cy + 8); ctx.lineTo(0, cy - 4); ctx.lineTo(14, cy + 8); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      break;
    }
    case 'cloud': { // a drifting cloud
      squash(0.12, 0.25, 12);
      puffCluster([[-46, 12, 18], [-22, 4, 24], [10, 0, 26], [42, 10, 19], [0, 18, 20], [-30, 20, 14], [28, 20, 15]], (px, py) => mix('#ffffff', '#e2d8ff', clamp((py - 4) / 18, 0, 1)), 2, 'rgba(110,90,170,.85)');
      krFace(0, 12, 0.6, 'sleepy');
      ctx.fillStyle = 'rgba(255,150,190,.4)'; circle(-14, 18, 4); circle(14, 18, 4);
      break;
    }
    case 'star': { // a star that spins when you bounce on it
      krGlow(0, 14, 60, '255,236,140', 0.35);
      ctx.translate(0, 14); ctx.rotate(p.rot); ctx.scale(1 + k * 0.15, 1 - k * 0.15);
      vecStar(0, 0, 36, '#ffe14a', 2); vecStar(0, 0, 20, '#fff6b8', 0);
      ctx.rotate(-p.rot); krFace(0, 2, 0.55, 'happy');
      break;
    }
    case 'spring': { // a shooting star
      ctx.strokeStyle = 'rgba(255,240,170,.75)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-26, 8); ctx.lineTo(-70, 20); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,190,230,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-62, 4); ctx.stroke();
      ctx.scale(1 + k * 0.2, 1 - k * 0.25);
      vecStar(0, 4, 28, '#ffe14a', 2);
      break;
    }
    case 'crumble': { // a pale crystal slab with cracks
      ink(P2(`M${-w / 2},0 L${w / 2},0 L${w / 2 - 14},18 L${-w / 2 + 14},18 Z`), vgradL(0, 18, '#e6faff', '#a8dcff'), 2);
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(-w / 2 + 10, 3, w - 30, 3);
      ctx.strokeStyle = 'rgba(80,120,170,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-6, 9); ctx.lineTo(-12, 18); ctx.moveTo(20, 0); ctx.lineTo(26, 10); ctx.stroke();
      star(-w / 2 + 18, 10, 4 + Math.sin(S.t * 5 + p.ph) * 2, '#fff', 4);
      break;
    }
    case 'arena': { // the wide clouds under Grumbles
      puffCluster([[-w / 2 + 18, 12, 18], [-w / 4, 4, 24], [0, 0, 26], [w / 4, 4, 24], [w / 2 - 18, 12, 18], [-w / 6, 18, 18], [w / 6, 18, 18]], (px, py) => mix('#fff4ff', '#d8c8ff', clamp((py - 2) / 18, 0, 1)), 2, 'rgba(110,90,170,.9)');
      for (let i = 0; i < 5; i++) star(-w / 2 + 22 + i * (w - 44) / 4, 26, 5 + Math.sin(S.t * 4 + i) * 1.5, '#ffe14a', 5);
      break;
    }
    default: { // plain and moving platforms, dressed for each part of the kingdom
      if (z === 0) { // a big leaf with a dew drop
        squash(0.08, 0.25);
        ink(P2(`M${-w / 2},4 Q-10,${-16} ${w / 2},4 Q10,${24} ${-w / 2},4 Z`), vgradL(-8, 18, '#86e676', '#3fae4a'), 2);
        ctx.strokeStyle = '#2f8a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-w / 2 + 8, 4); ctx.lineTo(w / 2 - 8, 4);
        for (let i = -2; i <= 2; i++) { ctx.moveTo(i * 18, 4); ctx.lineTo(i * 18 + 10, i % 2 ? -4 : 12); } ctx.stroke();
        flower(w / 2 - 22, -3, 6, '#ffffff', '#ffd84a', 1);
        ctx.fillStyle = 'rgba(220,250,255,.95)'; circle(-w / 4, 0, 4); ctx.fillStyle = '#fff'; circle(-w / 4 - 1, -1, 1.5);
      } else if (z === 1) { // a stone balcony with a striped awning and flower pots
        inkRect(-w / 2, 0, w, 14, '#efe2d0', 2, 4);
        ctx.fillStyle = 'rgba(160,130,110,.35)'; for (let i = 1; i < 5; i++) ctx.fillRect(-w / 2 + i * w / 5, 2, 2, 10);
        for (let i = 0; i < 6; i++) { const ax = -w / 2 + 8 + i * ((w - 16) / 6); ink(P2(`M${ax},14 L${ax + (w - 16) / 6},14 L${ax + (w - 16) / 12},28 Z`), i % 2 ? '#ff7fb5' : '#ffffff', 1.2); }
        if (p.kind === 'move') { ctx.fillStyle = '#4fa8e0'; tri(-w / 2 - 16, 7, -w / 2 - 5, -1, -w / 2 - 5, 15); tri(w / 2 + 16, 7, w / 2 + 5, -1, w / 2 + 5, 15); }
      } else if (z === 2) { // a rainbow bar
        ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, 0, w, 22, 9); ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke(); ctx.clip();
        KR_RAINBOW.slice(0, 5).forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(-w / 2, i * 4.4, w, 4.6); });
        const sh = ((S.t * 0.8 + p.ph) % 2) * w - w / 2; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(sh - 10, 0, 12, 22);
        ctx.restore();
      } else { // a glowing moon slab
        krGlow(0, 8, 70, '255,240,180', 0.25);
        ink(P2(`M${-w / 2},2 Q0,${-10} ${w / 2},2 Q${w / 2 - 6},18 0,18 Q${-w / 2 + 6},18 ${-w / 2},2 Z`), vgradL(-6, 18, '#fffbe0', '#f4dc8a'), 2);
        ctx.fillStyle = 'rgba(220,190,110,.6)'; circle(-20, 8, 5); circle(16, 6, 4); circle(36, 10, 3);
      }
    }
  }
  ctx.restore();
}

// --- the mischief-makers ------------------------------------------------------------
function krFoe(b, x, y, face) {
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (b.bump > 0) ctx.rotate(Math.sin(b.bump * 30) * 0.15);
  const t = S.t + b.ph;
  if (b.kind === 'cloud') { // a grumpy little rain cloud
    ctx.strokeStyle = 'rgba(90,150,230,.8)'; ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) { const dy = (t * 90 + i * 17) % 40; ctx.globalAlpha = 1 - dy / 40; ctx.beginPath(); ctx.moveTo(-18 + i * 12, 20 + dy); ctx.lineTo(-20 + i * 12, 27 + dy); ctx.stroke(); }
    ctx.globalAlpha = 1;
    puffCluster([[-22, 4, 17], [0, -6, 23], [22, 4, 17], [0, 10, 17]], (px, py) => mix('#b6c0dc', '#8a96bc', clamp((py + 6) / 20, 0, 1)), 2, OL);
    krFace(face * 2, 2, 0.8, 'grump');
  } else if (b.kind === 'imp') { // a cheeky green imp with little bat wings
    const f = Math.sin(t * 14) * 0.5;
    for (const s of [-1, 1]) inkAt(s * 16, -4, s * (0.3 + f), P2(`M0,0 Q${s * 14},-18 ${s * 26},-8 Q${s * 18},-2 ${s * 20},6 Q${s * 10},2 0,6 Z`), '#c6a2ff', 1.4);
    ink(P2('M-16,-8 L-24,-30 L-6,-16 Z M16,-8 L24,-30 L6,-16 Z'), '#8fd86a', 1.6);
    inkCircle(0, 0, 19, '#8fd86a', 2);
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-face * 14, 14); ctx.quadraticCurveTo(-face * 30, 22, -face * 26, 30); ctx.stroke();
    ctx.fillStyle = 'rgba(255,140,170,.5)'; circle(-11, 6, 4); circle(11, 6, 4);
    krFace(face * 2, 0, 0.75, 'cheeky');
  } else if (b.kind === 'gremlin') { // a fuzzy purple gremlin who wants sparkles
    for (const s of [-1, 1]) inkAt(s * 18, -10, s * 0.5, P2(`M0,0 L${s * 22},-12 L${s * 8},8 Z`), '#c79cf0', 1.6);
    const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; pts.push([Math.cos(a) * 15, Math.sin(a) * 15, 8]); } pts.push([0, 0, 17]);
    puffCluster(pts, '#b48ae8', 2, OL);
    if (b.loot) { inkCircle(face * 22, 12, 9, '#f2d6a0', 1.4); star(face * 22, 4, 6, '#fff6a8', 4); }
    krFace(face * 2, 0, 0.8, 'cheeky');
  } else { // a sleepy little bat
    const f = Math.sin(t * 16);
    for (const s of [-1, 1]) inkAt(s * 10, -2, s * f * 0.35, P2(`M0,0 Q${s * 18},-20 ${s * 34},-8 Q${s * 30},0 ${s * 26},4 Q${s * 22},0 ${s * 18},6 Q${s * 13},2 ${s * 8},8 Z`), '#7a5ab8', 1.6);
    ink(P2('M-10,-10 L-12,-24 L-3,-14 Z M10,-10 L12,-24 L3,-14 Z'), '#6a4aa8', 1.4);
    inkCircle(0, 0, 14, '#8a68c8', 2);
    ctx.fillStyle = '#ffe14a'; circle(-5, -2, 3.5); circle(5, -2, 3.5); ctx.fillStyle = OL; circle(-5 + face, -2, 1.6); circle(5 + face, -2, 1.6);
    ctx.fillStyle = '#fff'; tri(-4, 6, -1, 6, -2.5, 10); tri(1, 6, 4, 6, 2.5, 10);
  }
  ctx.restore();
}

// --- the backdrops: four layered, gently animated skies ----------------------------
function krBgGarden(cam, t) {
  ctx.fillStyle = vgrad(0, H, KR_ZONES[0].sky[0], KR_ZONES[0].sky[1]); ctx.fillRect(0, 0, W, H);
  // the sun and its slowly turning rays
  const sY = 110 + cam * 0.03;
  ctx.save(); ctx.translate(150, sY); ctx.rotate(t * 0.12); ctx.fillStyle = 'rgba(255,240,150,.32)';
  for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); tri(-12, -56, 12, -56, 0, -120); }
  ctx.restore(); krGlow(150, sY, 110, '255,240,160', 0.5); inkCircle(150, sY, 42, '#ffe46a', 2);
  // far fluffy clouds
  for (let i = 0; i < 5; i++) {
    const y = krRep(i, 170, 5, cam, 0.1), x = ((i * 233 + t * (8 + i * 2)) % (W + 240)) - 120;
    puffCluster([[x - 40, y + 6, 22], [x, y - 8, 32], [x + 42, y + 4, 24]], '#ffffff', 1.2, 'rgba(160,200,235,.8)');
  }
  // rolling hills far below (they sink away as she climbs)
  const hy = 380 + cam * 0.12;
  if (hy < H + 60) {
    ctx.fillStyle = '#a8e48e'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, hy + Math.sin(x / 130) * 26); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#86d06e'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, hy + 40 + Math.sin(x / 90 + 2) * 22); ctx.lineTo(W, H); ctx.fill();
    for (let i = 0; i < 9; i++) { const tx = 50 + i * 110, ty = hy + 34 + Math.sin(tx / 90 + 2) * 22; ctx.fillStyle = '#5fae58'; circle(tx, ty - 10, 14); ctx.fillStyle = '#8a6a4a'; ctx.fillRect(tx - 2, ty - 2, 4, 10); }
  }
  // giant flowers and toadstools along the sides
  for (let i = 0; i < 5; i++) {
    const y = krRep(i, 210, 5, cam, 0.32), side = i % 2 ? 1 : -1, x = side < 0 ? 56 + (i * 37) % 50 : W - 120 - (i * 53) % 50;
    if (y < -260 || y > H + 60) continue;
    ctx.globalAlpha = 0.5; // faded, so they read as far away and never look like something to bounce on
    ctx.strokeStyle = OL; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(x, y + 280); ctx.quadraticCurveTo(x + side * 26, y + 120, x, y); ctx.stroke();
    ctx.strokeStyle = '#4fae46'; ctx.lineWidth = 7; ctx.stroke();
    inkAt(x + side * 10, y + 110, side * 0.6, P2(`M0,0 Q${side * 30},-24 ${side * 56},-4 Q${side * 28},12 0,0 Z`), '#6fcc5a', 1.6);
    const sw = Math.sin(t * 1.5 + i) * 0.06;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
    flower(0, 0, 36, ['#ff9ac8', '#ffd84a', '#c6a2ff', '#ff8a6a', '#8ad4ff'][i % 5], '#ff9a3a', 2);
    ctx.restore();
    if (i % 2 === 0) { inkRect(x + side * 30 - 6, y + 200, 12, 30, '#fff4e0', 1.4, 4); ink(P2(`M${x + side * 30 - 22},${y + 204} Q${x + side * 30},${y + 170} ${x + side * 30 + 22},${y + 204} Z`), '#ff6a78', 1.6); ctx.fillStyle = '#fff'; circle(x + side * 30 - 6, y + 192, 3); circle(x + side * 30 + 8, y + 196, 2.5); }
    ctx.globalAlpha = 1;
  }
  // vines curling in from the edges
  for (let i = 0; i < 3; i++) {
    const y = krRep(i, 300, 3, cam, 0.62), side = i % 2 ? 1 : -1, x = side < 0 ? 0 : W;
    ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y - 40);
    for (let k = 0; k <= 6; k++) ctx.lineTo(x - side * (18 + Math.sin(k + t * 1.2 + i) * 12), y - 40 + k * 40);
    ctx.stroke();
    for (let k = 1; k < 6; k++) inkAt(x - side * (18 + Math.sin(k + t * 1.2 + i) * 12), y - 40 + k * 40, side * (0.8 + Math.sin(t * 2 + k) * 0.15), P2('M0,0 Q10,-10 22,0 Q10,8 0,0 Z'), '#5ac85a', 1.2);
  }
  // butterflies and floating pollen
  for (let i = 0; i < 6; i++) {
    const x = ((i * 173 + t * (26 + i * 6)) % (W + 80)) - 40, y = ((i * 97 + cam * 0.4) % (H + 100)) - 50 + Math.sin(t * 2 + i) * 22;
    krButterfly(x, y, 0.9, ['#ff9ac8', '#ffd23f', '#8ad4ff', '#c6a2ff'][i % 4], t + i, Math.sin(t * 2 + i) * 0.3);
  }
  for (let i = 0; i < 18; i++) { const x = (i * 97 + Math.sin(t * 0.7 + i) * 30 + 960) % W, y = ((i * 61 - t * 12 + cam * 0.5) % H + H) % H; ctx.fillStyle = 'rgba(255,250,200,.7)'; circle(x, y, 2); }
}
function krBgCastle(cam, t) {
  ctx.fillStyle = vgrad(0, H, KR_ZONES[1].sky[0], KR_ZONES[1].sky[1]); ctx.fillRect(0, 0, W, H);
  krGlow(760, 150, 180, '255,230,170', 0.6); ctx.fillStyle = 'rgba(255,240,200,.85)'; circle(760, 150, 48);
  // a far-off castle skyline with twinkling windows
  for (let i = 0; i < 2; i++) {
    const y = krRep(i, 420, 2, cam, 0.08) + 300;
    ctx.fillStyle = 'rgba(214,160,214,.55)';
    ctx.fillRect(0, y - 40, W, 90);
    for (let k = 0; k < 9; k++) { const x = k * 115 + (i * 57) % 115, h = 60 + ((k * 37 + i * 13) % 5) * 22; ctx.fillRect(x, y - h, 46, h - 40); tri(x - 8, y - h, x + 54, y - h, x + 23, y - h - 46); for (let c = 0; c < 3; c++) ctx.fillRect(x - 6 + c * 22, y - 52, 14, 12); }
    for (let c = 0; c < W / 30; c++) ctx.fillRect(c * 30, y - 50, 16, 10);
    for (let k = 0; k < 9; k++) { const x = k * 115 + (i * 57) % 115 + 18, h = 60 + ((k * 37 + i * 13) % 5) * 22; ctx.fillStyle = `rgba(255,236,150,${0.5 + 0.5 * Math.sin(t * 2 + k * 1.7 + i)})`; ctx.fillRect(x, y - h + 18, 10, 14); }
  }
  // towers with waving flags and lit windows
  for (let i = 0; i < 4; i++) {
    const y = krRep(i, 240, 4, cam, 0.32), side = i % 2 ? 1 : -1, x = side < 0 ? 70 + (i * 37) % 40 : W - 140 - (i * 53) % 40;
    if (y < -200 || y > H + 140) continue;
    ctx.globalAlpha = 0.8;
    inkRect(x - 36, y - 20, 72, 320, '#f4e6ff', 2.5, 4);
    ctx.fillStyle = 'rgba(160,120,200,.25)'; for (let r = 0; r < 8; r++) for (let c = 0; c < 3; c++) ctx.fillRect(x - 32 + c * 24 + (r % 2) * 12, y + r * 26, 18, 2);
    for (let c = 0; c < 4; c++) inkRect(x - 40 + c * 22, y - 34, 14, 16, '#f4e6ff', 2, 2);
    ink(P2(`M${x - 46},${y - 30} L${x},${y - 116} L${x + 46},${y - 30} Z`), ['#6a8af0', '#ff6f9a', '#9a6ae0', '#4fc0a8'][i % 4], 2.5);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; tri(x - 30, y - 34, x - 4, y - 104, x - 14, y - 34);
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 116); ctx.lineTo(x, y - 150); ctx.stroke();
    const fp = new Path2D(); fp.moveTo(x, y - 150);
    for (let k = 1; k <= 6; k++) fp.lineTo(x + k * 6, y - 150 + Math.sin(t * 6 - k * 0.8 + i) * 3 * (k / 6));
    for (let k = 6; k >= 0; k--) fp.lineTo(x + k * 6, y - 134 + Math.sin(t * 6 - k * 0.8 + i) * 3 * (k / 6));
    fp.closePath(); ink(fp, ['#ffd23f', '#ff9ac8', '#7fd8ff'][i % 3], 1.2);
    for (const [wx, wy] of [[0, 40], [-14, 120], [14, 120], [0, 200]]) {
      const on = 0.7 + 0.3 * Math.sin(t * 3 + wx + wy + i * 2);
      krGlow(x + wx, y + wy + 14, 26, '255,220,120', 0.35 * on);
      ink(P2(`M${x + wx - 9},${y + wy + 30} L${x + wx - 9},${y + wy + 8} Q${x + wx},${y + wy - 4} ${x + wx + 9},${y + wy + 8} L${x + wx + 9},${y + wy + 30} Z`), mix('#ffb84a', '#fff0a0', on), 1.4);
    }
    ctx.globalAlpha = 1;
  }
  // bunting strung across the town
  for (let i = 0; i < 3; i++) {
    const y = krRep(i, 270, 3, cam, 0.55);
    ctx.strokeStyle = 'rgba(91,63,115,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y); ctx.quadraticCurveTo(W / 2, y + 54, W, y); ctx.stroke();
    for (let k = 1; k < 16; k++) {
      const fx = k * W / 16, fy = y + Math.sin(k / 16 * Math.PI) * 27 + 1, sw = Math.sin(t * 3 + k + i) * 3;
      ink(P2(`M${fx - 9},${fy} L${fx + 9},${fy} L${fx + sw},${fy + 19} Z`), ['#ff7fb5', '#ffd23f', '#7fd8ff', '#a6f0b8'][(k + i) % 4], 1);
    }
  }
  // balloons drifting up
  for (let i = 0; i < 5; i++) {
    const x = 120 + i * 180 + Math.sin(t * 0.8 + i) * 20, y = H + 60 - ((t * 26 + i * 137 + cam * 0.2) % (H + 180));
    ctx.strokeStyle = 'rgba(91,63,115,.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y + 22); ctx.quadraticCurveTo(x + 6, y + 40, x, y + 56); ctx.stroke();
    inkEllipse(x, y, 15, 19, 0, ['#ff8fc8', '#7fd8ff', '#ffd23f', '#a6f0b8', '#c6a2ff'][i], 1.4);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ellipse(x - 5, y - 7, 4, 6, -0.4);
  }
}
function krBgRainbow(cam, t) {
  ctx.fillStyle = vgrad(0, H, KR_ZONES[2].sky[0], KR_ZONES[2].sky[1]); ctx.fillRect(0, 0, W, H);
  // big shimmering rainbow arcs
  for (let i = 0; i < 2; i++) {
    const y = krRep(i, 440, 2, cam, 0.12) + 340, cx = i % 2 ? 640 : 300;
    KR_RAINBOW.forEach((c, k) => {
      ctx.globalAlpha = 0.42 + 0.14 * Math.sin(t * 2 + k * 0.7 + i);
      ctx.strokeStyle = c; ctx.lineWidth = 13; ctx.beginPath(); ctx.arc(cx, y, 300 - k * 13, Math.PI, 0); ctx.stroke();
    });
    const a0 = Math.PI + ((t * 0.25 + i * 0.5) % 1) * Math.PI;
    ctx.globalAlpha = 0.55; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 70; ctx.beginPath(); ctx.arc(cx, y, 268, a0, Math.min(Math.PI * 2, a0 + 0.12)); ctx.stroke();
    ctx.globalAlpha = 1;
    puffCluster([[cx - 300, y, 30], [cx - 330, y + 10, 22], [cx - 270, y + 12, 24]], '#ffffff', 1.2, 'rgba(180,150,230,.7)');
    puffCluster([[cx + 300, y, 30], [cx + 330, y + 10, 22], [cx + 270, y + 12, 24]], '#ffffff', 1.2, 'rgba(180,150,230,.7)');
  }
  // floating crystal islands
  for (let i = 0; i < 4; i++) {
    const y = krRep(i, 220, 4, cam, 0.35), side = i % 2 ? 1 : -1, x = side < 0 ? 80 + (i * 29) % 40 : W - 150 - (i * 41) % 40, bob = Math.sin(t * 1.4 + i) * 6;
    if (y < -120 || y > H + 120) continue;
    ink(P2(`M${x - 56},${y + bob} Q${x},${y - 8 + bob} ${x + 56},${y + bob} L${x + 14},${y + 74 + bob} Z`), vgradL(y, y + 74, '#b89ae0', '#8466c0'), 2);
    ctx.fillStyle = '#9ae07a'; ctx.beginPath(); ctx.ellipse(x, y + bob, 56, 7, 0, Math.PI, 0); ctx.fill();
    for (const [dx, h, c] of [[-26, 50, '#8ae0ff'], [0, 76, '#d8b0ff'], [26, 42, '#ffb0e0']]) {
      krGlow(x + dx, y - h / 2 + bob, 30, '255,255,255', 0.25 + 0.15 * Math.sin(t * 3 + dx));
      ink(P2(`M${x + dx - 11},${y + bob} L${x + dx},${y - h + bob} L${x + dx + 11},${y + bob} Z`), c, 1.5);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; tri(x + dx - 6, y + bob - 2, x + dx, y - h + 8 + bob, x + dx - 1, y + bob - 2);
    }
    for (let k = 0; k < 4; k++) { const d = (t * 50 + k * 18) % 70; ctx.fillStyle = `rgba(190,230,255,${1 - d / 70})`; circle(x + 10 + k * 3, y + 74 + bob + d, 2.5); }
  }
  // pastel puffs and sparkles
  for (let i = 0; i < 4; i++) { const y = krRep(i, 200, 4, cam, 0.52), x = ((i * 271 + t * 14) % (W + 260)) - 130; puffCluster([[x - 30, y + 4, 18], [x, y - 6, 26], [x + 32, y + 4, 19]], '#ffe0f2', 1.2, 'rgba(220,150,200,.7)'); }
  for (let i = 0; i < 24; i++) { const x = (i * 139) % W, y = ((i * 83 + cam * 0.45) % H); star(x, y, 2 + 2.5 * Math.abs(Math.sin(t * 2.5 + i)), 'rgba(255,255,255,.85)', 4); }
}
const KR_CONST = [ // little constellations: a heart, a crown, a unicorn's horn and a dipper
  { pts: [[0, 10], [-18, -6], [-10, -20], [0, -12], [10, -20], [18, -6]], loop: true },
  { pts: [[-30, 10], [-30, -14], [-15, 0], [0, -22], [15, 0], [30, -14], [30, 10]], loop: true },
  { pts: [[-30, 20], [-10, 6], [6, -6], [26, -30]], loop: false },
  { pts: [[-40, 0], [-20, 6], [0, 2], [16, 8], [20, 26], [44, 30], [40, 10], [16, 8]], loop: false },
];
function krBgSky(cam, t) {
  ctx.fillStyle = vgrad(0, H, KR_ZONES[3].sky[0], KR_ZONES[3].sky[1]); ctx.fillRect(0, 0, W, H);
  // soft aurora ribbons
  for (let r = 0; r < 3; r++) {
    ctx.globalAlpha = 0.16; ctx.fillStyle = ['#7affc8', '#ff9ae0', '#9ab8ff'][r];
    ctx.beginPath(); const by = 90 + r * 70 + ((cam * 0.04) % 80);
    ctx.moveTo(0, by); for (let x = 0; x <= W; x += 30) ctx.lineTo(x, by + Math.sin(x / 120 + t * 0.6 + r) * 26);
    for (let x = W; x >= 0; x -= 30) ctx.lineTo(x, by + 46 + Math.sin(x / 100 + t * 0.5 + r * 2) * 20);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // a field of twinkling stars
  for (let i = 0; i < 90; i++) { const x = (i * 137) % W, y = ((i * 71 + cam * 0.05) % H); star(x, y, 1.2 + (i % 3) + Math.abs(Math.sin(t * 1.8 + i)) * 1.4, `rgba(255,255,240,${0.35 + 0.65 * Math.abs(Math.sin(t + i))})`); }
  // the moon and a ringed planet
  const my = 120 + (cam - KR_ZONES[2].to) * 0.05;
  krGlow(690, my, 120, '255,248,210', 0.4);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(674, my - 10, 38, 0, Math.PI * 2, true); ctx.clip(); inkCircle(690, my, 42, '#fff6d0', 2); ctx.fillStyle = 'rgba(230,210,150,.5)'; circle(706, my + 12, 6); circle(712, my - 14, 4); ctx.restore();
  for (let i = 0; i < 2; i++) {
    const y = krRep(i, 520, 2, cam, 0.22), x = i ? 860 : 110;
    inkCircle(x, y, 26, i ? '#ffb0d8' : '#8ad4ff', 1.5); ctx.strokeStyle = 'rgba(255,240,190,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, y, 44, 10, -0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = i ? '#ffb0d8' : '#8ad4ff'; ctx.beginPath(); ctx.arc(x, y, 26, Math.PI + 0.3, Math.PI * 2 - 0.3 + Math.PI, true); ctx.fill();
  }
  // twinkling constellations
  for (let i = 0; i < 4; i++) {
    const c = KR_CONST[i], y = krRep(i, 170, 4, cam, 0.16), x = [230, 700, 380, 600][i];
    ctx.strokeStyle = 'rgba(190,200,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
    c.pts.forEach(([px, py], k) => k ? ctx.lineTo(x + px * 1.6, y + py * 1.6) : ctx.moveTo(x + px * 1.6, y + py * 1.6)); if (c.loop) ctx.closePath(); ctx.stroke();
    c.pts.forEach(([px, py], k) => { const tw = Math.abs(Math.sin(t * 2 + k + i)); krGlow(x + px * 1.6, y + py * 1.6, 10, '255,250,210', 0.4 * tw); star(x + px * 1.6, y + py * 1.6, 3 + 2.5 * tw, '#fff6c8', 4); });
  }
  // shooting stars every couple of seconds
  for (let s = 0; s < 2; s++) {
    const per = 2.6 + s * 1.3, n = Math.floor((t + s) / per), ph = ((t + s) % per) / per;
    if (ph > 0.3) continue;
    const sx = 200 + ((n * 397 + s * 211) % 600), sy0 = 40 + ((n * 131) % 200), q = ph / 0.3, hx = sx - q * 260, hy = sy0 + q * 130;
    const gr = ctx.createLinearGradient(hx, hy, hx + 90, hy - 45); gr.addColorStop(0, `rgba(255,250,220,${1 - q})`); gr.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.strokeStyle = gr; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 90, hy - 45); ctx.stroke();
    ctx.globalAlpha = 1 - q; star(hx, hy, 7, '#ffffff', 4); ctx.globalAlpha = 1;
  }
}
const KR_BG = [krBgGarden, krBgCastle, krBgRainbow, krBgSky];

function krCharm(g, b, how) {
  if (b.charmed) return;
  b.charmed = true; g.charmed++;
  const x = b.x, y = KR_SY - (b.wy - g.cam);
  g.poofs.push({ x: b.x, wy: b.wy, t: 0, into: KR_INTO[b.kind], col: pick(['#ff9ac8', '#ffd23f', '#8ad4ff', '#c6a2ff', '#a6f0b8']), ph: rand(0, 6) });
  burst(x, y, 16, { colors: ['#ffffff', '#fff6a8', '#ffb3e0', '#b8e6ff'], spread: 140, up: 40 });
  floatText(x, y - 30, pick(['Poof!', 'Poof!', 'Zing!', 'Sparkle!']), '#fff6a8', false, 26);
  SFX.pop(); tone(880, 0.18, 'sine', 0.06, 0.05, 1760);
  if (b.loot) { g.gems += b.loot; floatText(x, y - 60, `+${b.loot}✨ back!`, '#fff6a8', false, 20); b.loot = 0; }
  if (!g.toldPoof) { g.toldPoof = true; speak({ cloud: 'Poof! The rain cloud turned into a flower!', imp: 'Poof! The imp turned into a butterfly!', gremlin: 'Poof! The gremlin turned into a butterfly!', bat: 'Poof! The bat turned into a star!' }[b.kind]); }
  if (how === 'bonk') floatText(x, y - 4, 'Bonk!', '#ff9ac8', false, 22);
}
function krBossHit(g, how) {
  const B = g.boss; if (!B.on || B.done || B.hurt > 0) return;
  B.hits++; B.hurt = 0.75;
  const x = B.x, y = KR_SY - (KR_BOSS_Y - g.cam);
  burst(x, y + 30, 14, { colors: ['#ffffff', '#fff6a8', '#b8e6ff'] }); floatText(x, y - 70, how === 'boop' ? 'Boop!' : 'Zap!', '#fff6a8', false, 30);
  tone(300, 0.25, 'triangle', 0.08, 0, 600);
  if (B.hits >= KR_BOSS_HP) {
    B.done = true; B.rainbow = 0.01; g.charmed++;
    burst(x, y, 40, { colors: KR_RAINBOW, spread: 260, up: 60 }); SFX.sparkle(); tone(523, 0.5, 'triangle', 0.08, 0.1, 1046);
    speak('Grumbles turned into a rainbow! Whee, up we go!');
    // the rainbow carries her right up to the glade
    g.ride = true; g.vy = Math.sqrt(2 * KR_G * Math.max(60, KR_TOP + 120 - g.wy)); g.tumble = 0; g.rocket = 0;
  } else if (B.hits === 3) speak('Grumbles is getting less grumpy! Keep going!');
}
function krBossWake(g) {
  g.boss.on = true; g.banner = 3.4; g.card = { name: 'Grumbles the Storm Cloud', icon: '⛈️', tip: 'Zap him or bop him with your head!' };
  tone(150, 0.6, 'sawtooth', 0.05, 0, 90);
  speak('Oh no! Grumbles the grumpy storm cloud is sitting on the glade! Zap him with your wand, or bop him with your head!');
}
function krCast(g) {
  if (g.cool > 0 || g.state !== 'play') return;
  g.cool = 0.32; g.castT = 0.32;
  // aim at the nearest mischief-maker on screen, or at Grumbles, else straight up
  let tgt = null, best = 1e9;
  for (const b of g.foes) {
    if (b.charmed) continue;
    const sy = KR_SY - (b.wy - g.cam); if (sy < -10 || sy > H - 10 || b.wy < g.wy - 140) continue;
    const d = Math.hypot(b.x - g.x, b.wy - g.wy - 50); if (d < best) { best = d; tgt = b; }
  }
  if (!tgt && g.boss.on && !g.boss.done) tgt = g.boss;
  const tx = tgt ? tgt.x : g.x;
  if (tgt && Math.abs(tx - g.x) > 10) g.facing = Math.sign(tx - g.x);
  const ox = g.x + g.facing * 44, oy = g.wy + 63;
  const ty = tgt === g.boss ? KR_BOSS_Y - 30 : tgt ? tgt.wy : oy + 400, a = Math.atan2(ty - oy, tx - ox);
  g.bolts.push({ x: ox, wy: oy, vx: Math.cos(a) * 900, vy: Math.sin(a) * 900, life: 1.2, tgt, tail: [] });
  tone(1300, 0.16, 'sine', 0.06, 0, 2600); tone(1760, 0.1, 'triangle', 0.03, 0.04);
  burst(ox, KR_SY - (oy - g.cam), 6, { colors: ['#fff6a8', '#ffb3e0'], spread: 60, up: 10, size: [2, 4] });
}
function krLand(g, p) {
  g.wy = p.wy; p.sq = 0.25; g.land = 0.12; g.tumble = 0;
  const x = p.x, y = KR_SY - (p.wy - g.cam);
  let m = KR_BOUNCE[p.kind] || 1;
  if (p.kind === 'arena' && g.boss.done) m = 1.75;
  switch (p.kind) {
    case 'cannon': g.cannon = p; p.loaded = 0.5; g.vy = 0; g.x = p.x; tone(200, 0.3, 'triangle', 0.06, 0, 120); g.last = p; return;
    case 'bubble': p.gone = 2.5; SFX.pop(); burst(x, y + 10, 12, { kind: 'bubble', colors: ['#fff'], spread: 90, up: 30, size: [2, 5] }); break;
    case 'crumble': p.gone = 3; tone(1400, 0.12, 'triangle', 0.05, 0, 700); burst(x, y + 8, 10, { colors: ['#c8f0ff', '#ffffff'] }); break;
    case 'mushroom': case 'spring': tone(420, 0.32, 'sine', 0.08, 0, 1260); burst(x, y, 12, { colors: ['#ffb0d8', '#fff6a8'] }); break;
    case 'flower': tone(600, 0.28, 'triangle', 0.06, 0, 1400); burst(x, y, 8, { colors: ['#ff9ac8', '#fff6a8', '#a6f0b8'] }); break;
    case 'pillow': tone(220, 0.2, 'sine', 0.08, 0, 440); burst(x, y + 6, 6, { colors: ['#ffffff', '#ffe0f0'], spread: 80, up: 20, size: [3, 5] }); break;
    case 'net': tone(330, 0.3, 'triangle', 0.07, 0, 990); break;
    case 'jelly': p.wob = 1; tone(260, 0.25, 'sine', 0.08, 0, 520); tone(390, 0.2, 'sine', 0.05, 0.08, 780); break;
    case 'boost': g.boostT = 0.9; tone(500, 0.4, 'sawtooth', 0.04, 0, 2000); burst(x, y, 14, { colors: KR_RAINBOW }); floatText(x, y - 40, 'Zoom!', '#fff', false, 24); break;
    case 'star': p.spin = 1; [988, 1319, 1568].forEach((f, i) => tone(f, 0.15, 'sine', 0.05, i * 0.05)); break;
    default: SFX.jump();
  }
  g.vy = KR_V * m;
  if (m > 1.3) g.stretch = 1;
  if (p.kind !== 'bubble' && p.kind !== 'crumble') g.last = p;
  if (p.kind === 'glade' && g.state === 'play') {
    g.state = 'win'; g.t2 = 3.6; g.ride = false; SFX.fanfare(); speak('We made it! The Starlight Glade!');
    S.shine = Math.min(100, S.shine + Math.round(g.gems / 3) + Math.round(g.charmed / 2));
  }
}

SCENES.kingdom = {
  enter() {
    const plats = [{ x: 480, x0: 480, wy: 0, w: 1300, kind: 'floor', zone: 0, sq: 0 }];
    let x = 480, prev = 'plain';
    for (let wy = 120; wy < KR_TOP - 620; wy += rand(100, 135)) {
      const zone = krZone(wy);
      let kind = krPick(KR_MIX[zone]);
      // never two breakables or two cannons in a row
      if ((kind === 'bubble' || kind === 'crumble') && (prev === 'bubble' || prev === 'crumble')) kind = 'plain';
      if (kind === prev && kind !== 'plain') kind = 'plain';
      const w = KR_WIDTH[kind] || KR_W, edge = kind === 'net' ? 160 : 90;
      x = clamp(x + (Math.random() < 0.5 ? -1 : 1) * rand(120, 260), edge, W - edge);
      plats.push({ x, x0: x, wy, w, kind, zone, ph: rand(0, 6), sq: 0, gem: Math.random() < 0.38 && kind !== 'cannon', gone: 0, wob: 0, spin: 0, rot: 0, loaded: 0 });
      prev = kind;
    }
    // a normal bounce only rises ~224, so always leave a plain step close enough to reach the arena
    let top = plats[plats.length - 1].wy;
    while (KR_ARENA - top > 135) { top += 110; plats.push({ x: clamp(480 + rand(-200, 200), 90, 870), x0: 0, wy: top, w: KR_W, kind: 'plain', zone: 3, ph: 0, sq: 0, gem: false, gone: 0 }); }
    // Grumbles' lair: wide clouds, and the glade above him
    for (const [ax, awy, aw] of [[480, KR_ARENA, 300], [250, KR_ARENA + 70, 170], [710, KR_ARENA + 70, 170]]) plats.push({ x: ax, x0: ax, wy: awy, w: aw, kind: 'arena', zone: 3, ph: 0, sq: 0, gem: false, gone: 0 });
    plats.push({ x: 480, x0: 480, wy: KR_TOP, w: 460, kind: 'glade', zone: 3, sq: 0 });
    // the mischief-makers, roughly every 380 up, in the gaps beside the path
    const foes = [];
    for (let wy = 560; wy < KR_ARENA - 260; wy += rand(330, 430)) {
      const zone = krZone(wy), near = plats.filter(p => Math.abs(p.wy - wy) < 70);
      let fx = rand(130, 830);
      for (let tries = 0; tries < 6 && near.some(p => Math.abs(p.x - fx) < p.w / 2 + 50); tries++) fx = rand(130, 830);
      foes.push({ kind: KR_FOE[zone], x: fx, x0: fx, wy, wy0: wy, ph: rand(0, 6), r: zone === 0 ? 30 : 24, charmed: false, bump: 0, loot: 0 });
    }
    // power-ups float above a few platforms
    const powers = [];
    for (const [pwy, kind] of [[800, 'shield'], [1650, 'rocket'], [2300, 'burst'], [3000, 'shield'], [3300, 'rocket'], [4250, 'burst'], [4720, 'shield']]) {
      const p = plats.filter(q => q.kind !== 'floor' && q.kind !== 'cannon' && q.kind !== 'move' && q.kind !== 'cloud').sort((a, b) => Math.abs(a.wy - pwy) - Math.abs(b.wy - pwy))[0];
      p.gem = false; powers.push({ kind, x: p.x, wy: p.wy + 70, ph: rand(0, 6), got: false });
    }
    Object.assign(this, { plats, foes, powers, x: 480, wy: 0, vy: KR_V, vx: 0, cam: 0, maxH: 0, falls: 0, gems: 0, charmed: 0, bumps: 0, last: plats[0], facing: 1,
      state: 'play', t2: 0, rescue: 0, land: 0, zone: 0, banner: 3.5, card: null, trail: [], sparks: [], bolts: [], poofs: [], usePointer: false, tx: 480,
      cool: 0, castT: 0, tumble: 0, hurt: 0, shield: 0, rocket: 0, flash: 0, boostT: 0, stretch: 0, cannon: null, ride: false, ending: false, time: 0, fw: 0,
      toldPoof: false, toldBump: false, toldPower: {}, boss: { on: false, done: false, hits: 0, x: 480, hurt: 0, rainbow: 0, drops: [] } });
    say([
      ['fairy', '🧚', `The moon is rising, Aubrey! The fashion show is in the Starlight Glade, at the very top of the Fairy Kingdom!`, () => SFX.sparkle()],
      ['fairy', '🧚', `There's no road up there. You and ${S.name} will have to BOUNCE! Steer left and right, and keep going up, up, up!`],
      ['fairy', '🧚', `Some mischief-makers like to cause trouble on the way. Here's a magic wand! Press SPACE or tap the star button to zap them into something lovely. Or bounce right on their heads!`, () => SFX.sparkle()],
      ['aubrey', 'determined', `Ready, ${S.name}? Let's bounce all the way to the show!`],
    ]);
  },
  update(dt) {
    const g = this, B = g.boss;
    g.time += dt;
    for (const k of ['rescue', 'land', 'banner', 'cool', 'castT', 'tumble', 'hurt', 'shield', 'rocket', 'flash', 'boostT']) g[k] = Math.max(0, g[k] - dt);
    g.stretch = Math.max(0, g.stretch - dt * 1.6);
    for (const p of g.plats) {
      p.sq = Math.max(0, (p.sq || 0) - dt);
      if (p.kind === 'move') p.x = p.x0 + Math.sin(S.t * 1.1 + p.ph) * 85;
      if (p.kind === 'cloud') p.x = p.x0 + Math.sin(S.t * 0.8 + p.ph) * 110;
      if (p.gone > 0) p.gone = Math.max(0, p.gone - dt); // popped bubbles and broken crystal grow back
      if (p.wob) p.wob = Math.max(0, p.wob - dt * 1.2);
      if (p.kind === 'star') { p.rot += dt * (0.4 + p.spin * 16); p.spin = Math.max(0, p.spin - dt * 1.4); }
      if (p.loaded) p.loaded = Math.max(0, p.loaded - dt);
    }
    // the mischief-makers wander about
    for (const b of g.foes) {
      if (b.charmed) continue;
      b.bump = Math.max(0, b.bump - dt);
      const t = S.t + b.ph;
      if (b.kind === 'cloud') { b.x = b.x0 + Math.sin(t * 0.6) * 120; b.wy = b.wy0 + Math.sin(t * 1.3) * 8; }
      else if (b.kind === 'imp') { b.x = b.x0 + Math.sin(t * 0.9) * 100; b.wy = b.wy0 + Math.abs(Math.sin(t * 2.6)) * 30; }
      else if (b.kind === 'gremlin') { b.x = b.x0 + Math.sin(t * 1.3) * 150; b.wy = b.wy0 + Math.sin(t * 5) * 4; }
      else { b.x = b.x0 + Math.sin(t * 1.1) * 160; b.wy = b.wy0 + Math.sin(t * 2.2) * 40; }
    }
    if (g.state === 'play' && !g.ride && !g.cannon) {
      // steer: arrow keys, or follow the mouse / a tap (but not a tap on the star button)
      const onCast = Math.hypot(pointer.x - KR_CAST.x, pointer.y - KR_CAST.y) < KR_CAST.r + 8;
      const moved = g.lpx !== undefined && (Math.abs(pointer.x - g.lpx) > 0.5 || Math.abs(pointer.y - g.lpy) > 0.5);
      g.lpx = pointer.x; g.lpy = pointer.y;
      if ((moved || pointer.clicked) && !onCast) { g.tx = pointer.x; g.usePointer = true; }
      let want = 0;
      if (goLeft()) want = -1; else if (goRight()) want = 1;
      const grip = g.tumble ? 0.35 : 1;
      if (want) { g.vx = lerp(g.vx, want * 400, Math.min(1, dt * 10 * grip)); g.usePointer = false; }
      else if (g.usePointer) g.vx = lerp(g.vx, clamp((g.tx - g.x) * 6, -420, 420), Math.min(1, dt * 12 * grip));
      else g.vx = lerp(g.vx, 0, Math.min(1, dt * 6 * grip));
      if (Math.abs(g.vx) > 20 && !g.castT) g.facing = Math.sign(g.vx);
      if (pressed[' '] || pressed.arrowup || pressed.w || pressed.x || (pointer.clicked && onCast)) krCast(g);
    }
    if (g.ride) g.vx = clamp((480 - g.x) * 4, -500, 500);
    if (g.cannon) {
      // tucked into the cannon... then BOOM
      const p = g.cannon; g.x = p.x; g.wy = p.wy; g.vy = 0; g.vx = 0;
      if (p.loaded <= 0) {
        g.cannon = null; g.vy = KR_V * KR_BOUNCE.cannon; g.stretch = 1; g.boostT = 0.7;
        const y = KR_SY - (p.wy - g.cam);
        tone(110, 0.35, 'square', 0.07, 0, 50); noise(0.25, 0.06); burst(p.x, y, 24, { colors: ['#ffd23f', '#ff9ac8', '#ffffff', '#8ad4ff'], spread: 200, up: 120 });
        floatText(p.x, y - 50, 'BOOM! Whee!', '#fff6a8', false, 28);
      }
    } else if (g.state === 'play') {
      g.x += g.vx * dt;
      if (g.x < -20) g.x = W + 20; if (g.x > W + 20) g.x = -20;
      const prev = g.wy;
      g.vy -= KR_G * dt;
      if (g.rocket > 0) g.vy = Math.max(g.vy, 1150);
      g.wy += g.vy * dt;
      if (g.vy < 0) for (const p of g.plats) {
        if (p.gone > 0) continue;
        if (prev >= p.wy && g.wy <= p.wy && Math.abs(g.x - p.x) < p.w / 2 + 12) { krLand(g, p); break; }
      }
    }
    if (g.state === 'win') { g.wy = KR_TOP; g.vy = 0; g.vx = 0; }
    // Grumbles sits over the glade: bumping his tummy from below counts as a hit
    if (!B.done && g.wy > KR_CEIL) { if (!B.on) krBossWake(g); g.wy = KR_CEIL; g.vy = -160; g.rocket = 0; krBossHit(g, 'boop'); }
    g.maxH = Math.max(g.maxH, g.wy);
    const ax = g.x, awy = g.wy + 50; // the middle of Aubrey
    // bumping into mischief-makers
    if (g.state === 'play' && !g.cannon) for (const b of g.foes) {
      if (b.charmed) continue;
      if (Math.hypot(ax - b.x, (awy - b.wy) * 1.1) > b.r + 30) continue;
      if (g.rocket > 0 || g.ride) { krCharm(g, b, 'zap'); continue; }
      if (g.vy < 0 && g.wy > b.wy - 8) { krCharm(g, b, 'bonk'); g.vy = KR_V * 1.35; g.stretch = 1; g.land = 0.1; continue; }
      if (g.shield > 0) { krCharm(g, b, 'zap'); g.shield = 0; floatText(ax, KR_SY - (awy - g.cam) - 50, 'Pop!', '#bfe8ff', false, 24); SFX.pop(); continue; }
      if (g.hurt > 0) continue;
      // a gentle bump: she tumbles down a little way, and that's all
      g.bumps++; g.hurt = 1.8; g.tumble = 0.8; b.bump = 0.6;
      g.vy = Math.min(g.vy, 0) - 240; g.vx = Math.sign(ax - b.x || 1) * 300;
      tone(330, 0.18, 'triangle', 0.07, 0, 200); tone(260, 0.2, 'triangle', 0.05, 0.12, 180);
      const sy = KR_SY - (awy - g.cam);
      floatText(ax, sy - 60, 'Bump!', '#ffd0e8', false, 22);
      if (b.kind === 'gremlin' && g.gems > 0) { const n = Math.min(2, g.gems); g.gems -= n; b.loot += n; floatText(ax, sy - 90, `-${n}✨`, '#fff6a8', false, 22); if (!g.toldSteal) { g.toldSteal = g.toldBump = true; speak('That gremlin grabbed some sparkles! Zap it to get them back!'); } }
      if (!g.toldBump) { g.toldBump = true; speak('Bump! That cheeky thing knocked you down a little. Zap it with your wand!'); }
    }
    // magic bolts
    for (let i = g.bolts.length - 1; i >= 0; i--) {
      const m = g.bolts[i];
      m.life -= dt; m.tail.push([m.x, m.wy]); if (m.tail.length > 10) m.tail.shift();
      const tg = m.tgt;
      if (tg && !(tg === B ? B.done : tg.charmed)) {
        const tx = tg.x, ty = tg === B ? KR_BOSS_Y - 30 : tg.wy, sp = Math.hypot(m.vx, m.vy);
        const a = Math.atan2(m.vy, m.vx), want = Math.atan2(ty - m.wy, tx - m.x);
        let d = want - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        const na = a + clamp(d, -dt * 7, dt * 7); m.vx = Math.cos(na) * sp; m.vy = Math.sin(na) * sp;
      }
      m.x += m.vx * dt; m.wy += m.vy * dt;
      let hit = false;
      for (const b of g.foes) if (!b.charmed && Math.hypot(m.x - b.x, m.wy - b.wy) < b.r + 18) { krCharm(g, b, 'zap'); hit = true; break; }
      if (!hit && B.on && !B.done && Math.abs(m.x - B.x) < 160 && Math.abs(m.wy - KR_BOSS_Y) < 75) { krBossHit(g, 'zap'); hit = true; }
      if (hit || m.life <= 0) g.bolts.splice(i, 1);
    }
    // sparkle gems above some platforms
    for (const p of g.plats) if (p.gem && Math.abs(g.x - p.x) < 34 && Math.abs(g.wy + 50 - (p.wy + 60)) < 46) { p.gem = false; g.gems++; SFX.sparkle(); floatText(p.x, KR_SY - (p.wy + 60 - g.cam) - 20, '+✨', '#fff6a8', false, 22); }
    // magic power-ups
    for (const u of g.powers) {
      if (u.got || Math.hypot(g.x - u.x, awy - u.wy) > 48) continue;
      u.got = true; const sy = KR_SY - (u.wy - g.cam);
      SFX.sparkle(); burst(u.x, sy, 20, { colors: ['#fff6a8', '#ffb3e0', '#b8e6ff'] }); floatText(u.x, sy - 40, KR_POWER[u.kind].name, '#fff', false, 26);
      if (u.kind === 'shield') g.shield = 14;
      if (u.kind === 'rocket') { g.rocket = 1.3; g.stretch = 1; }
      if (u.kind === 'burst') {
        g.flash = 0.7;
        for (const b of g.foes) { const fy = KR_SY - (b.wy - g.cam); if (!b.charmed && fy > -60 && fy < H + 60) krCharm(g, b, 'zap'); }
        if (B.on && !B.done) { krBossHit(g, 'zap'); B.hurt = 0; krBossHit(g, 'zap'); }
      }
      if (!g.toldPower[u.kind]) { g.toldPower[u.kind] = true; speak({ shield: 'A shield bubble! Bumps just go pop!', rocket: 'A fairy-dust rocket! Zoom!', burst: 'A star burst! Every mischief-maker turns into something lovely!' }[u.kind]); }
    }
    // a sparkle trail behind her
    if (g.state === 'play' && !g.cannon) {
      const n = g.rocket || g.boostT || g.ride ? 3 : 1;
      for (let i = 0; i < n; i++) g.sparks.push({ x: g.x + rand(-10, 10), wy: g.wy + rand(14, 46), life: 0.7, max: 0.7, col: KR_RAINBOW[Math.floor(g.time * 10 + i) % 6], r: rand(3, 6) });
    }
    for (let i = g.sparks.length - 1; i >= 0; i--) { const s = g.sparks[i]; s.life -= dt; s.wy -= dt * 30; if (s.life <= 0) g.sparks.splice(i, 1); }
    for (let i = g.poofs.length - 1; i >= 0; i--) { const f = g.poofs[i]; f.t += dt; f.wy += dt * (f.into === 'star' ? 60 : 40); if (f.t > 2.6) g.poofs.splice(i, 1); }
    // a fall: the fairy's sparkles float them both back to the last safe platform
    if (g.wy < g.cam - 140 && g.state === 'play') {
      if (B.on && !B.done) g.last = g.plats.find(p => p.kind === 'arena'); // back onto Grumbles' big cloud
      g.falls++; g.wy = g.last.wy; g.x = g.last.x; g.vy = KR_V; g.rescue = 1.4; g.trail = []; g.tumble = 0; g.rocket = 0; g.hurt = 1.2;
      g.cam = Math.min(g.cam, g.last.wy + 40); tone(900, 0.25, 'sine', 0.06, 0, 1500); speak(pick(['Whoops! Fizzlewick caught you!', 'Fairy sparkles to the rescue!', 'Up you go again!']));
    }
    // the camera follows her up (and settles in front of Grumbles while he's there)
    let camT = g.wy - 200;
    if (B.on && !B.done) camT = Math.max(camT, KR_TOP - 440);
    g.cam = Math.max(g.cam, lerp(g.cam, camT, Math.min(1, dt * (B.on && !B.done ? 2.5 : 5))));
    if (g.state === 'win') g.cam = lerp(g.cam, KR_TOP - 10, Math.min(1, dt * 2));
    g.cam = Math.min(g.cam, KR_TOP - 10);
    // a new part of the kingdom
    const z = krZone(g.maxH);
    if (z > g.zone) { g.zone = z; g.banner = 3.2; g.card = null; SFX.sparkle(); speak(KR_ZONES[z].say); }
    // Grumbles the storm cloud wakes up when she reaches his clouds
    if (!B.on && (g.last.kind === 'arena' || g.wy > KR_ARENA + 20)) krBossWake(g);
    if (B.on) {
      B.hurt = Math.max(0, B.hurt - dt);
      if (!B.done) {
        B.x = lerp(B.x, clamp(g.x, 220, 740), Math.min(1, dt * 0.9));
        if (Math.random() < dt * 14) B.drops.push({ x: B.x + rand(-120, 120), wy: KR_BOSS_Y - 40, vy: -280 });
      } else B.rainbow = Math.min(1, B.rainbow + dt * 1.2);
      for (let i = B.drops.length - 1; i >= 0; i--) { const d = B.drops[i]; d.wy += d.vy * dt; if (d.wy < g.cam - 140) B.drops.splice(i, 1); }
    }
    // the unicorn bounces along right behind, following Aubrey's path
    g.trail.push([g.x, g.wy]); if (g.trail.length > 18) g.trail.shift();
    if (g.state === 'win') {
      g.fw -= dt;
      if (g.fw <= 0) { g.fw = 0.35; burst(rand(160, 800), rand(60, 220), 22, { colors: pick([['#ff9ac8', '#fff6a8'], ['#8ad4ff', '#ffffff'], ['#ffd23f', '#ff8a6a'], ['#a6f0b8', '#c6a2ff']]), spread: 180, up: 0 }); tone(rand(700, 1200), 0.2, 'sine', 0.04, 0, 1800); }
      if ((g.t2 -= dt) <= 0 && !g.ending) {
        g.ending = true;
        say([
          ['aubrey', 'excited', `We did it, ${S.name}! Look at all the lights!`],
          ['fairy', '🧚', `You bounced through the whole kingdom!${g.charmed ? ` You charmed ${g.charmed} mischief-makers into lovely things.` : ''}${g.gems ? ` And those ${g.gems} sparkles make ${S.name} shine even brighter.` : ''} Now, on to the stage!`, () => SFX.sparkle()],
        ], () => startShow());
      }
    }
  },
  draw() {
    buttons = [];
    const g = this, B = g.boss, sy = wy => KR_SY - (wy - g.cam), t = S.t;
    // the backdrop blends from one part of the kingdom to the next
    const camZ = krZone(g.cam + 200);
    const k = camZ < 3 ? clamp((g.cam + 200 - (KR_ZONES[camZ].to - 300)) / 300, 0, 1) : 0; // cross-fade over the last stretch of each part
    KR_BG[camZ](g.cam, t);
    if (k > 0) { ctx.globalAlpha = k; KR_BG[camZ + 1](g.cam, t); ctx.globalAlpha = 1; }
    // the Starlight Glade and its stage at the very top
    const gy = sy(KR_TOP);
    if (gy > -160) {
      krGlow(480, gy - 150, 360, '255,236,190', 0.55);
      if (gy > -20) {
        drawStage(480, gy + 4, true);
        // searchlights sweeping the sky over the stage
        for (const s of [-1, 1]) { ctx.save(); ctx.translate(480 + s * 230, gy - 6); ctx.rotate(s * (0.35 + Math.sin(t * 1.2 + s) * 0.25)); const lg = ctx.createLinearGradient(0, 0, 0, -420); lg.addColorStop(0, 'rgba(255,245,200,.35)'); lg.addColorStop(1, 'rgba(255,245,200,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-60, -420); ctx.lineTo(60, -420); ctx.lineTo(6, 0); ctx.fill(); ctx.restore(); }
      }
    }
    // Grumbles, or the rainbow he turned into
    if (B.on) {
      const by = sy(KR_BOSS_Y);
      if (!B.done) {
        const calm = B.hits / KR_BOSS_HP, sh = B.hurt > 0 ? Math.sin(B.hurt * 50) * 6 : 0, bx = B.x + sh, pf = 1 + Math.sin(t * 2) * 0.03;
        for (const d of B.drops) { const dy = sy(d.wy); ctx.strokeStyle = 'rgba(120,170,240,.75)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(d.x, dy); ctx.lineTo(d.x - 2, dy + 12); ctx.stroke(); }
        ctx.save(); ctx.translate(bx, by); ctx.scale(pf * (1 - calm * 0.15), pf * (1 - calm * 0.15));
        const c1 = mix('#6a7098', '#d8d0f0', calm), c2 = mix('#4a4f74', '#b8b0e0', calm);
        puffCluster([[-120, 10, 46], [-70, -24, 58], [0, -40, 68], [70, -24, 58], [120, 10, 46], [-60, 30, 48], [0, 32, 52], [60, 30, 48]], (px, py) => mix(c1, c2, clamp((py + 30) / 70, 0, 1)), 2.5, OL);
        if (calm < 0.5 && Math.sin(t * 3) > 0.7) { ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(90, 50); ctx.lineTo(80, 72); ctx.lineTo(94, 72); ctx.lineTo(82, 96); ctx.stroke(); }
        krFace(0, 4, 3.2, calm < 0.5 ? 'grump' : calm < 0.8 ? 'cheeky' : 'happy');
        ctx.restore();
        // how many more zaps
        darkPanel(W / 2 - 170, 12, 340, 44, 20);
        text('Grumbles', W / 2 - 150, 34, 18, '#fff', 'left', 700);
        for (let i = 0; i < KR_BOSS_HP; i++) { const hx = W / 2 - 40 + i * 32; if (i < KR_BOSS_HP - B.hits) vecStar(hx, 34, 12, '#9aa8d8', 1); else { krGlow(hx, 34, 18, '255,240,160', 0.6); vecStar(hx, 34, 12, '#ffe14a', 1); } }
      } else {
        // a rainbow arcs from his clouds up to the glade
        ctx.save(); ctx.globalAlpha = Math.min(1, B.rainbow * 1.4);
        const r0 = 340 * B.rainbow, cx = 480, cy = sy(KR_ARENA) + 40;
        KR_RAINBOW.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, r0 - i * 15), Math.PI, Math.PI * 2); ctx.stroke(); });
        ctx.restore();
      }
    }
    for (const p of g.plats) {
      const y = sy(p.wy); if (y < -120 || y > H + 120) continue;
      if (p.kind === 'floor') {
        // the meadow behind Aubrey's house, where the climb begins
        ctx.fillStyle = vgrad(y + 10, y + 200, '#86d46a', '#5fb24e'); ctx.fillRect(0, y + 10, W, H); ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, y + 10); ctx.lineTo(W, y + 10); ctx.stroke();
        for (let i = 0; i < 14; i++) flower(30 + i * 70, y + 30 + (i % 2) * 20, 7, ['#ffd84a', '#fff', '#ff9ac0'][i % 3], '#ff9a3a', 1);
        continue;
      }
      if (p.kind === 'glade') {
        ink(P2(`M${p.x - p.w / 2},${y} L${p.x + p.w / 2},${y} L${p.x + p.w / 2 - 30},${y + 26} L${p.x - p.w / 2 + 30},${y + 26} Z`), '#9ad86a', 2.5);
        ink(P2(`M${p.x - p.w / 2 + 30},${y + 26} L${p.x + p.w / 2 - 30},${y + 26} L${p.x + 40},${y + 90} L${p.x - 40},${y + 90} Z`), '#a88ad8', 2);
        for (let i = 0; i < 9; i++) flower(p.x - p.w / 2 + 30 + i * 50, y + 4, 6, ['#ff9ac8', '#fff', '#ffd84a'][i % 3], '#ff9a3a', 1);
        continue;
      }
      if (p.gone > 0) {
        if (p.kind === 'bubble') { if (p.gone > 2.2) { ctx.strokeStyle = `rgba(150,190,240,${(p.gone - 2.2) / 0.3})`; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, r = (2.5 - p.gone) * 260; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * r, y + 12 + Math.sin(a) * r * 0.4, 4, 0, Math.PI * 2); ctx.stroke(); } } }
        else if (p.gone > 2.4) { const f = (3 - p.gone) * 300; ctx.fillStyle = '#c8f0ff'; for (let i = 0; i < 5; i++) circle(p.x - 40 + i * 20, y + 8 + f * (0.6 + i * 0.1), 5); }
        if (p.gone < 0.8) { ctx.globalAlpha = 1 - p.gone / 0.8; krPlatform(p, p.x, y); ctx.globalAlpha = 1; }
        continue;
      }
      krPlatform(p, p.x, y);
      if (p.gem) { const gy2 = sy(p.wy + 60) + Math.sin(t * 3 + p.ph) * 4; krGlow(p.x, gy2, 30, '255,240,160', 0.7); star(p.x, gy2, 13, '#fff6a8', 4); }
    }
    // power-ups in their glowing bubbles
    for (const u of g.powers) {
      if (u.got) continue;
      const y = sy(u.wy) + Math.sin(t * 2.5 + u.ph) * 6; if (y < -60 || y > H + 60) continue;
      krGlow(u.x, y, 52, KR_POWER[u.kind].col, 0.7);
      ctx.beginPath(); ctx.arc(u.x, y, 26, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.5; ctx.stroke();
      emoji(KR_POWER[u.kind].icon, u.x, y, 28);
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ellipse(u.x - 10, y - 13, 6, 3, -0.5);
      for (let i = 0; i < 3; i++) star(u.x + Math.cos(t * 2 + i * 2.1) * 36, y + Math.sin(t * 2 + i * 2.1) * 36, 4, '#fff', 4);
    }
    // the mischief-makers, always looking at Aubrey
    for (const b of g.foes) {
      if (b.charmed) continue;
      const y = sy(b.wy); if (y < -60 || y > H + 60) continue;
      krFoe(b, b.x, y, Math.sign(g.x - b.x) || 1);
    }
    // what they turned into
    for (const f of g.poofs) {
      const y = sy(f.wy), x = f.x + Math.sin(f.t * 3 + f.ph) * 14, a = clamp((2.6 - f.t) / 0.6, 0, 1);
      if (f.t < 0.4) { ctx.globalAlpha = 1 - f.t / 0.4; const r = 14 + f.t * 90; puffCluster([[f.x - r * 0.6, y, r * 0.5], [f.x + r * 0.6, y, r * 0.5], [f.x, y - r * 0.5, r * 0.55], [f.x, y + r * 0.4, r * 0.5]], '#ffffff', 0, 'rgba(0,0,0,0)'); ctx.globalAlpha = 1; }
      if (f.t < 0.15) continue;
      ctx.globalAlpha = a * clamp((f.t - 0.15) / 0.2, 0, 1);
      if (f.into === 'flower') { ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 6, y + 14, x, y + 26); ctx.stroke(); flower(x, y, 24, f.col, '#ffd84a', 1.5); }
      else if (f.into === 'butterfly') krButterfly(x, y, 1.8, f.col, t + f.ph, Math.sin(f.t * 4) * 0.3);
      else { ctx.save(); ctx.translate(x, y); ctx.rotate(f.t * 3); krGlow(0, 0, 40, '255,240,160', 0.6); vecStar(0, 0, 22, '#ffe14a', 1.5); ctx.restore(); }
      ctx.globalAlpha = 1;
    }
    // her sparkle trail
    for (const s of g.sparks) { ctx.globalAlpha = s.life / s.max; star(s.x, sy(s.wy), s.r * (0.5 + s.life / s.max * 0.5), s.col, 4); }
    ctx.globalAlpha = 1;
    if (g.boostT > 0 || g.ride) { // a rainbow streak under her
      ctx.globalAlpha = g.ride ? 0.8 : g.boostT; KR_RAINBOW.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(g.x - 15 + i * 6, sy(g.wy) + 4); ctx.lineTo(g.x - 15 + i * 6, sy(g.wy) + 110); ctx.stroke(); }); ctx.globalAlpha = 1;
    }
    const night = clamp((g.cam - 3700) / 600, 0, 1);
    // the unicorn, a few moments behind Aubrey
    const [ux, uwy] = g.trail[0] || [g.x, g.wy];
    if (g.state === 'win') drawUnicorn(g.x > 480 ? g.x - 150 : g.x + 70, sy(KR_TOP) + 4, 0.3, uniLook(), { facing: g.x > 480 ? 1 : -1, mood: 'joy', glow: 0.8 });
    else drawUnicorn(ux - g.facing * 46, sy(uwy) + 8, 0.3, uniLook(), { facing: g.facing, moving: true, glow: 0.4 + night * 0.4 });
    // Aubrey: squash when she lands, stretch when she shoots up, tumble when bumped
    const ay = sy(g.wy) - (g.state === 'win' ? Math.abs(Math.sin(t * 5)) * 22 : 0); // a happy hop on the glade
    if (g.rescue) { ctx.globalAlpha = Math.min(1, g.rescue); for (let i = 0; i < 8; i++) star(g.x + Math.cos(t * 6 + i) * 50, ay - 60 + Math.sin(t * 6 + i) * 40, 6, '#fff6a8', 4); emoji('🧚', g.x + 60, ay - 130, 38); ctx.globalAlpha = 1; }
    if (g.rocket > 0) { for (let i = 0; i < 6; i++) { const fy = ay + 10 + i * 10 + rand(-3, 3); ctx.fillStyle = ['#fff6a8', '#ffb3e0', '#ffd23f'][i % 3]; circle(g.x + rand(-8, 8), fy, 9 - i); } }
    const ld = g.land / 0.12, st = g.stretch * clamp(g.vy / 900, 0, 1);
    const scY = 1 - ld * 0.22 + st * 0.18, scX = 1 + ld * 0.18 - st * 0.1;
    const frame = g.cannon ? 'idle_front' : g.castT > 0 ? 'cast' : g.land ? 'crouch' : 'twirl';
    const blink = g.hurt > 0 && !g.tumble && Math.floor(g.hurt * 10) % 2;
    ctx.save();
    if (g.cannon) { ctx.beginPath(); ctx.rect(0, 0, W, ay + 2); ctx.clip(); }
    if (blink) ctx.globalAlpha = 0.55;
    ctx.translate(g.x, ay + 6 + (g.cannon ? 52 - g.cannon.loaded * 40 : 0)); ctx.scale(scX, scY);
    if (g.tumble) { ctx.translate(0, -48); ctx.rotate((1 - g.tumble / 0.8) * Math.PI * 2 * -g.facing); ctx.translate(0, 48); }
    drawAubrey(0, 0, frame, g.facing, 0, KR_SC);
    ctx.restore();
    if (g.tumble) for (let i = 0; i < 3; i++) star(g.x + Math.cos(t * 8 + i * 2.1) * 26, ay - 104 + Math.sin(t * 8 + i * 2.1) * 8, 6, '#fff6a8', 5);
    if (g.shield > 0 && g.state === 'play' && (g.shield > 2 || Math.floor(g.shield * 6) % 2)) {
      ctx.beginPath(); ctx.arc(g.x, ay - 46, 66, 0, Math.PI * 2); ctx.fillStyle = 'rgba(190,230,255,.18)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,150,220,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(g.x, ay - 46, 62, t * 2, t * 2 + 1); ctx.stroke();
      ctx.strokeStyle = 'rgba(140,255,220,.6)'; ctx.beginPath(); ctx.arc(g.x, ay - 46, 62, t * 2 + 3, t * 2 + 3.8); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ellipse(g.x - 30, ay - 84, 12, 6, -0.6);
    }
    if (g.castT > 0) { const wx = g.x + g.facing * 44 * scX, wy2 = ay - 63; krGlow(wx, wy2, 30, '255,240,170', g.castT * 2.5); star(wx, wy2, 10 * g.castT / 0.32 + 4, '#fff', 4); }
    // magic bolts
    for (const m of g.bolts) {
      m.tail.forEach(([tx, twy], i) => { ctx.globalAlpha = i / m.tail.length * 0.8; star(tx, sy(twy), 3 + i * 0.6, KR_RAINBOW[i % 6], 4); });
      ctx.globalAlpha = 1; const my = sy(m.wy);
      krGlow(m.x, my, 26, '255,245,190', 0.9); ctx.save(); ctx.translate(m.x, my); ctx.rotate(t * 10); star(0, 0, 13, '#ffffff', 4); ctx.restore(); star(m.x, my, 6, '#ffe14a', 4);
    }
    drawFx(false);
    if (g.flash > 0) { ctx.fillStyle = `rgba(255,250,220,${g.flash * 0.7})`; ctx.fillRect(0, 0, W, H); }
    // how far up: a meter with the four parts of the kingdom
    darkPanel(W - 52, 70, 36, 300, 18);
    emoji('👑', W - 34, 88, 22);
    KR_ZONES.forEach(z => { const zy = 356 - (z.to / KR_TOP) * 252; ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(W - 46, zy, 24, 2); });
    const hy = 356 - clamp(g.maxH / KR_TOP, 0, 1) * 252;
    rrect(W - 40, hy - 2, 12, 356 - hy + 6, 6, '#ff9ac8');
    inkCircle(W - 34, hy, 8, '#ffd8b8', 1.5);
    // sparkles and charmed counters, plus any power-up she's using
    darkPanel(16, 14, 200, 40, 20);
    text(`✨ ${g.gems}`, 36, 34, 20, '#fff6a8', 'left', 800);
    text(`🦋 ${g.charmed}`, 116, 34, 20, '#ffd0f0', 'left', 800);
    if (g.shield > 0) { darkPanel(226, 14, 50, 40, 20); emoji('🛡️', 251, 34, 24); }
    if (g.rocket > 0) { darkPanel(226, 14, 50, 40, 20); emoji('🚀', 251, 34, 24); }
    // the star button: tap it (or press SPACE) to zap
    if (g.state === 'play') {
      const c = KR_CAST, foeNear = g.foes.some(b => !b.charmed && sy(b.wy) > 0 && sy(b.wy) < H) || (B.on && !B.done), pulse = foeNear ? 1 + Math.sin(t * 8) * 0.05 : 1;
      if (foeNear) krGlow(c.x, c.y, c.r * 1.8, '255,240,160', 0.5);
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(pulse, pulse);
      inkCircle(0, 0, c.r, g.cool > 0 ? '#c79ad8' : '#ff6fb5', 2.5);
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, c.r - 5, 0, Math.PI * 2); ctx.stroke();
      if (g.cool > 0) { ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, c.r - 5, -Math.PI / 2, -Math.PI / 2 + (1 - g.cool / 0.32) * Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-16, 18); ctx.lineTo(4, -2); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.stroke();
      vecStar(8, -8, 15, '#ffe14a', 1.5);
      ctx.restore();
      outlined('SPACE', c.x, c.y + c.r + 12, 13, '#fff');
    }
    // a big card when a new part of the kingdom (or Grumbles) begins
    if (g.banner > 0 && !dlg) {
      const card = g.card || KR_ZONES[g.zone], age = (g.card ? 3.4 : 3.2) - g.banner;
      const drop = age < 0.4 ? 1 - Math.pow(1 - age / 0.4, 3) : 1, out = g.banner < 0.4 ? g.banner / 0.4 : 1;
      const cy = -100 + drop * 176 - (1 - out) * 40;
      ctx.globalAlpha = out;
      ctx.save(); ctx.translate(W / 2, cy); ctx.rotate(Math.sin(age * 3) * 0.015);
      for (const s of [-1, 1]) ink(P2(`M${s * 210},-10 L${s * 262},-14 L${s * 246},12 L${s * 262},38 L${s * 210},34 Z`), '#ff8fc8', 2);
      panel(-230, -40, 460, 92, 26);
      emoji(card.icon, -186, 6, 44); emoji(card.icon, 186, 6, 44);
      outlined(card.name, 0, -6, 32, '#ff6fb5', 'center', '#fff');
      text(card.tip, 0, 28, 17, '#7a5a9a', 'center', 700);
      for (let i = 0; i < 5; i++) star(-160 + i * 80, -40 + Math.sin(t * 5 + i) * 3, 5 + Math.abs(Math.sin(t * 4 + i)) * 3, '#ffe14a', 4);
      ctx.restore(); ctx.globalAlpha = 1;
    }
    if (g.state === 'play' && g.maxH < 60 && !dlg) { outlined('Steer with ← → or tap where to go!', W / 2, 190, 26, '#fff6a8'); outlined('SPACE or ⭐ to zap mischief-makers', W / 2, 226, 22, '#ffffff'); }
    if (g.state === 'win') {
      emoji('🧚', 480 + Math.sin(t * 1.5) * 180, 150 + Math.sin(t * 3) * 20, 44);
      panel(W / 2 - 250, 432, 500, 88, 24);
      outlined('The Starlight Glade!', W / 2, 462, 32, '#ff6fb5', 'center', '#fff');
      text(`✨ ${g.gems} sparkle${g.gems === 1 ? '' : 's'}   ·   🦋 ${g.charmed} mischief-maker${g.charmed === 1 ? '' : 's'} charmed`, W / 2, 498, 18, '#7a5a9a', 'center', 700);
    }
  },
};
