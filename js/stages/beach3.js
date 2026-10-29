'use strict';
// Seashell Beach, game 1 replaced: Reef Photo Safari (action). Aubrey snorkels over the reef with
// Captain Pinch's waterproof camera. A clue names a sea animal by what makes it special (eight arms,
// a blowhole, a shell on its back...); she swims to it, frames it in the camera box and snaps.
// She has to pop up to the surface for air, like turtles and dolphins do, and dodge the jellyfish.
{
  const SURF = 148;               // the water's surface
  const BED = 486;                // the sandy sea floor
  const TOP_Y = SURF + 4, LOW_Y = 470;
  const VF = { dx: 112, hw: 78, hh: 64 }; // the camera box sits in front of her

  // ---- the sea animals ---------------------------------------------------------------
  const KINDS = {
    octopus:  { name: 'an octopus', clue: 'the animal with EIGHT arms', fact: 'An octopus! It has eight arms, and it can change colour to hide.' },
    puffer:   { name: 'a pufferfish', clue: 'the fish that puffs up like a ball', fact: 'A pufferfish! It gulps water to puff up big and spiky, so nobody eats it.' },
    seahorse: { name: 'a seahorse', clue: 'the fish with a curly tail', fact: 'A seahorse! It holds on with its curly tail, and the daddy carries the babies.' },
    seastar:  { name: 'a sea star', clue: 'the animal with FIVE arms', fact: 'A sea star! It has five arms, and it can grow a new arm if one breaks.' },
    turtle:   { name: 'a sea turtle', clue: 'the animal with a shell on its back', fact: 'A sea turtle! It swims up to the top to breathe air, just like you.' },
    clown:    { name: 'a clownfish', clue: 'the orange fish with white stripes', fact: 'A clownfish! It lives safe inside the stingy anemone.' },
    dolphin:  { name: 'a dolphin', clue: 'the animal that breathes through a hole on its head', fact: 'A dolphin! It is not a fish. It breathes air through the blowhole on its head.' },
    jelly:    { name: 'a jellyfish', clue: 'the animal with no bones and no brain', fact: 'A jellyfish! No bones and no brain. It stings, so look, but do not touch!' },
  };

  function drawOctopus(x, y, s, t, camo) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const col = mix('#ff7a4a', '#9a8a96', camo), dark = mix(col, '#5a2a3a', 0.35);
    ctx.lineCap = 'round';
    const arms = [];
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * (0.04 + i * 0.92 / 7), w = Math.sin(t * 2.4 + i * 0.9) * 8;
      arms.push([Math.cos(a) * 30, 2, Math.cos(a) * 52 + w, Math.sin(a) * 14 + 16, Math.cos(a) * 66 - w * 0.6, Math.sin(a) * 26 + 6 + w * 0.4]);
    }
    const armPath = a => { ctx.beginPath(); ctx.moveTo(a[0] * 0.5, -6); ctx.quadraticCurveTo(a[2], a[3], a[4], a[5]); ctx.stroke(); };
    ctx.strokeStyle = OL; ctx.lineWidth = 13; arms.forEach(armPath);
    ctx.strokeStyle = col; ctx.lineWidth = 8; arms.forEach(armPath);
    ctx.fillStyle = mix(col, '#fff', 0.5);
    for (const a of arms) for (const k of [0.45, 0.75]) circle(lerp(a[0] * 0.5, a[4], k), lerp(-6, a[5], k) + 3, 1.8);
    inkEllipse(0, -26, 31, 32, 0, col, 2.4);
    ctx.fillStyle = dark; for (const [sx, sy] of [[-12, -40], [10, -46], [16, -30], [-18, -24]]) circle(sx, sy, 3.2);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ellipse(-10, -42, 9, 6, -0.4);
    for (const ex of [-11, 11]) { inkCircle(ex, -14, 7, '#fff', 1.2); ctx.fillStyle = '#2a1a3a'; circle(ex + 1, -13, 3.6); }
    ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -4, 5, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  }

  function drawPuffer(x, y, s, dir, t, puff) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const r = 22 * (1 + puff * 0.55), col = '#f6cf55';
    ink(P2(`M${r - 4},0 L${r + 16},-12 L${r + 12},0 L${r + 16},12 Z`), '#e8a83a', 1.6);
    if (puff > 0.05) {
      ctx.strokeStyle = OL; ctx.lineWidth = 2.2;
      for (let i = 0; i < 14; i++) { const a = i * TAU / 14; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * (r + 9 * puff), Math.sin(a) * (r + 9 * puff)); ctx.stroke(); }
    }
    inkCircle(0, 0, r, col, 2.2);
    ctx.fillStyle = '#fff4c8'; ellipse(0, r * 0.45, r * 0.8, r * 0.45);
    ctx.fillStyle = '#b8862a'; for (const [sx, sy] of [[-6, -12], [6, -8], [-2, -2], [10, -16]]) circle(sx * r / 22, sy * r / 22, 2.4);
    ink(P2(`M${-2},${-r + 2} C4,${-r - 12} 12,${-r - 8} 10,${-r + 4} Z`), '#e8a83a', 1.4);
    inkCircle(-r * 0.5, -r * 0.2, 6, '#fff', 1.2); ctx.fillStyle = '#2a1a3a'; circle(-r * 0.55, -r * 0.2, 3.2);
    inkCircle(-r + 2, r * 0.15, 3.4, '#ff8a8a', 1);
    ctx.restore();
  }

  function drawSeahorse(x, y, s, dir, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.rotate(Math.sin(t * 1.6) * 0.06);
    const col = '#ffb347';
    const body = () => { ctx.beginPath(); ctx.moveTo(2, -30); ctx.bezierCurveTo(20, -18, 18, 8, 6, 20); ctx.bezierCurveTo(0, 28, 2, 40, 12, 40); ctx.bezierCurveTo(20, 40, 20, 30, 12, 31); ctx.stroke(); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 21; body();
    ctx.strokeStyle = col; ctx.lineWidth = 16; body();
    ctx.strokeStyle = OL; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-6, -36); ctx.lineTo(-26, -32); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-6, -36); ctx.lineTo(-25, -32); ctx.stroke();
    inkEllipse(0, -36, 12, 10, 0.2, col, 2);
    ink(P2('M2,-46 L6,-56 L10,-46 Z'), '#ff8a3a', 1.2);
    // fluttering back fin
    const f = Math.sin(t * 14) * 3;
    ink(P2(`M15,-8 C${28 + f},-12 ${28 - f},4 14,6 Z`), '#ffe08a', 1.4);
    ctx.strokeStyle = mix(col, '#a0501a', 0.5); ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) { const yy = -18 + i * 8; ctx.beginPath(); ctx.moveTo(4 + i * 0.4, yy); ctx.lineTo(13 - i * 0.6, yy + 1); ctx.stroke(); }
    inkCircle(-1, -38, 3.6, '#fff', 1); ctx.fillStyle = '#2a1a3a'; circle(-1.6, -38, 2);
    ctx.restore();
  }

  function drawSeaStar(x, y, s, rot, col = '#ff6f8f') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const p = new Path2D(), r = 30;
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.42 : r; p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    p.closePath(); ctx.lineJoin = 'round'; ink(p, col, 2.2);
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; for (const k of [0.35, 0.62]) circle(Math.cos(a) * r * k, Math.sin(a) * r * k, 2.2); }
    ctx.fillStyle = mix(col, '#7a2040', 0.4); circle(0, 0, 3);
    ctx.restore();
  }

  function drawTurtle(x, y, s, dir, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const sk = '#8fcf7a', pd = Math.sin(t * 3.2);
    // flippers behind the shell
    inkAt(-26, 14, 0.5 + pd * 0.3, P2('M0,0 C-6,10 -22,16 -30,12 C-24,4 -10,-2 0,0 Z'), sk, 1.6);
    inkAt(22, 16, -0.3 - pd * 0.5, P2('M0,0 C8,12 26,22 40,18 C30,6 12,-2 0,0 Z'), sk, 1.6);
    inkAt(-36, 2, 0, P2('M0,0 L-14,-4 L-14,5 Z'), sk, 1.2);
    // head
    inkEllipse(48, -4, 15, 11, 0.1, sk, 2);
    ctx.fillStyle = '#2a1a3a'; circle(54, -7, 2.6); ctx.fillStyle = '#fff'; circle(55, -8, 0.9);
    ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(56, -1, 4, 0.2, 1.6); ctx.stroke();
    // shell with plates
    inkEllipse(0, 0, 40, 25, 0, '#4f9a58', 2.4);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 40, 25, 0, 0, TAU); ctx.clip();
    ctx.strokeStyle = '#2f6a3a'; ctx.lineWidth = 2.4; ctx.fillStyle = '#66b46a';
    for (const [px, py] of [[0, -4], [-20, 2], [20, 2], [-10, -16], [10, -16], [-10, 16], [10, 16]]) {
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.lineTo(px + Math.cos(a) * 9, py + Math.sin(a) * 7); } ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ellipse(-8, -14, 16, 5, -0.15);
    inkAt(16, 22, 0.2 - pd * 0.3, P2('M0,0 C4,8 12,12 18,10 C14,4 8,0 0,0 Z'), sk, 1.4);
    ctx.restore();
  }

  function drawClown(x, y, s, dir, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s);
    const wag = Math.sin(t * 12) * 3;
    ink(P2(`M18,0 L32,${-10 + wag} L30,0 L32,${10 + wag} Z`), '#ff8a2a', 1.6);
    inkEllipse(0, 0, 22, 13, 0, '#ff8a2a', 2);
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 22, 13, 0, 0, TAU); ctx.clip();
    for (const sx of [-10, 3, 15]) { ctx.fillStyle = '#2a1a3a'; ctx.fillRect(sx - 4, -14, 8, 28); ctx.fillStyle = '#fff'; ctx.fillRect(sx - 2.6, -14, 5.2, 28); }
    ctx.restore();
    ink(P2('M-4,-12 C0,-20 8,-20 10,-12 Z'), '#ff8a2a', 1.2);
    inkCircle(-14, -3, 3.8, '#fff', 1); ctx.fillStyle = '#2a1a3a'; circle(-14.6, -3, 2);
    ctx.restore();
  }

  function drawAnemone(x, y, t, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = 'round';
    const arm = (i, n) => { const a = -Math.PI + (i + 0.5) * Math.PI / n, sw = Math.sin(t * 2 + i) * 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 18, -10); ctx.quadraticCurveTo(Math.cos(a) * 34 + sw, -24 + Math.sin(a) * 10, Math.cos(a) * 46 + sw * 1.4, -14 + Math.sin(a) * 40); ctx.stroke(); };
    ctx.strokeStyle = OL; ctx.lineWidth = 11; for (let i = 0; i < 11; i++) arm(i, 11);
    for (let i = 0; i < 11; i++) { ctx.strokeStyle = i % 2 ? '#ff7ac8' : '#c86af0'; ctx.lineWidth = 6.5; arm(i, 11); }
    ctx.fillStyle = '#ffe0f4'; for (let i = 0; i < 11; i++) { const a = -Math.PI + (i + 0.5) * Math.PI / 11, sw = Math.sin(t * 2 + i) * 6; circle(Math.cos(a) * 46 + sw * 1.4, -14 + Math.sin(a) * 40, 3.4); }
    inkEllipse(0, -4, 30, 12, 0, '#a24ac8', 2);
    ctx.restore();
  }

  function drawDolphin(x, y, s, dir, t, tilt = 0) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * dir, s); ctx.rotate(tilt);
    const fl = Math.sin(t * 6) * 0.25, col = '#86a8d0';
    inkAt(-58, 0, fl, P2('M0,0 L-18,-16 C-10,-6 -10,6 -18,16 Z'), col, 1.8);
    ink(P2('M-8,-24 C2,-40 14,-42 16,-40 C8,-34 6,-28 8,-22 Z'), col, 1.8);
    ink(P2('M-62,0 C-50,-14 -10,-30 30,-22 C48,-18 58,-10 66,-6 L82,-2 C82,2 76,4 64,4 C46,14 10,20 -24,12 C-40,8 -54,6 -62,0 Z'), col, 2.4);
    ctx.fillStyle = '#e4eef8'; ctx.beginPath(); ctx.moveTo(-40, 6); ctx.quadraticCurveTo(10, 22, 62, 3); ctx.quadraticCurveTo(10, 10, -40, 6); ctx.fill();
    ink(P2('M6,8 C12,18 22,22 28,22 C24,14 18,10 12,6 Z'), mix(col, '#4a6a9a', 0.3), 1.4);
    ctx.fillStyle = '#2a1a3a'; circle(52, -8, 2.8); ctx.fillStyle = '#fff'; circle(53, -9, 0.9);
    ctx.fillStyle = '#4a6a9a'; ellipse(30, -20, 3.2, 1.8, 0.2); // the blowhole
    ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(66, 1); ctx.quadraticCurveTo(72, 4, 80, 1); ctx.stroke();
    ctx.restore();
  }

  function drawJelly(x, y, s, t, ph) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const p = Math.sin(t * 3 + ph), bw = 30 + p * 4, bh = 24 - p * 3;
    const gr = ctx.createRadialGradient(0, 0, 4, 0, 0, 70); gr.addColorStop(0, 'rgba(255,190,240,.35)'); gr.addColorStop(1, 'rgba(255,190,240,0)');
    ctx.fillStyle = gr; ctx.fillRect(-70, -60, 140, 140);
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const sx = -20 + i * 10;
      ctx.strokeStyle = 'rgba(180,90,200,.75)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, 4); for (let k = 1; k <= 6; k++) ctx.lineTo(sx + Math.sin(t * 3 + i + k * 0.9 + ph) * 5, 4 + k * 10); ctx.stroke();
    }
    for (const sx of [-8, 8]) {
      ctx.strokeStyle = OL; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(sx, 2); ctx.quadraticCurveTo(sx + Math.sin(t * 2 + sx) * 8, 22, sx * 0.4, 40); ctx.stroke();
      ctx.strokeStyle = '#f0a8f0'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(sx, 2); ctx.quadraticCurveTo(sx + Math.sin(t * 2 + sx) * 8, 22, sx * 0.4, 40); ctx.stroke();
    }
    ctx.globalAlpha = 0.92;
    ink(P2(`M${-bw},4 C${-bw},${-bh * 1.6} ${bw},${-bh * 1.6} ${bw},4 C${bw * 0.5},0 ${bw * 0.2},8 0,4 C${-bw * 0.2},8 ${-bw * 0.5},0 ${-bw},4 Z`), '#e9a6ff', 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ellipse(-bw * 0.35, -bh * 0.7, bw * 0.3, bh * 0.22, -0.5);
    ctx.fillStyle = '#c070d8'; for (const sx of [-12, 0, 12]) circle(sx, -bh * 0.25, 3);
    ctx.restore();
  }

  const drawKind = (c, t, s = 1) => {
    const k = c.kind;
    if (k === 'octopus') drawOctopus(c.x, c.y + 18 * s, 0.9 * s, t, c.camo || 0);
    else if (k === 'puffer') drawPuffer(c.x, c.y, s, c.dir, t, c.puff || 0);
    else if (k === 'seahorse') drawSeahorse(c.x, c.y, s, c.dir, t);
    else if (k === 'seastar') drawSeaStar(c.x, c.y, 0.95 * s, c.rot || 0, c.col);
    else if (k === 'turtle') drawTurtle(c.x, c.y, 0.95 * s, c.dir, t);
    else if (k === 'clown') drawClown(c.x, c.y, s, c.dir, t);
    else if (k === 'dolphin') drawDolphin(c.x, c.y, 0.95 * s, c.dir, t, c.tilt || 0);
    else if (k === 'jelly') drawJelly(c.x, c.y, s, t, c.ph || 0);
  };
  const HIT_R = { octopus: 44, puffer: 32, seahorse: 30, seastar: 30, turtle: 46, clown: 24, dolphin: 56, jelly: 32 };

  // Aubrey, snorkelling: the running pose laid flat, with a mask, snorkel and flippers
  function drawSnorkeler(x, y, facing, t, hurt, surf) {
    const im = IMG[`run${1 + (Math.floor(t * 7) % 5)}`], s = 0.48, w = im.width * s, h = im.height * s, rot = surf ? 0.95 : 1.3;
    const hx = w * 0.06, hy = -h / 2 + h * 0.105;
    ctx.save(); ctx.translate(x, y);
    const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, 70); halo.addColorStop(0, 'rgba(255,255,255,.35)'); halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo; ctx.fillRect(-70, -70, 140, 140);
    if (hurt > 0 && Math.sin(t * 40) > 0) ctx.globalAlpha = 0.45;
    // the snorkel goes from her mouth straight up, so its tip pokes toward the air
    const c = Math.cos(rot), sn = Math.sin(rot), sx = facing * (hx * c - hy * sn), sy = hx * sn + hy * c;
    const tube = () => { ctx.beginPath(); ctx.moveTo(sx + facing * 4, sy + 6); ctx.quadraticCurveTo(sx - facing * 12, sy + 8, sx - facing * 10, sy - 6); ctx.lineTo(sx - facing * 10, sy - 34); ctx.stroke(); };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = OL; ctx.lineWidth = 10; tube();
    ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 6; tube();
    ctx.fillStyle = '#ff5fa8'; ctx.beginPath(); ctx.roundRect(sx - facing * 10 - 5, sy - 42, 10, 9, 3); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke();
    ctx.scale(facing, 1); ctx.rotate(rot);
    ctx.drawImage(im, -w / 2, -h / 2, w, h);
    // the mask over her eyes, with its strap
    ctx.strokeStyle = '#ff5fa8'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(hx - 14, hy - 2); ctx.lineTo(hx + 14, hy - 4); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(hx + 2, hy - 9, 17, 14, 5);
    ctx.fillStyle = 'rgba(170,230,255,.75)'; ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(hx + 5, hy - 6, 3, 6);
    ctx.restore();
  }

  // Captain Pinch's little rowboat bobbing on the surface
  function drawRowboat(g, x) {
    const by = SURF + Math.sin(S.t * 1.6) * 3, rk = Math.sin(S.t * 1.3) * 0.04;
    ctx.save(); ctx.translate(x, by); ctx.rotate(rk);
    if (g.loc?.npc) drawCritter(g.loc.npc.name, 0, -6, 0.36, -1);
    ink(P2('M-62,-14 L62,-14 C56,4 40,12 0,12 C-40,12 -56,4 -62,-14 Z'), '#c47a3e', 2.4);
    ctx.fillStyle = '#ffd23a'; ctx.fillRect(-60, -12, 120, 4);
    ctx.fillStyle = '#e8a050'; ctx.fillRect(-46, -4, 92, 3);
    ctx.restore();
  }

  // the reef behind everything: far coral shapes, rocks, kelp, sand
  function drawReef(g) {
    const sky = ctx.createLinearGradient(0, 0, 0, SURF);
    sky.addColorStop(0, '#8fdcff'); sky.addColorStop(1, '#d8f4ff');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, SURF + 6);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; for (const [cx, cy, r] of [[600, 126, 14], [626, 120, 18], [652, 127, 13], [90, 124, 12], [112, 119, 15]]) circle(cx + Math.sin(S.t * 0.2) * 10, cy, r);
    // a little far-away island with a palm tree
    ink(P2(`M300,${SURF} C320,${SURF - 18} 420,${SURF - 22} 460,${SURF} Z`), '#f4dd9e', 1.4);
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(382, SURF - 16); ctx.quadraticCurveTo(388, SURF - 34, 380, SURF - 50); ctx.stroke();
    ctx.strokeStyle = '#a8703a'; ctx.lineWidth = 3; ctx.stroke();
    for (const a of [-2.6, -2, -1.2, -0.5, 0.2]) { const sw = Math.sin(S.t * 1.4 + a) * 0.06; inkAt(380, SURF - 50, a + sw, P2('M0,0 C8,-8 20,-6 28,4 C18,0 8,2 0,0 Z'), '#4fb86a', 1); }
    const sea = ctx.createLinearGradient(0, SURF, 0, H);
    sea.addColorStop(0, '#5fd6f0'); sea.addColorStop(0.45, '#2ea6d8'); sea.addColorStop(1, '#1a5aa0');
    ctx.fillStyle = sea; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, SURF + Math.sin(x * 0.025 + S.t * 2) * 3.5);
    ctx.lineTo(W, H); ctx.fill();
    // sun rays through the water
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const x = (i * 190 + S.t * 10) % (W + 260) - 130, a = 0.05 + 0.03 * Math.sin(S.t * 0.8 + i);
      ctx.fillStyle = `rgba(255,255,230,${a})`; ctx.beginPath(); ctx.moveTo(x, SURF); ctx.lineTo(x + 60, SURF); ctx.lineTo(x + 170, H); ctx.lineTo(x + 70, H); ctx.fill();
    }
    ctx.restore();
    // far reef silhouettes for depth
    ctx.fillStyle = 'rgba(30,110,150,.45)';
    for (const f of g.farReef) { ctx.beginPath(); ctx.ellipse(f.x, BED - 4, f.r, f.h, 0, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = 'rgba(40,130,170,.5)';
    for (const f of g.farReef) for (let k = 0; k < 3; k++) { const bx = f.x - f.r * 0.5 + k * f.r * 0.5; ctx.fillRect(bx - 4, BED - f.h - 30 - k * 8, 8, 34); circle(bx, BED - f.h - 32 - k * 8, 8); }
    // swirling surface sparkle line
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, SURF + Math.sin(x * 0.025 + S.t * 2) * 3.5);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const x = (i * 113 + S.t * 18) % W; ctx.beginPath(); ctx.moveTo(x, SURF + 14); ctx.lineTo(x + 26, SURF + 14); ctx.stroke(); }
    // kelp
    ctx.lineCap = 'round';
    for (const w of g.kelp) {
      const pth = () => { ctx.beginPath(); ctx.moveTo(w.x, BED + 6); ctx.bezierCurveTo(w.x + Math.sin(S.t * 1.3 + w.x) * 16, BED - w.h * 0.35, w.x - Math.sin(S.t * 1.1 + w.x) * 16, BED - w.h * 0.7, w.x + Math.sin(S.t * 1.4 + w.x + 1) * 14, BED - w.h); ctx.stroke(); };
      ctx.strokeStyle = OL; ctx.lineWidth = 12; pth(); ctx.strokeStyle = w.c; ctx.lineWidth = 7.5; pth();
    }
    // sand floor with ripples, pebbles and tiny shells
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 30) ctx.lineTo(x, BED + Math.sin(x * 0.018) * 7);
    ctx.lineTo(W, H); ctx.closePath();
    ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.stroke();
    const sand = ctx.createLinearGradient(0, BED - 8, 0, H); sand.addColorStop(0, '#f4dd9e'); sand.addColorStop(1, '#d8b56a');
    ctx.fillStyle = sand; ctx.fill();
    ctx.strokeStyle = 'rgba(180,140,70,.45)'; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { const x = i * 84 + 20, y = BED + 22 + (i % 3) * 10; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 18, y - 5, x + 36, y); ctx.stroke(); }
    for (const p of g.pebbles) { ctx.fillStyle = p.c; ellipse(p.x, p.y, p.r, p.r * 0.6); }
    // rocks and corals
    for (const r of g.rocks) {
      inkEllipse(r.x, r.y, r.rx, r.ry, 0, '#8a86a0', 2.2);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ellipse(r.x - r.rx * 0.3, r.y - r.ry * 0.45, r.rx * 0.4, r.ry * 0.25);
      ctx.fillStyle = '#5fbf7a'; ellipse(r.x + r.rx * 0.25, r.y - r.ry * 0.8, r.rx * 0.3, 4);
    }
    for (const c of g.corals) {
      if (c.type === 'branch') {
        const br = () => { ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x, c.y - 30); ctx.moveTo(c.x, c.y - 18); ctx.lineTo(c.x - 18, c.y - 42); ctx.moveTo(c.x, c.y - 22); ctx.lineTo(c.x + 16, c.y - 48); ctx.moveTo(c.x, c.y - 30); ctx.lineTo(c.x + 2, c.y - 56); ctx.moveTo(c.x - 10, c.y - 30); ctx.lineTo(c.x - 26, c.y - 30); ctx.stroke(); };
        ctx.strokeStyle = OL; ctx.lineWidth = 13; br(); ctx.strokeStyle = c.col; ctx.lineWidth = 8; br();
      } else if (c.type === 'brain') {
        inkEllipse(c.x, c.y - 14, 30, 20, 0, c.col, 2.2);
        ctx.strokeStyle = mix(c.col, '#6a2a4a', 0.35); ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); for (let x = -22; x <= 22; x += 4) ctx.lineTo(c.x + x, c.y - 24 + k * 8 + Math.sin(x * 0.5 + k) * 2.5); ctx.stroke(); }
      } else {
        // sea fan
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(Math.sin(S.t * 0.9 + c.x) * 0.05);
        ink(P2('M0,0 C-30,-10 -40,-50 -20,-66 C-8,-76 8,-76 20,-66 C40,-50 30,-10 0,0 Z'), c.col, 2);
        ctx.strokeStyle = mix(c.col, '#ffffff', 0.4); ctx.lineWidth = 1.4;
        for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(k * 9, -62 + Math.abs(k) * 6); ctx.stroke(); }
        ctx.restore();
      }
    }
    drawAnemone(g.anem.x, g.anem.y, S.t, 1.05);
    // little fish schools wandering in the back (just scenery)
    for (const f of g.school) {
      const x = ((f.x + S.t * f.v) % (W + 200) + W + 200) % (W + 200) - 100, y = f.y + Math.sin(S.t * 1.5 + f.x) * 8;
      for (let k = 0; k < 4; k++) {
        const fx = x - k * 18 * Math.sign(f.v), fy = y + (k % 2 ? 8 : -6);
        ctx.fillStyle = f.c; ctx.beginPath(); ctx.ellipse(fx, fy, 8, 4, 0, 0, TAU); ctx.fill();
        tri(fx - 7 * Math.sign(f.v), fy, fx - 13 * Math.sign(f.v), fy - 5, fx - 13 * Math.sign(f.v), fy + 5);
      }
    }
    // rising bubbles
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.6;
    for (const b of g.bub) { ctx.beginPath(); ctx.arc(b.x + Math.sin(S.t * 3 + b.p) * 3, b.y, b.r, 0, TAU); ctx.stroke(); }
  }

  const posY = c => (c.kind === 'dolphin' ? c.drawY ?? c.y : c.y); // where the animal is drawn (the dolphin leaps)
  const inFrame = (g, c) => {
    const cx = g.x + g.facing * VF.dx, cy = g.y;
    return Math.abs(c.x - cx) < VF.hw + HIT_R[c.kind] * 0.35 && Math.abs(posY(c) - cy) < VF.hh + HIT_R[c.kind] * 0.35 && c.x > -20 && c.x < W + 20;
  };
  const framed = g => {
    let best = null, bd = 1e9;
    const cx = g.x + g.facing * VF.dx;
    for (const c of g.critters) if (inFrame(g, c)) { const d = Math.hypot(c.x - cx, posY(c) - g.y); if (d < bd) { bd = d; best = c; } }
    return best;
  };

  MG.reefsnapsafari = {
    kind: 'action', title: () => 'Reef Photo Safari', icon: () => '📷',
    how: () => 'Swim with the arrow keys or the mouse. Find the sea animal in the clue, get it inside your camera box, and press Space or click to snap! Swim up to the top for air, and don\'t touch the jellyfish!',
    init(g) {
      const T = g.tier - 1;
      const sp = [1, 1.25, 1.5][T];
      const critters = [
        { kind: 'octopus', x: 170, y: 446, home: 170, camo: 0, camoT: 0 },
        { kind: 'puffer', x: 300, y: 300, dir: 1, tx: 300, ty: 300, wT: 0, puff: 0 },
        { kind: 'seahorse', x: 838, y: 370, dir: -1, base: 370 },
        { kind: 'seastar', x: pick([360, 420, 700]), y: BED + 4, rot: rand(-0.4, 0.4), col: '#ff6f8f' },
        { kind: 'turtle', x: 480, y: 300, dir: 1, ang: rand(0, TAU) },
        { kind: 'clown', x: 600, y: 440, dir: 1, ang: 0 },
        { kind: 'dolphin', x: -120, y: 220, dir: 1, tilt: 0, leap: 0 },
      ];
      const nJ = [2, 3, 3][T];
      for (let i = 0; i < nJ; i++) critters.push({ kind: 'jelly', x: [250, 690, 470][i], y: 300, ph: rand(0, 6), bx: [250, 690, 470][i], by: [300, 260, 380][i] });
      const kinds = shuffle(Object.keys(KINDS)).slice(0, [5, 6, 7][T]);
      Object.assign(g, {
        sp, critters, targets: kinds, ti: 0, found: 0, wrong: 0, stings: 0, airOuts: 0,
        x: 380, y: TOP_Y, vx: 0, vy: 0, facing: 1, air: 1, airTime: [15, 13, 11][T], gasp: false, warned: false,
        hurt: 0, cool: 0, flash: 0, factT: 0, fact: '', hintT: 0, endT: -1, msgs: [], photos: [],
        timeLeft: [110, 110, 115][T],
        farReef: [[80, 60, 40], [300, 90, 56], [560, 70, 46], [820, 100, 60]].map(([x, r, h]) => ({ x, r, h })),
        kelp: [40, 96, 760, 800, 870, 920].map((x, i) => ({ x, h: 140 + (i % 3) * 50, c: ['#3fa66a', '#5fbf7a', '#2f8a5a'][i % 3] })),
        rocks: [{ x: 120, y: BED + 2, rx: 70, ry: 26 }, { x: 236, y: BED + 8, rx: 46, ry: 18 }],
        corals: [{ type: 'branch', x: 462, y: BED + 6, col: '#ff7a9a' }, { type: 'brain', x: 300, y: BED + 10, col: '#ffb070' }, { type: 'fan', x: 720, y: BED + 8, col: '#b07ae0' }, { type: 'branch', x: 900, y: BED + 8, col: '#ffd060' }, { type: 'brain', x: 540, y: BED + 14, col: '#7ad0b0' }],
        anem: { x: 610, y: BED + 4 },
        pebbles: Array.from({ length: 26 }, () => ({ x: rand(0, W), y: rand(BED + 14, H - 6), r: rand(2, 5), c: pick(['#c8a060', '#e8c88a', '#b08a5a', '#ffe8c0']) })),
        school: [{ x: 100, y: 200, v: 30, c: 'rgba(255,240,140,.6)' }, { x: 600, y: 350, v: -24, c: 'rgba(180,240,255,.55)' }],
        bub: Array.from({ length: 14 }, () => ({ x: rand(0, W), y: rand(SURF, H), r: rand(2, 5), p: rand(0, 6), v: rand(20, 50) })),
      });
      g.progress = `📷 Photos: 0 / ${kinds.length}`;
      g.say = this.clueLine(g);
    },
    clueLine: g => `Find ${KINDS[g.targets[g.ti]].clue}!`,
    target: g => g.critters.find(c => c.kind === g.targets[g.ti]),
    start(g) { speak(`Ready, camera! ${g.say}`); },
    update(g, dt) {
      g.timeLeft -= dt; g.cool -= dt; g.flash = Math.max(0, g.flash - dt * 3); g.hurt = Math.max(0, g.hurt - dt);
      g.factT = Math.max(0, g.factT - dt);
      if (g.endT >= 0) { g.endT += dt; if (g.endT > 2.2) g.done = true; }
      // --- swimming: keys push her, the mouse leads her; she can't go above the surface
      const sp = 270;
      if (g.gasp) {
        // out of air: she bobs up and has to catch her breath at the top before diving again
        g.vx *= 1 - dt * 4; g.vy = g.y > TOP_Y + 2 ? -320 : 0;
        if (g.y <= TOP_Y + 2 && g.air >= 0.7) g.gasp = false;
      } else {
        const ax = (goRight() ? 1 : 0) - (goLeft() ? 1 : 0), ay = (goDown() ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0);
        if (ax || ay) { g.vx = lerp(g.vx, ax * sp, dt * 6); g.vy = lerp(g.vy, ay * sp, dt * 6); }
        else if (pointerMoved(g) || g.usePointer) { g.vx = clamp((pointer.x - g.x) * 4, -sp, sp); g.vy = clamp((pointer.y - g.y) * 4, -sp, sp); }
        else { g.vx *= 1 - dt * 3; g.vy *= 1 - dt * 3; }
      }
      g.x = clamp(g.x + g.vx * dt, 50, W - 50); g.y = clamp(g.y + g.vy * dt, TOP_Y, LOW_Y);
      if (Math.abs(g.vx) > 25) g.facing = Math.sign(g.vx);
      // --- air: it runs down under water and fills up again at the top
      const surf = g.y <= TOP_Y + 14;
      if (surf) {
        if (g.air < 0.98 && Math.random() < dt * 6) burst(g.x + g.facing * 30, SURF - 10, 1, { colors: ['#ffffff', '#d8f4ff'], spread: 40, up: 60, size: [2, 4] });
        g.air = Math.min(1, g.air + dt / 1.2); g.warned = false;
      } else if (g.endT < 0 && !g.gasp) {
        g.air -= dt / g.airTime;
        if (g.air < 0.3 && !g.warned) { g.warned = true; speak('Swim up for air!'); floatText(g.x, g.y - 50, 'Air! Swim up! ⬆', '#fff', false, 22); }
        if (g.air <= 0) { g.air = 0; g.gasp = true; g.airOuts++; SFX.miss(); floatText(g.x, g.y - 50, 'Out of air!', '#ffd0d0', false, 22); }
      }
      if (!surf && Math.random() < dt * 2.5) g.bub.push({ x: g.x - g.facing * 10, y: g.y - 20, r: rand(2, 4), p: rand(0, 6), v: 60, mine: true });
      for (const b of g.bub) { b.y -= b.v * dt; if (b.y < SURF + 4) { if (b.mine) b.dead = true; else { b.y = H - 20; b.x = rand(0, W); } } }
      g.bub = g.bub.filter(b => !b.dead);
      // --- the animals go about their day
      const near = c => Math.hypot(c.x - g.x, c.y - g.y);
      for (const c of g.critters) {
        if (c.kind === 'octopus') {
          c.x = c.home + Math.sin(g.t * 0.35 * g.sp) * 70; c.y = 446 + Math.sin(g.t * 1.4) * 3;
          c.camoT -= dt; if (c.camoT <= 0) { c.camoT = rand(3, 6); c.camoTo = c.camoTo ? 0 : 0.85; }
          c.camo = lerp(c.camo, c.camoTo || 0, dt * 1.2);
        } else if (c.kind === 'puffer') {
          c.wT -= dt;
          if (c.wT <= 0 || Math.hypot(c.tx - c.x, c.ty - c.y) < 10) { c.wT = rand(3, 5); c.tx = rand(160, 800); c.ty = rand(225, 400); }
          const v = 40 * g.sp * (1 - c.puff * 0.7), d = Math.hypot(c.tx - c.x, c.ty - c.y) || 1;
          c.x += (c.tx - c.x) / d * v * dt; c.y += (c.ty - c.y) / d * v * dt;
          if (Math.abs(c.tx - c.x) > 4) c.dir = c.tx > c.x ? -1 : 1;
          c.puff = lerp(c.puff, near(c) < 170 ? 1 : 0, dt * 3);
        } else if (c.kind === 'seahorse') {
          c.y = c.base + Math.sin(g.t * 0.9 * g.sp) * 40;
        } else if (c.kind === 'turtle') {
          c.ang += dt * 0.26 * g.sp;
          const nx = 470 + Math.cos(c.ang) * 300, ny = 305 + Math.sin(c.ang) * 135;
          if (Math.abs(nx - c.x) > 0.1) c.dir = nx > c.x ? 1 : -1;
          c.x = nx; c.y = ny;
          if (ny < 185 && Math.random() < dt * 3) burst(c.x + c.dir * 40, SURF - 4, 1, { colors: ['#ffffff'], spread: 30, up: 50, size: [2, 4] });
        } else if (c.kind === 'clown') {
          c.ang += dt * 1.1 * g.sp;
          const nx = g.anem.x + Math.cos(c.ang) * 58, ny = g.anem.y - 44 + Math.sin(c.ang * 2) * 14;
          c.dir = nx > c.x ? -1 : 1; c.x = nx; c.y = ny;
        } else if (c.kind === 'dolphin') {
          c.x += c.dir * 150 * g.sp * dt;
          if (c.x > W + 160 || c.x < -160) { c.dir *= -1; c.y = rand(205, 280); }
          // leaping out of the water in the middle of the swim
          const mid = 1 - Math.abs(c.x - W / 2) / 240;
          c.leap = mid > 0 ? Math.sin(mid * Math.PI / 2) : 0;
          c.yy = c.y - c.leap * (c.y - SURF + 6);
          c.tilt = c.leap > 0 ? (c.x < W / 2 ? -0.35 : 0.35) * (c.dir > 0 ? 1 : -1) : 0;
        } else if (c.kind === 'jelly') {
          c.x = c.bx + Math.sin(g.t * 0.3 + c.ph) * 60;
          c.y = c.by + Math.sin(g.t * 0.55 * g.sp + c.ph) * 70;
        }
      }
      // the dolphin's drawn position includes its leap
      const dol = g.critters.find(c => c.kind === 'dolphin'); dol.drawY = dol.yy;
      // --- jellyfish sting if she bumps into one
      for (const c of g.critters) if (c.kind === 'jelly' && g.hurt <= 0 && Math.hypot(c.x - g.x, c.y + 10 - g.y) < 50) {
        g.hurt = 1.4; g.stings++; SFX.hit(); g.air = Math.max(0, g.air - 0.15);
        const a = Math.atan2(g.y - c.y, g.x - c.x); g.vx = Math.cos(a) * 380; g.vy = Math.sin(a) * 380;
        floatText(g.x, g.y - 50, 'Ouch! Jellyfish sting!', '#ffd0f0', false, 20);
      }
      // --- snap a photo
      const snap = pressed[' '] || pressed.enter || (pointer.clicked && !inRect({ x: W - 196, y: 10, w: 54, h: 48 }));
      if (snap && g.cool <= 0 && g.endT < 0) {
        g.cool = 0.6; g.flash = 1; tone(1400, 0.05, 'square', 0.06); tone(900, 0.08, 'square', 0.05, 0.05);
        const want = g.targets[g.ti], c = g.critters.find(k => k.kind === want && inFrame(g, k)) || framed(g); // the wanted one counts if it's anywhere in the box
        if (!c) floatText(g.x + g.facing * VF.dx, g.y, 'Nothing there!', '#fff', false, 18);
        else if (c.kind === want) {
          g.found++; g.photos.push({ kind: c.kind, t: 0, x: c.x, y: posY(c) });
          SFX.sparkle(); burst(c.x, posY(c), 18);
          g.fact = KINDS[want].fact; g.factT = 4.5; g.hintT = 0;
          g.ti++;
          if (g.ti >= g.targets.length) { g.endT = 0; speak(`${g.fact} You found them all!`); g.say = 'You found them all!'; }
          else { g.say = this.clueLine(g); speak(`${g.fact} Next, ${g.say}`); }
        } else {
          g.wrong++; SFX.miss();
          floatText(c.x, posY(c) - 40, `That's ${KINDS[c.kind].name}!`, '#fff', false, 20);
          speak(`That's ${KINDS[c.kind].name}! ${g.say}`);
        }
      }
      for (const p of g.photos) p.t += dt;
      g.hintT += dt;
      g.progress = `📷 Photos: ${g.found} / ${g.targets.length}`;
      g.score = clamp(g.found / g.targets.length - 0.05 * (g.wrong + g.stings + g.airOuts), 0, 1);
      if (g.timeLeft <= 0) { g.timeLeft = 0; g.done = true; }
    },
    draw(g) {
      drawReef(g);
      drawRowboat(g, 870);
      const tgt = g.endT < 0 ? this.target(g) : null;
      // after a while, a gentle sparkle helps her find the one in the clue
      if (tgt && g.hintT > 14) {
        const ty = posY(tgt);
        for (let i = 0; i < 4; i++) { const a = S.t * 2 + i * TAU / 4; star(tgt.x + Math.cos(a) * 50, ty + Math.sin(a) * 40, 7, '#fff6a8', 4); }
      }
      // animals: sand ones first, the dolphin last
      const order = ['seastar', 'octopus', 'clown', 'seahorse', 'puffer', 'turtle', 'jelly', 'dolphin'];
      for (const k of order) for (const c of g.critters) if (c.kind === k) {
        if (k === 'dolphin') { if (c.x > -140 && c.x < W + 140) drawKind({ ...c, y: c.drawY }, S.t); }
        else drawKind(c, S.t);
      }
      // Aubrey
      const surf = g.y <= TOP_Y + 14;
      drawSnorkeler(g.x, g.y + (surf ? Math.sin(S.t * 3) * 2 : 0), g.facing, g.t, g.hurt, surf);
      if (surf) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(g.x, SURF + 2, 46 + Math.sin(S.t * 4) * 4, 7, 0, 0, TAU); ctx.stroke(); }
      // camera box in front of her
      if (g.endT < 0) {
        const cx = g.x + g.facing * VF.dx, cy = g.y, on = framed(g);
        const col = on ? '#ffe04a' : 'rgba(255,255,255,.9)', L = 22, x0 = cx - VF.hw, x1 = cx + VF.hw, y0 = cy - VF.hh, y1 = cy + VF.hh;
        ctx.lineCap = 'round';
        for (const [lw, c] of [[7, 'rgba(40,30,80,.45)'], [4, col]]) {
          ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
          ctx.moveTo(x0, y0 + L); ctx.lineTo(x0, y0); ctx.lineTo(x0 + L, y0);
          ctx.moveTo(x1 - L, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + L);
          ctx.moveTo(x1, y1 - L); ctx.lineTo(x1, y1); ctx.lineTo(x1 - L, y1);
          ctx.moveTo(x0 + L, y1); ctx.lineTo(x0, y1); ctx.lineTo(x0, y1 - L);
          ctx.stroke();
        }
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8); ctx.stroke();
        if (on) emoji('📷', x1 - 4, y0 - 2, 22);
      }
      // photos fly up to Captain Pinch's boat
      for (const p of g.photos) if (p.t < 1.2) {
        const k = p.t / 1.2, e = k * k * (3 - 2 * k), x = lerp(p.x, 870, e), y = lerp(p.y, SURF - 30, e) - Math.sin(k * Math.PI) * 60;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(k * 8) * 0.2); ctx.scale(1 - k * 0.5, 1 - k * 0.5);
        rrect(-36, -36, 72, 80, 4, '#fff', OL, 2.5); ctx.fillStyle = '#7fd6f0'; ctx.fillRect(-30, -30, 60, 58);
        ctx.save(); ctx.beginPath(); ctx.rect(-30, -30, 60, 58); ctx.clip(); drawKind({ ...KIND_POSE[p.kind], kind: p.kind }, S.t, 0.6); ctx.restore();
        ctx.restore();
      }
      // flash
      if (g.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${g.flash * 0.55})`; ctx.fillRect(0, 0, W, H); }
      // --- air meter (top left) and the clue / fact card (top middle)
      darkPanel(12, 64, 176, 44, 20);
      text('Air', 28, 86, 16, '#fff', 'left', 700);
      for (let i = 0; i < 5; i++) {
        const full = g.air * 5 - i, bx = 74 + i * 22;
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, 86, 8, 0, TAU); ctx.stroke();
        if (full > 0) { ctx.fillStyle = g.air < 0.3 && Math.sin(S.t * 10) > 0 ? '#ff8a8a' : '#9fe6ff'; ctx.beginPath(); ctx.arc(bx, 86, 7 * clamp(full, 0.25, 1), 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(bx - 2.5, 83, 1.8); }
      }
      if (g.factT > 0) {
        const lines = wrap(g.fact, 520, 17);
        rrect(200, 64, 560, 18 + lines.length * 22, 18, 'rgba(255,250,235,.95)', '#ffb03a', 3);
        lines.forEach((l, i) => text(l, 480, 84 + i * 22, 17, '#5a2a6e', 'center', 700));
      } else if (g.endT < 0) {
        rrect(200, 64, 560, 44, 20, 'rgba(48,24,72,.8)', '#ffe04a', 2.5);
        emoji('📷', 226, 86, 22);
        const s = g.say.length > 46 ? 15 : 18;
        text(g.say, 492, 86, s, '#fff', 'center', 700);
      }
    },
  };
  // how each animal sits inside a little polaroid
  const KIND_POSE = { octopus: { x: 0, y: 4, camo: 0 }, puffer: { x: 0, y: 0, dir: 1, puff: 0.6 }, seahorse: { x: 0, y: 6, dir: -1 }, seastar: { x: 0, y: 0, rot: 0.2 },
    turtle: { x: -6, y: 0, dir: 1 }, clown: { x: 0, y: 0, dir: 1 }, dolphin: { x: -8, y: 4, dir: 1, tilt: 0 }, jelly: { x: 0, y: -8, ph: 0 } };

  restage('beach', {
    games: [['reefsnapsafari', 'shell', {}], ['pinchtreasuremap', 'ribbon', {}]],
    intro: [
      'N:Ahoy, matey! Under these waves be a whole reef full of wonders!',
      "N:Take me snorkel and me waterproof camera, and snap a picture of every sea critter on me list.",
      "N:Pop up for air now and then, like the turtles and dolphins do. And steer clear o' the jellyfish!",
      'A:excited:An underwater photo safari? Aye aye, Captain!',
    ],
    mid: [
      "N:What fine pictures! I'll hang 'em all over me cabin. Ye be a fine first mate.",
      'N:Now, long ago I buried me treasure... but I only remember the clues on me old map!',
      'N:Follow the arrows and count the steps, and we\'ll dig it up together!',
      'A:excited:A real treasure map? Let\'s dig!',
    ],
  });
}
