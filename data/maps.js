// --- マップ定義 ---
// 1マップ=10ステージ、ステージ10はボス
// isFinal: true のボスを倒すとゲームクリア
//
// マップオブジェクトのフィールド:
//   bg          : 背景画像ファイル名（省略時 = 背景なし）例: "bg/field.png"
//   icon        : マップ名横のアイコン画像（省略時 = 非表示）例: "icon/field.png"
//   mapBonus    : 全モンスター999体達成ボーナス
//
// 各 enemy / boss オブジェクトのフィールド:
//   name        : 表示名
//   img         : 画像ファイル名
//   drops       : ドロップテーブル [{ itemId, rate }]
//   hpMult      : HP倍率（省略時 1.0）
//   atkMult     : ATK倍率（省略時 1.0）
//   killBonus   : 討伐数ボーナス [100体, 500体, 999体] 各ステータスオブジェクト

const MAP_DEFS = [
  // ===== マップ 0: 草原 =====
  {
    name: "草原",
    bg:   "",   // 例: "bg/field.png"
    icon: "",   // 例: "icon/field.png"
    mapBonus: { str:5, vit:5, dex:3, agi:3, luk:2 },
    enemies: [
      { name: "スライム",  img: "enemy_slime.png",
        drops: [{ itemId: "slime_gel", rate: 0.60 }],
        killBonus: [{ vit:1, agi:1 }, { vit:2, agi:2 }, { vit:3, agi:3, luk:1 }] },
      { name: "野うさぎ",  img: "enemy_slime.png",
        drops: [{ itemId: "slime_gel", rate: 0.40 }],
        killBonus: [{ agi:1, dex:1 }, { agi:2, dex:2 }, { agi:4, dex:3 }] },
      { name: "ゴブリン",  img: "enemy_goblin.png",
        drops: [{ itemId: "goblin_fang", rate: 0.40 }],
        killBonus: [{ str:1, dex:1 }, { str:2, dex:2 }, { str:4, dex:3 }] },
      { name: "ゴブリン2", img: "enemy_goblin.png",
        drops: [{ itemId: "goblin_fang", rate: 0.50 }],
        killBonus: [{ str:2 }, { str:4, dex:1 }, { str:7, dex:2 }] },
    ],
    boss: { name: "草原の王", img: "enemy_goblin.png",
      drops: [{ itemId: "slime_gel", rate: 0.9 }, { itemId: "goblin_fang", rate: 0.9 }],
      killBonus: [{ str:2, vit:2, dex:1 }, { str:4, vit:4, dex:2, luk:1 }, { str:8, vit:7, dex:3, agi:2, luk:2 }] },
  },

  // ===== マップ 1: 森 =====
  {
    name: "森",
    bg:   "",
    icon: "",
    mapBonus: { str:8, vit:6, agi:4, dex:3 },
    enemies: [
      { name: "ウルフ",         img: "enemy_goblin.png",
        drops: [{ itemId: "slime_gel", rate: 0.50 }],
        killBonus: [{ str:1, agi:1 }, { str:2, agi:3 }, { str:4, agi:5 }] },
      { name: "キノコ人",       img: "enemy_goblin.png",
        drops: [{ itemId: "slime_gel", rate: 0.40 }],
        killBonus: [{ int:1, vit:1 }, { int:2, vit:2 }, { int:4, vit:4 }] },
      { name: "ウッドゴーレム", img: "enemy_orc.png",
        drops: [{ itemId: "goblin_fang", rate: 0.50 }],
        killBonus: [{ str:2, vit:1 }, { str:4, vit:2 }, { str:7, vit:4 }] },
    ],
    boss: { name: "森の主", img: "enemy_orc.png",
      drops: [{ itemId: "slime_gel", rate: 0.9 }, { itemId: "goblin_fang", rate: 0.9 }],
      killBonus: [{ str:3, vit:2, dex:1 }, { str:6, vit:4, dex:2, agi:1 }, { str:11, vit:8, dex:4, agi:3, luk:1 }] },
  },

  // ===== マップ 2: 洞窟 =====
  {
    name: "洞窟",
    bg:   "",
    icon: "",
    mapBonus: { str:10, vit:8, dex:5, agi:3 },
    enemies: [
      { name: "コウモリ",         img: "enemy_goblin.png",
        drops: [{ itemId: "goblin_fang", rate: 0.50 }],
        killBonus: [{ agi:2, dex:1 }, { agi:4, dex:2 }, { agi:7, dex:4 }] },
      { name: "ゴブリン長",       img: "enemy_goblin.png",
        drops: [{ itemId: "goblin_fang", rate: 0.55 }, { itemId: "orc_hide", rate: 0.20 }],
        killBonus: [{ str:2, dex:1 }, { str:4, dex:3 }, { str:7, dex:5, luk:1 }] },
      { name: "ストーンゴーレム", img: "enemy_orc.png",
        drops: [{ itemId: "orc_hide", rate: 0.50 }],
        killBonus: [{ str:2, vit:2 }, { str:5, vit:4 }, { str:8, vit:7 }] },
    ],
    boss: { name: "岩窟の番人", img: "enemy_orc.png",
      drops: [{ itemId: "orc_hide", rate: 0.9 }, { itemId: "goblin_fang", rate: 0.9 }],
      killBonus: [{ str:4, vit:3, dex:1 }, { str:8, vit:6, dex:3 }, { str:14, vit:10, dex:5, agi:2, luk:1 }] },
  },

  // ===== マップ 3: 砂漠 =====
  {
    name: "砂漠",
    bg:   "",
    icon: "",
    mapBonus: { str:10, vit:8, dex:5, luk:5 },
    enemies: [
      { name: "サンドワーム", img: "enemy_orc.png",
        drops: [{ itemId: "orc_hide", rate: 0.50 }],
        killBonus: [{ vit:2, str:1 }, { vit:4, str:2 }, { vit:8, str:4 }] },
      { name: "スコーピオン", img: "enemy_orc.png",
        drops: [{ itemId: "orc_hide", rate: 0.45 }, { itemId: "goblin_fang", rate: 0.20 }],
        killBonus: [{ dex:2, agi:1 }, { dex:4, agi:3 }, { dex:7, agi:5 }] },
      { name: "ミイラ兵",     img: "enemy_troll.png",
        drops: [{ itemId: "goblin_fang", rate: 0.50 }],
        killBonus: [{ vit:2, luk:1 }, { vit:4, luk:2 }, { vit:7, luk:4, str:2 }] },
    ],
    boss: { name: "砂漠の覇者", img: "enemy_troll.png",
      drops: [{ itemId: "orc_hide", rate: 0.9 }, { itemId: "goblin_fang", rate: 0.9 }],
      killBonus: [{ str:4, vit:4, luk:2 }, { str:8, vit:8, dex:3, luk:3 }, { str:15, vit:14, dex:5, luk:6 }] },
  },

  // ===== マップ 4: 雪原 =====
  {
    name: "雪原",
    bg:   "",
    icon: "",
    mapBonus: { str:12, vit:10, int:8, agi:5 },
    enemies: [
      { name: "雪うさぎ", img: "enemy_orc.png",
        drops: [{ itemId: "orc_hide", rate: 0.45 }],
        killBonus: [{ agi:2, luk:1 }, { agi:4, luk:3 }, { agi:7, luk:5, dex:2 }] },
      { name: "アイス魔", img: "enemy_orc.png",
        drops: [{ itemId: "troll_blood", rate: 0.35 }],
        killBonus: [{ int:2, agi:1 }, { int:5, agi:3 }, { int:9, agi:5, luk:2 }] },
      { name: "イエティ", img: "enemy_troll.png",
        drops: [{ itemId: "troll_blood", rate: 0.55 }, { itemId: "orc_hide", rate: 0.30 }],
        killBonus: [{ str:3, vit:2 }, { str:6, vit:5 }, { str:10, vit:9, dex:2 }] },
    ],
    boss: { name: "氷の巨人", img: "enemy_troll.png",
      drops: [{ itemId: "troll_blood", rate: 0.9 }, { itemId: "orc_hide", rate: 0.9 }],
      killBonus: [{ str:5, vit:4, int:3 }, { str:10, vit:8, int:6, agi:2 }, { str:18, vit:14, int:10, agi:4, luk:2 }] },
  },

  // ===== マップ 5: 火山 =====
  {
    name: "火山",
    bg:   "",
    icon: "",
    mapBonus: { str:15, vit:10, int:10, agi:5 },
    enemies: [
      { name: "ラバスライム",   img: "enemy_troll.png",
        drops: [{ itemId: "troll_blood", rate: 0.50 }],
        killBonus: [{ str:2, vit:2 }, { str:5, vit:4 }, { str:9, vit:8 }] },
      { name: "炎の精霊",       img: "enemy_troll.png",
        drops: [{ itemId: "troll_blood", rate: 0.45 }, { itemId: "orc_hide", rate: 0.20 }],
        killBonus: [{ str:2, int:2 }, { str:5, int:5 }, { str:9, int:9, luk:2 }] },
      { name: "マグマゴーレム", img: "enemy_dragon.png",
        drops: [{ itemId: "orc_hide", rate: 0.40 }],
        killBonus: [{ str:3, vit:2 }, { str:7, vit:5 }, { str:12, vit:9, dex:2 }] },
    ],
    boss: { name: "火竜", img: "enemy_dragon.png",
      drops: [{ itemId: "troll_blood", rate: 0.9 }, { itemId: "orc_hide", rate: 0.9 }],
      killBonus: [{ str:6, vit:5, int:4 }, { str:13, vit:10, int:8, dex:2 }, { str:22, vit:17, int:14, dex:4, agi:3 }] },
  },

  // ===== マップ 6: 海底 =====
  {
    name: "海底",
    bg:   "",
    icon: "",
    mapBonus: { str:15, vit:12, dex:8, agi:8 },
    enemies: [
      { name: "人魚戦士", img: "enemy_troll.png",
        drops: [{ itemId: "troll_blood", rate: 0.45 }],
        killBonus: [{ str:3, dex:2 }, { str:6, dex:4 }, { str:11, dex:7, agi:3 }] },
      { name: "深海魚",   img: "enemy_troll.png",
        drops: [{ itemId: "dragon_scale", rate: 0.25 }],
        killBonus: [{ agi:2, dex:2 }, { agi:5, dex:4 }, { agi:9, dex:7, luk:2 }] },
      { name: "クラーケン", img: "enemy_dragon.png",
        drops: [{ itemId: "dragon_scale", rate: 0.50 }, { itemId: "troll_blood", rate: 0.30 }],
        killBonus: [{ vit:3, str:2 }, { vit:7, str:5 }, { vit:12, str:9, int:4 }] },
    ],
    boss: { name: "海底の王", img: "enemy_dragon.png",
      drops: [{ itemId: "dragon_scale", rate: 0.9 }, { itemId: "troll_blood", rate: 0.9 }],
      killBonus: [{ str:7, vit:5, dex:4 }, { str:14, vit:10, dex:7, agi:3 }, { str:25, vit:18, dex:12, agi:6, luk:3 }] },
  },

  // ===== マップ 7: 天空 =====
  {
    name: "天空",
    bg:   "",
    icon: "",
    mapBonus: { str:18, vit:12, int:12, dex:8, agi:8 },
    enemies: [
      { name: "天空騎士", img: "enemy_dragon.png",
        drops: [{ itemId: "dragon_scale", rate: 0.50 }],
        killBonus: [{ str:4, dex:2 }, { str:8, dex:5 }, { str:14, dex:9, vit:3 }] },
      { name: "嵐の精霊", img: "enemy_dragon.png",
        drops: [{ itemId: "troll_blood", rate: 0.40 }],
        killBonus: [{ agi:3, int:2 }, { agi:6, int:5 }, { agi:10, int:9, luk:3 }] },
      { name: "古代竜",   img: "enemy_dragon.png",
        drops: [{ itemId: "dragon_scale", rate: 0.55 }, { itemId: "troll_blood", rate: 0.30 }],
        killBonus: [{ str:4, int:3, vit:2 }, { str:8, int:6, vit:5 }, { str:14, int:10, vit:9, dex:3 }] },
    ],
    boss: { name: "天空の番人", img: "enemy_dragon.png",
      drops: [{ itemId: "dragon_scale", rate: 0.9 }, { itemId: "troll_blood", rate: 0.9 }],
      killBonus: [{ str:8, vit:6, int:5, agi:3 }, { str:16, vit:12, int:10, dex:4, agi:5 }, { str:28, vit:20, int:17, dex:8, agi:9, luk:4 }] },
  },

  // ===== マップ 8: 魔界 =====
  {
    name: "魔界",
    bg:   "",
    icon: "",
    mapBonus: { str:20, vit:15, int:15, dex:10, agi:10, luk:8 },
    enemies: [
      { name: "デーモン",   img: "enemy_dragon.png",
        drops: [{ itemId: "dragon_scale", rate: 0.50 }],
        killBonus: [{ str:5, int:3 }, { str:10, int:7 }, { str:17, int:12, vit:4 }] },
      { name: "堕天使",     img: "enemy_dragon.png",
        drops: [{ itemId: "lucky_coin", rate: 0.35 }],
        killBonus: [{ int:4, luk:2 }, { int:8, luk:5 }, { int:14, luk:9, dex:3 }] },
      { name: "魔王の将",   img: "enemy_dragon.png",
        drops: [{ itemId: "dragon_scale", rate: 0.45 }, { itemId: "lucky_coin", rate: 0.30 }],
        killBonus: [{ str:5, vit:3 }, { str:10, vit:7 }, { str:17, vit:12, int:5, luk:3 }] },
    ],
    boss: { name: "魔王の使徒", img: "enemy_dragon.png",
      drops: [{ itemId: "dragon_scale", rate: 0.9 }, { itemId: "lucky_coin", rate: 0.9 }],
      killBonus: [{ str:10, vit:8, int:7, luk:3 }, { str:20, vit:15, int:14, dex:5, luk:6 }, { str:35, vit:25, int:24, dex:9, agi:7, luk:10 }] },
  },

  // ===== マップ 9: 魔王城 =====
  {
    name: "魔王城",
    bg:   "",
    icon: "",
    isFinal: true,
    mapBonus: { str:25, vit:20, int:20, dex:15, agi:15, luk:15 },
    enemies: [
      { name: "魔王親衛隊", img: "enemy_dragon.png",
        drops: [{ itemId: "dragon_scale", rate: 0.55 }],
        killBonus: [{ str:7, vit:4 }, { str:14, vit:9 }, { str:24, vit:16, dex:5 }] },
      { name: "魔王の騎士", img: "enemy_dragon.png",
        drops: [{ itemId: "dragon_scale", rate: 0.50 }, { itemId: "lucky_coin", rate: 0.35 }],
        killBonus: [{ str:7, dex:4 }, { str:14, dex:8, agi:3 }, { str:24, dex:14, agi:7, luk:4 }] },
      { name: "魔王の怒り", img: "enemy_dragon.png",
        drops: [{ itemId: "lucky_coin", rate: 0.50 }],
        killBonus: [{ str:6, int:5 }, { str:13, int:10, luk:3 }, { str:22, int:17, luk:7, vit:5 }] },
    ],
    boss: { name: "魔王", img: "enemy_dragon.png",
      drops: [{ itemId: "dragon_scale", rate: 0.9 }, { itemId: "lucky_coin", rate: 0.9 }],
      killBonus: [{ str:15, vit:12, int:10, dex:6, agi:5, luk:6 }, { str:28, vit:22, int:20, dex:12, agi:10, luk:12 }, { str:50, vit:38, int:35, dex:20, agi:18, luk:22 }] },
  },
];
