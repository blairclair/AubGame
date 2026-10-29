'use strict';
// Game data: materials (by rarity), customizations (with recipes and points), rivals.

// tier 1 = common, 2 = fancy, 3 = legendary. pts feeds every customization's score.
const MATS = {
  petal:    { icon: '🌸', name: 'Petals',         tier: 1 },
  ribbon:   { icon: '🎀', name: 'Ribbons',        tier: 1 },
  berry:    { icon: '🫐', name: 'Berries',        tier: 1 },
  shell:    { icon: '🐚', name: 'Shells',         tier: 1 },
  feather:  { icon: '🪶', name: 'Feathers',       tier: 2 },
  crystal:  { icon: '💎', name: 'Crystals',       tier: 2 },
  silk:     { icon: '🧶', name: 'Silk',           tier: 2 },
  honey:    { icon: '🍯', name: 'Golden Honey',   tier: 2 },
  stardust: { icon: '⭐', name: 'Stardust',       tier: 3 },
  rainbow:  { icon: '🌈', name: 'Rainbow Drops',  tier: 3 },
  moonbeam: { icon: '🌙', name: 'Moonbeams',      tier: 3 },
  ember:    { icon: '🔥', name: 'Phoenix Embers', tier: 3 },
};
const TIER_PTS = { 1: 1, 2: 3, 3: 7 };
const TIER_NAMES = { 1: 'Common', 2: 'Fancy', 3: 'Legendary' };
const MAT_ORDER = Object.keys(MATS);
for (const k of MAT_ORDER) MATS[k].pts = TIER_PTS[MATS[k].tier];

const SLOTS = [
  { id: 'mane',   name: 'Mane Colour', icon: '🎨' },
  { id: 'style',  name: 'Hairstyle',   icon: '✂️' },
  { id: 'head',   name: 'Head',        icon: '👑' },
  { id: 'neck',   name: 'Neck',        icon: '📿' },
  { id: 'back',   name: 'Back',        icon: '🦋' },
  { id: 'tail',   name: 'Tail',        icon: '🎀' },
  { id: 'hooves', name: 'Hooves',      icon: '💅' },
];

// value: what the art code draws (defaults to id). free items cost nothing and score 0.
const WARDROBE = [
  { id: 'natural',  slot: 'mane', name: 'Cotton Candy',   free: true },
  { id: 'pink',     slot: 'mane', name: 'Bubblegum Pink', cost: { berry: 2, petal: 2 } },
  { id: 'ocean',    slot: 'mane', name: 'Ocean Wave',     cost: { shell: 2, berry: 2 } },
  { id: 'lavender', slot: 'mane', name: 'Lavender Dream', cost: { petal: 2, silk: 1, crystal: 1 } },
  { id: 'seafoam',  slot: 'mane', name: 'Seafoam',        cost: { shell: 2, crystal: 1, feather: 1 } },
  { id: 'gold',     slot: 'mane', name: 'Royal Gold',     cost: { honey: 3, crystal: 1 } },
  { id: 'midnight', slot: 'mane', name: 'Midnight Sky',   cost: { moonbeam: 2, stardust: 1, silk: 1 } },
  { id: 'rainbow',  slot: 'mane', name: 'Rainbow',        cost: { rainbow: 3, crystal: 1 } },

  { id: 'flowing', slot: 'style', name: 'Long & Flowing', free: true, icon: '🌊' },
  { id: 'braid',   slot: 'style', name: 'Braids',         cost: { ribbon: 3 }, icon: '🥨' },
  { id: 'curly',   slot: 'style', name: 'Bouncy Curls',   cost: { silk: 2, ribbon: 1 }, icon: '🌀' },
  { id: 'topknot', slot: 'style', name: 'Top Knot',       cost: { silk: 1, honey: 1, ribbon: 2 }, icon: '🍡' },

  { id: 'bigbow',    slot: 'head', name: 'Big Bow',      cost: { ribbon: 3 }, icon: '🎀' },
  { id: 'crown',     slot: 'head', name: 'Flower Crown', cost: { petal: 4 }, icon: '🌸' },
  { id: 'shellcomb', slot: 'head', name: 'Shell Comb',   cost: { shell: 2, crystal: 1 }, icon: '🐚' },
  { id: 'tiara',     slot: 'head', name: 'Sparkly Tiara', cost: { crystal: 3, honey: 1 }, icon: '👑' },
  { id: 'starclip',  slot: 'head', name: 'Star Clip',    cost: { stardust: 3, crystal: 1 }, icon: '⭐' },

  { id: 'bell',        slot: 'neck', name: 'Ribbon & Bell',  cost: { ribbon: 2 }, icon: '🔔' },
  { id: 'lei',         slot: 'neck', name: 'Daisy Chain',    cost: { petal: 3 }, icon: '🌼' },
  { id: 'shells',      slot: 'neck', name: 'Shell Necklace', cost: { shell: 3 }, icon: '🐚' },
  { id: 'necklace',    slot: 'neck', name: 'Jewel Necklace', cost: { crystal: 2, silk: 1 }, icon: '💎' },
  { id: 'starpendant', slot: 'neck', name: 'Moon Pendant',   cost: { moonbeam: 2, stardust: 1, silk: 1 }, icon: '🌟' },

  { id: 'blanket',  slot: 'back', name: 'Petal Blanket',  cost: { petal: 2, ribbon: 2 }, icon: '🌷' },
  { id: 'shawl',    slot: 'back', name: 'Sea-Silk Shawl', cost: { silk: 2, shell: 2 }, icon: '🌊' },
  { id: 'cape',     slot: 'back', name: 'Royal Cape',     cost: { silk: 2, honey: 2 }, icon: '🟣' },
  { id: 'wings',    slot: 'back', name: 'Fairy Wings',    cost: { feather: 3, rainbow: 2 }, icon: '🧚' },
  { id: 'starcape', slot: 'back', name: 'Starry Cape',    cost: { stardust: 2, moonbeam: 1, silk: 2 }, icon: '🌌' },

  { id: 'tailbow',     slot: 'tail', name: 'Tail Bow',      cost: { ribbon: 2 }, icon: '🎀' },
  { id: 'tailflowers', slot: 'tail', name: 'Tail Blossoms', cost: { petal: 3 }, icon: '🌺' },
  { id: 'pearls',      slot: 'tail', name: 'Pearl Strand',  cost: { shell: 2, crystal: 1 }, icon: '⚪' },
  { id: 'goldcuff',    slot: 'tail', name: 'Gold Cuff',     cost: { honey: 2, crystal: 1 }, icon: '🟡' },
  { id: 'tailstars',   slot: 'tail', name: 'Comet Tail',    cost: { ember: 2, stardust: 1 }, icon: '✨' },

  { id: 'hoof_pink',  value: 'pink',  slot: 'hooves', name: 'Berry Polish',  cost: { berry: 3 } },
  { id: 'hoof_pearl', value: 'pearl', slot: 'hooves', name: 'Pearl Polish',  cost: { shell: 2, silk: 1 } },
  { id: 'hoof_gold',  value: 'gold',  slot: 'hooves', name: 'Gold Polish',   cost: { honey: 2, crystal: 1 } },
  { id: 'hoof_star',  value: 'star',  slot: 'hooves', name: 'Phoenix Polish', cost: { ember: 2, stardust: 1 } },

  // --- the baby dinosaur's wardrobe (dino route): the same treasures, made into things for the journey home ---
  { id: 'd_flowers',  pet: 'dino', slot: 'dhead', name: 'Daisy Crown',     cost: { petal: 3 }, icon: '🌼' },
  { id: 'd_beanie',   pet: 'dino', slot: 'dhead', name: 'Cosy Beanie',     cost: { ribbon: 2, silk: 1 }, icon: '🧢' },
  { id: 'd_explorer', pet: 'dino', slot: 'dhead', name: 'Explorer Hat',    cost: { feather: 2, ribbon: 1, honey: 1 }, icon: '🤠' },
  { id: 'd_crown',    pet: 'dino', slot: 'dhead', name: 'Star Crown',      cost: { stardust: 2, crystal: 1 }, icon: '👑' },

  { id: 'd_bandana',  pet: 'dino', slot: 'dneck', name: 'Red Bandana',     cost: { ribbon: 2 }, icon: '🧣' },
  { id: 'd_shells',   pet: 'dino', slot: 'dneck', name: 'Shell Necklace',  cost: { shell: 3 }, icon: '🐚' },
  { id: 'd_scarf',    pet: 'dino', slot: 'dneck', name: 'Stripy Scarf',    cost: { silk: 2, berry: 1 }, icon: '🧶' },
  { id: 'd_medal',    pet: 'dino', slot: 'dneck', name: 'Brave Medal',     cost: { honey: 2, crystal: 1 }, icon: '🏅' },

  { id: 'd_backpack', pet: 'dino', slot: 'dback', name: 'Little Backpack', cost: { ribbon: 2, berry: 2 }, icon: '🎒' },
  { id: 'd_blanket',  pet: 'dino', slot: 'dback', name: 'Blanket Cape',    cost: { petal: 2, silk: 2 }, icon: '🛏️' },
  { id: 'd_wings',    pet: 'dino', slot: 'dback', name: 'Feather Wings',   cost: { feather: 3, rainbow: 1 }, icon: '🪽' },
  { id: 'd_starcape', pet: 'dino', slot: 'dback', name: 'Starry Cape',     cost: { moonbeam: 2, stardust: 1, silk: 1 }, icon: '🌌' },

  { id: 'd_tailbow',  pet: 'dino', slot: 'dtail', name: 'Tail Bow',        cost: { ribbon: 2 }, icon: '🎀' },
  { id: 'd_bell',     pet: 'dino', slot: 'dtail', name: 'Jingle Bell',     cost: { shell: 2, honey: 1 }, icon: '🔔' },
  { id: 'd_comet',    pet: 'dino', slot: 'dtail', name: 'Comet Streamers', cost: { ember: 2, stardust: 1 }, icon: '☄️' },

  { id: 'd_boots',    pet: 'dino', slot: 'dfeet', name: 'Rain Boots',      cost: { berry: 3 }, icon: '🥾' },
  { id: 'd_socks',    pet: 'dino', slot: 'dfeet', name: 'Stripy Socks',    cost: { silk: 1, petal: 2 }, icon: '🧦' },
  { id: 'd_goldboots',pet: 'dino', slot: 'dfeet', name: 'Gold Boots',      cost: { honey: 2, crystal: 1 }, icon: '✨' },
];
// the baby dinosaur's slots (the unicorn's SLOTS stay as they are)
const DINO_SLOTS = [
  { id: 'dhead', name: 'Hat',    icon: '🎩' },
  { id: 'dneck', name: 'Neck',   icon: '🧣' },
  { id: 'dback', name: 'Back',   icon: '🎒' },
  { id: 'dtail', name: 'Tail',   icon: '🎀' },
  { id: 'dfeet', name: 'Feet',   icon: '🥾' },
];
// an item's points are the rarity points of everything it took to make
for (const it of WARDROBE) {
  it.pts = Object.entries(it.cost || {}).reduce((sum, [k, n]) => sum + MATS[k].pts * n, 0);
  it.tier = Math.max(0, ...Object.keys(it.cost || {}).map(k => MATS[k].tier));
}
const ITEM = Object.fromEntries(WARDROBE.map(i => [i.id, i]));

const SHOW_DAY = 5;
const VISITS_PER_DAY = 3;
const RIVALS = [
  { name: 'Gerald the Gryphon', icon: '🦅', score: 30 },
  { name: 'Marina the Mermaid', icon: '🧜‍♀️', score: 55 },
  { name: 'Duchess Ember the Dragon', icon: '🐉', score: 80 },
];
