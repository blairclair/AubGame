'use strict';
// Farm Facts animal portraits (see js/farmart.js for the drawing contract)
// Horse, donkey, pig and rabbit. Everything lives in this block so the helper names stay private.
{
  const D = s => new Path2D(s);
  const LW = 3.6; // half of the ink stroke width (the part that shows outside a fill)

  // stroke every outline first, then fill every shape on top, so touching parts read as one mass
  // parts: [path, fill, dx = 0, dy = 0]
  function mass(lw, parts) {
    ctx.strokeStyle = OL; ctx.lineWidth = lw * 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const [p, , dx = 0, dy = 0] of parts) { ctx.save(); ctx.translate(dx, dy); ctx.stroke(p); ctx.restore(); }
    for (const [p, f, dx = 0, dy = 0] of parts) { ctx.save(); ctx.translate(dx, dy); ctx.fillStyle = f; ctx.fill(p); ctx.restore(); }
  }
  function clipIn(p, fn, dx = 0, dy = 0) { ctx.save(); ctx.translate(dx, dy); ctx.clip(p); ctx.translate(-dx, -dy); fn(); ctx.restore(); }
  function lin(x0, y0, x1, y1, ...cols) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
    return g;
  }
  function rad(x, y, r, c0, c1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    return g;
  }
  // soft-edged tinted blob (radial fade) for shading and highlights
  function soft(x, y, rx, ry, col, a, rot = 0) {
    if (col.length === 4) col = '#' + col[1] + col[1] + col[2] + col[2] + col[3] + col[3];
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, ry / rx); ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, col); g.addColorStop(0.55, col + 'aa'); g.addColorStop(1, col + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  function pen(d, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(typeof d === 'string' ? D(d) : d); }
  function turn(x, y, a, fn) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.translate(-x, -y); fn(); ctx.restore(); }
  // 1 = open, dips to 0 for a quick blink every `per` seconds
  function blink(t, ph, per = 4.3) { const c = ((t + ph) % per + per) % per; return c < 0.18 ? Math.abs(c - 0.09) / 0.09 : 1; }
  // an occasional quick twitch (0..1)
  function twitch(t, ph, per = 3.1) { const c = ((t + ph) % per + per) % per; return c < 0.35 ? Math.sin(c / 0.35 * Math.PI) : 0; }

  // friendly cartoon eye: dark oval, warm iris rim, two catchlights, lash line, blinks
  function eye(x, y, rx, ry, t, ph, iris = '#6a3a1e', lid = null) {
    const b = blink(t, ph);
    if (b < 0.3) { pen(`M${x - rx * 1.1},${y} Q${x},${y + ry * 0.6} ${x + rx * 1.1},${y}`, OL, 2.6); return; }
    ctx.save(); ctx.translate(x, y); ctx.scale(1, b);
    inkEllipse(0, 0, rx, ry, 0, '#24141c', 1.2);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = iris; ellipse(0, ry * 0.75, rx * 1.1, ry * 0.65);
    ctx.fillStyle = '#24141c'; ellipse(rx * 0.1, ry * 0.1, rx * 0.55, ry * 0.6);
    ctx.restore();
    ctx.fillStyle = '#fff'; ellipse(rx * 0.3, -ry * 0.38, rx * 0.36, ry * 0.3);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; circle(-rx * 0.35, ry * 0.42, rx * 0.16);
    ctx.restore();
    if (lid) pen(`M${x - rx * 1.2},${y - ry * 0.55} Q${x},${y - ry * 1.45} ${x + rx * 1.15},${y - ry * 0.7}`, lid, 2.2);
  }
  // hoof with an optional silver horseshoe
  function hoof(x0, x1, h, col, shoe) {
    const p = D(`M${x0 + 1},${-h} L${x1 - 1},${-h} C${x1 + 1},${-h * 0.5} ${x1 + 2},${-h * 0.2} ${x1 + 2},0 L${x0 - 2},0 C${x0 - 2},${-h * 0.25} ${x0 - 1},${-h * 0.55} ${x0 + 1},${-h} Z`);
    return p;
  }
  function shoeAt(x0, x1, dx = 0) {
    ctx.save(); ctx.translate(dx, 0);
    ctx.fillStyle = '#9aa0ae'; ctx.beginPath(); ctx.roundRect(x0 - 2.5, -4, x1 - x0 + 5, 4.2, 1.5); ctx.fill();
    ctx.fillStyle = '#e4e8f0'; ctx.fillRect(x0 - 1, -3.6, x1 - x0 + 2, 1.4);
    ctx.fillStyle = '#5a5e6a';
    for (let i = 1; i < 4; i++) circle(x0 + (x1 - x0) * i / 4, -1.6, 0.9);
    ctx.restore();
  }


  // ---------------------------------------------------------------------------------------------
  // HORSE: tall chestnut with a white blaze and sock, long dark mane & tail, shod hooves
  // ---------------------------------------------------------------------------------------------
  const H = {
    body: D('M-82,-108 C-84,-128 -68,-137 -50,-134 C-32,-131 -10,-123 10,-125 C30,-129 50,-127 60,-114 C70,-100 66,-84 52,-78 C30,-70 -16,-70 -52,-74 C-72,-78 -80,-92 -82,-108 Z'),
    neck: D('M4,-118 C10,-148 34,-180 62,-192 C74,-197 84,-190 86,-178 C88,-162 88,-146 82,-132 C76,-118 70,-106 62,-92 C46,-86 16,-96 4,-118 Z'),
    head: D('M60,-188 C60,-206 82,-210 94,-199 C106,-188 116,-170 123,-156 C130,-142 125,-127 111,-127 C100,-127 93,-131 86,-137 C78,-142 72,-149 67,-157 C60,-167 58,-177 60,-188 Z'),
    ear: D('M66,-195 C61,-205 63,-215 68,-222 C76,-214 80,-205 78,-196 Z'),
    earIn: D('M68,-198 C66,-206 67,-212 69,-216 C74,-210 76,-204 75,-198 Z'),
    fLeg: D('M32,-96 C34,-80 38,-64 39,-50 C38,-45 38,-40 39,-36 C40,-30 40,-24 39,-20 C39,-18 39,-16 38,-14 L54,-14 C55,-17 56,-21 55,-25 C54,-31 54,-37 55,-43 C56,-49 57,-53 57,-59 C58,-72 61,-84 63,-96 Z'),
    hLeg: D('M-82,-104 C-89,-84 -83,-68 -75,-58 C-71,-52 -71,-46 -68,-40 C-66,-32 -66,-22 -66,-14 L-50,-14 C-50,-20 -50,-30 -51,-38 C-52,-44 -50,-50 -48,-56 C-44,-66 -40,-80 -36,-100 Z'),
    sock: D('M-74,-32 C-68,-37 -60,-33 -46,-38 L-46,-10 L-74,-10 Z'),
    blaze: D('M82,-204 C88,-202 91,-196 92,-188 C97,-174 106,-162 114,-152 C118,-146 115,-140 110,-142 C101,-154 93,-166 87,-178 C83,-188 79,-197 82,-204 Z'),
    tail: D('M-78,-126 C-100,-130 -113,-110 -111,-88 C-109,-70 -115,-52 -107,-32 C-102,-44 -99,-50 -95,-56 C-95,-44 -91,-36 -85,-30 C-87,-46 -87,-60 -85,-74 C-83,-90 -79,-104 -72,-114 Z'),
    fore: D('M72,-205 C79,-208 86,-204 88,-197 C88,-193 87,-190 85,-187 C83,-192 80,-194 77,-195 C73,-196 70,-200 72,-205 Z'),
  };
  const fHoof = hoof(38, 54, 14), hHoof = hoof(-66, -50, 14);

  function cubicAt(a, b, c, d, s) {
    const u = 1 - s;
    return [u * u * u * a[0] + 3 * u * u * s * b[0] + 3 * u * s * s * c[0] + s * s * s * d[0],
            u * u * u * a[1] + 3 * u * u * s * b[1] + 3 * u * s * s * c[1] + s * s * s * d[1]];
  }
  // mane locks hanging from a crest curve (a..d); n locks of length len, swaying with t
  function manePath(a, b, c, d, n, len, t, lean = 5) {
    const P = s => cubicAt(a, b, c, d, s);
    const p = new Path2D();
    const [sx, sy] = P(0); p.moveTo(sx, sy);
    for (let i = 1; i <= 20; i++) { const [x, y] = P(i / 20); p.lineTo(x - 3, y - 1.5); }
    for (let i = n; i > 0; i--) {
      const s0 = i / n, s1 = (i - 1) / n, sm = (s0 + s1) / 2;
      const [x0, y0] = P(s0), [x1, y1] = P(s1), [xm, ym] = P(sm);
      const sway = Math.sin(t * 1.3 + i * 1.7) * 1.3;
      const l = len * (0.8 + 0.35 * ((i * 7) % 3) / 2);
      p.quadraticCurveTo(x0 + lean * 0.8, y0 + l * 0.6, xm + lean + sway, ym + l);
      p.quadraticCurveTo(xm + lean * 0.4, ym + l * 0.4, x1 + 2, y1 + 3);
    }
    p.closePath();
    return p;
  }

  ANIMAL_ART.horse = t => {
    const coat = '#bb642d', coatD = '#8a4220', coatL = '#e09358', far = '#7a3c1c';
    const hair = '#36201a', hairL = '#62402e', hoofC = '#4c3a3c';
    const swish = Math.sin(t * 1.6) * 0.06 + twitch(t, 0.5, 5.3) * 0.12;
    const flick = twitch(t, 1.9, 3.7) * 0.25;
    ctx.save(); ctx.scale(0.9, 0.9); ctx.translate(-1, 0);

    // far legs & far ear: behind everything and darker
    mass(LW, [[H.fLeg, far, -14], [fHoof, '#33262a', -14], [H.hLeg, far, 14], [hHoof, '#33262a', 14]]);
    shoeAt(38, 54, -14); shoeAt(-66, -50, 14);
    turn(72, -196, -0.3 - flick * 0.4, () => mass(LW, [[H.ear, far, -6, 3]]));

    // tail
    turn(-78, -120, swish, () => {
      mass(LW, [[H.tail, lin(-90, -128, -100, -30, hairL, hair)]]);
      pen('M-84,-120 C-100,-110 -104,-88 -102,-62', '#8a5c44', 2);
      pen('M-80,-112 C-90,-98 -92,-76 -90,-52', '#1e100a', 1.6);
    });

    // main mass: body + neck + head + near legs + near ear
    turn(72, -196, -flick, () => mass(LW, [[H.ear, coat]]));
    mass(LW, [[H.hLeg, lin(0, -110, 0, -14, coat, coatD)], [H.fLeg, lin(0, -100, 0, -14, coat, coatD)], [fHoof, hoofC], [hHoof, hoofC],
      [H.body, lin(0, -136, 0, -70, coatL, coat, coatD)], [H.neck, lin(30, -185, 75, -100, coatL, coat)],
      [H.head, lin(66, -205, 118, -128, coatL, coat)]]);
    turn(72, -196, -flick, () => { ctx.fillStyle = lin(0, -215, 0, -198, '#f0b4a0', '#c8806a'); ctx.fill(H.earIn); });
    shoeAt(38, 54); shoeAt(-66, -50);

    // coat shading
    clipIn(H.body, () => {
      soft(-14, -70, 86, 16, '#6a2e14', 0.5);
      soft(-44, -124, 30, 8, '#ffffff', 0.35);
      soft(20, -122, 22, 6, '#ffffff', 0.25);
      soft(-56, -104, 22, 22, '#ffffff', 0.14);
    });
    clipIn(H.hLeg, () => { ctx.fillStyle = '#fbf3e8'; ctx.fill(H.sock); soft(-60, -38, 4, 8, '#ffffff', 0.3); });
    clipIn(H.neck, () => { soft(82, -124, 14, 34, '#6a2e14', 0.35, -0.4); soft(48, -156, 8, 26, '#ffffff', 0.25, 0.65); });
    pen('M-48,-120 C-36,-104 -38,-88 -52,-78', coatD, 2.2);      // haunch
    pen('M36,-116 C30,-102 32,-90 42,-84', coatD, 2);            // shoulder
    pen('M41,-49 C44,-46 49,-46 54,-49', coatD, 1.6);            // knees
    pen('M-69,-44 C-64,-41 -58,-42 -52,-45', coatD, 1.6);        // hock

    // head details
    clipIn(H.head, () => {
      ctx.fillStyle = '#fbf3e8'; ctx.fill(H.blaze);
      soft(116, -138, 20, 17, '#7c4a40', 0.9);
      soft(76, -164, 12, 12, '#6a2e14', 0.3);
      soft(96, -192, 12, 5, '#ffffff', 0.35, 0.75);
    });
    pen('M68,-168 C72,-156 82,-148 92,-145', coatD, 2);           // cheek
    ctx.fillStyle = '#2e1a18'; ellipse(118, -144, 2.8, 4, -0.5);   // nostril
    pen('M112,-150 C116,-154 121,-152 123,-147', OL, 1.6);
    pen('M107,-133 C111,-131 117,-131 121,-134', OL, 1.8);         // smile
    eye(87, -177, 5.6, 6.6, t, 0.4, '#6a3416', OL);

    // mane + forelock
    const mane = manePath([64, -198], [40, -186], [16, -152], [2, -120], 8, 17, t);
    mass(LW * 0.85, [[mane, lin(20, -195, 50, -110, hairL, hair)]]);
    pen('M58,-190 C44,-178 32,-160 22,-138', '#8a5c44', 1.8);
    pen('M44,-182 C32,-168 22,-150 14,-130', '#8a5c44', 1.3);
    turn(72, -204, Math.sin(t * 1.4) * 0.05, () => mass(LW * 0.7, [[H.fore, hair]]));
    turn(72, -196, -flick, () => { mass(LW, [[H.ear, coat]]); ctx.fillStyle = lin(0, -215, 0, -198, '#f0b4a0', '#c8806a'); ctx.fill(H.earIn); });
    ctx.restore();
  };

  // ---------------------------------------------------------------------------------------------
  // DONKEY: short & stocky grey-brown, huge dark-tipped ears, pale nose & eye rings,
  // brush-up mane, shoulder cross, tufted tail
  // ---------------------------------------------------------------------------------------------
  const K = {
    body: D('M-64,-92 C-66,-114 -50,-123 -32,-121 C-14,-119 2,-114 18,-116 C38,-119 56,-111 60,-94 C64,-76 56,-56 38,-52 C14,-46 -20,-46 -44,-50 C-60,-54 -64,-74 -64,-92 Z'),
    neck: D('M4,-104 C10,-122 24,-138 44,-146 C58,-152 70,-144 72,-132 C74,-118 70,-106 64,-94 C58,-82 52,-74 46,-68 C32,-64 10,-78 4,-104 Z'),
    head: D('M42,-144 C40,-162 60,-170 75,-161 C88,-152 100,-136 109,-121 C117,-108 113,-91 98,-89 C86,-87 75,-91 67,-99 C56,-109 44,-124 42,-144 Z'),
    ear: D('M50,-152 C36,-166 32,-186 39,-197 C54,-195 67,-178 66,-155 Z'),
    earIn: D('M52,-158 C42,-170 39,-183 42,-190 C52,-186 60,-175 61,-160 Z'),
    fLeg: D('M28,-72 C30,-58 32,-42 33,-28 C33,-21 33,-16 32,-11 L47,-11 C47,-16 48,-21 48,-28 C49,-42 51,-56 54,-72 Z'),
    hLeg: D('M-64,-84 C-71,-64 -63,-50 -57,-42 C-54,-35 -54,-22 -54,-11 L-39,-11 C-39,-22 -38,-32 -38,-40 C-36,-50 -30,-62 -26,-76 Z'),
  };
  const kfHoof = hoof(32, 47, 11), khHoof = hoof(-54, -39, 11);

  // short upright brush mane along the crest
  function brushMane(t) {
    const a = [47, -150], b = [30, -140], c = [12, -126], d = [3, -104];
    const p = new Path2D();
    const n = 26;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const s = i / n, [x, y] = cubicAt(a, b, c, d, s);
      const [x2, y2] = cubicAt(a, b, c, d, Math.min(1, s + 0.01)), [x1, y1] = cubicAt(a, b, c, d, Math.max(0, s - 0.01));
      let nx = -(y2 - y1), ny = (x2 - x1); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; // outward normal (up/left)
      pts.push([x, y, nx, ny]);
    }
    const [x0, y0, nx0, ny0] = pts[0];
    p.moveTo(x0 - nx0 * 3, y0 - ny0 * 3);
    pts.forEach(([x, y, nx, ny], i) => {
      const h = (i % 2 ? 4 : 9) * (i < 3 ? 0.7 : 1) * (1 - Math.pow(i / n, 3) * 0.8) + (i % 2 ? 0 : Math.sin(t * 2 + i) * 0.6);
      p.lineTo(x + nx * h, y + ny * h);
    });
    for (let i = n; i >= 0; i--) { const [x, y, nx, ny] = pts[i]; p.lineTo(x - nx * 3, y - ny * 3); }
    p.closePath();
    return p;
  }

  ANIMAL_ART.donkey = t => {
    const coat = '#9c8e83', coatD = '#6c5f57', coatL = '#c3b7ac', far = '#6a5d55', pale = '#f1e9de';
    const hair = '#3f332d', hoofC = '#433634';
    const swish = Math.sin(t * 1.9) * 0.08 + twitch(t, 2.2, 4.6) * 0.18;
    const flickN = twitch(t, 0.8, 3.9) * 0.22, flickF = twitch(t, 2.4, 5.1) * 0.25;
    ctx.translate(2, 0);

    // far legs & far ear
    mass(LW, [[K.fLeg, far, -13], [kfHoof, '#2f2624', -13], [K.hLeg, far, 13], [khHoof, '#2f2624', 13]]);
    turn(60, -154, 0.42 + flickF, () => {
      mass(LW, [[K.ear, far, 4, 0]]);
      clipIn(K.ear, () => { ctx.fillStyle = '#2e2420'; ctx.fillRect(20, -210, 60, 30); }, 4, 0);
    });

    // tail: thin rope with a dark tuft at the end
    turn(-62, -100, swish, () => {
      const rope = 'M-62,-104 C-78,-100 -86,-86 -88,-66';
      pen(rope, OL, 10); pen(rope, coat, 4.6);
      const tuft = D('M-88,-72 C-80,-66 -80,-50 -84,-38 C-86,-34 -88,-30 -88,-26 C-92,-32 -96,-36 -96,-44 C-96,-56 -94,-66 -88,-72 Z');
      mass(LW * 0.85, [[tuft, lin(0, -72, 0, -26, '#5a4a42', hair)]]);
      pen('M-89,-62 C-91,-52 -91,-42 -89,-34', '#6e5c52', 1.5);
    });

    // main mass
    mass(LW, [[K.hLeg, lin(0, -84, 0, -11, coat, coatL)], [K.fLeg, lin(0, -72, 0, -11, coat, coatL)], [kfHoof, hoofC], [khHoof, hoofC],
      [K.body, lin(0, -122, 0, -50, coatL, coat, mix(coat, coatD, 0.4))], [K.neck, lin(20, -155, 60, -70, coatL, coat)],
      [K.head, lin(50, -176, 100, -100, coatL, coat)]]);

    // pale belly, leg insides, dorsal stripe & shoulder cross
    clipIn(K.body, () => {
      soft(-4, -46, 62, 12, pale, 0.7);
      soft(-28, -113, 28, 7, '#ffffff', 0.3);
      soft(-48, -94, 18, 18, '#ffffff', 0.15);
      ctx.globalAlpha = 0.75;
      pen('M-64,-110 C-44,-120 -20,-115 -2,-114 C8,-115 14,-117 20,-118', '#4e423b', 5);
      pen('M18,-118 C20,-104 22,-92 26,-80', '#4e423b', 5);
      ctx.globalAlpha = 1;
    });
    clipIn(K.neck, () => soft(68, -92, 14, 26, coatD, 0.3, -0.3));
    clipIn(K.fLeg, () => soft(40, -20, 10, 10, pale, 0.5));
    clipIn(K.hLeg, () => soft(-46, -20, 10, 10, pale, 0.5));
    pen('M-38,-106 C-28,-92 -30,-74 -42,-64', coatD, 2);
    pen('M-57,-40 C-53,-37 -47,-38 -42,-40', coatD, 1.5);

    // big head details: pale muzzle, eye ring, nostrils
    clipIn(K.head, () => {
      ctx.fillStyle = pale; ellipse(101, -104, 21, 19, -0.6);
      soft(101, -104, 30, 26, pale, 0.5, -0.6);
      soft(64, -120, 14, 12, coatD, 0.25);
      soft(70, -158, 12, 5, '#ffffff', 0.35, 0.6);
    });
    ctx.fillStyle = '#4a3a34'; ellipse(106, -110, 2.6, 4, -0.5);
    pen('M101,-115 C105,-119 110,-117 111,-112', coatD, 1.5);
    pen('M95,-96 C100,-93 106,-93 110,-96', OL, 1.8);
    pen('M56,-130 C60,-120 70,-110 80,-106', coatD, 1.8);
    ctx.fillStyle = pale; ellipse(73, -138, 10, 10.5);
    eye(74, -138, 5.4, 6.4, t, 1.7, '#5a3a24', OL);

    // near ear (in front of the head), mane, forelock
    const mane = brushMane(t);
    mass(LW * 0.75, [[mane, lin(10, -160, 30, -100, '#5a4a42', hair)]]);
    turn(58, -154, -0.06 - flickN, () => {
      mass(LW, [[K.ear, coat]]);
      clipIn(K.ear, () => {
        ctx.fillStyle = '#3a2e28'; ctx.fill(D('M20,-180 C34,-178 50,-180 76,-190 L76,-210 L20,-210 Z'));
      });
      ctx.fillStyle = lin(0, -192, 0, -166, '#e9cfc4', '#d2aea2'); ctx.fill(K.earIn);
      for (let i = 0; i < 6; i++) pen(`M${57 - i * 2},${-160 - i * 4.4} q${-3},${-2} ${-6},${-3}`, '#fffaf2', 1.6);
    });
  };

  // ---------------------------------------------------------------------------------------------
  // PIG: round pink body, snout disc with two nostrils, floppy ears, corkscrew tail, muddy legs
  // ---------------------------------------------------------------------------------------------
  const G = {
    body: D('M-94,-72 C-96,-110 -58,-130 -10,-130 C32,-130 58,-118 68,-98 C78,-80 72,-50 48,-38 C22,-27 -42,-27 -68,-35 C-86,-42 -94,-56 -94,-72 Z'),
    head: D('M34,-106 C38,-132 72,-140 90,-126 C104,-115 110,-102 110,-88 C110,-70 96,-56 78,-54 C58,-52 40,-62 33,-80 C30,-90 31,-98 34,-106 Z'),
    snout: D('M98,-104 C106,-106 114,-103 118,-98 L119,-71 C113,-66 105,-66 98,-68 Z'),
    ear: D('M54,-124 C56,-142 78,-152 98,-140 C95,-130 90,-121 83,-114 C74,-110 60,-114 54,-124 Z'),
    earIn: D('M60,-126 C64,-138 78,-144 92,-138 C88,-130 84,-124 79,-119 C72,-117 64,-119 60,-126 Z'),
    fLeg: D('M26,-44 C27,-30 28,-20 28,-10 L46,-10 C47,-20 48,-30 52,-44 Z'),
    hLeg: D('M-74,-46 C-72,-32 -70,-20 -70,-10 L-52,-10 C-52,-20 -50,-32 -46,-42 Z'),
    mud: D('M-80,-18 C-74,-23 -66,-17 -60,-21 C-54,-24 -48,-20 -44,-15 L-44,0 L-80,0 Z M20,-15 C26,-19 32,-13 38,-17 C44,-20 50,-17 54,-14 L54,0 L20,0 Z'),
  };
  const trotter = (x0, x1) => D(`M${x0},-11 L${x1},-11 C${x1 + 1},-6 ${x1 + 2},-2 ${x1 + 2},0 L${x0 - 2},0 C${x0 - 2},-3 ${x0 - 1},-7 ${x0},-11 Z`);
  const gfT = trotter(28, 46), ghT = trotter(-70, -52);

  ANIMAL_ART.pig = t => {
    const pink = '#f6a6b7', pinkL = '#ffd6de', pinkD = '#de8199', far = '#cf7389', trot = '#9a5f68';
    const mud = '#8a5a34', mudL = '#a87446';
    const wig = Math.sin(t * 3.2) * 0.12;
    const flick = twitch(t, 1.2, 3.4) * 0.22;
    const sniff = twitch(t, 0.3, 2.3) * 1.2;
    ctx.translate(-4, 0);

    // far legs (darker, muddy) & far ear
    mass(LW, [[G.fLeg, far, -16], [gfT, '#7a4650', -16], [G.hLeg, far, 16], [ghT, '#7a4650', 16]]);
    clipIn(G.fLeg, () => { ctx.translate(-16, 0); ctx.fillStyle = mix(mud, '#000000', 0.15); ctx.fill(G.mud); }, -16);
    clipIn(G.hLeg, () => { ctx.translate(16, 0); ctx.fillStyle = mix(mud, '#000000', 0.15); ctx.fill(G.mud); }, 16);
    turn(52, -124, -0.45 - flick * 0.5, () => mass(LW, [[G.ear, far, -10, 2]]));

    // corkscrew tail
    turn(-92, -86, wig, () => {
      const tail = 'M-92,-88 C-104,-90 -110,-100 -104,-108 C-98,-115 -88,-108 -93,-101 C-97,-96 -104,-98 -108,-103 C-110,-106 -112,-109 -110,-113';
      pen(tail, OL, 10); pen(tail, pinkD, 4.6);
    });

    // main mass
    mass(LW, [[G.hLeg, lin(0, -46, 0, -10, pink, pinkD)], [G.fLeg, lin(0, -46, 0, -10, pink, pinkD)], [gfT, trot], [ghT, trot],
      [G.body, lin(0, -130, 0, -24, pinkL, pink, pinkD)], [G.head, lin(60, -140, 80, -54, pinkL, pink)], [G.snout, lin(60, -140, 80, -54, pinkL, pink), sniff * 0.5]]);
    // trotter clefts
    pen('M37,-9 L37,-1', '#5e3840', 1.6); pen('M-61,-9 L-61,-1', '#5e3840', 1.6);
    // mud splotches on the legs + a splash on the haunch
    clipIn(G.fLeg, () => { ctx.fillStyle = mud; ctx.fill(G.mud); soft(34, -9, 5, 3, mudL, 0.8); });
    clipIn(G.hLeg, () => { ctx.fillStyle = mud; ctx.fill(G.mud); soft(-64, -9, 6, 3, mudL, 0.8); });

    // body shading: soft belly shadow, glossy back, a mud splash
    clipIn(G.body, () => {
      soft(-14, -30, 88, 20, '#c0607a', 0.45);
      soft(-30, -116, 46, 10, '#ffffff', 0.55);
      soft(-60, -88, 20, 22, '#ffffff', 0.2);
      ctx.fillStyle = mud; ellipse(-72, -52, 9, 6, 0.3); circle(-60, -48, 3); circle(-80, -64, 2.4);
      ctx.fillStyle = mudL; ellipse(-74, -54, 4, 2.4, 0.3);
    });
    pen('M-58,-106 C-50,-90 -52,-70 -62,-56', pinkD, 2);   // haunch
    pen('M30,-108 C26,-96 26,-84 30,-74', pinkD, 2);         // neck crease
    pen('M24,-102 C20,-92 20,-82 23,-74', pinkD, 1.5);
    for (let i = 0; i < 5; i++) pen(`M${-40 + i * 14},${-128 + Math.abs(i - 2)} l-2,-4`, pinkD, 1.2); // bristles

    // head details
    clipIn(G.head, () => {
      soft(90, -76, 12, 8, '#ff7f9a', 0.6);              // blush
      soft(70, -126, 18, 6, '#ffffff', 0.5, 0.3);
    });
    // snout disc
    ctx.save(); ctx.translate(sniff * 0.5, 0);
    clipIn(G.snout, () => soft(104, -74, 12, 6, '#c0607a', 0.4));
    inkEllipse(117, -85, 11.5, 15, 0, lin(110, -100, 120, -70, '#ffc2cf', '#f49cb0'), LW * 0.8);
    ctx.fillStyle = '#9a3a56'; ellipse(113.5, -86, 2.6, 4.6, 0.15); ellipse(121, -86, 2.4, 4.4, -0.15);
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.6; ellipse(114, -95, 4, 2, -0.2); ctx.globalAlpha = 1;
    ctx.restore();
    pen('M84,-64 C92,-60 100,-62 104,-67', OL, 2);      // smile
    eye(80, -101, 6, 7, t, 2.6, '#4a2a2a', OL);

    // near ear flops forward over the brow
    turn(56, -124, -flick, () => {
      mass(LW, [[G.ear, lin(60, -150, 90, -114, pinkL, pink)]]);
      ctx.fillStyle = lin(0, -144, 0, -118, '#f08aa2', '#e27894'); ctx.fill(G.earIn);
      pen('M66,-128 C74,-134 84,-136 90,-136', '#ffd6de', 1.4);
    });
  };

  // ---------------------------------------------------------------------------------------------
  // RABBIT: sitting brown-and-white farm bunny, tall ears, white blaze & collar, big hind feet,
  // cotton tail, whiskers and a twitchy nose
  // ---------------------------------------------------------------------------------------------
  const B = {
    body: D('M-88,-46 C-92,-84 -64,-112 -26,-112 C4,-112 26,-100 36,-80 C44,-60 40,-28 30,-14 C20,-2 -62,-2 -78,-14 C-86,-22 -88,-34 -88,-46 Z'),
    chest: D('M18,-102 C34,-106 52,-100 60,-82 C67,-62 63,-38 55,-18 C49,-8 32,-8 20,-12 C28,-28 26,-48 20,-62 C14,-76 12,-92 18,-102 Z'),
    head: D('M24,-118 C24,-144 46,-154 66,-152 C90,-148 104,-130 102,-110 C100,-90 84,-80 64,-80 C42,-80 24,-96 24,-118 Z'),
    ear: D('M0,-10 C20,-15 50,-14 70,-4 C73,-1 72,3 69,5 C50,13 20,12 0,10 Z'),
    earIn: D('M8,-5 C24,-8 48,-8 62,-2 C64,0 63,2 61,3 C46,7 24,7 8,5 Z'),
    foot: D('M-72,-14 C-72,-26 -48,-25 -18,-21 C2,-19 16,-15 18,-7 C19,0 12,0 2,0 L-66,0 C-72,0 -74,-6 -72,-14 Z'),
    paw: D('M42,-46 C44,-30 44,-16 44,-9 C44,-3 48,0 57,0 C66,0 69,-5 65,-10 C61,-14 59,-28 58,-46 Z'),
    blaze: D('M64,-152 C70,-144 76,-134 84,-124 C92,-114 104,-112 106,-100 C106,-88 90,-82 80,-86 C74,-96 70,-110 66,-124 C64,-134 62,-144 64,-152 Z'),
  };
  // fluffy cotton tail outline
  function puff(x, y, r, n, bump) {
    const p = new Path2D();
    for (let i = 0; i <= n; i++) {
      const a = i / n * Math.PI * 2, a2 = (i + 0.5) / n * Math.PI * 2;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i === 0) p.moveTo(px, py);
      else p.quadraticCurveTo(x + Math.cos(a2 - Math.PI / n) * (r + bump), y + Math.sin(a2 - Math.PI / n) * (r + bump), px, py);
    }
    p.closePath();
    return p;
  }

  ANIMAL_ART.rabbit = t => {
    const fur = '#a9774d', furL = '#d0a274', furD = '#7a5134', far = '#6c482e';
    const wht = '#fcf7ef', whtD = '#e2d6c6', pinkIn = '#f3b0ae';
    const nose = twitch(t, 0.2, 1.7) * 1.4 + twitch(t, 0.45, 1.7) * 1.0;
    const flick = twitch(t, 2.1, 4.4) * 0.16;
    const tailW = Math.sin(t * 2.4) * 0.8;
    ctx.translate(-2, 0);

    // ears (behind the head): far ear more upright, near ear leaning back
    const earAt = (x, y, a, fill, inner) => turn(x, y, a, () => {
      ctx.save(); ctx.translate(x, y); ctx.scale(0.86, 0.86);
      mass(LW, [[B.ear, fill]]);
      ctx.fillStyle = inner; ctx.fill(B.earIn);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill(D('M14,-6 C30,-9 46,-8 56,-4 C44,-5 28,-4 14,-2 Z'));
      ctx.restore();
    });
    earAt(60, -138, -1.98 + flick * 0.5, lin(40, -200, 60, -150, mix(far, '#000000', 0.15), far), '#c98a88');
    earAt(48, -136, -2.26 - flick, lin(10, -200, 50, -144, furL, fur), pinkIn);
    // far front paw
    mass(LW, [[B.paw, whtD, -14]]);

    // cotton tail
    const tail = puff(-86 + tailW * 0.4, -30 - tailW * 0.3, 14, 9, 4);
    mass(LW, [[tail, rad(-90, -36, 18, '#ffffff', whtD)]]);

    // main mass: body, chest, head, near foot & paw
    mass(LW, [[B.body, lin(0, -112, 0, -4, furL, fur, furD)], [B.foot, lin(0, -26, 0, 0, furL, fur)],
      [B.chest, wht], [B.paw, wht], [B.head, lin(40, -154, 70, -80, furL, fur)]]);

    // fur shading
    clipIn(B.body, () => {
      soft(-40, -100, 40, 12, '#ffffff', 0.35);
      soft(-20, -8, 70, 14, '#5a3420', 0.4);
      soft(10, -60, 18, 40, '#5a3420', 0.25);
    });
    clipIn(B.chest, () => { soft(30, -24, 20, 18, whtD, 0.9); soft(46, -90, 12, 8, whtD, 0.7); });
    clipIn(B.foot, () => { ctx.fillStyle = wht; ctx.fill(D('M-16,-30 C-10,-24 -14,-16 -10,-10 C-8,-6 -10,-2 -8,2 L30,2 L30,-30 Z')); soft(-40, -2, 40, 6, '#5a3420', 0.3); });
    pen('M-58,-58 C-50,-36 -30,-24 -6,-24', furD, 2.2);          // haunch line
    pen('M-38,-88 C-28,-90 -18,-92 -10,-90', furD, 1.4);         // fur tufts
    pen('M-62,-72 C-58,-78 -52,-82 -46,-84', furD, 1.4);
    pen('M8,-4 L8,0 M0,-4 L0,0', '#c7b8a6', 1.4);                 // toes
    pen('M58,-4 L58,0', '#c7b8a6', 1.3);

    // head: white blaze, cheek fluff, eye, nose & mouth
    clipIn(B.head, () => {
      ctx.fillStyle = wht; ctx.fill(B.blaze);
      soft(52, -136, 14, 5, '#ffffff', 0.4, -0.3);
      soft(44, -96, 14, 10, '#5a3420', 0.12);
    });
    pen('M30,-98 l-5,4 M33,-92 l-5,5', fur, 2);                   // cheek fluff
    eye(62, -118, 7, 8.4, t, 3.3, '#5a2a14', OL);
    ctx.save(); ctx.translate(0, -nose * 0.6);
    ctx.fillStyle = '#e88a98'; ctx.beginPath(); ctx.moveTo(97, -111); ctx.quadraticCurveTo(104, -113, 105, -108); ctx.quadraticCurveTo(102, -104, 99, -104); ctx.quadraticCurveTo(96, -107, 97, -111); ctx.fill();
    pen('M97,-111 Q104,-113 105,-108 Q102,-104 99,-104 Q96,-107 97,-111', OL, 1.4);
    ctx.restore();
    pen('M100,-104 L99,-97 M99,-97 C96,-93 92,-93 90,-95 M99,-97 C101,-93 104,-92 106,-94', OL, 1.7);
    // whiskers
    ctx.save(); ctx.translate(92, -100); ctx.rotate(nose * 0.03);
    ctx.globalAlpha = 0.75;
    pen('M2,-2 C10,-6 20,-8 28,-8 M2,1 C10,0 20,1 28,3 M2,3 C10,6 18,9 24,13', '#6a5a5a', 1.1);
    pen('M-4,-2 C-12,-6 -20,-6 -26,-5 M-4,1 C-12,1 -20,3 -24,6', '#6a5a5a', 1);
    ctx.globalAlpha = 1;
    ctx.restore();

  };
}
