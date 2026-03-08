// --- 消費アイテム定義 ---
// effect.type:
//   "damage" : 敵に totalAtk * damageMult のダメージを与える

const CONSUMABLES = [
  {
    id:     "batch_ticket",
    name:   "一括チケット",
    icon:   "🎫",
    desc:   "次のマップで一括討伐モードが発動する（死亡時は返却）",
    effect: { type: "batch_mode" },
  },
  {
    id:          "bomb_herb",
    name:        "爆弾草",
    icon:        "💥",
    desc:        "敵にATK×5のダメージを与える",
    effect:      { type: "damage", damageMult: 5 },
  },
];

const CONSUMABLE_MAP = Object.fromEntries(CONSUMABLES.map(c => [c.id, c]));
