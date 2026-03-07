// --- 精製レシピ定義 ---
// inputs : 消費するアイテム配列 [{ itemId, count }]
// output : 生成するアイテム { itemId, count }
// time   : 1回あたりの精製時間（秒）
const REFINE_RECIPES = [
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
