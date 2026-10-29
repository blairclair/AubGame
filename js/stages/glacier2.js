'use strict';
// Aurora Glacier, game 2: Penguin Sled Race. Aubrey sleds down a snowy hill against penguins
// tobogganing on their bellies, with a little true sled science along the way.
{
  // the hill: 4 lanes running down-right. A lane's y is where a sled touches the snow.
  const SR = { L0: 202, LH: 60, SL: 0.11, AX: 250, BASE: 250, N: 4 };
  const TILT = Math.atan(SR.SL);
  const laneY = (l, sx) => SR.L0 + l * SR.LH + sx * SR.SL;
  const edgeY = sx => SR.L0 - 46 + sx * SR.SL;
  const ORD = ['1st', '2nd', '3rd', '4th'];
  const ORD_SAY = ['first', 'second', 'third', 'fourth'];
  const HAZ = { rock: 1, snowman: 1 };

  // --- art -----------------------------------------------------------------------------
  // a penguin tobogganing on its belly, facing right; (x, y) is where its belly touches the snow
  const pengBelly = (x, y, s, t, o = {}) => {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(40,70,130,.2)'; ellipse(0, 3 + (o.z || 0), 40 * s * (1 - (o.z || 0) / 260), 6);
    ctx.rotate(TILT + (o.rot || 0)); ctx.scale(s, s);
    const fl = o.paddle ? Math.sin(t * 20) * 0.55 : Math.sin(t * 3) * 0.06;
    // orange feet trailing behind
    inkEllipse(-35, -7, 9, 4, 0.35, '#ffa22a', 1.1); inkEllipse(-34, -2, 9, 4, -0.1, '#ffa22a', 1.1);
    // far flipper, behind the body
    ctx.save(); ctx.translate(2, -16); ctx.rotate(-0.3 - fl * 0.7); inkEllipse(-13, 0, 15, 4.5, 0, '#1e1e3a', 1.1); ctx.restore();
    // body and head as one shape
    const p = new Path2D();
    p.ellipse(0, -12, 32, 13, 0, 0, Math.PI * 2);
    p.moveTo(39, -19); p.arc(27, -19, 12, 0, Math.PI * 2);
    ink(p, '#2a2a4a', 1.6);
    ctx.fillStyle = '#ffffff'; ellipse(3, -5, 27, 6.2);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ellipse(-4, -19, 18, 4);
    // face
    ctx.fillStyle = '#ffffff'; ellipse(31, -18, 7.5, 7);
    ctx.fillStyle = '#1a1a2a'; circle(32.5, -20, 2.7); ctx.fillStyle = '#fff'; circle(33.4, -21, 1);
    ctx.fillStyle = 'rgba(255,130,170,.6)'; circle(28.5, -13.5, 2.6);
    ink(P2('M37,-19 L48,-15.5 L37,-12 Z'), '#ffa22a', 1);
    if (o.scarf) {
      // Pengu: pink earmuffs and his red scarf flapping in the wind
      ctx.strokeStyle = '#ff6fae'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(26, -19, 12.5, Math.PI * 1.1, Math.PI * 1.75); ctx.stroke();
      inkCircle(17, -23, 4.5, '#ffb8dc', 1);
      const fw = Math.sin(t * 14) * 4;
      ink(P2(`M17,-14 C8,${-20 + fw} -4,${-16 - fw} -14,${-22 + fw} L-12,${-15 + fw} C-2,${-9 - fw} 8,${-10 + fw} 17,-8 Z`), '#ff3f6a', 1.1);
      inkRect(14, -17, 9, 12, '#ff3f6a', 2, 3);
      ctx.fillStyle = '#ffd0dc'; ctx.fillRect(15.5, -14, 6, 2); ctx.fillRect(15.5, -10, 6, 2);
    }
    // near flipper, stretched back (and paddling now and then)
    ctx.save(); ctx.translate(6, -11); ctx.rotate(-0.12 + fl); inkEllipse(-14, 0, 17, 5, 0, '#1e1e3a', 1.2); ctx.restore();
    ctx.restore();
  };
  // a standing penguin (the look from Ice Floe Hop), cheering with its flippers up
  const pengStand = (x, y, s, t, scarf = false, dir = 1, cheer = true) => {
    const hop = cheer ? Math.abs(Math.sin(t * 7)) * 6 : 0, wave = cheer ? Math.sin(t * 12) * 0.35 : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    ctx.fillStyle = 'rgba(30,40,80,.2)'; ellipse(0, 2, 22, 6);
    ctx.translate(0, -hop);
    inkEllipse(-10, -2, 9, 5, 0, '#ffa22a', 1.2); inkEllipse(10, -2, 9, 5, 0, '#ffa22a', 1.2);
    inkEllipse(-24, -44, 6, 16, -0.9 - wave, '#2a2a4a', 1.2); inkEllipse(24, -44, 6, 16, 0.9 + wave, '#2a2a4a', 1.2);
    inkEllipse(0, -30, 22, 30, 0, '#2a2a4a', 1.6);
    ctx.fillStyle = '#ffffff'; ellipse(0, -24, 15, 22);
    ctx.fillStyle = '#fff'; circle(-7, -44, 6); circle(7, -44, 6);
    ctx.fillStyle = '#1a1a2a'; circle(-6, -44, 3); circle(8, -44, 3);
    ink(P2(cheer ? 'M-6,-38 L6,-38 L0,-28 Z' : 'M-6,-38 L6,-38 L0,-30 Z'), '#ffa22a', 1);
    ctx.fillStyle = 'rgba(255,130,170,.5)'; circle(-12, -36, 3); circle(12, -36, 3);
    if (scarf) { inkRect(-18, -30, 36, 8, '#ff3f6a', 1.2, 4); inkRect(8, -26, 8, 16, '#ff3f6a', 1.2, 3); }
    ctx.restore();
  };
  const pine = (x, by, h) => {
    inkRect(x - 4, by - h * 0.22, 8, h * 0.24, '#7a4f2e', 1.5, 2);
    for (let i = 0; i < 3; i++) {
      const w = h * (0.42 - i * 0.1), y0 = by - h * 0.18 - i * h * 0.24;
      ink(P2(`M${x - w},${y0} L${x},${y0 - h * 0.42} L${x + w},${y0} Z`), ['#2f7a5a', '#358a62', '#3f9a6c'][i], 1.4);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(x - w * 0.55, y0 - h * 0.2); ctx.lineTo(x, y0 - h * 0.42); ctx.lineTo(x + w * 0.55, y0 - h * 0.2);
      ctx.quadraticCurveTo(x + w * 0.2, y0 - h * 0.15, x, y0 - h * 0.22); ctx.quadraticCurveTo(x - w * 0.2, y0 - h * 0.15, x - w * 0.55, y0 - h * 0.2); ctx.fill();
    }
  };
  const rock = (x, y) => {
    ink(P2(`M${x - 18},${y + 2} C${x - 22},${y - 12} ${x - 10},${y - 24} ${x + 2},${y - 22} C${x + 16},${y - 22} ${x + 22},${y - 8} ${x + 18},${y + 2} Z`), '#8a93a8', 1.6);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(x - 6, y - 14, 7, 4, -0.4);
    ink(P2(`M${x - 12},${y - 18} C${x - 6},${y - 26} ${x + 8},${y - 26} ${x + 12},${y - 18} C${x + 4},${y - 14} ${x - 6},${y - 15} ${x - 12},${y - 18} Z`), '#ffffff', 1);
  };
  const snowman = (x, y, t, wob = 0) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 22) * 0.12 * wob);
    ctx.strokeStyle = OL; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-8, -26); ctx.lineTo(-22, -36); ctx.moveTo(8, -26); ctx.lineTo(22, -38); ctx.stroke();
    const p = new Path2D(); p.arc(0, -13, 14, 0, Math.PI * 2); p.moveTo(10, -34); p.arc(0, -34, 10, 0, Math.PI * 2);
    ink(p, '#ffffff', 1.5);
    ctx.fillStyle = 'rgba(150,190,235,.35)'; ellipse(4, -9, 9, 7); ellipse(3, -31, 6, 5);
    ctx.fillStyle = '#2a2a3a'; circle(-3.5, -36, 1.6); circle(3.5, -36, 1.6); circle(0, -17, 1.6); circle(0, -10, 1.6);
    ink(P2('M0,-33 L11,-31 L0,-29.5 Z'), '#ff8a2a', 0.8);
    inkRect(-8, -48, 16, 6, '#3a3a5a', 1.5, 2); inkRect(-11, -43, 22, 3.5, '#3a3a5a', 1.5, 2);
    ctx.fillStyle = '#ff3f6a'; ctx.fillRect(-7.5, -45, 15, 2);
    ctx.restore();
  };
  const ramp = (x, y) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(TILT);
    ink(P2('M-36,3 C-10,2 10,-6 22,-20 L26,-20 L26,3 Z'), '#e4f2ff', 1.8);
    ctx.fillStyle = 'rgba(120,170,230,.45)'; ctx.fill(P2('M22,-20 L26,-20 L26,3 L18,3 Z'));
    ctx.strokeStyle = '#5fb8ff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const k of [-16, -2]) { ctx.beginPath(); ctx.moveTo(k - 4, -2 - (k + 20) * 0.1); ctx.lineTo(k + 2, -7 - (k + 20) * 0.25); ctx.lineTo(k - 4, -12 - (k + 20) * 0.4); ctx.stroke(); }
    ctx.restore();
  };
  // a band along a lane, from sx0 to sx1 (shiny ice or a fluffy snowdrift)
  const band = (sx0, sx1, l, kind, t) => {
    const a = laneY(l, sx0), b = laneY(l, sx1);
    if (kind === 'ice') {
      const p = P2(`M${sx0 + 10},${a - 15} L${sx1 - 6},${b - 15} Q${sx1 + 6},${b} ${sx1 - 6},${b + 15} L${sx0 + 10},${a + 15} Q${sx0 - 4},${a} ${sx0 + 10},${a - 15} Z`);
      const gr = ctx.createLinearGradient(0, a - 15, 0, a + 15);
      gr.addColorStop(0, '#bfeaff'); gr.addColorStop(1, '#7cc8f4');
      ctx.fillStyle = gr; ctx.fill(p);
      ctx.strokeStyle = 'rgba(70,140,210,.7)'; ctx.lineWidth = 2; ctx.stroke(p);
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (let x = sx0 + 26; x < sx1 - 20; x += 46) { const y = laneY(l, x); ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 18, y - 9); ctx.stroke(); }
      for (let x = sx0 + 40, i = 0; x < sx1 - 20; x += 70, i++) star(x, laneY(l, x) + 5, 4 + 2 * Math.max(0, Math.sin(t * 4 + i)), '#ffffff', 4);
    } else {
      // fluffy drift: soft lumps
      for (let x = sx0 + 6, i = 0; x <= sx1; x += 15, i++) {
        const y = laneY(l, x), r = 11 + (i % 3) * 3;
        inkCircle(x, y - 2, r, '#ffffff', 1, 'rgba(110,150,210,.8)');
      }
      for (let x = sx0 + 6, i = 0; x <= sx1; x += 15, i++) { ctx.fillStyle = 'rgba(160,195,240,.35)'; ellipse(x + 3, laneY(l, x) + 4, 10, 4); }
    }
  };
  // Aubrey on her wooden sled, facing right. (x, y) is where the runners touch the snow.
  const aubSled = (x, y, r, t) => {
    ctx.fillStyle = 'rgba(40,70,130,.22)'; ellipse(x, y + 3 + r.z, 52 * (1 - r.z / 260), 6);
    ctx.save(); ctx.translate(x, y); ctx.rotate(TILT + (r.wob > 0 ? Math.sin(t * 28) * 0.1 * r.wob : 0) - (r.z > 0 ? 0.08 : 0));
    // runners with a curl at the front
    const run = P2('M-52,0 L34,0 C50,0 56,-8 53,-18 C50,-27 41,-25 43,-17');
    ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.stroke(run);
    ctx.strokeStyle = '#d6404a'; ctx.lineWidth = 3; ctx.stroke(run);
    ctx.strokeStyle = OL; ctx.lineWidth = 3;
    for (const sx of [-40, -12, 18]) { ctx.beginPath(); ctx.moveTo(sx, -1); ctx.lineTo(sx, -7); ctx.stroke(); }
    // deck and back board
    inkRect(-54, -13, 92, 8, '#d7924f', 2, 3);
    inkRect(-56, -27, 8, 20, '#c7803f', 2, 3);
    // Aubrey
    if (r.tuck) {
      // tucked in small: her crouch, leaning forward
      const im = IMG.crouch, sc = 0.52;
      ctx.save(); ctx.translate(-10, -6); ctx.rotate(0.2);
      ctx.drawImage(im, -im.width * sc / 2, -im.height * sc, im.width * sc, im.height * sc);
      ctx.restore();
    } else {
      // sitting up tall: the top of her standing picture
      const im = IMG.idle_front, sc = 0.56, ch = 128;
      ctx.drawImage(im, 0, 0, im.width, ch, -10 - im.width * sc / 2, -6 - ch * sc, im.width * sc, ch * sc);
    }
    // front side board, over her lap
    ink(P2('M-36,-9 L38,-9 C46,-9 50,-14 50,-24 L44,-24 C42,-20 40,-19 36,-19 L-36,-19 Z'), '#c9823f', 1.6);
    ctx.strokeStyle = 'rgba(110,60,20,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-34, -14); ctx.lineTo(36, -14); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; circle(-28, -14, 1.8); circle(30, -14, 1.8);
    // the rope from the front curl to her hands
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(48, -24);
    if (r.tuck) ctx.quadraticCurveTo(32, -30, 14, -26); else ctx.quadraticCurveTo(30, -34, 6, -22);
    ctx.stroke();
    ctx.restore();
    // wind lines when tucked and zooming
    if (r.tuck && r.v > SR.BASE * 1.05 && !r.fin) {
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const k = (t * 3 + i / 3) % 1, lx = x - 70 - k * 60, ly = y - 20 - i * 14 - r.z;
        ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + 34, ly + 4); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  };
  const flag = (x, y, col, t, h = 64) => {
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
    ctx.strokeStyle = '#f4f4ff'; ctx.lineWidth = 2; ctx.stroke();
    const w = Math.sin(t * 8 + x) * 4;
    ink(P2(`M${x},${y - h} C${x + 12},${y - h - 4 + w} ${x + 22},${y - h + 4 - w} ${x + 34},${y - h + w} L${x + 34},${y - h + 22 + w} C${x + 22},${y - h + 26 - w} ${x + 12},${y - h + 18 + w} ${x},${y - h + 22} Z`), col, 1.2);
  };

  // --- course and racers ---------------------------------------------------------------
  const buildCourse = g => {
    const T = g.tier, ents = [], step = [340, 310, 285][T - 1];
    for (let d = 620; d < g.len - 320; d += step * rand(0.85, 1.15)) {
      const lanes = shuffle([0, 1, 2, 3]);
      const nh = T === 1 ? 1 : Math.random() < [0, 0.3, 0.6][T - 1] ? 2 : 1;
      lanes.forEach((l, i) => {
        const dd = d + rand(-30, 30);
        if (i < nh) {
          const k = pick(T === 1 ? ['rock', 'snowman', 'drift', 'drift'] : ['rock', 'snowman', 'drift']);
          if (k === 'drift') ents.push({ k, l, d: dd - 40, len: rand(110, 150) });
          else ents.push({ k, l, d: dd });
        } else if (i === nh || Math.random() < 0.45) {
          const k = pick(['ice', 'ice', 'ramp', 'fish', 'fish']);
          if (k === 'ice') { ents.push({ k, l, d: dd - 90, len: rand(170, Math.min(250, step - 80)) }); if (Math.random() < 0.5) ents.push({ k: 'fish', l, d: dd }); }
          else if (k === 'ramp') { ents.push({ k, l, d: dd - 60 }); ents.push({ k: Math.random() < 0.5 ? 'rock' : 'fish', l, d: dd + 70, air: true }); }
          else ents.push({ k, l, d: dd });
        }
      });
    }
    return ents.sort((a, b) => a.d - b.d);
  };
  const racerAt = (r, e) => Math.abs(r.lane - e.l) < 0.45;
  // terrain and bumps for one racer, this frame
  const ride = (g, r, dt) => {
    let terr = 1, onIce = false, inDrift = false;
    if (r.z <= 0) for (const e of g.ents) {
      if (e.d > r.d + 1) break;
      if ((e.k === 'ice' || e.k === 'drift') && r.d <= e.d + e.len && racerAt(r, e)) { if (e.k === 'ice') onIce = true; else inDrift = true; }
    }
    if (onIce) terr = 1.5;
    if (inDrift) terr = 0.5;
    r.onIce = onIce; r.inDrift = inDrift;
    let vt = SR.BASE * terr * r.pace * (r.tuck ? 1.3 : 1) * (r.paddleT > 0 ? 1.12 : 1);
    if (r.fin) vt = 0;
    const k = r.fin ? 1.4 : inDrift ? 4 : vt > r.v ? 1.6 : 1.2;
    r.v += (vt - r.v) * Math.min(1, dt * k);
    if (!r.fin) r.v = Math.max(r.v, 90);
    r.pd = r.d; r.d += r.v * dt;
    // in the air from a ramp
    if (r.z > 0 || r.vz > 0) { r.vz -= 1000 * dt; r.z = Math.max(0, r.z + r.vz * dt); if (r.z === 0) { r.vz = 0; if (r.me) { SFX.step(); burst(SR.AX + (r.d - g.cam), laneY(r.lane, SR.AX) + 2, 8, { colors: ['#ffffff', '#d8ecff'], up: 40, spread: 90 }); } } }
    r.wob = Math.max(0, r.wob - dt * 1.4); r.paddleT = Math.max(0, r.paddleT - dt);
    // things crossed this frame
    for (const e of g.ents) {
      if (e.d > r.d) break;
      if (e.d <= r.pd || !racerAt(r, e)) continue;
      if (e.k === 'ramp' && r.z <= 0) {
        r.vz = 340; r.z = 0.01;
        if (r.me) { SFX.jump(); tone(600, 0.35, 'sine', 0.06, 0.05, 1200); floatText(SR.AX + 10, laneY(r.lane, SR.AX) - 110, 'Whee!', '#ff6fb5', false, 30); g.jumps++; }
      } else if (HAZ[e.k] && r.z < 14) {
        r.v *= 0.5; r.wob = 1; e.wob = 1;
        if (r.me) { g.bumps++; SFX.miss(); floatText(SR.AX, laneY(r.lane, SR.AX) - 100, 'Bump!', '#5a8ad8', false, 24); if (!g.saidBump) { g.saidBump = true; speak('Bump! Steer around the rocks and snowmen.'); } }
      } else if (e.k === 'fish' && r.me && !e.got) {
        e.got = true; g.fish++; SFX.pop(); burst(SR.AX, laneY(r.lane, SR.AX) - 30 - r.z, 10);
        floatText(SR.AX, laneY(r.lane, SR.AX) - 90 - r.z, '+🐟', '#ff8a2a', false, 24);
      }
    }
    if (r.me && !r.fin) {
      if (onIce && !g.saidIce) { g.saidIce = true; speak('Shiny ice is slippery and smooth, so you zoom!'); }
      if (inDrift && !g.saidDrift) { g.saidDrift = true; speak('Fluffy snow rubs on your sled and slows you down.'); }
    }
  };
  // a penguin picks a lane: dodge what's ahead (if it notices) and look for ice and ramps
  const think = (g, p) => {
    p.thinkT = rand(0.25, 0.45);
    if (p.fin) return;
    if (Math.random() > g.dodge) { if (Math.random() < 0.12) p.tl = clamp(p.tl + pick([-1, 1]), 0, SR.N - 1); return; }
    const look = 300, val = l => {
      let s = 0;
      for (const e of g.ents) {
        if (e.d + (e.len || 0) < p.d || e.d > p.d + look || Math.abs(e.l - l) > 0.4) continue;
        const near = 1 - Math.max(0, e.d - p.d) / look * 0.5;
        s += (HAZ[e.k] ? -10 : e.k === 'drift' ? -5 : e.k === 'ice' ? 3 : e.k === 'ramp' ? 2 : 0) * near;
      }
      return s;
    };
    let best = p.tl, bv = val(p.tl) + 0.5;
    for (const l of [p.tl - 1, p.tl + 1]) if (l >= 0 && l < SR.N) { const v = val(l); if (v > bv) { bv = v; best = l; } }
    p.tl = best;
  };
  const steer = (g, dir) => {
    const a = g.aub, n = clamp(a.tl + dir, 0, SR.N - 1);
    if (n !== a.tl) { a.tl = n; SFX.blip(); }
  };
  const QUIZ = [
    { q: 'Which is faster to slide on?', a: [['🧊', 'Shiny ice'], ['☁️', 'Fluffy snow']], ok: 0, fact: 'Smooth ice is slippery, so it rubs less. Fluffy snow rubs more and slows you down. That rubbing is called friction.' },
    { q: 'How do you go fastest on a sled?', a: [['🧍', 'Sit up tall'], ['💨', 'Tuck in small']], ok: 1, fact: 'When you tuck in small, less air pushes on you, so you go faster!' },
    { q: 'Penguins slide on their bellies. What is it called?', a: [['🛷', 'Tobogganing'], ['🏊', 'Swimming']], ok: 0, fact: 'Penguins really do slide on their bellies over the snow. It is called tobogganing!' },
  ];
  const FACTS = [['🧊', 'Smooth ice is slippery and fast. Fluffy snow rubs more and slows you down.'],
    ['💨', 'Tucking in small is faster: less air pushes on you.'],
    ['🐧', 'Penguins really slide on their bellies. It is called tobogganing!']];

  MG.sledrace = {
    kind: 'learn', title: () => 'Penguin Sled Race', icon: () => '🛷',
    how: () => 'Race the penguins down the snowy hill! Up and down steer your sled. Hold space to tuck in small and go faster. Zoom on shiny ice, skip the fluffy snow, and jump the ramps!',
    init(g) {
      const T = g.tier;
      const pens = [{ name: 'Pengu', scarf: true, lane: 2 }, { name: 'Pip', lane: 0 }, { name: 'Waddles', lane: 3 }].slice(0, T === 1 ? 2 : 3);
      Object.assign(g, {
        len: [3800, 5000, 6400][T - 1], dodge: [0.3, 0.55, 0.75][T - 1],
        st: 'count', stT: 0, cam: 0, bumps: 0, fish: 0, jumps: 0, order: [], after: 0, quizI: (T - 1) % 3, picked: null,
      });
      g.ents = buildCourse(g);
      g.fishTotal = g.ents.filter(e => e.k === 'fish').length;
      const mk = (lane, pace, extra) => ({ lane, tl: lane, d: 0, pd: 0, v: 0, z: 0, vz: 0, wob: 0, paddleT: 0, pace, tuck: false, fin: 0, thinkT: rand(0.2, 0.6), ...extra });
      g.aub = mk(1, 1, { me: true });
      g.pens = pens.map((p, i) => mk(p.lane, [0.9, 1.03, 1.1][T - 1] * [1, 0.97, 1.02][i], { name: p.name, scarf: !!p.scarf, ph: i * 1.7 }));
      g.racers = [g.aub, ...g.pens];
      g.say = 'Up and down to steer. Hold space to tuck in and go faster!';
      g.progress = 'Get ready...';
    },
    start(g) { speak('Ready... set...'); },
    place(g) { return 1 + g.pens.filter(p => (p.fin && (!g.aub.fin || p.fin < g.aub.fin)) || (!p.fin && !g.aub.fin && p.d > g.aub.d)).length; },
    finishScore(g) {
      const pl = g.aub.fin || this.place(g);
      return [0.82, 0.62, 0.48, 0.36][pl - 1] + [0.13, 0.09, 0.05, 0.02, 0][Math.min(g.bumps, 4)] + (g.fishTotal ? 0.05 * g.fish / g.fishTotal : 0.05);
    },
    update(g, dt, id) {
      g.stT += dt;
      const a = g.aub;
      if (g.st === 'count') {
        if (g.stT >= 2.4) { g.st = 'race'; g.stT = 0; speak('Go!'); tone(880, 0.4, 'triangle', 0.08); }
        else if (Math.floor(g.stT / 0.8) !== Math.floor((g.stT - dt) / 0.8)) tone(520, 0.15, 'triangle', 0.07);
        return;
      }
      if (g.st === 'race') {
        // steering and tucking
        if (pressed.arrowup || pressed.w || id === 'sr:up') steer(g, -1);
        if (pressed.arrowdown || pressed.s || id === 'sr:dn') steer(g, 1);
        if (pointer.clicked && !id && !this.inTuck() && pointer.y > 100) {
          const ay = laneY(a.lane, SR.AX) - 30;
          if (pointer.y < ay - 30) steer(g, -1); else if (pointer.y > ay + 30) steer(g, 1);
        }
        a.tuck = !a.fin && (keys[' '] || keys.arrowright || keys.d || (pointer.down && this.inTuck()));
        if (a.tuck && !g.saidTuck) { g.saidTuck = true; speak('Tuck in small! Less air pushes on you, so you go faster.'); }
        if (!g.saidPeng && g.stT > 5) { g.saidPeng = true; speak('Look! Penguins slide on their bellies. That is called tobogganing!'); }
        for (const p of g.pens) {
          if ((p.thinkT -= dt) <= 0) think(g, p);
          if (!p.fin && p.paddleT <= 0 && Math.random() < dt * 0.35) p.paddleT = 0.7;
          // tier 1 penguins ease off when they get far ahead
          if (g.tier === 1 && !p.fin && p.d > a.d + 260) p.v *= 1 - dt * 0.6;
        }
        for (const r of g.racers) {
          r.lane += clamp(r.tl - r.lane, -dt * 6, dt * 6);
          ride(g, r, dt);
          if (!r.fin && r.d >= g.len) {
            r.fin = g.order.length + 1; g.order.push(r);
            if (r.me) {
              SFX.fanfare(); burst(SR.AX + 40, 240, 30);
              speak(r.fin === 1 ? 'You came in first! Hooray!' : `You came in ${ORD_SAY[r.fin - 1]}! Great racing!`);
            }
          }
        }
        g.cam = Math.min(a.d, g.len - 80);
        const pl = this.place(g);
        g.progress = `${ORD[pl - 1]} place   🐟 ${g.fish}`;
        g.score = this.finishScore(g);
        if (a.fin) {
          g.after += dt;
          if (g.after > 2.6 && (g.racers.every(r => r.fin) || g.after > 4.5)) { g.st = 'finish'; g.stT = 0; }
        }
        return;
      }
      // keep everyone sliding to a stop behind the line
      for (const r of g.racers) { r.lane += clamp(r.tl - r.lane, -dt * 6, dt * 6); ride(g, r, dt); }
      if (g.st === 'finish') {
        if (id === 'sr:next' || g.stT > 5) { g.st = 'quiz'; g.stT = 0; speak(`Sled science! ${QUIZ[g.quizI].q}`); g.say = QUIZ[g.quizI].q; }
      } else if (g.st === 'quiz') {
        const m = /^sq:(\d)$/.exec(id || '');
        if (m) {
          const q = QUIZ[g.quizI], i = +m[1];
          g.picked = i; g.st = 'answered'; g.stT = 0;
          if (i === q.ok) { SFX.sparkle(); burst(W / 2, 400, 20); speak(`Yes! ${q.fact}`); }
          else { SFX.miss(); g.score = Math.max(0, g.score - 0.08); speak(`It's ${q.a[q.ok][1]}! ${q.fact}`); }
        }
      } else if (g.st === 'answered' && g.stT > 3.2) g.done = true;
    },
    tuckRect: { x: 172, y: 468, w: 150, h: 58 },
    inTuck() { const b = this.tuckRect; return pointer.x > b.x && pointer.x < b.x + b.w && pointer.y > b.y && pointer.y < b.y + b.h; },
    draw(g) {
      const t = S.t, cam = g.cam, sxOf = d => SR.AX + (d - cam);
      // --- the scene: sky, far mountains, the hill
      const sky = ctx.createLinearGradient(0, 0, 0, 300);
      sky.addColorStop(0, '#3d6fc4'); sky.addColorStop(0.55, '#8cc8f4'); sky.addColorStop(1, '#e4f4ff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      for (const [c, ph, y0] of [['95,255,176', 0, 92], ['255,122,216', 2, 116], ['168,136,255', 4, 104]]) {
        ctx.fillStyle = `rgba(${c},.16)`; ctx.beginPath(); ctx.moveTo(0, y0);
        for (let x = 0; x <= W; x += 24) ctx.lineTo(x, y0 + Math.sin(x * 0.008 + t * 0.4 + ph) * 18);
        for (let x = W; x >= 0; x -= 24) ctx.lineTo(x, y0 + 26 + Math.sin(x * 0.011 + t * 0.5 + ph) * 14);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      for (let i = 0; i < 5; i++) { const x = ((i * 230 - cam * 0.03 + t * 6) % 1150 + 1150) % 1150 - 100; ellipse(x, 120 + (i % 2) * 22, 46, 11); ellipse(x + 26, 113 + (i % 2) * 22, 26, 11); }
      const mtn = (par, base, amp, col, cap) => {
        const o = cam * par;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
        const pts = [];
        for (let x = 0; x <= W; x += 10) { const u = x + o, y = base - Math.abs(Math.sin(u * 0.006)) * amp - Math.sin(u * 0.021) * amp * 0.18 + x * SR.SL * 0.6; pts.push([x, y]); ctx.lineTo(x, y); }
        ctx.lineTo(W, H); ctx.fill();
        if (cap) { ctx.fillStyle = cap; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], Math.max(pts[i][1], base - amp * 0.62 + pts[i][0] * SR.SL * 0.6)); ctx.fill(); }
      };
      mtn(0.06, 214, 110, '#9cbfe6', '#f4faff');
      mtn(0.16, 236, 60, '#c4dcf4', null);
      // the snowy hill
      const hill = ctx.createLinearGradient(0, 160, 0, H);
      hill.addColorStop(0, '#ffffff'); hill.addColorStop(1, '#d4e8f8');
      ctx.fillStyle = hill; ctx.beginPath(); ctx.moveTo(0, edgeY(0)); ctx.lineTo(W, edgeY(W)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.strokeStyle = 'rgba(110,150,210,.55)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, edgeY(0)); ctx.lineTo(W, edgeY(W)); ctx.stroke();
      // trees and spectators along the top edge
      for (let k = Math.floor((cam - 400) / 190); k < (cam + W) / 190 + 1; k++) {
        const sx = SR.AX + (k * 190 + 40 - cam);
        if (sx < -60 || sx > W + 60) continue;
        if (k % 5 === 2) pengStand(sx, edgeY(sx) + 8, 0.42, t + k, false, k % 2 ? 1 : -1, true);
        else pine(sx + (k % 3) * 12, edgeY(sx) + 6, 70 + (k * 37 % 40));
      }
      // lane grooves and sparkles
      ctx.strokeStyle = 'rgba(150,185,230,.4)'; ctx.lineWidth = 2; ctx.setLineDash([26, 22]); ctx.lineDashOffset = cam;
      for (let l = 0; l < SR.N - 1; l++) { ctx.beginPath(); ctx.moveTo(0, laneY(l + 0.5, 0) + 4); ctx.lineTo(W, laneY(l + 0.5, W) + 4); ctx.stroke(); }
      ctx.setLineDash([]);
      for (let i = 0; i < 26; i++) { const x = ((i * 157 - cam) % 1000 + 1000) % 1000 - 20; star(x, laneY((i * 7 % 17) / 4.2, x) + 10, 2.5 + (i % 2) * 1.5, `rgba(255,255,255,${Math.max(0, Math.sin(t * 2 + i))})`, 4); }
      // slalom poles along the bottom edge
      for (let k = Math.floor((cam - 300) / 300); k < (cam + W) / 300 + 1; k++) {
        const sx = SR.AX + (k * 300 + 120 - cam); if (sx < -20 || sx > W + 20) continue;
        const y = laneY(3.75, sx);
        ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx, y - 34); ctx.stroke();
        ctx.strokeStyle = k % 2 ? '#ff5f7a' : '#4f9aff'; ctx.lineWidth = 2.5; ctx.stroke();
        ink(P2(`M${sx},${y - 34} L${sx + 16},${y - 28} L${sx},${y - 22} Z`), k % 2 ? '#ff5f7a' : '#4f9aff', 1);
      }
      // start line
      const s0 = sxOf(0);
      if (s0 > -30) { ctx.fillStyle = 'rgba(255,95,160,.75)'; ctx.beginPath(); ctx.moveTo(s0 - 3, laneY(-0.5, s0)); ctx.lineTo(s0 + 3, laneY(-0.5, s0)); ctx.lineTo(s0 + 3, laneY(3.5, s0)); ctx.lineTo(s0 - 3, laneY(3.5, s0)); ctx.fill(); }
      // patches on the ground
      for (const e of g.ents) {
        if (e.k !== 'ice' && e.k !== 'drift') continue;
        const a = sxOf(e.d), b = a + e.len;
        if (b < -40 || a > W + 40) continue;
        if (e.k === 'ice') band(a, b, e.l, 'ice', t);
      }
      // finish line: checkers across the lanes
      const fx = sxOf(g.len);
      if (fx > -40 && fx < W + 60) {
        const y0 = laneY(-0.5, fx), y1 = laneY(3.5, fx);
        for (let y = y0, i = 0; y < y1; y += 12, i++) for (let c = 0; c < 2; c++) { ctx.fillStyle = (i + c) % 2 ? '#2a2a4a' : '#ffffff'; ctx.fillRect(fx - 12 + c * 12, y, 12, 12); }
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.strokeRect(fx - 12, y0, 24, y1 - y0);
      }
      // everything standing up, sorted so lower things draw in front
      const items = [];
      for (const e of g.ents) {
        const sx = sxOf(e.d);
        if (e.k === 'drift') { const b = sx + e.len; if (b > -40 && sx < W + 40) items.push({ y: laneY(e.l, sx) - 4, f: () => band(sx, b, e.l, 'drift', t) }); continue; }
        if (e.k === 'ice' || sx < -60 || sx > W + 60) continue;
        const y = laneY(e.l, sx);
        if (e.k === 'rock') items.push({ y, f: () => { ctx.save(); ctx.translate(e.wob > 0 ? Math.sin(t * 40) * 2 * e.wob : 0, 0); rock(sx, y); ctx.restore(); } });
        else if (e.k === 'snowman') items.push({ y, f: () => snowman(sx, y, t, e.wob || 0) });
        else if (e.k === 'ramp') items.push({ y: y - 6, f: () => ramp(sx, y) });
        else if (e.k === 'fish' && !e.got) items.push({ y, f: () => { const b = Math.sin(t * 4 + e.d) * 4; ctx.fillStyle = 'rgba(40,70,130,.15)'; ellipse(sx, y + 2, 12, 3); glowEmoji('🐟', sx, y - 26 + b - (e.air ? 30 : 0), 28, 'rgba(255,240,170,.7)'); } });
        if (e.wob) e.wob = Math.max(0, e.wob - 1 / 60);
      }
      for (const r of g.racers) {
        const sx = sxOf(r.d);
        if (sx < -80 || sx > W + 80) continue;
        const y = laneY(r.lane, sx);
        if (r.me) items.push({ y: y + 0.5, f: () => {
          if (r.onIce && r.z <= 0 && !r.fin) { star(sx - 50, y - 2, 5 + Math.sin(t * 20) * 2, '#ffffff', 4); }
          if (r.inDrift && !r.fin) { ctx.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 6; i++) circle(sx + 46 + Math.sin(t * 30 + i) * 8, y - 8 - ((t * 60 + i * 9) % 26), 3); }
          aubSled(sx, y - r.z, r, t);
        } });
        else items.push({ y, f: () => {
          pengBelly(sx, y - r.z, 0.9, t + r.ph, { scarf: r.scarf, paddle: r.paddleT > 0 && !r.fin, rot: (r.wob > 0 ? Math.sin(t * 28) * 0.12 * r.wob : 0) - (r.z > 0 ? 0.1 : 0), z: r.z });
          if (r.scarf) { const ly = y - r.z - 46; rrect(sx - 26, ly - 11, 52, 20, 10, 'rgba(255,255,255,.85)'); text('Pengu', sx, ly, 13, '#d63a6a', 'center', 800); }
        } });
      }
      items.sort((a, b) => a.y - b.y).forEach(it => it.f());
      // finish flags, banner and the cheering penguins
      if (fx > -80 && fx < W + 120) {
        const top = laneY(-0.55, fx), bot = laneY(3.6, fx);
        flag(fx, top, '#ff5f9a', t, 74); flag(fx, bot + 34, '#5fb8ff', t, 60);
        rrect(fx - 122, top - 66, 112, 32, 12, '#ffd84a', OL, 2.5);
        text('FINISH', fx - 66, top - 50, 19, '#7a3a10', 'center', 900);
        for (let i = 0; i < 4; i++) pengStand(fx + 60 + i * 34, edgeY(fx + 60 + i * 34) + 14 + (i % 2) * 6, 0.46, t + i * 0.8, false, i % 2 ? -1 : 1, true);
      }
      // falling snow
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 40; i++) { const x = ((i * 131 + Math.sin(t + i) * 20 - cam * 0.4) % W + W) % W, y = 64 + (t * 30 + i * 37) % (H - 64); circle(x, y, 1.5 + (i % 3) * 0.7); }

      // --- the race map
      darkPanel(236, 64, 488, 30, 15);
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(262, 79); ctx.lineTo(680, 79); ctx.stroke();
      emoji('🏁', 700, 79, 18);
      const mx = d => 262 + clamp(d / g.len, 0, 1) * 418;
      for (const p of g.pens) { const x = mx(p.d); ctx.save(); ctx.translate(x, 79); inkCircle(0, 0, 8, '#2a2a4a', 1); ctx.fillStyle = '#fff'; circle(1, 1, 5); ctx.fillStyle = '#ffa22a'; tri(-2, 2, 2, 2, 0, 5); if (p.scarf) { ctx.fillStyle = '#ff3f6a'; ctx.fillRect(-6, 5, 12, 3); } ctx.restore(); }
      { const x = mx(g.aub.d), im = IMG.face_happy; inkCircle(x, 79, 11, '#ff9ac0', 1); ctx.drawImage(im, x - 10, 69, 20, 20 * im.height / im.width); }

      // --- controls
      if (g.st === 'race' || g.st === 'count') {
        button('sr:up', 16, 468, 66, 58, '▲', { color: '#5fa8e8', size: 26 });
        button('sr:dn', 92, 468, 66, 58, '▼', { color: '#5fa8e8', size: 26 });
        const b = this.tuckRect, on = g.aub.tuck;
        rrect(b.x, b.y + (on ? 3 : 0), b.w, b.h, 18, on ? '#ff8ac0' : '#ff6fb5', OL, 2.5);
        text(on ? 'Tucked!' : 'Tuck', b.x + 64, b.y + 22 + (on ? 3 : 0), 20, '#fff', 'center', 800);
        text('hold space', b.x + 64, b.y + 42 + (on ? 3 : 0), 12, 'rgba(255,255,255,.9)', 'center', 600);
        emoji('💨', b.x + 128, b.y + 29, 22);
      }
      if (g.st === 'count') {
        const n = 3 - Math.floor(g.stT / 0.8);
        outlined(n > 0 ? String(n) : 'GO!', W / 2, 250, 90, '#ffd84a', 'center', '#fff');
      } else if (g.st === 'race' && g.stT < 0.7) outlined('GO!', W / 2, 250, 90 + g.stT * 30, '#5fd87a', 'center', '#fff');

      // --- the finish: medal
      if (g.st === 'finish') {
        const pl = g.aub.fin;
        ctx.fillStyle = 'rgba(240,248,255,.45)'; ctx.fillRect(0, 60, W, H - 60);
        panel(W / 2 - 230, 130, 460, 290, 24);
        const bounce = Math.abs(Math.sin(t * 4)) * 8;
        emoji(['🥇', '🥈', '🥉', '🎀'][pl - 1], W / 2, 200 - bounce, 84);
        outlined(pl === 1 ? '1st place! You won!' : `${ORD[pl - 1]} place!`, W / 2, 274, 32, '#ff6fb5', 'center', '#fff');
        text(`Bumps: ${g.bumps}     Fish: ${g.fish} 🐟     Jumps: ${g.jumps}`, W / 2, 314, 18, '#5a2a6e', 'center', 600);
        pengStand(W / 2 - 180, 410, 0.7, t, true, 1, true); pengStand(W / 2 + 180, 410, 0.7, t + 1, false, -1, true);
        button('sr:next', W / 2 - 110, 342, 220, 54, 'Sled Science ➜', { color: '#5fb87a', size: 20 });
      }
      // --- Sled Science card and question
      if (g.st === 'quiz' || g.st === 'answered') {
        const q = QUIZ[g.quizI];
        ctx.fillStyle = 'rgba(240,248,255,.45)'; ctx.fillRect(0, 60, W, H - 60);
        panel(W / 2 - 330, 104, 660, 420, 24);
        outlined('🛷 Sled Science', W / 2, 138, 28, '#4f8ae0', 'center', '#fff');
        FACTS.forEach(([ic, s], i) => {
          emoji(ic, W / 2 - 290, 180 + i * 38, 24);
          text(s, W / 2 - 266, 180 + i * 38, 16, '#5a2a6e', 'left', 600);
        });
        text(q.q, W / 2, 312, 21, '#d63a8a', 'center', 800);
        q.a.forEach(([ic, lab], i) => {
          const x = W / 2 - 250 + i * 260, picked = g.picked === i, right = g.st === 'answered' && i === q.ok;
          const col = g.st === 'answered' ? (right ? '#5fb87a' : picked ? '#e07a8a' : '#b9aac4') : ['#5fa8e8', '#9a6ae0'][i];
          button(`sq:${i}`, x, 340, 240, 110, '', { color: col, key: String(i + 1) });
          emoji(ic, x + 50, 395, 46);
          text(lab, x + 92, 395, 21, '#fff', 'left', 800);
        });
        if (g.st === 'answered') outlined(g.picked === q.ok ? 'Yes! Sled scientist!' : `It's ${q.a[q.ok][1]}!`, W / 2, 488, 26, g.picked === q.ok ? '#5fd87a' : '#ff8aa0', 'center', '#fff');
      }
    },
  };

  restage('glacier', {
    games: [['floehop', 'rainbow', {}], ['sledrace', 'crystal', {}]],
    mid: ["N:Waddle waddle! Race me down Slippy Hill! You ride the sled, and we slide on our tummies!",
      'N:Shiny ice is zoomy, fluffy snow is slow-y. Tuck in small to go fast. Brrr-eady?',
      'A:determined:Ready, set... whee!'],
  });
}
