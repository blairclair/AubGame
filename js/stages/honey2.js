'use strict';
{
  // ===========================================================================
  // Honey Tree Hill becomes LIGHTHOUSE POINT: a sunset harbour on a rocky point, with a tall
  // red-and-white lighthouse, a wooden pier, fishing boats, gulls, buoys and lobster pots.
  // The keeper is Salty the Seal, in a white keeper's cap with an anchor badge and a ship's lantern.
  //   game 1 (action) Light the Way: it's a foggy night. Aubrey works the lighthouse lamp. Swing the
  //            beam onto each fishing boat as it nears the hidden rocks and HOLD it there until the
  //            captain can see; then the boat steers safely round. Tier 2+: more boats at once.
  //   game 2 (learn) Magnet Fishing: magnetism. Walk Aubrey along the pier and drop a magnet on a
  //            line to the sea floor. Magnets pull things made of IRON and STEEL (keys, nails, clips),
  //            even under water, but not wood, plastic, cloth or shells. Only dip for the things a
  //            magnet can catch! Tier 3 adds metals that are NOT magnetic (gold, brass).
  // ===========================================================================
  const FRIEND = 'Salty the Seal';
  const TWO_PI = Math.PI * 2;
  const say = (g, s) => { g.say = s; speak(s); };
  const inkAll = (items, lw, line = OL) => {
    ctx.strokeStyle = line; ctx.lineWidth = lw * 2;
    for (const [p] of items) ctx.stroke(p);
    for (const [p, f] of items) { ctx.fillStyle = f; ctx.fill(p); }
  };
  const bubble = (x, y, str, col = '#2a3a6e', size = 17) => {
    ctx.font = `700 ${size}px ${FONT}`; const w = ctx.measureText(str).width + 26, h = size + 19;
    const bx = clamp(x, w / 2 + 8, W - w / 2 - 8);
    ctx.fillStyle = OL; ctx.beginPath(); ctx.roundRect(bx - w / 2 - 2.5, y - h / 2 - 2.5, w + 5, h + 5, 20); ctx.fill(); tri(x - 10, y + h / 2 - 2, x + 10, y + h / 2 - 2, x + 2, y + h / 2 + 14);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(bx - w / 2, y - h / 2, w, h, 18); ctx.fill(); tri(x - 7, y + h / 2 - 4, x + 7, y + h / 2 - 4, x + 2, y + h / 2 + 10);
    text(str, bx, y, size, col, 'center', 700);
  };
  const ease = k => 1 - Math.pow(1 - clamp(k, 0, 1), 3);

  // =============================================================================================
  // Salty the Seal: a white keeper's cap with an anchor badge, and a glowing ship's lantern
  // =============================================================================================
  CR_HATS.lh2cap = (r, L, sp, t) => {
    const top = P2(`M${-r * 0.86},${-r * 0.1} C${-r * 1.0},${-r * 0.62} ${r * 1.0},${-r * 0.62} ${r * 0.86},${-r * 0.1} Z`);
    const band = P2(`M${-r * 0.72},${-r * 0.16} L${r * 0.72},${-r * 0.16} L${r * 0.68},${r * 0.14} L${-r * 0.68},${r * 0.14} Z`);
    const peak = P2(`M${-r * 0.62},${r * 0.1} C${-r * 0.3},${r * 0.42} ${r * 0.5},${r * 0.42} ${r * 0.9},${r * 0.16} C${r * 0.5},${r * 0.2} ${-r * 0.3},${r * 0.2} ${-r * 0.62},${r * 0.1} Z`);
    inkAll([[top, '#ffffff'], [band, '#24356e'], [peak, '#1a1a2e']], 1.1, L);
    ctx.fillStyle = 'rgba(160,180,220,.35)'; ellipse(r * 0.2, -r * 0.3, r * 0.5, r * 0.08);
    // gold anchor badge
    ctx.save(); ctx.translate(0, -r * 0.01); ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -r * 0.1); ctx.lineTo(0, r * 0.1); ctx.moveTo(-r * 0.08, -r * 0.05); ctx.lineTo(r * 0.08, -r * 0.05); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, r * 0.02, r * 0.1, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(r * 0.06 + Math.sin(t * 2) * 0.5, -r * 0.06, r * 0.025);
  };
  CR_HOLD.lh2lantern = (L, t) => {
    ctx.strokeStyle = L; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 4, 7, Math.PI, 0); ctx.stroke();
    const gl = 0.45 + 0.15 * Math.sin(t * 6);
    const gr = ctx.createRadialGradient(0, 24, 2, 0, 24, 34);
    gr.addColorStop(0, `rgba(255,220,120,${gl})`); gr.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = gr; circle(0, 24, 34);
    inkRect(-11, 8, 22, 6, '#c8902a', 1.6, 2);
    inkRect(-9, 13, 18, 22, 'rgba(255,236,160,.95)', 1.6, 3);
    ctx.fillStyle = '#ff9a2a'; ellipse(0, 26 + Math.sin(t * 9), 3.5, 6);
    ctx.fillStyle = '#fff4b0'; ellipse(0, 27 + Math.sin(t * 9), 1.8, 3.5);
    ctx.strokeStyle = '#c8902a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-3, 13); ctx.lineTo(-3, 35); ctx.moveTo(3, 13); ctx.lineTo(3, 35); ctx.stroke();
    inkRect(-11, 34, 22, 5, '#c8902a', 1.6, 2);
  };
  CHARACTERS[FRIEND] = {
    col: '#8a9cba', belly: '#e2eaf4', face: '#d4deec', bw: 46, bh: 70, hr: 38, ears: 'tiny', nose: 'button', noseCol: '#2a2a40',
    whiskers: true, mouth: 'grin', eyes: 'big', iris: '#2a2a50', eyeSize: 1.15, arms: 'fin', feet: 'webbed', feetCol: '#6a7c9a',
    hat: 'lh2cap', hatTilt: -0.08, neckwear: 'scarf', scarfCol: '#ff4a5a', hold: 'lh2lantern', tail: 'stub', shape: 'pear', blush: true,
    spots: '#7a8cac', seed: 5.7,
  };

  // =============================================================================================
  // seaside props shared by the backdrop and the games
  // =============================================================================================
  // a red-and-white lighthouse: (x, base) is the bottom middle, h its height to the gallery
  function drawLighthouse(x, base, h, s, lamp = 1) {
    const bw = 40 * s, tw = 25 * s, top = base - h, t = S.t;
    const tower = P2(`M${x - bw},${base} L${x - tw},${top} L${x + tw},${top} L${x + bw},${base} Z`);
    ink(tower, '#ffffff', 1.4 * s + 0.6);
    ctx.save(); ctx.clip(tower); ctx.fillStyle = '#ef4a4a';
    for (let k = 0; k < 4; k++) { const y0 = base - h * (k * 2 + 1) / 8; ctx.fillRect(x - bw, y0 - h / 8, bw * 2, h / 8); }
    const sh = ctx.createLinearGradient(x - bw, 0, x + bw, 0);
    sh.addColorStop(0, 'rgba(255,255,255,.25)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(40,20,60,.25)');
    ctx.fillStyle = sh; ctx.fillRect(x - bw, top, bw * 2, h);
    ctx.restore();
    // little windows and a door
    for (const k of [0.3, 0.62]) inkRect(x - 4 * s, base - h * k - 7 * s, 8 * s, 13 * s, '#3a4a7a', 1, 3 * s);
    ink(P2(`M${x - 8 * s},${base} L${x - 8 * s},${base - 16 * s} C${x - 8 * s},${base - 24 * s} ${x + 8 * s},${base - 24 * s} ${x + 8 * s},${base - 16 * s} L${x + 8 * s},${base} Z`), '#5a3a2a', 1);
    // gallery, lamp room and dome
    inkRect(x - tw - 8 * s, top - 6 * s, (tw + 8 * s) * 2, 7 * s, '#3a3a5a', 1, 2);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.moveTo(x - tw - 8 * s, top - 15 * s); ctx.lineTo(x + tw + 8 * s, top - 15 * s); ctx.stroke();
    for (let k = 0; k <= 6; k++) { const px = x - tw - 8 * s + k * (tw + 8 * s) * 2 / 6; ctx.beginPath(); ctx.moveTo(px, top - 6 * s); ctx.lineTo(px, top - 15 * s); ctx.stroke(); }
    const lr = 17 * s, lh = 26 * s, ly = top - 6 * s - lh;
    inkRect(x - lr, ly, lr * 2, lh, lamp > 0.5 ? '#fff4b0' : '#bfe4ff', 1.1, 3 * s);
    if (lamp > 0.05) {
      const gr = ctx.createRadialGradient(x, ly + lh / 2, 2, x, ly + lh / 2, 60 * s);
      gr.addColorStop(0, `rgba(255,240,170,${0.7 * lamp})`); gr.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = gr; circle(x, ly + lh / 2, 60 * s);
      ctx.fillStyle = '#ffe36b'; circle(x, ly + lh / 2, 7 * s);
    }
    ctx.strokeStyle = OL; ctx.lineWidth = 1.2 * s; for (const k of [-0.33, 0.33]) { ctx.beginPath(); ctx.moveTo(x + k * lr * 2, ly); ctx.lineTo(x + k * lr * 2, ly + lh); ctx.stroke(); }
    ink(P2(`M${x - lr - 5 * s},${ly + 1} C${x - lr},${ly - 20 * s} ${x + lr},${ly - 20 * s} ${x + lr + 5 * s},${ly + 1} Z`), '#ef4a4a', 1.1);
    inkCircle(x, ly - 16 * s, 4 * s, '#ffd23a', 0.8);
    return { lx: x, ly: ly + lh / 2 };
  }
  // a lighthouse beam: a soft wedge of light from (x, y) along angle a
  function beam(x, y, a, half, len, alpha) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(x, y, 4, x, y, len);
    gr.addColorStop(0, `rgba(255,246,190,${alpha})`); gr.addColorStop(0.6, `rgba(255,240,170,${alpha * 0.45})`); gr.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a - half) * len, y + Math.sin(a - half) * len);
    ctx.lineTo(x + Math.cos(a + half) * len, y + Math.sin(a + half) * len);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // fishing boats: kind 0 = fishing boat with a wheelhouse, 1 = sailboat, 2 = little tug
  const BOAT_COLS = [['#ff6a5a', '#ffffff'], ['#40a8ff', '#ffe36b'], ['#5ac87a', '#ffffff'], ['#ffb02a', '#40a8ff'], ['#a97cff', '#ffffff']];
  function drawBoat(x, y, s, kind, ci, dir = -1, lamp = 0.6) {
    const [c1, c2] = BOAT_COLS[ci % BOAT_COLS.length], t = S.t;
    ctx.save(); ctx.translate(x, y + Math.sin(t * 2.4 + x * 0.05) * 2 * s); ctx.scale(s * dir, s); ctx.rotate(Math.sin(t * 2 + x) * 0.04);
    ctx.lineJoin = 'round';
    const hull = P2('M-46,-14 L48,-14 C46,0 34,12 20,12 L-34,12 C-42,6 -46,-4 -46,-14 Z');
    if (kind === 1) {
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-2, -14); ctx.lineTo(-2, -92); ctx.stroke();
      inkAll([[P2('M2,-88 C26,-60 34,-34 36,-18 L2,-18 Z'), c2], [P2('M-6,-84 C-24,-60 -32,-36 -36,-18 L-6,-18 Z'), '#ffffff']], 1.2);
      ctx.fillStyle = c1; ctx.fillRect(4, -40, 26, 5);
      ink(P2('M-2,-92 L16,-86 L-2,-80 Z'), '#ff5f7e', 0.8);
    } else if (kind === 2) {
      inkAll([[P2('M-26,-14 L-26,-40 L14,-40 L14,-14 Z'), c2], [P2('M-20,-40 L-20,-60 L-2,-60 L-2,-40 Z'), c1]], 1.2);
      ctx.fillStyle = '#3a3a5a'; ctx.fillRect(-20, -64, 18, 5);
      for (const wx of [-20, -4]) inkRect(wx, -34, 10, 10, lamp > 0.3 ? '#ffe88a' : '#bfe4ff', 0.8, 2);
      for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(230,230,240,${0.5 - k * 0.14})`; circle(-11 + k * 6, -72 - k * 9 - (t * 10 % 9), 5 + k * 2); }
      inkCircle(30, -2, 6, '#ffffff', 0.8); ctx.fillStyle = '#3a3a5a'; circle(30, -2, 2.5);
    } else {
      inkAll([[P2('M-34,-14 L-34,-46 L-2,-46 L4,-14 Z'), '#ffffff'], [P2('M-38,-46 L2,-46 L-2,-54 L-34,-54 Z'), c1]], 1.2);
      inkRect(-28, -40, 12, 11, lamp > 0.3 ? '#ffe88a' : '#bfe4ff', 0.8, 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(24, -14); ctx.lineTo(24, -60); ctx.lineTo(44, -26); ctx.stroke();
      ctx.strokeStyle = '#c8b090'; ctx.lineWidth = 1.2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(26 + k * 4, -50 + k * 8); ctx.lineTo(26 + k * 4, -14); ctx.stroke(); }
    }
    ink(hull, c1, 1.3);
    ctx.save(); ctx.clip(hull); ctx.fillStyle = c2; ctx.fillRect(-50, -12, 100, 5); ctx.fillStyle = 'rgba(30,20,60,.25)'; ctx.fillRect(-50, 4, 100, 10); ctx.restore();
    inkCircle(-30, -4, 3.2, '#ffffff', 0.6); inkCircle(-18, -4, 3.2, '#ffffff', 0.6);
    // a little masthead lamp
    if (lamp > 0) {
      const lx = kind === 1 ? -2 : kind === 2 ? -11 : 24, lyy = kind === 1 ? -94 : kind === 2 ? -62 : -62;
      const gr = ctx.createRadialGradient(lx, lyy, 1, lx, lyy, 18);
      gr.addColorStop(0, `rgba(255,230,140,${0.8 * lamp})`); gr.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = gr; circle(lx, lyy, 18); ctx.fillStyle = '#fff4b0'; circle(lx, lyy, 3);
    }
    ctx.restore();
    // wake
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2 * s; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const wx = x - dir * (52 + k * 16) * s, wy = y + 12 * s; ctx.beginPath(); ctx.moveTo(wx, wy - k * 3 * s); ctx.lineTo(wx - dir * 12 * s, wy - k * 3 * s + 1); ctx.stroke(); }
  }
  function gull(x, y, s, flap) {
    ctx.strokeStyle = OL; ctx.lineWidth = 2.6 * s; ctx.lineCap = 'round';
    const f = Math.sin(flap) * 6 * s;
    ctx.beginPath(); ctx.moveTo(x - 14 * s, y - 3 * s + f); ctx.quadraticCurveTo(x - 7 * s, y - 9 * s + f * 0.5, x, y); ctx.quadraticCurveTo(x + 7 * s, y - 9 * s + f * 0.5, x + 14 * s, y - 3 * s + f); ctx.stroke();
  }
  function perchedGull(x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    inkAll([[P2('M-14,-6 C-14,-20 8,-22 12,-10 C14,-2 6,4 -6,2 C-12,2 -14,-2 -14,-6 Z'), '#ffffff'], [P2('M4,-14 C4,-26 18,-26 18,-16 C18,-10 10,-8 6,-10 Z'), '#ffffff']], 1);
    ctx.fillStyle = '#9aa8c0'; ellipse(-4, -10, 9, 4, -0.2);
    ctx.fillStyle = '#ffb02a'; tri(17, -19, 25, -17, 17, -15);
    ctx.fillStyle = OL; circle(13, -19, 1.6);
    ctx.strokeStyle = '#ffb02a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, 2); ctx.lineTo(-2, 8); ctx.moveTo(3, 1); ctx.lineTo(3, 8); ctx.stroke();
    ctx.restore();
  }
  function buoy(x, y, s, col = '#ff5a4a') {
    const bob = Math.sin(S.t * 2.2 + x) * 3 * s;
    ctx.save(); ctx.translate(x, y + bob); ctx.rotate(Math.sin(S.t * 1.7 + x) * 0.08);
    inkAll([[P2(`M${-14 * s},0 C${-14 * s},${-34 * s} ${14 * s},${-34 * s} ${14 * s},0 Z`), col], [P2(`M${-4 * s},${-28 * s} L${4 * s},${-28 * s} L${3 * s},${-48 * s} L${-3 * s},${-48 * s} Z`), '#ffffff']], 1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-13 * s, -14 * s, 26 * s, 5 * s);
    inkCircle(0, -52 * s, 4 * s, '#ffe36b', 0.8);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y + bob + 1, 20 * s, 4 * s, 0, 0, TWO_PI); ctx.stroke();
  }
  function ropeCoil(x, y, s = 1) {
    for (let k = 0; k < 4; k++) inkEllipse(x, y - k * 5 * s, (24 - k * 3) * s, (9 - k) * s, 0, k % 2 ? '#e8c890' : '#d8b070', 1);
    ctx.fillStyle = '#a07840'; ellipse(x, y - 15 * s, 8 * s, 3 * s);
  }
  function crate(x, y, w, h, col = '#c8904a') {
    inkRect(x, y - h, w, h, col, 2, 3);
    ctx.strokeStyle = 'rgba(90,50,20,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 3, y - 3); ctx.lineTo(x + w - 3, y - h + 3); ctx.moveTo(x, y - h / 2); ctx.lineTo(x + w, y - h / 2); ctx.stroke();
  }
  function lobsterPot(x, y, s = 1) {
    const p = P2(`M${x - 26 * s},${y} L${x - 26 * s},${y - 22 * s} C${x - 26 * s},${y - 44 * s} ${x + 26 * s},${y - 44 * s} ${x + 26 * s},${y - 22 * s} L${x + 26 * s},${y} Z`);
    ink(p, 'rgba(255,230,180,.25)', 1.2);
    ctx.save(); ctx.clip(p); ctx.strokeStyle = '#3a7a9a'; ctx.lineWidth = 1.4;
    for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(x + k * 6 * s, y); ctx.lineTo(x + k * 6 * s + 20 * s, y - 50 * s); ctx.moveTo(x + k * 6 * s, y); ctx.lineTo(x + k * 6 * s - 20 * s, y - 50 * s); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3 * s; ctx.stroke(p);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.5; ctx.stroke(p);
  }
  function lifeRing(x, y, r) {
    inkCircle(x, y, r, '#ffffff', 1.4);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.arc(x, y, r * 0.55, 0, TWO_PI, true); ctx.clip();
    ctx.fillStyle = '#ff4a4a'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r + 2, k * Math.PI / 2, k * Math.PI / 2 + Math.PI / 4); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TWO_PI); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0)';
  }
  function starfish(x, y, s, col = '#ff8a5a') {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s * 0.6);
    const p = new Path2D();
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 5 : 13; p.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    p.closePath(); ink(p, col, 1);
    ctx.restore();
  }
  function rockLump(x, y, w, h, col = '#7a7088') {
    const p = P2(`M${x - w},${y} C${x - w},${y - h * 0.7} ${x - w * 0.5},${y - h} ${x - w * 0.1},${y - h} C${x + w * 0.4},${y - h * 1.05} ${x + w},${y - h * 0.6} ${x + w},${y} Z`);
    ink(p, col, 1.3);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ellipse(x - w * 0.3, y - h * 0.7, w * 0.3, h * 0.15, -0.3);
  }

  // =============================================================================================
  // the backdrop: Lighthouse Point at sunset
  // =============================================================================================
  const HZ = 292; // horizon
  BACKDROPS.lighthouse_h2 = () => {
    const t = S.t;
    const sky = ctx.createLinearGradient(0, 0, 0, HZ);
    sky.addColorStop(0, '#6a9cf0'); sky.addColorStop(0.45, '#ffa8c8'); sky.addColorStop(1, '#ffd890');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HZ + 2);
    // the setting sun, sinking into the sea
    ctx.fillStyle = 'rgba(255,240,170,.35)'; circle(470, HZ - 4, 84);
    ctx.fillStyle = 'rgba(255,230,150,.5)'; circle(470, HZ - 4, 60);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, HZ); ctx.clip(); inkCircle(470, HZ - 4, 44, '#ffe05a', 2); ctx.restore();
    // pink and gold clouds
    for (const [x0, y, s] of [[90, 120, 1], [360, 84, 0.8], [640, 140, 1.1], [860, 96, 0.7]]) {
      const x = ((x0 + t * 5 * s) % (W + 200)) - 100;
      ctx.fillStyle = 'rgba(255,214,226,.9)'; ellipse(x, y, 60 * s, 14 * s); ellipse(x + 30 * s, y - 9 * s, 34 * s, 12 * s); ellipse(x - 34 * s, y + 2, 28 * s, 9 * s);
      ctx.fillStyle = 'rgba(255,240,200,.85)'; ellipse(x + 10 * s, y + 7 * s, 46 * s, 5 * s);
    }
    // far islands
    ctx.fillStyle = '#b48ac8';
    ctx.beginPath(); ctx.moveTo(0, HZ); ctx.quadraticCurveTo(60, HZ - 30, 140, HZ - 12); ctx.quadraticCurveTo(190, HZ - 22, 240, HZ); ctx.fill();
    ctx.beginPath(); ctx.moveTo(600, HZ); ctx.quadraticCurveTo(650, HZ - 18, 700, HZ - 6); ctx.lineTo(720, HZ); ctx.fill();
    // flying gulls
    for (let i = 0; i < 4; i++) gull(((i * 260 + t * (22 + i * 4)) % (W + 80)) - 40, 80 + i * 26 + Math.sin(t + i) * 6, 1 - i * 0.12, t * 7 + i * 2);
    // the sea
    const sea = ctx.createLinearGradient(0, HZ, 0, 440);
    sea.addColorStop(0, '#f0a0b8'); sea.addColorStop(0.25, '#5ab4e0'); sea.addColorStop(1, '#2a7ac8');
    ctx.fillStyle = sea; ctx.fillRect(0, HZ, W, 160);
    // sun's sparkly path on the water
    for (let k = 0; k < 12; k++) {
      const y = HZ + 6 + k * 11, w = 18 + k * 9 + Math.sin(t * 3 + k) * 6;
      ctx.fillStyle = `rgba(255,236,150,${0.75 - k * 0.05})`; ctx.fillRect(470 - w / 2 + Math.sin(t * 2 + k * 1.7) * 8, y, w, 3);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const x = (i * 131 + t * 12) % W, y = HZ + 14 + (i * 37) % 120; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 4, x + 20, y); ctx.stroke(); }
    // boats out on the water
    drawBoat(((300 + t * 6) % (W + 160)) - 80, HZ + 26, 0.42, 1, 0, 1, 0.3);
    drawBoat(640, HZ + 58, 0.55, 0, 3, -1, 0.3);
    buoy(380, HZ + 92, 0.8, '#ff5a4a'); buoy(560, HZ + 118, 0.7, '#5ac87a');
    // the rocky point and the lighthouse on the right
    ctx.fillStyle = '#8a7a9a';
    ctx.beginPath(); ctx.moveTo(680, 440); ctx.quadraticCurveTo(720, 360, 780, 330); ctx.quadraticCurveTo(840, 300, 900, 306); ctx.quadraticCurveTo(940, 310, W, 330); ctx.lineTo(W, 440); ctx.fill();
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(680, 440); ctx.quadraticCurveTo(720, 360, 780, 330); ctx.quadraticCurveTo(840, 300, 900, 306); ctx.quadraticCurveTo(940, 310, W, 330); ctx.stroke();
    ctx.fillStyle = '#6ab84a'; ctx.beginPath(); ctx.moveTo(770, 336); ctx.quadraticCurveTo(840, 300, 900, 307); ctx.quadraticCurveTo(940, 311, W, 330); ctx.lineTo(W, 346); ctx.quadraticCurveTo(880, 322, 770, 344); ctx.fill();
    rockLump(720, 430, 40, 46, '#9a8aaa'); rockLump(780, 432, 30, 30, '#7a6a8a'); rockLump(930, 436, 34, 40, '#9a8aaa');
    // little keeper's cottage
    inkRect(892, 270, 50, 40, '#fff4e0', 2, 3); ink(P2('M886,272 L917,246 L948,272 Z'), '#4a6ad0', 1.2); inkRect(906, 284, 12, 14, '#ffe88a', 1, 2);
    const L = drawLighthouse(840, 312, 210, 1, 1);
    // the lamp sweeps round: the beam swings left and right
    const a = t * 0.9, c = Math.cos(a);
    beam(L.lx, L.ly, c > 0 ? 0.08 : Math.PI - 0.08, 0.07, 120 + 420 * Math.abs(c), 0.35 * Math.abs(c));
    // splashes on the rocks
    for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k * 0.33) % 1; ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - ph)})`; circle(700 + k * 34, 420 - ph * 26, 5 + ph * 7); }
    // the fish shack on stilts on the left
    ctx.fillStyle = '#7a5a3a'; for (const x of [40, 90, 140]) ctx.fillRect(x - 4, 360, 8, 80);
    inkRect(20, 300, 150, 66, '#5aa8d8', 2.5, 4);
    ctx.save(); ctx.beginPath(); ctx.rect(20, 300, 150, 66); ctx.clip(); ctx.strokeStyle = 'rgba(30,60,110,.3)'; ctx.lineWidth = 2; for (let x = 26; x < 170; x += 12) { ctx.beginPath(); ctx.moveTo(x, 300); ctx.lineTo(x, 366); ctx.stroke(); } ctx.restore();
    ink(P2('M10,304 L95,262 L180,304 Z'), '#ff6a5a', 1.4);
    inkRect(40, 318, 30, 24, '#ffe88a', 1.5, 3); inkRect(110, 314, 34, 52, '#8a5a3a', 1.5, 3);
    inkRect(56, 274, 78, 20, '#ffffff', 1.5, 4); text('FISH', 95, 285, 14, '#2a5aa8', 'center', 800);
    // a fishing net hung to dry
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(176 + k * 8, 312); ctx.quadraticCurveTo(190 + k * 6, 350, 182 + k * 9, 372); ctx.stroke(); }
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(176, 320 + k * 11); ctx.quadraticCurveTo(200, 326 + k * 11, 226, 318 + k * 12); ctx.stroke(); }
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(172, 308); ctx.lineTo(232, 310); ctx.stroke();
    // bunting on the shack
    for (let i = 0; i < 7; i++) { const fx = 24 + i * 22, sw = Math.sin(t * 3 + i) * 2; ctx.fillStyle = OL; tri(fx - 8, 299, fx + 8, 299, fx + sw, 315); ctx.fillStyle = ['#ffd83a', '#ffffff', '#40a8ff'][i % 3]; tri(fx - 6, 300, fx + 6, 300, fx + sw, 312); }
    // the wooden pier you stand on
    const deckY = 430;
    ctx.fillStyle = '#6a4a30'; ctx.fillRect(0, deckY, W, 14);
    const dg = ctx.createLinearGradient(0, deckY + 10, 0, H);
    dg.addColorStop(0, '#d8a46a'); dg.addColorStop(1, '#b07a44');
    ctx.fillStyle = dg; ctx.fillRect(0, deckY + 10, W, H - deckY);
    ctx.strokeStyle = 'rgba(110,60,30,.45)'; ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) { const y = deckY + 12 + k * k * 4.4 + k * 6; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let k = 0; k < 12; k++) { const x0 = k * 90 + ((k * 37) % 40); ctx.beginPath(); ctx.moveTo(x0, deckY + 14 + (k % 3) * 18); ctx.lineTo(x0, deckY + 30 + (k % 3) * 18); ctx.stroke(); }
    ctx.fillStyle = 'rgba(70,40,20,.5)'; for (let k = 0; k < 20; k++) circle((k * 53) % W, deckY + 20 + (k * 29) % 90, 1.8);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, deckY); ctx.lineTo(W, deckY); ctx.stroke();
    // posts along the back edge with a rope between them
    for (const x of [20, 170, 330, 480, 640, 800, 950]) { inkRect(x - 7, deckY - 44, 14, 50, '#8a5a30', 2, 3); ctx.fillStyle = '#a06a3a'; ellipse(x, deckY - 44, 7, 3); }
    ctx.strokeStyle = '#e8d4a0'; ctx.lineWidth = 3;
    const posts = [20, 170, 330, 480, 640, 800, 950];
    for (let i = 0; i < posts.length - 1; i++) { ctx.beginPath(); ctx.moveTo(posts[i], deckY - 34); ctx.quadraticCurveTo((posts[i] + posts[i + 1]) / 2, deckY - 16, posts[i + 1], deckY - 34); ctx.stroke(); }
    perchedGull(170, deckY - 46, 1.1);
    lifeRing(642, deckY - 22, 17);
    // props on the deck, leaving Aubrey's spot (250) and the keeper's spot (720) clear
    ropeCoil(84, GY + 40, 1.1);
    crate(408, GY + 30, 54, 44); crate(462, GY + 30, 44, 34, '#d8a058'); crate(420, GY - 14, 40, 30, '#b88040');
    lobsterPot(560, GY + 34, 0.95);
    inkRect(320, GY + 6, 30, 30, '#5a8ad0', 2, 4); ctx.fillStyle = '#c8e8ff'; ellipse(335, GY + 8, 13, 4);
    emoji('🐟', 334, GY + 1, 20);
    starfish(152, GY + 58, 1.1); starfish(612, GY + 62, 0.9, '#ffb02a'); starfish(880, GY + 56, 1, '#ff6fae');
    inkRect(840, GY - 6, 26, 36, '#3a3a5a', 2, 8); ctx.fillStyle = '#5a5a7a'; ellipse(853, GY - 6, 13, 5);
    ropeCoil(910, GY + 30, 0.8);
  };

  // =============================================================================================
  // GAME 1 (action): Light the Way
  // =============================================================================================
  const LW = { lx: 112, ly: 180, harbour: 250, laneY: [262, 312, 362, 414], spawnX: W + 70 };
  const laneScale = y => lerp(0.5, 0.95, (y - LW.laneY[0]) / (LW.laneY[3] - LW.laneY[0]));
  function lwMakeRocks(g) {
    g.rocks = [];
    LW.laneY.forEach((y, lane) => {
      const n = g.tier === 1 ? 1 : (lane % 2 === 0 ? 2 : 1);
      const xs = n === 1 ? [rand(480, 720)] : [rand(380, 470), rand(640, 780)];
      for (const x of xs) g.rocks.push({ x, y: y + 4, lane, lit: 0, s: laneScale(y), seed: Math.random() * 10 });
    });
  }
  function lwSpawn(g) {
    const busy = g.boats.filter(b => b.state !== 'home' && b.x > W - 260).map(b => b.lane);
    let lanes = [0, 1, 2, 3].filter(l => !busy.includes(l) && l !== g.lastLane);
    if (!lanes.length) lanes = [0, 1, 2, 3].filter(l => !busy.includes(l));
    if (!lanes.length) return false;
    const lane = pick(lanes), y = LW.laneY[lane];
    g.lastLane = lane;
    const rocks = g.rocks.filter(r => r.lane === lane).sort((a, b) => b.x - a.x);
    g.boats.push({ id: g.spawned, x: LW.spawnX, y, lane, s: laneScale(y), kind: g.spawned % 3, ci: g.spawned, rocks, next: 0, meter: 0, seen: false, state: 'sail', bonkT: 0, bumped: false, swerve: 0, side: lane === 0 ? 1 : -1, warned: false, fade: 0, passed: [] });
    g.spawned++;
    return true;
  }
  const lwAngle = (x, y) => Math.atan2(y - LW.ly, x - LW.lx);
  function lwLit(g, x, y, r) {
    const d = Math.hypot(x - LW.lx, y - LW.ly), a = lwAngle(x, y);
    return Math.abs(a - g.ang) < g.half + r / d;
  }
  MG.lh2beam = {
    kind: 'action',
    title: () => 'Light the Way',
    icon: () => '🚨',
    how: () => 'It is foggy, and the fishing boats can\'t see the rocks! Move the mouse (or press up and down) to swing the lighthouse beam. When a boat rings its bell, shine the light on it and HOLD it there until the captain can see. Then it sails safely home!',
    init(g) {
      const T = g.tier;
      g.total = [6, 8, 10][T - 1]; g.maxActive = [2, 2, 3][T - 1];
      g.speed = [40, 48, 54][T - 1]; g.half = [0.11, 0.1, 0.085][T - 1]; g.need = [0.5, 0.6, 0.7][T - 1];
      g.gap = [7, 4.2, 3.4][T - 1]; g.rockShow = [0.42, 0.26, 0.16][T - 1];
      Object.assign(g, { boats: [], spawned: 0, spawnT: 0.6, safe: 0, resolved: 0, ang: 0.4, aimAng: 0.4, endT: 0, lastLane: -1, fog: [], bellT: 0, cheer: 0 });
      for (let i = 0; i < 6; i++) g.fog.push({ x: rand(0, W), y: rand(250, 440), r: rand(90, 170), v: rand(6, 14), a: rand(0.18, 0.3) });
      lwMakeRocks(g);
      g.progress = `Home safe: 0 of ${g.total}`;
    },
    start(g) { say(g, 'Here comes a boat! When it rings its bell, shine the light on it, and hold it there.'); },
    update(g, dt, id) {
      const t = S.t;
      g.cheer = Math.max(0, g.cheer - dt); g.bellT -= dt;
      for (const f of g.fog) { f.x += f.v * dt; if (f.x - f.r > W) f.x = -f.r; }
      // aim: the pointer, or the arrow keys
      if (g.lpx === undefined || Math.abs(pointer.x - g.lpx) > 0.5 || Math.abs(pointer.y - g.lpy) > 0.5) {
        if (g.lpx !== undefined && pointer.x > LW.lx + 20) g.aimAng = lwAngle(pointer.x, pointer.y);
        g.lpx = pointer.x; g.lpy = pointer.y;
      }
      if (keys.arrowup || keys.w) g.aimAng -= dt * 1.1;
      if (keys.arrowdown || keys.s) g.aimAng += dt * 1.1;
      g.aimAng = clamp(g.aimAng, -0.12, 0.62);
      const da = g.aimAng - g.ang, maxStep = dt * 3.2;
      g.ang += clamp(da, -maxStep, maxStep);
      // rocks light up when the beam sweeps across them
      for (const r of g.rocks) { if (lwLit(g, r.x, r.y - 10, 26 * r.s)) r.lit = 1; else r.lit = Math.max(0, r.lit - dt * 0.6); }
      if (g.endT > 0) { g.endT -= dt; if (g.endT <= 0) g.done = true; }
      // new boats
      g.spawnT -= dt;
      const active = g.boats.filter(b => b.state !== 'home').length;
      if (g.spawned < g.total && active < g.maxActive && g.spawnT <= 0) { if (lwSpawn(g)) g.spawnT = g.gap; }
      for (const b of g.boats) {
        if (b.state === 'home') { b.fade = Math.min(1, b.fade + dt); continue; }
        const rock = b.rocks[b.next];
        b.lit = lwLit(g, b.x, b.y - 20 * b.s, 34 * b.s);
        if (b.state === 'bonk') {
          b.bonkT -= dt;
          if (b.bonkT <= 0) { b.state = 'sail'; b.seen = true; }
          continue;
        }
        b.x -= g.speed * dt;
        // swerving round a rock the captain has seen
        let sw = 0;
        for (const r of b.rocks) { if (b.passed.includes(r) || (r === rock && b.seen)) sw += b.side * 34 * b.s * Math.exp(-Math.pow((b.x - r.x) / 70, 2)); }
        b.swerve = sw;
        if (rock) {
          const d = b.x - rock.x;
          b.danger = d < 250 && !b.seen;
          if (b.danger) {
            if (!b.warned) {
              b.warned = true; tone(1250, 0.5, 'sine', 0.07); tone(1250, 0.5, 'sine', 0.05, 0.6);
              if (g.bellT <= 0) { g.bellT = 5; say(g, pick(['Ding ding! A boat is near the rocks. Shine the light on it!', 'Ring ring! That boat needs your light!', 'Quick, light up the boat ringing its bell!'])); }
            }
            if (b.lit) {
              b.meter += dt;
              if (Math.floor(b.meter * 8) !== Math.floor((b.meter - dt) * 8)) tone(500 + b.meter * 900, 0.06, 'triangle', 0.05);
              if (b.meter >= g.need) { b.seen = true; SFX.hit(); floatText(b.x, b.y - 80 * b.s, 'I see the rocks!', '#fff6a8', false, 18); rock.lit = 1; }
            } else b.meter = Math.max(0, b.meter - dt * 1.5);
          }
          if (d < 34 * b.s + 6) {
            if (b.seen) { b.passed.push(rock); }
            else { b.state = 'bonk'; b.bonkT = 1.3; b.bumped = true; rock.lit = 1; SFX.fail(); floatText(b.x, b.y - 70 * b.s, 'BONK!', '#ffb0b0', false, 26); burst(b.x, b.y, 10, { colors: ['#ffffff', '#bfe4ff'] }); say(g, 'Oh no, it bumped a rock! Shine the light on the boats sooner.'); b.passed.push(rock); }
            b.next++; b.seen = false; b.meter = 0; b.warned = false; b.danger = false;
          }
        } else b.danger = false;
        if (b.x < LW.harbour) {
          b.state = 'home'; g.resolved++;
          if (!b.bumped) { g.safe++; g.cheer = 1.2; SFX.sparkle(); burst(b.x, b.y - 20, 14); floatText(b.x + 30, b.y - 70, 'Home safe!', '#ffffff', false, 20); tone(220, 0.4, 'sine', 0.06); }
          g.progress = `Home safe: ${g.safe} of ${g.total}`;
          if (g.resolved >= g.total && g.endT <= 0) { g.endT = 2.2; say(g, g.safe >= g.total - 1 ? 'Every boat is home safe! What a lighthouse keeper!' : 'All the boats are in. Good work, keeper!'); }
        }
      }
      g.score = g.total ? g.safe / g.total : 0;
    },
    draw(g) {
      const t = S.t, HZN = 228;
      // night sky
      const sky = ctx.createLinearGradient(0, 0, 0, HZN);
      sky.addColorStop(0, '#141a4a'); sky.addColorStop(1, '#3a3a7a');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HZN + 2);
      for (let i = 0; i < 50; i++) star((i * 197) % W, 64 + (i * 71) % 150, 1.2 + (i % 3) * 0.7, `rgba(255,255,240,${0.3 + 0.6 * Math.abs(Math.sin(t * 0.8 + i))})`);
      ctx.fillStyle = 'rgba(255,248,210,.2)'; circle(860, 120, 54);
      ctx.fillStyle = '#fff8d8'; circle(860, 120, 32); ctx.fillStyle = '#2a2e66'; circle(846, 112, 28);
      ctx.fillStyle = '#2a2a5a'; ctx.beginPath(); ctx.moveTo(300, HZN); ctx.quadraticCurveTo(380, HZN - 26, 470, HZN - 8); ctx.quadraticCurveTo(530, HZN - 16, 590, HZN); ctx.fill();
      // the dark sea
      const sea = ctx.createLinearGradient(0, HZN, 0, H);
      sea.addColorStop(0, '#2a3a7a'); sea.addColorStop(1, '#10204a');
      ctx.fillStyle = sea; ctx.fillRect(0, HZN, W, H - HZN);
      ctx.fillStyle = 'rgba(255,248,210,.25)'; for (let k = 0; k < 6; k++) ctx.fillRect(840 + Math.sin(t * 2 + k) * 10, HZN + 6 + k * 10, 40 - k * 4, 2);
      ctx.strokeStyle = 'rgba(160,190,255,.25)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let i = 0; i < 24; i++) { const x = (i * 131 + t * 14) % W, y = HZN + 12 + (i * 47) % 300; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 4, x + 24, y); ctx.stroke(); }
      // the harbour: a stone wall with a green light where the boats come home
      rockLump(234, 262, 22, 14, '#4a4a6a');
      inkRect(230, 230, 8, 26, '#3a3a5a', 1.2, 2);
      { const gl = 0.6 + 0.4 * Math.sin(t * 3); const gr = ctx.createRadialGradient(234, 226, 1, 234, 226, 34); gr.addColorStop(0, `rgba(120,255,160,${gl})`); gr.addColorStop(1, 'rgba(120,255,160,0)'); ctx.fillStyle = gr; circle(234, 226, 34); inkCircle(234, 226, 6, '#9affb8', 0.8); }
      for (const y of LW.laneY) { ctx.fillStyle = 'rgba(150,255,180,.35)'; for (let k = 0; k < 3; k++) circle(LW.harbour - 6 - k * 10, y + 2, 2); }
      // the rocks, hidden in the fog until the light finds them
      for (const r of g.rocks) {
        const a = Math.max(g.rockShow, r.lit), s = r.s;
        ctx.globalAlpha = a;
        ctx.save(); ctx.translate(r.x, r.y);
        ink(P2(`M${-34 * s},0 L${-24 * s},${-26 * s} L${-8 * s},${-36 * s} L${4 * s},${-24 * s} L${16 * s},${-40 * s} L${34 * s},0 Z`), r.lit > 0.3 ? '#8a7aa0' : '#4a4a6a', 1.3);
        ctx.fillStyle = 'rgba(255,255,255,.25)'; tri(-8 * s, -34 * s, 2 * s, -24 * s, -14 * s, -14 * s);
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(r.x, r.y + 1, (38 + Math.sin(t * 3 + r.seed) * 4) * s, 6 * s, 0, 0, TWO_PI); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // the boats
      const order = [...g.boats].sort((a, b) => a.y - b.y);
      for (const b of order) {
        if (b.state === 'home' && b.fade >= 1) continue;
        const bx = b.x + (b.state === 'bonk' ? Math.sin(b.bonkT * 40) * 4 : 0), by = b.y + b.swerve;
        ctx.globalAlpha = 1 - b.fade;
        if (b.lit && b.state !== 'home') { const gr = ctx.createRadialGradient(bx, by - 20 * b.s, 4, bx, by - 20 * b.s, 70 * b.s); gr.addColorStop(0, 'rgba(255,246,190,.45)'); gr.addColorStop(1, 'rgba(255,246,190,0)'); ctx.fillStyle = gr; circle(bx, by - 20 * b.s, 70 * b.s); }
        drawBoat(bx, by, b.s, b.kind, b.ci, -1, 1);
        ctx.globalAlpha = 1;
        // the bell: a ring that fills while the light is on the boat
        if (b.danger && b.state === 'sail') {
          const cx = bx, cy = by - 110 * b.s - 14 + Math.sin(t * 8) * 3, R = 20;
          inkCircle(cx, cy, R, b.lit ? '#fff6a8' : '#ffffff', 1.3);
          ctx.strokeStyle = '#ffb02a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, R - 3, -Math.PI / 2, -Math.PI / 2 + TWO_PI * clamp(b.meter / g.need, 0, 1)); ctx.stroke();
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t * 18) * 0.35);
          ink(P2('M-8,5 C-8,-4 -6,-10 0,-10 C6,-10 8,-4 8,5 L10,7 L-10,7 Z'), '#ffd23a', 0.9);
          ctx.fillStyle = OL; circle(0, 9, 2.4);
          ctx.restore();
        }
      }
      // drifting fog in front
      for (const f of g.fog) {
        const gr = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.r);
        gr.addColorStop(0, `rgba(200,210,240,${f.a})`); gr.addColorStop(1, 'rgba(200,210,240,0)');
        ctx.fillStyle = gr; ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
      }
      // the lighthouse on its rocks, with Aubrey working the lamp
      ctx.fillStyle = '#3a3456'; ctx.beginPath(); ctx.moveTo(0, 360); ctx.quadraticCurveTo(80, 330, 170, 372); ctx.quadraticCurveTo(220, 420, 230, H); ctx.lineTo(0, H); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 360); ctx.quadraticCurveTo(80, 330, 170, 372); ctx.quadraticCurveTo(220, 420, 230, H); ctx.stroke();
      const L = drawLighthouse(LW.lx, 372, 160, 1.15, 1);
      LW.ly = L.ly;
      beam(L.lx, L.ly, g.ang, g.half, 980, 0.42);
      beam(L.lx, L.ly, g.ang, g.half * 0.45, 900, 0.2);
      drawAubrey(LW.lx - 30, 372 - 160 - 6, 'idle_front', 1, 0, 0.3);
      // aim helper: a little dot where the pointer is
      if (g.endT <= 0) {
        ctx.fillStyle = 'rgba(255,246,190,.5)'; circle(LW.lx + Math.cos(g.aimAng) * 260, LW.ly + Math.sin(g.aimAng) * 260, 4);
        darkPanel(W - 300, H - 48, 284, 36, 18);
        text('🖱️ aim the light  ·  ⬆️⬇️ keys', W - 158, H - 30, 15, '#fff', 'center', 700);
      }
      if (g.endT > 0 && g.safe >= g.total - 1) outlined('Every boat is home!', W / 2 + 80, 110, 36, '#fff6a8', 'center', '#1a1a4a');
    },
  };

  // =============================================================================================
  // GAME 2 (learn): Magnet Fishing (magnetism)
  // =============================================================================================
  const MF = { deck: 176, surf: 200, floor: 486, minX: 120, maxX: 846, tip: 62, rest: 112 };
  // [emoji, name, magnetic, what it's made of / the fact]
  const MAGNETIC = [
    ['🔑', 'key', 'A key is made of steel. Magnets pull steel!'],
    ['📎', 'paper clip', 'Click! A paper clip is steel wire. Magnets pull steel.'],
    ['🔩', 'bolt', 'Clack! A bolt is made of steel. The magnet grabbed it!'],
    ['🧷', 'safety pin', 'A safety pin is steel. Snap, it stuck to the magnet!'],
    ['🥄', 'spoon', 'This spoon is steel, so the magnet can hold it.'],
    ['⚓', 'anchor', 'An anchor is made of iron. Magnets love iron!'],
    ['🥫', 'tin can', 'A tin can is mostly steel. Clunk! It stuck!'],
    ['✂️', 'scissors', 'The scissor blades are steel. The magnet pulled them up!'],
    ['🪝', 'fish hook', 'A fish hook is made of steel. Zip, it jumped onto the magnet!'],
    ['🪛', 'screwdriver', 'The tip of a screwdriver is steel. The magnet caught it!'],
  ];
  const NONMAG = [
    ['🦆', 'rubber duck', 'A rubber duck is plastic. Magnets can\'t pull plastic.'],
    ['🧸', 'teddy', 'Teddy is soft cloth. Cloth isn\'t magnetic.'],
    ['🐚', 'shell', 'A shell isn\'t metal at all. The magnet can\'t pick it up.'],
    ['🪵', 'stick of wood', 'Wood isn\'t magnetic. Bonk!'],
    ['🍎', 'apple', 'An apple isn\'t magnetic! Just a bit soggy.'],
    ['🧦', 'sock', 'A sock is cloth. No pull at all.'],
    ['🎾', 'ball', 'A ball is rubber and fuzz. Not magnetic!'],
    ['🥤', 'plastic cup', 'A plastic cup isn\'t magnetic.'],
    ['🖍️', 'crayon', 'A crayon is wax. Magnets can\'t pull wax.'],
    ['🪀', 'yo-yo', 'This yo-yo is plastic. Not magnetic!'],
    ['🧽', 'sponge', 'A sponge isn\'t metal. The magnet can\'t lift it.'],
    ['🪶', 'feather', 'A feather isn\'t magnetic. Magnets only pull some metals.'],
    ['🍌', 'banana', 'A banana? Not magnetic! Fish food, maybe.'],
  ];
  const TRICKY = [
    ['💍', 'gold ring', 'Gold is a metal, but magnets don\'t pull gold! Only some metals, like iron and steel.'],
    ['🔔', 'brass bell', 'This bell is brass. Brass is a metal, but it isn\'t magnetic!'],
  ];
  function mfRound(g) {
    const T = g.tier, nM = 3, nN = [3, 4, 4][T - 1], nT = T === 3 ? 1 : 0;
    const mags = shuffle(MAGNETIC.filter(m => !g.usedM.includes(m[0]))).slice(0, nM);
    const nons = shuffle(NONMAG.filter(m => !g.usedN.includes(m[0]))).slice(0, nN);
    const tricks = shuffle(TRICKY.filter(m => !g.usedN.includes(m[0]))).slice(0, nT);
    g.usedM.push(...mags.map(m => m[0])); g.usedN.push(...nons.map(m => m[0]), ...tricks.map(m => m[0]));
    let list = shuffle([...mags.map(m => ({ e: m[0], name: m[1], mag: true, fact: m[2] })), ...[...nons, ...tricks].map(m => ({ e: m[0], name: m[1], mag: false, fact: m[2] }))]);
    // never three magnetic things in a row, so it isn't a pattern
    const n = list.length, x0 = 200, x1 = 890;
    g.items = list.map((it, i) => {
      const x = lerp(x0, x1, n === 1 ? 0.5 : i / (n - 1)) + rand(-8, 8);
      const ledge = i % 3 === 1 ? rand(70, 120) : 0;
      return { ...it, x, y: MF.floor - 10 - ledge, ledge, tested: false, taken: false, wob: 0, ry: 0, lift: 0 };
    });
    g.need = mags.length; g.got = 0;
    g.fish = []; for (let k = 0; k < 5; k++) g.fish.push({ x: rand(0, W), y: rand(250, 420), v: rand(20, 40) * (Math.random() < 0.5 ? 1 : -1), c: pick(['#ffb02a', '#ff6fae', '#5ac8ff', '#ffe36b']), s: rand(0.7, 1.1) });
  }
  const mfMagX = g => g.ax + MF.tip + Math.sin(S.t * 1.3) * g.sway * clamp((g.my - MF.surf) / 280, 0, 1);
  function mfDrop(g) {
    if (g.mode !== 'idle') return;
    g.mode = 'down'; g.dropX = g.ax; tone(420, 0.25, 'triangle', 0.05, 0, 200);
    g.castT = 0.4;
  }
  MG.lh2magnet = {
    kind: 'learn',
    title: () => 'Magnet Fishing',
    icon: () => '🧲',
    how: g => `A magnet pulls things made of IRON or STEEL, even under water! It can't pick up wood, plastic, cloth or shells${g.tier === 3 ? ', or even every metal' : ''}. Walk along the pier and drop the magnet ONLY on things it can catch. Tap the water, or use the arrows and space.`,
    init(g) {
      g.rounds = 3; g.ri = 0; g.good = 0; g.bad = 0; g.usedM = []; g.usedN = [];
      g.sway = [0, 4, 7][g.tier - 1];
      Object.assign(g, { ax: 300, tx: null, mode: 'idle', my: MF.rest, dropX: 0, hook: null, castT: 0, endT: 0, nextT: 0, found: [], msg: '', msgT: 0, walkT: 0, bonk: null, sparks: [] });
      mfRound(g);
      g.progress = `Round 1 of ${g.rounds}  ·  🧲 0 of ${g.need}`;
    },
    start(g) { say(g, 'Drop the magnet on something made of iron or steel. Which things will it catch?'); },
    update(g, dt, id) {
      g.castT = Math.max(0, g.castT - dt); g.msgT = Math.max(0, g.msgT - dt);
      for (const f of g.fish) { f.x += f.v * dt; if (f.x > W + 40) f.x = -40; if (f.x < -40) f.x = W + 40; }
      for (const it of g.items) it.wob = Math.max(0, it.wob - dt);
      g.score = g.good + g.bad ? g.good / (g.good + 2 * g.bad) : 0;
      if (g.endT > 0) { g.endT -= dt; if (g.endT <= 0) g.done = true; return; }
      if (g.nextT > 0) {
        g.nextT -= dt;
        if (g.nextT <= 0) { g.ri++; mfRound(g); g.progress = `Round ${g.ri + 1} of ${g.rounds}  ·  🧲 0 of ${g.need}`; say(g, 'More things fell in! Which ones will the magnet catch?'); }
        return;
      }
      // walking: arrows, or tap the water to walk there and drop
      let walk = 0;
      if (g.mode === 'idle') {
        if (goLeft()) { walk = -1; g.tx = null; }
        if (goRight()) { walk = 1; g.tx = null; }
        if (pointer.clicked && !id && pointer.y > MF.surf - 30) { g.tx = clamp(pointer.x - MF.tip, MF.minX, MF.maxX); g.autoDrop = true; }
        if (g.tx != null) {
          const d = g.tx - g.ax;
          g.ax += clamp(d, -250 * dt, 250 * dt); walk = Math.sign(d);
          if (Math.abs(g.tx - g.ax) < 1) { g.ax = g.tx; g.tx = null; walk = 0; if (g.autoDrop) mfDrop(g); }
        } else g.ax = clamp(g.ax + walk * 250 * dt, MF.minX, MF.maxX);
        if (pressed[' '] || pressed.arrowdown || pressed.enter || id === 'mf_drop') mfDrop(g);
      }
      g.walking = walk !== 0; if (g.walking) g.walkT += dt;
      // the magnet on its line
      const mx = mfMagX(g);
      if (g.mode === 'down') {
        g.my += 230 * dt;
        // the magnet reaches the first thing under it
        const under = g.items.filter(it => !it.taken && Math.abs(it.x - mx) < 30).sort((a, b) => a.y - b.y)[0];
        if (under) {
          // magnetic things jump up to meet the magnet when it gets close
          if (under.mag && under.y - g.my < 70) under.lift = clamp((70 - (under.y - g.my)) / 50, 0, 1);
          if (g.my + 18 >= under.y - 22 - under.lift * 26) {
            under.tested = true;
            if (under.mag) {
              under.taken = true; g.hook = under; g.mode = 'up';
              if (!under.counted) { under.counted = true; g.good++; g.got++; }
              tone(880, 0.08, 'square', 0.06); tone(1320, 0.18, 'triangle', 0.07, 0.06); SFX.sparkle();
              burst(mx, g.my + 20, 14, { colors: ['#ffe36b', '#ffffff', '#9ad8ff'] });
              g.msg = `${under.name}: magnetic!`; g.msgT = 3; say(g, under.fact);
            } else {
              if (!under.counted) { under.counted = true; g.bad++; }
              under.wob = 0.8; g.bonk = { x: mx, y: g.my + 18, t: 0.6 }; g.mode = 'up';
              SFX.miss(); tone(200, 0.12, 'triangle', 0.06, 0.05);
              g.msg = `${under.name}: not magnetic`; g.msgT = 3; say(g, under.fact);
            }
          }
        }
        if (g.mode === 'down' && g.my >= MF.floor - 6) { g.mode = 'up'; SFX.step(); g.msg = 'Nothing there!'; g.msgT = 1.5; }
      } else if (g.mode === 'up') {
        g.my -= 210 * dt;
        if (g.my <= MF.rest) {
          g.my = MF.rest; g.mode = 'idle';
          if (g.hook) {
            g.found.push(g.hook.e); g.hook = null; SFX.pop();
            g.progress = `Round ${g.ri + 1} of ${g.rounds}  ·  🧲 ${g.got} of ${g.need}`;
            if (g.got >= g.need) {
              if (g.ri + 1 >= g.rounds) { g.endT = 2.4; say(g, g.bad === 0 ? 'You only dipped for magnetic things! A real magnet scientist!' : 'You found every magnetic thing! Iron and steel stick to magnets.'); }
              else { g.nextT = 2.4; say(g, 'All the magnetic things are out! Splash, here comes some more.'); SFX.fanfare(); }
            }
          }
        }
      }
      if (g.bonk) { g.bonk.t -= dt; if (g.bonk.t <= 0) g.bonk = null; }
      g.score = g.good + g.bad ? g.good / (g.good + 2 * g.bad) : 0;
    },
    draw(g) {
      const t = S.t;
      // sky and the far lighthouse
      const sky = ctx.createLinearGradient(0, 0, 0, MF.surf);
      sky.addColorStop(0, '#7cc8ff'); sky.addColorStop(1, '#d8f0ff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, MF.surf);
      bdClouds(3, 'rgba(255,255,255,.85)', 80);
      ctx.fillStyle = '#8a7a9a'; ctx.beginPath(); ctx.moveTo(840, MF.surf - 26); ctx.quadraticCurveTo(900, MF.surf - 60, W, MF.surf - 50); ctx.lineTo(W, MF.surf); ctx.lineTo(820, MF.surf); ctx.fill();
      drawLighthouse(918, MF.surf - 52, 80, 0.5, 0.4);
      for (let i = 0; i < 2; i++) gull(((i * 400 + t * 30) % (W + 80)) - 40, 78 + i * 22, 0.8, t * 7 + i);
      // underwater, seen from the side
      const sea = ctx.createLinearGradient(0, MF.surf, 0, H);
      sea.addColorStop(0, '#4ac0e8'); sea.addColorStop(1, '#1a5aa8');
      ctx.fillStyle = sea; ctx.fillRect(0, MF.surf, W, H - MF.surf);
      // sun rays
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 6; k++) { const x = 80 + k * 170 + Math.sin(t * 0.5 + k) * 20; ctx.fillStyle = 'rgba(200,240,255,.07)'; ctx.beginPath(); ctx.moveTo(x - 20, MF.surf); ctx.lineTo(x + 30, MF.surf); ctx.lineTo(x + 110, H); ctx.lineTo(x + 30, H); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      // the waving surface
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(0, MF.surf - 2);
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, MF.surf + Math.sin(x * 0.04 + t * 2.5) * 3);
      ctx.lineTo(W, MF.surf + 6); ctx.lineTo(0, MF.surf + 6); ctx.fill();
      // fish
      for (const f of g.fish) {
        ctx.save(); ctx.translate(f.x, f.y + Math.sin(t * 2 + f.x * 0.02) * 6); ctx.scale(Math.sign(f.v) * f.s, f.s);
        inkAll([[P2('M-16,0 C-10,-11 10,-11 16,0 C10,11 -10,11 -16,0 Z'), f.c], [P2('M-14,0 L-26,-9 L-24,0 L-26,9 Z'), f.c]], 1);
        ctx.fillStyle = OL; circle(9, -2, 2);
        ctx.restore();
      }
      // bubbles
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 14; i++) { const x = (i * 71) % W + Math.sin(t * 2 + i) * 4, y = H - ((t * 30 + i * 53) % (H - MF.surf)); ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, TWO_PI); ctx.stroke(); }
      // the sea floor: sand, rocks and seaweed
      ctx.fillStyle = '#e8cf8a'; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) ctx.lineTo(x, MF.floor + 4 + Math.sin(x * 0.02) * 6);
      ctx.lineTo(W, H); ctx.fill();
      ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, MF.floor + 4 + Math.sin(x * 0.02) * 6); ctx.stroke();
      ctx.fillStyle = 'rgba(180,140,80,.5)'; for (let k = 0; k < 30; k++) circle((k * 61) % W, MF.floor + 18 + (k * 17) % 30, 1.6);
      for (const [x, h, c] of [[30, 120, '#3aa85a'], [160, 80, '#5ac87a'], [560, 100, '#3aa85a'], [930, 130, '#5ac87a'], [700, 70, '#2a985a']]) {
        ctx.strokeStyle = c; ctx.lineWidth = 7; ctx.lineCap = 'round';
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 8, MF.floor + 8); for (let s = 1; s <= 6; s++) ctx.lineTo(x + k * 8 + Math.sin(t * 1.5 + s * 0.8 + k) * s * 2, MF.floor + 8 - s * h / 6 * (1 - k * 0.2)); ctx.stroke(); }
      }
      starfish(110, MF.floor + 20, 1.2); starfish(640, MF.floor + 26, 1, '#ff6fae');
      // rock ledges and the things lying on them
      for (const it of g.items) if (it.ledge) rockLump(it.x, MF.floor + 8, 40, it.ledge + 18, '#7a7aa0');
      for (const it of g.items) {
        if (it.taken) continue;
        const wob = it.wob > 0 ? Math.sin(it.wob * 30) * 0.3 * it.wob : 0;
        ctx.save(); ctx.translate(it.x, it.y - it.lift * 26); ctx.rotate(wob + (it.lift ? Math.sin(t * 30) * 0.08 : 0));
        ctx.fillStyle = 'rgba(20,40,80,.2)'; ellipse(0, 22 + it.lift * 26, 20, 4);
        emoji(it.e, 0, 0, 42);
        ctx.restore();
        if (it.tested && !it.mag) {
          rrect(it.x - 54, it.y - 58, 108, 24, 12, 'rgba(255,255,255,.92)', OL, 1.5);
          text('✕ not magnetic', it.x, it.y - 46, 13, '#c0303a', 'center', 800);
        }
      }
      // the pier: posts into the water, then the deck
      for (let x = 40; x < W; x += 150) { inkRect(x - 9, MF.deck, 18, MF.surf + 50 - MF.deck, '#7a5030', 2, 3); ctx.fillStyle = 'rgba(30,60,90,.35)'; ctx.fillRect(x - 9, MF.surf + 6, 18, 44); }
      inkRect(-4, MF.deck - 4, W + 8, 18, '#c8905a', 2.5, 2);
      ctx.strokeStyle = 'rgba(110,60,30,.5)'; ctx.lineWidth = 2; for (let x = 30; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, MF.deck - 3); ctx.lineTo(x, MF.deck + 13); ctx.stroke(); }
      // the keeper's sign
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(150, 140); ctx.lineTo(150, MF.deck - 4); ctx.stroke();
      inkRect(94, 76, 112, 64, '#24356e', 2.5, 8);
      text('🧲 pulls', 150, 92, 14, '#ffffff', 'center', 800);
      text('IRON & STEEL', 150, 112, 14, '#ffe36b', 'center', 800);
      text('even under water!', 150, 130, 11, '#bfe4ff', 'center', 700);
      // Salty the Seal at the end of the pier
      drawCritter(FRIEND, 40, MF.deck - 2, 0.36, 1);
      // the found box
      darkPanel(600, 70, 270, 48, 20);
      text('Found:', 614, 94, 15, '#fff', 'left', 700);
      g.found.forEach((e, i) => emoji(e, 684 + i * 30, 94, 24));
      // the line, the rod and Aubrey
      const mx = mfMagX(g), ax = g.ax, bob = g.walking ? Math.abs(Math.sin(g.walkT * 12)) * 3 : 0;
      const tipX = ax + MF.tip, tipY = MF.deck - 112;
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(mx, g.my - 16); ctx.stroke();
      // the magnet (and anything stuck to it)
      if (g.hook) { ctx.save(); ctx.translate(mx, g.my + 30); ctx.rotate(Math.sin(t * 6) * 0.1); emoji(g.hook.e, 0, 0, 40); ctx.restore(); }
      ctx.save(); ctx.translate(mx, g.my);
      const U = P2('M-16,-14 L-6,-14 L-6,4 C-6,10 6,10 6,4 L6,-14 L16,-14 L16,4 C16,24 -16,24 -16,4 Z');
      ctx.rotate(Math.PI);
      ink(U, '#ff3a4a', 1.3);
      ctx.fillStyle = '#e8eef8'; ctx.fillRect(-15, -13, 8, 8); ctx.fillRect(7, -13, 8, 8);
      ctx.strokeStyle = OL; ctx.lineWidth = 1.4; ctx.strokeRect(-15, -13, 8, 8); ctx.strokeRect(7, -13, 8, 8);
      ctx.restore();
      if (g.mode === 'down') { ctx.strokeStyle = 'rgba(255,240,150,.7)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(mx, g.my + 18, 10 + k * 8 + (t * 30 % 8), 0.3, Math.PI - 0.3); ctx.stroke(); } }
      if (g.bonk) { ctx.globalAlpha = g.bonk.t / 0.6; text('bonk!', g.bonk.x + 30, g.bonk.y - 10, 18, '#ffffff', 'left', 800); ctx.globalAlpha = 1; }
      drawAubrey(ax, MF.deck - 2 - bob, g.castT > 0 ? 'cast' : 'idle_front', 1, 0, 0.5);
      ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(ax + 16, MF.deck - 58); ctx.lineTo(tipX, tipY); ctx.stroke();
      ctx.strokeStyle = '#ffb02a'; ctx.lineWidth = 3; ctx.stroke();
      inkCircle(ax + 22, MF.deck - 62, 5, '#5a8ad0', 0.8);
      // a hint where the magnet would go
      if (g.mode === 'idle' && g.endT <= 0 && g.nextT <= 0) {
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.setLineDash([5, 8]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mx, g.my + 22); ctx.lineTo(mx, MF.floor - 30); ctx.stroke(); ctx.setLineDash([]);
        button('mf_drop', 820, 124, 126, 44, 'DROP', { icon: '🧲', color: '#ff5a6a', size: 20 });
      }
      if (g.msgT > 0) bubble(clamp(mx, 120, W - 120), MF.surf + 40, g.msg, '#2a3a6e', 17);
      if (g.nextT > 0) outlined('All the magnetic things found!', W / 2, 300, 32, '#ffe36b', 'center', '#1a2a5a');
      if (g.endT > 0) outlined('Magnet scientist!', W / 2, 300, 40, '#ffe36b', 'center', '#1a2a5a');
    },
  };

  restage('honeytree', {
    name: 'Lighthouse Point', icon: '⚓', bg: 'lighthouse_h2',
    npc: { name: FRIEND, icon: '🦭' },
    games: [['lh2beam', 'honey', {}], ['lh2magnet', 'honey', {}]],
    intro: [
      '*:Waves splash on the rocks, and seagulls call. A tall red-and-white lighthouse stands at the end of the point.',
      "N:Ahoy there! I'm Salty the Seal, keeper of the lighthouse. Tonight the fog is rolling in, and the fishing boats need help to get home!",
      'N:Climb up to the lamp and swing the beam. When a boat rings its bell, hold the light on it, so the captain can see the rocks!',
      'A:excited:I get to work a REAL lighthouse? Shine on!',
    ],
    mid: [
      'N:Every boat is safe in the harbour! Now, oh dear, I dropped a bucket of things off the pier. Let\'s go magnet fishing!',
      "N:A magnet pulls things made of iron and steel, even under water. But it can't pick up wood, plastic or cloth. Only drop it on the things it can catch!",
      'A:thinking:Hmm... metal things like keys stick. A rubber duck won\'t!',
    ],
    outro: [
      "N:You're a natural, matey! The harbour is shipshape again.",
      'N:The fishing folk sent a jar of golden honey to say thank you. Take it for your journey!',
      'A:laughing:Thanks, Salty! Bye, lighthouse!',
    ],
  });
}
