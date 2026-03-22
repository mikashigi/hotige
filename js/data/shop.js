// --- ショップ定義 ---
// baseCost : 初回購入コスト
// mult     : レベルごとのコスト倍率
// stat     : 強化されるステータスキー
// amount   : 1回の購入で増加する量
const SHOP_DEFS = {
  vit: { baseCost: 15, mult: 1.4, stat: "vit", amount: 2 },
  str: { baseCost: 20, mult: 1.5, stat: "str", amount: 2 },
  int: { baseCost: 20, mult: 1.5, stat: "int", amount: 2 },
  agi: { baseCost: 20, mult: 1.4, stat: "agi", amount: 3 },
  dex: { baseCost: 15, mult: 1.4, stat: "dex", amount: 3 },
  luk: { baseCost: 25, mult: 1.5, stat: "luk", amount: 3 },
};
