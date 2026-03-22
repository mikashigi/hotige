// --- 精製レシピ定義 ---
// inputs : 消費するアイテム配列 [{ itemId, count }]
// output : 生成するアイテム { itemId, count }
// time   : 1回あたりの精製時間（秒）
const REFINE_RECIPES = [
  {
    id:     "make_forest_essence",
    name:   "森林の精髄",
    inputs: [
      { itemId: "rabbit_fur",   count: 4 },
      { itemId: "wolf_claw",    count: 3 },
      { itemId: "mushroom_cap", count: 3 },
      { itemId: "bat_wing",     count: 2 },
    ],
    output: { itemId: "forest_essence", count: 1 },
    time: 30,
  },
  {
    id:     "make_desert_relic",
    name:   "砂漠の遺宝",
    inputs: [
      { itemId: "sand_fossil",  count: 4 },
      { itemId: "mummy_cloth",  count: 3 },
    ],
    output: { itemId: "desert_relic", count: 1 },
    time: 25,
  },
  {
    id:     "make_elemental_stone",
    name:   "元素石",
    inputs: [
      { itemId: "ice_gem",  count: 3 },
      { itemId: "fire_gem", count: 3 },
    ],
    output: { itemId: "elemental_stone", count: 1 },
    time: 35,
  },
  {
    id:     "make_celestial_gem",
    name:   "天界の宝石",
    inputs: [
      { itemId: "sea_scale",       count: 3 },
      { itemId: "sky_crystal",     count: 3 },
      { itemId: "elemental_stone", count: 1 },
    ],
    output: { itemId: "celestial_gem", count: 1 },
    time: 50,
  },
  {
    id:     "make_refined_core",
    name:   "精製コア",
    inputs: [
      { itemId: "slime_gel",   count: 5 },
      { itemId: "goblin_fang", count: 3 },
      { itemId: "orc_hide",    count: 2 },
    ],
    output: { itemId: "refined_core", count: 1 },
    time: 20,
  },
  {
    id:     "make_magic_essence",
    name:   "魔力精髄",
    inputs: [
      { itemId: "troll_blood", count: 4 },
      { itemId: "lucky_coin",  count: 3 },
    ],
    output: { itemId: "magic_essence", count: 1 },
    time: 25,
  },
  {
    id:     "make_dragon_gem",
    name:   "竜晶",
    inputs: [
      { itemId: "dragon_scale",  count: 3 },
      { itemId: "refined_core",  count: 2 },
      { itemId: "magic_essence", count: 1 },
    ],
    output: { itemId: "dragon_gem", count: 1 },
    time: 60,
  },
];
