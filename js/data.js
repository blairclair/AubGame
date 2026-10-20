'use strict';
// Game data: materials, show themes, wardrobe (with recipes and theme tags).

const MATS = {
  blossom: { icon: '🌸', name: 'Blossom' },
  daisy:   { icon: '🌼', name: 'Daisy' },
  straw:   { icon: '🍓', name: 'Strawberry' },
  berry:   { icon: '🫐', name: 'Blueberry' },
  feather: { icon: '🪶', name: 'Feather' },
  ribbon:  { icon: '🎀', name: 'Ribbon' },
  crystal: { icon: '💎', name: 'Crystal' },
  shell:   { icon: '🐚', name: 'Shell' },
  star:    { icon: '⭐', name: 'Stardust' },
  apple:   { icon: '🍎', name: 'Apple' },
};
const MAT_ORDER = ['blossom', 'daisy', 'straw', 'berry', 'feather', 'ribbon', 'crystal', 'shell', 'star', 'apple'];

const THEMES = {
  garden: { name: 'Garden Party', icon: '🌸', blurb: 'flowers, petals and springtime colours' },
  night:  { name: 'Starry Night', icon: '✨', blurb: 'stars, moonlight and midnight colours' },
  royal:  { name: 'Royal Ball',   icon: '👑', blurb: 'crowns, capes, gold and jewels' },
  sea:    { name: 'Under the Sea', icon: '🐚', blurb: 'shells, pearls and ocean colours' },
};

const SLOTS = [
  { id: 'mane',   name: 'Mane Colour', icon: '🎨' },
  { id: 'style',  name: 'Hairstyle',   icon: '✂️' },
  { id: 'head',   name: 'Head',        icon: '👑' },
  { id: 'neck',   name: 'Neck',        icon: '📿' },
  { id: 'back',   name: 'Back',        icon: '🦋' },
  { id: 'tail',   name: 'Tail',        icon: '🎀' },
  { id: 'hooves', name: 'Hooves',      icon: '💅' },
];

// value: what the art code draws (defaults to id). free: owned from the start.
const WARDROBE = [
  { id: 'natural',  slot: 'mane', name: 'Cotton Candy',   tags: [],                  free: true },
  { id: 'pink',     slot: 'mane', name: 'Bubblegum Pink', tags: ['garden', 'royal'], cost: { straw: 3 } },
  { id: 'lavender', slot: 'mane', name: 'Lavender Dream', tags: ['night', 'royal'],  cost: { berry: 2, straw: 2 } },
  { id: 'ocean',    slot: 'mane', name: 'Ocean Wave',     tags: ['sea'],             cost: { berry: 3 } },
  { id: 'seafoam',  slot: 'mane', name: 'Seafoam',        tags: ['sea', 'garden'],   cost: { shell: 2, berry: 1 } },
  { id: 'gold',     slot: 'mane', name: 'Royal Gold',     tags: ['royal'],           cost: { crystal: 2, daisy: 2 } },
  { id: 'midnight', slot: 'mane', name: 'Midnight Sky',   tags: ['night'],           cost: { star: 2, berry: 2 } },
  { id: 'rainbow',  slot: 'mane', name: 'Rainbow',        tags: ['garden'],          cost: { straw: 1, berry: 1, daisy: 1, blossom: 1 } },

  { id: 'flowing', slot: 'style', name: 'Long & Flowing', tags: ['sea'],    free: true, icon: '🌊' },
  { id: 'braid',   slot: 'style', name: 'Braids',         tags: ['garden'], free: true, icon: '🥨' },
  { id: 'curly',   slot: 'style', name: 'Bouncy Curls',   tags: ['royal'],  free: true, icon: '🌀' },
  { id: 'topknot', slot: 'style', name: 'Top Knot',       tags: ['night'],  free: true, icon: '🍡' },

  { id: 'crown',     slot: 'head', name: 'Flower Crown', tags: ['garden'],          cost: { blossom: 3, daisy: 2 }, icon: '🌸' },
  { id: 'tiara',     slot: 'head', name: 'Sparkly Tiara', tags: ['royal'],          cost: { crystal: 2, ribbon: 1 }, icon: '👑' },
  { id: 'starclip',  slot: 'head', name: 'Star Clip',    tags: ['night'],           cost: { star: 2, crystal: 1 }, icon: '⭐' },
  { id: 'shellcomb', slot: 'head', name: 'Shell Comb',   tags: ['sea'],             cost: { shell: 2, crystal: 1 }, icon: '🐚' },
  { id: 'bigbow',    slot: 'head', name: 'Big Bow',      tags: ['garden', 'royal'], cost: { ribbon: 2 }, icon: '🎀' },

  { id: 'lei',         slot: 'neck', name: 'Daisy Chain',    tags: ['garden'], cost: { daisy: 4 }, icon: '🌼' },
  { id: 'necklace',    slot: 'neck', name: 'Jewel Necklace', tags: ['royal'],  cost: { crystal: 2, ribbon: 1 }, icon: '💎' },
  { id: 'shells',      slot: 'neck', name: 'Shell Necklace', tags: ['sea'],    cost: { shell: 3 }, icon: '🐚' },
  { id: 'starpendant', slot: 'neck', name: 'Star Pendant',   tags: ['night'],  cost: { star: 1, ribbon: 1 }, icon: '🌟' },
  { id: 'bell',        slot: 'neck', name: 'Ribbon & Bell',  tags: [],         cost: { ribbon: 1 }, icon: '🔔' },

  { id: 'wings',    slot: 'back', name: 'Fairy Wings',    tags: ['garden', 'night'], cost: { feather: 3, blossom: 1 }, icon: '🧚' },
  { id: 'cape',     slot: 'back', name: 'Royal Cape',     tags: ['royal'],           cost: { ribbon: 2, crystal: 1 }, icon: '🟣' },
  { id: 'starcape', slot: 'back', name: 'Starry Cape',    tags: ['night'],           cost: { star: 2, ribbon: 1 }, icon: '🌌' },
  { id: 'blanket',  slot: 'back', name: 'Petal Blanket',  tags: ['garden'],          cost: { blossom: 3, ribbon: 1 }, icon: '🌷' },
  { id: 'shawl',    slot: 'back', name: 'Sea-Silk Shawl', tags: ['sea'],             cost: { shell: 2, feather: 1 }, icon: '🌊' },

  { id: 'tailbow',     slot: 'tail', name: 'Tail Bow',      tags: [],         cost: { ribbon: 1 }, icon: '🎀' },
  { id: 'tailflowers', slot: 'tail', name: 'Tail Blossoms', tags: ['garden'], cost: { blossom: 2 }, icon: '🌺' },
  { id: 'pearls',      slot: 'tail', name: 'Pearl Strand',  tags: ['sea'],    cost: { shell: 2 }, icon: '⚪' },
  { id: 'tailstars',   slot: 'tail', name: 'Tail Stars',    tags: ['night'],  cost: { star: 1, feather: 1 }, icon: '✨' },
  { id: 'goldcuff',    slot: 'tail', name: 'Gold Cuff',     tags: ['royal'],  cost: { crystal: 1 }, icon: '🟡' },

  { id: 'hoof_pink',  value: 'pink',  slot: 'hooves', name: 'Pink Polish',      tags: ['garden'], cost: { straw: 2 } },
  { id: 'hoof_gold',  value: 'gold',  slot: 'hooves', name: 'Gold Polish',      tags: ['royal'],  cost: { crystal: 1, daisy: 1 } },
  { id: 'hoof_pearl', value: 'pearl', slot: 'hooves', name: 'Pearl Polish',     tags: ['sea'],    cost: { shell: 2 } },
  { id: 'hoof_star',  value: 'star',  slot: 'hooves', name: 'Starlight Polish', tags: ['night'],  cost: { star: 1, berry: 1 } },
];
const ITEM = Object.fromEntries(WARDROBE.map(i => [i.id, i]));

const SLOT_NAMES = ['Morning', 'Afternoon', 'Evening'];
const SHOW_DAY = 5;
const RIVALS = [
  { name: 'Gerald the Gryphon', icon: '🦅', score: 21.6 },
  { name: 'Marina the Mermaid', icon: '🧜‍♀️', score: 23.1 },
  { name: 'Duchess Ember the Dragon', icon: '🐉', score: 24.4 },
];
const JUDGES = [
  { name: 'Professor Hoot', icon: '🦉', what: 'Style & Theme' },
  { name: 'Madame Glimmerwing', icon: '🧚', what: 'Runway Walk' },
  { name: 'Lord Sparkscale', icon: '🐲', what: 'Shine & Poise' },
];
