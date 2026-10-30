'use strict';
// Each day: pick 3 of the 9 places on the map, play through their stories and minigames,
// then head home at dusk to craft in the shed.

const TIER_LABELS = { 1: ['Easy', '#5fb87a'], 2: ['Medium', '#4fa8e0'], 3: ['Hard', '#9a6ae0'] };

// the deck is shuffled once per game, so all 45 places appear exactly once over 5 days
function dayOffer(day = S.day) {
  return [1, 2, 3].flatMap(t => S.deck[t].slice((day - 1) * 3, day * 3)).map(id => LOC[id]);
}
function parseLine(line, place) {
  const fill = s => s.replaceAll('{N}', S.name);
  const [who, ...rest] = line.split(':');
  if (who === 'A') return ['aubrey', rest[0], fill(rest.slice(1).join(':'))];
  if (who === 'N') return [place.npc.name, place.npc.icon, fill(rest.join(':'))];
  return ['narrator', null, fill(rest.join(':'))];
}
const kindIcon = type => (MG[type].kind === 'learn' ? '🧠' : '⚡');

// --- the map --------------------------------------------------------------------------------
SCENES.map = {
  enter() { this.hover = null; },
  update() {
    if (pressed.m) muted = !muted;
    const id = clickedButton();
    if (!id) return;
    if (id === 'home') return goHome();
    if (id === 'plans') return setScene('style', { mode: 'peek', onDone: () => setScene('map') });
    if (id.startsWith('loc:') && S.visitsToday < VISITS_PER_DAY) {
      SFX.sparkle();
      setScene('location', { id: id.slice(4) });
    }
  },
  draw() {
    buttons = [];
    // a hand-drawn paper map
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fff3dc'); g.addColorStop(1, '#f5dfb8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(160,110,60,.25)'; ctx.lineWidth = 3; ctx.setLineDash([8, 10]);
    ctx.beginPath(); ctx.moveTo(20, 470); ctx.bezierCurveTo(300, 380, 200, 120, 520, 140); ctx.bezierCurveTo(800, 160, 700, 420, 940, 360); ctx.stroke();
    ctx.setLineDash([]);
    emoji('🧭', 40, 40, 40);
    outlined(`Day ${S.day} of ${SHOW_DAY}`, 76, 32, 24, '#ff6fb5', 'left', '#fff');
    const left = VISITS_PER_DAY - S.visitsToday;
    text(left ? `Where should Aubrey go? ${left} adventure${left > 1 ? 's' : ''} left today` : 'All done for today!', 76, 60, 16, '#7a5a3a', 'left', 600);
    for (let i = 0; i < VISITS_PER_DAY; i++) { ctx.globalAlpha = i < left ? 1 : 0.25; emoji('🥾', W - 130 + i * 40, 40, 30); }
    ctx.globalAlpha = 1;

    const offer = dayOffer();
    [1, 2, 3].forEach((tier, row) => {
      const y = 86 + row * 122;
      const [label, col] = TIER_LABELS[tier];
      rrect(14, y + 6, 112, 96, 14, col);
      text(label, 70, y + 36, 18, '#fff', 'center', 700);
      text('⭐'.repeat(tier), 70, y + 62, 14, '#fff', 'center', 500);
      text(TIER_NAMES[tier] + ' stuff', 70, y + 84, 11, 'rgba(255,255,255,.9)', 'center', 600);
      offer.filter(p => p.tier === tier).forEach((p, i) => {
        const x = 138 + i * 272, w = 262, h = 108;
        const visited = S.log.includes(p.id);
        const b = { id: `loc:${p.id}`, x, y, w, h, on: !visited && left > 0 };
        if (b.on) buttons.push(b);
        const hover = b.on && inRect(b);
        ctx.save();
        if (hover) { ctx.shadowColor = 'rgba(90,40,90,.35)'; ctx.shadowBlur = 14; }
        rrect(x, y - (hover ? 2 : 0), w, h, 16, visited ? '#eee4ea' : '#fff', hover ? '#ff6fb5' : col, hover ? 4 : 3);
        ctx.restore();
        ctx.globalAlpha = visited ? 0.45 : 1;
        emoji(p.icon, x + 38, y + 40, 42);
        emoji(p.npc.icon, x + 38, y + 84, 22);
        wrap(p.name, 180, 16, 700).slice(0, 2).forEach((l, j) => text(l, x + 72, y + 24 + j * 19, 16, '#4a2060', 'left', 700));
        const mats = [...new Set(p.games.map(gm => gm.mat))];
        text('Finds:', x + 72, y + 72, 12, '#9a7aaa', 'left', 600);
        mats.forEach((m, j) => emoji(MATS[m].icon, x + 122 + j * 28, y + 72, 22));
        ctx.font = `13px ${EMOJI_FONT}`; ctx.textAlign = 'right'; ctx.fillText(p.games.map(gm => kindIcon(gm.type)).join(' '), x + w - 12, y + 94);
        ctx.globalAlpha = 1;
        if (visited) { emoji('✅', x + w - 22, y + 22, 26); text('Visited', x + w - 40, y + 22, 13, '#5fb87a', 'right', 700); }
      });
    });
    drawMats(12, H - 52, 600);
    button('plans', 626, H - 58, 150, 48, isDino() ? 'Dress-up ideas' : 'Outfit plans', { icon: '📖', color: '#9a6ae0', size: 15 });
    if (!left) button('home', 784, H - 60 - Math.abs(Math.sin(S.t * 4)) * 4, 172, 52, 'Head home', { icon: '🌙', color: '#ff6fb5', size: 17, key: 'Enter' });
    drawFx(false);
  },
};

// --- visiting a place ------------------------------------------------------------------------
let ADV = null;
SCENES.location = {
  enter({ id, after }) {
    if (id) {
      ADV = { place: LOC[id], got: [], summary: false };
      return say(placeLines(ADV.place, 'intro').map(l => parseLine(l, ADV.place)), () => playPlaceGame(0));
    }
    const p = ADV.place;
    if (after === 0) say(placeLines(p, 'mid').map(l => parseLine(l, p)), () => playPlaceGame(1));
    else say(placeLines(p, 'outro').map(l => parseLine(l, p)), () => {
      ADV.summary = true;
      S.visitsToday++;
      S.log.push(p.id);
      SFX.fanfare();
    });
  },
  update() {
    if (ADV.summary && (clickedButton() === 'back' || pressed.enter)) setScene('map');
  },
  draw() {
    buttons = [];
    const p = ADV.place;
    drawBackdrop(p.bg);
    drawAubrey(250, GY + 20, 'idle_front', 1, 0, 0.78);
    if (!drawCritter(p.npc.name, 720, GY + 14, 1.1, -1)) glowEmoji(p.npc.icon, 700, GY - 90 + Math.sin(S.t * 2.2) * 8, 130, 'rgba(255,255,255,.55)');
    darkPanel(12, H - 58, 420, 46, 23);
    emoji(p.icon, 36, H - 35, 24);
    text(p.name, 58, H - 35, 18, '#fff', 'left', 700);
    text('⭐'.repeat(p.tier), 420, H - 35, 14, '#fff', 'right');
    if (ADV.summary) {
      panel(W / 2 - 250, 140, 500, 260, 24);
      emoji(p.icon, W / 2, 190, 52);
      outlined(`${p.name} — done!`, W / 2, 240, 26, '#ff6fb5', 'center', '#fff');
      text('You brought home:', W / 2, 276, 17, '#5a2a6e', 'center', 600);
      const items = ADV.got.map(([m, n]) => `${MATS[m].icon} ×${n}`).join('     ');
      ctx.font = `600 26px ${FONT}`; ctx.fillStyle = '#4a2060'; ctx.textAlign = 'center'; ctx.fillText(items, W / 2, 318);
      button('back', W / 2 - 110, 340, 220, 50, 'Back to the map', { icon: '🧭', color: '#9a6ae0' });
    }
  },
};
function playPlaceGame(i) {
  const p = ADV.place, game = p.games[i];
  setScene('minigame', {
    game, tier: p.tier, loc: p,
    onDone: (score, amount) => { ADV.got.push([game.mat, amount]); setScene('location', { after: i }); },
  });
}

// --- dusk: home to the shed, maybe a visit from Mom, then crafting ------------------------------
function goHome() {
  // the dino route spends each night in the shed with him: feed, dress up, cuddle, sleep (js/pet.js)
  const craft = isDino() ? () => setScene('dinonight', { onDone: bedtime }) : () => setScene('style', { mode: 'craft', onDone: bedtime });
  say([['narrator', null, isDino() ? `The sun is setting. Aubrey hurries home to the shed with her supplies. ${S.name} will be waiting!` : `The sun is setting. Aubrey hurries home to ${S.name} with her treasures.`]], () => {
    // Mom gets curious on a couple of evenings
    if (S.day === 2 || S.day === 4) setScene('hide', craft);
    else craft();
  });
}
function bedtime() {
  if (S.day === SHOW_DAY) return showTime();
  setScene('night');
}
