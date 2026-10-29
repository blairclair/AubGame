'use strict';
// Stargazer Tower, game 2: Planet Detective. Each round the wizard's telescope beams Aubrey to a mystery
// planet. She walks around a wide side-scrolling world, checks the glowing clue spots (look at the sky,
// touch the ground, read her thermometer, count the moons, feel the wind, test her jump) and fills her
// Clue Notebook. Whenever she's ready she says "I know where I am!" and picks the planet card.
{
  const TAU = Math.PI * 2;
  const WW = 2200, FEET = 448, AS = 0.6, SPEED = 280;
  const hash = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
  const glow = (x, y, r, rgb, a) => {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const vgrad = (y0, y1, stops) => {
    const gr = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c));
    return gr;
  };
  // call fn(screenX, i) for repeated things spaced along the world at a parallax depth
  const each = (cam, par, sp, fn) => {
    const off = cam * par;
    for (let i = Math.floor(off / sp) - 1; i <= Math.floor((off + W) / sp) + 1; i++) fn(i * sp - off, i);
  };
  // a wobbly ridge line at a parallax depth, outlined
  const ridge = (cam, par, base, amp, f, col, ph = 0, lw = 2, line = OL) => {
    const off = cam * par, p = new Path2D();
    p.moveTo(-10, H + 10);
    for (let x = -10; x <= W + 20; x += 10) {
      const wx = x + off;
      p.lineTo(x, base - (Math.sin(wx * f + ph) * 0.55 + Math.sin(wx * f * 2.7 + ph * 1.3) * 0.3 + Math.sin(wx * f * 6.1 + ph) * 0.15 + 1) * amp / 2);
    }
    p.lineTo(W + 20, H + 10); p.closePath();
    if (lw) ink(p, col, lw, line); else { ctx.fillStyle = col; ctx.fill(p); }
  };
  const skyStars = (cam, n, maxY, a = 1) => {
    for (let i = 0; i < n; i++) {
      const x = ((hash(i, 1) * 1400 - cam * 0.03) % 1400 + 1400) % 1400 - 200, y = 64 + hash(i, 2) * (maxY - 64);
      star(x, y, 1.2 + hash(i, 3) * 2.4, `rgba(255,255,240,${a * (0.35 + 0.65 * Math.abs(Math.sin(S.t * (0.6 + hash(i, 4)) + i)))})`, 4);
    }
  };

  // --- Aubrey in her clear bubble helmet (as in moon2.js) -----------------------------------------
  const heads = {};
  function headOf(frame) {
    if (heads[frame]) return heads[frame];
    const im = IMG[frame], c = document.createElement('canvas');
    c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const rows = Math.round(im.height * (frame === 'crouch' ? 0.4 : frame === 'twirl' ? 0.3 : 0.25));
    const d = x.getImageData(0, 0, im.width, rows).data;
    let x0 = im.width, x1 = 0, y0 = rows;
    for (let y = 0; y < rows; y++) for (let i = 0; i < im.width; i++) if (d[(y * im.width + i) * 4 + 3] > 60) {
      x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, y);
    }
    const w = Math.min(x1 - x0, im.width * 0.6);
    return (heads[frame] = { dx: (x0 + x1) / 2 - im.width / 2, cy: y0 + (rows - y0) * 0.5, r: Math.max(w, rows - y0) * 0.5 });
  }
  function drawAstronaut(x, feet, frame, facing, lift, s) {
    drawAubrey(x, feet, frame, facing, lift, s);
    const im = IMG[frame], hd = headOf(frame), native = AUB_NATIVE[frame];
    const flip = native && facing && native !== Math.sign(facing) ? -1 : 1;
    const hx = x + hd.dx * s * flip, hy = feet - lift - im.height * s + hd.cy * s, r = hd.r * s * 1.12 + 3;
    ctx.fillStyle = 'rgba(190,225,255,.16)'; circle(hx, hy, r);
    ctx.strokeStyle = 'rgba(40,30,80,.55)'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(hx, hy, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(225,245,255,.95)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(hx, hy, r * 0.74, Math.PI * 1.08, Math.PI * 1.42); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.9)'; circle(hx + r * 0.5, hy - r * 0.5, 1.6);
    const ny = hy + r * 0.97;
    ctx.fillStyle = '#d9dce8'; ctx.strokeStyle = 'rgba(40,30,80,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(hx, ny, r * 0.42, 2, 0, 0, TAU); ctx.fill(); ctx.stroke();
    return { hx, hy, r };
  }

  // --- the planets and their clues ------------------------------------------------------------------
  // a clue: [action, notebook icon, notebook note, what Aubrey says]. Actions: look, touch, thermo, wind, jump.
  // Every fact is true (at a young child's level).
  const NOGAS = "There's no ground here, it's all gas! Good thing I have a magic raft.";
  const PL = {
    mercury: {
      name: 'Mercury', gas: false, jump: 150, temp: 'both', hint: ['huge Sun', 'craters'],
      clues: [
        ['look', '☀️', 'The Sun looks HUGE', 'The Sun looks HUGE here! This planet is the closest one to the Sun.'],
        ['touch', '🪨', 'Grey, full of craters', 'The ground is grey and full of craters, just like our Moon.'],
        ['look', '🚫', 'No moons at all', "I can't find any moons. This planet has no moons at all!"],
        ['thermo', '🌡️', 'Hot in sun, cold in shade', 'Boiling hot in the sunshine, freezing cold in the shade! There is almost no air to keep it cosy.'],
        ['jump', '🦘', 'Small planet, big jumps', 'Wheee! I can jump way higher than at home. This is a small planet.'],
      ],
    },
    venus: {
      name: 'Venus', gas: false, jump: 55, temp: 'hot', hint: ['yellow clouds', 'hottest'],
      clues: [
        ['look', '☁️', 'Thick yellow clouds', "Thick yellow clouds cover the whole sky. I can't even see the stars!"],
        ['thermo', '🔥', 'The HOTTEST planet', 'Phew! This is the hottest planet of all, even hotter than Mercury!'],
        ['look', '🔄', 'Sun rises in the west', 'The Sun is coming up in the west! This planet spins backwards.'],
        ['wind', '🌊', 'Super thick, heavy air', 'The air is so thick and heavy, it feels like being deep under the sea.'],
        ['look', '🚫', 'No moons', 'No moons here, not even one.'],
      ],
    },
    mars: {
      name: 'Mars', gas: false, jump: 150, temp: 'cold', hint: ['red dust', '2 tiny moons'],
      clues: [
        ['touch', '🟥', 'Red, rusty dust', "The ground is red and dusty. It's rusty, like an old bike!"],
        ['look', '🌙', 'Two tiny moons', 'Two teeny tiny moons! Their names are Phobos and Deimos.'],
        ['look', '🌋', 'Giant volcano', 'Look at that GIANT volcano! It is the biggest volcano on any planet.'],
        ['wind', '💨', 'Red dust storms', 'Whoosh, a dust storm! Red dust is blowing everywhere.'],
        ['jump', '🦘', 'Big bouncy jumps', 'Boing! I can jump really high here. This planet is smaller than Earth.'],
      ],
    },
    jupiter: {
      name: 'Jupiter', gas: true, jump: 16, temp: 'cold', hint: ['red spot storm', 'stripes'],
      clues: [
        ['touch', '☁️', 'No ground, all gas', NOGAS],
        ['look', '🌀', 'Great Red Spot storm', 'A giant red storm! It is called the Great Red Spot, and it is bigger than the whole Earth.'],
        ['look', '🌙', 'Lots and lots of moons', 'So many moons! This planet has lots and lots of them.'],
        ['look', '🦓', 'Biggest, with stripes', 'This is the BIGGEST planet of all, with stripy clouds.'],
        ['jump', '🦘', 'Super heavy, tiny jumps', 'Oof! I can hardly jump. This giant planet pulls really hard.'],
      ],
    },
    saturn: {
      name: 'Saturn', gas: true, jump: 60, temp: 'cold', hint: ['big rings', 'gold clouds'],
      clues: [
        ['look', '💍', 'Big bright rings', "Wow! Big bright rings go right across the sky. They're made of ice and rock."],
        ['touch', '☁️', 'No ground, all gas', NOGAS],
        ['look', '🛁', 'Could float in a bathtub', 'This planet is so light, it could float in a giant bathtub!'],
        ['look', '🟠', 'Moon with orange haze', 'Lots of moons! The biggest one, Titan, is wrapped in orange haze.'],
      ],
    },
    uranus: {
      name: 'Uranus', gas: true, jump: 55, temp: 'cold', hint: ['blue-green', 'on its side'],
      clues: [
        ['look', '🩵', 'Blue-green', 'Everything here is blue-green, like the sea!'],
        ['look', '↪️', 'Tipped on its side', 'This planet is tipped over on its side, so it rolls around the Sun like a ball!'],
        ['thermo', '🥶', 'Icy cold', 'Brrr! It is icy, icy cold here.'],
        ['touch', '☁️', 'No ground, all gas', NOGAS],
      ],
    },
    neptune: {
      name: 'Neptune', gas: true, jump: 60, temp: 'cold', hint: ['deep blue', 'windiest'],
      clues: [
        ['look', '🔵', 'Deep blue', 'Everything is a deep, deep blue!'],
        ['wind', '🌬️', 'The WINDIEST planet', 'Whoa! The wind here is the fastest of any planet!'],
        ['look', '⭐', 'Sun is a tiny star', 'The Sun looks like a tiny star. This planet is the farthest from the Sun.'],
        ['touch', '☁️', 'No ground, all gas', NOGAS],
        ['thermo', '🥶', 'Freezing cold', 'Brrr! It is freezing cold this far from the Sun.'],
      ],
    },
  };
  const ORDER = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
  const EASY = ['mars', 'jupiter', 'saturn'], HARD = ['mercury', 'venus', 'uranus', 'neptune'];
  const ACT_ICON = { look: '🔭', touch: '✋', thermo: '🌡️', wind: '💨', jump: '🦘' };
  const ACT_WORD = { look: 'Look', touch: 'Touch', thermo: 'Temp', wind: 'Feel', jump: 'Jump' };

  // --- planet portraits (for the cards and the reveal) --------------------------------------------
  function drawPlanet(k, x, y, R, t = S.t) {
    const r = k === 'saturn' ? R * 0.6 : R;
    const body = () => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); };
    const ring = (front) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.32);
      for (const [rx, col, lw] of [[r * 1.95, '#e8cf94', r * 0.22], [r * 1.6, '#f7e6b8', r * 0.26]]) {
        ctx.strokeStyle = OL; ctx.lineWidth = lw + 3; ctx.beginPath(); ctx.ellipse(0, 0, rx, rx * 0.26, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
      }
      ctx.restore();
    };
    if (k === 'saturn') ring(false);
    if (k === 'uranus') { ctx.strokeStyle = 'rgba(220,250,255,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, r * 0.35, r * 1.45, 0.1, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); }
    const base = { mercury: ['#c9c4c2', '#77706e'], venus: ['#fbe7a6', '#d9a548'], mars: ['#f08a5a', '#a8341e'], jupiter: ['#f7e0b8', '#c9875a'], saturn: ['#f9e3a0', '#d0a050'], uranus: ['#c8f6f4', '#5ec4cf'], neptune: ['#6a9aff', '#2234a8'] }[k];
    const gr = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r * 1.05);
    gr.addColorStop(0, base[0]); gr.addColorStop(1, base[1]);
    ctx.lineWidth = 3; ctx.strokeStyle = OL; body(); ctx.stroke(); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); body(); ctx.clip();
    if (k === 'mercury') {
      [[-0.35, -0.2, 0.2], [0.3, 0.25, 0.26], [0.1, -0.5, 0.12], [-0.25, 0.45, 0.14], [0.55, -0.15, 0.1]].forEach(([a, b, c]) => {
        ctx.fillStyle = 'rgba(70,60,60,.35)'; circle(x + a * r, y + b * r, c * r); ctx.fillStyle = 'rgba(255,255,255,.25)'; circle(x + a * r - c * r * 0.25, y + b * r - c * r * 0.25, c * r * 0.6);
      });
    } else if (k === 'venus') {
      ctx.strokeStyle = 'rgba(255,250,220,.6)'; ctx.lineWidth = r * 0.1;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - r * 0.2, y + r * (i * 0.35 - 0.5), r * 0.9, 0.2, 1.4); ctx.stroke(); }
    } else if (k === 'mars') {
      ctx.fillStyle = 'rgba(110,30,20,.4)'; ellipse(x - r * 0.25, y + r * 0.1, r * 0.35, r * 0.18, 0.3); ellipse(x + r * 0.35, y - r * 0.2, r * 0.22, r * 0.12);
      ctx.fillStyle = '#fff6f0'; ellipse(x, y - r * 0.95, r * 0.45, r * 0.18);
    } else if (k === 'jupiter') {
      ['#d9a070', '#f7e6c8', '#c98a5a', '#f2d9b0', '#b87a50'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x - r, y - r * 0.75 + i * r * 0.34, r * 2, r * 0.17); });
      inkEllipse(x + r * 0.3, y + r * 0.38, r * 0.24, r * 0.13, 0, '#d0482a', 1);
    } else if (k === 'saturn') {
      ['#e8c070', '#fbe8b8', '#dcae60'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x - r, y - r * 0.5 + i * r * 0.4, r * 2, r * 0.16); });
    } else if (k === 'uranus') {
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x - r * 0.15, y - r, r * 0.3, r * 2);
    } else if (k === 'neptune') {
      ctx.fillStyle = '#16207a'; ellipse(x - r * 0.25, y + r * 0.1, r * 0.25, r * 0.14);
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ellipse(x - r * 0.2, y + r * 0.32, r * 0.2, r * 0.05); ellipse(x + r * 0.35, y - r * 0.4, r * 0.25, r * 0.05);
    }
    ctx.fillStyle = 'rgba(20,10,40,.28)'; ctx.beginPath(); ctx.arc(x + r * 0.45, y + r * 0.45, r * 1.05, 0, TAU); ctx.arc(x - r * 0.1, y - r * 0.1, r * 1.0, 0, TAU, true); ctx.fill();
    ctx.restore();
    if (k === 'saturn') ring(true);
  }

  // --- worlds: each planet is a wide side-scrolling scene ----------------------------------------
  const rockyGround = (cam, top, bot, speck) => {
    ctx.fillStyle = vgrad(FEET - 8, H, [top, bot]); ctx.fillRect(0, FEET - 8, W, H);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, FEET - 8); ctx.lineTo(W, FEET - 8); ctx.stroke();
    each(cam, 1, 46, (x, i) => { ctx.fillStyle = speck; ellipse(x + hash(i, 9) * 40, FEET + 8 + hash(i, 8) * 70, 2 + hash(i, 7) * 4, 1.5 + hash(i, 6) * 2); });
  };
  const rock = (x, y, s, col, i) => {
    const p = new Path2D(); const n = 7;
    for (let k = 0; k < n; k++) { const a = Math.PI + k / (n - 1) * Math.PI, rr = s * (0.75 + hash(i, k) * 0.4); k ? p.lineTo(x + Math.cos(a) * rr * 1.4, y + Math.sin(a) * rr) : p.moveTo(x + Math.cos(a) * rr * 1.4, y + Math.sin(a) * rr); }
    p.closePath(); ink(p, col, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ellipse(x - s * 0.4, y - s * 0.5, s * 0.35, s * 0.15, -0.3);
  };
  const crater = (x, y, w, col) => {
    inkEllipse(x, y, w, w * 0.22, 0, mix(col, '#2a2030', 0.35), 1.5);
    ctx.fillStyle = mix(col, '#ffffff', 0.25); ctx.beginPath(); ctx.ellipse(x, y + 1, w, w * 0.22, 0, 0.1, Math.PI - 0.1); ctx.lineWidth = 3; ctx.strokeStyle = mix(col, '#ffffff', 0.3); ctx.stroke();
  };
  const cloudSea = (cam, t, cols, y0, drift) => {
    cols.forEach((c, j) => {
      const y = y0 + j * 26, off = cam * (0.35 + j * 0.15) + t * drift * (1 + j * 0.4);
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-10, H + 10);
      for (let x = -10; x <= W + 20; x += 12) ctx.lineTo(x, y + Math.sin((x + off) * 0.013 + j) * 7 + Math.sin((x + off) * 0.037 + j * 2) * 3);
      ctx.lineTo(W + 20, H + 10); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let x = -10; x <= W + 20; x += 12) { const yy = y + 12 + Math.sin((x + off) * 0.02 + j * 3) * 4; x < 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
      ctx.stroke();
    });
  };
  // the wizard's magic cloud-raft that Aubrey walks on where there's no ground
  const raft = (cam, t, col, edge) => {
    const x0 = 20 - cam, x1 = WW - 20 - cam, L = Math.max(x0, -60), R = Math.min(x1, W + 60);
    glow((L + R) / 2, FEET + 30, (R - L) * 0.6, '255,240,255', 0.18);
    const p = new Path2D();
    p.roundRect(L, FEET - 4, R - L, 34, 16);
    for (let x = Math.ceil((L + cam) / 36) * 36 - cam; x < R - 6; x += 36) {
      if (x > L + 8) { p.moveTo(x + 17, FEET + 2); p.arc(x, FEET + 2, 17, 0, TAU); }
      p.moveTo(x + 18 + 14, FEET + 30); p.arc(x + 18, FEET + 30, 14, 0, TAU);
    }
    ink(p, col, 2.2);
    ctx.fillStyle = col; ctx.fillRect(L + 6, FEET - 2, R - L - 12, 30);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(L + 10, FEET - 6, R - L - 20, 3);
    each(cam, 1, 90, (x, i) => { if (x > L + 10 && x < R - 10) star(x + 20, FEET + 16 + Math.sin(t * 2 + i) * 2, 5 + 2 * Math.sin(t * 3 + i), edge, 4); });
  };
  // the sparkly portal Aubrey arrives through
  const portal = (cam, t) => {
    const x = 110 - cam, y = FEET - 80;
    if (x < -120) return;
    glow(x, y, 110, '210,170,255', 0.45);
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = ['#b98aff', '#ff9ad5', '#9ae0ff'][i]; ctx.lineWidth = 6 - i * 1.5;
      ctx.beginPath(); ctx.ellipse(x, y, 44 + i * 6, 78 + i * 6, 0, t * (1 + i) , t * (1 + i) + 4.6); ctx.stroke();
    }
    for (let i = 0; i < 6; i++) { const a = t * 1.6 + i * TAU / 6; star(x + Math.cos(a) * 52, y + Math.sin(a) * 86, 5, '#fff6a8', 4); }
  };

  const SCENES_PL = {
    mercury(cam, t) {
      ctx.fillStyle = vgrad(0, FEET, ['#05030f', '#1a1236', '#3a2a50']); ctx.fillRect(0, 0, W, H);
      skyStars(cam, 70, 300);
      const sx = 700 - cam * 0.05, sy = 150;
      glow(sx, sy, 330, '255,220,120', 0.5);
      for (let i = 0; i < 16; i++) { const a = i * TAU / 16 + t * 0.1; ctx.fillStyle = 'rgba(255,230,140,.25)'; tri(sx + Math.cos(a - 0.08) * 160, sy + Math.sin(a - 0.08) * 160, sx + Math.cos(a + 0.08) * 160, sy + Math.sin(a + 0.08) * 160, sx + Math.cos(a) * (230 + 20 * Math.sin(t * 2 + i)), sy + Math.sin(a) * (230 + 20 * Math.sin(t * 2 + i))); }
      const gr = ctx.createRadialGradient(sx - 40, sy - 40, 20, sx, sy, 160); gr.addColorStop(0, '#fffbe0'); gr.addColorStop(0.6, '#ffe070'); gr.addColorStop(1, '#ffb030');
      inkCircle(sx, sy, 150, gr, 2);
      ctx.fillStyle = 'rgba(255,170,40,.35)'; circle(sx + 40, sy + 30, 22); circle(sx - 60, sy - 20, 14);
      ridge(cam, 0.2, 330, 70, 0.008, '#5a5468', 1, 2);
      each(cam, 0.2, 260, (x, i) => crater(x + hash(i) * 100, 318 + hash(i, 2) * 20, 30 + hash(i, 3) * 20, '#5a5468'));
      ridge(cam, 0.5, 390, 60, 0.011, '#7e7888', 2, 2);
      each(cam, 0.5, 220, (x, i) => crater(x + hash(i, 4) * 80, 386 + hash(i, 5) * 14, 26 + hash(i, 6) * 18, '#7e7888'));
      rockyGround(cam, '#a8a2ae', '#6a6476', 'rgba(60,50,70,.35)');
      each(cam, 1, 300, (x, i) => crater(x + hash(i, 7) * 120, FEET + 30 + hash(i, 8) * 40, 40 + hash(i, 9) * 30, '#9a94a2'));
      each(cam, 1, 170, (x, i) => rock(x + hash(i, 11) * 60, FEET - 6, 8 + hash(i, 12) * 8, '#8e8898', i));
      // sunlit glints
      ctx.fillStyle = 'rgba(255,230,160,.12)'; ctx.fillRect(0, FEET - 8, W, 18);
    },
    venus(cam, t) {
      ctx.fillStyle = vgrad(0, FEET, ['#f6c860', '#f7d98a', '#eaa24a']); ctx.fillRect(0, 0, W, H);
      // the Sun glows faintly through the clouds, low in the west
      glow(150 - cam * 0.04, 290, 200, '255,250,220', 0.55);
      for (let j = 0; j < 7; j++) {
        const y = 70 + j * 42, sp = 18 + j * 6, col = j % 2 ? 'rgba(255,240,180,.55)' : 'rgba(220,150,60,.35)';
        ctx.fillStyle = col;
        each(cam, 0.08 + j * 0.03, 260, (x, i) => { const xx = x - ((t * sp) % 260); ellipse(xx + hash(i, j) * 60, y, 120 + hash(i, j + 3) * 60, 16 + hash(i, j + 5) * 8); });
      }
      // volcanoes far away
      each(cam, 0.3, 520, (x, i) => {
        const vx = x + hash(i, 1) * 200, h = 110 + hash(i, 2) * 70;
        ink(P2(`M${vx - 190},${400} L${vx - 26},${400 - h} L${vx + 26},${400 - h} L${vx + 190},400 Z`), '#b0603a', 2);
        ctx.fillStyle = '#ff7a2a'; ellipse(vx, 402 - h, 24, 6);
        glow(vx, 380 - h, 50, '255,140,60', 0.35 + 0.15 * Math.sin(t * 2 + i));
        ctx.fillStyle = 'rgba(255,120,40,.7)'; ctx.fillRect(vx - 4, 402 - h, 8, h * 0.5);
      });
      ridge(cam, 0.5, 420, 40, 0.01, '#c47038', 1, 2);
      rockyGround(cam, '#d88a46', '#8e4422', 'rgba(110,40,20,.3)');
      // cracked plates
      ctx.strokeStyle = 'rgba(100,40,20,.45)'; ctx.lineWidth = 2;
      each(cam, 1, 120, (x, i) => { ctx.beginPath(); ctx.moveTo(x, FEET); ctx.lineTo(x + 20 + hash(i) * 30, FEET + 30); ctx.lineTo(x + 10, FEET + 70); ctx.moveTo(x + 20 + hash(i) * 30, FEET + 30); ctx.lineTo(x + 70, FEET + 44); ctx.stroke(); });
      each(cam, 1, 210, (x, i) => rock(x + hash(i, 3) * 80, FEET - 6, 7 + hash(i, 4) * 9, '#b86a3a', i));
      // heat shimmer
      ctx.strokeStyle = 'rgba(255,240,200,.35)'; ctx.lineWidth = 2;
      for (let j = 0; j < 5; j++) { ctx.beginPath(); for (let x = 0; x < W; x += 10) { const y = 360 + j * 18 + Math.sin(x * 0.04 + t * 4 + j) * 3; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    },
    mars(cam, t) {
      ctx.fillStyle = vgrad(0, FEET, ['#c9744a', '#e8a070', '#f6cfa0']); ctx.fillRect(0, 0, W, H);
      const sx = 840 - cam * 0.04;
      glow(sx, 96, 70, '240,250,255', 0.6); inkCircle(sx, 96, 16, '#fffaf0', 1);
      // two tiny lumpy moons
      const moon = (x, y, r, rot) => { inkEllipse(x, y, r * 1.3, r, rot, '#a89080', 1.2); ctx.fillStyle = 'rgba(80,60,50,.4)'; circle(x - r * 0.3, y, r * 0.25); circle(x + r * 0.4, y + r * 0.2, r * 0.18); };
      moon(330 - cam * 0.06, 112, 11, 0.4); moon(560 - cam * 0.06, 84, 7, -0.3);
      // mesas far away
      ridge(cam, 0.12, 330, 60, 0.006, '#c26a48', 0, 0);
      // the giant volcano
      each(cam, 0.25, 1300, (x, i) => {
        const vx = x + 500;
        ink(P2(`M${vx - 520},372 C${vx - 360},360 ${vx - 160},212 ${vx - 70},196 L${vx + 70},196 C${vx + 160},212 ${vx + 360},360 ${vx + 520},372 Z`), '#b8583a', 2.2);
        ctx.fillStyle = '#8e3e28'; ellipse(vx, 199, 66, 8);
        ctx.strokeStyle = 'rgba(255,220,190,.35)'; ctx.lineWidth = 3;
        for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(vx + k * 22, 206); ctx.quadraticCurveTo(vx + k * 70, 300, vx + k * 140, 368); ctx.stroke(); }
      });
      ridge(cam, 0.5, 410, 60, 0.012, '#c8582e', 2, 2);
      rockyGround(cam, '#d2603a', '#8a2e1a', 'rgba(90,20,10,.35)');
      each(cam, 1, 130, (x, i) => rock(x + hash(i, 5) * 60, FEET - 6, 6 + hash(i, 6) * 12, '#a8442a', i));
      each(cam, 1, 260, (x, i) => crater(x + hash(i, 1) * 90, FEET + 40 + hash(i, 2) * 30, 30 + hash(i, 3) * 20, '#b84a2a'));
      // a dust devil wandering about
      const dx = ((t * 40) % (WW + 400)) - 200 - cam * 0.7, dy = 400;
      if (dx > -80 && dx < W + 80) {
        for (let k = 0; k < 9; k++) { ctx.strokeStyle = `rgba(230,140,90,${0.5 - k * 0.04})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(dx + Math.sin(t * 3 + k) * 6, dy - k * 16, 8 + k * 4, 4 + k, 0, t * 4 + k, t * 4 + k + 4); ctx.stroke(); }
      }
    },
    jupiter(cam, t) {
      ctx.fillStyle = vgrad(0, 380, ['#2a1840', '#7a4a6a', '#e8b080', '#f7e0b8']); ctx.fillRect(0, 0, W, H);
      skyStars(cam, 30, 160, 0.7);
      // lots of moons
      [[120, 90, 9, '#f2d24a'], [260, 130, 7, '#f4f0ea'], [420, 84, 12, '#b8aea0'], [600, 110, 11, '#6e6458'], [710, 76, 3, '#ccc'], [800, 140, 4, '#ddd'], [880, 96, 3, '#ccc'], [340, 72, 3, '#bbb'], [520, 150, 3, '#ddd']].forEach(([x, y, r, c]) => inkCircle(((x - cam * 0.05) % 1000 + 1000) % 1000, y, r, c, 1));
      // the Great Red Spot, swirling on the horizon
      const gx = 640 - cam * 0.12, gy = 336;
      inkEllipse(gx, gy, 230, 80, 0, '#e07a4a', 2);
      for (let k = 0; k < 6; k++) { ctx.strokeStyle = ['#c8442a', '#f0a070', '#b83a22'][k % 3]; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(gx, gy, 200 - k * 32, 68 - k * 11, 0, t * (0.5 + k * 0.1), t * (0.5 + k * 0.1) + 4.4); ctx.stroke(); }
      ctx.fillStyle = '#a8301c'; ellipse(gx, gy, 28, 10);
      cloudSea(cam, t, ['#f2d0a0', '#d99a68', '#f7e6c8', '#c4804e', '#f0c890', '#b0703f'], 336, 20);
      raft(cam, t, '#fff4fb', '#d8a0ff');
    },
    saturn(cam, t) {
      ctx.fillStyle = vgrad(0, 400, ['#1c1840', '#5a4a80', '#e8b878', '#f9dca0']); ctx.fillRect(0, 0, W, H);
      skyStars(cam, 40, 200, 0.8);
      // the rings arch across the sky
      const cx = 480 - cam * 0.05, cy = 760;
      [[700, 22, 'rgba(250,236,200,.95)'], [668, 10, 'rgba(120,90,70,.5)'], [640, 30, 'rgba(232,200,140,.95)'], [606, 8, 'rgba(250,240,210,.8)'], [580, 18, 'rgba(210,170,110,.85)']].forEach(([r, w, c]) => {
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.25, r, -0.08, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, 712 * 1.25, 712, -0.08, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      // Titan in its orange haze, and other moons
      const tx = 180 - cam * 0.06; glow(tx, 120, 34, '255,170,60', 0.6); inkCircle(tx, 120, 16, '#f0a040', 1.2);
      inkCircle(770 - cam * 0.06, 92, 6, '#eee', 1); inkCircle(860 - cam * 0.06, 150, 4, '#ddd', 1); inkCircle(60 - cam * 0.06 + 960, 70, 5, '#ccc', 1);
      cloudSea(cam, t, ['#f6dca0', '#e8c070', '#fbecc4', '#d8a858', '#f2d290'], 350, 14);
      raft(cam, t, '#fff7ea', '#ffb0d8');
    },
    uranus(cam, t) {
      ctx.fillStyle = vgrad(0, 400, ['#1e5a78', '#3aa0b0', '#8adcd8', '#c8f4ee']); ctx.fillRect(0, 0, W, H);
      skyStars(cam, 25, 160, 0.6);
      const sx = 820 - cam * 0.04; glow(sx, 100, 50, '255,255,230', 0.6); inkCircle(sx, 100, 9, '#fffbe0', 1);
      // the thin rings stand straight up, because the planet is tipped on its side
      const rx = 360 - cam * 0.08;
      for (let k = 0; k < 4; k++) { ctx.strokeStyle = `rgba(230,255,255,${0.55 - k * 0.1})`; ctx.lineWidth = 3 - k * 0.5; ctx.beginPath(); ctx.ellipse(rx, 420, 90 + k * 26, 380 + k * 20, 0.12, Math.PI, TAU); ctx.stroke(); }
      // icy haze clouds
      ctx.fillStyle = 'rgba(240,255,255,.35)';
      each(cam, 0.15, 300, (x, i) => { ellipse(x + hash(i) * 100, 220 + hash(i, 1) * 60, 110, 18); ellipse(x + hash(i) * 100 + 50, 210 + hash(i, 1) * 60, 60, 14); });
      cloudSea(cam, t, ['#9ee6e2', '#70ccd0', '#c0f2ee', '#58b4c0', '#a8e8e4'], 350, 10);
      raft(cam, t, '#f4fdff', '#9ae0ff');
      // icicles under the raft and falling snow
      each(cam, 1, 60, (x, i) => { if (x + cam > 40 && x + cam < WW - 40) { ctx.fillStyle = 'rgba(220,250,255,.95)'; tri(x - 5, FEET + 40, x + 5, FEET + 40, x, FEET + 54 + hash(i) * 14); } });
      for (let i = 0; i < 40; i++) { const x = ((hash(i, 1) * W + t * 20 - cam * 0.6) % W + W) % W, y = ((hash(i, 2) * H + t * (30 + hash(i) * 20)) % (H - 60)) + 60; ctx.fillStyle = 'rgba(255,255,255,.8)'; star(x, y, 3, '#ffffff', 3); }
    },
    neptune(cam, t) {
      ctx.fillStyle = vgrad(0, 400, ['#030a3a', '#0e2a8a', '#2a5ad8', '#5a8af0']); ctx.fillRect(0, 0, W, H);
      skyStars(cam, 60, 260);
      // the Sun is just a tiny bright star
      const sx = 790 - cam * 0.03; glow(sx, 96, 26, '255,255,230', 0.9); star(sx, 96, 12 + Math.sin(t * 3), '#fffbe0', 4); star(sx, 96, 7, '#ffffff', 8);
      const tr = 170 - cam * 0.06; inkCircle(tr, 130, 10, '#f0c8d0', 1);
      // a big dark storm
      const dx = 560 - cam * 0.12; inkEllipse(dx, 344, 120, 36, 0, '#0a1660', 2);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ellipse(dx + 40, 316, 70, 7); ellipse(dx - 70, 372, 50, 5);
      cloudSea(cam, t, ['#3a6ae0', '#2448b8', '#5a88f0', '#1a3398', '#4a78e8'], 350, 120);
      // super-fast winds
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let i = 0; i < 14; i++) { const y = 90 + hash(i, 1) * 330, len = 60 + hash(i, 2) * 90, x = W + 200 - ((t * (600 + hash(i) * 400) + hash(i, 3) * 2000) % (W + 400)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke(); }
      raft(cam, t, '#eef4ff', '#8ab0ff');
    },
  };

  // --- the round -------------------------------------------------------------------------------------
  const ROUNDS = { 1: 3, 2: 4, 3: 5 };
  function newRound(g) {
    const k = g.plan[g.round], P = PL[k];
    const clues = shuffle(P.clues.map(c => ({ act: c[0], icon: c[1], note: c[2], say: c[3] })));
    const n = clues.length, step = (WW - 620) / (n - 1);
    clues.forEach((c, i) => { c.x = Math.round(440 + i * step + rand(-40, 40)); c.found = false; });
    let cards;
    if (g.tier === 1) cards = ['mars', 'jupiter', 'saturn', 'neptune'];
    else if (g.tier === 2) cards = [k, ...shuffle(ORDER.filter(o => o !== k)).slice(0, 4)];
    else cards = ORDER.slice();
    cards = ORDER.filter(o => cards.includes(o));
    Object.assign(g, {
      k, spots: clues, notes: [], cards, wrongCards: [], wrong: 0, st: 'warp', stT: 0,
      a: { x: 170, face: 1, ph: 0, target: null, auto: null }, cam: 0, check: null, msg: null, picked: null,
    });
    g.progress = `Planet ${g.round + 1} of ${g.plan.length}`;
    SFX.sparkle(); tone(300, 1.2, 'sine', 0.06, 0, 1200);
  }
  // a lucky guess with no clues at all counts for less than real detective work
  const roundScore = g => (g.wrong === 0 ? (g.notes.length === 0 ? 0.8 : g.notes.length <= 2 ? 1 : Math.max(0.85, 1 - 0.05 * (g.notes.length - 2))) : g.wrong === 1 ? 0.55 : 0.2);
  const say = (g, str, icon = '🧙') => { g.msg = { str, icon }; speak(str); };

  MG.planetdetective = {
    kind: 'learn',
    title: () => 'Planet Detective',
    icon: () => '🪐',
    how: () => "The wizard's telescope will whoosh you to a mystery planet! Walk around with the arrows or tap, and check the sparkly clue spots with Space. When you know where you are, press I know where I am!",
    init(g) {
      const N = ROUNDS[g.tier];
      if (g.tier === 1) g.plan = shuffle(EASY.slice());
      else if (g.tier === 2) g.plan = shuffle([...shuffle(EASY.slice()).slice(0, 2), ...shuffle(['venus', 'neptune', 'mercury', 'uranus']).slice(0, 2)]);
      else g.plan = shuffle([...shuffle(EASY.slice()).slice(0, 2), ...shuffle(HARD.slice()).slice(0, 3)]);
      g.plan = g.plan.slice(0, N);
      g.round = 0; g.results = []; g.score = 0;
      g.say = 'Walk around and check the sparkly clue spots. When you know which planet you are on, press I know where I am!';
      newRound(g);
    },
    start(g) { newRound(g); },
    near(g) { return g.spots.find(s => !s.found && Math.abs(s.x - g.a.x) < 62); },
    startCheck(g, s) {
      g.a.target = null; g.a.auto = null;
      g.check = { s, t: 0, dur: s.act === 'jump' ? 1.3 : 1.0 };
      if (s.act === 'jump') SFX.jump(); else if (s.act === 'wind') noise(0.8, 0.04); else SFX.blip();
    },
    openPicker(g) { g.st = 'pick'; g.a.target = null; speak('Which planet are you on?'); },
    guess(g, k) {
      if (g.wrongCards.includes(k)) return;
      if (k === g.k) {
        g.results.push(roundScore(g)); g.st = 'reveal'; g.stT = 0; g.right = true;
        SFX.fanfare(); burst(W / 2, 200, 30);
        speak(`Yes! You're on ${PL[k].name}! ${g.wrong === 0 && g.notes.length <= 2 ? 'Super quick detective work!' : 'Great detective work!'}`);
      } else {
        g.wrong++; g.wrongCards.push(k); SFX.miss();
        if (g.wrong >= 2) {
          g.results.push(roundScore(g)); g.st = 'reveal'; g.stT = 0; g.right = false;
          speak(`Not ${PL[k].name}. You were on ${PL[g.k].name}! Let's remember that one.`);
        } else { g.st = 'explore'; say(g, `Hmm, not ${PL[k].name}. Let's look for more clues!`, '🔎'); }
      }
      g.score = g.results.reduce((s, v) => s + v, 0) / g.plan.length;
    },
    update(g, dt, id) {
      dt = Math.min(dt, 1 / 30);
      g.stT += dt;
      if (g.st === 'warp') {
        if (g.stT > 1.7) {
          g.st = 'explore'; g.stT = 0; SFX.pop();
          say(g, g.round === 0 ? 'Whoosh! Where am I? Walk around and check the sparkly clue spots!' : 'Whoosh! A new planet! Where am I now?', '✨');
        }
        return;
      }
      if (g.st === 'reveal') {
        if (id === 'next' || (g.stT > 0.6 && (pressed[' '] || pressed.enter))) {
          g.round++;
          if (g.round >= g.plan.length) { g.score = g.results.reduce((s, v) => s + v, 0) / g.plan.length; g.done = true; } else newRound(g);
        }
        return;
      }
      if (g.st === 'pick') {
        if (id === 'close' || pressed.escape) { g.st = 'explore'; return; }
        if (id && id.startsWith('card:')) this.guess(g, id.slice(5));
        return;
      }
      // --- exploring ---
      const a = g.a;
      if (id === 'guess' || pressed.g) { this.openPicker(g); return; }
      if (g.check) {
        g.check.t += dt;
        if (g.check.t >= g.check.dur) {
          const s = g.check.s; s.found = true; g.notes.push(s); g.check = null;
          SFX.sparkle(); burst(s.x - g.cam, FEET - 170, 14);
          say(g, s.say, s.icon);
          if (g.notes.length === g.spots.length) setTimeout(() => { if (g.st === 'explore' && g.notes.length === g.spots.length) speak('You found every clue! Do you know where you are?'); }, 5200);
        }
        return;
      }
      let mv = 0;
      if (goLeft()) mv = -1; else if (goRight()) mv = 1;
      if (mv) { a.target = null; a.auto = null; }
      if (pointer.clicked && !id && pointer.y > 64 && pointer.y < 478 && !(pointer.x < 300 && pointer.y < 70 + 46 + Math.max(1, g.notes.length) * 34)) {
        const wx = pointer.x + g.cam;
        const s = g.spots.find(sp => !sp.found && Math.abs(sp.x - wx) < 56 && pointer.y > FEET - 210);
        a.target = clamp(s ? s.x : wx, 60, WW - 60); a.auto = s || null;
      }
      if (a.target != null) {
        const d = a.target - a.x;
        if (Math.abs(d) < 6) { a.x = a.target; a.target = null; if (a.auto) { this.startCheck(g, a.auto); return; } } else mv = Math.sign(d);
      }
      if (mv) {
        const step = SPEED * dt * mv;
        a.x = clamp(a.x + step, 60, WW - 60); a.face = mv;
        const before = Math.floor(a.ph / 60); a.ph += Math.abs(step); if (Math.floor(a.ph / 60) !== before) SFX.step();
      } else a.ph = 0;
      g.cam = lerp(g.cam, clamp(a.x - W * 0.45, 0, WW - W), Math.min(1, dt * 6));
      if (pressed[' '] || pressed.e) { const s = this.near(g); if (s) this.startCheck(g, s); }
    },

    draw(g) {
      const t = S.t, P = PL[g.k];
      if (g.st === 'warp') return this.drawWarp(g, t);
      const cam = g.cam, a = g.a;
      SCENES_PL[g.k](cam, t);
      portal(cam, t);
      // clue spots
      for (const s of g.spots) {
        const x = s.x - cam; if (x < -80 || x > W + 80) continue;
        const near = !s.found && Math.abs(s.x - a.x) < 62, bob = Math.sin(t * 2.4 + s.x) * 5, by = FEET - 178 + bob;
        if (!s.found) {
          glow(x, FEET + 4, 70, '255,240,140', 0.5 + 0.2 * Math.sin(t * 4 + s.x));
          inkEllipse(x, FEET + 4, 40, 10, 0, 'rgba(255,240,150,.85)', 1.2);
          for (let i = 0; i < 4; i++) { const ang = t * 2 + i * TAU / 4; star(x + Math.cos(ang) * 40, FEET + 4 + Math.sin(ang) * 10 - 14 - (t * 30 + i * 12) % 60, 4, '#fff6a8', 4); }
          glow(x, by, 48, '255,250,200', near ? 0.9 : 0.55);
          inkCircle(x, by, near ? 30 : 26, near ? '#fff6c8' : '#fffbea', 1.5);
          emoji(ACT_ICON[s.act], x, by, near ? 30 : 26);
          if (g.tier === 1 || near) { rrect(x - 30, by + 32, 60, 22, 11, 'rgba(48,24,72,.8)'); text(ACT_WORD[s.act], x, by + 43, 14, '#fff6a8', 'center', 700); }
          if (near && !g.check) { rrect(x - 52, by - 66, 104, 30, 15, '#ff6fb5'); text('Space: check!', x, by - 51, 14, '#fff', 'center', 700); }
        } else {
          ctx.globalAlpha = 0.75; inkCircle(x, by + 10, 20, '#e6ffe8', 1); emoji(s.icon, x, by + 10, 22); ctx.globalAlpha = 1;
        }
      }
      // Aubrey
      const ck = g.check;
      let frame = 'idle_front', lift = 0, ax = a.x - cam;
      if (a.ph > 0) frame = 'run' + (1 + Math.floor(a.ph / 24) % 5);
      if (ck) {
        const p = ck.t / ck.dur;
        if (ck.s.act === 'jump') { const q = clamp(p / 0.85, 0, 1); lift = 4 * P.jump * q * (1 - q); frame = q > 0 && q < 1 ? 'jump' : 'crouch'; }
        else if (ck.s.act === 'touch') frame = 'crouch';
        else if (ck.s.act === 'look') frame = 'cast';
      }
      drawAstronaut(ax, FEET, frame, a.face, lift, AS);
      if (ck) this.drawCheck(g, ck, ax, t);
      // a hint arrow to the nearest clue that's off-screen
      const left = g.spots.filter(s => !s.found);
      if (left.length && !left.some(s => s.x - cam > 0 && s.x - cam < W)) {
        const s = left.reduce((b, s) => (Math.abs(s.x - a.x) < Math.abs(b.x - a.x) ? s : b));
        const dir = Math.sign(s.x - a.x), x = dir > 0 ? W - 40 : 40, y = FEET - 70 + Math.sin(t * 5) * 4;
        ink(P2(`M${x + dir * 22},${y} L${x - dir * 8},${y - 22} L${x - dir * 8},${y - 10} L${x - dir * 26},${y - 10} L${x - dir * 26},${y + 10} L${x - dir * 8},${y + 10} L${x - dir * 8},${y + 22} Z`), '#fff6a8', 2);
      }
      this.drawNotebook(g);
      // bottom strip: message + the guess button
      darkPanel(12, 482, 690, 50, 22);
      const m = g.msg || { str: 'Check the sparkly clue spots!', icon: '✨' };
      emoji(m.icon, 42, 507, 26);
      const lines = wrap(m.str, 610, 16);
      const sz = lines.length > 2 ? 14 : 16, ls = wrap(m.str, 610, sz).slice(0, 3);
      ls.forEach((l, i) => text(l, 66, 507 + (i - (ls.length - 1) / 2) * (sz + 3), sz, '#fff', 'left', 600));
      if (g.st === 'explore') button('guess', 712, 480, 236, 54, 'I know where I am!', { icon: '🪐', color: '#ff6fb5', size: 17 });
      if (g.st === 'pick') this.drawPicker(g, t);
      if (g.st === 'reveal') this.drawReveal(g, t);
    },
    drawCheck(g, ck, ax, t) {
      const s = ck.s, P = PL[g.k], p = ck.t / ck.dur, hy = FEET - 150;
      if (s.act === 'thermo') {
        const x = ax + 52, y = FEET - 120;
        const lvl = P.temp === 'hot' ? Math.min(1, p * 1.3) : P.temp === 'cold' ? Math.max(0.05, 0.5 - p * 0.6) : 0.5 + 0.45 * Math.sin(p * 9);
        inkRect(x - 9, y - 60, 18, 80, '#ffffff', 2, 9); inkCircle(x, y + 26, 14, lvl > 0.5 ? '#ff4a4a' : '#4a8aff', 2);
        rrect(x - 4, y + 16 - 72 * lvl, 8, 72 * lvl, 4, lvl > 0.5 ? '#ff4a4a' : '#4a8aff');
        emoji(lvl > 0.5 ? '🔥' : '❄️', x + 30, y - 40, 22);
      } else if (s.act === 'wind') {
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let i = 0; i < 10; i++) { const y = FEET - 200 + i * 20, x = W - ((p * 1600 + i * 170) % (W + 200)); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 40, y - 10, x + 90, y); ctx.stroke(); }
      } else if (s.act === 'look') {
        ctx.setLineDash([4, 8]); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(ax, hy - 20); ctx.lineTo(ax + 60, hy - 120); ctx.stroke(); ctx.setLineDash([]);
        emoji('👀', ax + 70, hy - 132, 30);
      } else if (s.act === 'touch') {
        burst(ax + 20, FEET, 1, { spread: 40, up: 30 });
      }
      // the clue pops up as she finishes
      if (p > 0.6) { const k = (p - 0.6) / 0.4; inkCircle(ax, FEET - 230, 24 * k, '#fffbea', 1.5); emoji(s.icon, ax, FEET - 230, 26 * k); }
    },
    drawNotebook(g) {
      const n = g.notes.length, h = 46 + Math.max(1, n) * 34;
      panel(12, 70, 288, h, 18);
      rrect(12, 70, 288, 38, [18, 18, 0, 0], '#ffd36b');
      emoji('📒', 34, 89, 22); text('Clue Notebook', 52, 89, 18, '#6a3a1a', 'left', 800);
      text(`${n}/${g.spots.length}`, 288, 89, 15, '#8a5a2a', 'right', 700);
      if (!n) text('Find the ✨ clue spots!', 28, 132, 16, '#9a7aaa', 'left', 600);
      g.notes.forEach((s, i) => {
        const y = 129 + i * 34;
        emoji(s.icon, 34, y, 22);
        text(s.note, 54, y, 16, '#5a2a6e', 'left', 700);
        if (i < n - 1) { ctx.strokeStyle = 'rgba(180,140,200,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(24, y + 17); ctx.lineTo(288, y + 17); ctx.stroke(); }
      });
    },
    drawPicker(g, t) {
      ctx.fillStyle = 'rgba(20,10,40,.55)'; ctx.fillRect(0, 0, W, H);
      panel(30, 74, 900, 404, 24);
      outlined('Which planet am I on?', W / 2, 108, 28, '#ff6fb5', 'center', '#fff');
      const n = g.cards.length, gap = 12, cw = Math.min(196, (860 - gap * (n - 1)) / n), x0 = W / 2 - (n * cw + (n - 1) * gap) / 2;
      g.cards.forEach((k, i) => {
        const x = x0 + i * (cw + gap), y = 132, ch = 260, bad = g.wrongCards.includes(k);
        const b = { id: `card:${k}`, x, y, w: cw, h: ch, on: !bad, key: String(i + 1) };
        buttons.push(b);
        const hov = !bad && inRect(b);
        rrect(x, y - (hov ? 3 : 0), cw, ch, 16, bad ? '#d8d0de' : hov ? '#2a2060' : '#1c1648', hov ? '#ffd36b' : '#e2c6f5', 3);
        ctx.save(); ctx.beginPath(); ctx.roundRect(x + 3, y + 3 - (hov ? 3 : 0), cw - 6, ch - 6, 14); ctx.clip();
        for (let j = 0; j < 12; j++) star(x + hash(i, j) * cw, y + hash(j, i) * 150, 1.5, 'rgba(255,255,255,.7)', 4);
        ctx.restore();
        ctx.globalAlpha = bad ? 0.35 : 1;
        drawPlanet(k, x + cw / 2, y + 86 - (hov ? 3 : 0), Math.min(48, cw * 0.36), t);
        text(PL[k].name, x + cw / 2, y + 168, cw < 120 ? 17 : 20, bad ? '#6a5a7a' : '#fff6a8', 'center', 800);
        if (g.tier === 1) PL[k].hint.forEach((h, j) => text(h, x + cw / 2, y + 198 + j * 20, 14, '#d8c8f8', 'center', 600));
        ctx.globalAlpha = 1;
        rrect(x + 8, y + 8, 24, 24, 12, 'rgba(255,255,255,.2)'); text(String(i + 1), x + 20, y + 20, 14, '#fff', 'center', 800);
        if (bad) emoji('❌', x + cw / 2, y + 86, 40);
      });
      button('close', W / 2 - 120, 412, 240, 50, 'Keep exploring', { icon: '🔎', color: '#9a6ae0', size: 18 });
    },
    drawReveal(g, t) {
      ctx.fillStyle = 'rgba(20,10,40,.5)'; ctx.fillRect(0, 0, W, H);
      panel(W / 2 - 290, 90, 580, 380, 26);
      const P = PL[g.k];
      glow(W / 2, 200, 120, g.right ? '255,240,140' : '200,200,255', 0.6);
      drawPlanet(g.k, W / 2, 200, 82, t);
      outlined(g.right ? `Yes! It's ${P.name}!` : `It was ${P.name}!`, W / 2, 318, 34, g.right ? '#ff6fb5' : '#8a5ae0', 'center', '#fff');
      const lines = wrap(P.clues.map(c => c[2]).slice(0, 3).join(' • '), 520, 16);
      lines.forEach((l, i) => text(l, W / 2, 354 + i * 20, 16, '#5a2a6e', 'center', 600));
      const last = g.round >= g.plan.length - 1;
      button('next', W / 2 - 110, 400, 220, 54, last ? 'Finish!' : 'Next planet', { icon: last ? '⭐' : '🔭', color: '#5fb87a', size: 20 });
    },
    drawWarp(g, t) {
      const p = g.stT / 1.7, P = PL[g.k];
      const col = { mercury: '170,160,180', venus: '250,200,100', mars: '230,110,70', jupiter: '230,170,120', saturn: '245,215,140', uranus: '140,230,230', neptune: '80,120,240' }[g.k];
      ctx.fillStyle = '#0a0620'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) {
        const a = hash(i) * TAU, d = ((hash(i, 2) + p * 1.6 + t * 0.2) % 1), r0 = 20 + d * d * 700, r1 = r0 + 20 + d * 120;
        ctx.strokeStyle = i % 3 ? `rgba(${col},${0.3 + d * 0.7})` : `rgba(255,${180 + i % 60},255,${0.3 + d * 0.6})`; ctx.lineWidth = 1 + d * 4;
        ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0); ctx.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1); ctx.stroke();
      }
      glow(W / 2, H / 2, 260 * p + 40, col, 0.7);
      ctx.save(); ctx.translate(W / 2, H / 2 + 60); ctx.rotate(Math.sin(t * 4) * 0.2); drawAstronaut(0, 0, 'jump', 1, 0, 0.5 + 0.1 * Math.sin(t * 6)); ctx.restore();
      outlined('Whoooosh!', W / 2, 120, 44, '#fff6a8', 'center');
      text(`Planet ${g.round + 1} of ${g.plan.length}`, W / 2, 170, 20, '#fff', 'center', 700);
      if (p > 0.8) { ctx.fillStyle = `rgba(255,255,255,${(p - 0.8) * 5})`; ctx.fillRect(0, 0, W, H); }
    },
  };

  restage('observatory', {
    games: [['scopespot', 'stardust', {}], ['planetdetective', 'feather', {}]],
    mid: [
      "N:Splendid spotting! Now, step into my telescope's magic beam. It will whisk you away to faraway planets!",
      'N:Gather clues, my young detective, and tell me where you have landed.',
      "A:excited:A planet detective? I'm ready! Whoosh!",
    ],
  });
}
