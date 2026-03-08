// --- 消費アイテム定義 ---
// effect.type:
//   "damage" : 敵に totalAtk * damageMult のダメージを与える

const CONSUMABLES = [
  {
    id:     "batch_ticket",
    name:   "連闘チケット",
    icon:   "🎫",
    desc:   "次のマップで連闘モードが発動する（死亡時は返却）",
    effect: { type: "batch_mode" },
  },
  {
    id:          "bomb_herb",
    name:        "爆弾草",
    icon:        "💥",
    desc:        "敵にATK×5のダメージを与える",
    effect:      { type: "damage", damageMult: 5 },
  },
  {
    id:          "smoke_ball",
    name:        "煙玉",
    icon:        "💨",
    desc:        "10秒間、敵の攻撃を封じる",
    effect:      { type: "stun", duration: 10000 },
  },
];

const CONSUMABLE_MAP = Object.fromEntries(CONSUMABLES.map(c => [c.id, c]));
