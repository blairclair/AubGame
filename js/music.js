'use strict';
// Background music: little looping tunes on the same WebAudio synth as the sound effects, no files.
// Each song is 8 bars of melody over chords. musicMood() picks a song for whatever is on screen,
// songs crossfade when it changes, and the music dips while read-aloud is talking.
// M mutes everything, N turns just the music on and off.

let musicOn = true;
try { musicOn = localStorage.getItem('aubgame.music') !== 'off'; } catch (e) { /* private window: music starts on */ }
function toggleMusic() {
  musicOn = !musicOn;
  try { localStorage.setItem('aubgame.music', musicOn ? 'on' : 'off'); } catch (e) { /* not remembered, that's fine */ }
}

// mel: one token per eighth note: a scale step from the key note (0 = the key note, 7 = an octave up),
// '-' holds the note before, '.' is a rest. chords: the scale step each bar's chord is built on.
// bar: eighths per bar (6 for a lullaby rocking in 6/8). lead / bass / drums: how each part plays.
const MSCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const SONGS = {
  // the title screen and the happy endings: a music box
  title: { bpm: 96, key: 72, scale: 'major', lead: 'bell', bass: 'long', drums: 'none', chords: [0, 5, 3, 4, 0, 5, 3, 0],
    mel: '0 - 2 - 4 - 7 - | 5 - 4 - 2 - . . | 3 - 5 - 7 - 5 - | 4 - - - . . . . | 0 - 2 - 4 - 7 - | 9 - 7 - 5 - 4 - | 3 - 5 4 3 - 1 - | 0 - - - . . . .' },
  // the map: off on an adventure
  adventure: { bpm: 108, key: 72, scale: 'major', lead: 'tri', bass: 'walk', drums: 'soft', chords: [0, 4, 5, 3, 0, 4, 3, 0],
    mel: '0 - 0 2 4 - 7 - | 6 - 4 - 1 - . . | 5 - 5 7 9 - 7 - | 7 - 5 - 3 - . . | 4 - 4 7 9 - 7 - | 8 - 6 - 4 - 6 - | 7 - 5 - 3 - 5 - | 7 - - - . . . .' },
  // sunny places: gardens, meadows, the farm, the beach
  sunny: { bpm: 116, key: 67, scale: 'major', lead: 'tri', bass: 'walk', drums: 'soft', chords: [0, 3, 4, 0, 5, 3, 4, 4],
    mel: '4 . 4 5 4 - 2 - | 3 . 3 4 3 - 0 - | 1 - 2 3 4 - 1 - | 0 - - - 2 - 4 - | 5 . 5 7 5 - 4 - | 3 . 3 5 3 - 2 - | 1 - 4 - 6 - 4 - | 4 - - - . . . .' },
  // indoors, the attic, dress-up
  cozy: { bpm: 84, key: 65, scale: 'major', lead: 'tri', bass: 'long', drums: 'none', chords: [0, 2, 3, 4, 0, 2, 3, 0],
    mel: '2 - - 4 7 - 4 - | 6 - - 4 2 - . . | 5 - - 3 0 - 3 - | 4 - - - . . 4 6 | 7 - - 6 4 - 2 - | 4 - 2 - 6 - 4 - | 3 - 5 - 7 - 8 - | 7 - - - . . . .' },
  // the woods behind the house
  woods: { bpm: 104, key: 62, scale: 'major', lead: 'marimba', bass: 'walk', drums: 'soft', chords: [0, 4, 5, 3, 0, 4, 3, 4],
    mel: '0 - 2 4 7 - 4 2 | 4 - 6 - 8 - 6 4 | 5 - 7 - 9 - 7 5 | 3 - 5 - 7 - . . | 7 - 9 - 11 - 9 7 | 8 - 6 - 4 - 6 - | 5 - 3 - 7 - 5 - | 4 - - - . . . .' },
  // dusk, night and magic places
  twinkle: { bpm: 88, key: 69, scale: 'major', lead: 'bell', bass: 'long', drums: 'none', chords: [0, 5, 3, 4, 0, 5, 1, 4],
    mel: '7 . 11 . 9 . 7 . | 9 . 12 . 11 . 9 . | 10 - - . 7 - 5 - | 8 - - - 6 - 4 - | 7 . 9 . 11 . 14 . | 12 - 11 - 9 - 7 - | 8 - 10 - 12 - 10 - | 11 - - - . . . .' },
  // caves, volcanoes and the deep sea
  mystery: { bpm: 92, key: 64, scale: 'minor', lead: 'marimba', bass: 'long', drums: 'tom', chords: [0, 5, 3, 4, 0, 5, 3, 4],
    mel: '0 . 2 . 4 . 2 . | 5 - 4 - 2 - 0 - | 3 . 5 . 7 . 5 . | 4 - - - 6 - 4 - | 7 . 6 . 4 . 2 . | 5 - 7 - 9 - 7 - | 3 - 2 - 1 - 3 - | 4 - - - . . . .' },
  // minigames: two bouncy tunes, so one place's two games don't sound the same
  bounce: { bpm: 126, key: 72, scale: 'major', lead: 'square', bass: 'pulse', drums: 'pop', chords: [0, 5, 1, 4, 0, 5, 1, 4],
    mel: '0 2 4 2 7 - 4 - | 5 7 9 7 5 - 4 - | 1 3 5 3 8 - 5 - | 4 - 6 - 4 - . . | 7 - 4 - 2 4 7 - | 9 - 7 - 5 7 9 - | 8 - 5 - 3 5 8 - | 6 - - - 4 - . .' },
  skip: { bpm: 112, key: 65, scale: 'major', lead: 'tri', bass: 'walk', drums: 'pop', swing: 0.18, chords: [0, 3, 0, 4, 0, 3, 4, 0],
    mel: '4 - 4 2 0 - 2 4 | 5 - 5 3 0 - 3 5 | 4 - 2 - 7 - 4 - | 6 - 4 - 1 - - - | 4 - 4 2 0 - 2 4 | 5 - 7 - 9 - 7 5 | 4 - 6 - 8 - 6 - | 7 - - - . . . .' },
  // sneaking past the grown-ups: tiptoe notes
  sneak: { bpm: 100, key: 62, scale: 'minor', lead: 'pluck', bass: 'pulse', drums: 'tick', chords: [0, 0, 5, 4, 0, 0, 3, 4],
    mel: '0 . . 2 . . 4 . | 3 . 2 . 0 . . . | 5 . . 4 . . 2 . | 4 . . 6 . . 8 . | 7 . . 6 . . 4 . | 2 . 3 . 4 . . . | 3 . . 5 . . 7 . | 8 . 6 . 4 . . .' },
  // bedtime, rocking in 6/8
  lullaby: { bpm: 84, key: 67, scale: 'major', lead: 'bell', bass: 'long', drums: 'none', bar: 6, chords: [0, 3, 0, 4, 0, 3, 4, 0],
    mel: '4 - 2 0 - 2 | 3 - 5 7 - 5 | 4 - 2 0 - - | 1 - 4 6 - 4 | 4 - 2 0 - 2 | 5 - 7 9 - 7 | 6 - 4 1 - - | 0 - - - - -' },
  // the baby dinosaur's jungle
  jungle: { bpm: 112, key: 62, scale: 'major', lead: 'marimba', bass: 'walk', drums: 'jungle', chords: [0, 0, 5, 4, 0, 0, 3, 4],
    mel: '0 2 4 - 7 - 4 2 | 4 - 2 - 0 - . . | 5 - 7 - 9 - 7 5 | 4 - 1 - 4 - . . | 7 9 11 - 9 7 4 - | 2 - 4 - 7 - . . | 3 - 5 - 7 - 5 3 | 4 - - - 1 - . .' },
  // the fashion show
  dance: { bpm: 120, key: 69, scale: 'major', lead: 'square', bass: 'walk', drums: 'pop', chords: [5, 3, 0, 4, 5, 3, 0, 4],
    mel: '5 - 5 7 9 - 7 - | 7 - 5 - 3 - 5 - | 4 - 2 - 0 - 2 4 | 6 - - - 4 - . . | 9 - 9 11 12 - 11 9 | 10 - 7 - 5 - 7 - | 7 - 4 - 7 - 9 - | 8 - - - 6 - . .' },
};
SONGS.starry = { ...SONGS.twinkle, bpm: 108, bass: 'walk', drums: 'soft' }; // a night-time minigame

// games that play their own tune or beat, or ask the child to listen to one, have no music while playing
const QUIET_GAMES = new Set(['freezedance', 'rhythm', 'fairywand', 'birdsong', 'creekchimes', 'syllableclap']);
// each place's mood by its id (places not listed are sunny)
const PLACE_MOOD = {
  library: 'cozy', bakery: 'cozy', attic: 'cozy', toyshop: 'cozy', cottage: 'cozy',
  gnomes: 'woods', robin: 'woods', treehouse: 'woods', honeytree: 'woods',
  owlhollow: 'twinkle', fairyring: 'twinkle', mothmeadow: 'twinkle', shootingstar: 'twinkle', moonlake: 'twinkle', cloudcastle: 'twinkle',
  wishingwell: 'twinkle', glacier: 'twinkle', moongarden: 'twinkle', observatory: 'twinkle', comet: 'twinkle',
  volcano: 'mystery', crystalcave: 'mystery', phoenix: 'mystery', grotto: 'mystery', hoard: 'mystery',
};
function musicMood() {
  switch (scene) {
    case 'loading': return null;
    case 'title': case 'stages': case 'end': case 'dinoend': return 'title';
    case 'map': case 'kingdom': return isDino() ? 'jungle' : 'adventure';
    case 'location': return PLACE_MOOD[ADV?.place?.id] || 'sunny';
    case 'minigame': {
      const g = SCENES.minigame.g;
      if (!g) return 'bounce';
      if (QUIET_GAMES.has(g.type) && g.phase === 'play') return null;
      const mood = PLACE_MOOD[g.loc?.id];
      if (mood === 'twinkle' || mood === 'mystery') return 'starry';
      return [...g.type].reduce((n, c) => n + c.charCodeAt(0), 0) % 2 ? 'skip' : 'bounce';
    }
    case 'world': return WS.kind === 'explore' ? (isDino() ? 'jungle' : 'woods') : 'sneak';
    case 'hide': return 'sneak';
    case 'night': case 'dinonight': return 'lullaby';
    case 'show': { const s = SCENES.show; return s.state === 'talent' && QUIET_GAMES.has(s.tg?.type) ? null : 'dance'; }
    case 'style': return 'cozy';
    case 'dinohop': case 'dinodefense': return 'jungle';
  }
  return 'adventure';
}

// --- the synth ----------------------------------------------------------------------------------
// every part goes through one bus (soft lowpass, a little echo) so the whole song fades and dips together
const MZ = { bus: null, song: null, step: 0, next: 0, fade: 0, level: -1, live: [], noise: null };
function musicBus() {
  const bus = AC.createGain(), lp = AC.createBiquadFilter(), echo = AC.createDelay(1), fb = AC.createGain(), wet = AC.createGain(), vol = AC.createGain();
  bus.gain.value = 0;
  lp.type = 'lowpass'; lp.frequency.value = 4200;
  fb.gain.value = 0.22; wet.gain.value = 0.16;
  vol.gain.value = 0.32; // the music sits well under the sound effects and read-aloud
  bus.connect(lp); lp.connect(vol); vol.connect(AC.destination);
  lp.connect(echo); echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(vol);
  MZ.bus = bus;
  const len = Math.floor(AC.sampleRate * 0.3), buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  MZ.noise = buf;
}
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
function stepSemis(song, deg) {
  const sc = MSCALES[song.scale], oct = Math.floor(deg / 7);
  return sc[deg - oct * 7] + 12 * oct;
}
// one note: oscillators into an envelope (attack, hold, release) into the bus
function mVoice(freq, t, dur, type, vol, { attack = 0.01, release = 0.12, decay = false, partials = [] } = {}) {
  const g = AC.createGain(), end = t + dur + release;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  if (decay) g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.05) + release);
  else { g.gain.setValueAtTime(vol, t + Math.max(dur, attack)); g.gain.exponentialRampToValueAtTime(0.0001, end); }
  g.connect(MZ.bus);
  for (const [mul, kind, v] of [[1, type, 1], ...partials]) {
    const o = AC.createOscillator(), og = AC.createGain();
    o.type = kind; o.frequency.setValueAtTime(freq * mul, t); og.gain.value = v;
    o.connect(og).connect(g);
    o.start(t); o.stop(end + 0.02);
    MZ.live.push({ o, end });
  }
}
function mNoise(t, dur, vol, type, freq) {
  const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = MZ.noise; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(MZ.bus);
  src.start(t); src.stop(t + dur + 0.02);
  MZ.live.push({ o: src, end: t + dur });
}
const mKick = (t, v = 1) => { mVoice(150, t, 0.01, 'sine', 0.16 * v, { release: 0.16, decay: true }); MZ.live[MZ.live.length - 1].o.frequency.exponentialRampToValueAtTime(45, t + 0.14); };
const mTom = (t, f, v = 1) => { mVoice(f, t, 0.01, 'sine', 0.11 * v, { release: 0.2, decay: true }); MZ.live[MZ.live.length - 1].o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.18); };

const LEADS = {
  bell: (f, t, d) => mVoice(f, t, Math.min(d, 0.5), 'sine', 0.05, { release: 0.6, decay: true, partials: [[2, 'sine', 0.25], [3, 'sine', 0.08]] }),
  tri: (f, t, d) => mVoice(f, t, d * 0.85, 'triangle', 0.055, { attack: 0.015, release: 0.1, partials: [[2, 'sine', 0.12]] }),
  square: (f, t, d) => mVoice(f, t, d * 0.75, 'square', 0.022, { release: 0.08, partials: [[1.005, 'triangle', 1.6]] }),
  pluck: (f, t) => mVoice(f, t, 0.02, 'triangle', 0.06, { release: 0.16, decay: true, partials: [[2, 'sine', 0.2]] }),
  marimba: (f, t, d) => mVoice(f, t, 0.02, 'sine', 0.065, { release: Math.min(0.45, d + 0.15), decay: true, partials: [[4, 'sine', 0.12]] }),
};
function songNotes(song) {
  if (song.notes) return song.notes;
  const toks = song.mel.split(/\s+/).filter(x => x && x !== '|');
  return (song.notes = toks.map((x, i) => {
    if (x === '-' || x === '.') return null;
    let len = 1; while (toks[i + len] === '-') len++;
    return { deg: +x, len };
  }));
}
function playStep(song, i, t, st) {
  const notes = songNotes(song), bar = song.bar || 8, n = notes.length;
  const s = i % n, b = Math.floor(s / bar), beat = s % bar;
  const sw = song.swing && beat % 2 ? st * song.swing : 0;
  const chord = song.chords[b % song.chords.length], root = song.key - 24 + stepSemis(song, chord);
  // melody
  const note = notes[s];
  if (note) LEADS[song.lead](midiHz(song.key + stepSemis(song, note.deg)), t + sw, note.len * st);
  // soft chord pad under each bar
  if (beat === 0) for (const k of [0, 2, 4]) mVoice(midiHz(song.key - 12 + stepSemis(song, chord + k)), t, bar * st * 0.9, 'sine', 0.014, { attack: 0.25, release: 0.4 });
  // bass
  const fifth = song.key - 24 + stepSemis(song, chord + 4);
  if (song.bass === 'long' && beat === 0) mVoice(midiHz(root), t, bar * st * 0.8, 'triangle', 0.07, { attack: 0.03, release: 0.3 });
  if (song.bass === 'pulse' && beat % 2 === 0) mVoice(midiHz(root), t + sw, st * 0.6, 'triangle', 0.075, { release: 0.06 });
  if (song.bass === 'walk' && beat % 2 === 0) mVoice(midiHz([root, fifth, root + 12, fifth][beat / 2 % 4]), t, st * 0.9, 'triangle', 0.075, { release: 0.06 });
  // drums
  if (bar !== 8) return;
  const hat = (v = 1) => mNoise(t + sw, 0.035, 0.03 * v, 'highpass', 7500);
  switch (song.drums) {
    case 'soft': if (beat === 0 || beat === 4) mKick(t, 0.7); if (beat === 2 || beat === 6) hat(0.8); break;
    case 'pop':
      if (beat === 0 || beat === 4 || (beat === 5 && b % 2)) mKick(t);
      if (beat === 2 || beat === 6) mNoise(t, 0.12, 0.06, 'bandpass', 1800);
      if (beat % 2) hat(); break;
    case 'tick': if (beat % 2 === 0) hat(0.6); if (beat === 2 || beat === 6) mVoice(1800, t, 0.01, 'square', 0.012, { release: 0.03, decay: true }); break;
    case 'tom': if (beat === 0) mTom(t, 90); if (beat === 5) mTom(t, 120, 0.6); break;
    case 'jungle':
      if (beat === 0 || beat === 3) mTom(t, 95); if (beat === 5) mTom(t, 140, 0.8); if (beat === 6) mTom(t, 190, 0.7);
      hat(0.5); break;
  }
}

// called every frame from the main loop
function musicUpdate() {
  if (!AC || AC.state !== 'running') return;
  if (!MZ.bus) musicBus();
  const now = AC.currentTime, want = muted || !musicOn ? null : musicMood();
  if (want !== MZ.song) {
    // fade the old song out, then cut what's left of it and start the new one
    if (!MZ.fade) { MZ.fade = now + 0.5; MZ.bus.gain.setTargetAtTime(0, now, 0.12); }
    if (MZ.song && now < MZ.fade) return;
    for (const v of MZ.live) try { v.o.stop(now + 0.02); } catch (e) { /* already stopped */ }
    MZ.live = []; MZ.song = want; MZ.step = 0; MZ.next = now + 0.08; MZ.fade = 0; MZ.level = -1;
  } else if (MZ.fade) { MZ.fade = 0; MZ.level = -1; } // the same song was wanted back before it had faded
  if (!MZ.song) return;
  const level = window.speechSynthesis?.speaking ? 0.35 : 1; // dip under read-aloud
  if (level !== MZ.level) { MZ.bus.gain.setTargetAtTime(level, now, MZ.level < 0 ? 0.25 : 0.15); MZ.level = level; }
  const song = SONGS[MZ.song], st = 30 / song.bpm;
  if (MZ.next < now) MZ.next = now + 0.05; // the tab was hidden: carry on from now
  while (MZ.next < now + 0.2) { playStep(song, MZ.step, MZ.next, st); MZ.step++; MZ.next += st; }
  MZ.live = MZ.live.filter(v => v.end > now - 0.1);
}
