'use strict';
// The player's character, picked on the title screen. Only the photos, the name, the he/she words in the
// text and the clothes the hero wears change between heroes; everything else is the same game.
//
// Text is written for Aubrey. Wherever text is drawn or read aloud, "Aubrey" becomes the hero's name and
// {girl word|boy word} pairs pick a side, e.g. "Help {her|him} find {her|his} hat, {she|he} lost it!".

// walk: the side-on photos the walk is built from (see heroWalkFrames)
// native: which way the side-on frames face in that hero's photos (+1 right, -1 left; front-on frames are left out)
// arms: each arm (shoulder to hand) as a polygon in the standing photo's pixels (every hero's is 97 x 226,
// head centred, feet at the bottom), so games can lift the arms out or redraw them doing something else
const HEROES = [
  { id: 'aubrey', name: 'Aubrey', boy: false, card: '#ffd1ec',
    native: { run1: -1, run2: -1, run3: -1, run4: -1, run5: -1, cast: -1 }, walk: ['run1', 'run2'],
    arms: [[[15, 50], [27, 52], [26, 75], [23, 100], [24, 125], [23, 141], [9, 141], [8, 120], [12, 90], [12, 62]],
      [[68, 52], [79, 50], [83, 62], [83, 90], [87, 120], [86, 141], [72, 141], [71, 125], [71, 100], [69, 75]]] },
  { id: 'charlotte', name: 'Charlotte', boy: false, card: '#ffe6b8',
    native: { run1: -1, run2: -1, run3: -1, run4: -1, run5: -1 }, walk: ['run1'], legs: { cut: 0.66, hip: 0.58 },
    arms: [[[21, 56], [30, 60], [28, 80], [26, 100], [30, 112], [29, 126], [11, 126], [9, 110], [13, 85], [15, 64]],
      [[68, 57], [77, 57], [81, 70], [83, 86], [81, 106], [65, 106], [65, 92], [70, 80], [68, 66]]] },
  { id: 'ashton', name: 'Ashton', boy: true, card: '#cfe6ff',
    native: { run1: -1, run2: -1, run3: -1, run4: -1, run5: -1 }, walk: ['run2', 'run1'],
    arms: [[[13, 50], [26, 52], [24, 70], [20, 90], [18, 110], [19, 143], [3, 143], [3, 120], [5, 92], [3, 86]],
      [[72, 52], [83, 50], [94, 85], [89, 92], [89, 110], [91, 143], [75, 143], [75, 120], [74, 95], [74, 70]]] },
  { id: 'levi', name: 'Levi', boy: true, card: '#d4f5d0',
    native: { run1: 1, run2: 1, run3: 1, run4: 1, run5: 1, cast: 1, crouch: 1 }, walk: ['run1'], legs: { cut: 0.6, hip: 0.52 },
    arms: [[[17, 55], [30, 58], [30, 80], [32, 100], [34, 118], [40, 126], [48, 128], [51, 134], [49, 143], [38, 144], [33, 138], [27, 130], [17, 128], [15, 110], [15, 80]],
      [[70, 56], [79, 57], [85, 80], [87, 100], [86, 120], [86, 138], [78, 140], [74, 134], [72, 126], [71, 110], [71, 80]]] },
];
const HERO_FRAMES = ['idle_front', 'idle_back', 'crouch', 'jump', 'twirl', 'cast', 'run1', 'run2', 'run3', 'run4', 'run5'];
const HERO_IMG = {}; // id -> { frame or face_x: Image }
let HERO = HEROES[0];
const isBoy = () => HERO.boy;
const heroById = id => HEROES.find(h => h.id === id) || HEROES[0];

// every hero's photos and portraits, loaded up front so switching is instant
function heroImageList() {
  return HEROES.flatMap(h => [
    ...HERO_FRAMES.map(n => [h.id, n, `assets/heroes/${h.id}/sprites/${n}.png`]),
    ...FACES.map(n => [h.id, `face_${n}`, `assets/heroes/${h.id}/faces/face_${n}.png`]),
  ]);
}

// things cut or measured from the old hero's photos are thrown away when the hero changes
const heroResets = [];
const onHeroChange = fn => heroResets.push(fn);
// the sheets have no real run cycle, so run1..run5 are built from one or two side-on walking photos
// (HERO.walk): the two strides take turns, and each step bobs up and sways a little, so walking reads as
// stepping instead of flicking between unrelated poses
const WALK_STEPS = [[0, 0, 0], [0, 4, 1], [1, 0, 0], [1, 4, -1], [1, 2, 0]]; // [stride, lift px, sway]
function heroWalkFrames(id) {
  const imgs = HERO_IMG[id], h = heroById(id);
  if (imgs.walkBuilt) return;
  const src = h.walk.map(k => imgs[k]), a = src[0], lean = 0.03; // a slight lean into the walk
  if (h.legs) { heroScissorWalk(imgs, a, h); imgs.walkBuilt = true; return; }
  WALK_STEPS.forEach(([stride, lift, sway], i) => {
    const im = src[stride % src.length], s = a.height / im.height, w = im.width * s, hh = a.height;
    const c = document.createElement('canvas'); c.width = Math.ceil(Math.max(a.width, w) + 12); c.height = hh + 6;
    const x = c.getContext('2d');
    x.translate(c.width / 2, c.height - lift); x.rotate(-(lean + sway * 0.02) * (h.native.run1 || 1));
    x.drawImage(im, -w / 2, -hh, w, hh);
    imgs[`run${i + 1}`] = c;
  });
  imgs.walkBuilt = true;
}
// a hero with only a standing side-on photo walks by swinging the legs: the legs below the hem
// (h.legs.cut, a fraction of the height) are drawn twice, swung apart from the hip like scissors,
// with the back one shaded, and the body drawn over the top of them
function heroScissorWalk(imgs, im, h) {
  const W0 = im.width, H0 = im.height, cut = Math.round(H0 * h.legs.cut), hip = H0 * h.legs.hip;
  // the legs' middle, from the bottom rows of the photo
  const m = document.createElement('canvas'); m.width = W0; m.height = H0;
  const mx = m.getContext('2d'); mx.drawImage(im, 0, 0);
  const d = mx.getImageData(0, cut, W0, H0 - cut).data;
  let sx = 0, n = 0;
  for (let y = 0; y < H0 - cut; y++) for (let x = 0; x < W0; x++) if (d[(y * W0 + x) * 4 + 3] > 60) { sx += x; n++; }
  const cx = n ? sx / n : W0 / 2, top = cut - 6;
  for (let i = 0; i < 5; i++) {
    const s = Math.cos(i / 5 * Math.PI * 2), ang = s * 0.3, lift = (1 - Math.abs(s)) * 4;
    const c = document.createElement('canvas'); c.width = W0 + 40; c.height = H0 + 6;
    const x = c.getContext('2d'), ox = 20, oy = 6 - lift;
    const leg = (cv, rot) => {
      const lx = cv.getContext('2d');
      lx.save(); lx.translate(ox + cx, oy + hip); lx.rotate(rot); lx.translate(-cx, -hip);
      lx.drawImage(im, 0, top, W0, H0 - top, 0, top, W0, H0 - top);
      lx.restore();
    };
    // the back leg goes on a canvas of its own first, so its shading doesn't darken the front leg
    const b = document.createElement('canvas'); b.width = c.width; b.height = c.height;
    leg(b, -ang);
    const bx = b.getContext('2d'); bx.globalCompositeOperation = 'source-atop'; bx.fillStyle = 'rgba(30,20,40,.28)'; bx.fillRect(0, 0, b.width, b.height);
    x.drawImage(b, 0, 0);
    leg(c, ang);
    x.drawImage(im, 0, 0, W0, cut, ox, oy, W0, cut);
    imgs[`run${i + 1}`] = c;
  }
}
function useHero(id) {
  HERO = heroById(id);
  heroWalkFrames(HERO.id);
  Object.assign(IMG, HERO_IMG[HERO.id]);
  for (const k of Object.keys(AUB_NATIVE)) delete AUB_NATIVE[k];
  Object.assign(AUB_NATIVE, HERO.native);
  heroTextCache.clear();
  for (const fn of heroResets) fn();
  document.title = `${HERO.name}'s Secret Pet`;
  try { localStorage.setItem('aubgame.hero', HERO.id); } catch (e) { /* private window: the title screen just starts on Aubrey */ }
}
function savedHeroId() {
  try { return localStorage.getItem('aubgame.hero'); } catch (e) { return null; }
}

// --- the hero's name and he/she words in all text ---------------------------------------------
const heroTextCache = new Map();
function heroText(str) {
  if (typeof str !== 'string' || (str.indexOf('{') < 0 && str.indexOf('Aubrey') < 0 && str.indexOf('AUBREY') < 0)) return str;
  let out = heroTextCache.get(str);
  if (out !== undefined) return out;
  out = str.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (m, girl, boy) => (HERO.boy ? boy : girl));
  if (HERO.id !== 'aubrey') out = out.replace(/Aubrey/g, HERO.name).replace(/AUBREY/g, HERO.name.toUpperCase());
  if (heroTextCache.size > 4000) heroTextCache.clear();
  heroTextCache.set(str, out);
  return out;
}
// a hero's own name that heroText leaves alone (an invisible word joiner splits "Aubrey"), for the hero picker
function heroOwnName(h) { return h.name.replace('Aubrey', 'Aub⁠rey'); }
// all canvas text goes through heroText, so every label, line and floating word follows the hero
for (const fn of ['fillText', 'strokeText', 'measureText']) {
  const orig = CanvasRenderingContext2D.prototype[fn];
  CanvasRenderingContext2D.prototype[fn] = function (str, ...rest) { return orig.call(this, heroText(String(str)), ...rest); };
}

// --- arm cut-outs from the standing photo -----------------------------------------------------
function heroArmsPath() {
  const p = new Path2D();
  for (const arm of HERO.arms) { arm.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); }
  return p;
}
onHeroChange(() => { aubArms = null; aubNoArms = null; });

// for scenes that redraw the arms: each arm's shoulder (in the standing photo's pixels) and the colours of
// its upper arm, forearm and hand (a sleeve or skin), read from the photo. Left arm first; one per hero.
const heroArmLooks = {};
function heroArmLook() {
  if (heroArmLooks[HERO.id]) return heroArmLooks[HERO.id];
  const a = aubArmsImage(), W = a.width, d = a.getContext('2d').getImageData(0, 0, W, a.height).data;
  const look = HERO.arms.map(poly => {
    const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    // mostly skin across that row: a bare arm (skin colour); otherwise a sleeve (its colour)
    const col = (yy, bare) => {
      const sum = [[0, 0, 0, 0], [0, 0, 0, 0]];
      for (let y = Math.round(yy) - 3; y <= yy + 3; y++) for (let x = x0; x <= x1; x++) {
        const k = (y * W + x) * 4, R = d[k], G = d[k + 1], B = d[k + 2];
        if (d[k + 3] < 200) continue;
        const t = sum[R > 95 && R > G + 15 && G >= B ? 0 : 1]; t[0] += R; t[1] += G; t[2] += B; t[3]++;
      }
      const t = bare || sum[0][3] >= sum[1][3] * 0.6 ? sum[0] : sum[1];
      return t[3] ? `rgb(${t[0] / t[3] | 0},${t[1] / t[3] | 0},${t[2] / t[3] | 0})` : '#f6cfb0';
    };
    return { sh: [(poly[0][0] + poly[1][0]) / 2, (poly[0][1] + poly[1][1]) / 2], upper: col(y0 + 16), fore: col(y1 - 30), hand: col(y1 - 8, true) };
  });
  look.sort((p, q) => p.sh[0] - q.sh[0]);
  return (heroArmLooks[HERO.id] = look);
}

// --- where the head is in a hero photo, found from the picture itself ----------------------------
// { cx, cy, r, top, neck } in the frame's own pixels: the head's centre and size, the top of the hair
// and the neck's row (and armsUp, see below).
// The head is the first thick part from the top (hands and arms are thin), measured with a distance map.
const heroHeads = {};
function heroHead(frame, im = IMG[frame]) {
  const key = HERO.id + ':' + frame;
  if (heroHeads[key] && heroHeads[key].im === im) return heroHeads[key]; // (built walk frames can replace a photo)
  const W = im.width, H = im.height, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const px = g.getImageData(0, 0, W, H).data, D = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) D[i] = px[i * 4 + 3] > 90 ? 1e4 : 0;
  const at = (X, Y) => (X < 0 || Y < 0 || X >= W || Y >= H ? 0 : D[Y * W + X]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (D[y * W + x]) {
    D[y * W + x] = Math.min(D[y * W + x], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414);
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) if (D[y * W + x]) {
    D[y * W + x] = Math.min(D[y * W + x], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414);
  }
  let cx = W >> 1, cy = 20, sy = 0;
  find: for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (D[y * W + x] >= 12) { cx = x; cy = sy = y; break find; }
  // climb to the middle of that thick part, not down into the body
  for (let n = 0; n < 200; n++) {
    let bx = cx, by = cy, bv = at(cx, cy);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (cy + dy <= sy + 40 && at(cx + dx, cy + dy) > bv) { bv = at(cx + dx, cy + dy); bx = cx + dx; by = cy + dy; }
    if (bx === cx && by === cy) break;
    cx = bx; cy = by;
  }
  let top = cy;
  while (top > 0 && px[((top - 1) * W + cx) * 4 + 3] > 90) top--;
  // the neck: the narrowest row under the face
  const r = at(cx, cy);
  let neck = Math.round(cy + r * 1.3), best = 1e9;
  for (let y = Math.round(cy + r * 0.6); y < Math.min(H, cy + r * 2.2); y++) {
    let n = 0;
    for (let x = Math.max(0, Math.round(cx - r * 1.5)); x < Math.min(W, cx + r * 1.5); x++) if (px[(y * W + x) * 4 + 3] > 90) n++;
    if (n < best) { best = n; neck = y; }
  }
  if (neck < cy + r * 1.1) neck = Math.round(cy + r * 1.3); // long hair hides the neck
  // armsUp: a hand is up beside the head (above the face's middle, well out to the side)
  let armsUp = false;
  for (let y = 0; y < cy && !armsUp; y++) for (let x = 0; x < W; x++) if (Math.abs(x - cx) > r * 1.5 && px[(y * W + x) * 4 + 3] > 90) { armsUp = true; break; }
  return (heroHeads[key] = { cx, cy, r, top, neck, armsUp, im });
}
