'use strict';
{
  // ===========================================================================
  // Glittering Creek, game 1 (action) RAINBOW PRISM: Otto's crystal prism splits the white
  // sunbeam into a fan of rainbow colours. Turn the prism (point with the mouse, or the arrow
  // keys) so the RIGHT colour of light lands on each sleepy crystal: red on red, green on green.
  // Crystals sit on ledges, drift past on lily pads, rise in bubbles and flutter about.
  // Teaches: white sunlight is all the rainbow colours mixed; a prism bends them apart, always in
  // the same order (red, orange, yellow, green, blue, purple).
  // ===========================================================================
  const RP_COLS = [
    ['red', '#ff3b4e'], ['orange', '#ff9a2a'], ['yellow', '#ffe23a'],
    ['green', '#3ed86a'], ['blue', '#3a9bff'], ['purple', '#a45cff'],
  ];
  const RP_P = { x: 250, y: 296 };            // the prism
  const RP_SUN = { x: 78, y: 112 };           // the sun, peeking through the cave mouth
  const RP_AIM = [-1.05, 0.95];               // how far the prism can turn (radians, 0 = straight right)
  const RP_LEDGES = [[530, 150], [668, 118], [812, 148], [906, 236], [604, 262], [752, 268]];
  const RP_CREEK_Y = 430;

  const twk = (x, y, r, a, col = '#ffffff') => { ctx.globalAlpha = clamp(a, 0, 1); star(x, y, r, col, 4); ctx.globalAlpha = 1; };
  function gemShape(x, y, h, w, col, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const p = P2(`M${-w / 2},0 L${-w / 2},${-h * 0.72} L0,${-h} L${w / 2},${-h * 0.72} L${w / 2},0 Z`);
    ink(p, col, 1.5);
    ctx.save(); ctx.clip(p);
    ctx.fillStyle = 'rgba(255,255,255,.42)'; ctx.fillRect(-w / 2, -h, w * 0.32, h);
    ctx.fillStyle = 'rgba(40,10,80,.16)'; ctx.fillRect(w * 0.18, -h, w, h);
    ctx.restore();
    ctx.restore();
  }
  function gemCluster(x, y, s, cols, t) {
    const gr = ctx.createRadialGradient(x, y - 26 * s, 3, x, y - 26 * s, 64 * s);
    gr.addColorStop(0, `rgba(190,240,255,${0.32 + 0.14 * Math.sin(t * 2 + x)})`); gr.addColorStop(1, 'rgba(190,240,255,0)');
    ctx.fillStyle = gr; circle(x, y - 26 * s, 64 * s);
    [[-20, 40, 15, -0.45], [19, 46, 15, 0.4], [-7, 62, 18, -0.12], [8, 52, 16, 0.14], [-1, 30, 12, 0.75]].forEach(([dx, h, w, r], i) => gemShape(x + dx * s, y, h * s, w * s, cols[i % cols.length], r));
  }
  const ledgeRock = (x, y, w) => {
    ink(P2(`M${x - w / 2},${y} Q${x - w / 2 - 8},${y + 16} ${x - w / 4},${y + 22} L${x + w / 4},${y + 24} Q${x + w / 2 + 8},${y + 16} ${x + w / 2},${y} Z`), '#6c5aa8', 1.5);
    ctx.fillStyle = '#8f7ccc'; ctx.fillRect(x - w / 2 + 3, y - 1, w - 6, 5);
  };

  // --- the grotto -------------------------------------------------------------------------------
  function drawGrotto(t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#2a1d5c'); sky.addColorStop(0.55, '#3d3a92'); sky.addColorStop(1, '#2a5a8a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // cave mouth with the bright day outside
    const mouth = P2('M0,40 C30,20 120,24 168,58 C206,88 196,150 160,190 C120,232 40,236 0,220 Z');
    ctx.save(); ctx.clip(mouth);
    const day = ctx.createLinearGradient(0, 30, 0, 230); day.addColorStop(0, '#8fdcff'); day.addColorStop(1, '#ffe9fa');
    ctx.fillStyle = day; ctx.fillRect(0, 0, 220, 240);
    ctx.fillStyle = '#9be08a'; ellipse(60, 236, 140, 40); ctx.fillStyle = '#7fd07a'; ellipse(170, 240, 90, 34);
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ellipse(150, 70, 26, 10); ellipse(170, 64, 18, 9);
    ctx.restore();
    ctx.strokeStyle = '#1e1446'; ctx.lineWidth = 6; ctx.stroke(mouth);
    // the sun
    const sg = ctx.createRadialGradient(RP_SUN.x, RP_SUN.y, 10, RP_SUN.x, RP_SUN.y, 120);
    sg.addColorStop(0, 'rgba(255,250,210,.95)'); sg.addColorStop(0.35, 'rgba(255,236,150,.45)'); sg.addColorStop(1, 'rgba(255,236,150,0)');
    ctx.fillStyle = sg; circle(RP_SUN.x, RP_SUN.y, 120);
    ctx.save(); ctx.translate(RP_SUN.x, RP_SUN.y); ctx.rotate(t * 0.3);
    ctx.fillStyle = '#ffd84a'; for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); tri(-6, -40, 6, -40, 0, -54); }
    ctx.restore();
    inkCircle(RP_SUN.x, RP_SUN.y, 34, '#ffe45a', 2);
    ctx.fillStyle = '#fff6b0'; circle(RP_SUN.x - 10, RP_SUN.y - 10, 11);
    ctx.fillStyle = '#5a3a2a'; circle(RP_SUN.x - 11, RP_SUN.y + 2, 3); circle(RP_SUN.x + 11, RP_SUN.y + 2, 3);
    ctx.strokeStyle = '#5a3a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(RP_SUN.x, RP_SUN.y + 8, 9, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,120,150,.5)'; circle(RP_SUN.x - 20, RP_SUN.y + 10, 5); circle(RP_SUN.x + 20, RP_SUN.y + 10, 5);
    // far wall: layered rock with a lighter rim
    ctx.fillStyle = '#463c9c';
    ctx.beginPath(); ctx.moveTo(200, 340); ctx.bezierCurveTo(300, 250, 420, 300, 520, 260); ctx.bezierCurveTo(640, 210, 760, 270, 960, 220); ctx.lineTo(960, 420); ctx.lineTo(200, 420); ctx.fill();
    ctx.fillStyle = '#5348ac';
    ctx.beginPath(); ctx.moveTo(300, 380); ctx.bezierCurveTo(420, 330, 520, 360, 640, 330); ctx.bezierCurveTo(760, 300, 860, 340, 960, 320); ctx.lineTo(960, 430); ctx.lineTo(300, 430); ctx.fill();
    // stalactites along the ceiling
    for (let i = 0; i < 16; i++) {
      const x = 190 + i * 50 + (i % 3) * 9, h = 26 + ((i * 37) % 40);
      ink(P2(`M${x - 13},58 L${x + 13},58 L${x + 2},${58 + h} Z`), i % 2 ? '#3a2f80' : '#43378e', 1.2, '#1e1446');
      if (i % 3 === 0) { ctx.fillStyle = `rgba(150,230,255,${0.5 + 0.4 * Math.sin(t * 3 + i)})`; circle(x + 2, 62 + h, 3); }
    }
    ctx.fillStyle = '#2a1f66'; ctx.fillRect(170, 56, W - 170, 6);
    // glow-worms twinkling on the ceiling and walls
    for (let i = 0; i < 34; i++) {
      const x = 200 + (i * 151) % 750, y = 80 + (i * 67) % 210, a = 0.4 + 0.5 * Math.sin(t * 1.8 + i * 1.7);
      ctx.fillStyle = `rgba(140,255,230,${a * 0.35})`; circle(x, y, 6); ctx.fillStyle = `rgba(220,255,245,${a})`; circle(x, y, 1.8);
    }
    // glowing crystal clusters set into the walls
    gemCluster(360, 250, 0.7, ['#7fe8ff', '#ff8fd0', '#b892ff', '#8affc8', '#ffe36b'], t);
    gemCluster(940, 120, 0.55, ['#ff8fd0', '#b892ff', '#7fe8ff', '#8affc8', '#ffe36b'], t + 2);
    gemCluster(470, 322, 0.5, ['#b892ff', '#7fe8ff', '#ff8fd0', '#ffe36b', '#8affc8'], t + 1);
    gemCluster(880, 334, 0.6, ['#8affc8', '#ff8fd0', '#7fe8ff', '#b892ff', '#ffe36b'], t + 3);
    // ledges the sleepy crystals sit on
    for (const [x, y] of RP_LEDGES) ledgeRock(x, y + 4, 76);
    // the creek
    const cr = P2(`M200,${RP_CREEK_Y - 30} C420,${RP_CREEK_Y - 46} 700,${RP_CREEK_Y - 40} 960,${RP_CREEK_Y - 34} L960,${RP_CREEK_Y + 44} C700,${RP_CREEK_Y + 40} 420,${RP_CREEK_Y + 50} 200,${RP_CREEK_Y + 40} Z`);
    const wg = ctx.createLinearGradient(0, RP_CREEK_Y - 40, 0, RP_CREEK_Y + 46);
    wg.addColorStop(0, '#5fd4e8'); wg.addColorStop(1, '#2f8fc8');
    ctx.strokeStyle = '#d8f8ff'; ctx.lineWidth = 8; ctx.stroke(cr); ctx.fillStyle = wg; ctx.fill(cr);
    ctx.save(); ctx.clip(cr);
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const x = ((i * 113 - t * 40) % 800 + 800) % 800 + 180, y = RP_CREEK_Y - 22 + (i * 23) % 58;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 12, y - 4, x + 26, y); ctx.stroke();
    }
    for (let i = 0; i < 12; i++) twk(220 + (i * 71) % 740, RP_CREEK_Y - 18 + (i * 29) % 52, 4, Math.sin(t * 4 + i * 2.1), '#ffffff');
    ctx.restore();
    // little waterfall feeding the creek at the right
    const wf = ctx.createLinearGradient(910, 0, 960, 0); wf.addColorStop(0, '#9aefff'); wf.addColorStop(1, '#5fc8f0');
    ctx.fillStyle = wf; ctx.fillRect(918, 250, 42, RP_CREEK_Y - 250 - 20);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const yy = 250 + ((t * 120 + i * 40) % 160); ctx.beginPath(); ctx.moveTo(924 + i * 9, yy); ctx.lineTo(924 + i * 9, yy + 18); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 5; i++) circle(924 + i * 9, RP_CREEK_Y - 22 + Math.sin(t * 8 + i) * 3, 6);
    // near floor: lavender pebbly sand
    const fl = ctx.createLinearGradient(0, 470, 0, H); fl.addColorStop(0, '#b8a2e8'); fl.addColorStop(1, '#9a82d8');
    ctx.fillStyle = fl; ctx.beginPath(); ctx.moveTo(0, 460); ctx.bezierCurveTo(240, 468, 520, 478, 960, 472); ctx.lineTo(960, H); ctx.lineTo(0, H); ctx.fill();
    for (let i = 0; i < 34; i++) inkEllipse((i * 137) % W, 486 + (i * 53) % 50, 6 + (i % 3) * 2, 4, 0, ['#e8e0f4', '#ffd8ec', '#d8f0ff', '#e0ffe8'][i % 4], 0.8);
    gemCluster(560, 500, 0.5, ['#ff8fd0', '#7fe8ff', '#ffe36b', '#b892ff', '#8affc8'], t + 4);
    gemCluster(916, 506, 0.75, ['#7fe8ff', '#b892ff', '#ff8fd0', '#8affc8', '#ffe36b'], t + 5);
    // glowing mushrooms
    for (const [x, y, c] of [[470, 512, '#7fe8ff'], [700, 506, '#ff9ad8'], [740, 520, '#b892ff']]) {
      ctx.fillStyle = `rgba(200,255,250,${0.22 + 0.12 * Math.sin(t * 2 + x)})`; circle(x, y - 12, 20);
      inkRect(x - 3, y - 12, 6, 14, '#fff6e0', 1, 2); inkEllipse(x, y - 14, 12, 7, 0, c, 1.2);
      ctx.fillStyle = '#ffffff'; circle(x - 4, y - 16, 1.8); circle(x + 4, y - 15, 1.5);
    }
  }
  function drawPrism(x, y, a, t) {
    // a mossy rock pedestal with a glowing triangular crystal on top, turning with the aim
    ink(P2(`M${x - 64},470 C${x - 70},400 ${x - 44},${y + 40} ${x - 10},${y + 34} C${x + 30},${y + 30} ${x + 64},${y + 60} ${x + 70},470 Z`), '#9a8ad0', 2);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ellipse(x - 26, y + 70, 18, 30, 0.2);
    gemShape(x + 40, 470, 40, 18, '#7fe8ff', 0.3); gemShape(x + 52, 472, 26, 13, '#ff8fd0', 0.6); gemShape(x - 46, 470, 30, 15, '#b892ff', -0.4);
    ctx.fillStyle = '#5ac85a'; ellipse(x - 12, y + 38, 34, 9); ellipse(x + 26, y + 44, 22, 7);
    ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.1 * Math.sin(t * 3)})`; circle(x, y, 58);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a * 0.5);
    const tri3 = P2('M0,-40 L36,24 L-36,24 Z');
    ctx.globalAlpha = 0.9; ink(tri3, 'rgba(225,245,255,.9)', 2.2); ctx.globalAlpha = 1;
    const sh = ctx.createLinearGradient(-36, 0, 36, 0);
    sh.addColorStop(0, 'rgba(255,140,200,.35)'); sh.addColorStop(0.5, 'rgba(140,255,240,.25)'); sh.addColorStop(1, 'rgba(180,140,255,.35)');
    ctx.fillStyle = sh; ctx.fill(tri3);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill(P2('M-4,-30 L-24,16 L-14,16 Z'));
    ctx.restore();
    twk(x + 14, y - 32, 8, 0.6 + 0.4 * Math.sin(t * 5), '#ffffff');
  }
  // a sleepy (or wide-awake) crystal with a little face
  function drawSprite(o, t) {
    const [name, col] = RP_COLS[o.c], k = o.state === 'lit' ? 1 : o.charge;
    const x = o.x, y = o.y + (o.state === 'lit' ? -o.lt * 60 : 0);
    if (o.state === 'lit') ctx.globalAlpha = clamp(1.4 - o.lt, 0, 1);
    if (o.kind === 'pad') {
      inkEllipse(x, y + 18, 34, 11, 0, '#4cb658', 1.5);
      ctx.fillStyle = '#2f8a3a'; tri(x + 6, y + 18, x + 34, y + 12, x + 32, y + 22);
      ctx.fillStyle = '#ff9ad8'; circle(x - 22, y + 14, 4);
    }
    if (o.kind === 'moth') {
      const f = Math.sin(t * 14 + o.ph) * 0.5 + 0.6;
      for (const d of [-1, 1]) { inkEllipse(x + d * 20 * f, y - 22, 16 * f, 12, d * 0.4, mix(col, '#ffffff', 0.55), 1.2); }
    }
    const glow = ctx.createRadialGradient(x, y - 18, 4, x, y - 18, 46);
    glow.addColorStop(0, `rgba(255,255,255,${0.15 + 0.6 * k})`); glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow; circle(x, y - 18, 46);
    const body = mix(mix(col, '#8a84a8', 0.55), col, k);
    gemShape(x - 13, y + 2, 26, 14, mix(body, '#ffffff', 0.1), -0.35);
    gemShape(x + 13, y + 2, 24, 13, mix(body, '#ffffff', 0.1), 0.35);
    gemShape(x, y + 4, 48, 26, body, 0);
    // face
    ctx.strokeStyle = '#2a1840'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    if (o.state === 'lit' || k > 0.7) {
      ctx.fillStyle = '#2a1840'; circle(x - 5, y - 18, 2.6); circle(x + 5, y - 18, 2.6);
      ctx.fillStyle = '#ffffff'; circle(x - 4.2, y - 19, 1); circle(x + 5.8, y - 19, 1);
      ctx.beginPath(); ctx.arc(x, y - 13, 4, 0.2, Math.PI - 0.2); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(x - 5, y - 19, 3, 0.2, Math.PI - 0.2); ctx.moveTo(x + 8, y - 18.5); ctx.arc(x + 5, y - 19, 3, 0.2, Math.PI - 0.2); ctx.stroke();
      ctx.fillStyle = 'rgba(42,24,64,.7)'; ellipse(x, y - 11, 2, 1.6);
    }
    ctx.fillStyle = 'rgba(255,130,170,.55)'; circle(x - 9, y - 13, 2.6); circle(x + 9, y - 13, 2.6);
    if (o.kind === 'bubble') {
      ctx.strokeStyle = 'rgba(230,250,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y - 16, 36, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(200,240,255,.14)'; circle(x, y - 16, 36);
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ellipse(x - 16, y - 34, 7, 4, -0.6);
    }
    if (o.state !== 'lit') {
      // which colour it needs: a coloured ring that fills up as it wakes, and its name
      ctx.strokeStyle = 'rgba(30,16,60,.45)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y - 18, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(x, y - 18, 30, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      if (k > 0) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y - 18, 30, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); ctx.stroke(); }
      ctx.font = `800 14px ${FONT}`; const tw = ctx.measureText(name).width + 14;
      rrect(x - tw / 2, y + 12, tw, 20, 10, 'rgba(40,22,70,.82)');
      text(name, x, y + 22.5, 14, col === '#a45cff' ? '#d2b0ff' : col, 'center', 800);
      if (o.charge < 0.05 && o.kind !== 'moth') text('z', x + 20 + Math.sin(t * 2 + o.ph) * 3, y - 44 - ((t + o.ph) % 1.5) * 8, 13, 'rgba(255,255,255,.8)', 'left', 800);
      if (o.wrongT > 0.35) {
        const msg = `I need ${name.toUpperCase()}!`;
        ctx.font = `800 15px ${FONT}`; const mw = ctx.measureText(msg).width + 20;
        const by = Math.max(64, y - 84), bx = clamp(x, RP_P.x + mw / 2 + 60, W - mw / 2 - 8);
        rrect(bx - mw / 2, by, mw, 26, 13, 'rgba(255,255,255,.95)', col, 3);
        text(msg, bx, by + 13, 15, '#4a2a6e', 'center', 800);
      }
    } else for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * 2; twk(x + Math.cos(a) * 34, y - 18 + Math.sin(a) * 34, 6, 1, i % 2 ? '#ffffff' : col); }
    ctx.globalAlpha = 1;
  }

  MG.rainbowprism = {
    kind: 'action', title: () => 'Rainbow Prism', icon: () => '🌈',
    how: () => "Sunlight is ALL the rainbow colours mixed together! Otto's crystal prism splits it apart. Turn the prism with the mouse or the arrow keys, and shine the RIGHT colour on each sleepy crystal: red light on a red crystal!",
    init(g) {
      const t = g.tier - 1;
      Object.assign(g, {
        timeLeft: 55, aim: -0.2, aimT: -0.2, lit: 0, goal: [8, 10, 12][t], spread: [0.62, 0.5, 0.42][t], dwell: [0.6, 0.7, 0.75][t],
        active: [2, 3, 3][t], speed: [30, 42, 56][t], things: [], spawnT: 0.4, hinted: 0, cheer: 0,
        say: 'Turn the prism! Shine the right colour on each sleepy crystal.',
      });
    },
    start(g) { speak(g.say); },
    // which band of the rainbow fan (0 red .. 5 purple) points along angle a, or -1 if none
    bandAt(g, a) {
      const k = (a - (g.aim - g.spread / 2)) / g.spread;
      return k < 0 || k >= 1 ? -1 : Math.floor(k * RP_COLS.length);
    },
    spawn(g) {
      const sleeping = g.things.filter(o => o.state === 'sleep');
      const used = new Set(sleeping.map(o => o.c));
      const c = pick([0, 1, 2, 3, 4, 5].filter(i => !used.has(i)));
      const kinds = [['ledge', 'ledge', 'ledge', 'pad', 'pad'], ['ledge', 'ledge', 'pad', 'pad', 'bubble'], ['ledge', 'pad', 'pad', 'bubble', 'moth']][g.tier - 1];
      let kind = pick(kinds);
      const freeLedges = RP_LEDGES.filter(([x, y]) => !g.things.some(o => o.kind === 'ledge' && o.lx === x && o.ly === y));
      if (kind === 'ledge' && !freeLedges.length) kind = 'pad';
      const o = { kind, c, charge: 0, state: 'sleep', lt: 0, wrongT: 0, ph: rand(0, 6), age: 0 };
      if (kind === 'ledge') { const [x, y] = pick(freeLedges); Object.assign(o, { x, y, lx: x, ly: y }); }
      else if (kind === 'pad') Object.assign(o, { x: 990, y: RP_CREEK_Y - 14, vx: -g.speed });
      else if (kind === 'bubble') Object.assign(o, { x0: rand(520, 860), x: 0, y: RP_CREEK_Y - 10, vy: -g.speed * 0.75 });
      else Object.assign(o, { cx: rand(560, 820), cy: rand(160, 280), x: 0, y: 0 });
      g.things.push(o);
    },
    update(g, dt) {
      g.timeLeft -= dt; g.cheer = Math.max(0, g.cheer - dt);
      // aiming: point with the mouse, or turn with the arrow keys
      const up = keys.arrowup || keys.w || goLeft(), dn = keys.arrowdown || keys.s || goRight();
      if (up) g.aimT -= 1.3 * dt;
      if (dn) g.aimT += 1.3 * dt;
      if (!up && !dn && pointerMoved(g)) g.aimT = Math.atan2(pointer.y - RP_P.y, Math.max(8, pointer.x - RP_P.x));
      g.aimT = clamp(g.aimT, RP_AIM[0], RP_AIM[1]);
      g.aim += clamp(g.aimT - g.aim, -4.5 * dt, 4.5 * dt);
      // keep enough sleepy crystals about
      const sleeping = g.things.filter(o => o.state === 'sleep').length;
      if (sleeping < g.active && (g.spawnT -= dt) <= 0) { this.spawn(g); g.spawnT = 0.8; }
      for (const o of g.things) {
        o.age += dt;
        if (o.state === 'lit') { o.lt += dt; continue; }
        if (o.kind === 'pad') { o.x += o.vx * dt; o.y = RP_CREEK_Y - 14 + Math.sin(S.t * 2 + o.ph) * 3; }
        else if (o.kind === 'bubble') { o.y += o.vy * dt; o.x = o.x0 + Math.sin(o.age * 1.6 + o.ph) * 24; }
        else if (o.kind === 'moth') { const w = 0.5 + g.speed / 120; o.x = o.cx + Math.sin(o.age * w + o.ph) * 120; o.y = o.cy + Math.sin(o.age * w * 2 + o.ph) * 50; }
        // is the right colour of light on it?
        // only once it is properly on screen
        const band = o.x > W - 40 || o.y < 90 ? -2 : this.bandAt(g, Math.atan2(o.y - 18 - RP_P.y, o.x - RP_P.x));
        if (band === o.c) {
          o.charge += dt / g.dwell; o.wrongT = 0;
          if (Math.random() < dt * 8) tone(300 + o.c * 90 + o.charge * 300, 0.06, 'sine', 0.03);
        } else {
          o.charge = Math.max(0, o.charge - dt / g.dwell * 0.5);
          o.wrongT = band >= 0 ? o.wrongT + dt : Math.max(0, o.wrongT - dt * 2);
        }
        if (o.charge >= 1) {
          o.state = 'lit'; g.lit++; g.cheer = 1;
          // higher notes for the colours that bend more, just like the light
          [0, 0.08, 0.16].forEach((d, i) => tone([392, 440, 494, 523, 587, 659][o.c] * [1, 1.25, 1.5][i], 0.35, 'sine', 0.08, d));
          SFX.sparkle(); burst(o.x, o.y - 18, 22, { colors: [RP_COLS[o.c][1], '#ffffff', '#fff6a8'] });
          floatText(o.x, o.y - 60, `${RP_COLS[o.c][0]} light!`, RP_COLS[o.c][1], false, 22);
          if (g.lit === 1) speak(`${RP_COLS[o.c][0]} light for the ${RP_COLS[o.c][0]} crystal! It woke up!`);
        } else if (o.age > 7 && !o.hint && g.hinted < 3) {
          o.hint = true; g.hinted++;
          g.say = `Find the ${RP_COLS[o.c][0]} stripe in the rainbow, and shine it on the ${RP_COLS[o.c][0]} crystal!`;
          speak(g.say);
        }
      }
      // drifting crystals that float away are gone (but more come)
      g.things = g.things.filter(o => !(o.state === 'lit' && o.lt > 1.4) && !(o.kind === 'pad' && o.x < 330) && !(o.kind === 'bubble' && o.y < 96));
      g.progress = `Crystals awake ${g.lit} of ${g.goal}`;
      g.score = clamp(g.lit / g.goal, 0, 1);
      if (g.lit >= g.goal || g.timeLeft <= 0) g.done = true;
    },
    draw(g) {
      const t = S.t;
      drawGrotto(t);
      // white sunbeam into the prism
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,250,220,.35)'; ctx.lineWidth = 26; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(RP_SUN.x + 20, RP_SUN.y + 20); ctx.lineTo(RP_P.x - 8, RP_P.y - 4); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 9; ctx.stroke();
      ctx.restore();
      // the rainbow fan
      const n = RP_COLS.length, a0 = g.aim - g.spread / 2, bw = g.spread / n, R = 1200;
      ctx.save();
      ctx.beginPath(); ctx.rect(RP_P.x, 60, W, H); ctx.clip();
      for (let i = 0; i < n; i++) {
        const s = a0 + i * bw, e = s + bw;
        ctx.globalAlpha = 0.5 + 0.06 * Math.sin(t * 3 + i);
        ctx.fillStyle = RP_COLS[i][1];
        ctx.beginPath(); ctx.moveTo(RP_P.x, RP_P.y); ctx.lineTo(RP_P.x + Math.cos(s) * R, RP_P.y + Math.sin(s) * R); ctx.lineTo(RP_P.x + Math.cos(e) * R, RP_P.y + Math.sin(e) * R); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i++) {
        const b = i % n, r = 90 + ((i * 97 + t * 160) % 760), a = a0 + (b + 0.2 + 0.6 * ((i * 0.37) % 1)) * bw;
        twk(RP_P.x + Math.cos(a) * r, RP_P.y + Math.sin(a) * r, 4 + (i % 3), 0.7, '#ffffff');
      }
      ctx.restore();
      // the crystals
      for (const o of g.things) drawSprite(o, t);
      drawPrism(RP_P.x, RP_P.y, g.aim, t);
      // Otto and Aubrey watch from the floor
      drawCritter('Otto the Otter', 150, 528, 0.62, 1);
      drawAubrey(60, 534, g.cheer > 0 ? 'twirl' : 'idle_front', 1, g.cheer > 0 ? Math.sin(g.cheer * Math.PI) * 14 : 0, 0.5);
      // the order of the colours, always the same
      const lx = 752, ly = 484;
      darkPanel(lx - 12, ly - 14, 208, 56, 18);
      text('Rainbow order', lx + 92, ly - 1, 13, '#fff', 'center', 700);
      RP_COLS.forEach(([, col], i) => inkCircle(lx + 12 + i * 32, ly + 24, 10, col, 1.2));
    },
  };

  restage('crystalcreek', {
    games: [['rainbowprism', 'crystal', {}], ['colourmix', 'shell', {}]],
    intro: [
      'N:Shh! The creek crystals are fast asleep in my grotto. Only rainbow light can wake them up!',
      'A:surprised:But the sunshine looks white, not rainbow!',
      "N:White sunlight is ALL the colours mixed together. My crystal prism splits it into a rainbow: red, orange, yellow, green, blue and purple!",
      'A:determined:Then I\'ll turn the prism and shine the right colour on every crystal!',
    ],
  });
}
