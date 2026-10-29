'use strict';
{
  // ===========================================================================
  // Whistlestop Junction (location slot 'duckpond'): a candy-striped toy-town railway station
  // in the hills, run by Conductor Rocco the raccoon. Animal passengers ride a smiley steam train.
  //   game 1 (action) Track Switcher: flip the points so every train reaches the stop whose sign
  //     spells its passenger's name. Teaches reading simple words (PIG, COW, CAT...) and planning ahead.
  //   game 2 (learn) Buddy Seats: help passengers sit two by two. Everyone has a buddy = EVEN,
  //     one left over = ODD. Teaches even and odd numbers (and counting pairs).
  // ===========================================================================

  // --- the friend --------------------------------------------------------------------------------
  CHARACTERS['Conductor Rocco'] = {
    col: '#a49eb4', face: '#f4f0f8', mask: '#3a3248', bw: 36, bh: 64, hr: 38,
    ears: 'pointy', earIn: '#3a3248', nose: 'button', noseCol: '#2a1a2a', whiskers: true,
    eyes: 'big', iris: '#6a4a2a', mouth: 'grin', tail: 'fox', tailCol: '#8a849a',
    bodyCol: '#3a5ab8', armCol: '#3a5ab8', handCol: '#a49eb4', legCol: '#2a3a7a', feetCol: '#2a1a2a',
    buttons: '#ffd84a', hat: 'cap', hatCol: '#2a3a7a', hatTilt: 0.05, neckwear: 'bowtie', tieCol: '#ff3f6a',
    hold: 'lantern', shape: 'pear', bigFeet: true, seed: 5.1,
  };
  const ROCCO = 'Conductor Rocco';

  // --- shared art --------------------------------------------------------------------------------
  // a smiley toy steam engine, side view facing right; (x, y) = rail level under its middle
  function jxEngine(x, y, s, col, o = {}) {
    const spin = o.spin ?? 0;
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const dark = mix(col, '#1a0830', 0.28);
    const cab = P2('M-74,-24 L-74,-86 L-26,-86 L-26,-24 Z');
    const roof = P2('M-82,-82 C-72,-102 -28,-102 -18,-82 Z');
    const boiler = new Path2D(); boiler.roundRect(-32, -66, 70, 44, 20);
    const chim = P2('M14,-62 L17,-84 L10,-96 L38,-96 L31,-84 L34,-62 Z');
    const dome = P2('M-14,-62 C-14,-78 6,-78 6,-62 Z');
    const base = new Path2D(); base.roundRect(-80, -32, 128, 13, 5);
    const catcher = P2('M40,-22 L60,-2 L40,-2 Z');
    // outline the whole engine first, then fill, so it reads as one chunky toy
    ctx.strokeStyle = OL; ctx.lineWidth = 6;
    for (const p of [cab, roof, boiler, chim, dome, base, catcher]) ctx.stroke(p);
    ctx.fillStyle = '#ffd84a'; ctx.fill(catcher);
    ctx.fillStyle = dark; ctx.fill(cab);
    ctx.fillStyle = vgradL(-66, -22, mix(col, '#ffffff', 0.3), col); ctx.fill(boiler);
    ctx.fillStyle = '#3a3248'; ctx.fill(chim); ctx.fill(base);
    ctx.fillStyle = '#ffd84a'; ctx.fill(dome);
    ctx.fillStyle = o.roof || '#ffd84a'; ctx.fill(roof);
    // gold bands, a shine and the cab window
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(-8, -65, 6, 42); ctx.fillRect(16, -65, 6, 42);
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ellipse(-14, -56, 12, 4, 0);
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(10, -96, 28, 5);
    inkRect(-66, -78, 30, 24, '#bfe8ff', 1.6, 6);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-62, -75, 7, 16);
    if (o.driver) emoji(o.driver, -50, -62, 22);
    // the happy face on the front
    inkCircle(40, -44, 16, '#fff3dc', 1.5);
    ctx.fillStyle = '#2a1430'; circle(36, -48, 2.6); circle(46, -48, 2.6);
    ctx.fillStyle = '#fff'; circle(36.8, -49, 0.9); circle(46.8, -49, 0.9);
    ctx.strokeStyle = '#2a1430'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(41, -42, 6, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,110,150,.55)'; circle(31, -40, 3); circle(51, -40, 3);
    // wheels with turning spokes and the connecting rod
    const wheel = (wx, r) => {
      inkCircle(wx, -r, r, '#e8484a', 1.6);
      ctx.strokeStyle = '#ffd0a0'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const a = spin + i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(wx - Math.cos(a) * r * 0.8, -r - Math.sin(a) * r * 0.8); ctx.lineTo(wx + Math.cos(a) * r * 0.8, -r + Math.sin(a) * r * 0.8); ctx.stroke(); }
      inkCircle(wx, -r, r * 0.3, '#ffd84a', 0.8);
    };
    wheel(-58, 14); wheel(-28, 14); wheel(2, 14); wheel(28, 9);
    const rx = Math.cos(spin) * 6, ry = Math.sin(spin) * 6;
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-58 + rx, -14 + ry); ctx.lineTo(2 + rx, -14 + ry); ctx.stroke();
    ctx.strokeStyle = '#d8dce8'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  // a little passenger carriage; the rider (emoji) is drawn by the caller so it stays big
  function jxCarriage(x, y, s, col, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.lineJoin = 'round';
    const body = new Path2D(); body.roundRect(-46, -70, 92, 50, 10);
    const roof = P2('M-52,-66 C-40,-86 40,-86 52,-66 Z');
    ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.stroke(body); ctx.stroke(roof);
    ctx.fillStyle = vgradL(-70, -20, mix(col, '#ffffff', 0.3), col); ctx.fill(body);
    ctx.fillStyle = '#fff3dc'; ctx.fill(roof);
    ctx.fillStyle = mix(col, '#1a0830', 0.2); ctx.fillRect(-44, -32, 88, 6);
    for (const wx of [-26, 26]) { inkCircle(wx, -12, 12, '#3a3248', 1.6); inkCircle(wx, -12, 4, '#ffd84a', 0.8); }
    ctx.restore();
  }
  // a puff of steam: a little cloud of three balls
  function jxPuff(x, y, r, a) {
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffffff';
    circle(x, y, r); circle(x - r * 0.7, y + r * 0.3, r * 0.7); circle(x + r * 0.7, y + r * 0.25, r * 0.75);
    ctx.fillStyle = 'rgba(200,215,240,.5)'; ellipse(x, y + r * 0.55, r * 1.1, r * 0.3);
    ctx.globalAlpha = 1;
  }
  const jxTree = (x, gy, r, col) => {
    inkRect(x - 4, gy - r * 1.6, 8, r * 1.6, '#9a6a3a', 1.2, 3);
    inkCircle(x, gy - r * 1.8, r, col, 1.3);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; circle(x - r * 0.35, gy - r * 2.1, r * 0.35);
  };

  // --- backdrop ----------------------------------------------------------------------------------
  BACKDROPS.junction_bg = () => {
    const t = S.t;
    bdSky('#7cc4ff', '#ffe4f0');
    bdSunburst(840, 104);
    bdClouds(4, 'rgba(255,255,255,.92)', 86);
    // far hills, with a lavender stone viaduct and a tiny train chugging across it
    bdHills('#b4dcc4', 300, 20, 0.006, 1.2);
    const VY = 246;
    ctx.save();
    ctx.fillStyle = '#d6c4e6'; ctx.fillRect(560, VY, 400, 12);
    for (let i = 0; i < 7; i++) {
      const ax = 572 + i * 58;
      ctx.fillStyle = '#d6c4e6'; ctx.fillRect(ax - 6, VY + 10, 12, 70);
      ctx.fillStyle = 'rgba(150,120,180,.35)'; ctx.beginPath(); ctx.arc(ax + 29, VY + 46, 22, Math.PI, 0); ctx.lineTo(ax + 51, VY + 80); ctx.lineTo(ax + 7, VY + 80); ctx.fill();
    }
    ctx.fillStyle = '#b8a4cc'; ctx.fillRect(560, VY - 3, 400, 4);
    ctx.beginPath(); ctx.rect(560, 120, 400, VY); ctx.clip();
    const tx = 520 + (t * 46) % 640;
    for (let k = 0; k < 3; k++) {
      const cx = tx - k * 30;
      rrect(cx - 13, VY - 18, 26, 16, 4, ['#ff5a6a', '#5fb8f0', '#ffd84a'][k]);
      ctx.fillStyle = '#3a3248'; circle(cx - 7, VY - 2, 3.5); circle(cx + 7, VY - 2, 3.5);
    }
    ctx.fillStyle = '#3a3248'; ctx.fillRect(tx + 4, VY - 26, 5, 8);
    for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i / 3) % 1; jxPuff(tx + 6 - k * 26, VY - 30 - k * 26, 4 + k * 6, 0.8 * (1 - k)); }
    ctx.restore();
    // mid hills with lollipop trees and flowers
    bdHills('#93d488', 352, 24, 0.009, 2.4);
    for (const [x, r, c] of [[34, 22, '#5fbf5a'], [262, 18, '#72cc66'], [316, 24, '#4fae52'], [690, 20, '#5fbf5a'], [770, 16, '#72cc66'], [940, 22, '#4fae52']]) {
      const gy = 352 - Math.sin(x * 0.009 + 2.4) * 24 - Math.sin(x * 0.009 * 2.3 + 2.4) * 24 * 0.4 + 10;
      jxTree(x, gy, r, c);
    }
    for (let i = 0; i < 18; i++) {
      const x = 20 + i * 53, y = 372 + (i * 37) % 30;
      ctx.fillStyle = ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff'][i % 4]; circle(x, y, 3.2);
    }
    // back platform the station stands on
    rrect(-10, 404, W + 20, 16, 4, '#d8b6e8', OL, 2.5);

    // --- the station: cream walls, a candy-striped awning and the clock tower -------------
    const SX = 340, SW = 290;
    // clock tower behind the awning
    const tower = new Path2D(); tower.rect(446, 96, 80, 120);
    const spire = P2('M436,100 L486,62 L536,100 Z');
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(tower); ctx.stroke(spire);
    ctx.fillStyle = '#7ad0d8'; ctx.fill(tower);
    ctx.fillStyle = '#ff6f8a'; ctx.fill(spire);
    ctx.fillStyle = '#fff3dc'; for (let i = 0; i < 4; i++) circle(452 + i * 23, 99, 4);
    // the clock, its hands really turning
    inkCircle(486, 146, 30, '#fffaf0', 2);
    ctx.fillStyle = OL; for (let i = 0; i < 12; i++) { const a = i * TAU / 12; circle(486 + Math.cos(a) * 24, 146 + Math.sin(a) * 24, i % 3 ? 1.4 : 2.6); }
    const hand = (a, len, lw) => { ctx.strokeStyle = OL; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(486, 146); ctx.lineTo(486 + Math.sin(a) * len, 146 - Math.cos(a) * len); ctx.stroke(); };
    hand(t * 0.5, 21, 3); hand(t * 0.5 / 12 + 1.2, 13, 4.5);
    inkCircle(486, 146, 3.5, '#ff6f8a', 0.8);
    // a golden bell swinging in the belfry
    const sw = Math.sin(t * 2.2) * 0.25;
    ctx.save(); ctx.translate(486, 182); ctx.rotate(sw);
    ink(P2('M-10,0 C-10,-16 10,-16 10,0 L13,8 L-13,8 Z'), '#ffd84a', 1.2); inkCircle(0, 10, 3, '#e8a830', 0.6);
    ctx.restore();
    // walls
    inkRect(SX, 228, SW, 180, '#fff1dc', 2.5, 6);
    ctx.fillStyle = '#f2c8a8'; for (let r = 0; r < 3; r++) for (let i = 0; i < 12; i++) ctx.fillRect(SX + 6 + i * 24 + (r % 2) * 12, 372 + r * 11, 18, 7);
    // awning: red and white stripes with a scalloped edge
    const awn = P2(`M${SX - 22},236 L${SX + 14},196 L${SX + SW - 14},196 L${SX + SW + 22},236 Z`);
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(awn);
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc(SX - 10 + i * 28.5, 236, 14.25, 0, Math.PI); ctx.stroke(); }
    ctx.save(); ctx.clip(awn);
    for (let i = 0; i < 18; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#ff5a6a'; ctx.fillRect(SX - 30 + i * 20, 190, 20, 50); }
    ctx.restore();
    for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#ff5a6a'; ctx.beginPath(); ctx.arc(SX - 10 + i * 28.5, 236, 13, 0, Math.PI); ctx.fill(); }
    // name board
    inkRect(SX + 70, 254, 150, 30, '#8a5a3a', 1.6, 8);
    text('WHISTLESTOP', SX + 145, 270, 17, '#fff3c8', 'center', 700);
    // arched windows with flower boxes, and the round-topped door
    for (const wx of [SX + 38, SX + 212]) {
      ink(P2(`M${wx},350 L${wx},306 C${wx},284 ${wx + 40},284 ${wx + 40},306 L${wx + 40},350 Z`), '#bfe8ff', 1.4);
      ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx + 20, 288); ctx.lineTo(wx + 20, 350); ctx.moveTo(wx, 318); ctx.lineTo(wx + 40, 318); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(wx + 4, 300, 6, 14);
      inkRect(wx - 6, 350, 52, 12, '#a86a3a', 1.2, 3);
      for (let i = 0; i < 4; i++) flower(wx + i * 14, 347 - (i % 2) * 3, 5.5, ['#ff6fae', '#ffd84a', '#c6a2ff', '#ffffff'][i], '#ff9a3d', 1);
    }
    ink(P2(`M${SX + 120},406 L${SX + 120},330 C${SX + 120},300 ${SX + 170},300 ${SX + 170},330 L${SX + 170},406 Z`), '#5fb87a', 1.4);
    inkCircle(SX + 145, 326, 9, '#bfe8ff', 0.8);
    inkCircle(SX + 162, 370, 3.5, '#ffd84a', 0.6);
    // bunting from the lamp posts to the awning
    const bunt = (x0, y0, x1, y1) => {
      ctx.strokeStyle = OL; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 18, x1, y1); ctx.stroke();
      for (let i = 1; i < 7; i++) {
        const k = i / 7, bx = lerp(x0, x1, k), by = lerp(y0, y1, k) + Math.sin(k * Math.PI) * 9, fl = Math.sin(t * 4 + i) * 2;
        ctx.fillStyle = ['#ff6fae', '#ffd84a', '#5fb8f0', '#7ad86a', '#c6a2ff', '#ff9a3a'][i % 6];
        tri(bx - 6, by, bx + 6, by, bx + fl, by + 14);
      }
    };
    bunt(306, 254, SX + 4, 214); bunt(SX + SW - 4, 214, 664, 254);
    // lamp posts with hanging flower baskets
    for (const lx of [306, 664]) {
      inkRect(lx - 3, 254, 6, 152, '#3a5ab8', 1.2, 2);
      ink(P2(`M${lx - 12},256 L${lx + 12},256 L${lx + 8},238 L${lx - 8},238 Z`), '#fff6c0', 1.2);
      ctx.fillStyle = `rgba(255,240,150,${0.25 + 0.15 * Math.sin(t * 3 + lx)})`; circle(lx, 247, 18);
      inkRect(lx - 14, 234, 28, 5, '#3a5ab8', 1, 2);
      inkEllipse(lx + 18, 292, 13, 8, 0, '#a86a3a', 1.1);
      ctx.strokeStyle = OL; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(lx, 276); ctx.lineTo(lx + 18, 276); ctx.lineTo(lx + 18, 284); ctx.stroke();
      for (let i = 0; i < 3; i++) flower(lx + 10 + i * 8, 287 - (i === 1 ? 4 : 0), 5, ['#ff6fae', '#ffffff', '#c6a2ff'][i], '#ffd84a', 1);
    }
    // the signal: red and green lamps that swap now and then
    inkRect(692, 196, 8, 210, '#5a5a6a', 1.2, 2);
    inkRect(678, 166, 36, 62, '#3a3248', 1.6, 10);
    const go = Math.sin(t * 0.7) > 0;
    ctx.fillStyle = go ? '#4a2a2a' : '#ff4a4a'; circle(696, 182, 9);
    ctx.fillStyle = go ? '#5aff7a' : '#1a3a2a'; circle(696, 211, 9);
    const gl = go ? [696, 211, '120,255,150'] : [696, 182, '255,90,90'];
    const gg = ctx.createRadialGradient(gl[0], gl[1], 2, gl[0], gl[1], 28); gg.addColorStop(0, `rgba(${gl[2]},.6)`); gg.addColorStop(1, `rgba(${gl[2]},0)`);
    ctx.fillStyle = gg; circle(gl[0], gl[1], 28);
    // polka-dot water tower, dripping
    for (const lx of [828, 892]) inkRect(lx - 4, 300, 8, 106, '#a86a3a', 1.1, 2);
    ctx.strokeStyle = '#a86a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(828, 330); ctx.lineTo(892, 380); ctx.moveTo(892, 330); ctx.lineTo(828, 380); ctx.stroke();
    const tank = new Path2D(); tank.roundRect(808, 222, 104, 82, 16);
    const troof = P2('M800,226 L860,186 L920,226 Z');
    ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke(tank); ctx.stroke(troof);
    ctx.fillStyle = '#ff9ac0'; ctx.fill(tank); ctx.fillStyle = '#7a5ac8'; ctx.fill(troof);
    ctx.save(); ctx.clip(tank); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 12; i++) circle(818 + (i * 37) % 96, 234 + (i * 23) % 64, 6); ctx.restore();
    ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(808, 290); ctx.lineTo(786, 290); ctx.lineTo(786, 304); ctx.stroke();
    ctx.strokeStyle = '#5a5a6a'; ctx.lineWidth = 4; ctx.stroke();
    const dk = (t * 0.9) % 1; ctx.fillStyle = '#7ac8ff'; ellipse(786, 310 + dk * 90, 3, 4.5);
    // suitcases waiting at the end of the platform
    inkRect(910, 372, 44, 34, '#ff9a3a', 1.4, 5); inkRect(916, 348, 34, 24, '#5fb8f0', 1.4, 5); inkRect(922, 330, 22, 18, '#c6a2ff', 1.2, 4);
    ctx.fillStyle = '#fff'; circle(930, 388, 5); star(934, 360, 5, '#ffe36b', 5);

    // --- the track ----------------------------------------------------------------------------
    ctx.fillStyle = '#c8b49a'; ctx.fillRect(0, 418, W, 28);
    ctx.fillStyle = 'rgba(120,90,70,.25)'; for (let i = 0; i < 60; i++) circle((i * 71) % W, 422 + (i * 13) % 22, 1.6);
    for (let x = 6; x < W; x += 26) inkRect(x, 421, 16, 22, '#9a6a4a', 1, 2);
    for (const ry of [425, 439]) { ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(W, ry); ctx.stroke(); ctx.strokeStyle = '#dfe3ee'; ctx.lineWidth = 2.5; ctx.stroke(); }

    // the parked engine at the left, puffing steam
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.45 + i / 6) % 1;
      jxPuff(150 + k * 40 + Math.sin(k * 6 + i) * 8, 266 - k * 150, 10 + k * 22, 0.85 * (1 - k));
    }
    jxEngine(108, 440, 1.5, '#ff5a6a', { spin: 0.3, roof: '#5fb8f0' });

    // --- the front platform, where Aubrey and Rocco stand -------------------------------
    const pg = ctx.createLinearGradient(0, 446, 0, H);
    pg.addColorStop(0, '#f2c890'); pg.addColorStop(1, '#e0a870');
    ctx.fillStyle = pg; ctx.fillRect(0, 446, W, H - 446);
    ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 446); ctx.lineTo(W, 446); ctx.stroke();
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(0, 450, W, 7);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let x = 8; x < W; x += 22) circle(x, 453.5, 1.8);
    ctx.strokeStyle = 'rgba(140,80,40,.28)'; ctx.lineWidth = 2;
    for (const y of [476, 504, 530]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    for (let i = 0; i < 22; i++) { const y = [460, 490, 518][i % 3], x = (i * 97 + (i % 3) * 40) % W; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 14); ctx.stroke(); }
    // a few tiny flowers poking up between the boards
    for (const [x, y, c] of [[40, 528, '#ff6fae'], [430, 534, '#c6a2ff'], [600, 530, '#ffffff'], [918, 526, '#ffd84a']]) flower(x, y, 5, c, '#ffd84a', 1);
    // birds
    for (let i = 0; i < 2; i++) {
      const bx = (t * 30 + i * 380) % (W + 100) - 50, by = 150 + i * 30 + Math.sin(t * 2 + i) * 8, f = Math.sin(t * 8 + i) * 5;
      ctx.strokeStyle = OL; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(bx - 9, by - f); ctx.quadraticCurveTo(bx - 4, by - 4, bx, by); ctx.quadraticCurveTo(bx + 4, by - 4, bx + 9, by - f); ctx.stroke();
    }
  };

  // shared bits for the games
  const zone = (id, x, y, w, h, key = null) => buttons.push({ id, x, y, w, h, on: true, key });
  const toot = () => { tone(520, 0.22, 'square', 0.04); tone(660, 0.3, 'square', 0.035, 0.05); };

  // ===========================================================================
  // Game 1: Track Switcher. Trains roll out of the tunnel carrying one animal each. Flip the
  // switch levers so each train reaches the stop whose sign spells that animal's name.
  // ===========================================================================
  const TS_ANIMALS = [['PIG', '🐷'], ['COW', '🐮'], ['CAT', '🐱'], ['DOG', '🐶'], ['HEN', '🐔'], ['FOX', '🦊']];
  const TS_COLS = ['#ff5a6a', '#5fb8f0', '#7ad86a', '#c68af0', '#ff9a3a', '#ffcf3a'];
  const TS_STOP = 846;
  // points from a to b joined by a smooth S-bend (level at both ends) or a straight line
  function tsPath(...wps) {
    const pts = [{ x: wps[0][0], y: wps[0][1], d: 0 }];
    const push = (x, y) => { const p = pts[pts.length - 1]; pts.push({ x, y, d: p.d + Math.hypot(x - p.x, y - p.y) }); };
    for (let i = 1; i < wps.length; i++) {
      const [ax, ay] = wps[i - 1], [bx, by] = wps[i];
      if (ay === by) { const n = Math.max(1, Math.round((bx - ax) / 16)); for (let k = 1; k <= n; k++) push(lerp(ax, bx, k / n), ay); continue; }
      const kx = (bx - ax) * 0.5;
      for (let k = 1; k <= 36; k++) {
        const u = k / 36, v = 1 - u;
        push(v * v * v * ax + 3 * v * v * u * (ax + kx) + 3 * v * u * u * (bx - kx) + u * u * u * bx, v * v * v * ay + 3 * v * v * u * ay + 3 * v * u * u * by + u * u * u * by);
      }
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      pts[i].tx = (b.x - a.x) / l; pts[i].ty = (b.y - a.y) / l;
    }
    return pts;
  }
  function tsAt(e, d) {
    const p = e.pts; d = clamp(d, 0, e.len);
    let lo = 0, hi = p.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p[m].d < d) lo = m; else hi = m; }
    const a = p[lo], b = p[hi], k = b.d > a.d ? (d - a.d) / (b.d - a.d) : 0;
    return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), a: Math.atan2(lerp(a.ty, b.ty, k), lerp(a.tx, b.tx, k)) };
  }
  function tsBuild(g) {
    const edges = [], out = {};
    const add = (from, to, ...wps) => { const pts = tsPath(...wps), e = { from, to, pts, len: pts[pts.length - 1].d }; edges.push(e); (out[from] ||= []).push(e); return e; };
    let plat, sws, levers;
    const S0 = [200, 300];
    if (g.tier === 1) {
      const S2 = [450, 400];
      plat = [150, 320, 470];
      add('E', 'S0', [-110, 300], S0);
      add('S0', 'P0', S0, [640, 150], [TS_STOP, 150]); add('S0', 'S2', S0, S2);
      add('S2', 'P1', S2, [640, 320], [TS_STOP, 320]); add('S2', 'P2', S2, [640, 470], [TS_STOP, 470]);
      sws = ['S0', 'S2']; levers = { S0: [120, 372], S2: [392, 470] };
    } else {
      const S1 = [450, 190], S2 = [450, 410];
      plat = [125, 245, 355, 475];
      add('E', 'S0', [-110, 300], S0);
      add('S0', 'S1', S0, S1); add('S0', 'S2', S0, S2);
      add('S1', 'P0', S1, [640, 125], [TS_STOP, 125]); add('S1', 'P1', S1, [640, 245], [TS_STOP, 245]);
      add('S2', 'P2', S2, [640, 355], [TS_STOP, 355]); add('S2', 'P3', S2, [640, 475], [TS_STOP, 475]);
      sws = ['S0', 'S1', 'S2']; levers = { S0: [120, 372], S1: [394, 262], S2: [394, 478] };
    }
    // which way each switch must point for each stop
    const route = plat.map(() => ({}));
    const walk = (node, set) => {
      if (node[0] === 'P') { Object.assign(route[+node.slice(1)], set); return; }
      (out[node] || []).forEach((e, i) => walk(e.to, node[0] === 'S' ? { ...set, [node]: i } : set));
    };
    walk('E', {});
    Object.assign(g, { edges, out, plat, sws, levers, route });
  }

  MG.trackswitcher = {
    kind: 'action', title: () => 'Track Switcher', icon: () => '🚂',
    how: g => `Send each animal to the stop with its name on the sign! Tap a lever (or press ${g.tier === 1 ? '1 or 2' : '1, 2, 3'}) to flip the tracks in time.`,
    init(g) {
      tsBuild(g);
      const n = g.plat.length;
      g.words = shuffle(TS_ANIMALS.slice()).slice(0, n);
      g.total = [0, 7, 9, 11][g.tier];
      g.speed = [0, 100, 112, 128][g.tier];
      g.gap = [0, 5.0, 4.2, 3.4][g.tier];
      // a queue of stops: every stop at least once, never three in a row
      const q = [];
      while (q.length < g.total) {
        const bag = shuffle([...Array(n).keys()]);
        for (const d of bag) if (q.length < g.total && !(q.length >= 2 && q[q.length - 1] === d && q[q.length - 2] === d)) q.push(d);
      }
      g.queue = q;
      g.sw = Object.fromEntries(g.sws.map(s => [s, randInt(0, 1)]));
      g.flip = Object.fromEntries(g.sws.map(s => [s, 0]));
      Object.assign(g, { trains: [], spawnT: 0.6, spawned: 0, arrived: 0, ok: 0, puffs: [], endT: 0, flash: {}, nextFor: {} });
      g.say = 'Flip the switches! Send each animal to the stop with its name on the sign.';
      g.progress = `🚂 0/${g.total}   ⭐ 0`;
    },
    start(g) { speak(g.say); },
    update(g, dt, id) {
      // levers: click or number key
      g.sws.forEach((s, i) => {
        if (id === `lever${i}`) { g.sw[s] ^= 1; g.flip[s] = 1; SFX.click(); tone(300, 0.08, 'square', 0.04, 0.03); }
      });
      for (const s of g.sws) g.flip[s] = Math.max(0, g.flip[s] - dt * 4);
      for (const k in g.flash) g.flash[k] = Math.max(0, g.flash[k] - dt);
      // new trains out of the tunnel
      g.spawnT -= dt;
      if (g.spawnT <= 0 && g.spawned < g.total) {
        g.spawnT = g.gap;
        const dest = g.queue[g.spawned++];
        g.trains.push({ edge: g.out.E[0], hist: [], d: 0, dest, rider: g.words[dest][1], word: g.words[dest][0], col: TS_COLS[g.spawned % TS_COLS.length], done: 0, puffT: 0, spin: 0, hop: 0 });
        toot();
      }
      for (const tr of g.trains) {
        if (tr.done) { tr.done += dt; continue; }
        tr.d += g.speed * dt; tr.spin += g.speed * dt / 14;
        while (tr.d >= tr.edge.len) {
          const node = tr.edge.to;
          if (node[0] === 'P') {
            tr.d = tr.edge.len; tr.done = 0.001; g.arrived++;
            const at = +node.slice(1);
            tr.ok = at === tr.dest; tr.at = at;
            g.flash[at] = 1.2;
            const y = g.plat[at];
            if (tr.ok) { g.ok++; SFX.hit(); burst(TS_STOP - 40, y - 30, 16, { kind: 'heart', colors: ['#ff6fae', '#ffd84a'] }); floatText(TS_STOP - 60, y - 60, `${tr.word}! ⭐`, '#fff6a8', false, 24); speak(`${tr.word}. Yes!`); }
            else { SFX.miss(); floatText(TS_STOP - 90, y - 60, `Oops! That says ${g.words[at][0]}`, '#ffd0d0', false, 20); speak(`Oops! That sign says ${g.words[at][0]}.`); }
            break;
          }
          tr.d -= tr.edge.len; tr.hist.push(tr.edge);
          tr.edge = g.out[node][g.sw[node]];
          g.flip[node] = Math.max(g.flip[node], 0.3);
          SFX.blip();
        }
        // steam
        tr.puffT -= dt;
        if (tr.puffT <= 0) { tr.puffT = 0.16; const p = tsAt(tr.edge, tr.d); g.puffs.push({ x: p.x + Math.cos(p.a) * 14 + Math.sin(p.a) * 28, y: p.y + Math.sin(p.a) * 14 - Math.cos(p.a) * 28 - 26, life: 1 }); }
      }
      g.trains = g.trains.filter(tr => tr.done < 1.4);
      for (const p of g.puffs) { p.life -= dt * 1.4; p.y -= 26 * dt; p.x -= 10 * dt; }
      g.puffs = g.puffs.filter(p => p.life > 0);
      // which train reaches each switch next (shown on the lever)
      g.nextFor = {};
      let best = {};
      for (const tr of g.trains) {
        if (tr.done) continue;
        let rem = tr.edge.len - tr.d, node = tr.edge.to;
        while (node[0] === 'S') {
          if (!(node in best) || rem < best[node]) { best[node] = rem; g.nextFor[node] = tr; }
          const e = g.out[node][g.sw[node]];
          rem += e.len; node = e.to;
        }
      }
      g.score = g.ok / g.total;
      g.progress = `🚂 ${g.arrived}/${g.total}   ⭐ ${g.ok}`;
      if (g.arrived >= g.total) { g.endT += dt; if (g.endT > 1.2) g.done = true; }
    },
    draw(g) {
      const t = S.t;
      // a sunny grassy board
      const bg = ctx.createLinearGradient(0, 60, 0, H);
      bg.addColorStop(0, '#bfe8a0'); bg.addColorStop(1, '#8fd078');
      ctx.fillStyle = bg; ctx.fillRect(0, 62, W, H - 62);
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      for (let i = 0; i < 40; i++) { const x = (i * 131) % W, y = 80 + (i * 67) % 450; ellipse(x, y, 7, 3); }
      for (let i = 0; i < 16; i++) flower((i * 223 + 40) % 780 + 60, 90 + (i * 89) % 430, 5, ['#ff6fae', '#fff', '#ffd84a', '#c6a2ff'][i % 4], '#ffd84a', 1);
      // the tracks: gravel, sleepers, then rails (inactive branches drawn faded first)
      const active = e => e.from === 'E' || g.out[e.from][g.sw[e.from]] === e;
      const drawEdge = (e, on) => {
        const p = e.pts;
        ctx.globalAlpha = on ? 1 : 0.5;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        ctx.beginPath(); p.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
        ctx.strokeStyle = '#d8c4a4'; ctx.lineWidth = 34; ctx.stroke();
        if (on) { ctx.strokeStyle = 'rgba(255,250,200,.55)'; ctx.lineWidth = 40; ctx.globalCompositeOperation = 'destination-over'; ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
        ctx.strokeStyle = '#9a6a4a'; ctx.lineWidth = 6; ctx.lineCap = 'butt';
        for (let d = 8; d < e.len; d += 20) {
          const q = tsAt(e, d), nx = -Math.sin(q.a), ny = Math.cos(q.a);
          ctx.beginPath(); ctx.moveTo(q.x - nx * 13, q.y - ny * 13); ctx.lineTo(q.x + nx * 13, q.y + ny * 13); ctx.stroke();
        }
        for (const off of [-8, 8]) {
          ctx.beginPath(); p.forEach((q, i) => { const x = q.x - q.ty * off, y = q.y + q.tx * off; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
          ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 5; ctx.stroke();
          ctx.strokeStyle = on ? '#eef0f8' : '#b8b4c4'; ctx.lineWidth = 2.5; ctx.stroke();
        }
        ctx.globalAlpha = 1;
      };
      for (const e of g.edges) if (!active(e)) drawEdge(e, false);
      for (const e of g.edges) if (active(e)) drawEdge(e, true);
      // moving chevrons show which way each switch points
      for (const s of g.sws) {
        const e = g.out[s][g.sw[s]];
        for (let k = 0; k < 3; k++) {
          const d = 18 + ((t * 60 + k * 26) % 78), q = tsAt(e, d);
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.a);
          ctx.globalAlpha = 1 - (d - 18) / 78;
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-5, -7); ctx.lineTo(3, 0); ctx.lineTo(-5, 7); ctx.stroke();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      // stops: buffer, sign with the word (and a picture, on easier levels)
      g.plat.forEach((y, i) => {
        const f = g.flash[i] || 0, bob = f > 0 ? Math.sin(f * 20) * 3 : 0;
        inkRect(TS_STOP + 6, y - 14, 10, 28, '#ff5a6a', 1.2, 3);
        inkRect(TS_STOP + 30, y - 8, 6, 30, '#8a5a3a', 1, 2);
        const sx = TS_STOP + 12, sy = y - 58 + bob;
        ctx.save(); if (f > 0) { ctx.shadowColor = '#fff6a8'; ctx.shadowBlur = 20; }
        inkRect(sx - 4, sy, 106, 48, '#fffaf0', 2, 12);
        ctx.restore();
        const [word, pic] = g.words[i];
        if (g.tier < 3) { emoji(pic, sx + 20, sy + 24, 26); text(word, sx + 66, sy + 25, 26, '#3a2050', 'center', 700); }
        else text(word, sx + 49, sy + 25, 30, '#3a2050', 'center', 700);
      });
      // trains: carriage first, then engine, then the rider waving from the carriage
      for (const tr of g.trains) {
        const back = (dist) => {
          let e = tr.edge, d = tr.d - dist, i = tr.hist.length - 1;
          while (d < 0 && i >= 0) { e = tr.hist[i--]; d += e.len; }
          return tsAt(e, d);
        };
        const fade = tr.done > 0.8 ? clamp(1 - (tr.done - 0.8) / 0.6, 0, 1) : 1;
        ctx.globalAlpha = fade;
        const c = back(58), en = back(0);
        ctx.fillStyle = 'rgba(40,30,60,.18)'; ellipse(c.x, c.y + 4, 30, 7); ellipse(en.x, en.y + 4, 34, 7);
        jxCarriage(c.x, c.y + 8, 0.55, mix(tr.col, '#ffffff', 0.35), c.a);
        jxEngine(en.x, en.y + 8, 0.5, tr.col, { rot: en.a, spin: tr.spin });
        const hop = tr.done && tr.ok ? Math.abs(Math.sin(tr.done * 10)) * 16 : 0;
        const rx = c.x + Math.sin(c.a) * 28, ry = c.y - Math.cos(c.a) * 28 - 6 - hop;
        emoji(tr.rider, rx, ry, 32);
        if (tr.done && !tr.ok) { outlined('?', rx + 20, ry - 22, 26, '#ffd84a'); }
        ctx.globalAlpha = 1;
      }
      for (const p of g.puffs) jxPuff(p.x, p.y, 6 + (1 - p.life) * 10, 0.75 * p.life);
      // the hill and tunnel the trains come out of
      ink(P2('M-20,214 C30,206 72,250 74,300 C76,350 40,372 -20,380 Z'), '#7cc46a', 1.6);
      ctx.fillStyle = '#5fae55'; ellipse(18, 236, 14, 6, -0.3);
      ink(P2('M8,334 L8,290 C8,262 56,262 56,290 L56,334 Z'), '#b8a8c8', 1.4);
      ctx.fillStyle = '#2a2038'; ctx.beginPath(); ctx.moveTo(16, 334); ctx.lineTo(16, 292); ctx.quadraticCurveTo(32, 270, 48, 292); ctx.lineTo(48, 334); ctx.fill();
      // levers: a big round button with an arrow, its key number, and who is coming next
      g.sws.forEach((s, i) => {
        const [lx, ly] = g.levers[s], up = g.sw[s] === 0, f = g.flip[s];
        const hover = Math.hypot(pointer.x - lx, pointer.y - ly) < 38;
        ctx.save(); ctx.shadowColor = 'rgba(40,20,60,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        inkCircle(lx, ly, 34 + f * 4 + (hover ? 2 : 0), hover ? '#ffe36b' : '#ffd23a', 2);
        ctx.restore();
        inkCircle(lx, ly, 34 + f * 4 + (hover ? 2 : 0), hover ? '#ffe36b' : '#ffd23a', 2);
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(up ? -0.6 : 0.6);
        ctx.strokeStyle = OL; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(12, 0); ctx.stroke();
        ctx.fillStyle = OL; tri(10, -14, 26, 0, 10, 14);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(12, 0); ctx.stroke();
        ctx.fillStyle = '#ffffff'; tri(13, -8, 21, 0, 13, 8);
        ctx.restore();
        inkCircle(lx - 28, ly - 26, 12, '#7a5ac8', 1.2); text(String(i + 1), lx - 28, ly - 25, 15, '#fff', 'center', 700);
        const nt = g.nextFor[s];
        if (nt && g.tier < 3) { inkCircle(lx + 28, ly + 26, 15, '#ffffff', 1.2); emoji(nt.rider, lx + 28, ly + 26, 20); }
        zone(`lever${i}`, lx - 40, ly - 40, 80, 80, String(i + 1));
      });
      drawCritter(ROCCO, 52, 540, 0.46, 1);
    },
  };

  // ===========================================================================
  // Game 2: Buddy Seats. Every window seats TWO buddies. Tap the passengers onto the train,
  // count the buddy pairs, then say whether the number is even (everyone has a buddy) or odd
  // (one left over). Each answer lights up a strip of numbers, so the even/odd pattern appears.
  // ===========================================================================
  const BS_PASS = ['🐰', '🐻', '🐷', '🐱', '🐶', '🐸', '🐼', '🦊', '🐨', '🐯', '🐮', '🐵', '🐹', '🐔'];
  const BS_WIN = [70, 170, 270, 370, 500, 600, 700];      // window left edges (7 windows = 14 seats)
  const BS_WW = 90, BS_WY = 196, BS_WH = 86;
  const BS_EVEN = '#4a8ae8', BS_ODD = '#ff8a3a';
  const bsSeat = i => [BS_WIN[i >> 1] + (i % 2 ? 66 : 24), BS_WY + 62];
  const bsSpot = (g, i) => { const n = g.n, sp = Math.min(66, 860 / n); return [480 - (n - 1) / 2 * sp + i * sp, 476]; };

  MG.buddyseats = {
    kind: 'learn', title: () => 'Buddy Seats', icon: () => '👫',
    how: g => `Each window seats TWO buddies. Tap the passengers on. Everyone has a buddy? That's EVEN. One left over? That's ODD!${g.tier === 3 ? ' Guess first!' : ''}`,
    init(g) {
      g.rounds = 6;
      const [lo, hi] = [[0, 0], [2, 8], [3, 12], [5, 14]][g.tier];
      // three even and three odd numbers, no repeats
      const evens = [], odds = [];
      for (let n = lo; n <= hi; n++) (n % 2 ? odds : evens).push(n);
      g.nums = shuffle([...shuffle(evens).slice(0, 3), ...shuffle(odds).slice(0, 3)]);
      Object.assign(g, { round: -1, pts: 0, seen: {}, msgT: 0 });
      this.next(g);
    },
    next(g) {
      g.round++;
      if (g.round >= g.rounds) { g.done = true; return; }
      const n = g.nums[g.round];
      g.n = n;
      g.who = shuffle(BS_PASS.slice()).slice(0, n);
      g.pass = g.who.map((ch, i) => ({ ch, seat: -1, k: 0, i }));
      g.seated = 0; g.landed = 0;
      g.predict = g.tier === 3 || (g.tier === 2 && g.round % 2 === 1);
      g.step = g.predict ? 'parity' : 'board';
      g.parityDone = false; g.pairsDone = false; g.ans = null; g.msg = ''; g.msgT = 0; g.wrong = 0; g.countT = -1;
      this.prompt(g);
    },
    prompt(g) {
      const w = NUM_WORDS[g.n];
      if (g.step === 'board') g.say = `${w} passengers! Tap each one to help them find a seat. Two buddies in every window.`;
      else if (g.step === 'parity') g.say = g.predict && !g.parityDone && g.seated === 0 ? `There are ${w} passengers. Guess! Is ${w} even or odd?` : `Is ${w} even or odd?`;
      else if (g.step === 'pairs') g.say = 'How many buddy pairs are there?';
      speak(g.say);
      if (g.step === 'pairs') {
        const c = Math.floor(g.n / 2), st = Math.max(0, c - randInt(0, 3));
        g.choices = [st, st + 1, st + 2, st + 3];
      }
    },
    start(g) { speak(g.say); },
    board(g, p) {
      if (!p || p.seat >= 0) return;
      p.seat = g.seated++; p.k = 0;
      SFX.jump();
    },
    answer(g, ok, show) {
      if (ok) { g.pts++; SFX.hit(); } else { SFX.miss(); }
      g.ans = { ok, show, t: 0 };
    },
    update(g, dt, id) {
      g.msgT = Math.max(0, g.msgT - dt);
      // hopping passengers
      for (const p of g.pass) if (p.seat >= 0 && p.k < 1) {
        p.k = Math.min(1, p.k + dt * 2.4);
        if (p.k >= 1) {
          g.landed++;
          SFX.pop();
          if (p.seat % 2 === 1) { const [sx, sy] = bsSeat(p.seat); burst(sx - 21, sy - 44, 10, { kind: 'heart', colors: ['#ff6fae', '#ff9ac0'] }); tone(784, 0.12, 'triangle', 0.07); tone(1047, 0.16, 'triangle', 0.06, 0.08); }
        }
      }
      // an answer is showing: wait, then move on
      if (g.ans) {
        g.ans.t += dt;
        if (g.ans.t > (g.ans.ok ? 1.6 : 2.6) || (g.ans.t > 0.8 && (id === 'bsnext' || pressed[' '] || pressed.enter))) {
          const was = g.step; g.ans = null;
          if (was === 'parity') {
            g.parityDone = true;
            if (g.seated < g.n) { g.step = 'board'; this.prompt(g); }
            else if (!g.pairsDone) { g.step = 'pairs'; this.prompt(g); }
            else this.wrapUp(g);
          } else if (was === 'pairs') {
            g.pairsDone = true;
            if (!g.parityDone) { g.step = 'parity'; this.prompt(g); } else this.wrapUp(g);
          } else if (was === 'explain') this.next(g);
        }
        g.score = g.pts / (g.rounds * 2);
        g.progress = `Train ${Math.min(g.round + 1, g.rounds)} of ${g.rounds}`;
        return;
      }
      if (g.step === 'board') {
        let hit = null;
        if (id && id.startsWith('bsp')) hit = g.pass[+id.slice(3)];
        if (!hit && (pressed[' '] || pressed.enter)) hit = g.pass.find(p => p.seat < 0);
        this.board(g, hit);
        if (g.landed >= g.n) { g.step = 'pairs'; this.prompt(g); }
      } else if (g.step === 'pairs') {
        const c = Math.floor(g.n / 2);
        let pick = null;
        g.choices.forEach((v, i) => { if (id === `bsc${i}`) pick = v; });
        if (pick != null) { this.answer(g, pick === c, 'pairs'); g.picked = pick; speak(pick === c ? `Yes! ${NUM_WORDS[c]} pairs.` : `Let's count. ${NUM_WORDS[c]} pairs.`); }
      } else if (g.step === 'parity') {
        let pick = null;
        if (id === 'bseven' || pressed.e) pick = 'even';
        if (id === 'bsodd' || pressed.o) pick = 'odd';
        if (pick) {
          const real = g.n % 2 ? 'odd' : 'even', w = NUM_WORDS[g.n];
          g.picked = pick;
          this.answer(g, pick === real, 'parity');
          const why = real === 'even' ? 'Everyone has a buddy.' : 'One is left over.';
          if (g.seated < g.n) speak(pick === real ? `Good guess! Let's check.` : `Hmm, let's check by sitting them in pairs!`);
          else speak(pick === real ? `Yes! ${w} is ${real}. ${why}` : `${w} is ${real}. ${why}`);
        }
      }
      g.score = g.pts / (g.rounds * 2);
      g.progress = `Train ${g.round + 1} of ${g.rounds}`;
    },
    wrapUp(g) {
      g.seen[g.n] = true;
      g.step = 'explain';
      const odd = g.n % 2, c = Math.floor(g.n / 2), w = NUM_WORDS[g.n];
      g.say = odd ? `${w} is ODD. ${NUM_WORDS[c]} pairs and one left over.` : `${w} is EVEN. ${NUM_WORDS[c]} pairs, and everyone has a buddy!`;
      speak(g.say + ' Toot toot!');
      toot();
      g.ans = { ok: true, show: 'explain', t: -1.4, silent: true };
    },
    draw(g) {
      const t = S.t;
      ctx.fillStyle = 'rgba(255,248,240,.35)'; ctx.fillRect(0, 60, W, H - 60);
      // the even/odd number strip: each number lights up once you've met it
      const maxN = [0, 8, 12, 14][g.tier];
      const tw = Math.min(44, 640 / maxN), x0 = 480 - maxN * tw / 2;
      darkPanel(x0 - 120, 64, maxN * tw + 134, 36, 18);
      ctx.fillStyle = BS_EVEN; circle(x0 - 104, 76, 5); text('even', x0 - 96, 76, 12, '#fff', 'left', 600);
      ctx.fillStyle = BS_ODD; circle(x0 - 104, 90, 5); text('odd', x0 - 96, 90, 12, '#fff', 'left', 600);
      for (let n = 1; n <= maxN; n++) {
        const x = x0 + (n - 1) * tw, on = g.seen[n], col = on ? (n % 2 ? BS_ODD : BS_EVEN) : 'rgba(255,255,255,.18)';
        rrect(x + 2, 68, tw - 4, 28, 8, col);
        text(String(n), x + tw / 2, 82.5, 15, on ? '#fff' : 'rgba(255,255,255,.55)', 'center', 700);
        if (n === g.n && !g.done) { ctx.strokeStyle = '#fff6a8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x + 1, 67, tw - 2, 30, 8); ctx.stroke(); }
      }
      // prompt
      // show numerals on screen (easier to read) while the voice says the words
      const msg = (g.say || '').replace(new RegExp(`\\b(${NUM_WORDS.join('|')})\\b`, 'gi'), m => NUM_WORDS.indexOf(m.toLowerCase())).replace(/^./, c => c.toUpperCase());
      panel(60, 106, 840, 48, 18);
      text(wrap(msg, 800, 19)[0] + (wrap(msg, 800, 19).length > 1 ? '…' : ''), 480, 130, 19, '#4a2060', 'center', 700);

      // the Picnic Express: two carriages and the engine
      const carr = (x, w) => {
        const body = new Path2D(); body.roundRect(x, 176, w, 142, 16);
        const roof = P2(`M${x - 8},184 C${x + 20},158 ${x + w - 20},158 ${x + w + 8},184 Z`);
        ctx.strokeStyle = OL; ctx.lineWidth = 6; ctx.stroke(body); ctx.stroke(roof);
        ctx.fillStyle = vgradL(176, 318, '#8fd0ff', '#4aa8e8'); ctx.fill(body);
        ctx.fillStyle = '#ff6f8a'; ctx.fill(roof);
        ctx.fillStyle = '#ffd84a'; ctx.fillRect(x + 4, 292, w - 8, 8);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 6; i++) circle(x + 30 + i * (w - 60) / 5, 170, 3);
        for (const wx of [x + 50, x + w - 50]) { inkCircle(wx, 328, 17, '#3a3248', 1.6); inkCircle(wx, 328, 6, '#ffd84a', 0.8); }
      };
      ctx.fillStyle = '#c8b49a'; ctx.fillRect(0, 336, W, 12);
      for (let x = 4; x < W; x += 24) inkRect(x, 338, 14, 9, '#9a6a4a', 0.8, 2);
      ctx.strokeStyle = OL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 344); ctx.lineTo(W, 344); ctx.stroke();
      carr(56, 418); carr(486, 314);
      ctx.strokeStyle = OL; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(474, 300); ctx.lineTo(486, 300); ctx.moveTo(800, 300); ctx.lineTo(820, 300); ctx.stroke();
      for (let i = 0; i < 4; i++) { const k = (t * 0.5 + i / 4) % 1; jxPuff(918 - k * 30, 214 - k * 100, 8 + k * 14, 0.8 * (1 - k)); }
      jxEngine(892, 346, 1.08, '#ff5a6a', { spin: t * 0.3, roof: '#ffd84a' });
      // windows (seats), with buddies inside
      const usedWins = Math.ceil(g.n / 2);
      BS_WIN.forEach((wx, wi) => {
        const wpath = P2(`M${wx},${BS_WY + BS_WH} L${wx},${BS_WY + 22} C${wx},${BS_WY - 6} ${wx + BS_WW},${BS_WY - 6} ${wx + BS_WW},${BS_WY + 22} L${wx + BS_WW},${BS_WY + BS_WH} Z`);
        ink(wpath, wi < usedWins ? '#eaf8ff' : '#cfe4f4', 1.5);
        ctx.save(); ctx.clip(wpath);
        ctx.fillStyle = '#ff9ac0'; ctx.fillRect(wx, BS_WY + 58, BS_WW, BS_WH);
        for (const p of g.pass) if (p.seat >> 1 === wi && p.k >= 1) {
          const [sx, sy] = bsSeat(p.seat), wig = Math.sin(t * 3 + p.i) * 1.5;
          emoji(p.ch, sx, sy - 12 + wig, 40);
        }
        ctx.restore();
        ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx + 45, BS_WY + 8); ctx.lineTo(wx + 45, BS_WY + 60); ctx.stroke();
        // a heart over a full pair, a question mark over a lonely one
        const inWin = g.pass.filter(p => p.seat >> 1 === wi && p.k >= 1).length;
        if (inWin === 2) { const pulse = g.countT >= 0 ? 1 : 1 + Math.sin(t * 4 + wi) * 0.08; heart(wx + 45, BS_WY - 4, 22 * pulse, '#ff5a8a'); }
        else if (inWin === 1 && g.landed >= g.n) {
          ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(90,60,120,.6)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(wx + 66, BS_WY + 44, 17, 0, TAU); ctx.stroke(); ctx.restore();
          outlined('?', wx + 66, BS_WY + 44 + Math.sin(t * 5) * 2, 22, '#ffd84a');
        }
      });
      // platform
      ctx.fillStyle = '#f2c890'; ctx.fillRect(0, 348, W, H - 348);
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(0, 350, W, 6);
      ctx.strokeStyle = 'rgba(140,80,40,.25)'; ctx.lineWidth = 2;
      for (const y of [440, 506]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // passengers waiting and hopping on
      g.pass.forEach((p, i) => {
        const [px, py] = bsSpot(g, i);
        if (p.seat < 0) {
          const bob = Math.abs(Math.sin(t * 3 + i * 0.9)) * 5;
          ctx.fillStyle = 'rgba(80,40,30,.2)'; ellipse(px, py + 30, 22, 6);
          const hover = g.step === 'board' && !g.ans && Math.abs(pointer.x - px) < 30 && Math.abs(pointer.y - py) < 40;
          if (hover) { ctx.fillStyle = 'rgba(255,255,255,.5)'; circle(px, py, 32); }
          emoji(p.ch, px, py - bob, 48);
          inkRect(px + 10, py + 12 - bob, 18, 14, ['#ff6fae', '#5fb8f0', '#ffd84a', '#7ad86a'][i % 4], 1, 3);
          if (g.step === 'board' && !g.ans) zone(`bsp${i}`, px - 30, py - 40, 60, 80);
        } else if (p.k < 1) {
          const [sx, sy] = bsSeat(p.seat), k = easeOut(p.k);
          emoji(p.ch, lerp(px, sx, k), lerp(py, sy - 12, k) - Math.sin(p.k * Math.PI) * 120, 46);
        }
      });
      // answer buttons
      if (!g.ans && g.step === 'pairs') {
        g.choices.forEach((v, i) => button(`bsc${i}`, 480 - 2 * 124 + i * 124 + 6, 362, 112, 58, String(v), { color: '#9a6ae0', size: 30, key: String(i + 1) }));
      }
      if (!g.ans && g.step === 'parity') {
        button('bseven', 250, 362, 220, 60, 'EVEN', { color: BS_EVEN, size: 26, icon: '👫', key: 'E' });
        button('bsodd', 490, 362, 220, 60, 'ODD', { color: BS_ODD, size: 26, icon: '🙋', key: 'O' });
      }
      if (g.ans && !g.ans.silent) {
        const ok = g.ans.ok;
        let line;
        if (g.ans.show === 'pairs') line = ok ? `Yes! ${Math.floor(g.n / 2)} pairs!` : `It's ${Math.floor(g.n / 2)} pairs. Count the hearts!`;
        else if (g.seated < g.n) line = ok ? 'Good guess! Let\'s check...' : 'Hmm! Let\'s check...';
        else line = `${g.n} is ${g.n % 2 ? 'ODD' : 'EVEN'}!`;
        panel(250, 364, 460, 54, 18);
        outlined(line, 480, 391, 24, ok ? '#5fd07a' : '#ff9a5a', 'center', '#fff');
        if (g.ans.t > 0.8) zone('bsnext', 0, 160, W, H - 160);
      }
      if (g.step === 'explain' && g.ans) {
        const odd = g.n % 2;
        panel(220, 364, 520, 60, 18);
        outlined(`${g.n} is ${odd ? 'ODD' : 'EVEN'}`, 480, 384, 26, odd ? BS_ODD : BS_EVEN, 'center', '#fff');
        text(odd ? `${Math.floor(g.n / 2)} pairs + 1 left over` : `${g.n / 2} pairs, no one left over`, 480, 410, 16, '#5a2a6e', 'center', 600);
        if (g.ans.t > 0.8) zone('bsnext', 0, 160, W, H - 160);
      }
    },
  };

  // --- the place ---------------------------------------------------------------------------------
  restage('duckpond', {
    name: 'Whistlestop Junction', icon: '🚂', bg: 'junction_bg',
    npc: { name: ROCCO, icon: '🦝' },
    games: [['trackswitcher', 'shell', {}], ['buddyseats', 'petal', {}]],
    intro: [
      '*:Toot toot! A smiley little steam train puffs into a candy-striped station, full of animal passengers.',
      "N:All aboard! Oh, Aubrey, thank goodness. My signal mouse has a sniffly cold, and nobody is working the track switches!",
      'N:Every passenger must get off at the stop with their name on the sign. Can you flip the levers for me?',
      "A:determined:Leave it to me, Conductor Rocco!",
    ],
    mid: [
      'N:Splendid switching! Now the Picnic Express is boarding. Every window on my train seats TWO buddies.',
      "N:If everyone gets a buddy, the number is EVEN. If one is left over, it's ODD!",
      'A:thinking:Even... and odd. Let\'s find out!',
    ],
    outro: [
      'N:Toot TOOT! Every passenger home, and every buddy seated. The passengers left you these shells and petals as a thank-you!',
      'A:happy:Thanks, Rocco! Next stop... my secret project!',
      "N:Your WHAT?",
      'A:winky:Nothing! Bye!',
    ],
  });
}
