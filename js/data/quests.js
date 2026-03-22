// --- クエスト定義 ---
// getValue(state) : 現在の累計値を返す関数
// target         : 必要数
// reward         : { gold?, item?, itemCount? }
// ※繰り返し可能：達成→報酬受け取り→カウントリセット→再スタート

function _qTotalKills(s) {
  return Object.values(s.monsterKills).reduce((a, b) => a + b, 0);
}
function _qTotalItems(s) {
  return Object.values(s.itemsObtained).reduce((a, b) => a + b, 0);
}

const QUESTS = [
  // ── 討伐 ─────────────────────────────────────────────────
  {
    id: "q_kill_50",   icon: "⚔️", name: "狩人",
    desc: "敵を50体倒す",
    getValue: s => _qTotalKills(s), target: 50,
    reward: { gold: 200 },
  },
  {
    id: "q_kill_300",  icon: "💀", name: "殲滅者",
    desc: "敵を300体倒す",
    getValue: s => _qTotalKills(s), target: 300,
    reward: { gold: 1500 },
  },
  {
    id: "q_kill_1000", icon: "🔥", name: "千の屍",
    desc: "敵を1000体倒す",
    getValue: s => _qTotalKills(s), target: 1000,
    reward: { gold: 6000 },
  },
  {
    id: "q_rare_1",    icon: "✨", name: "レア狩り",
    desc: "レアモンスターを1体倒す",
    getValue: s => s.rareKills || 0, target: 1,
    reward: { gold: 500, item: "lucky_coin", itemCount: 1 },
  },
  {
    id: "q_rare_5",    icon: "🌟", name: "レアハンター",
    desc: "レアモンスターを5体倒す",
    getValue: s => s.rareKills || 0, target: 5,
    reward: { gold: 2500, item: "dragon_scale", itemCount: 1 },
  },

  // ── 精製 ─────────────────────────────────────────────────
  {
    id: "q_refine_5",  icon: "⚗️", name: "錬金の道",
    desc: "精製を5回する",
    getValue: s => s.totalRefines || 0, target: 5,
    reward: { gold: 400 },
  },
  {
    id: "q_refine_30", icon: "🔮", name: "熟練錬金",
    desc: "精製を30回する",
    getValue: s => s.totalRefines || 0, target: 30,
    reward: { gold: 2500, item: "forest_essence", itemCount: 1 },
  },

  // ── アイテム ─────────────────────────────────────────────
  {
    id: "q_item_50",   icon: "🎒", name: "採集家",
    desc: "アイテムを50個入手する",
    getValue: s => _qTotalItems(s), target: 50,
    reward: { gold: 300 },
  },
  {
    id: "q_item_500",  icon: "📦", name: "コレクター",
    desc: "アイテムを500個入手する",
    getValue: s => _qTotalItems(s), target: 500,
    reward: { gold: 2000 },
  },

  // ── ゴールド ─────────────────────────────────────────────
  {
    id: "q_gold_2000",  icon: "💰", name: "小金持ち",
    desc: "2000G獲得する",
    getValue: s => s.totalGoldEarned || 0, target: 2000,
    reward: { gold: 300 },
  },
  {
    id: "q_gold_20000", icon: "💎", name: "大金持ち",
    desc: "20000G獲得する",
    getValue: s => s.totalGoldEarned || 0, target: 20000,
    reward: { gold: 3000 },
  },

  // ── ショップ ─────────────────────────────────────────────
  {
    id: "q_shop_10",   icon: "🏪", name: "爆買い",
    desc: "ショップで10回強化する",
    getValue: s => s.totalShopBuys || 0, target: 10,
    reward: { gold: 500 },
  },

  // ── 死亡 ─────────────────────────────────────────────────
  {
    id: "q_death_3",   icon: "💔", name: "不屈の魂",
    desc: "3回倒れる",
    getValue: s => s.totalDeaths || 0, target: 3,
    reward: { gold: 800 },
  },
];

const QUEST_MAP = Object.fromEntries(QUESTS.map(q => [q.id, q]));
