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
  { id: "slime_gel",    name: "スライムゼリー",
    str: 0, vit: 1, int: 0, dex: 0, agi: 1, luk: 0,
    bonus: [
      { str: 0, vit:  3, int: 0, dex: 0, agi:  3, luk: 0 },
      { str: 0, vit:  5, int: 0, dex: 0, agi:  5, luk: 2 },
      { str: 0, vit: 10, int: 0, dex: 0, agi:  8, luk: 5 },
    ] },
  { id: "goblin_fang",  name: "ゴブリンの牙",
    str: 2, vit: 0, int: 0, dex: 1, agi: 0, luk: 0,
    bonus: [
      { str:  5, vit: 0, int: 0, dex:  3, agi: 0, luk: 0 },
      { str: 10, vit: 0, int: 0, dex:  6, agi: 3, luk: 0 },
      { str: 18, vit: 0, int: 0, dex: 10, agi: 5, luk: 0 },
    ] },
  { id: "orc_hide",     name: "オークの皮",
    str: 1, vit: 3, int: 0, dex: 0, agi: 0, luk: 0,
    bonus: [
      { str:  3, vit:  8, int: 0, dex: 0, agi: 0, luk: 0 },
      { str:  6, vit: 15, int: 0, dex: 3, agi: 0, luk: 0 },
      { str: 10, vit: 25, int: 0, dex: 5, agi: 0, luk: 0 },
    ] },
  { id: "troll_blood",  name: "トロルの血",
    str: 0, vit: 2, int: 2, dex: 0, agi: 0, luk: 1,
    bonus: [
      { str: 0, vit:  5, int:  5, dex: 0, agi: 0, luk:  3 },
      { str: 0, vit: 10, int: 10, dex: 0, agi: 0, luk:  6 },
      { str: 0, vit: 18, int: 18, dex: 0, agi: 0, luk: 10 },
    ] },
  { id: "dragon_scale", name: "ドラゴンの鱗",
    str: 3, vit: 3, int: 3, dex: 1, agi: 1, luk: 2,
    bonus: [
      { str:  8, vit:  8, int:  8, dex:  3, agi:  3, luk:  5 },
      { str: 15, vit: 15, int: 15, dex:  6, agi:  6, luk: 10 },
      { str: 25, vit: 25, int: 25, dex: 10, agi: 10, luk: 18 },
    ] },
  { id: "lucky_coin",   name: "ラッキーコイン",
    str: 0, vit: 0, int: 0, dex: 0, agi: 0, luk: 5,
    bonus: [
      { str: 0, vit: 0, int: 0, dex: 0, agi:  3, luk: 10 },
      { str: 0, vit: 0, int: 0, dex: 3, agi:  6, luk: 20 },
      { str: 0, vit: 0, int: 0, dex: 5, agi: 10, luk: 35 },
    ] },
];

// アイテムIDから参照するためのマップ
const ITEM_MAP = Object.fromEntries(ITEMS.map(item => [item.id, item]));
