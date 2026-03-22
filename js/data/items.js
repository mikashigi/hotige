// --- ボーナスティア閾値 ---
// BONUS_THRESHOLDS[i] 個以上で bonus[i] が加算される
const BONUS_THRESHOLDS = [100, 500, 999];

function getItemTier(count) {
  if (count >= 999) return 3;
  if (count >= 500) return 2;
  if (count >= 100) return 1;
  return 0;
}

// --- アイテムテーブル ---
// 基本効果: 個数によらず×1固定（0〜99個でも100個でも同じ）
// bonus[i]: BONUS_THRESHOLDS[i] 個到達で加算されるフラットボーナス（累積）
const ITEMS = [
  { id: "slime_gel",    name: "スライムゼリー",  icon: "🟢",
    str: 0, vit: 1, int: 0, dex: 0, agi: 1, luk: 0,
    bonus: [
      { str: 0, vit:  3, int: 0, dex: 0, agi:  3, luk: 0 },
      { str: 0, vit:  5, int: 0, dex: 0, agi:  5, luk: 2 },
      { str: 0, vit: 10, int: 0, dex: 0, agi:  8, luk: 5 },
    ] },
  { id: "goblin_fang",  name: "ゴブリンの牙",    icon: "🦷",
    str: 2, vit: 0, int: 0, dex: 1, agi: 0, luk: 0,
    bonus: [
      { str:  5, vit: 0, int: 0, dex:  3, agi: 0, luk: 0 },
      { str: 10, vit: 0, int: 0, dex:  6, agi: 3, luk: 0 },
      { str: 18, vit: 0, int: 0, dex: 10, agi: 5, luk: 0 },
    ] },
  { id: "orc_hide",     name: "オークの皮",      icon: "🟫",
    str: 1, vit: 3, int: 0, dex: 0, agi: 0, luk: 0,
    bonus: [
      { str:  3, vit:  8, int: 0, dex: 0, agi: 0, luk: 0 },
      { str:  6, vit: 15, int: 0, dex: 3, agi: 0, luk: 0 },
      { str: 10, vit: 25, int: 0, dex: 5, agi: 0, luk: 0 },
    ] },
  { id: "troll_blood",  name: "トロルの血",      icon: "🩸",
    str: 0, vit: 2, int: 2, dex: 0, agi: 0, luk: 1,
    bonus: [
      { str: 0, vit:  5, int:  5, dex: 0, agi: 0, luk:  3 },
      { str: 0, vit: 10, int: 10, dex: 0, agi: 0, luk:  6 },
      { str: 0, vit: 18, int: 18, dex: 0, agi: 0, luk: 10 },
    ] },
  { id: "dragon_scale", name: "ドラゴンの鱗",    icon: "🐉",
    str: 3, vit: 3, int: 3, dex: 1, agi: 1, luk: 2,
    bonus: [
      { str:  8, vit:  8, int:  8, dex:  3, agi:  3, luk:  5 },
      { str: 15, vit: 15, int: 15, dex:  6, agi:  6, luk: 10 },
      { str: 25, vit: 25, int: 25, dex: 10, agi: 10, luk: 18 },
    ] },
  { id: "lucky_coin",   name: "ラッキーコイン",  icon: "🍀",
    str: 0, vit: 0, int: 0, dex: 0, agi: 0, luk: 5,
    bonus: [
      { str: 0, vit: 0, int: 0, dex: 0, agi:  3, luk: 10 },
      { str: 0, vit: 0, int: 0, dex: 3, agi:  6, luk: 20 },
      { str: 0, vit: 0, int: 0, dex: 5, agi: 10, luk: 35 },
    ] },

  // --- 中盤アイテム ---
  { id: "rabbit_fur",   name: "うさぎの毛皮",    icon: "🐰",
    str: 0, vit: 0, int: 0, dex: 1, agi: 2, luk: 1,
    bonus: [
      { str: 0, vit: 0, int: 0, dex:  2, agi:  5, luk:  3 },
      { str: 0, vit: 0, int: 0, dex:  4, agi:  9, luk:  5 },
      { str: 0, vit: 0, int: 0, dex:  7, agi: 15, luk:  8 },
    ] },
  { id: "wolf_claw",    name: "狼の爪",          icon: "🐺",
    str: 2, vit: 0, int: 0, dex: 0, agi: 2, luk: 0,
    bonus: [
      { str:  5, vit: 0, int: 0, dex: 0, agi:  5, luk: 0 },
      { str: 10, vit: 0, int: 0, dex: 3, agi:  9, luk: 0 },
      { str: 18, vit: 0, int: 0, dex: 5, agi: 15, luk: 2 },
    ] },
  { id: "mushroom_cap", name: "キノコのかさ",    icon: "🍄",
    str: 0, vit: 1, int: 2, dex: 0, agi: 0, luk: 0,
    bonus: [
      { str: 0, vit:  3, int:  5, dex: 0, agi: 0, luk:  2 },
      { str: 0, vit:  6, int: 10, dex: 0, agi: 0, luk:  4 },
      { str: 0, vit: 10, int: 18, dex: 0, agi: 0, luk:  7 },
    ] },
  { id: "bat_wing",     name: "コウモリの翼",    icon: "🦇",
    str: 0, vit: 0, int: 0, dex: 2, agi: 2, luk: 0,
    bonus: [
      { str: 0, vit: 0, int: 0, dex:  5, agi:  5, luk:  0 },
      { str: 0, vit: 0, int: 0, dex:  9, agi:  9, luk:  2 },
      { str: 0, vit: 0, int: 0, dex: 15, agi: 15, luk:  5 },
    ] },
  { id: "sand_fossil",  name: "砂の化石",        icon: "🦴",
    str: 0, vit: 2, int: 0, dex: 1, agi: 0, luk: 0,
    bonus: [
      { str:  2, vit:  5, int: 0, dex:  3, agi: 0, luk: 0 },
      { str:  4, vit: 10, int: 0, dex:  6, agi: 0, luk: 0 },
      { str:  7, vit: 17, int: 0, dex: 10, agi: 0, luk: 2 },
    ] },
  { id: "mummy_cloth",  name: "ミイラの包帯",    icon: "🧻",
    str: 0, vit: 1, int: 0, dex: 0, agi: 0, luk: 2,
    bonus: [
      { str: 0, vit:  3, int:  2, dex: 0, agi: 0, luk:  5 },
      { str: 0, vit:  6, int:  4, dex: 0, agi: 0, luk: 10 },
      { str: 0, vit: 10, int:  7, dex: 0, agi: 0, luk: 17 },
    ] },
  { id: "ice_gem",      name: "氷晶石",          icon: "🔷",
    str: 0, vit: 0, int: 2, dex: 0, agi: 1, luk: 0,
    bonus: [
      { str: 0, vit:  2, int:  5, dex: 0, agi:  3, luk: 0 },
      { str: 0, vit:  4, int: 10, dex: 0, agi:  6, luk: 2 },
      { str: 0, vit:  7, int: 18, dex: 0, agi: 10, luk: 4 },
    ] },
  { id: "fire_gem",     name: "火炎石",          icon: "🔥",
    str: 2, vit: 0, int: 1, dex: 0, agi: 0, luk: 0,
    bonus: [
      { str:  5, vit:  2, int:  3, dex: 0, agi: 0, luk: 0 },
      { str: 10, vit:  4, int:  6, dex: 0, agi: 3, luk: 0 },
      { str: 18, vit:  7, int: 10, dex: 0, agi: 5, luk: 2 },
    ] },
  { id: "sea_scale",    name: "海の鱗",          icon: "🐟",
    str: 0, vit: 2, int: 0, dex: 2, agi: 0, luk: 0,
    bonus: [
      { str:  2, vit:  5, int: 0, dex:  5, agi:  2, luk: 0 },
      { str:  4, vit: 10, int: 0, dex:  9, agi:  4, luk: 2 },
      { str:  7, vit: 17, int: 0, dex: 15, agi:  7, luk: 4 },
    ] },
  { id: "sky_crystal",  name: "天空の結晶",      icon: "✨",
    str: 0, vit: 0, int: 0, dex: 2, agi: 3, luk: 0,
    bonus: [
      { str:  2, vit: 0, int:  2, dex:  5, agi:  8, luk:  2 },
      { str:  4, vit: 0, int:  4, dex:  9, agi: 15, luk:  4 },
      { str:  7, vit: 0, int:  7, dex: 15, agi: 25, luk:  7 },
    ] },

  // --- 精製品 ---
  { id: "forest_essence", name: "森林の精髄",    icon: "🌿",
    str: 3, vit: 2, int: 2, dex: 3, agi: 4, luk: 2,
    bonus: [
      { str:  8, vit:  5, int:  5, dex:  8, agi: 10, luk:  5 },
      { str: 15, vit: 10, int:  8, dex: 15, agi: 18, luk:  8 },
      { str: 25, vit: 16, int: 12, dex: 25, agi: 30, luk: 14 },
    ] },
  { id: "desert_relic",   name: "砂漠の遺宝",    icon: "🏺",
    str: 2, vit: 5, int: 0, dex: 3, agi: 0, luk: 4,
    bonus: [
      { str:  5, vit: 12, int: 0, dex:  8, agi: 0, luk: 10 },
      { str: 10, vit: 22, int: 0, dex: 15, agi: 0, luk: 18 },
      { str: 16, vit: 38, int: 0, dex: 25, agi: 0, luk: 30 },
    ] },
  { id: "elemental_stone", name: "元素石",       icon: "🪨",
    str: 4, vit: 3, int: 5, dex: 0, agi: 3, luk: 0,
    bonus: [
      { str: 10, vit:  8, int: 12, dex: 0, agi:  8, luk: 0 },
      { str: 18, vit: 15, int: 22, dex: 0, agi: 15, luk: 0 },
      { str: 30, vit: 25, int: 38, dex: 0, agi: 25, luk: 0 },
    ] },
  { id: "celestial_gem",  name: "天界の宝石",    icon: "💎",
    str: 5, vit: 5, int: 4, dex: 6, agi: 7, luk: 3,
    bonus: [
      { str: 12, vit: 12, int: 10, dex: 15, agi: 18, luk:  8 },
      { str: 22, vit: 22, int: 18, dex: 28, agi: 32, luk: 15 },
      { str: 38, vit: 38, int: 30, dex: 45, agi: 52, luk: 25 },
    ] },
  { id: "refined_core",   name: "精製コア",      icon: "⚙️",
    str: 5, vit: 5, int: 0, dex: 2, agi: 2, luk: 0,
    bonus: [
      { str: 10, vit: 10, int: 0, dex:  5, agi:  5, luk:  0 },
      { str: 20, vit: 20, int: 0, dex: 10, agi: 10, luk:  0 },
      { str: 35, vit: 35, int: 0, dex: 16, agi: 16, luk:  5 },
    ] },
  { id: "magic_essence",  name: "魔力精髄",      icon: "🔮",
    str: 0, vit: 2, int: 6, dex: 0, agi: 0, luk: 5,
    bonus: [
      { str: 0, vit:  5, int: 12, dex: 0, agi:  3, luk: 10 },
      { str: 0, vit: 10, int: 22, dex: 3, agi:  6, luk: 18 },
      { str: 0, vit: 16, int: 38, dex: 5, agi: 10, luk: 30 },
    ] },
  { id: "dragon_gem",     name: "竜晶",          icon: "💜",
    str: 8, vit: 8, int: 8, dex: 4, agi: 4, luk: 6,
    bonus: [
      { str: 15, vit: 15, int: 15, dex:  8, agi:  8, luk: 12 },
      { str: 28, vit: 28, int: 28, dex: 15, agi: 15, luk: 22 },
      { str: 45, vit: 45, int: 45, dex: 25, agi: 25, luk: 38 },
    ] },
];

// アイテムIDから参照するためのマップ
const ITEM_MAP = Object.fromEntries(ITEMS.map(item => [item.id, item]));
