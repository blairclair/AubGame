'use strict';
// The secret pet: the baby dinosaur (art, the shed nights, the reunion ending), and drawPet(),
// which draws whichever pet the player picked on the title screen (S.pet: 'unicorn' | 'dino').

// --- the baby dinosaur ---------------------------------------------------------------------
// drawn facing right with the origin on the ground under his feet; s = 1 is about unicorn-sized.
// look: { head, neck, back, tail, feet } (item ids from the dino wardrobe; see dinoLook()). null = what he's wearing now.
// opts: { facing, moving, mood: 'joy'|'happy'|'sad'|'scared'|'sleepy'|'sleep'|'wow', glow, pose: 'stand'|'sit',
//         chomp (0..1, mouth open), t, palette: { body, dark, belly, plate }, grown (true for his mama and papa) }
const DINO_PAL = { body: '#7fd88a', dark: '#4fae66', belly: '#fff3d6', plate: '#ff8f8a' };
const DINO_INK = '#3f6e4e';
const D = {
  body: P2('M-66,-62 C-72,-104 -38,-138 4,-138 C46,-138 74,-108 72,-70 C70,-34 40,-20 2,-20 C-38,-20 -62,-32 -66,-62 Z'),
  neck: P2('M20,-128 C30,-150 44,-160 58,-160 L66,-112 C56,-96 36,-96 24,-104 Z'),
  head: P2('M14,-160 C12,-196 40,-212 66,-210 C92,-208 108,-192 112,-172 C130,-170 140,-156 138,-142 C136,-124 118,-118 100,-120 C80,-118 54,-118 36,-126 C22,-132 14,-144 14,-160 Z'),
  tail: P2('M-56,-84 C-86,-84 -116,-66 -136,-30 C-128,-26 -118,-26 -106,-32 C-90,-40 -74,-44 -56,-42 Z'),
  plate: P2('M-13,6 C-13,-8 -7,-24 0,-30 C7,-24 13,-8 13,6 Z'),
  leg: P2('M-16,-46 C-17,-30 -17,-14 -16,-2 L18,-2 C19,-14 19,-30 18,-46 Z'),
  arm: P2('M-6,-6 C-8,6 -6,16 2,20 C8,22 12,16 10,8 C8,0 6,-6 4,-10 Z'),
  wing: P2('M0,0 C-8,-30 -40,-56 -74,-52 C-66,-40 -62,-32 -54,-24 C-66,-18 -62,-8 -44,-4 C-50,4 -36,10 -22,6 C-12,4 -4,2 0,0 Z'),
  cape: P2('M-64,-96 C-50,-140 30,-150 50,-120 C54,-98 40,-82 18,-78 C-12,-74 -46,-74 -64,-96 Z'),
};
const PLATES = [[-50, -120, -0.9], [-20, -138, -0.35], [14, -146, 0.15], [40, -164, 0.45]];

function drawBabyDino(x, y, s, look, o = {}) {
  const t = o.t ?? (typeof S !== 'undefined' && S ? S.t : 0);
  look = look || (typeof dinoLook === 'function' && S && S.equip ? dinoLook() : {});
  const pal = { ...DINO_PAL, ...(o.palette || {}) };
  const lw = 1.2 + 1.2 / s;
  const mood = o.mood === 'sleep' ? 'sleepy' : o.mood;
  const sit = o.pose === 'sit';
  const outerInk = INK;
  INK = o.palette ? mix(pal.dark, '#1a2a20', 0.45) : DINO_INK;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.facing || 1), s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  try {
    if (o.glow) {
      const g = ctx.createRadialGradient(10, -110, 10, 10, -110, 180);
      g.addColorStop(0, `rgba(240,255,220,${0.5 * o.glow})`); g.addColorStop(1, 'rgba(240,255,220,0)');
      ctx.fillStyle = g; ctx.fillRect(-190, -300, 380, 310);
    }
    ctx.fillStyle = 'rgba(30,40,30,.2)'; ellipse(0, -2, 84, 10);
    // a scared baby trembles; a walking one bobs
    const shake = mood === 'scared' ? Math.sin(t * 46) * 1.4 : 0;
    const bob = o.moving ? -Math.abs(Math.sin(t * 11)) * 5 : Math.sin(t * 2) * 1;
    ctx.translate(shake, bob + (sit ? 16 : 0));
    const legSw = k => (o.moving ? Math.sin(t * 11 + k * Math.PI) * 0.35 : 0);
    const farCol = mix(pal.body, pal.dark, 0.45);
    // far-side legs and wings behind everything
    if (!sit) { dinoLeg(-16, legSw(1), farCol, pal, look.feet, lw); dinoLeg(48, legSw(0), farCol, pal, look.feet, lw); }
    if (look.back === 'd_wings') dinoWings(t, lw, true);
    // back plates poke up from behind the body
    PLATES.forEach(([px, py, r], i) => {
      const sz = i === 3 ? 0.8 : 1;
      ctx.save(); ctx.translate(px, py); ctx.rotate(r); ctx.scale(sz, sz);
      ink(D.plate, vgradL(-30, 6, mix(pal.plate, '#ffffff', 0.35), pal.plate), lw / sz, mix(pal.plate, '#5a1a2a', 0.45));
      ctx.restore();
    });
    // the body, tail, neck and head (and the near legs) are outlined together, then filled together, so they read as one dino
    const nearLegs = [[-34, legSw(0)], [30, legSw(1)]];
    ctx.strokeStyle = INK; ctx.lineWidth = lw * 2;
    ctx.stroke(D.tail); ctx.stroke(D.body); ctx.stroke(D.neck);
    const hs = o.grown ? 0.82 : 1; // grown-ups get a smaller head
    const headT = () => { ctx.translate(40, -118); ctx.scale(hs, hs); ctx.translate(-40, 118); };
    ctx.save(); headT(); ctx.stroke(D.head); ctx.restore();
    if (!sit) for (const [lx, sw] of nearLegs) { ctx.save(); ctx.translate(lx, 0); ctx.rotate(sw); ctx.stroke(D.leg); ctx.restore(); }
    const bodyG = vgradL(-150, -20, mix(pal.body, '#ffffff', 0.2), mix(pal.body, pal.dark, 0.25));
    ctx.fillStyle = bodyG; ctx.fill(D.tail); ctx.fill(D.body); ctx.fill(D.neck);
    if (!sit) for (const [lx, sw] of nearLegs) { ctx.save(); ctx.translate(lx, 0); ctx.rotate(sw); ctx.fillStyle = vgradL(-46, 0, pal.body, mix(pal.body, pal.dark, 0.35)); ctx.fill(D.leg); ctx.restore(); }
    ctx.save(); headT(); ctx.fillStyle = vgradL(-212, -118, mix(pal.body, '#ffffff', 0.25), pal.body); ctx.fill(D.head); ctx.restore();
    // cream belly and darker spots, kept inside the body
    ctx.save(); ctx.clip(D.body);
    ctx.fillStyle = pal.belly; ellipse(20, -46, 50, 34, -0.15);
    ctx.strokeStyle = mix(pal.belly, '#c8a070', 0.4); ctx.lineWidth = lw * 0.7;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(20, -46, 50 - i * 0, 34, -0.15, Math.PI * (0.62 + i * 0.12), Math.PI * (0.7 + i * 0.12)); ctx.stroke(); }
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-14 + i * 14, -78 + i * 2); ctx.quadraticCurveTo(-8 + i * 14, -60, -12 + i * 14, -30); ctx.stroke(); }
    ctx.fillStyle = pal.dark;
    for (const [sx, sy, r] of [[-40, -96, 9], [-18, -114, 7], [-50, -70, 6], [8, -122, 6], [-26, -82, 5], [28, -112, 5]]) { ellipse(sx, sy, r, r * 0.8, 0.4); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-6, -124, 30, 6, -0.1);
    ctx.restore();
    ctx.save(); ctx.clip(D.tail); ctx.fillStyle = pal.dark; ellipse(-96, -58, 6, 4.5, 0.4); ellipse(-118, -40, 4, 3, 0.4); ctx.restore();
    // toes on the near feet
    if (!sit) for (const [lx, sw] of nearLegs) { ctx.save(); ctx.translate(lx, 0); ctx.rotate(sw); dinoFoot(pal, look.feet, lw); ctx.restore(); }
    else for (const fx of [-30, 40]) { inkEllipse(fx, -10, 22, 10, 0, mix(pal.body, pal.dark, 0.2), lw); ctx.save(); ctx.translate(fx + 6, 8); dinoFoot(pal, look.feet, lw, true); ctx.restore(); }

    dinoTailAcc(look.tail, t, lw);
    dinoBackAcc(look.back, t, lw);
    // tiny arm (the near one)
    ctx.save(); ctx.translate(58, -84); ctx.rotate(o.moving ? Math.sin(t * 11) * 0.3 : -0.2 + Math.sin(t * 2) * 0.05);
    ink(D.arm, mix(pal.body, pal.dark, 0.12), lw);
    ctx.fillStyle = '#ffffff'; for (const [cx, cy] of [[0, 20], [6, 19], [10, 15]]) circle(cx, cy, 1.6);
    ctx.restore();
    dinoNeckAcc(look.neck, t, lw);

    ctx.save(); headT();
    // head spots and a shine
    ctx.save(); ctx.clip(D.head);
    ctx.fillStyle = pal.dark; ellipse(30, -184, 6, 5); ellipse(44, -198, 4.5, 3.6); ellipse(22, -164, 4, 3.2);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(60, -200, 22, 5, -0.1);
    ctx.restore();
    dinoFace(mood, t, lw, o);
    dinoHeadAcc(look.head, t, lw);
    ctx.restore();
  } finally {
    ctx.restore();
    INK = outerInk;
  }
}
function dinoLeg(lx, sw, col, pal, feet, lw) {
  ctx.save(); ctx.translate(lx, 0); ctx.rotate(sw);
  ink(D.leg, col, lw);
  dinoFoot({ ...pal, body: col }, feet, lw);
  ctx.restore();
}
// boots, socks, or three little toenails
function dinoFoot(pal, feet, lw, sitting) {
  if (feet === 'd_boots' || feet === 'd_goldboots') {
    const gold = feet === 'd_goldboots';
    const c = gold ? '#ffc83d' : '#ffd23f';
    ink(P2('M-18,-20 L18,-20 L19,-2 C22,-2 26,0 26,2 L-18,2 Z'), vgradL(-20, 2, mix(c, '#ffffff', 0.3), gold ? '#e09a10' : '#f0b020'), lw);
    dinoRect(-20, -24, 40, 8, gold ? '#fff2b0' : '#ff8f8a', lw * 0.5, 4);
    if (gold) star(4, -10, 4, '#ffffff', 4);
    return;
  }
  if (feet === 'd_socks') {
    ctx.save(); ctx.clip(D.leg);
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#ff8fc8'; ctx.fillRect(-20, -30 + i * 7, 40, 7); }
    ctx.restore();
  }
  if (sitting) return;
  for (const tx of [-6, 4, 14]) inkEllipse(tx, -3, 4, 3, 0, '#fff6e0', lw * 0.4);
}
function dinoRect(x, y, w, h, fill, lw, r = 6) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.strokeStyle = INK; ctx.lineWidth = lw * 2; ctx.stroke();
  ctx.fillStyle = fill; ctx.fill();
}
function dinoFace(mood, t, lw, o) {
  const ex = 72, ey = -170;
  const blink = mood !== 'scared' && ((t + 1.3) % 4.1) < 0.12;
  const lid = '#24402e';
  // rosy cheek
  const bl = ctx.createRadialGradient(92, -146, 1, 92, -146, 14);
  bl.addColorStop(0, 'rgba(255,120,150,.55)'); bl.addColorStop(1, 'rgba(255,120,150,0)');
  ctx.fillStyle = bl; ellipse(92, -146, 14, 9);
  // two little nostrils
  ctx.fillStyle = mix(INK, '#000000', 0.2); ellipse(128, -156, 2, 2.6, 0.4); ellipse(120, -158, 1.4, 2, 0.4);
  if (mood === 'joy' || mood === 'sleepy' || blink) {
    ctx.strokeStyle = lid; ctx.lineWidth = lw * 1.7;
    ctx.beginPath();
    if (mood === 'joy') ctx.arc(ex, ey + 6, 10, Math.PI * 1.15, Math.PI * 1.85);
    else ctx.arc(ex, ey - 2, 10, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  } else {
    const big = mood === 'scared' || mood === 'wow' ? 1.12 : 1;
    ctx.fillStyle = '#ffffff'; ellipse(ex, ey, 13 * big, 15 * big);
    ctx.strokeStyle = lid; ctx.lineWidth = lw; ctx.beginPath(); ctx.ellipse(ex, ey, 13 * big, 15 * big, 0, 0, Math.PI * 2); ctx.stroke();
    const pr = mood === 'scared' ? 0.72 : 1;
    const g = ctx.createLinearGradient(0, ey - 12, 0, ey + 12);
    g.addColorStop(0, '#2a4a20'); g.addColorStop(0.6, '#6a9a3a'); g.addColorStop(1, '#c8e070');
    ctx.fillStyle = g; ellipse(ex + 2, ey + 1, 10 * big * pr, 12.5 * big * pr);
    ctx.fillStyle = '#10200c'; ellipse(ex + 2.5, ey + 1, 5 * big * pr, 6.5 * big * pr);
    ctx.fillStyle = '#ffffff'; circle(ex + 5.5, ey - 5, 4.8 * pr + 0.6); circle(ex - 2, ey + 6, 2.2);
    star(ex - 3, ey - 5, 2, '#ffffff');
    if (mood === 'sad' || mood === 'scared') {
      // worried brow, raised toward the middle
      ctx.strokeStyle = lid; ctx.lineWidth = lw * 1.1;
      ctx.beginPath(); ctx.moveTo(ex - 12, ey - 18); ctx.quadraticCurveTo(ex - 2, ey - 26, ex + 10, ey - 24); ctx.stroke();
    }
    if (mood === 'sad') { ctx.fillStyle = 'rgba(130,200,255,.9)'; ellipse(ex - 5, ey + 19, 2.8, 4); }
    if (mood === 'scared') {
      // a little sweat drop
      ctx.fillStyle = 'rgba(160,220,255,.95)';
      ctx.beginPath(); ctx.moveTo(28, -196); ctx.quadraticCurveTo(22, -184, 28, -182); ctx.quadraticCurveTo(34, -184, 28, -196); ctx.fill();
    }
  }
  // mouth along the snout
  ctx.strokeStyle = lid; ctx.lineWidth = lw * 1.1;
  const chomp = o.chomp || 0;
  if (chomp > 0.05) {
    const h = 4 + chomp * 12;
    ctx.beginPath(); ctx.moveTo(92, -132); ctx.quadraticCurveTo(112, -132 + h * 1.3, 132, -136); ctx.quadraticCurveTo(112, -134 - h * 0.2, 92, -132); ctx.closePath();
    ctx.fillStyle = '#a03a50'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff8aa0'; ellipse(110, -129 + h * 0.5, 9, h * 0.25 + 1);
    ctx.fillStyle = '#ffffff'; tri(100, -132, 104, -132, 102, -128); tri(118, -133, 122, -133, 120, -129);
  } else if (mood === 'sad') {
    ctx.beginPath(); ctx.moveTo(98, -126); ctx.quadraticCurveTo(110, -134, 122, -128); ctx.stroke();
  } else if (mood === 'scared') {
    ctx.beginPath(); ctx.moveTo(96, -128);
    for (let i = 1; i <= 6; i++) ctx.lineTo(96 + i * 5, -128 + (i % 2 ? -3 : 1));
    ctx.stroke();
  } else if (mood === 'wow') {
    ctx.fillStyle = '#a03a50'; ellipse(112, -130, 5, 6);
  } else if (mood === 'joy') {
    ctx.beginPath(); ctx.moveTo(94, -134); ctx.quadraticCurveTo(112, -116, 130, -138); ctx.closePath();
    ctx.fillStyle = '#a03a50'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff8aa0'; ellipse(113, -127, 7, 3);
  } else {
    ctx.beginPath(); ctx.moveTo(94, -134); ctx.quadraticCurveTo(110, -124, 128, -136); ctx.stroke();
  }
}
function dinoWings(t, lw, behind) {
  const flap = Math.sin(t * 6) * 0.15;
  const g = ctx.createLinearGradient(-70, -60, 0, 0);
  g.addColorStop(0, '#ffe0f0'); g.addColorStop(0.5, '#c6e8ff'); g.addColorStop(1, '#fff6c8');
  inkAt(-6, -126, -0.25 - flap, D.wing, g, lw);
  if (!behind) return;
  ctx.save(); ctx.translate(-6, -126); ctx.rotate(-0.25 - flap);
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(-6, -4); ctx.quadraticCurveTo(-34, -32, -64, -48); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-34, -12, -50, -22); ctx.stroke();
  ctx.restore();
}
function dinoBackAcc(b, t, lw) {
  if (b === 'd_backpack') {
    ctx.save(); ctx.translate(-26, -118); ctx.rotate(-0.2);
    dinoRect(-26, -10, 52, 48, '#ff7a4a', lw, 12);
    dinoRect(-24, -12, 48, 18, '#ff9a6a', lw * 0.8, 9);
    dinoRect(-12, 16, 24, 16, '#ffb38a', lw * 0.6, 5);
    inkCircle(0, 4, 3.5, '#ffd23f', lw * 0.5);
    ctx.restore();
    // a strap across his chest
    ctx.strokeStyle = INK; ctx.lineWidth = lw * 2 + 6; ctx.beginPath(); ctx.moveTo(-6, -126); ctx.quadraticCurveTo(30, -110, 46, -84); ctx.stroke();
    ctx.strokeStyle = '#e8603a'; ctx.lineWidth = 6; ctx.stroke();
  }
  if (b === 'd_blanket' || b === 'd_starcape') {
    const night = b === 'd_starcape';
    ink(D.cape, vgradL(-146, -76, night ? '#3a3590' : '#ffb3d6', night ? '#221f5c' : '#ff8fc0'), lw);
    ctx.save(); ctx.clip(D.cape);
    if (night) [[-40, -110], [-14, -126], [12, -100], [-30, -88], [30, -118]].forEach(([x, y], i) => star(x, y, 4 + (i % 2) * 2, `rgba(255,250,200,${0.6 + 0.4 * Math.sin(t * 3 + i)})`, 5));
    else {
      // patchwork squares
      const cols = ['#ffd23f', '#8ad4ff', '#c6a2ff', '#a6f0b8'];
      for (let i = 0; i < 6; i++) { ctx.fillStyle = cols[i % 4]; ctx.fillRect(-56 + i * 18, -128 + (i % 2) * 22, 14, 14); }
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-58, -96); ctx.bezierCurveTo(-30, -84, 10, -84, 44, -112); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.restore();
    // a little clasp at the neck
    if (night) vecStar(46, -118, 7, '#ffe36b', lw * 0.6); else inkCircle(46, -118, 5, '#ffd23f', lw * 0.6);
  }
  if (b === 'd_wings') dinoWings(t, lw, false);
}
function dinoNeckAcc(n, t, lw) {
  const arc = k => [lerp(26, 70, k), -116 + Math.sin(k * Math.PI) * 10 + k * 6];
  if (n === 'd_bandana') {
    ink(P2('M26,-122 C40,-112 60,-108 72,-112 L60,-86 Z'), '#e8383a', lw);
    ctx.fillStyle = '#ffffff'; for (const [x, y] of [[44, -110], [56, -104], [52, -94], [38, -116]]) circle(x, y, 2);
    inkCircle(24, -124, 5, '#e8383a', lw * 0.7);
  }
  if (n === 'd_shells') for (let i = 0; i < 5; i++) { const [x, y] = arc(i / 4); shell(x, y, 7, 0.2, lw); }
  if (n === 'd_scarf') {
    // a thick stripy scarf, with an end fluttering back
    const f = Math.sin(t * 5) * 4;
    ink(P2(`M28,-128 C10,-120 -8,${-112 + f} -24,${-104 + f} L-20,${-92 + f} C-4,${-100 + f} 14,-110 30,-114 Z`), '#5fb8f0', lw);
    ink(P2('M22,-130 C40,-112 62,-108 78,-114 L80,-100 C60,-92 36,-98 18,-116 Z'), '#ff6fb5', lw);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; for (const k of [0.3, 0.6]) { const [x, y] = arc(k); ctx.beginPath(); ctx.moveTo(x - 3, y - 8); ctx.lineTo(x + 3, y + 8); ctx.stroke(); }
  }
  if (n === 'd_medal') {
    ctx.strokeStyle = '#40a0e0'; ctx.lineWidth = lw * 2.4;
    ctx.beginPath(); ctx.moveTo(30, -122); ctx.lineTo(56, -98); ctx.lineTo(74, -116); ctx.stroke();
    inkCircle(56, -92, 10, '#ffc83d', lw * 0.8);
    star(56, -92, 6, '#fff6c8', 5);
    star(66, -104, 2.5 + Math.sin(t * 6) * 1.2, '#ffffff');
  }
}
function dinoTailAcc(tl, t, lw) {
  if (tl === 'd_tailbow') bow(-96, -60, 13, '#ff5fa2', lw, 0.5);
  if (tl === 'd_bell') { ctx.strokeStyle = '#ff5fa2'; ctx.lineWidth = lw * 2; ctx.beginPath(); ctx.moveTo(-100, -58); ctx.lineTo(-100, -42); ctx.stroke(); inkCircle(-100, -36 + Math.sin(t * 8) * 1.5, 8, '#ffc83d', lw * 0.8); ctx.fillStyle = '#7a5010'; circle(-100, -32 + Math.sin(t * 8) * 1.5, 2); }
  if (tl === 'd_comet') {
    ['#ff6f3a', '#ffd23f', '#ff8fc8'].forEach((c, i) => {
      ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-126, -30);
      for (let k = 1; k <= 6; k++) ctx.lineTo(-126 - k * 9, -30 + i * 6 - 6 + Math.sin(t * 7 + k + i) * 4);
      ctx.stroke();
    });
    vecStar(-128, -32, 8, '#ffe36b', lw * 0.6);
  }
}
function dinoHeadAcc(h, t, lw) {
  if (h === 'd_flowers') [[24, -186, '#ff9ec7'], [38, -202, '#fff'], [56, -210, '#ffe36b'], [76, -208, '#ff9ec7'], [94, -198, '#fff']].forEach(([x, y, c]) => flower(x, y, 8, c, c === '#ffe36b' ? '#ff9a3d' : '#ffd84a', lw));
  if (h === 'd_beanie') {
    ink(P2('M20,-186 C22,-226 100,-232 104,-190 Z'), '#7ac8f0', lw);
    ctx.save(); ctx.clip(P2('M20,-186 C22,-226 100,-232 104,-190 Z')); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(26 + i * 11, -186); ctx.lineTo(30 + i * 11, -230); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.translate(62, -188); ctx.rotate(0.03); dinoRect(-46, -6, 92, 12, '#ff6fb5', lw * 0.8, 6); ctx.restore();
    curlPuff(64, -228, 10, '#ffffff', lw * 0.7);
  }
  if (h === 'd_explorer') {
    inkEllipse(62, -194, 52, 10, 0.06, '#d8b070', lw);
    ink(P2('M32,-196 C30,-232 94,-234 92,-194 Z'), '#e8c888', lw);
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(32, -206, 60, 8);
    ctx.save(); ctx.translate(84, -210); ctx.rotate(0.6); ink(P2('M0,0 C4,-14 10,-26 6,-34 C0,-24 -4,-12 0,0 Z'), '#ff6f9a', lw * 0.6); ctx.restore();
  }
  if (h === 'd_crown') {
    ctx.save(); ctx.translate(62, -208); ctx.rotate(0.1);
    const g = ctx.createLinearGradient(0, -24, 0, 4); g.addColorStop(0, '#fff6c8'); g.addColorStop(1, '#e8b830');
    ink(P2('M-24,4 L-26,-16 L-14,-6 L-6,-24 L0,-8 L6,-24 L14,-6 L26,-16 L24,4 Z'), g, lw * 0.8);
    inkCircle(0, -4, 4, '#ff5fa2', lw * 0.5); inkCircle(-13, -2, 2.6, '#40b0ff', lw * 0.4); inkCircle(13, -2, 2.6, '#3fdc7a', lw * 0.4);
    star(-6, -28, 3 + Math.sin(t * 6) * 1.5, '#fff');
    ctx.restore();
  }
}

// --- either pet -------------------------------------------------------------------------
// look: the pet's look (petLook() if left out). For the dino, unicorn looks are ignored.
function drawPet(x, y, s, look, o = {}) {
  if (isDino()) {
    const mood = o.mood === 'sleep' ? 'sleepy' : o.mood === 'happy' ? undefined : o.mood;
    return drawBabyDino(x, y, s, look && 'feet' in look ? look : dinoLook(), { ...o, mood });
  }
  return drawUnicorn(x, y, s, look || uniLook(), o);
}
// curled up in his little nest; quilt 0..1 is Aubrey laying the blanket over him (it floats in from her
// hands at (fromX, fromY), unfolds, and settles over him up to his chin)
const NEST_TWIGS = [...Array(26)].map((_, i) => [Math.sin(i * 12.9898) * 0.5 + 0.5, Math.sin(i * 78.233) * 0.5 + 0.5, Math.sin(i * 3.7)]);
function drawDinoTucked(x, y, s, quilt = 1, o = {}) {
  const k = easeOut(clamp(quilt, 0, 1));
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // the nest's hollow, lined with soft straw
  ctx.fillStyle = 'rgba(40,20,10,.25)'; ellipse(0, 8, 150, 22);
  ink(P2('M-150,-44 C-150,-80 150,-80 150,-44 C150,-14 -150,-14 -150,-44 Z'), '#7a5030', 2.2);
  ctx.fillStyle = '#f2d08a'; ellipse(0, -46, 132, 22);
  ctx.strokeStyle = '#d8a850'; ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { const a = -2.6 + i * 0.44; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 30, -30 + Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 104, -30 + Math.sin(a) * 17); ctx.stroke(); }
  ctx.restore();
  // him, curled up: sitting low in the nest, so the rim hides his legs and tummy
  drawBabyDino(x - 6 * s, y - 2 * s, s * 0.92, dinoLook(), { facing: 1, pose: 'sit', mood: o.mood || 'sleepy' });
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // the woven front rim of twigs, over him (and over the blanket's edge, so it looks tucked in)
  const nestRim = () => {
    const rim = P2('M-156,-46 C-162,-6 -120,34 0,36 C120,34 162,-6 156,-46 C120,-30 60,-24 0,-24 C-60,-24 -120,-30 -156,-46 Z');
    ink(rim, '#a8743e', 2.6);
    ctx.save(); ctx.clip(rim);
    for (const [a, b, c] of NEST_TWIGS) { ctx.strokeStyle = c > 0 ? '#8a5a2c' : '#d4a060'; ctx.lineWidth = 3.5; ctx.beginPath(); const x0 = -160 + a * 320, y0 = -36 + b * 66; ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + 20, y0 - 10 + c * 6, x0 + 46 + c * 20, y0 - 4 + c * 10); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,230,170,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-140, -38); ctx.quadraticCurveTo(0, -18, 140, -38); ctx.stroke();
    ctx.restore();
    for (const [dx, dy] of [[-150, -44], [118, -40], [146, -30], [-60, 32]]) { ctx.strokeStyle = '#8a5a2c'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + 16, dy - 14); ctx.stroke(); }
  };
  // his tail curls round over the front of the nest
  ctx.strokeStyle = OL; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(-110, -40); ctx.quadraticCurveTo(-70, -10, 0, -22); ctx.stroke();
  ctx.strokeStyle = '#7fd88a'; ctx.lineWidth = 17; ctx.stroke();
  nestRim();
  // the blanket: folded small in Aubrey's hands, floating over, opening out, then lying over him
  if (k > 0) {
    const fx = o.fromX != null ? (o.fromX - x) / s : -250, fy = o.fromY != null ? (o.fromY - y) / s : -120;
    const bx = lerp(fx, 0, k), by = lerp(fy, -6, k) - Math.sin(k * Math.PI) * 70, w = lerp(0.3, 1, k), sag = Math.sin(S.t * 1.2) * 1.5 * k;
    ctx.save(); ctx.translate(bx, by); ctx.scale(w, lerp(0.5, 1, k));
    const q = P2(`M-132,-6 C-130,-70 -84,-96 -30,-100 C20,-104 70,-96 104,-74 C122,-50 128,-26 132,-6 C110,${10 + sag} 80,${4 - sag} 50,${12 + sag} C20,${4 + sag} -10,${12 - sag} -40,${6 + sag} C-70,${12 - sag} -100,${4 + sag} -132,-6 Z`);
    ink(q, '#ffb3d6', 2.4, '#a04a7a');
    ctx.save(); ctx.clip(q);
    const cols = ['#ffd23f', '#8ad4ff', '#c6a2ff', '#a6f0b8', '#ff8fc8'];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 10; c++) { ctx.fillStyle = cols[(r + c) % 5]; ctx.globalAlpha = 0.7; ctx.fillRect(-134 + c * 27 + 3, -104 + r * 24 + 3, 21, 18); }
    ctx.globalAlpha = 1;
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.6;
    for (let r = 1; r < 5; r++) { ctx.beginPath(); ctx.moveTo(-140, -104 + r * 24); ctx.lineTo(140, -104 + r * 24); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.restore();
    ctx.restore();
    if (k > 0.85) nestRim();
  }
  ctx.restore();
  // once the blanket is on, his sleepy head pokes out over the top of it
  if (k >= 1) drawDinoHeadOnly(x - 6 * s, y - 2 * s, s * 0.92, o.mood || 'sleepy');
}
// redraws just the top of him (head and neck) so it sits over the blanket
function drawDinoHeadOnly(x, y, s, mood) {
  ctx.save(); ctx.beginPath(); ctx.rect(x - 260 * s, y - 400 * s, 520 * s, 300 * s); ctx.clip();
  drawBabyDino(x, y, s, dinoLook(), { facing: 1, pose: 'sit', mood });
  ctx.restore();
}

// --- the shed at night (dino route): feed him, dress him up, cuddle him, and help him sleep ---
const DN = { x: 390, y: 492, s: 1.1 };
const DN_FOODS = [['🫐', 'berries'], ['🥬', 'leaves'], ['🥪', 'a sandwich'], ['🍎', 'an apple'], ['🍌', 'a banana']];
const DN_STEPS = [['feed', '🍓', 'Feed him'], ['dress', '🎀', 'Dress up'], ['cuddle', '🤗', 'Cuddle'], ['sleep', '🌙', 'Bedtime']];
const DN_TUNE = [523, 523, 784, 784, 880, 880, 784, 698, 698, 659, 659, 587, 587, 523];
SCENES.dinonight = {
  enter(data = {}) {
    if (!data.resume) {
      Object.assign(this, { onDone: data.onDone || bedtime, done: {}, mode: 'hub', calm: 0, full: 0, pic: false });
      speak(`Night ${S.day} in the shed. ${S.name} is so happy to see you! First, let's feed him.`);
    } else {
      this.mode = 'hub';
      this.done.dress = true;
      speak(this.hint());
    }
    this.t = 0; this.chomp = 0; this.hold = null; this.ending = 0;
  },
  next() { return DN_STEPS.find(([id]) => !this.done[id] && (id !== 'sleep' || (this.done.feed && this.done.cuddle)))?.[0] || 'sleep'; },
  hint() {
    const n = this.next();
    if (n === 'feed') return `${S.name} is hungry. Feed him!`;
    if (n === 'dress') return `Make ${S.name} something cosy from your supplies.`;
    if (n === 'cuddle') return `${S.name} misses his mama. Give him a cuddle.`;
    return `It's late. Time to help ${S.name} sleep.`;
  },
  mood() {
    if (this.mode === 'sleep' && this.sleep?.hum) return 'sleepy';
    if (this.done.cuddle) return 'joy';
    if (this.mode === 'cuddle') return this.calm < 0.4 ? 'scared' : this.calm < 0.85 ? 'sad' : 'joy';
    return this.done.feed ? 'sad' : 'scared';
  },
  start(id) {
    SFX.pick();
    if (id === 'dress') return setScene('style', { mode: 'craft', onDone: () => setScene('dinonight', { resume: true }) });
    if (id === 'sleep' && !(this.done.feed && this.done.cuddle)) { SFX.miss(); speak(`${S.name} is too ${this.done.feed ? 'worried' : 'hungry'} to sleep yet!`); floatText(780, 440, this.done.feed ? 'Cuddle him first!' : 'Feed him first!', '#ffd1ec', false, 20); return; }
    this.mode = id; this.t = 0;
    if (id === 'feed') {
      this.full = 0;
      this.foods = DN_FOODS.map(([e, name], i) => ({ e, name, hx: 600 + i * 70, hy: 470, x: 600 + i * 70, y: 470, eaten: false, fly: 0 }));
      speak(`Drag some food to ${S.name}'s mouth. Or tap it!`);
    }
    if (id === 'cuddle') { this.calm = 0; this.pic = false; speak(`${S.name} is scared. Hold your finger on him and give him gentle pets.`); }
    if (id === 'sleep') { this.sleep = { tuck: 0, tucked: false, hum: false, humT: 0, dim: 0, dimmed: false }; speak('Tuck him in, hum a lullaby, and dim the lantern.'); }
  },
  finish(id) {
    this.done[id] = true; this.mode = 'hub'; SFX.sparkle();
    burst(DN.x + 20, DN.y - 150, 26, { colors: ['#a6f0b8', '#fff6a8', '#ffb3e0'] });
    speak(this.hint());
  },
  update(dt) {
    this.t += dt;
    this.chomp = Math.max(0, this.chomp - dt * 2.2);
    if (this.mode === 'hub') {
      const id = clickedButton();
      if (id?.startsWith('step:')) return this.start(id.slice(5));
      if (advancePressed()) return this.start(this.next());
      return;
    }
    if (this.mode === 'feed') return this.updateFeed(dt);
    if (this.mode === 'cuddle') return this.updateCuddle(dt);
    if (this.mode === 'sleep') return this.updateSleep(dt);
  },
  mouth() { return [DN.x + 112 * DN.s, DN.y - 132 * DN.s]; },
  updateFeed(dt) {
    const [mx, my] = this.mouth();
    if (this.full >= 3) { if (this.t > 1.6) this.finish('feed'); return; }
    const eat = f => {
      f.eaten = true; this.full++; this.chomp = 1; this.t = 0;
      [0, 0.16, 0.32].forEach(w => tone(rand(180, 240), 0.08, 'square', 0.05, w));
      burst(mx, my, 10, { colors: ['#a6f0b8', '#ffd23f', '#ff8fc8'], spread: 90, up: 20, size: [2, 5] });
      floatText(mx, my - 80, pick(['Yum!', 'Chomp chomp!', 'Mmm!']), '#fff6a8', false, 26);
      if (this.full >= 3) { speak(`${S.name}'s tummy is full!`); SFX.fanfare(); } else speak(`${S.name} loves ${f.name}!`);
    };
    for (const f of this.foods) if (f.fly > 0 && !f.eaten) {
      f.fly = Math.min(1, f.fly + dt * 2.6);
      f.x = lerp(f.hx, mx, easeOut(f.fly)); f.y = lerp(f.hy, my, easeOut(f.fly)) - Math.sin(f.fly * Math.PI) * 90;
      if (f.fly >= 1) eat(f);
    }
    // number keys toss a food straight to him
    this.foods.forEach((f, i) => { if (pressed[String(i + 1)] && !f.eaten && !f.fly) f.fly = 0.01; });
    if (pressed[' '] || pressed.enter) { const f = this.foods.find(q => !q.eaten && !q.fly); if (f) f.fly = 0.01; }
    if (pointer.clicked && !this.hold) {
      const f = this.foods.find(q => !q.eaten && !q.fly && Math.hypot(pointer.x - q.x, pointer.y - q.y) < 38);
      if (f) { this.hold = { f, t: 0, sx: pointer.x, sy: pointer.y }; SFX.click(); }
    }
    if (this.hold) {
      const { f } = this.hold;
      this.hold.t += dt;
      f.x = pointer.x; f.y = pointer.y;
      const near = Math.hypot(f.x - mx, f.y - my);
      if (near < 150) this.chomp = Math.max(this.chomp, 0.6);
      if (!pointer.down) {
        const tap = this.hold.t < 0.35 && Math.hypot(pointer.x - this.hold.sx, pointer.y - this.hold.sy) < 14;
        if (near < 80) eat(f);
        else if (tap) { f.x = f.hx; f.y = f.hy; f.fly = 0.01; }
        else { f.x = f.hx; f.y = f.hy; }
        this.hold = null;
      }
    }
  },
  updateCuddle(dt) {
    if (this.calm >= 1) {
      if (!this.pic) {
        this.pic = true;
        say([
          ['aubrey', 'happy', `Shh, shh. It's okay, ${S.name}. I'm right here.`],
          ['aubrey', 'excited', 'Look! I drew you a picture of your mama!'],
          ['dino', 'joy', '*a happy little squeak* ...Mama!'],
          ['narrator', null, `${S.name} hugs the picture tight. He knows he'll see her again soon.`],
        ], () => this.finish('cuddle'));
      }
      return;
    }
    const onHim = pointer.down && pointer.x > DN.x - 150 && pointer.x < DN.x + 170 && pointer.y > DN.y - 250 && pointer.y < DN.y;
    const rubbing = onHim && (Math.abs(pointer.x - (this.px ?? pointer.x)) + Math.abs(pointer.y - (this.py ?? pointer.y)) > 1);
    this.px = pointer.x; this.py = pointer.y;
    if (onHim || keys[' '] || keys.enter) {
      this.calm = Math.min(1, this.calm + dt * (rubbing ? 0.42 : 0.28));
      this.heartT = (this.heartT || 0) - dt;
      if (this.heartT <= 0) {
        this.heartT = 0.22;
        const hx = onHim ? pointer.x : DN.x + rand(-60, 90), hy = onHim ? pointer.y : DN.y - rand(120, 200);
        floatText(hx + rand(-20, 20), hy - 20, pick(['♥', '♥', '✿']), pick(['#ff6fb5', '#ff8fc8', '#ffb3e0']), false, 30);
        tone(rand(600, 800), 0.1, 'sine', 0.04);
      }
    }
  },
  updateSleep(dt) {
    const z = this.sleep;
    if (z.tucked) z.tuck = Math.min(1, z.tuck + dt * 0.9); // the blanket floats over from Aubrey and settles on him
    if (z.hum) z.humT += dt;
    if (z.dimmed) z.dim = Math.min(0.62, z.dim + dt * 0.6);
    const all = z.tucked && z.humT > 3.4 && z.dimmed;
    if (all) {
      this.ending += dt;
      if (Math.random() < dt * 2) floatText(DN.x + 140 + rand(-10, 10), DN.y - 170, pick(['z', 'Z', 'z z']), '#ffffff', false, rand(22, 34));
      if (this.ending > 1 && (clickedButton() === 'goodnight' || advancePressed())) { this.done.sleep = true; SFX.sparkle(); return this.onDone(); }
      return;
    }
    const id = clickedButton();
    const tuck = id === 'tuck' || (pointer.clicked && !id && Math.abs(pointer.x - DN.x) < 150 && pointer.y > DN.y - 200 && pointer.y < DN.y + 20);
    if (tuck && !z.tucked) { z.tucked = true; SFX.pop(); speak('Snug as a bug!'); }
    if (id === 'hum' && !z.hum) {
      z.hum = true; z.humT = 0;
      DN_TUNE.forEach((f, i) => tone(f, 0.42, 'sine', 0.07, i * 0.25));
    }
    const lantern = pointer.clicked && Math.hypot(pointer.x - 540, pointer.y - 66) < 46;
    if ((id === 'dim' || lantern) && !z.dimmed) { z.dimmed = true; SFX.click(); }
    if (z.hum && z.humT < 3.4 && Math.random() < dt * 5) floatText(DN.x - 200 + rand(-20, 20), DN.y - 250, pick(['♪', '♫', '♩']), '#fff6a8', false, rand(24, 34));
  },
  draw() {
    buttons = [];
    const z = this.mode === 'sleep' ? this.sleep : null;
    drawShedInterior(z ? z.dim : 0.08);
    if (z) {
      // a moonbeam from the window once the lantern is low
      if (z.dim > 0) { ctx.fillStyle = `rgba(200,220,255,${z.dim * 0.35})`; ctx.beginPath(); ctx.moveTo(90, 70); ctx.lineTo(230, 70); ctx.lineTo(DN.x + 160, 500); ctx.lineTo(DN.x - 140, 500); ctx.closePath(); ctx.fill(); }
      drawDinoTucked(DN.x + 30, DN.y, DN.s * 0.95, z.tucked ? z.tuck : 0, { mood: z.tucked || z.hum ? 'sleepy' : 'sad', fromX: 200, fromY: 360 });
    } else {
      drawBabyDino(DN.x, DN.y, DN.s, dinoLook(), { facing: 1, mood: this.mood(), chomp: this.chomp, glow: this.done.cuddle ? 0.4 : 0 });
    }
    if (this.mode !== 'feed') drawAubrey(150, 500, 'idle_front', 1, 0, 0.74);
    // header
    darkPanel(12, 12, 360, 46, 23);
    emoji('🛖', 36, 35, 22);
    text(`Night ${S.day} · in the shed`, 58, 35, 19, '#fff', 'left', 700);
    if (this.mode === 'hub') this.drawHub();
    if (this.mode === 'feed') this.drawFeed();
    if (this.mode === 'cuddle') this.drawCuddle();
    if (z) this.drawSleep(z);
    drawFx(false);
  },
  drawHub() {
    darkPanel(12, 66, 360, 40, 18);
    text(this.hint(), 26, 86, 15, '#fff6a8', 'left', 600);
    const next = this.next();
    panel(616, 76, 332, 400, 22);
    outlined(`${S.name}'s night`, 782, 108, 24, '#ff6fb5', 'center', '#fff');
    DN_STEPS.forEach(([id, icon, label], i) => {
      const y = 136 + i * 82, on = id === next && !dlg;
      const ok = id !== 'sleep' || (this.done.feed && this.done.cuddle);
      if (on) { ctx.fillStyle = `rgba(255,230,120,${0.35 + 0.25 * Math.sin(S.t * 5)})`; ctx.beginPath(); ctx.roundRect(630, y - 6, 304, 76, 20); ctx.fill(); }
      button(`step:${id}`, 638, y, 288, 64, label, { icon, color: this.done[id] ? '#5fb87a' : ok ? ['#ff8a5a', '#ff6fb5', '#9a6ae0', '#4a6ad0'][i] : '#b9aac4', size: 22, key: String(i + 1) });
      if (this.done[id]) emoji('✅', 896, y + 32, 26);
    });
    drawMats(12, H - 52, 360, 2);
  },
  drawFeed() {
    darkPanel(12, 66, 400, 40, 18);
    text(`Drag food to ${S.name}'s mouth (or tap it)`, 26, 86, 15, '#fff6a8', 'left', 600);
    // tummy meter
    darkPanel(W - 200, 12, 188, 46, 23);
    text('Tummy', W - 186, 35, 16, '#fff', 'left', 700);
    for (let i = 0; i < 3; i++) heart(W - 104 + i * 32, 30, 22, i < this.full ? '#ff6fb5' : 'rgba(255,255,255,.3)');
    // a basket of food on the floor
    ink(P2('M570,452 L930,452 L912,520 L588,520 Z'), '#c8904a', 1.5, '#6a4228');
    ctx.strokeStyle = 'rgba(106,66,40,.5)'; ctx.lineWidth = 2;
    for (let x = 600; x < 910; x += 24) { ctx.beginPath(); ctx.moveTo(x, 456); ctx.lineTo(x + 4, 516); ctx.stroke(); }
    this.foods.forEach((f, i) => {
      if (f.eaten) return;
      const held = this.hold?.f === f;
      if (!held && !f.fly) { ctx.fillStyle = `rgba(255,250,200,${0.35 + 0.2 * Math.sin(S.t * 5 + i)})`; circle(f.x, f.y, 34); text(String(i + 1), f.x + 26, f.y + 28, 13, '#fff', 'center', 700); }
      emoji(f.e, f.x, f.y, held ? 58 : 50);
    });
  },
  drawCuddle() {
    darkPanel(12, 66, 420, 40, 18);
    text(`Hold your finger on ${S.name} and pet him gently`, 26, 86, 15, '#fff6a8', 'left', 600);
    darkPanel(W - 300, 12, 288, 46, 23);
    text('Calm', W - 286, 35, 16, '#fff', 'left', 700);
    bar(W - 230, 29, 200, 12, this.calm * 100, this.calm < 0.4 ? '#ffb15c' : this.calm < 0.85 ? '#ffd23f' : '#7be08a');
    if (pointer.down && !dlg) emoji('🤚', pointer.x, pointer.y, 44);
    if (this.pic) {
      // Aubrey's crayon drawing of his mama
      ctx.save(); ctx.translate(690, 300); ctx.rotate(0.05 + Math.sin(S.t * 2) * 0.02);
      box(-120, -110, 240, 210, 6, '#fffaf0', '#c8a070', 4);
      ctx.save(); ctx.beginPath(); ctx.rect(-110, -100, 220, 190); ctx.clip();
      ctx.fillStyle = '#e8f8ff'; ctx.fillRect(-110, -100, 220, 190);
      ctx.fillStyle = '#a6e09a'; ctx.fillRect(-110, 60, 220, 30);
      drawBabyDino(-10, 74, 0.62, {}, { facing: 1, mood: 'joy', grown: true, palette: { body: '#6cc4a0', dark: '#3f9a7a', plate: '#c6a2ff' }, t: S.t });
      drawBabyDino(70, 78, 0.3, dinoLook(), { facing: -1, mood: 'joy', t: S.t });
      heart(76, -70, 26, '#ff6fb5');
      ctx.restore();
      text('MAMA', 0, 84, 18, '#ff5fa2', 'center', 700);
      ctx.restore();
    }
  },
  drawSleep(z) {
    const all = z.tucked && z.humT > 3.4 && z.dimmed;
    darkPanel(12, 66, 420, 40, 18);
    text(all ? `Goodnight, ${S.name}. Sweet dreams!` : 'Tuck him in, hum a lullaby, and dim the lantern', 26, 86, 15, '#fff6a8', 'left', 600);
    if (all) {
      if (this.ending > 1) button('goodnight', W - 262, H - 76, 240, 58, 'Goodnight 🌙', { color: '#4a6ad0', size: 21, key: 'Enter' });
      return;
    }
    const steps = [['tuck', '🛏️', 'Tuck in', z.tucked], ['hum', '🎵', 'Hum a lullaby', z.hum && z.humT > 3.4], ['dim', '🏮', 'Dim the lantern', z.dimmed]];
    steps.forEach(([id, icon, label, ok], i) => {
      const y = 150 + i * 84;
      button(id, 640, y, 300, 66, label, { icon, color: ok ? '#5fb87a' : ['#ff6fb5', '#9a6ae0', '#e0903a'][i], size: 21, on: !ok && !(id === 'hum' && z.hum), key: String(i + 1) });
      if (ok) emoji('✅', 910, y + 33, 26);
    });
    if (!z.dimmed) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(S.t * 4); outlined('tap me', 540, 102, 14, '#fff6a8'); ctx.globalAlpha = 1; }
  },
};

// --- the journey home, and the reunion -----------------------------------------------------
// called by js/dinohop.js when Aubrey has hopped all the way along the dinosaur path
function dinoHopDone() { setScene('dinodefense'); }
// called by js/dinodefense.js at the end of the maze. result: { reunited: true/false, ... }
function dinoDefenseDone(result = {}) { setScene('dinoend', result); }

const MAMA_PAL = { body: '#6cc4a0', dark: '#3f9a7a', belly: '#fff3d6', plate: '#c6a2ff' };
const PAPA_PAL = { body: '#5aae6a', dark: '#357a48', belly: '#ffeccc', plate: '#ffa040' };
SCENES.dinoend = {
  enter(result = {}) {
    Object.assign(this, { t: 0, result, ready: false, keepsake: false, parents: false, hug: false });
    const lines = result.reunited === false ? [
      ['narrator', null, `Oh no! The big dinosaurs chased you right out of the maze. Aubrey holds ${S.name} tight...`],
      ['narrator', null, 'Then the ground goes THUMP... THUMP... THUMP. Two enormous dinosaurs come running!', () => { this.parents = true; this.pt = S.t; SFX.step(); }],
      ['dino', 'joy', '*SQUEAK SQUEAK!* MAMA! PAPA!'],
      ['narrator', null, `It's ${S.name}'s mama and papa! They heard him squeaking and came to find him.`],
    ] : [
      ['narrator', null, `You made it through the maze! At the end, under a big leafy tree, two enormous dinosaurs are waiting.`, () => { this.parents = true; this.pt = S.t; SFX.step(); }],
      ['dino', 'joy', '*SQUEAK SQUEAK!* MAMA! PAPA!'],
    ];
    say([
      ...lines,
      ['narrator', null, `${S.name} runs to them as fast as his stubby legs can go. Mama scoops him up in the biggest, gentlest hug.`, () => { this.hug = true; SFX.sparkle(); }],
      ['mamadino', null, `Thank you, thank you, little human. We looked EVERYWHERE for him.`],
      ['papadino', null, `You kept our baby safe, and fed, and warm. You're the bravest friend a dinosaur could have.`],
      ['aubrey', 'happy', `He was really brave too. Weren't you, ${S.name}?`],
      ['dino', 'joy', '*a proud little squeak*'],
      ['narrator', null, `${S.name} toddles back to Aubrey with something in his mouth: a smooth, shiny, heart-shaped stone.`, () => { this.keepsake = true; SFX.sparkle(); }],
      ['aubrey', 'laughing', "For me? I'll keep it forever. And I'll come and visit you. I PROMISE!"],
    ], () => { this.ready = true; SFX.fanfare(); });
  },
  update(dt) {
    this.t += dt;
    if (this.ready && Math.random() < dt * 3) burst(rand(100, W - 100), rand(60, 260), 20, { colors: ['#a6f0b8', '#ffe36b', '#8ad4ff', '#ff8fc8', '#fff'], spread: 120, up: 0 });
    if (!this.ready) return;
    const id = clickedButton();
    if (id === 'retry') return setScene('dinodefense');
    if (id === 'again' || (this.result.reunited !== false && (pointer.clicked || advancePressed()) && !id)) setScene('title');
  },
  draw() {
    buttons = [];
    // Dinosaur Valley at sunset
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ff9ec7'); g.addColorStop(0.55, '#ffd08a'); g.addColorStop(1, '#ffe8b0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,250,210,.9)'; circle(760, 200, 60);
    // volcano and hills
    ctx.fillStyle = '#b07a9a'; ctx.beginPath(); ctx.moveTo(560, 330); ctx.lineTo(680, 170); ctx.lineTo(720, 170); ctx.lineTo(860, 330); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(255,255,255,${0.5 - i * 0.12})`; circle(700 + Math.sin(S.t + i) * 8, 150 - i * 26 - (S.t * 8) % 20, 14 + i * 6); }
    ctx.fillStyle = '#7fbf75'; ellipse(220, 360, 380, 90); ctx.fillStyle = '#6aae64'; ellipse(800, 380, 340, 80);
    // big ferns and palm trees
    for (const [px, h] of [[60, 190], [900, 220], [420, 150]]) {
      ctx.strokeStyle = '#8a5a30'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(px, 470); ctx.quadraticCurveTo(px + 20, 470 - h / 2, px + 6, 470 - h); ctx.stroke();
      for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.55; inkEllipse(px + 6 + Math.cos(a) * 40, 470 - h + Math.sin(a) * 26 + 10, 46, 12, a, '#4fae4a', 1.4, '#2a6a2a'); }
    }
    ctx.fillStyle = '#8fd07f'; ctx.fillRect(0, 460, W, 80);
    ctx.fillStyle = '#7bbd6a'; for (let x = 0; x < W; x += 26) tri(x, 466, x + 8, 446, x + 16, 466);
    // the family
    // (dialog pauses update(), so the parents' walk-in is timed off S.t)
    const k = this.parents ? easeOut(clamp((S.t - this.pt) / 1.4, 0, 1)) : 0;
    const mx = lerp(W + 240, 650, k);
    if (this.parents) {
      drawBabyDino(lerp(W + 400, 850, k), 478, 1.6, {}, { facing: -1, grown: true, palette: PAPA_PAL, mood: 'joy', moving: k < 1 });
      drawBabyDino(mx, 492, 1.45, {}, { facing: -1, grown: true, palette: MAMA_PAL, mood: 'joy', moving: k < 1 });
    }
    // the baby runs over, then rides on his mama's back
    if (this.hug) drawBabyDino(mx + 6, 312 - Math.abs(Math.sin(S.t * 3)) * 5, 0.55, dinoLook(), { facing: -1, mood: 'joy' });
    else drawBabyDino(390, 492, 0.75, dinoLook(), { facing: 1, mood: this.parents ? 'joy' : 'scared', moving: !!this.parents });
    if (this.hug) for (let i = 0; i < 3; i++) heart(mx - 60 + Math.sin(S.t * 2 + i) * 40, 230 - ((S.t * 30 + i * 30) % 90), 18, '#ff6fb5');
    const bounce = this.ready ? Math.abs(Math.sin(S.t * 3)) * 30 : 0;
    drawAubrey(210, 500, this.ready ? 'jump' : 'idle_front', 1, bounce, 0.78);
    if (this.keepsake) { ctx.save(); ctx.translate(250, 330 - bounce); ctx.rotate(Math.sin(S.t * 2) * 0.1); heart(0, 0, 34, '#c6a2ff'); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(-6, -6, 4); ctx.restore(); }
    if (this.ready) {
      outlined('The End', W / 2, 66, 58, '#ff6fb5');
      outlined(`${S.name} is home with his mama and papa!`, W / 2, 120, 24, '#fff');
      if (this.result.reunited === false) {
        button('retry', 20, 150, 250, 50, 'Try the maze again', { icon: '🛡️', color: '#e0903a', size: 16 });
        button('again', 20, 210, 250, 50, 'Play again', { icon: '🏠', color: '#9a6ae0', size: 16 });
      } else outlined('Thanks for playing! Click to play again.', W / 2, 160, 18, '#fff6a8');
    }
    drawFx(false);
  },
};
