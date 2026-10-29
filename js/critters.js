'use strict';
// The side characters you meet at each place: cartoon critters built from one body kit
// (body shape, head, ears, nose, arms, legs, tail, wings) plus a goofy face and a silly prop each.
// Drawn facing right with the origin at their feet, about 200px tall at scale 1.

const crTime = () => (typeof S !== 'undefined' && S ? S.t : 0);
const crLine = col => mix(col, '#1a0830', 0.55);
// they bounce and flap their mouths while their dialog line is still typing out
const crTalking = name => !!(dlg && dlg.lines[dlg.i][0] === name && dlg.chars < dlg.lines[dlg.i][2].length);

// --- layout -----------------------------------------------------------------------------------
function crLayout(sp) {
  const lh = sp.legs === 'none' || sp.legs === 'tail' ? 0 : (sp.lh ?? 16);
  const bw = sp.bw ?? 40, bh = sp.bh ?? 70, hr = sp.hr ?? 42;
  const by = -lh - bh / 2;
  const hx = sp.hx ?? 6, hy = -lh - bh - hr * 0.55 - (sp.neck || 0);
  const F = { x: hx, y: hy, r: hr };
  return { lh, bw, bh, hr, by, hx, hy, F, top: hy - hr };
}
// special bodies keep the face on the body itself
const CR_FRAMES = {
  star: () => ({ F: { x: 0, y: -112, r: 42 }, top: -180 }),
  box: () => ({ F: { x: 4, y: -150, r: 34 }, top: -190 }),
  fish: () => ({ F: { x: 30, y: -112, r: 34 }, top: -150 }),
  octo: () => ({ F: { x: 6, y: -118, r: 46 }, top: -176 }),
  crab: () => ({ F: { x: 6, y: -88, r: 30 }, top: -120 }),
};
const crFrame = sp => (CR_FRAMES[sp.body] ? CR_FRAMES[sp.body](sp) : crLayout(sp));

// --- the face -----------------------------------------------------------------------------------
function crEyes(F, sp, st) {
  const { x, y, r } = F, L = st.L, t = st.t;
  const kind = sp.eyes || 'googly', sz = sp.eyeSize || 1;
  if (kind === 'none') return;
  const pts = kind === 'cyclops' ? [[x + r * 0.22, y - r * 0.12, r * 0.42 * sz]]
    : [[x - r * 0.12, y - r * 0.14, r * 0.24 * sz], [x + r * 0.42, y - r * 0.14, r * 0.28 * sz]];
  const iris = sp.iris || '#3a2a1a';
  for (const [ex, ey, er] of pts) {
    if (st.blink && kind !== 'shades' && kind !== 'visor') {
      ctx.strokeStyle = L; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ex, ey, er * 0.8, 0.2, Math.PI - 0.2); ctx.stroke();
      continue;
    }
    if (kind === 'tiny') {
      ctx.fillStyle = '#1a0a14'; ellipse(ex, ey, er * 0.45, er * 0.6);
      ctx.fillStyle = '#fff'; circle(ex + er * 0.15, ey - er * 0.25, er * 0.18);
    } else if (kind === 'stars') {
      vecStar(ex, ey, er * 1.1, '#ffe36b', 1, 5);
      ctx.fillStyle = '#1a0a14'; circle(ex + er * 0.1, ey, er * 0.25);
    } else if (kind === 'shades' || kind === 'visor') {
      // drawn once across both eyes below
    } else {
      inkCircle(ex, ey, er, '#ffffff', 1.1, L);
      const big = kind === 'big' || kind === 'lashes' || kind === 'cyclops';
      const wob = kind === 'googly' ? Math.sin(t * 3 + ex) * er * 0.12 : 0;
      const px = ex + er * 0.3 + wob, py = ey + er * 0.1;
      if (big) {
        ctx.fillStyle = iris; circle(px, py, er * 0.62);
        ctx.fillStyle = '#140a14'; circle(px + er * 0.05, py, er * 0.34);
        ctx.fillStyle = '#fff'; circle(px + er * 0.25, py - er * 0.28, er * 0.22); circle(px - er * 0.2, py + er * 0.25, er * 0.1);
      } else {
        ctx.fillStyle = '#140a14'; circle(px, py, er * 0.42);
        ctx.fillStyle = '#fff'; circle(px + er * 0.15, py - er * 0.18, er * 0.14);
      }
      if (kind === 'sleepy') {
        // heavy droopy lids in the body colour
        ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, er + 1, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = sp.lid || sp.col; ctx.fillRect(ex - er - 2, ey - er - 2, er * 2 + 4, er * 1.05);
        ctx.restore();
        ctx.strokeStyle = L; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(ex - er, ey - er * 0.05); ctx.lineTo(ex + er, ey - er * 0.05); ctx.stroke();
      }
      if (kind === 'lashes') {
        ctx.strokeStyle = L; ctx.lineWidth = 2.2;
        for (let i = 0; i < 3; i++) { const a = -2.2 + i * 0.45; ctx.beginPath(); ctx.moveTo(ex + Math.cos(a) * er, ey + Math.sin(a) * er); ctx.lineTo(ex + Math.cos(a) * er * 1.45, ey + Math.sin(a) * er * 1.45); ctx.stroke(); }
      }
      if (kind === 'specs' || kind === 'monocle' && ex > x) {
        ctx.strokeStyle = sp.frames || '#e8b830'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(ex, ey, er + 3, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }
  const [a, b] = pts;
  if (kind === 'specs' && b) { ctx.strokeStyle = sp.frames || '#e8b830'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a[0] + a[2] + 3, a[1]); ctx.lineTo(b[0] - b[2] - 3, b[1]); ctx.stroke(); }
  if (kind === 'monocle' && b) { ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(b[0] + b[2], b[1] + b[2]); ctx.quadraticCurveTo(b[0] + b[2] + 10, b[1] + r, b[0] + 4, b[1] + r * 1.4); ctx.stroke(); }
  if (kind === 'shades') {
    const p = P2(`M${x - r * 0.42},${y - r * 0.32} L${x + r * 0.8},${y - r * 0.32} L${x + r * 0.74},${y + r * 0.05} C${x + r * 0.6},${y + r * 0.12} ${x + r * 0.3},${y + r * 0.08} ${x + r * 0.2},${y - r * 0.08} C${x + r * 0.1},${y + r * 0.1} ${x - r * 0.3},${y + r * 0.1} ${x - r * 0.42},${y - r * 0.1} Z`);
    ink(p, sp.shadeCol || '#2a1a3a', 1.2, L);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - r * 0.28, y - r * 0.24); ctx.lineTo(x - r * 0.12, y - r * 0.24); ctx.moveTo(x + r * 0.32, y - r * 0.24); ctx.lineTo(x + r * 0.5, y - r * 0.24); ctx.stroke();
  }
  if (kind === 'visor') {
    inkRect(x - r * 0.5, y - r * 0.38, r * 1.3, r * 0.48, '#1a2a4a', 2, 8);
    const k = (Math.sin(t * 2.5) + 1) / 2;
    ctx.fillStyle = '#5ff0ff'; ctx.shadowColor = '#5ff0ff'; ctx.shadowBlur = 10;
    ellipse(lerp(x - r * 0.25, x + r * 0.55, k), y - r * 0.14, r * 0.14, r * 0.12);
    ellipse(lerp(x - r * 0.25, x + r * 0.55, k) - r * 0.3, y - r * 0.14, r * 0.1, r * 0.09);
    ctx.shadowBlur = 0;
  }
  if (sp.brows) {
    const lift = st.talk ? Math.abs(Math.sin(t * 7)) * 3 : 0;
    ctx.strokeStyle = sp.browCol || L; ctx.lineWidth = sp.brows === 'bushy' ? 7 : 3;
    for (const [ex, ey, er] of pts) { ctx.beginPath(); ctx.moveTo(ex - er, ey - er * 1.5 - lift); ctx.quadraticCurveTo(ex, ey - er * 2 - lift, ex + er, ey - er * 1.5 - lift); ctx.stroke(); }
  }
}
function crNose(F, sp, st) {
  const { x, y, r } = F, L = st.L, n = sp.nose, t = st.t;
  const open = st.talk ? (0.5 + 0.5 * Math.sin(t * 20)) : 0;
  if (n === 'muzzle') {
    inkEllipse(x + r * 0.42, y + r * 0.32, r * 0.42, r * 0.3, 0, sp.muzzle || mix(sp.col, '#ffffff', 0.55), 1, L);
    inkEllipse(x + r * 0.62, y + r * 0.16, r * 0.14, r * 0.1, 0, '#2a1420', 0.6, L);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(x + r * 0.58, y + r * 0.13, r * 0.04);
  } else if (n === 'pig') {
    inkEllipse(x + r * 0.62, y + r * 0.2, r * 0.26, r * 0.2, 0, mix(sp.col, '#ff6f9a', 0.35), 1, L);
    ctx.fillStyle = crLine(sp.col); ellipse(x + r * 0.56, y + r * 0.2, r * 0.05, r * 0.08); ellipse(x + r * 0.7, y + r * 0.2, r * 0.05, r * 0.08);
  } else if (n === 'button') {
    inkEllipse(x + r * 0.62, y + r * 0.1, r * 0.11, r * 0.08, 0, sp.noseCol || '#2a1420', 0.6, L);
  } else if (n === 'bulb') {
    inkCircle(x + r * 0.66, y + r * 0.12, r * 0.18, sp.noseCol || '#ff5a5a', 0.8, L); ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(x + r * 0.62, y + r * 0.06, r * 0.05);
  } else if (n === 'long') {
    ink(P2(`M${x + r * 0.15},${y + r * 0.05} C${x + r * 0.6},${y} ${x + r * 1.1},${y + r * 0.12} ${x + r * 1.25},${y + r * 0.28} C${x + r * 1},${y + r * 0.5} ${x + r * 0.5},${y + r * 0.55} ${x + r * 0.15},${y + r * 0.5} Z`), sp.muzzle || mix(sp.col, '#ffffff', 0.6), 1, L);
    inkCircle(x + r * 1.22, y + r * 0.26, r * 0.1, '#2a1420', 0.6, L);
  } else if (n === 'duck' || n === 'beak' || n === 'hook') {
    const col = sp.beakCol || '#ffa22a', w = n === 'duck' ? 0.75 : 0.5, bx = x + r * 0.55, byy = y + r * 0.2;
    const lower = P2(`M${bx},${byy} L${bx + r * w},${byy + r * 0.06} C${bx + r * w * 0.8},${byy + r * (0.18 + open * 0.2)} ${bx + r * 0.1},${byy + r * (0.2 + open * 0.2)} ${bx},${byy + r * 0.12} Z`);
    ink(lower, mix(col, '#c0501a', 0.25), 1, L);
    const upper = n === 'hook'
      ? P2(`M${bx - r * 0.05},${byy - r * 0.16} C${bx + r * 0.3},${byy - r * 0.2} ${bx + r * 0.62},${byy - r * 0.05} ${bx + r * 0.52},${byy + r * 0.2} C${bx + r * 0.4},${byy + r * 0.08} ${bx + r * 0.2},${byy + r * 0.04} ${bx - r * 0.05},${byy + r * 0.04} Z`)
      : P2(`M${bx - r * 0.05},${byy - r * 0.14} C${bx + r * w * 0.6},${byy - r * 0.18} ${bx + r * w},${byy - r * 0.06} ${bx + r * w * 1.02},${byy + r * 0.02} C${bx + r * w * 0.7},${byy + r * 0.07} ${bx + r * 0.2},${byy + r * 0.06} ${bx - r * 0.05},${byy + r * 0.04} Z`);
    ink(upper, col, 1, L);
    ctx.fillStyle = crLine(col); circle(bx + r * 0.16, byy - r * 0.06, r * 0.025);
  }
  if (sp.whiskers) {
    ctx.strokeStyle = L; ctx.lineWidth = 1.5;
    for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(x + r * 0.7, y + r * 0.22); ctx.lineTo(x + r * 1.25, y + r * (0.18 + k * 0.14)); ctx.stroke(); }
  }
}
function crMouth(F, sp, st) {
  const { x, y, r } = F, L = st.L, t = st.t, m = sp.mouth || 'smile';
  if (m === 'none') return;
  const mx = x + r * (sp.mouthX ?? 0.32), my = y + r * (sp.mouthY ?? 0.5);
  if (st.talk) {
    const open = 0.35 + 0.65 * Math.abs(Math.sin(t * 16));
    inkEllipse(mx, my, r * 0.2, r * 0.2 * open + 2, 0, '#6a1a32', 0.8, L);
    ctx.fillStyle = '#ff7f9a'; ellipse(mx, my + r * 0.1 * open, r * 0.12, r * 0.06 * open);
  } else if (m === 'grin' || m === 'toothy') {
    const p = P2(`M${mx - r * 0.3},${my - r * 0.08} C${mx - r * 0.2},${my + r * 0.3} ${mx + r * 0.3},${my + r * 0.3} ${mx + r * 0.36},${my - r * 0.1} Z`);
    ink(p, '#6a1a32', 0.8, L);
    ctx.save(); ctx.clip(p); ctx.fillStyle = '#fff'; ctx.fillRect(mx - r * 0.4, my - r * 0.14, r * 0.8, r * 0.12);
    if (m === 'toothy') { ctx.fillStyle = '#6a1a32'; ctx.fillRect(mx, my - r * 0.14, 2.5, r * 0.12); }
    ctx.fillStyle = '#ff7f9a'; ellipse(mx + r * 0.04, my + r * 0.2, r * 0.18, r * 0.08); ctx.restore();
  } else if (m === 'o') {
    inkEllipse(mx, my, r * 0.08, r * 0.1, 0, '#6a1a32', 0.6, L);
  } else {
    ctx.strokeStyle = L; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx, my - r * 0.12, r * 0.2, 0.35, Math.PI - 0.35); ctx.stroke();
    if (m === 'buck') { inkRect(mx - r * 0.09, my + r * 0.04, r * 0.08, r * 0.13, '#fff', 1.5, 2); inkRect(mx + r * 0.01, my + r * 0.04, r * 0.08, r * 0.13, '#fff', 1.5, 2); }
    if (m === 'fang') { ctx.fillStyle = '#fff'; tri(mx + r * 0.05, my + r * 0.04, mx + r * 0.15, my + r * 0.04, mx + r * 0.1, my + r * 0.16); }
    if (m === 'tongue') { inkEllipse(mx + r * 0.06, my + r * 0.12, r * 0.08, r * 0.1, 0.3, '#ff7f9a', 0.6, L); }
  }
}
function crFace(F, sp, st) {
  if (sp.blush !== false) { ctx.fillStyle = 'rgba(255,100,140,.4)'; circle(F.x + F.r * 0.62, F.y + F.r * 0.32, F.r * 0.14); circle(F.x - F.r * 0.25, F.y + F.r * 0.3, F.r * 0.11); }
  if (sp.freckles) { ctx.fillStyle = 'rgba(140,70,30,.5)'; for (const [a, b] of [[0.5, 0.18], [0.6, 0.24], [0.7, 0.16], [-0.15, 0.2], [-0.05, 0.26]]) circle(F.x + F.r * a, F.y + F.r * b, F.r * 0.03); }
  crEyes(F, sp, st);
  crNose(F, sp, st);
  crMouth(F, sp, st);
  if (sp.mustache) {
    const { x, y, r } = F, mx = x + r * 0.45, my = y + r * 0.34, wig = Math.sin(st.t * 6) * 0.08;
    ctx.fillStyle = sp.mustache; ctx.strokeStyle = st.L; ctx.lineWidth = 2;
    for (const k of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(mx, my);
      ctx.bezierCurveTo(mx + k * r * 0.2, my - r * 0.14, mx + k * r * 0.5, my + r * 0.06, mx + k * r * 0.62, my - r * (0.2 + wig));
      ctx.bezierCurveTo(mx + k * r * 0.5, my + r * 0.2, mx + k * r * 0.2, my + r * 0.16, mx, my + r * 0.08);
      ctx.closePath(); ctx.stroke(); ctx.fill();
    }
  }
  if (sp.eyepatch) {
    const { x, y, r } = F;
    ctx.strokeStyle = '#1a0a14'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - r * 0.9, y - r * 0.6); ctx.lineTo(x + r * 0.9, y + r * 0.1); ctx.stroke();
    inkEllipse(x - r * 0.12, y - r * 0.14, r * 0.26, r * 0.22, 0, '#1a0a14', 0.6, '#1a0a14');
  }
}

// --- body parts -----------------------------------------------------------------------------------
function crEars(F, sp, st, front) {
  const { x, y, r } = F, L = st.L, c = sp.earCol || sp.col, inner = sp.earIn || mix(c, '#ff9ac0', 0.5), e = sp.ears, t = st.t;
  if (!e || e === 'none') return;
  if (front) {
    if (e === 'antennae' || e === 'bigantennae') {
      const bob = Math.sin(t * 5) * 0.15, len = e === 'bigantennae' ? 1.4 : 1;
      for (const [ax, k] of [[x - r * 0.2, -1], [x + r * 0.35, 1]]) {
        const tx = ax + k * r * 0.3 + Math.sin(t * 4 + k) * 4, ty = y - r * (1 + 0.7 * len);
        ctx.strokeStyle = L; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, y - r * 0.85); ctx.quadraticCurveTo(ax + k * r * (0.1 + bob), y - r * 1.3, tx, ty); ctx.stroke();
        inkCircle(tx, ty, r * 0.12, sp.antTip || '#ffe36b', 0.8, L);
      }
    }
    if (e === 'horns') for (const hx of [x - r * 0.35, x + r * 0.25]) ink(P2(`M${hx - 6},${y - r * 0.8} C${hx - 4},${y - r * 1.2} ${hx + 2},${y - r * 1.35} ${hx + 8},${y - r * 1.4} C${hx + 7},${y - r * 1.15} ${hx + 8},${y - r * 0.9} ${hx + 6},${y - r * 0.8} Z`), sp.hornCol || '#fff2c8', 0.9, L);
    if (e === 'tufts') for (const k of [-1, 1]) ink(P2(`M${x + k * r * 0.25 + r * 0.1 - 10},${y - r * 0.8} L${x + k * r * 0.75 + r * 0.1},${y - r * 1.35} L${x + k * r * 0.4 + r * 0.1 + 6},${y - r * 0.72} Z`), c, 1, L);
    return;
  }
  const pair = (fn) => { fn(x - r * 0.55, -0.5); fn(x + r * 0.35, 0.35); };
  if (e === 'round' || e === 'mouse') {
    const er = e === 'mouse' ? r * 0.55 : r * 0.32;
    pair((ex, a) => { const ey = y - r * 0.82; inkCircle(ex, ey, er, c, 1.1, L); ctx.fillStyle = inner; circle(ex + 1, ey + 2, er * 0.62); });
  } else if (e === 'pointy' || e === 'bat') {
    const h = e === 'bat' ? 1.5 : 0.8;
    pair((ex, a) => {
      ctx.save(); ctx.translate(ex, y - r * 0.6); ctx.rotate(a * 0.6 + Math.sin(t * 3) * 0.04);
      ink(P2(`M${-r * 0.28},0 L0,${-r * h} L${r * 0.28},0 Z`), c, 1.1, L);
      ctx.fillStyle = inner; tri(-r * 0.15, -r * 0.05, 0, -r * h * 0.72, r * 0.15, -r * 0.05);
      ctx.restore();
    });
  } else if (e === 'floppy') {
    pair((ex, a) => {
      ctx.save(); ctx.translate(ex, y - r * 0.7); ctx.rotate(a);
      ink(P2(`M${-r * 0.2},0 C${-r * 0.3},${-r * 0.4} ${r * 0.2},${-r * 0.5} ${r * 0.35},${-r * 0.2} C${r * 0.4},${r * 0.1} ${r * 0.2},${r * 0.25} ${r * 0.1},${r * 0.1} Z`), c, 1.1, L);
      ctx.restore();
    });
  } else if (e === 'tiny') {
    pair((ex) => inkCircle(ex + r * 0.1, y - r * 0.85, r * 0.16, c, 1, L));
  }
}
function crTail(sp, st, Ly) {
  const L = st.L, t = st.t, k = sp.tail, { bw, by, bh } = Ly, c = sp.tailCol || sp.col;
  if (!k) return;
  const wag = Math.sin(t * 4) * 0.12;
  ctx.save(); ctx.translate(-bw * 0.8, by + bh * 0.25); ctx.rotate(wag);
  if (k === 'bushy' || k === 'fox') {
    const p = P2('M0,0 C-40,0 -70,-30 -60,-80 C-54,-110 -20,-130 4,-110 C-24,-100 -30,-70 -16,-50 C-6,-34 10,-20 0,0 Z');
    ctx.scale(k === 'bushy' ? 1.3 : 1, k === 'bushy' ? 1.3 : 0.9);
    ink(p, c, 1, L);
    if (k === 'fox') { ctx.save(); ctx.clip(p); ctx.fillStyle = '#ffffff'; circle(-10, -116, 26); ctx.restore(); ctx.strokeStyle = L; ctx.lineWidth = 2; ctx.stroke(p); }
    else { ctx.strokeStyle = crLine(c); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-20, -20); ctx.quadraticCurveTo(-50, -50, -40, -90); ctx.stroke(); }
  } else if (k === 'curly') {
    ctx.strokeStyle = L; ctx.lineWidth = 7; ctx.beginPath(); for (let i = 0; i <= 30; i++) { const a = i / 30 * Math.PI * 4; ctx.lineTo(-i * 0.9 + Math.cos(a) * 7, Math.sin(a) * 7 - i * 0.5); } ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.stroke();
  } else if (k === 'dragon') {
    ink(P2('M0,-10 C-30,0 -50,10 -78,4 L-92,-8 L-80,16 C-50,28 -20,22 0,14 Z'), c, 1, L);
    for (let i = 0; i < 3; i++) ink(P2(`M${-20 - i * 20},${-4 + i * 4} l-8,-12 l-4,13 Z`), sp.spikeCol || '#ffb84a', 0.8, L);
  } else if (k === 'thin') {
    ctx.strokeStyle = L; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-40, 10, -50, -30, -80, -20); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 2.5; ctx.stroke();
  } else if (k === 'stub') {
    inkCircle(-4, -4, 12, c, 1, L);
  } else if (k === 'flames' || k === 'feathers') {
    const cols = k === 'flames' ? ['#ff4a2a', '#ff9a2a', '#ffe14a'] : [sp.col, mix(sp.col, '#ffffff', 0.3), sp.col];
    cols.forEach((col, i) => { const a = -0.4 + i * 0.35 + Math.sin(t * 6 + i) * 0.1; ctx.save(); ctx.rotate(a); ink(P2('M0,0 C-20,-10 -50,-14 -70,-4 C-50,4 -20,10 0,6 Z'), col, 0.9, L); ctx.restore(); });
  } else if (k === 'paddle') {
    ink(P2('M0,-4 C-20,-6 -46,-12 -56,0 C-46,12 -20,8 0,8 Z'), c, 1, L);
  }
  ctx.restore();
}
function crWings(sp, st, Ly) {
  const L = st.L, t = st.t, w = sp.wings, { by, bh, bw } = Ly;
  if (!w) return;
  const flap = Math.sin(t * (w === 'bee' || w === 'fairy' ? 30 : 4)) * (w === 'bee' || w === 'fairy' ? 0.25 : 0.15);
  ctx.save(); ctx.translate(-bw * 0.2, by - bh * 0.3);
  const two = (fn) => { ctx.save(); ctx.rotate(-0.2 - flap); fn(1); ctx.restore(); ctx.save(); ctx.rotate(0.25 + flap); ctx.scale(0.85, 0.85); fn(0.8); ctx.restore(); };
  if (w === 'bee' || w === 'fairy') {
    two(() => { inkEllipse(-40, -30, 44, 22, 0.6, w === 'bee' ? 'rgba(220,245,255,.75)' : 'rgba(255,220,250,.7)', 1, L); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-56, -40); ctx.stroke(); });
    if (w === 'fairy') for (let i = 0; i < 4; i++) star(-30 - i * 14, -40 + Math.sin(t * 4 + i) * 20, 3 + Math.sin(t * 8 + i) * 2, '#fffbe0');
  } else if (w === 'butterfly' || w === 'moth') {
    const [a, b2, sp1] = w === 'moth' ? ['#c8f0b8', '#a8e0a0', '#ffd0e8'] : [sp.wingCol || '#ff8a3a', sp.wing2 || '#ffcf3a', '#2a1a3a'];
    two(() => {
      ink(P2('M0,0 C-30,-90 -110,-90 -100,-30 C-96,-6 -50,4 0,0 Z'), vgradL(-80, 0, a, b2), 1.2, L);
      ink(P2('M0,4 C-60,10 -90,50 -60,70 C-36,84 -10,40 0,4 Z'), b2, 1.2, L);
      inkCircle(-62, -40, 13, sp1, 0.8, L); inkCircle(-62, -40, 6, '#ffffff', 0.4, L);
      if (w === 'moth') { inkCircle(-50, 40, 9, '#ff9ac0', 0.6, L); }
    });
  } else if (w === 'bat' || w === 'dragon') {
    const col = sp.wingCol || mix(sp.col, '#1a0830', 0.25), s = w === 'bat' ? 1.2 : 0.8;
    two(() => { ctx.scale(s, s); ink(P2('M0,0 L-30,-60 L-90,-50 C-80,-30 -76,-20 -70,-10 C-60,-20 -50,-20 -44,-6 C-34,-16 -24,-14 -18,0 Z'), col, 1, L); });
  }
  ctx.restore();
}
function crTorso(sp, st, Ly) {
  const L = st.L, { bw, bh, by, lh } = Ly, c = sp.bodyCol || sp.col;
  let p;
  if (sp.shape === 'dress') p = P2(`M${-bw * 0.55},${by - bh / 2} C${-bw * 0.7},${by} ${-bw * 1.1},${by + bh * 0.3} ${-bw * 1.2},${by + bh / 2} L${bw * 1.2},${by + bh / 2} C${bw * 1.1},${by + bh * 0.3} ${bw * 0.7},${by} ${bw * 0.55},${by - bh / 2} Z`);
  else if (sp.shape === 'pear') p = P2(`M0,${by - bh / 2} C${bw * 0.7},${by - bh / 2} ${bw * 1.1},${by + bh * 0.1} ${bw},${by + bh * 0.35} C${bw * 0.9},${by + bh / 2 + 4} ${-bw * 0.9},${by + bh / 2 + 4} ${-bw},${by + bh * 0.35} C${-bw * 1.1},${by + bh * 0.1} ${-bw * 0.7},${by - bh / 2} 0,${by - bh / 2} Z`);
  else { p = new Path2D(); p.ellipse(0, by, bw, bh / 2, 0, 0, Math.PI * 2); }
  ink(p, vgradL(by - bh / 2, by + bh / 2, mix(c, '#ffffff', 0.15), c), 1.2, L);
  ctx.save(); ctx.clip(p);
  if (sp.belly) { ctx.fillStyle = sp.belly; ellipse(bw * 0.25, by + bh * 0.08, bw * 0.6, bh * 0.4); }
  if (sp.stripes) { ctx.fillStyle = sp.stripes; for (let i = -2; i <= 2; i++) ctx.fillRect(-bw * 1.3, by + i * bh * 0.22 - bh * 0.06, bw * 2.6, bh * 0.11); }
  if (sp.spots) { ctx.fillStyle = sp.spots; for (const [a, b, rr] of [[-0.5, -0.2, 0.18], [0.3, -0.3, 0.12], [0.1, 0.25, 0.15], [-0.6, 0.3, 0.1]]) circle(a * bw, by + b * bh, rr * bw); }
  if (sp.dots) { ctx.fillStyle = sp.dots; for (let i = 0; i < 14; i++) circle(-bw + (i * 37) % (bw * 2), by - bh / 2 + (i * 23) % bh, 3.5); }
  ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(-bw * 0.35, by - bh * 0.25, bw * 0.25, bh * 0.12, -0.5);
  ctx.restore();
  if (sp.apron) { ink(P2(`M${-bw * 0.2},${by - bh * 0.35} L${bw * 0.75},${by - bh * 0.35} L${bw * 0.85},${by + bh * 0.48} L${-bw * 0.3},${by + bh * 0.48} Z`), sp.apron, 1, L); ctx.fillStyle = '#ff9ac0'; heart(bw * 0.3, by + bh * 0.1, 18, '#ff6f9a'); }
  if (sp.tutu) for (let i = 0; i < 9; i++) inkEllipse(-bw * 1.1 + i * bw * 0.28, by + bh * 0.28, 12, 7, 0, sp.tutu, 0.7, L);
  if (sp.diaper) ink(P2(`M${-bw * 0.85},${by + bh * 0.2} C${-bw * 0.3},${by + bh * 0.3} ${bw * 0.3},${by + bh * 0.3} ${bw * 0.85},${by + bh * 0.2} C${bw * 0.7},${by + bh * 0.55} ${-bw * 0.7},${by + bh * 0.55} ${-bw * 0.85},${by + bh * 0.2} Z`), '#ffffff', 1, L);
  if (sp.belt) { ctx.fillStyle = sp.belt; ctx.fillRect(-bw * 0.95, by + bh * 0.1, bw * 1.9, 8); inkRect(bw * 0.1, by + bh * 0.1 - 3, 14, 14, '#ffd84a', 2, 2); }
  if (sp.buttons) { for (let i = 0; i < 3; i++) inkCircle(bw * 0.3, by - bh * 0.25 + i * bh * 0.22, 3.5, sp.buttons, 0.5, L); }
}
function crLegs(sp, st, Ly) {
  const L = st.L, t = st.t, { lh, bw, by, bh } = Ly, c = sp.legCol || sp.col, foot = sp.feetCol || mix(c, '#1a0830', 0.2);
  if (sp.legs === 'none') return;
  if (sp.legs === 'tail') {
    // mermaid tail curling forward
    const sw = Math.sin(t * 3) * 6;
    ink(P2(`M${-bw * 0.8},${by + bh * 0.3} C${-bw * 0.9},${by + bh * 0.9} ${-bw * 0.2},${-4} ${bw * 0.9},${-12 + sw} L${bw * 0.6},${by + bh * 0.3} Z`), vgradL(by, 0, sp.tailCol || '#3ad0c0', mix(sp.tailCol || '#3ad0c0', '#3a5ad0', 0.4)), 1.2, L);
    ink(P2(`M${bw * 0.85},${-12 + sw} C${bw * 1.2},${-40 + sw} ${bw * 1.6},${-30 + sw} ${bw * 1.7},${-44 + sw} C${bw * 1.6},${-10 + sw} ${bw * 1.4},${2 + sw} ${bw * 1.7},${10 + sw} C${bw * 1.3},${10 + sw} ${bw},${0 + sw} ${bw * 0.85},${-12 + sw} Z`), sp.finCol || '#ff8ad0', 1, L);
    return;
  }
  const step = st.talk ? Math.sin(t * 9) * 3 : 0;
  for (const [lx, k] of [[-bw * 0.4, 1], [bw * 0.4, -1]]) {
    ink(P2(`M${lx - 7},${-lh - 6} L${lx - 6},${-4} L${lx + 6},${-4} L${lx + 7},${-lh - 6} Z`), c, 1, L);
    if (sp.feet === 'webbed') ink(P2(`M${lx - 6},-5 L${lx + 24},${-2 + k * step} L${lx + 20},4 L${lx - 8},4 Z`), sp.feetCol || '#ffa22a', 1, L);
    else if (sp.feet === 'claws') { ink(P2(`M${lx - 10},-6 L${lx + 18},-4 L${lx + 16},4 L${lx - 10},4 Z`), foot, 1, L); ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) tri(lx + 6 + i * 5, 4, lx + 10 + i * 5, 4, lx + 9 + i * 5, 8); }
    else inkEllipse(lx + 6, -4 + k * step * 0.3, sp.bigFeet ? 22 : 15, 8, 0, foot, 1, L);
  }
  if (sp.legs8) {
    // spider: three more pairs of skinny legs in sneakers
    for (let i = 0; i < 3; i++) {
      const a = Math.sin(t * 5 + i) * 4;
      for (const k of [-1, 1]) {
        const sx = k * bw * 0.6, sy = by + bh * (0.1 * i - 0.1);
        ctx.strokeStyle = L; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + k * (50 + i * 6), sy - 40 + a, sx + k * (66 + i * 8), -4); ctx.stroke();
        ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.stroke();
        inkEllipse(sx + k * (66 + i * 8) + 4, -4, 9, 5, 0, ['#ff5f9a', '#5fb8f0', '#ffd84a'][i], 0.7, L);
      }
    }
  }
}
function crArm(sp, st, Ly, back) {
  const L = st.L, t = st.t, { bw, bh, by } = Ly, c = sp.armCol || sp.bodyCol || sp.col, a = sp.arms || 'stubby';
  if (a === 'none') return null;
  const sx = back ? -bw * 0.55 : bw * 0.6, sy = by - bh * 0.28;
  let ang;
  if (back) ang = 0.35 + Math.sin(t * 2) * 0.05;
  else if (sp.hold) ang = -1.05 + Math.sin(t * 2.2) * 0.06;
  else if (st.talk) ang = -2.5 + Math.sin(t * 12) * 0.35; // wave hello
  else ang = -0.25 + Math.sin(t * 2) * 0.05;
  const al = sp.armLen ?? bh * 0.5;
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang);
  if (a === 'wing') {
    ink(P2(`M-6,-4 C-14,${al * 0.4} -10,${al * 0.9} 0,${al * 1.15} C8,${al * 0.9} 14,${al * 0.4} 8,-4 Z`), back ? mix(c, '#1a0830', 0.15) : c, 1, L);
    ctx.strokeStyle = crLine(c); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-2, al * 0.6); ctx.lineTo(3, al * 0.9); ctx.moveTo(4, al * 0.5); ctx.lineTo(6, al * 0.8); ctx.stroke();
  } else if (a === 'fin') {
    ink(P2(`M-5,0 C-12,${al * 0.5} -4,${al} 4,${al} C12,${al * 0.6} 10,${al * 0.2} 6,0 Z`), back ? mix(c, '#1a0830', 0.15) : c, 1, L);
  } else {
    ink(P2(`M-7,-2 L-6,${al} L6,${al} L7,-2 Z`), back ? mix(c, '#1a0830', 0.15) : c, 1, L);
    inkCircle(0, al + 4, sp.handR ?? 9, back ? mix(sp.handCol || sp.col, '#1a0830', 0.15) : (sp.handCol || sp.col), 1, L);
  }
  ctx.restore();
  return [sx - Math.sin(ang) * (al + 4), sy + Math.cos(ang) * (al + 4)];
}

// --- props --------------------------------------------------------------------------------------
// held in the front hand
const CR_HOLD = {
  wand: (L, t) => { ctx.strokeStyle = L; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, -40); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke(); vecStar(22, -46, 12 + Math.sin(t * 8) * 2, '#ffe36b', 1); },
  starwand: (L, t) => { ctx.strokeStyle = '#8a5ae0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(10, -60); ctx.stroke(); inkCircle(11, -66, 10, '#8ad8ff', 1, L); star(11, -66, 14 + Math.sin(t * 6) * 4, 'rgba(255,255,255,.9)'); },
  trident: L => { ctx.strokeStyle = '#e8b830'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(0, -70); ctx.moveTo(-14, -70); ctx.lineTo(-14, -56); ctx.quadraticCurveTo(0, -46, 14, -56); ctx.lineTo(14, -70); ctx.stroke(); },
  acorn: L => { inkEllipse(6, -6, 18, 22, 0, '#c8803a', 1, L); ink(P2('M-14,-16 C-14,-34 26,-34 26,-16 Z'), '#8a5a2a', 1, L); ctx.strokeStyle = L; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(6, -32); ctx.lineTo(10, -40); ctx.stroke(); },
  cane: L => { ctx.strokeStyle = L; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -6); ctx.arc(-10, -6, 10, 0, Math.PI, true); ctx.moveTo(0, -6); ctx.lineTo(4, 62); ctx.stroke(); ctx.strokeStyle = '#c8803a'; ctx.lineWidth = 5; ctx.stroke(); },
  spoon: L => { ctx.strokeStyle = L; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-10, 20); ctx.lineTo(10, -30); ctx.stroke(); ctx.strokeStyle = '#d8a060'; ctx.lineWidth = 3.5; ctx.stroke(); inkEllipse(14, -42, 9, 14, 0.4, '#d8a060', 1, L); },
  yarn: L => { inkCircle(8, -8, 20, '#ff6fae', 1, L); ctx.strokeStyle = '#d8407e'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(8, -8, 16 - i * 3, i, i + 3); ctx.stroke(); } ctx.strokeStyle = '#c0c0d0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(24, 10); ctx.moveTo(18, -32); ctx.lineTo(-6, 12); ctx.stroke(); },
  teacup: (L, t) => { ink(P2('M-14,-16 L14,-16 C14,0 8,6 0,6 C-8,6 -14,0 -14,-16 Z'), '#ffffff', 1, L); ctx.fillStyle = '#ff9ac0'; circle(0, -6, 3); inkEllipse(0, 8, 20, 4, 0, '#ffffff', 0.8, L); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(6 + Math.sin(t * 3) * 4, -30, 0, -40); ctx.stroke(); },
  kite: (L, t) => { const kx = 40 + Math.sin(t * 2) * 8, ky = -150 + Math.cos(t * 1.7) * 8; ctx.strokeStyle = 'rgba(80,60,90,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -70, kx, ky); ctx.stroke(); ink(P2(`M${kx},${ky - 30} L${kx + 22},${ky} L${kx},${ky + 34} L${kx - 22},${ky} Z`), '#ff5f5f', 1, L); ctx.fillStyle = '#ffd84a'; tri(kx, ky - 30, kx + 22, ky, kx, ky); ctx.strokeStyle = '#5fb8f0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(kx, ky + 34); for (let i = 1; i < 5; i++) ctx.lineTo(kx + Math.sin(t * 5 + i) * 8, ky + 34 + i * 12); ctx.stroke(); },
  gold: L => { ink(P2('M-22,-20 L22,-20 C26,0 18,14 0,14 C-18,14 -26,0 -22,-20 Z'), '#2a2a3a', 1, L); for (let i = 0; i < 6; i++) inkCircle(-14 + i * 6, -22 - (i % 2) * 5, 6, '#ffd84a', 0.6, '#b08a20'); vecStar(16, -36, 6, '#fff', 0.5); },
  ball: (L, t) => { ctx.save(); ctx.translate(0, -26); ctx.rotate(t * 2); inkCircle(0, 0, 22, '#ffffff', 1, L); ['#ff5f5f', '#5fb8f0', '#ffd84a'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 21, i * 2.1, i * 2.1 + 1); ctx.closePath(); ctx.fill(); }); ctx.restore(); },
  worm: (L, t) => { ctx.strokeStyle = L; ctx.lineWidth = 9; ctx.beginPath(); for (let i = 0; i < 8; i++) ctx.lineTo(i * 5, -10 + Math.sin(t * 6 + i) * 5); ctx.stroke(); ctx.strokeStyle = '#ff8aa8'; ctx.lineWidth = 6; ctx.stroke(); ctx.fillStyle = '#1a0a14'; circle(35, -12 + Math.sin(t * 6 + 7) * 5, 1.5); },
  cheese: L => { ink(P2('M-18,0 L22,-10 L22,10 L-18,10 Z'), '#ffd84a', 1, L); ink(P2('M-18,0 L22,-10 L4,-24 Z'), '#ffe88a', 1, L); ctx.fillStyle = '#e8b830'; circle(0, 4, 3); circle(12, 2, 2.5); },
  baton: (L, t) => { ctx.save(); ctx.rotate(Math.sin(t * 6) * 0.4); ctx.strokeStyle = L; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -50); ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke(); inkCircle(0, -52, 7, '#ff3f6a', 1, L); ctx.restore(); },
  lantern: (L, t) => { ctx.strokeStyle = L; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 10); ctx.stroke(); inkRect(-10, 10, 20, 26, 'rgba(255,240,170,.95)', 2, 5); ctx.fillStyle = `rgba(255,200,80,${0.25 + 0.1 * Math.sin(t * 8)})`; circle(0, 22, 30); },
  rollingpin: L => { ctx.save(); ctx.rotate(-0.5); inkRect(-26, -8, 52, 16, '#e8b878', 2, 7); inkRect(-38, -4, 12, 8, '#c8904a', 2, 3); inkRect(26, -4, 12, 8, '#c8904a', 2, 3); ctx.restore(); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(20, -20, 6); circle(28, -12, 4); },
  honey: L => { ink(P2('M-18,-26 L18,-26 C24,-10 20,10 0,10 C-20,10 -24,-10 -18,-26 Z'), '#ffb83a', 1, L); inkRect(-20, -32, 40, 8, '#ff8a3a', 2, 3); text('HUNNY', 0, -8, 9, '#8a4a10', 'center', 700); },
  wrench: L => { ctx.strokeStyle = L; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-6, 10); ctx.lineTo(10, -30); ctx.stroke(); ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 5; ctx.stroke(); inkCircle(12, -34, 9, '#c8d0e0', 1, L); ctx.fillStyle = '#1a2a4a'; circle(14, -38, 4); },
  bouquet: L => { for (const [fx, fy, c] of [[-6, -26, '#ff6fae'], [8, -30, '#ffe36b'], [0, -40, '#c6a2ff'], [14, -18, '#fff']]) flower(fx, fy, 8, c, '#ff9a3d', 0.8); ctx.strokeStyle = '#4a9a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -20); ctx.stroke(); },
  snowball: L => { inkCircle(4, -12, 16, '#ffffff', 1, L); ctx.fillStyle = '#d8ecff'; circle(8, -8, 7); },
  map: L => { ctx.save(); ctx.rotate(-0.2); inkRect(-20, -30, 40, 32, '#f8e8c0', 2, 3); ctx.strokeStyle = '#d04a3a'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(-12, -6); ctx.quadraticCurveTo(0, -24, 10, -18); ctx.stroke(); ctx.setLineDash([]); text('✕', 12, -20, 10, '#d04a3a', 'center', 700); ctx.restore(); },
  shell: L => shell(4, -14, 14, 0, 1),
  telescope: L => { ctx.save(); ctx.rotate(-0.8); inkRect(-6, -40, 14, 50, '#8a5ae0', 2, 3); inkRect(-8, -48, 18, 12, '#e8b830', 2, 3); ctx.restore(); },
};
// worn on top of the head; drawn in a frame where (0,0) is the top of the head and r is head size
const CR_HATS = {
  crown: (r, L, sp) => { ink(P2(`M${-r * 0.55},0 L${-r * 0.65},${-r * 0.55} L${-r * 0.3},${-r * 0.25} L0,${-r * 0.7} L${r * 0.3},${-r * 0.25} L${r * 0.65},${-r * 0.55} L${r * 0.55},0 Z`), sp.crownCol || '#ffd84a', 1, L); inkCircle(0, -r * 0.15, r * 0.09, '#ff3f8a', 0.6, L); inkCircle(-r * 0.35, -r * 0.1, r * 0.06, '#5fb8f0', 0.5, L); inkCircle(r * 0.35, -r * 0.1, r * 0.06, '#8ad84a', 0.5, L); },
  tiara: (r, L) => { ink(P2(`M${-r * 0.45},${r * 0.05} L${-r * 0.2},${-r * 0.2} L0,${-r * 0.45} L${r * 0.2},${-r * 0.2} L${r * 0.45},${r * 0.05} Z`), '#ffe88a', 0.8, L); inkCircle(0, -r * 0.18, r * 0.08, '#ff6fae', 0.5, L); },
  tophat: (r, L, sp) => { ink(P2(`M${-r * 0.75},${r * 0.05} C${-r * 0.5},${-r * 0.1} ${r * 0.5},${-r * 0.1} ${r * 0.75},${r * 0.05} C${r * 0.5},${r * 0.15} ${-r * 0.5},${r * 0.15} ${-r * 0.75},${r * 0.05} Z`), sp.hatCol || '#2a1a3a', 1, L); ink(P2(`M${-r * 0.45},0 L${-r * 0.5},${-r * 1.2} L${r * 0.5},${-r * 1.2} L${r * 0.45},0 Z`), sp.hatCol || '#2a1a3a', 1, L); ctx.fillStyle = sp.bandCol || '#ff3f6a'; ctx.fillRect(-r * 0.47, -r * 0.3, r * 0.94, r * 0.18); if (sp.hatExtra === 'shamrock') { for (let i = 0; i < 3; i++) { ctx.fillStyle = '#4ad04a'; heart(r * 0.25 + Math.cos(i * 2.1) * 5, -r * 0.26 + Math.sin(i * 2.1) * 5, 14, '#4ad04a'); } } else if (sp.hatExtra === 'buckle') inkRect(-r * 0.12, -r * 0.34, r * 0.24, r * 0.26, '#ffd84a', 2, 2); },
  chef: (r, L) => { ink(P2(`M${-r * 0.55},0 L${-r * 0.55},${-r * 0.4} L${r * 0.55},${-r * 0.4} L${r * 0.55},0 Z`), '#ffffff', 1, L); puffCluster([[-r * 0.4, -r * 0.7, r * 0.35], [0, -r * 1.05, r * 0.45], [r * 0.4, -r * 0.7, r * 0.35], [0, -r * 0.6, r * 0.4]], '#ffffff', 1, L); },
  wizard: (r, L, sp, t) => { const tilt = Math.sin(t * 1.5) * 0.1; ctx.save(); ctx.rotate(tilt); ink(P2(`M${-r * 0.85},${r * 0.1} C${-r * 0.3},${-r * 0.1} ${r * 0.3},${-r * 0.1} ${r * 0.85},${r * 0.1} L${r * 0.4},${-r * 0.1} C${r * 0.3},${-r * 0.8} ${r * 0.1},${-r * 1.4} ${-r * 0.5},${-r * 1.8} C${-r * 0.2},${-r * 1.2} ${-r * 0.3},${-r * 0.6} ${-r * 0.4},${-r * 0.1} Z`), sp.hatCol || '#4a3ab0', 1, L); vecStar(0, -r * 0.6, r * 0.14, '#ffe36b', 0.6); vecStar(-r * 0.2, -r * 1.1, r * 0.09, '#ffe36b', 0.5); ctx.fillStyle = '#ffe36b'; circle(r * 0.2, -r * 0.3, r * 0.05); ctx.restore(); },
  gnome: (r, L, sp, t) => { ink(P2(`M${-r * 0.75},${r * 0.15} C${-r * 0.4},${-r * 0.8} ${-r * 0.1},${-r * 1.8} ${r * 0.1 + Math.sin(t * 2) * 4},${-r * 2.3} C${r * 0.3},${-r * 1.6} ${r * 0.6},${-r * 0.6} ${r * 0.75},${r * 0.15} Z`), '#ff3f3f', 1, L); },
  cap: (r, L, sp) => { ink(P2(`M${-r * 0.7},${r * 0.1} C${-r * 0.7},${-r * 0.6} ${r * 0.7},${-r * 0.6} ${r * 0.7},${r * 0.1} Z`), sp.hatCol || '#5fb8f0', 1, L); ink(P2(`M${-r * 0.65},${r * 0.05} C${-r * 0.9},${0} ${-r * 1.2},${r * 0.05} ${-r * 1.25},${r * 0.15} L${-r * 0.6},${r * 0.15} Z`), mix(sp.hatCol || '#5fb8f0', '#1a0830', 0.2), 1, L); inkCircle(0, -r * 0.45, r * 0.08, '#ffd84a', 0.5, L); },
  bow: (r, L, sp) => bow(r * 0.3, -r * 0.05, r * 0.45, sp.bowCol || '#ff5fa2', 1),
  bigbow: (r, L, sp) => bow(0, -r * 0.15, r * 0.8, sp.bowCol || '#ff5fa2', 1),
  nightcap: (r, L, sp, t) => { ink(P2(`M${-r * 0.75},${r * 0.2} C${-r * 0.5},${-r * 0.6} ${r * 0.4},${-r * 0.7} ${r * 0.8},${r * 0.1} C${r * 1.3},${-r * 0.1} ${r * 1.5},${r * 0.3} ${r * 1.3},${r * 0.7} C${r * 0.9},${r * 0.2} ${r * 0.3},${r * 0.2} ${-r * 0.75},${r * 0.2} Z`), sp.hatCol || '#5f8ae0', 1, L); inkCircle(r * 1.3, r * 0.75, r * 0.14, '#ffffff', 0.7, L); },
  bubble: (r, L, sp, t) => { ctx.fillStyle = 'rgba(200,240,255,.25)'; circle(0, r * 1.0, r * 1.45); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, r * 1.0, r * 1.45, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, r * 1.0, r * 1.25, -2.4, -1.6); ctx.stroke(); ctx.strokeStyle = L; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r * 0.4, -r * 0.4); ctx.lineTo(r * 0.6, -r * 0.9); ctx.stroke(); inkCircle(r * 0.62, -r * 0.95, r * 0.1, `hsl(${(t * 200) % 360},90%,65%)`, 0.6, L); },
  earmuffs: (r, L) => { ctx.strokeStyle = '#ff6fae'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, r * 0.85, r * 0.95, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); puffCluster([[-r * 0.85, r * 0.6, r * 0.28], [r * 0.85, r * 0.6, r * 0.28]], '#ffb8dc', 1, L); },
  headphones: (r, L) => { ctx.strokeStyle = L; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, r * 0.8, r * 0.95, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.strokeStyle = '#ff3f6a'; ctx.lineWidth = 4; ctx.stroke(); inkRect(-r * 1.05, r * 0.45, r * 0.3, r * 0.5, '#ff3f6a', 2, 5); inkRect(r * 0.75, r * 0.45, r * 0.3, r * 0.5, '#ff3f6a', 2, 5); },
  pirate: (r, L) => { ink(P2(`M${-r * 0.95},${r * 0.05} C${-r * 0.6},${-r * 0.9} ${r * 0.6},${-r * 0.9} ${r * 0.95},${r * 0.05} C${r * 0.4},${-r * 0.15} ${-r * 0.4},${-r * 0.15} ${-r * 0.95},${r * 0.05} Z`), '#2a1a2a', 1, L); ctx.fillStyle = '#ffffff'; circle(0, -r * 0.38, r * 0.12); ctx.fillRect(-r * 0.04, -r * 0.3, r * 0.08, r * 0.12); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * 0.75, -r * 0.08); ctx.quadraticCurveTo(0, -r * 0.3, r * 0.75, -r * 0.08); ctx.stroke(); },
  curlers: (r, L) => { for (const [cx, cy, c] of [[-r * 0.5, -r * 0.05, '#ff9ac0'], [-r * 0.15, -r * 0.2, '#8ad8ff'], [r * 0.2, -r * 0.2, '#ffe36b'], [r * 0.5, -r * 0.05, '#c6a2ff']]) { inkRect(cx - r * 0.13, cy - r * 0.12, r * 0.26, r * 0.24, c, 2, 4); } },
  duckling: (r, L, sp, t) => { const b = Math.abs(Math.sin(t * 5)) * 4; inkEllipse(0, -r * 0.2 - b, r * 0.35, r * 0.25, 0, '#ffe14a', 1, L); inkCircle(r * 0.22, -r * 0.5 - b, r * 0.2, '#ffe14a', 1, L); ctx.fillStyle = '#ff9a2a'; tri(r * 0.38, -r * 0.52 - b, r * 0.55, -r * 0.48 - b, r * 0.38, -r * 0.44 - b); ctx.fillStyle = '#1a0a14'; circle(r * 0.28, -r * 0.55 - b, r * 0.04); },
  honeypot: (r, L, sp, t) => { ink(P2(`M${-r * 0.6},0 C${-r * 0.7},${-r * 0.7} ${r * 0.7},${-r * 0.7} ${r * 0.6},0 Z`), '#ffb83a', 1, L); inkRect(-r * 0.5, -r * 0.62, r, r * 0.16, '#ff8a3a', 2, 3); const d = ((t * 0.6) % 1) * r * 0.5; ctx.fillStyle = '#ffb83a'; ellipse(r * 0.4, d, r * 0.06, r * 0.1); ellipse(-r * 0.3, r * 0.15, r * 0.07, r * 0.16); },
  cheese: (r, L) => { ink(P2(`M${-r * 0.6},0 L${r * 0.6},0 L${r * 0.1},${-r * 0.7} Z`), '#ffd84a', 1, L); ctx.fillStyle = '#e8b830'; circle(-r * 0.1, -r * 0.18, r * 0.08); circle(r * 0.2, -r * 0.12, r * 0.06); circle(r * 0.05, -r * 0.4, r * 0.06); },
  flowers: (r, L) => { [[-r * 0.55, 0, '#ff6fae'], [-r * 0.2, -r * 0.18, '#fff'], [r * 0.18, -r * 0.18, '#ffe36b'], [r * 0.55, 0, '#c6a2ff']].forEach(([x, y, c]) => flower(x, y, r * 0.2, c, '#ff9a3d', 0.8)); },
  beret: (r, L, sp) => { inkEllipse(-r * 0.1, -r * 0.05, r * 0.8, r * 0.3, -0.2, sp.hatCol || '#ff3f6a', 1, L); ctx.strokeStyle = L; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.33); ctx.lineTo(-r * 0.05, -r * 0.48); ctx.stroke(); },
  propeller: (r, L, sp, t) => { ink(P2(`M${-r * 0.6},${r * 0.1} C${-r * 0.6},${-r * 0.5} ${r * 0.6},${-r * 0.5} ${r * 0.6},${r * 0.1} Z`), '#5fb8f0', 1, L); ctx.strokeStyle = L; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -r * 0.4); ctx.lineTo(0, -r * 0.6); ctx.stroke(); const w = Math.cos(t * 20); inkEllipse(0, -r * 0.62, r * 0.6 * Math.abs(w) + 2, r * 0.08, 0, '#ff3f6a', 0.6, L); },
  flame: (r, L, sp, t) => { for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45, f = 1 + Math.sin(t * 9 + i) * 0.15; ctx.save(); ctx.rotate(a); ink(P2(`M-6,${r * 0.1} C-10,${-r * 0.5 * f} -2,${-r * 0.8 * f} 0,${-r * 0.95 * f} C4,${-r * 0.7 * f} 10,${-r * 0.4 * f} 6,${r * 0.1} Z`), ['#ff4a2a', '#ff8a2a', '#ffe14a', '#ff8a2a', '#ff4a2a'][i], 0.8, L); ctx.restore(); } },
  cloudhair: (r, L) => { puffCluster([[-r * 0.8, r * 0.2, r * 0.4], [-r * 0.5, -r * 0.2, r * 0.45], [0, -r * 0.4, r * 0.5], [r * 0.5, -r * 0.2, r * 0.45], [r * 0.85, r * 0.25, r * 0.38], [0, -r * 0.9, r * 0.35]], '#ffffff', 1, '#9ab8d8'); },
};
const CR_HAIR = {
  pigtails: (F, c, L, t) => { for (const k of [-1, 1]) { const sw = Math.sin(t * 3 + k) * 0.15; ctx.save(); ctx.translate(F.x + k * F.r * 0.95, F.y - F.r * 0.3); ctx.rotate(k * 0.6 + sw); puffCluster([[0, F.r * 0.25, F.r * 0.3], [0, F.r * 0.65, F.r * 0.25]], c, 1, L); ctx.restore(); bow(F.x + k * F.r * 0.88, F.y - F.r * 0.4, F.r * 0.22, '#ff5fa2', 0.8); } },
  bun: (F, c, L) => puffCluster([[F.x - F.r * 0.2, F.y - F.r * 1.1, F.r * 0.38]], c, 1, L),
  long: (F, c, L, t) => ink(P2(`M${F.x - F.r * 1.05},${F.y - F.r * 0.2} C${F.x - F.r * 1.1},${F.y + F.r * 1.4} ${F.x - F.r * 0.4},${F.y + F.r * 1.7} ${F.x - F.r * 0.2},${F.y + F.r * 1.5 + Math.sin(t * 2) * 3} L${F.x + F.r * 0.4},${F.y} Z`), c, 1, L),
  wavy: (F, c, L) => ink(P2(`M${F.x - F.r * 1.05},${F.y - F.r * 0.2} C${F.x - F.r * 1.3},${F.y + F.r * 0.6} ${F.x - F.r * 0.8},${F.y + F.r * 1.1} ${F.x - F.r * 1.1},${F.y + F.r * 1.6} C${F.x - F.r * 0.4},${F.y + F.r * 1.7} ${F.x - F.r * 0.3},${F.y + F.r} ${F.x},${F.y} Z`), c, 1, L),
};
const CR_FRONT_HAIR = {
  pigtails: (F, c, L) => ink(P2(`M${F.x - F.r * 0.95},${F.y - F.r * 0.15} C${F.x - F.r * 1.05},${F.y - F.r * 1.1} ${F.x + F.r * 0.9},${F.y - F.r * 1.25} ${F.x + F.r * 0.95},${F.y - F.r * 0.3} C${F.x + F.r * 0.5},${F.y - F.r * 0.65} ${F.x},${F.y - F.r * 0.6} ${F.x - F.r * 0.95},${F.y - F.r * 0.15} Z`), c, 1, L),
  spiky: (F, c, L) => { const p = new Path2D(); p.moveTo(F.x - F.r * 0.95, F.y - F.r * 0.1); for (let i = 0; i <= 6; i++) { const a = Math.PI * (1.05 + i * 0.15); p.lineTo(F.x + Math.cos(a) * F.r * 1.35, F.y + Math.sin(a) * F.r * 1.35 - 4); p.lineTo(F.x + Math.cos(a + 0.08) * F.r * 0.85, F.y + Math.sin(a + 0.08) * F.r * 0.85); } p.closePath(); ink(p, c, 1, L); },
  curly: (F, c, L) => puffCluster([[F.x - F.r * 0.8, F.y - F.r * 0.5, F.r * 0.3], [F.x - F.r * 0.45, F.y - F.r * 0.85, F.r * 0.32], [F.x, F.y - F.r * 0.95, F.r * 0.32], [F.x + F.r * 0.45, F.y - F.r * 0.82, F.r * 0.3], [F.x + F.r * 0.8, F.y - F.r * 0.45, F.r * 0.24]], c, 1, L),
  fringe: (F, c, L) => ink(P2(`M${F.x - F.r},${F.y - F.r * 0.1} C${F.x - F.r},${F.y - F.r * 1.15} ${F.x + F.r},${F.y - F.r * 1.15} ${F.x + F.r},${F.y - F.r * 0.3} C${F.x + F.r * 0.4},${F.y - F.r * 0.55} ${F.x - F.r * 0.3},${F.y - F.r * 0.5} ${F.x - F.r},${F.y - F.r * 0.1} Z`), c, 1, L),
  bald: () => {},
};
function crBeard(F, sp, st) {
  if (!sp.beard) return;
  const { x, y, r } = F, sw = Math.sin(st.t * 2) * 3, len = sp.beardLen ?? 1.6;
  const p = P2(`M${x - r * 0.75},${y + r * 0.1} C${x - r * 0.7},${y + r * len} ${x + r * 0.2},${y + r * (len + 0.6)} ${x + r * 0.35 + sw},${y + r * (len + 0.9)} C${x + r * 0.6},${y + r * len} ${x + r * 1.0},${y + r * 0.8} ${x + r * 0.9},${y + r * 0.1} C${x + r * 0.5},${y + r * 0.45} ${x},${y + r * 0.45} ${x - r * 0.75},${y + r * 0.1} Z`);
  ink(p, sp.beard, 1.1, st.L);
  ctx.strokeStyle = mix(sp.beard, '#8a8aa0', 0.4); ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - r * 0.3 + i * r * 0.3, y + r * 0.6); ctx.quadraticCurveTo(x - r * 0.2 + i * r * 0.3, y + r * len * 0.9, x + i * r * 0.2, y + r * len); ctx.stroke(); }
}

// --- body families -------------------------------------------------------------------------------
function crStandard(sp, st) {
  const Ly = crLayout(sp), { F, bw, bh, by, lh } = Ly, L = st.L, t = st.t;
  crWings(sp, st, Ly);
  crTail(sp, st, Ly);
  if (sp.cape) ink(P2(`M${-bw * 0.6},${by - bh * 0.45} C${-bw * 1.4},${by} ${-bw * 1.5},${by + bh * 0.4} ${-bw * 1.3},${-4} L${bw * 0.2},${-6} L${bw * 0.5},${by - bh * 0.45} Z`), sp.cape, 1, L);
  if (sp.spikes) {
    // a fan of prickles along the back, from the top of the head round to the bottom
    const cx = -bw * 0.1, cy = by - bh * 0.35, R = bh * 0.62;
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * (0.7 + i * 0.085), ca = Math.cos(a), sa = Math.sin(a);
      const px = cx + ca * R, py = cy + sa * R, nx = -sa * 10, ny = ca * 10;
      ink(P2(`M${px + nx},${py + ny} L${px + ca * 32},${py + sa * 32} L${px - nx},${py - ny} Z`), sp.spikes, 0.9, L);
    }
  }
  CR_HAIR[sp.hair]?.(F, sp.hairCol, L, t);
  const backHand = crArm(sp, st, Ly, true);
  crLegs(sp, st, Ly);
  crTorso(sp, st, Ly);
  if (sp.shell) {
    const p = P2(`M${-bw * 1.25},${by + bh * 0.45} C${-bw * 1.4},${by - bh * 0.9} ${bw * 0.2},${by - bh * 0.95} ${bw * 0.3},${by + bh * 0.1} C${bw * 0.1},${by + bh * 0.5} ${-bw * 0.7},${by + bh * 0.6} ${-bw * 1.25},${by + bh * 0.45} Z`);
    ink(p, vgradL(by - bh, by + bh / 2, '#8ad86a', '#3a9a4a'), 1.3, L);
    ctx.save(); ctx.clip(p); ctx.strokeStyle = '#2a7a3a'; ctx.lineWidth = 3;
    for (const [hx, hy] of [[-bw * 0.5, by - bh * 0.25], [-bw * 1.0, by + bh * 0.1], [-bw * 0.05, by + bh * 0.1], [-bw * 0.55, by + bh * 0.35]]) { ctx.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2; ctx.lineTo(hx + Math.cos(a) * 16, hy + Math.sin(a) * 14); } ctx.stroke(); }
    ctx.restore();
    if (sp.shellPatch) inkCircle(-bw * 0.5, by - bh * 0.25, 9, sp.shellPatch, 0.8, L), star(-bw * 0.5, by - bh * 0.25, 5, '#fff', 5);
  }
  if (sp.neck) {
    // a long graceful neck, stroked twice so it has an outline
    ctx.beginPath(); ctx.moveTo(bw * 0.4, by - bh * 0.2); ctx.bezierCurveTo(bw * 0.9, by - bh * 0.9, F.x - 30, F.y + F.r * 1.4, F.x - 4, F.y + F.r * 0.5);
    ctx.strokeStyle = L; ctx.lineWidth = 26; ctx.stroke(); ctx.strokeStyle = sp.col; ctx.lineWidth = 21; ctx.stroke();
  }
  crEars(F, sp, st, false);
  // head
  if (sp.headShape === 'wide') inkEllipse(F.x, F.y, F.r * 1.25, F.r * 0.85, 0, vgradL(F.y - F.r, F.y + F.r, mix(sp.headCol || sp.col, '#ffffff', 0.18), sp.headCol || sp.col), 1.2, L);
  else inkCircle(F.x, F.y, F.r, vgradL(F.y - F.r, F.y + F.r, mix(sp.headCol || sp.col, '#ffffff', 0.18), sp.headCol || sp.col), 1.2, L);
  if (sp.face) { ctx.save(); ctx.beginPath(); ctx.arc(F.x, F.y, F.r, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = sp.face; ellipse(F.x + F.r * 0.25, F.y + F.r * 0.15, F.r * 0.8, F.r * 0.75); ctx.restore(); }
  if (sp.mask) { ctx.fillStyle = sp.mask; ellipse(F.x + F.r * 0.15, F.y - F.r * 0.14, F.r * 0.75, F.r * 0.22); }
  if (sp.eyeStalks) for (const [sx, k] of [[F.x - F.r * 0.12, 0], [F.x + F.r * 0.42, 1]]) { ctx.strokeStyle = L; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(sx, F.y); ctx.lineTo(sx + Math.sin(t * 3 + k) * 3, F.y - F.r * 0.14); ctx.stroke(); }
  crFace(F, sp, st);
  CR_FRONT_HAIR[sp.frontHair || sp.hair]?.(F, sp.hairCol, L, t);
  crBeard(F, sp, st);
  crEars(F, sp, st, true);
  if (sp.hat) { ctx.save(); ctx.translate(F.x, F.y - F.r * 0.82); ctx.rotate(sp.hatTilt ?? 0.1); CR_HATS[sp.hat](F.r, L, sp, t); ctx.restore(); }
  if (sp.neckwear) crNeckwear(sp, st, Ly);
  const hand = crArm(sp, st, Ly, false);
  if (sp.hold && hand) { ctx.save(); ctx.translate(hand[0], hand[1]); CR_HOLD[sp.hold](L, t); ctx.restore(); crHandOver(sp, st, hand); }
  if (sp.puff) crPuffs(sp, st, F);
}
function crHandOver(sp, st, [hx, hy]) { inkCircle(hx, hy, (sp.handR ?? 9) * 0.8, sp.handCol || sp.col, 0.8, st.L); }
function crNeckwear(sp, st, Ly) {
  const { F, bw, bh, by } = Ly, L = st.L, n = sp.neckwear, nx = bw * 0.1, ny = by - bh * 0.48, t = st.t;
  if (n === 'scarf') { ink(P2(`M${nx - bw * 0.6},${ny - 6} C${nx},${ny + 8} ${nx + bw * 0.5},${ny + 6} ${nx + bw * 0.7},${ny - 6} L${nx + bw * 0.7},${ny + 8} C${nx},${ny + 20} ${nx - bw * 0.5},${ny + 16} ${nx - bw * 0.6},${ny + 8} Z`), sp.scarfCol || '#ff3f6a', 1, L); ink(P2(`M${nx - bw * 0.5},${ny + 6} L${nx - bw * 0.7 + Math.sin(t * 4) * 4},${ny + 46} L${nx - bw * 0.3},${ny + 44} L${nx - bw * 0.25},${ny + 8} Z`), sp.scarfCol || '#ff3f6a', 1, L); ctx.fillStyle = '#ffffff'; ctx.fillRect(nx - bw * 0.68, ny + 30, bw * 0.4, 5); }
  if (n === 'bowtie') { ink(P2(`M${nx},${ny + 4} L${nx - 16},${ny - 6} L${nx - 16},${ny + 14} Z`), sp.tieCol || '#ff3f6a', 1, L); ink(P2(`M${nx},${ny + 4} L${nx + 16},${ny - 6} L${nx + 16},${ny + 14} Z`), sp.tieCol || '#ff3f6a', 1, L); inkCircle(nx, ny + 4, 4, sp.tieCol || '#ff3f6a', 0.8, L); }
  if (n === 'pearls') for (let i = 0; i < 7; i++) { const k = i / 6; inkCircle(nx + lerp(-bw * 0.6, bw * 0.6, k), ny + Math.sin(k * Math.PI) * 14, 5, '#fffaf4', 0.5, '#b8a8c0'); }
  if (n === 'ruff') for (let i = 0; i < 7; i++) inkEllipse(nx - bw * 0.6 + i * bw * 0.2, ny + 2, 9, 7, 0, '#ffffff', 0.7, L);
  if (n === 'boa') puffCluster(Array.from({ length: 9 }, (_, i) => [nx - bw * 0.8 + i * bw * 0.2, ny + Math.sin(i + t * 2) * 3, 9]), '#ff8ad0', 0.8, L);
  if (n === 'collar') { inkRect(nx - bw * 0.55, ny - 4, bw * 1.1, 10, '#ff3f6a', 2, 5); inkCircle(nx + 4, ny + 12, 6, '#ffd84a', 0.8, L); }
}
function crPuffs(sp, st, F) {
  // steam/smoke rings puffing out of the nose
  const t = st.t;
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.6 + i / 3) % 1;
    ctx.fillStyle = `rgba(${sp.puff},${0.6 * (1 - k)})`;
    circle(F.x + F.r * (0.9 + k * 0.8), F.y - F.r * (k * 1.2), 4 + k * 12);
  }
}
const CR_BODIES = {
  standard: crStandard,
  star(sp, st) {
    const { F } = CR_FRAMES.star(), L = st.L, t = st.t, spin = Math.sin(t * 1.5) * 0.08;
    const glow = ctx.createRadialGradient(0, -112, 10, 0, -112, 120);
    glow.addColorStop(0, 'rgba(255,240,150,.5)'); glow.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = glow; ctx.fillRect(-120, -232, 240, 240);
    ctx.save(); ctx.translate(0, -108); ctx.rotate(spin);
    const p = new Path2D();
    for (let i = 0; i < 10; i++) { const rr = i % 2 ? 36 : 80, a = i * Math.PI / 5 - Math.PI / 2; p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    p.closePath();
    ctx.lineJoin = 'round'; ctx.strokeStyle = L; ctx.lineWidth = 12; ctx.stroke(p); ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 8; ctx.stroke(p);
    ctx.fillStyle = vgradL(-80, 70, '#fff6a8', '#ffc83a'); ctx.fill(p);
    ctx.restore();
    // little legs and arms
    for (const k of [-1, 1]) { ctx.strokeStyle = L; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(k * 26, -50); ctx.lineTo(k * 30, -6); ctx.stroke(); inkEllipse(k * 30 + 6, -4, 12, 6, 0, '#ff6fae', 0.8, L); }
    crFace(F, sp, st);
    if (sp.hat) { ctx.save(); ctx.translate(F.x + 30, F.y - 66); ctx.rotate(0.4); CR_HATS[sp.hat](30, L, sp, t); ctx.restore(); }
  },
  box(sp, st) {
    const { F } = CR_FRAMES.box(), L = st.L, t = st.t;
    for (const k of [-1, 1]) { ctx.strokeStyle = L; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(k * 18, -30); ctx.lineTo(k * 18, -8); ctx.stroke(); ctx.strokeStyle = '#a8b4c8'; ctx.lineWidth = 6; ctx.stroke(); inkRect(k * 18 - 14, -10, 28, 12, '#5a6a8a', 2, 4); }
    // springy accordion arms
    for (const k of [-1, 1]) { const wav = Math.sin(t * 6 + k) * 8; ctx.strokeStyle = L; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(k * 40, -90); for (let i = 1; i <= 8; i++) ctx.lineTo(k * (40 + i * 4) + (i % 2 ? 6 : -6), -90 + i * 5 + (k > 0 ? -i * 5 + wav : 0)); ctx.stroke(); inkCircle(k * 72, k > 0 ? -92 + wav : -46, 8, '#ffd84a', 0.8, L); }
    inkRect(-42, -112, 84, 82, '#c8d4e8', 3, 12);
    inkRect(-24, -96, 48, 34, '#2a3a5a', 2.4, 6);
    ['#ff5f5f', '#ffd84a', '#5fe08a'].forEach((c, i) => { ctx.fillStyle = Math.sin(t * 5 + i * 2) > 0 ? c : mix(c, '#2a3a5a', 0.6); circle(-12 + i * 12, -84, 4.5); });
    ctx.fillStyle = '#5ff0ff'; ctx.fillRect(-18, -72, 36 * ((Math.sin(t * 2) + 1) / 2), 4);
    inkRect(-10, -122, 20, 12, '#a8b4c8', 2.4, 3);
    inkRect(-38, -188, 84, 70, '#d8e2f2', 3, 16);
    ctx.strokeStyle = L; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, -188); ctx.lineTo(4, -206); ctx.stroke();
    ctx.fillStyle = `hsl(${(t * 120) % 360},90%,60%)`; circle(4, -210, 7);
    for (const k of [-1, 1]) inkCircle(4 + k * 44, -152, 7, '#a8b4c8', 1, L);
    crFace(F, sp, st);
    if (sp.hat) { ctx.save(); ctx.translate(F.x - 12, -188); ctx.rotate(-0.2); CR_HATS[sp.hat](34, L, sp, t); ctx.restore(); }
  },
  fish(sp, st) {
    const { F } = CR_FRAMES.fish(sp), L = st.L, t = st.t, sw = Math.sin(t * 6) * 0.2, c = sp.col;
    ctx.save(); ctx.translate(-62, -104); ctx.rotate(sw);
    ink(P2('M6,0 C-20,-30 -40,-40 -46,-36 C-36,-10 -36,10 -46,36 C-40,40 -20,30 6,0 Z'), sp.finCol || mix(c, '#ff8ad0', 0.4), 1.2, L);
    ctx.restore();
    ink(P2(`M-10,-142 C0,-170 30,-170 34,-146 Z`), sp.finCol || mix(c, '#ff8ad0', 0.4), 1, L);
    const body = new Path2D();
    if (sp.snout) body.moveTo(-70, -104), body.bezierCurveTo(-60, -160, 30, -170, 60, -124), body.bezierCurveTo(80, -118, 100, -116, 104, -104), body.bezierCurveTo(90, -94, 70, -94, 54, -90), body.bezierCurveTo(30, -50, -60, -60, -70, -104);
    else body.ellipse(0, -104, 70, 50, 0, 0, Math.PI * 2);
    ink(body, vgradL(-160, -50, mix(c, '#ffffff', 0.2), c), 1.3, L);
    ctx.save(); ctx.clip(body);
    if (sp.belly) { ctx.fillStyle = sp.belly; ellipse(10, -66, 70, 26); }
    if (sp.stripes) { ctx.fillStyle = sp.stripes; for (const sx of [-30, 0]) ctx.fillRect(sx, -170, 12, 140); }
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(-10, -134, 30, 8, -0.2);
    ctx.restore();
    ctx.save(); ctx.translate(4, -82); ctx.rotate(0.5 + Math.sin(t * 5) * 0.2); ink(P2('M0,0 C-10,10 -12,26 -4,30 C4,22 10,10 0,0 Z'), sp.finCol || mix(c, '#ff8ad0', 0.4), 1, L); ctx.restore();
    crFace(F, sp, st);
    if (sp.hat) { ctx.save(); ctx.translate(F.x - 10, -150); ctx.rotate(0.15); CR_HATS[sp.hat](32, L, sp, t); ctx.restore(); }
    if (sp.hold === 'ball') { ctx.save(); ctx.translate(sp.snout ? 100 : 60, -112 - Math.abs(Math.sin(t * 3)) * 10); CR_HOLD.ball(L, t); ctx.restore(); }
    // bubbles
    for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.strokeStyle = `rgba(255,255,255,${1 - k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(F.x + 40 + Math.sin(k * 8) * 6, F.y - k * 120, 4 + k * 4, 0, Math.PI * 2); ctx.stroke(); }
  },
  octo(sp, st) {
    const { F } = CR_FRAMES.octo(), L = st.L, t = st.t, c = sp.col;
    for (let i = 0; i < 8; i++) {
      const bx = -50 + i * 14, ph = t * 3 + i;
      const p = new Path2D(); p.moveTo(bx - 9, -80);
      p.bezierCurveTo(bx - 14 + Math.sin(ph) * 10, -40, bx - 30 + Math.sin(ph + 1) * 20, -10, bx - 20 + Math.sin(ph) * 16 + (i - 3.5) * 8, -4);
      p.bezierCurveTo(bx - 4 + Math.sin(ph) * 10 + (i - 3.5) * 6, -14, bx + 8, -40, bx + 9, -80); p.closePath();
      ink(p, i % 2 ? mix(c, '#1a0830', 0.12) : c, 1, L);
      ctx.fillStyle = mix(c, '#ffffff', 0.5); circle(bx - 6 + Math.sin(ph + 0.5) * 8, -36, 3); circle(bx - 10 + Math.sin(ph + 1) * 12, -22, 2.5);
    }
    const head = P2('M-66,-100 C-74,-170 -20,-196 10,-190 C60,-184 80,-140 70,-100 C60,-70 -56,-66 -66,-100 Z');
    ink(head, vgradL(-196, -70, mix(c, '#ffffff', 0.2), c), 1.3, L);
    ctx.save(); ctx.clip(head); ctx.fillStyle = mix(c, '#ffffff', 0.4); for (const [sx, sy, r] of [[-30, -160, 8], [-46, -136, 5], [30, -170, 6]]) circle(sx, sy, r); ctx.restore();
    crFace(F, sp, st);
    if (sp.hat) { ctx.save(); ctx.translate(F.x - 4, -186); ctx.rotate(0.1); CR_HATS[sp.hat](40, L, sp, t); ctx.restore(); }
    for (const [item, ix, iy, i] of [['teacup', 76, -40, 0], ['yarn', -88, -30, 1]]) { ctx.save(); ctx.translate(ix, iy + Math.sin(t * 3 + i) * 4); CR_HOLD[item](L, t); ctx.restore(); }
  },
  crab(sp, st) {
    const { F } = CR_FRAMES.crab(), L = st.L, t = st.t, c = sp.col;
    for (const k of [-1, 1]) for (let i = 0; i < 3; i++) { const a = Math.sin(t * 8 + i + k) * 3; ctx.strokeStyle = L; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(k * 30, -50 + i * 6); ctx.lineTo(k * (54 + i * 8), -30 + i * 4 + a); ctx.lineTo(k * (60 + i * 10), -2); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.stroke(); }
    // big claws snapping
    for (const k of [-1, 1]) {
      const snap = Math.abs(Math.sin(t * (st.talk ? 10 : 3) + k)) * 0.4;
      ctx.save(); ctx.translate(k * 70, -100); ctx.scale(k, 1);
      ctx.strokeStyle = L; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-34, 36); ctx.lineTo(-6, 14); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.stroke();
      ctx.save(); ctx.rotate(-snap); ink(P2('M0,0 C0,-30 30,-40 40,-20 C30,-14 16,-10 0,0 Z'), c, 1, L); ctx.restore();
      ctx.save(); ctx.rotate(snap * 0.5); ink(P2('M0,4 C10,20 34,12 38,0 C24,4 12,4 0,4 Z'), c, 1, L); ctx.restore();
      inkCircle(0, 2, 12, c, 1, L);
      ctx.restore();
    }
    const body = P2('M-62,-60 C-66,-100 66,-100 62,-60 C56,-36 -56,-36 -62,-60 Z');
    ink(body, vgradL(-100, -36, mix(c, '#ffffff', 0.25), c), 1.3, L);
    ctx.fillStyle = mix(c, '#ffffff', 0.4); for (const [sx, sy] of [[-36, -80], [-20, -88], [36, -82]]) circle(sx, sy, 3);
    // eyes on stalks
    for (const [sx, k] of [[-10, 0], [18, 1]]) { ctx.strokeStyle = L; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(sx, -88); ctx.lineTo(sx + Math.sin(t * 3 + k) * 3, -104); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.stroke(); }
    crFace({ x: F.x, y: F.y, r: F.r }, { ...sp, eyes: 'none' }, st);
    const eF = { x: 6, y: -96, r: 34 };
    crEyes(eF, sp, st);
    if (sp.eyepatch) inkEllipse(eF.x - eF.r * 0.12, eF.y - eF.r * 0.14, 9, 9, 0, '#1a0a14', 0.6, '#1a0a14');
    if (sp.hat) { ctx.save(); ctx.translate(4, -116); ctx.rotate(-0.1); CR_HATS[sp.hat](34, L, sp, t); ctx.restore(); }
  },
};

// --- the cast -------------------------------------------------------------------------------------
// keyed by the name used in locations.js; anything missing falls back to its emoji
const CHARACTERS = {
  'Mrs. Pickett': { person: 'neighbor' },
  'Mom': { person: 'mom' },
  'Tilly the Turtle': { col: '#a8e07a', belly: '#f4f0a8', bw: 36, bh: 64, hr: 36, ears: 'none', eyes: 'sleepy', lid: '#a8e07a', mouth: 'smile', nose: 'none', shell: true, shellPatch: '#ff9ac0', hat: 'flowers', hold: 'teacup', feet: 'stubby', bigFeet: true, feetCol: '#ff6fae' },
  'Bramble the Bear': { col: '#a8683a', belly: '#e8c08a', bw: 52, bh: 84, hr: 44, ears: 'round', earIn: '#e8a080', nose: 'muzzle', muzzle: '#f0d0a0', mouth: 'grin', eyes: 'tiny', hat: 'honeypot', hold: 'honey', tail: 'stub', shape: 'pear', bigFeet: true, brows: 'bushy', browCol: '#5a3018' },
  'Mama Duck': { col: '#ffffff', belly: '#fff8e8', line: '#5a4a6a', bw: 40, bh: 66, hr: 36, ears: 'none', nose: 'duck', mouth: 'none', eyes: 'lashes', iris: '#3a7ad0', arms: 'wing', feet: 'webbed', hat: 'duckling', neckwear: 'pearls', tail: 'feathers', apron: '#ff9ac0', shape: 'pear', bowCol: '#ff6fae' },
  'Maya': { col: '#ffd0b0', bodyCol: '#ff9a3a', armCol: '#ff9a3a', handCol: '#ffd0b0', legCol: '#5a8ae0', feetCol: '#ff3f6a', hairCol: '#2a1a1a', hair: 'pigtails', bw: 30, bh: 54, hr: 40, ears: 'none', eyes: 'big', iris: '#5a3a1a', mouth: 'toothy', nose: 'button', noseCol: '#e8a080', freckles: true, hold: 'map', dots: '#ffd84a', shape: 'dress' },
  'Leo': { col: '#c8865a', bodyCol: '#4ad08a', armCol: '#4ad08a', handCol: '#c8865a', legCol: '#3a4a8a', feetCol: '#ffffff', hairCol: '#1a0a0a', frontHair: 'curly', bw: 30, bh: 54, hr: 40, ears: 'none', eyes: 'googly', mouth: 'grin', nose: 'button', noseCol: '#8a5030', hat: 'cap', hatCol: '#ff5f5f', hatTilt: -0.15, hold: 'kite', stripes: '#ffffff' },
  'Flutter the Butterfly': { col: '#5a3aa0', bw: 18, bh: 70, hr: 34, ears: 'bigantennae', antTip: '#ff6fae', wings: 'butterfly', eyes: 'lashes', iris: '#ff6fae', mouth: 'smile', legs: 'none', float: true, stripes: '#7a5ac8', hat: 'bow', bowCol: '#ffd84a', arms: 'stubby', armLen: 26, handR: 6, hold: 'bouquet' },
  'Captain Pinch': { body: 'crab', col: '#ff5a3a', eyes: 'googly', mouth: 'grin', hat: 'pirate', eyepatch: true, mustache: '#3a2a1a' },
  'Baker Pip': { col: '#ffd8b8', bodyCol: '#ffffff', armCol: '#ffffff', handCol: '#ffd8b8', legCol: '#3a3a5a', bw: 48, bh: 76, hr: 40, ears: 'none', eyes: 'googly', nose: 'bulb', noseCol: '#ff9a8a', mouth: 'grin', mustache: '#8a5a2a', hat: 'chef', hold: 'rollingpin', shape: 'pear', apron: '#ff9ac0', neckwear: 'bowtie', frontHair: 'bald', puff: '255,255,255' },
  'Miss Whiskers': { col: '#c8c0d8', belly: '#f4eef8', bw: 30, bh: 60, hr: 34, ears: 'mouse', earIn: '#ffaacc', nose: 'button', noseCol: '#ff7aa8', whiskers: true, mouth: 'buck', eyes: 'specs', frames: '#ff6fae', tail: 'thin', neckwear: 'pearls', hat: 'beret', hatCol: '#c06ae0', hold: 'cheese', shape: 'dress', bodyCol: '#ff9ad0', armCol: '#ff9ad0', handCol: '#c8c0d8' },
  'Gnorbert the Gnome': { col: '#ffd0b0', bodyCol: '#4a7ae0', armCol: '#4a7ae0', handCol: '#ffd0b0', legCol: '#8a5a2a', feetCol: '#5a3018', bw: 36, bh: 50, hr: 34, lh: 10, ears: 'none', eyes: 'tiny', nose: 'bulb', noseCol: '#ff8a8a', mouth: 'none', beard: '#ffffff', beardLen: 2.2, hat: 'gnome', hatTilt: 0, belt: '#3a2a1a', hold: 'lantern', bigFeet: true },
  'Penny the Pig': { col: '#ffb0c8', bw: 46, bh: 66, hr: 42, ears: 'floppy', nose: 'pig', mouth: 'grin', eyes: 'lashes', iris: '#5a8ae0', tail: 'curly', tutu: '#c6a2ff', hat: 'tiara', bigFeet: true, feetCol: '#8a4a5a', hold: 'wand', shape: 'pear' },
  'Fergus the Frog': { col: '#5ad06a', belly: '#d8f4a0', bw: 44, bh: 56, hr: 44, headShape: 'wide', ears: 'none', eyes: 'monocle', eyeSize: 1.25, mouth: 'grin', mouthX: 0.2, nose: 'none', hat: 'tophat', hatExtra: 'buckle', hatCol: '#2a2a4a', neckwear: 'bowtie', tieCol: '#ffd84a', feet: 'webbed', feetCol: '#3ab04a', hold: 'cane', spots: '#3ab04a', blush: true },
  'Queen Bumble': { col: '#ffd23a', stripes: '#2a1a1a', bw: 46, bh: 66, hr: 38, ears: 'antennae', wings: 'bee', eyes: 'lashes', iris: '#8a4ae0', mouth: 'smile', hat: 'crown', cape: '#c03ad0', legs: 'none', float: true, hold: 'honey', neckwear: 'ruff', legCol: '#2a1a1a', armCol: '#2a1a1a', handCol: '#ffd23a' },
  'Silvie the Spider': { col: '#7a5ac8', belly: '#a88ae8', bw: 40, bh: 54, hr: 34, ears: 'none', eyes: 'big', iris: '#ff6fae', eyeSize: 1.1, mouth: 'fang', legs8: true, hold: 'yarn', hat: 'bigbow', bowCol: '#ff6fae', dots: '#c8b0ff', feetCol: '#ff6fae' },
  'Ruby Robin': { col: '#8a6a4a', belly: '#ff5a3a', bw: 34, bh: 56, hr: 34, ears: 'none', nose: 'beak', mouth: 'none', eyes: 'big', iris: '#2a1a1a', arms: 'wing', feet: 'webbed', feetCol: '#ffa22a', hat: 'headphones', hold: 'worm', tail: 'feathers' },
  'Otto the Otter': { col: '#8a5a3a', belly: '#e0c0a0', face: '#e0c0a0', bw: 36, bh: 76, hr: 34, ears: 'tiny', nose: 'button', whiskers: true, mouth: 'buck', eyes: 'googly', tail: 'paddle', hold: 'shell', hat: 'beret', hatCol: '#5fb8f0', shape: 'pear' },
  'Millie Mouse': { col: '#a8a0b0', belly: '#f0e8f0', bw: 26, bh: 46, hr: 30, ears: 'mouse', nose: 'button', noseCol: '#ff7aa8', whiskers: true, mouth: 'buck', eyes: 'big', iris: '#3a2a6a', tail: 'thin', hat: 'cheese', hold: 'cheese', shape: 'dress', bodyCol: '#5fb87a', dots: '#ffffff', armCol: '#5fb87a', handCol: '#a8a0b0' },
  'Granny Owl': { col: '#a07a5a', belly: '#f0dcc0', bw: 46, bh: 70, hr: 44, ears: 'tufts', nose: 'hook', beakCol: '#ffb83a', mouth: 'none', eyes: 'specs', eyeSize: 1.35, frames: '#c06ae0', arms: 'wing', feet: 'claws', feetCol: '#ffb83a', hat: 'nightcap', hatCol: '#c06ae0', hold: 'yarn', neckwear: 'scarf', scarfCol: '#5fd0a0', shape: 'pear' },
  'Pixie Dot': { col: '#d0f0ff', bodyCol: '#ff8ad0', armCol: '#d0f0ff', handCol: '#d0f0ff', legCol: '#d0f0ff', feetCol: '#ff6fae', hairCol: '#5fe0c0', frontHair: 'spiky', bw: 22, bh: 44, hr: 30, ears: 'pointy', earCol: '#d0f0ff', wings: 'fairy', eyes: 'big', iris: '#2ac08a', mouth: 'grin', float: true, hold: 'wand', shape: 'dress', dots: '#ffe36b' },
  'Luna Moth': { col: '#c8f0d8', bw: 24, bh: 66, hr: 34, ears: 'bigantennae', antTip: '#ff9ac0', wings: 'moth', eyes: 'sleepy', lid: '#a8e0c0', mouth: 'smile', legs: 'none', float: true, hat: 'nightcap', hatCol: '#8a7ae0', hold: 'lantern', armLen: 26, handR: 6 },
  'Lady Swan': { col: '#ffffff', line: '#6a5a8a', bw: 46, bh: 60, hr: 28, neck: 60, hx: 40, ears: 'none', nose: 'beak', beakCol: '#ff7a3a', mouth: 'none', eyes: 'lashes', iris: '#5a3ab0', arms: 'wing', feet: 'webbed', feetCol: '#2a2a3a', hat: 'tiara', neckwear: 'boa', tail: 'feathers', shape: 'pear' },
  'Tinker Bot': { body: 'box', col: '#c8d4e8', line: '#3a4a6a', eyes: 'visor', mouth: 'grin', blush: false, hat: 'propeller' },
  'Ringmaster Rosie': { col: '#f0c09a', bodyCol: '#e02a4a', armCol: '#e02a4a', handCol: '#ffffff', legCol: '#ffffff', feetCol: '#2a1a1a', hairCol: '#ffd84a', hair: 'long', frontHair: 'curly', bw: 38, bh: 66, hr: 38, ears: 'none', eyes: 'lashes', iris: '#2a8a5a', mouth: 'grin', nose: 'button', noseCol: '#d88a6a', hat: 'tophat', hatCol: '#e02a4a', bandCol: '#ffd84a', hold: 'baton', buttons: '#ffd84a', mustache: '#ffd84a', bigFeet: true },
  'Finn the Fish': { body: 'fish', col: '#ff9a3a', stripes: '#ffffff', finCol: '#ffcf3a', eyes: 'googly', eyeSize: 1.3, mouth: 'o', hat: 'cap', hatCol: '#5fb8f0', float: true },
  'Grandma Weave': { col: '#f4d0b0', bodyCol: '#5fb8a0', armCol: '#5fb8a0', handCol: '#f4d0b0', legCol: '#f4d0b0', feetCol: '#c06ae0', hairCol: '#e8e4f0', frontHair: 'curly', hair: 'bun', bw: 40, bh: 68, hr: 38, ears: 'none', eyes: 'specs', eyeSize: 1.3, frames: '#ff6fae', mouth: 'smile', nose: 'bulb', noseCol: '#ffaa9a', hat: 'curlers', hold: 'yarn', shape: 'dress', dots: '#ffe36b', neckwear: 'pearls' },
  'Scamper Squirrel': { col: '#d07a3a', belly: '#f8dcb0', bw: 30, bh: 54, hr: 34, ears: 'pointy', nose: 'button', mouth: 'buck', eyes: 'googly', eyeSize: 1.2, tail: 'bushy', hold: 'acorn', hat: 'propeller', whiskers: true },
  'Twinkle the Star': { body: 'star', col: '#ffd84a', line: '#a8701a', eyes: 'shades', shadeCol: '#ff3f8a', mouth: 'grin', float: true },
  'Seamus Shamrock': { col: '#ffd8b8', bodyCol: '#3ab04a', armCol: '#3ab04a', handCol: '#ffd8b8', legCol: '#2a7a3a', feetCol: '#2a1a1a', bw: 34, bh: 52, hr: 36, lh: 12, ears: 'pointy', earCol: '#ffd8b8', eyes: 'googly', mouth: 'grin', nose: 'bulb', noseCol: '#ff8a7a', beard: '#ff7a2a', beardLen: 1.3, hat: 'tophat', hatCol: '#3ab04a', bandCol: '#2a1a1a', hatExtra: 'shamrock', hold: 'gold', belt: '#2a1a1a', freckles: true, bigFeet: true },
  'Marina the Mermaid': { col: '#e8b090', bodyCol: '#c06ae0', armCol: '#e8b090', handCol: '#e8b090', hairCol: '#ff5fa2', hair: 'wavy', frontHair: 'fringe', bw: 30, bh: 50, hr: 36, legs: 'tail', tailCol: '#3ad0c0', finCol: '#c06ae0', ears: 'none', eyes: 'lashes', iris: '#2ab0c0', mouth: 'grin', nose: 'button', noseCol: '#d08a6a', hat: 'crown', crownCol: '#ffe8f4', hold: 'trident', neckwear: 'pearls' },
  'Pip the Baby Dragon': { col: '#7ad88a', belly: '#fff0a0', bw: 40, bh: 56, hr: 42, ears: 'horns', nose: 'button', noseCol: '#3a8a4a', mouth: 'fang', eyes: 'big', iris: '#ff8a3a', eyeSize: 1.2, wings: 'dragon', wingCol: '#5ab8e0', tail: 'dragon', diaper: true, hold: 'ball', puff: '200,200,210', bigFeet: true },
  'Princess Nimbus': { col: '#ffe0d0', bodyCol: '#a8d8ff', armCol: '#a8d8ff', handCol: '#ffe0d0', legs: 'none', float: true, bw: 34, bh: 62, hr: 36, ears: 'none', eyes: 'lashes', iris: '#5a8ae0', mouth: 'smile', nose: 'button', noseCol: '#f0a090', hat: 'cloudhair', hatTilt: 0, shape: 'dress', dots: '#ffffff', hold: 'starwand' },
  'Echo the Bat': { col: '#6a4a8a', belly: '#a888c8', bw: 30, bh: 50, hr: 36, ears: 'bat', earIn: '#ff9ad0', wings: 'bat', wingCol: '#4a2a6a', nose: 'pig', mouth: 'fang', eyes: 'shades', shadeCol: '#1a1a2a', hat: 'headphones', arms: 'stubby', float: true, legs: 'none' },
  'Blaze the Phoenix': { col: '#ff5a2a', belly: '#ffd84a', bw: 36, bh: 64, hr: 34, ears: 'none', nose: 'hook', beakCol: '#ffe14a', mouth: 'none', eyes: 'stars', arms: 'wing', feet: 'claws', feetCol: '#ffb83a', hat: 'flame', hatTilt: 0, tail: 'flames' },
  'Wishbone the Frog': { col: '#5a8ae0', belly: '#c8e0ff', bw: 40, bh: 54, hr: 42, headShape: 'wide', ears: 'none', eyes: 'big', iris: '#ffd84a', eyeSize: 1.3, mouth: 'tongue', mouthX: 0.2, nose: 'none', hat: 'wizard', hatCol: '#2a1a5a', cape: '#8a3ae0', feet: 'webbed', feetCol: '#3a6ac0', hold: 'wand', dots: '#ffe36b' },
  'Pengu the Penguin': { col: '#2a2a4a', belly: '#ffffff', face: '#ffffff', bw: 38, bh: 66, hr: 36, ears: 'none', nose: 'beak', beakCol: '#ffa22a', mouth: 'none', eyes: 'googly', arms: 'fin', feet: 'webbed', feetCol: '#ffa22a', hat: 'earmuffs', hatTilt: 0, neckwear: 'scarf', scarfCol: '#ff3f6a', hold: 'snowball', shape: 'pear' },
  'Hazel Hedgehog': { col: '#c8906a', belly: '#f8e0c8', face: '#f8e0c8', bw: 34, bh: 50, hr: 34, ears: 'tiny', nose: 'button', mouth: 'smile', eyes: 'big', iris: '#5a3a1a', spikes: '#8a5a3a', hat: 'flowers', hold: 'lantern' },
  'Wizard Wendell': { col: '#ffd8c0', bodyCol: '#5a3ab0', armCol: '#5a3ab0', handCol: '#ffd8c0', bw: 38, bh: 78, hr: 34, legs: 'none', ears: 'none', eyes: 'googly', mouth: 'none', nose: 'bulb', noseCol: '#ffa08a', beard: '#f4f0ff', beardLen: 2.6, brows: 'bushy', browCol: '#ffffff', hat: 'wizard', hatCol: '#5a3ab0', shape: 'dress', dots: '#ffe36b', hold: 'starwand' },
  'Olive the Octopus': { body: 'octo', col: '#c06ae0', eyes: 'specs', frames: '#ffd84a', mouth: 'grin', hat: 'bigbow', bowCol: '#5fe0c0' },
  'Grandpa Smolder': { col: '#c04a5a', belly: '#ffcf9a', bw: 50, bh: 72, hr: 44, ears: 'horns', hornCol: '#fff2c8', nose: 'button', noseCol: '#7a2a3a', mouth: 'toothy', eyes: 'specs', frames: '#e8b830', brows: 'bushy', browCol: '#ffffff', beard: '#ffffff', beardLen: 0.9, wings: 'dragon', wingCol: '#8a3a6a', tail: 'dragon', hat: 'nightcap', hatCol: '#5f8ae0', hold: 'cane', puff: '210,210,220', shape: 'pear', bigFeet: true },
  'Dolly the Dolphin': { body: 'fish', snout: true, col: '#7ab8e8', belly: '#e8f4ff', finCol: '#5a9ad0', eyes: 'lashes', iris: '#3a5ab0', mouth: 'grin', hold: 'ball', float: true },
  'Cosmo the Space Fox': { col: '#ff8a3a', belly: '#ffffff', face: '#ffffff', bw: 32, bh: 60, hr: 36, ears: 'pointy', earIn: '#2a1a1a', nose: 'long', mouth: 'grin', mouthX: 0.55, mouthY: 0.55, eyes: 'big', iris: '#3ab0e0', tail: 'fox', hat: 'bubble', hatTilt: 0, bodyCol: '#d8e2f2', armCol: '#d8e2f2', handCol: '#ff8a3a', belt: '#5a6a8a', hold: 'telescope' },
};
Object.entries(CHARACTERS).forEach(([n, sp], i) => { sp.seed = i * 0.77; });

function drawCritter(name, x, gy, s = 1, dir = 1) {
  const sp = CHARACTERS[name];
  if (!sp) return false;
  if (sp.person) { drawPerson(sp.person, x, gy, dir, 0, false, s * 0.78); return true; }
  const t = crTime(), talk = crTalking(name);
  const st = { t, talk, L: sp.line || crLine(sp.col), blink: ((t + sp.seed) % 4.1) < 0.13 };
  const hop = talk ? Math.abs(Math.sin(t * 9)) * 6 : 0;
  const breathe = 1 + Math.sin(t * 2.4 + sp.seed) * 0.025;
  ctx.save(); ctx.translate(x, gy); ctx.scale(dir * s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.fillStyle = 'rgba(40,20,60,.2)'; ellipse(0, 0, 54 - hop, 8);
  ctx.translate(0, -hop - (sp.float ? 26 + Math.sin(t * 2) * 8 : 0));
  ctx.scale(1 / Math.sqrt(breathe), breathe); // squash-and-stretch breathing
  try { (CR_BODIES[sp.body] || crStandard)(sp, st); } finally { ctx.restore(); }
  return true;
}
// head-and-shoulders view for the dialog box
function drawCritterPortrait(name, x, y, w, h) {
  const sp = CHARACTERS[name];
  if (!sp) return false;
  if (sp.person) { drawPersonPortrait(sp.person, x, y, w, h, false); return true; }
  const { F } = crFrame(sp);
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#fff3c8'); g.addColorStop(1, '#ffd0ea');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  const k = 40 / F.r, lift = sp.float ? 26 : 0;
  drawCritter(name, x + w / 2 - F.x * k, y + h * 0.56 - (F.y - lift) * k, k, 1);
  ctx.restore();
  return true;
}
