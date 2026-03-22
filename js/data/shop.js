// --- ショップ定義 ---
// baseCost : 初回購入コスト
// mult     : レベルごとのコスト倍率
// stat     : 強化されるステータスキー
// amount   : 1回の購入で増加する量
// HP回復ショップ定義（ステータス強化とは別扱い）
const HEAL_DEF = {
  name: "HP全回復", icon: "❤️", desc: "HPを最大まで回復する",
};

const SHOP_DEFS = {
  vit: { name: "体力強化",  icon: "🛡️", desc: "VIT+2（最大HP+10）",          baseCost: 15, mult: 1.4, stat: "vit", amount: 2 },
  str: { name: "攻撃強化",  icon: "⚔️", desc: "STR+2（ATK↑）",               baseCost: 20, mult: 1.5, stat: "str", amount: 2 },
  int: { name: "魔力強化",  icon: "🌀", desc: "INT+2（ATK↑ 命中↑ クリ↑）",  baseCost: 20, mult: 1.5, stat: "int", amount: 2 },
  agi: { name: "速度強化",  icon: "💨", desc: "AGI+3（攻撃速度↑）",           baseCost: 20, mult: 1.4, stat: "agi", amount: 3 },
  dex: { name: "命中強化",  icon: "🎯", desc: "DEX+3（命中率+0.9%）",         baseCost: 15, mult: 1.4, stat: "dex", amount: 3 },
  luk: { name: "幸運強化",  icon: "⭐", desc: "LUK+3（クリティカル率↑）",    baseCost: 25, mult: 1.5, stat: "luk", amount: 3 },
};
