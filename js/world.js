'use strict';
// The outdoor world: finding the unicorn, sneaking her home, and sneaking her to the show.

const WORLD_W = 4600;
const DOOR_X = 420, APPLE_X = 930, PATCH_X = 1180, SHED_X = 1540, GATE_X = 1790;
const FIND_X = 2620, CREEK0 = 3150, CREEK1 = 3560, STAGE_X = 4330;
const BUSHES = [800, 1330, 1980, 2300, 2720, 3040, 3700, 3980];
const VISION = 320, WALK = 240, GRAV = 1500, JUMP_V = 560;

let WS = null;

function makeNpc(kind, x, minX, maxX, speed) {
  return { kind, x, minX, maxX, dir: Math.random() < 0.5 ? -1 : 1, speed, wait: rand(1, 3), seeing: false, alerted: false, q: 0, walk: 0 };
}
// kind: 'explore' (find her) | 'follow' (sneak her home) | 'shownight' (sneak her to the show)
function startWorld(kind) {
  const a = { x: 300, lift: 0, vy: 0, facing: 1, crouch: false, hidden: false, moving: false, anim: 0, pose: null, poseT: 0, poseDur: 0 };
  const npcs = [];
  let uni = null;
  if (kind === 'explore') npcs.push(makeNpc('mom', 600, 220, 900, 55));
  if (kind === 'follow') {
    a.x = FIND_X - 90; a.facing = -1;
    uni = { x: FIND_X, facing: -1, moving: false, hidden: false };
    npcs.push(makeNpc('mom', 420, 250, 1420, 60), makeNpc('ranger', 1960, 1880, 2380, 60));
  }
  if (kind === 'shownight') {
    a.x = SHED_X - 40;
    uni = { x: SHED_X + 40, facing: -1, moving: false, hidden: false };
    npcs.push(makeNpc('mom', 400, 250, 1250, 60), makeNpc('neighbor', 2000, 1850, 2500, 50), makeNpc('ranger', 3300, 2700, 3950, 75));
  }
  WS = { kind, dusk: kind === 'shownight' ? 0.8 : 0, cam: 0, a, uni, npcs, sus: 0 };
  setScene('world');
}

// --- helpers -----------------------------------------------------------------------
const nearestBush = (x, range) => BUSHES.find(b => Math.abs(b - x) < range) ?? null;
function worldTarget() { return WS.uni ? { x: WS.uni.x, hidden: WS.uni.hidden } : null; }
function setPose(name, dur) { Object.assign(WS.a, { pose: name, poseT: dur, poseDur: dur }); }
function aubFrame(a) {
  if (a.pose && a.poseT > 0) return a.pose;
  if (a.lift > 0) return 'jump';
  if (a.crouch) return 'crouch';
  if (a.moving) return `run${1 + (Math.floor(a.anim * 11) % 5)}`;
  return 'idle_front';
}
function worldObjective() {
  switch (WS.kind) {
    case 'explore': return 'Explore the woods behind your house  →';
    case 'follow': return `Lead ${S.name} home to the garden shed  ←`;
    case 'shownight': return `Sneak ${S.name} to the fashion show in the glade  →`;
  }
}
function interactables() {
  if (WS.kind === 'follow') return [{ x: SHED_X, label: `Bring ${S.name} inside`, act: arriveHome }];
  if (WS.kind === 'explore') return [{ x: DOOR_X, label: 'Front door', act: () => say([['aubrey', 'silly', 'If I go inside, Mom will make me tidy my room. The woods are calling!']]) }];
  return [];
}
function nearestInteract() {
  let best = null;
  for (const it of interactables()) {
    const d = Math.abs(it.x - WS.a.x);
    if (d < 70 && (!best || d < best.d)) best = { ...it, d };
  }
  return best;
}

// --- story hooks ----------------------------------------------------------------------
function spotted(n) {
  SFX.fail();
  const what = n.kind === 'mom' ? 'Aubrey?! Is that... a PONY? With a HORN?!' : n.kind === 'ranger' ? 'Whoa! Is that a real live UNICORN?!' : 'Goodness gracious, is that a UNICORN?!';
  say([[n.kind, 'shock', what], ['fairy', '🧚', "Quick! I'll make them think it was a dream. But we have to try again — no grown-up can see her before the show!"]], () => startWorld(WS.kind));
}
function arriveHome() {
  setPose('idle_back', 0.6);
  say([
    ['narrator', null, `You slip into the old garden shed and give ${S.name} a bubble bath. Under all that mud, she SPARKLES!`, () => { S.shine = 100; SFX.sparkle(); }],
    ['aubrey', 'excited', "This is your new home! Well, until the show. Then it's your FOREVER home."],
    ['fairy', '🧚', `Here's how it works, Aubrey. You have ${SHOW_DAY} days. Each day you can go on THREE adventures.`],
    ['fairy', '🧚', "Every place has new friends to help and games to play. The better you do, the more treasures they'll give you."],
    ['fairy', '🧚', `Each night, come back here and use your treasures to make beautiful things for ${S.name}.`],
    ['fairy', '🧚', "Every piece of her outfit earns points at the show. Easy places give common treasures. HARD places give LEGENDARY ones — worth the most points of all!"],
    ['fairy', '🧚', `On the night of day ${SHOW_DAY}, bring her to the glade. Toodle-oo!`, () => SFX.sparkle()],
  ], () => { S.day = 1; S.visitsToday = 0; saveCheckpoint(); setScene('map'); });
}
function findUnicorn() {
  setPose('crouch', 0.1);
  say([
    ['aubrey', 'surprised', 'Wait... is something moving under that bush?'],
    ['narrator', null, 'A baby unicorn peeks out. Her coat is muddy, her mane is a tangled mess, and she looks very, very lost.'],
    ['aubrey', 'happy', "Hi there... it's okay. I won't hurt you."],
    ['unicorn', 'sad', '*a small, hopeful whinny*'],
    ['narrator', null, 'The unicorn presses her nose into your hand. She does not want you to leave.'],
    ['fairy', '🧚', 'Oh, thank the stars, you found her! Hello, human child. I am Fairy Fizzlewick.', () => { SFX.sparkle(); burst(WS.a.x + 60, GY - 200, 30, { world: true }); }],
    ['fairy', '🧚', "This little one slipped through a rainbow and fell to Earth. And it looks like she's chosen YOU."],
    ['aubrey', 'excited', 'Can I keep her? PLEASE?'],
    ['fairy', '🧚', `Magic Law is very strict. A magical creature may only stay on Earth if it wins the MAGICAL CREATURES FASHION SHOW. It's in ${SHOW_DAY} days, in the glade past the creek.`],
    ['fairy', '🧚', 'And until she wins, NO grown-up may see her. If one does, she has to come home with me.'],
    ['aubrey', 'determined', "Then we're going to win. And nobody is going to see her."],
    ['narrator', null, 'The unicorn nuzzles you. What will you call her?'],
  ], () => askName(() => say([
    ['aubrey', 'happy', `${S.name}. Welcome to the family, ${S.name}!`],
    ['narrator', null, `Lead ${S.name} home to the garden shed. She'll follow you. Grown-ups notice anything in their yellow look-cones — hold the down arrow inside a bush and you'll BOTH hide.`],
  ], () => { saveCheckpoint(); startWorld('follow'); })));
}

// --- update ------------------------------------------------------------------------
SCENES.world = {
  update(dt) {
    const a = WS.a, u = WS.uni;
    if (pressed.m) muted = !muted;
    if (a.poseT > 0) a.poseT -= dt;
    const busy = a.poseT > 0;

    a.crouch = !busy && a.lift === 0 && goDown();
    let mv = 0;
    if (!busy && !a.crouch) { if (goLeft()) mv -= 1; if (goRight()) mv += 1; }
    a.moving = mv !== 0;
    if (mv) a.facing = mv;
    const maxX = WS.kind === 'explore' ? FIND_X - 60 : WORLD_W - 120;
    a.x = clamp(a.x + mv * WALK * dt, 80, maxX);
    a.anim += dt;
    if (jumpPressed() && a.lift === 0 && !a.crouch && !busy) { a.vy = JUMP_V; SFX.jump(); }
    if (a.lift > 0 || a.vy > 0) {
      a.lift += a.vy * dt; a.vy -= GRAV * dt;
      if (a.lift <= 0) { a.lift = 0; a.vy = 0; }
    }
    const bush = nearestBush(a.x, 60);
    a.hidden = a.crouch && bush !== null;

    if (actionPressed() && !busy && !a.crouch) {
      const it = nearestInteract();
      if (it) return it.act();
    }
    if (WS.kind === 'explore' && a.x >= FIND_X - 70) return findUnicorn();
    if (WS.kind === 'shownight' && a.x > STAGE_X - 220) return startShow();

    // the unicorn follows, and hides with Aubrey
    if (u) {
      const hideIn = a.hidden ? bush : null;
      const tx = hideIn !== null ? hideIn - a.facing * 20 : a.x - a.facing * 80;
      const dx = tx - u.x;
      u.moving = Math.abs(dx) > 6;
      if (u.moving) { u.x += Math.sign(dx) * Math.min(Math.abs(dx), (Math.abs(dx) > 200 ? 340 : 220) * dt); u.facing = Math.sign(dx); }
      else u.facing = a.facing;
      u.hidden = hideIn !== null && Math.abs(u.x - hideIn) < 75;
    }

    // grown-ups patrol, glance around, and notice things in their look-cones
    const target = worldTarget();
    let seen = null;
    for (const n of WS.npcs) {
      n.seeing = false;
      if (target && !target.hidden) {
        const dx = target.x - n.x;
        n.seeing = (Math.sign(dx) === n.dir && Math.abs(dx) < VISION) || Math.abs(dx) < 40;
      }
      if (n.seeing) {
        seen = n;
        n.dir = Math.sign(target.x - n.x) || n.dir;
        n.q = 1;
        if (!n.alerted) { n.alerted = true; SFX.alert(); }
        continue;
      }
      n.alerted = false;
      n.q = Math.max(0, n.q - dt * 0.6);
      if (n.wait > 0) {
        n.wait -= dt;
        if (Math.random() < dt * 0.4) n.dir *= -1;
        continue;
      }
      n.x += n.dir * n.speed * dt;
      n.walk += dt * 8;
      if (n.x > n.maxX) { n.x = n.maxX; n.dir = -1; n.wait = rand(1.2, 3); }
      else if (n.x < n.minX) { n.x = n.minX; n.dir = 1; n.wait = rand(1.2, 3); }
      else if (Math.random() < dt * 0.14) { n.wait = rand(0.8, 2.2); if (Math.random() < 0.5) n.dir *= -1; }
    }
    if (seen) {
      WS.sus += 55 * dt;
      if (WS.sus >= 100) return spotted(seen);
    } else WS.sus = Math.max(0, WS.sus - 18 * dt);
  },
  draw() {
    WS.cam = clamp(WS.a.x - W / 2, 0, WORLD_W - W);
    drawWorld();
    if (!dlg) drawWorldHUD();
  },
};

// --- render ------------------------------------------------------------------------
function forestK(wx) { return clamp((wx - GATE_X) / 350, 0, 1); }
function drawVisionCone(n, cam) {
  const x = n.x - cam, ex = x + n.dir * 16, ey = GY - 212;
  const g = ctx.createLinearGradient(ex, 0, ex + n.dir * VISION, 0);
  const col = n.seeing ? '255,80,80' : '255,230,90';
  g.addColorStop(0, `rgba(${col},.35)`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + n.dir * VISION, GY - 320); ctx.lineTo(ex + n.dir * VISION, GY); ctx.closePath(); ctx.fill();
}
function drawWorld() {
  const cam = WS.cam, dusk = WS.dusk;
  const vis = (wx, pad = 400) => wx - cam > -pad && wx - cam < W + pad;
  drawHomeSetting(cam, dusk);
  if (vis(STAGE_X)) drawStage(STAGE_X - cam, GY, WS.kind === 'shownight');

  if (worldTarget()) for (const n of WS.npcs) if (vis(n.x)) drawVisionCone(n, cam);
  if (WS.kind === 'explore') drawUnicorn(FIND_X + 40 - cam, GY, 0.5, uniLook(), { facing: -1, pose: 'sit', mood: 'sad' });
  const u = WS.uni;
  if (u) drawUnicorn(u.x - cam, GY, 0.55, uniLook(), { facing: u.facing, pose: u.hidden ? 'sit' : 'stand', moving: u.moving, glow: WS.dusk * 0.6 });
  for (const n of WS.npcs) if (vis(n.x)) drawPerson(n.kind, n.x - cam, GY, n.dir, n.wait > 0 || n.seeing ? 0 : n.walk, n.seeing, 0.92);

  const a = WS.a;
  drawAubrey(a.x - cam, GY, aubFrame(a), a.facing, a.lift);
  BUSHES.forEach((b, i) => { if (vis(b, 120)) drawBush(b - cam, GY, 0, i); });
  drawHomeAtmosphere(cam, dusk);
  for (const n of WS.npcs) {
    if (!vis(n.x) || n.q <= 0) continue;
    outlined(n.seeing ? '!' : '?', n.x - cam + n.dir * 4, GY - 300 - Math.sin(S.t * 10) * 3, 34, n.seeing ? '#ff5a5a' : '#ffd23f');
  }
  drawFx(true, cam);
}
function drawWorldHUD() {
  const a = WS.a, cam = WS.cam;
  const obj = worldObjective();
  ctx.font = `600 17px ${FONT}`;
  const ow = ctx.measureText(obj).width + 52;
  darkPanel(12, 12, ow, 40, 20);
  star(33, 32, 9, '#ffd23f');
  text(obj, 50, 32, 17, '#fff');
  if (worldTarget()) {
    darkPanel(W - 252, 12, 240, 50, 14);
    text('Secret-o-meter', W - 240, 27, 13, '#fff');
    bar(W - 240, 40, 216, 12, WS.sus, WS.sus < 40 ? '#7be08a' : WS.sus < 75 ? '#ffd23f' : '#ff5a5a');
  }
  const near = nearestInteract();
  if (near) {
    const x = near.x - cam, y = GY - 236;
    ctx.font = `600 16px ${FONT}`;
    const w = ctx.measureText(near.label).width + 54;
    rrect(x - w / 2, y - 18, w, 36, 18, 'rgba(255,255,255,.95)', '#ff8fc8', 3);
    rrect(x - w / 2 + 8, y - 12, 26, 24, 7, '#ff6fb5');
    text('E', x - w / 2 + 21, y, 15, '#fff', 'center', 700);
    text(near.label, x - w / 2 + 42, y, 16, '#5a2a6e');
  }
  if (a.crouch && worldTarget()) outlined(a.hidden ? 'hidden!' : 'not hidden — find a bush!', a.x - cam, GY - 130, 15, a.hidden ? '#9ff0b8' : '#ffb0c4');
  if (worldTarget()) {
    let warn = null;
    for (const n of WS.npcs) {
      const sx = n.x - cam, d = Math.abs(n.x - a.x);
      if ((sx < -10 || sx > W + 10) && d < 900) {
        const left = sx < 0, ax = left ? 26 : W - 26;
        ctx.fillStyle = 'rgba(255,210,63,.9)';
        tri(ax + (left ? -14 : 14), GY - 150, ax + (left ? 10 : -10), GY - 166, ax + (left ? 10 : -10), GY - 134);
        outlined(SPEAKERS[n.kind], left ? 40 : W - 40, GY - 182, 15, '#ffd23f', left ? 'left' : 'right');
      }
      if (d < 560 && !worldTarget().hidden) warn = n;
    }
    if (warn) outlined(`${SPEAKERS[warn.kind]} is close — hold ↓ in a bush to hide!`, W / 2, 128, 18, '#ffd23f');
  }
}
