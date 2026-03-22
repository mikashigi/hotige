// --- 実績定義 ---
// check(state, stats): state は game.js の state、stats は computePlayerStats() の結果

function _totalKills(s) {
  return Object.values(s.monsterKills).reduce((a, b) => a + b, 0);
}

const ACHIEVEMENTS = [
  // --- 討伐 ---
  { id: "first_kill",   icon: "⚔",  name: "初討伐",       desc: "初めて敵を倒した",
    check: s => _totalKills(s) >= 1 },
  { id: "kill_100",     icon: "⚔",  name: "百戦錬磨",      desc: "累計100体討伐した",
    check: s => _totalKills(s) >= 100 },
  { id: "kill_1000",    icon: "💀", name: "千の屍",        desc: "累計1000体討伐した",
    check: s => _totalKills(s) >= 1000 },
  { id: "rare_kill",    icon: "✨", name: "希少な遭遇",     desc: "レアモンスターを倒した",
    check: s => (s.rareKills || 0) >= 1 },

  // --- マップ ---
  { id: "map1_clear",   icon: "🌿", name: "草原の覇者",    desc: "マップ1をクリアした",
    check: s => (s.mapsCleared || 0) >= 1 },
  { id: "game_clear",   icon: "👑", name: "魔王城制覇",    desc: "全マップをクリアした",
    check: s => s.cleared },

  // --- アイテム ---
  { id: "first_item",   icon: "📦", name: "初入手",        desc: "アイテムを初めて入手した",
    check: s => Object.values(s.itemsObtained || s.inventory).some(v => v >= 1) },
  { id: "tier1",        icon: "⭐", name: "コレクター",    desc: "アイテムをTier1（累計100個）にした",
    check: s => Object.values(s.itemsObtained || s.inventory).some(v => v >= 100) },
  { id: "tier3",        icon: "🌟", name: "蒐集の極み",    desc: "アイテムをTier3（累計999個）にした",
    check: s => Object.values(s.itemsObtained || s.inventory).some(v => v >= 999) },

  // --- 精製 ---
  { id: "first_refine", icon: "⚗", name: "錬金術師",       desc: "初めて精製を完了した",
    check: s => (s.totalRefines || 0) >= 1 },
  { id: "refine_10",    icon: "🔮", name: "精製職人",      desc: "10個以上精製した",
    check: s => (s.totalRefines || 0) >= 10 },

  // --- ショップ ---
  { id: "shop_10",      icon: "🛒", name: "買い物好き",    desc: "ショップで10回以上強化した",
    check: s => (s.totalShopBuys || 0) >= 10 },

  // --- ステータス ---
  { id: "atk_100",      icon: "💪", name: "強者の片鱗",   desc: "ATKが100以上になった",
    check: (s, st) => st && st.totalAtk >= 100 },
  { id: "hp_500",       icon: "❤", name: "鋼の肉体",      desc: "最大HPが500以上になった",
    check: (s, st) => st && st.playerMaxHp >= 500 },

  // --- ゴールド ---
  { id: "gold_1000",    icon: "💰", name: "金持ち",        desc: "累計1000G以上獲得した",
    check: s => (s.totalGoldEarned || 0) >= 1000 },
  { id: "gold_10000",   icon: "💎", name: "大富豪",        desc: "累計10000G以上獲得した",
    check: s => (s.totalGoldEarned || 0) >= 10000 },

  // --- 死亡 ---
  { id: "first_death",  icon: "💔", name: "はじめての死",  desc: "初めて倒れた",
    check: s => (s.totalDeaths || 0) >= 1 },
  { id: "death_10",     icon: "🔥", name: "不死鳥",        desc: "10回以上倒れた",
    check: s => (s.totalDeaths || 0) >= 10 },
];
