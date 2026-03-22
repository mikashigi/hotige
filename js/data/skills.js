// --- パッシブスキルツリー定義 ---
// effect のキー:
//   dropRate     : アイテムドロップ率への乗算ボーナス (例: 0.10 = +10%)
//   consumableRate: 消耗品ドロップ率への乗算ボーナス
//   critMult     : クリティカル倍率への加算 (例: 0.3 = +0.3×)
//   critRate     : クリティカル率への加算 (例: 0.02 = +2%)
//   refineSpeed  : 精製速度倍率 (例: 0.25 = 25%短縮)
//   goldGain     : 獲得ゴールド乗算ボーナス (例: 0.15 = +15%)

const SKILL_NODES = [
  // ── 採取 ──────────────────────────────────────────────────
  {
    id: "drop_1", category: "採取", name: "採取術 I",   icon: "🎁",
    desc: "ドロップ率 +10%",
    effect: { dropRate: 0.10 },
    cost: 300, requires: [],
  },
  {
    id: "drop_2", category: "採取", name: "採取術 II",  icon: "🎁",
    desc: "ドロップ率 +10%",
    effect: { dropRate: 0.10 },
    cost: 1200, requires: ["drop_1"],
  },
  {
    id: "drop_3", category: "採取", name: "採取術 III", icon: "🎁",
    desc: "ドロップ率 +10%",
    effect: { dropRate: 0.10 },
    cost: 4000, requires: ["drop_2"],
  },
  {
    id: "consumable_1", category: "採取", name: "消耗品収集", icon: "📦",
    desc: "消耗品ドロップ率 +20%",
    effect: { consumableRate: 0.20 },
    cost: 800, requires: ["drop_1"],
  },

  // ── 戦闘 ──────────────────────────────────────────────────
  {
    id: "crit_mult_1", category: "戦闘", name: "必殺の心得 I",  icon: "⚡",
    desc: "クリティカル倍率 +0.3×",
    effect: { critMult: 0.3 },
    cost: 500, requires: [],
  },
  {
    id: "crit_mult_2", category: "戦闘", name: "必殺の心得 II", icon: "⚡",
    desc: "クリティカル倍率 +0.3×",
    effect: { critMult: 0.3 },
    cost: 2000, requires: ["crit_mult_1"],
  },
  {
    id: "crit_rate_1", category: "戦闘", name: "見切り",        icon: "🎯",
    desc: "クリティカル率 +2%",
    effect: { critRate: 0.02 },
    cost: 1000, requires: ["crit_mult_1"],
  },

  // ── 精製 ──────────────────────────────────────────────────
  {
    id: "refine_1", category: "精製", name: "錬金術 I",  icon: "⚗️",
    desc: "精製速度 +25%",
    effect: { refineSpeed: 0.25 },
    cost: 400, requires: [],
  },
  {
    id: "refine_2", category: "精製", name: "錬金術 II", icon: "⚗️",
    desc: "精製速度 +25%",
    effect: { refineSpeed: 0.25 },
    cost: 1800, requires: ["refine_1"],
  },

  // ── 経済 ──────────────────────────────────────────────────
  {
    id: "gold_1", category: "経済", name: "商才 I",  icon: "💰",
    desc: "ゴールド獲得 +15%",
    effect: { goldGain: 0.15 },
    cost: 600, requires: [],
  },
  {
    id: "gold_2", category: "経済", name: "商才 II", icon: "💰",
    desc: "ゴールド獲得 +15%",
    effect: { goldGain: 0.15 },
    cost: 2500, requires: ["gold_1"],
  },
];

const SKILL_MAP = Object.fromEntries(SKILL_NODES.map(s => [s.id, s]));

const SKILL_CATEGORIES = ["採取", "戦闘", "精製", "経済"];
