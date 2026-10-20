'use strict';
// The outdoor world: gathering trips, sneaking the unicorn around, grown-ups on patrol.

const WORLD_W = 4600;
const DOOR_X = 420, APPLE_X = 930, PATCH_X = 1180, SHED_X = 1540, GATE_X = 1790;
const FIND_X = 2620, CREEK0 = 3150, CREEK1 = 3560, STAGE_X = 4330;
const BUSHES = [800, 1330, 1980, 2300, 2720, 3040, 3700, 3980];
const VISION = 320, WALK = 240, GRAV = 1500, JUMP_V = 560;
const TRIP_TIME = 75;

let WS = null;

function makeNpc(kind, x, minX, maxX, speed) {
  return { kind, x, minX, maxX, dir: Math.random() < 0.5 ? -1 : 1, speed, wait: rand(1, 3), seeing: false, alerted: false, q: 0, walk: 0 };
}
function spawnItems(evening) {
  const plan = [
    ['daisy', 4, [[760, 1460, 0, 0]]],
    ['blossom', 4, [[560, 760, 0, 0], [1900, 3100, 0, 0]]],
    ['straw', 3, [[PATCH_X - 80, PATCH_X + 80, 0, 0]]],
    ['berry', 4, [[1900, 3100, 0, 0]]],
    ['feather', 3, [[800, 3800, 130, 175]]],
    ['ribbon', 2, [[1100, 1290, 140, 160]]],
    ['crystal', 3, [[2850, 3800, 0, 0]]],
    ['shell', 3, [[CREEK0 + 30, CREEK1 - 30, 0, 0]]],
  ];
  if (evening) plan.push(['star', 7, [[2300, 4500, 110, 175]]]);
  const items = [];
  for (const [type, n, ranges] of plan) {
    for (let i = 0; i < n; i++) {
      const [x0, x1, h0, h1] = pick(ranges);
      items.push({ type, x: rand(x0, x1), h: h0 ? rand(h0, h1) : 8, got: false, ph: rand(0, 6) });
    }
  }
  return items;
}

function startWorld(kind) {
  const evening = kind === 'shownight' || (kind === 'gather' && S.slot === 2);
  const a = { x: 300, lift: 0, vy: 0, facing: 1, crouch: false, hidden: false, moving: false, anim: 0, pose: null, poseT: 0, poseDur: 0 };
  const npcs = [];
  let uni = null;
  if (kind === 'explore') npcs.push(makeNpc('mom', 600, 220, 900, 55));
  if (kind === 'follow') {
    a.x = FIND_X - 90; a.facing = -1;
    uni = { x: FIND_X, facing: -1, moving: false, hidden: false };
    npcs.push(makeNpc('mom', 420, 250, 1420, 60), makeNpc('ranger', 1960, 1880, 2380, 60));
  }
  if (kind === 'gather') {
    a.x = SHED_X - 70;
    npcs.push(evening ? makeNpc('mom', 400, 200, 1000, 60) : makeNpc('mom', 600, 220, 1450, 62));
    npcs.push(makeNpc('ranger', 3000, 2100, 3750, 72));
    if (S.day >= 2) npcs.push(makeNpc('neighbor', 1200, 980, 1700, 45));
  }
  if (kind === 'shownight') {
    a.x = SHED_X - 40;
    uni = { x: SHED_X + 40, facing: -1, moving: false, hidden: false };
    npcs.push(makeNpc('mom', 400, 250, 1250, 60), makeNpc('neighbor', 2000, 1850, 2500, 50), makeNpc('ranger', 3300, 2700, 3950, 75));
  }
  WS = { kind, evening, dusk: evening ? 0.8 : 0, cam: 0, a, uni, npcs,
    timer: kind === 'gather' ? TRIP_TIME : null,
    items: kind === 'gather' ? spawnItems(evening) : [],
    bag: {}, sus: 0, ending: false };
  setScene('world');
}

// --- helpers -----------------------------------------------------------------------
const nearestBush = (x, range) => BUSHES.find(b => Math.abs(b - x) < range) ?? null;
function worldTarget() {
  if (WS.kind === 'gather') return { x: WS.a.x, hidden: WS.a.hidden };
  if (WS.uni) return { x: WS.uni.x, hidden: WS.uni.hidden };
  return null;
}
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
    case 'gather': return `Gather materials!  ${WS.evening ? '(Stardust ⭐ only appears in the evening)' : ''}`;
    case 'shownight': return `Sneak ${S.name} to the fashion show in the glade  →`;
  }
}
function interactables() {
  const list = [];
  const k = WS.kind;
  if (k === 'gather') {
    list.push({ x: DOOR_X, label: S.basketDay === S.day ? 'Sewing basket (empty today)' : "Raid Mom's sewing basket 🎀", act: actBasket });
    list.push({ x: APPLE_X, label: S.applesLeft ? 'Pick an apple 🍎' : 'No more apples today', act: actApple });
    list.push({ x: SHED_X, label: 'Head back to the shed', act: () => endTrip('early') });
  }
  if (k === 'follow') list.push({ x: SHED_X, label: `Bring ${S.name} inside`, act: arriveHome });
  if (k === 'explore') list.push({ x: DOOR_X, label: 'Front door', act: () => say([['aubrey', 'silly', 'If I go inside, Mom will make me tidy my room. The woods are calling!']]) });
  return list;
}
function nearestInteract() {
  let best = null;
  for (const it of interactables()) {
    const d = Math.abs(it.x - WS.a.x);
    if (d < 70 && (!best || d < best.d)) best = { ...it, d };
  }
  return best;
}
function actBasket() {
  if (S.basketDay === S.day) return floatText(DOOR_X, GY - 200, 'Nothing left today', '#fff', true);
  const mom = WS.npcs.find(n => n.kind === 'mom');
  if (mom && Math.abs(mom.x - DOOR_X) < 260) return say([['aubrey', 'serious', "Mom's right there. I'll come back when she's not looking."]]);
  S.basketDay = S.day;
  collect('ribbon', 2, DOOR_X, GY - 150);
  setPose('idle_back', 0.7);
}
function actApple() {
  if (!S.applesLeft) return floatText(APPLE_X, GY - 260, 'All picked!', '#fff', true);
  S.applesLeft--;
  collect('apple', 1, APPLE_X, GY - 220);
  setPose('jump', 0.5);
}
function collect(type, n, x, y) {
  S.mats[type] += n;
  WS.bag[type] = (WS.bag[type] || 0) + n;
  SFX.pick();
  burst(x, y, 8, { world: true, spread: 70, up: 60 });
  floatText(x, y - 20, `+${n} ${MATS[type].icon}`, '#fff', true, 22);
}

// --- story hooks ----------------------------------------------------------------------
function endTrip(reason) {
  if (WS.ending) return;
  WS.ending = true;
  const haul = Object.entries(WS.bag).map(([k, n]) => `${MATS[k].icon}×${n}`).join('  ') || 'nothing...';
  const lines = [];
  if (reason === 'time') lines.push(['aubrey', 'thinking', `The ${WS.evening ? 'moon is up' : 'sun is moving'}... I'd better get back to ${S.name}.`]);
  lines.push(['narrator', null, `You found: ${haul}`]);
  say(lines, () => afterActivity());
}
function spotted(n) {
  SFX.fail();
  const k = WS.kind;
  if (k === 'gather') {
    const chores = {
      mom: ['Aubrey! There you are. Come help me fold the laundry, please.', 'Aubrey, sweetie, time to set the table!', 'Aubrey! Your room. Now. It looks like a tornado hit it.'],
      ranger: ['Hey there, kiddo! These woods are no place to wander alone. Let me walk you home.'],
      neighbor: ["Aubrey, dear! Would you help me carry my groceries? You're SUCH a helper."],
    };
    say([[n.kind, 'shock', pick(chores[n.kind])], ['aubrey', 'sad', 'Awww... okay.']], () => endTrip('caught'));
  } else {
    const what = n.kind === 'mom' ? 'Aubrey?! Is that... a PONY? With a HORN?!' : n.kind === 'ranger' ? 'Whoa! Is that a real live UNICORN?!' : 'Goodness gracious, is that a UNICORN?!';
    say([[n.kind, 'shock', what], ['fairy', '🧚', "Quick! I'll make them think it was a dream. But we have to try again — no grown-up can see her before the show!"]], () => startWorld(k));
  }
}
function arriveHome() {
  setPose('idle_back', 0.6);
  say([
    ['narrator', null, `You slip into the old garden shed. ${S.name} sniffs the hay... and flops down happily.`],
    ['aubrey', 'excited', "This is your new home! Well, until the show. Then it's your FOREVER home."],
    ['fairy', '🧚', `Let me give you a tour, Aubrey. You have ${SHOW_DAY - 1} days, and three chances each day — morning, afternoon and evening — to get ${S.name} ready.`],
    ['fairy', '🧚', `GATHER materials outside, then use them in the STYLE STUDIO to make outfits. Match the theme: ${theme().name} — ${theme().blurb}!`],
    ['fairy', '🧚', 'BATHE her so she shines, PRACTICE the runway walk, and give her CUDDLES so she stays happy.'],
    ['fairy', '🧚', "And watch out for your mother. Grown-ups get curious... especially if a unicorn is unhappy and NOISY. Toodle-oo!", () => SFX.sparkle()],
  ], () => { S.day = 1; S.slot = 0; saveCheckpoint(); setScene('salon'); });
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
    ['fairy', '🧚', `This year's theme is... ${theme().name.toUpperCase()}! ${theme().icon}`],
    ['fairy', '🧚', 'And until she wins, NO grown-up may see her. If one does, she has to come home with me.'],
    ['aubrey', 'determined', "Then we're going to win. And nobody is going to see her."],
    ['narrator', null, 'The unicorn nuzzles you. What will you call her?'],
  ], () => askName(() => say([
    ['aubrey', 'happy', `${S.name}. Welcome to the family, ${S.name}!`],
    ['narrator', null, `Lead ${S.name} home to the garden shed. She'll follow you. Grown-ups notice anything in their yellow look-cones — hold ↓ inside a bush and you'll BOTH hide.`],
  ], () => { saveCheckpoint(); startWorld('follow'); })));
}

// --- update ------------------------------------------------------------------------
SCENES.world = {
  update(dt) {
    const a = WS.a, u = WS.uni;
    if (pressed.m) muted = !muted;
    if (a.poseT > 0) a.poseT -= dt;
    const busy = a.poseT > 0;

    // movement & jumping
    a.crouch = !busy && a.lift === 0 && goDown();
    let mv = 0;
    if (!busy && !a.crouch) { if (goLeft()) mv -= 1; if (goRight()) mv += 1; }
    a.moving = mv !== 0;
    if (mv) a.facing = mv;
    const maxX = WS.kind === 'explore' ? FIND_X - 60 : WORLD_W - 120;
    a.x = clamp(a.x + mv * WALK * dt, 80, maxX);
    a.anim += dt;
    if (jumpPressed() && a.lift === 0 && !a.crouch && !busy) { a.vy = JUMP_V; SFX.jump(); S.tutorial.jump = true; }
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

    // pick things up
    for (const it of WS.items) {
      if (it.got || Math.abs(it.x - a.x) > 34) continue;
      const reach = a.crouch ? 45 : 100;
      if (it.h >= a.lift - 25 && it.h <= a.lift + reach) { it.got = true; collect(it.type, 1, it.x, GY - it.h - 20); }
    }

    // unicorn follows; hides with Aubrey
    if (u) {
      const hideIn = a.hidden ? bush : null;
      const tx = hideIn !== null ? hideIn - a.facing * 20 : a.x - a.facing * 80;
      const dx = tx - u.x;
      u.moving = Math.abs(dx) > 6;
      if (u.moving) { u.x += Math.sign(dx) * Math.min(Math.abs(dx), (Math.abs(dx) > 200 ? 340 : 220) * dt); u.facing = Math.sign(dx); }
      else u.facing = a.facing;
      u.hidden = hideIn !== null && Math.abs(u.x - hideIn) < 75;
    }

    if (WS.timer !== null) {
      WS.timer -= dt;
      if (WS.timer <= 0) return endTrip('time');
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
      WS.sus += (WS.kind === 'gather' ? 75 : 55) * dt;
      if (WS.sus >= 100) return spotted(seen);
    } else WS.sus = Math.max(0, WS.sus - 18 * dt);
  },
  draw() {
    const a = WS.a;
    WS.cam = clamp(a.x - W / 2, 0, WORLD_W - W);
    drawWorld();
    if (!dlg) drawWorldHUD();
  },
};

// --- render ------------------------------------------------------------------------
const TREES = [];
for (let x = 1930, i = 0; x < 4700; x += 120 + ((i * 53) % 70), i++) {
  if (x > CREEK0 - 40 && x < CREEK1 + 40) continue;
  if (x > STAGE_X - 280 && x < STAGE_X + 260) continue;
  TREES.push({ x, h: 270 + ((i * 37) % 90), r: 62 + ((i * 29) % 30), tone: i % 3 });
}
function forestK(wx) { return clamp((wx - GATE_X) / 350, 0, 1); }

function drawSky(cam, dusk) {
  const k = forestK(cam + W / 2) * 0.5;
  const g = ctx.createLinearGradient(0, 0, 0, GY);
  g.addColorStop(0, mix(mix('#7cc6f5', '#4f7aa0', k), '#1c1a4a', dusk));
  g.addColorStop(1, mix(mix('#d9f0ff', '#a8cfc0', k), '#7a5a9a', dusk));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (dusk > 0.3) {
    for (let i = 0; i < 50; i++) {
      const a = (0.3 + 0.7 * Math.abs(Math.sin(S.t + i * 1.7))) * dusk;
      star((i * 211 - cam * 0.05 + 2000) % W, (i * 67) % 260, 1.5 + (i % 3), `rgba(255,255,240,${a})`);
    }
    ctx.fillStyle = `rgba(255,250,220,${dusk})`; circle(780 - cam * 0.03, 80, 34);
    ctx.fillStyle = mix('#1c1a4a', '#4f7aa0', 0.2); circle(766 - cam * 0.03, 72, 30);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 380 - cam * 0.1 + S.t * 6) % 2300 + 2300) % 2300 - 200, cy = 60 + (i % 3) * 35;
      ellipse(cx, cy, 50, 18); ellipse(cx + 30, cy - 10, 36, 20); ellipse(cx - 30, cy + 4, 30, 14);
    }
  }
  for (const [par, col, base, amp] of [[0.2, '#a6d49b', 330, 40], [0.45, '#7fbf75', 380, 30]]) {
    ctx.fillStyle = mix(mix(col, '#2f5240', k * 1.2), '#2a2a5a', dusk * 0.7);
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) {
      const wx = x + cam * par;
      ctx.lineTo(x, base - Math.sin(wx * 0.006) * amp - Math.sin(wx * 0.013) * amp * 0.5);
    }
    ctx.lineTo(W, H); ctx.fill();
  }
}
function drawGround(cam, dusk) {
  const k = forestK(cam + W / 2);
  ctx.fillStyle = mix(mix('#74c25e', '#4a8a4a', k), '#2a4a4a', dusk * 0.6);
  ctx.fillRect(0, GY - 4, W, H - GY + 4);
  ctx.fillStyle = mix('#c9a679', '#6a5a6a', dusk * 0.6);
  ctx.fillRect(0, GY + 10, W, 22);
  ctx.strokeStyle = 'rgba(91,63,115,.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, GY - 4); ctx.lineTo(W, GY - 4); ctx.stroke();
  ctx.fillStyle = 'rgba(30,80,40,.35)';
  for (let wx = Math.floor(cam / 23) * 23; wx < cam + W; wx += 23) tri(wx - cam, GY - 3, wx - cam + 3, GY - 13 - (wx % 7), wx - cam + 6, GY - 3);
}
function drawItem(it, cam) {
  const x = it.x - cam, y = GY - it.h - 14 + Math.sin(S.t * 3 + it.ph) * (it.h > 20 ? 6 : 2);
  if (x < -40 || x > W + 40) return;
  const g = ctx.createRadialGradient(x, y, 2, x, y, 26);
  g.addColorStop(0, it.type === 'star' ? 'rgba(255,250,180,.8)' : 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(x - 26, y - 26, 52, 52);
  if (it.type === 'feather') { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(S.t * 2 + it.ph) * 0.4); emoji(MATS[it.type].icon, 0, 0, 28); ctx.restore(); }
  else emoji(MATS[it.type].icon, x, y, 28);
  if (Math.sin(S.t * 4 + it.ph) > 0.85) star(x + 12, y - 12, 4, '#fff');
}
function drawVisionCone(n, cam) {
  const x = n.x - cam, ex = x + n.dir * 16, ey = GY - 236;
  const g = ctx.createLinearGradient(ex, 0, ex + n.dir * VISION, 0);
  const col = n.seeing ? '255,80,80' : '255,230,90';
  g.addColorStop(0, `rgba(${col},.35)`); g.addColorStop(1, `rgba(${col},0)`);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + n.dir * VISION, GY - 320); ctx.lineTo(ex + n.dir * VISION, GY); ctx.closePath(); ctx.fill();
}
function drawWorld() {
  const cam = WS.cam, dusk = WS.dusk;
  const vis = (wx, pad = 400) => wx - cam > -pad && wx - cam < W + pad;
  drawSky(cam, dusk);
  drawGround(cam, dusk);
  if (vis(320, 700)) drawHouse(-cam, GY, dusk);
  for (let i = 0; i < 6; i++) if (vis(560)) flower(560 + i * 34 - cam, GY - 10, 9, ['#ff6fae', '#fff', '#ffd84a'][i % 3], '#ffd84a', 1.5);
  drawFence(760, GATE_X - 80, cam, GY);
  if (vis(APPLE_X)) drawAppleTree(APPLE_X - cam, GY, S.applesLeft);
  if (vis(PATCH_X)) {
    for (let i = 0; i < 5; i++) { inkEllipse(PATCH_X - 100 + i * 50 - cam, GY - 8, 26, 14, 0, '#4f9a48', 2); ctx.fillStyle = '#e8413f'; circle(PATCH_X - 100 + i * 50 - cam + 8, GY - 10, 4); }
  }
  if (vis(1180)) {
    const lx = 1080 - cam;
    inkRect(lx, GY - 210, 8, 210, '#9a8a7a', 2, 2); inkRect(lx + 240, GY - 210, 8, 210, '#9a8a7a', 2, 2);
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(lx + 4, GY - 205); ctx.quadraticCurveTo(lx + 124, GY - 188, lx + 244, GY - 205); ctx.stroke();
    const sway = Math.sin(S.t * 2) * 4;
    for (const [dx, col, w, h] of [[24, '#ffffff', 64, 84], [104, '#ffc6dc', 54, 64], [170, '#c6e2ff', 54, 92]]) {
      ctx.beginPath(); ctx.moveTo(lx + dx, GY - 198); ctx.lineTo(lx + dx + w, GY - 198); ctx.lineTo(lx + dx + w + sway, GY - 198 + h); ctx.lineTo(lx + dx + sway, GY - 198 + h); ctx.closePath();
      ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = 'rgba(91,63,115,.5)'; ctx.stroke();
    }
  }
  if (vis(SHED_X)) drawShed(SHED_X - cam, GY, WS.kind === 'gather');
  if (vis(GATE_X)) {
    const x = GATE_X - cam;
    inkRect(x - 70, GY - 176, 14, 176, '#7a5230', 2.5); inkRect(x + 56, GY - 176, 14, 176, '#7a5230', 2.5);
    ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(x, GY - 176, 63, Math.PI, 0); ctx.stroke();
    panelSign(x, GY - 254, 'The Woods →');
  }
  for (const t of TREES) if (vis(t.x, 150)) drawTree(t.x - cam, GY, t.h, t.r, t.tone, dusk);
  if (vis((CREEK0 + CREEK1) / 2, 600)) drawCreek(CREEK0, CREEK1, cam, GY);
  if (vis(STAGE_X)) drawStage(STAGE_X - cam, GY, WS.kind === 'shownight');
  for (const it of WS.items) if (!it.got) drawItem(it, cam);

  if (worldTarget()) for (const n of WS.npcs) if (vis(n.x)) drawVisionCone(n, cam);
  if (WS.kind === 'explore') drawUnicorn(FIND_X + 40 - cam, GY, 0.5, uniLook(), { facing: -1, pose: 'sit', mood: 'sad' });
  const u = WS.uni;
  if (u) drawUnicorn(u.x - cam, GY, 0.55, uniLook(), { facing: u.facing, pose: u.hidden ? 'sit' : 'stand', moving: u.moving, glow: WS.dusk * 0.6 });
  for (const n of WS.npcs) if (vis(n.x)) drawPerson(n.kind, n.x - cam, GY, n.dir, n.wait > 0 || n.seeing ? 0 : n.walk, n.seeing, 0.92);

  const a = WS.a;
  drawAubrey(a.x - cam, GY, aubFrame(a), a.facing, a.pose === 'jump' && a.poseT > 0 ? Math.sin((1 - a.poseT / a.poseDur) * Math.PI) * 40 : a.lift);
  for (const b of BUSHES) if (vis(b, 120)) drawBush(b - cam, GY, dusk);

  const k = forestK(cam + W / 2);
  if (k > 0 || dusk > 0) {
    ctx.fillStyle = `rgba(20,20,60,${0.18 * k + 0.25 * dusk})`; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) {
      const wx = 1900 + ((i * 263) % 2600) + Math.sin(S.t * 0.7 + i) * 30, x = wx - cam;
      if (x < 0 || x > W) continue;
      const y = GY - 40 - ((i * 97) % 220) + Math.cos(S.t * 0.9 + i * 2) * 15;
      const al = (0.3 + 0.7 * Math.max(0, Math.sin(S.t * 2 + i * 1.3))) * (0.4 + dusk);
      ctx.fillStyle = `rgba(255,250,150,${al})`; circle(x, y, 2.5);
      ctx.fillStyle = `rgba(255,250,150,${al * 0.2})`; circle(x, y, 9);
    }
  }
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
  if (WS.timer !== null) {
    const t = Math.max(0, Math.ceil(WS.timer));
    darkPanel(12, 58, 120, 36, 18);
    emoji(WS.evening ? '🌙' : '☀️', 34, 76, 20);
    text(`${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, 54, 76, 18, t <= 10 ? '#ffb0b0' : '#fff', 'left', 700);
  }
  if (worldTarget()) {
    darkPanel(W - 252, 12, 240, 50, 14);
    text(WS.kind === 'gather' ? 'Grown-up noticing' : 'Secret-o-meter', W - 240, 27, 13, '#fff');
    bar(W - 240, 40, 216, 12, WS.sus, WS.sus < 40 ? '#7be08a' : WS.sus < 75 ? '#ffd23f' : '#ff5a5a');
  }
  if (WS.kind === 'gather') {
    const kinds = MAT_ORDER.filter(k => WS.bag[k]);
    darkPanel(12, H - 54, Math.max(170, 28 + kinds.length * 66), 44, 14);
    if (!kinds.length) text('Your bag is empty', 28, H - 32, 15, 'rgba(255,255,255,.7)');
    kinds.forEach((k, i) => { emoji(MATS[k].icon, 34 + i * 66, H - 32, 22); text(`×${WS.bag[k]}`, 50 + i * 66, H - 32, 16, '#fff'); });
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
  if (S.tutorial.jump !== true && WS.kind === 'gather') outlined('↑ / W / Space to jump for things in the air', W / 2, H - 80, 16, '#fff');
  text(muted ? 'M: sound off' : 'M: sound on', W - 14, H - 14, 12, 'rgba(255,255,255,.7)', 'right', 500);
}
