// --- ボーナスティア閾値 ---
// BONUS_THRESHOLDS[i] 個以上で bonus[i] が加算される
const BONUS_THRESHOLDS = [100, 500, 999];

function getItemTier(count) {
  if (count >= 999) return 3;
  if (count >= 500) return 2;
  if (count >= 100) return 1;
  return 0;
}

// --- アイテムテーブル ---
// 基本効果: 個数によらず×1固定（0〜99個でも100個でも同じ）
// bonus[i]: BONUS_THRESHOLDS[i] 個到達で加算されるフラットボーナス（累積）
const ITEMS = [
  { id: "slime_gel",    name: "スライムゼリー",
    str: 0, vit: 1, int: 0, dex: 0, agi: 1, luk: 0,
    bonus: [
      { str: 0, vit:  3, int: 0, dex: 0, agi:  3, luk: 0 },
      { str: 0, vit:  5, int: 0, dex: 0, agi:  5, luk: 2 },
      { str: 0, vit: 10, int: 0, dex: 0, agi:  8, luk: 5 },
    ] },
  { id: "goblin_fang",  name: "ゴブリンの牙",
    str: 2, vit: 0, int: 0, dex: 1, agi: 0, luk: 0,
    bonus: [
      { str:  5, vit: 0, int: 0, dex:  3, agi: 0, luk: 0 },
      { str: 10, vit: 0, int: 0, dex:  6, agi: 3, luk: 0 },
      { str: 18, vit: 0, int: 0, dex: 10, agi: 5, luk: 0 },
    ] },
  { id: "orc_hide",     name: "オークの皮",
    str: 1, vit: 3, int: 0, dex: 0, agi: 0, luk: 0,
    bonus: [
      { str:  3, vit:  8, int: 0, dex: 0, agi: 0, luk: 0 },
      { str:  6, vit: 15, int: 0, dex: 3, agi: 0, luk: 0 },
      { str: 10, vit: 25, int: 0, dex: 5, agi: 0, luk: 0 },
    ] },
  { id: "troll_blood",  name: "トロルの血",
    str: 0, vit: 2, int: 2, dex: 0, agi: 0, luk: 1,
    bonus: [
      { str: 0, vit:  5, int:  5, dex: 0, agi: 0, luk:  3 },
      { str: 0, vit: 10, int: 10, dex: 0, agi: 0, luk:  6 },
      { str: 0, vit: 18, int: 18, dex: 0, agi: 0, luk: 10 },
    ] },
  { id: "dragon_scale", name: "ドラゴンの鱗",
    str: 3, vit: 3, int: 3, dex: 1, agi: 1, luk: 2,
    bonus: [
      { str:  8, vit:  8, int:  8, dex:  3, agi:  3, luk:  5 },
      { str: 15, vit: 15, int: 15, dex:  6, agi:  6, luk: 10 },
      { str: 25, vit: 25, int: 25, dex: 10, agi: 10, luk: 18 },
    ] },
  { id: "lucky_coin",   name: "ラッキーコイン",
    str: 0, vit: 0, int: 0, dex: 0, agi: 0, luk: 5,
    bonus: [
      { str: 0, vit: 0, int: 0, dex: 0, agi:  3, luk: 10 },
      { str: 0, vit: 0, int: 0, dex: 3, agi:  6, luk: 20 },
      { str: 0, vit: 0, int: 0, dex: 5, agi: 10, luk: 35 },
    ] },
];

// アイテムIDから参照するためのマップ
const ITEM_MAP = Object.fromEntries(ITEMS.map(item => [item.id, item]));

// --- マップ定義 ---
// 1マップ=10ステージ、ステージ10はボス
// isFinal: true のボスを倒すとゲームクリア
const MAP_DEFS = [
  { name: "草原",   enemies: ["スライム",    "野うさぎ",     "ゴブリン",     "ゴブリン2"],       boss: "草原の王",   imgs: ["enemy_slime.png",  "enemy_slime.png",  "enemy_goblin.png",  "enemy_goblin.png"],  bossImg: "enemy_goblin.png",  drops: ["slime_gel",   "goblin_fang"]  },
  { name: "森",     enemies: ["ウルフ",       "キノコ人",     "ウッドゴーレム"], boss: "森の主",     imgs: ["enemy_goblin.png", "enemy_goblin.png", "enemy_orc.png"],     bossImg: "enemy_orc.png",     drops: ["slime_gel",   "goblin_fang"]  },
  { name: "洞窟",   enemies: ["コウモリ",     "ゴブリン長",   "ストーンゴーレム"],boss:"岩窟の番人", imgs: ["enemy_goblin.png", "enemy_goblin.png", "enemy_orc.png"],     bossImg: "enemy_orc.png",     drops: ["orc_hide",    "goblin_fang"]  },
  { name: "砂漠",   enemies: ["サンドワーム", "スコーピオン", "ミイラ兵"],       boss: "砂漠の覇者", imgs: ["enemy_orc.png",    "enemy_orc.png",    "enemy_troll.png"],   bossImg: "enemy_troll.png",   drops: ["orc_hide",    "goblin_fang"]  },
  { name: "雪原",   enemies: ["雪うさぎ",     "アイス魔",     "イエティ"],       boss: "氷の巨人",   imgs: ["enemy_orc.png",    "enemy_orc.png",    "enemy_troll.png"],   bossImg: "enemy_troll.png",   drops: ["troll_blood", "orc_hide"]     },
  { name: "火山",   enemies: ["ラバスライム", "炎の精霊",     "マグマゴーレム"], boss: "火竜",       imgs: ["enemy_troll.png",  "enemy_troll.png",  "enemy_dragon.png"],  bossImg: "enemy_dragon.png",  drops: ["troll_blood", "orc_hide"]     },
  { name: "海底",   enemies: ["人魚戦士",     "深海魚",       "クラーケン"],     boss: "海底の王",   imgs: ["enemy_troll.png",  "enemy_troll.png",  "enemy_dragon.png"],  bossImg: "enemy_dragon.png",  drops: ["dragon_scale","troll_blood"]  },
  { name: "天空",   enemies: ["天空騎士",     "嵐の精霊",     "古代竜"],         boss: "天空の番人", imgs: ["enemy_dragon.png", "enemy_dragon.png", "enemy_dragon.png"],  bossImg: "enemy_dragon.png",  drops: ["dragon_scale","troll_blood"]  },
  { name: "魔界",   enemies: ["デーモン",     "堕天使",       "魔王の将"],       boss: "魔王の使徒", imgs: ["enemy_dragon.png", "enemy_dragon.png", "enemy_dragon.png"],  bossImg: "enemy_dragon.png",  drops: ["dragon_scale","lucky_coin"]   },
  { name: "魔王城", enemies: ["魔王親衛隊",   "魔王の騎士",   "魔王の怒り"],     boss: "魔王",       imgs: ["enemy_dragon.png", "enemy_dragon.png", "enemy_dragon.png"],  bossImg: "enemy_dragon.png",  drops: ["dragon_scale","lucky_coin"],  isFinal: true },
];

// マップデータを生成（10マップ×10ステージ = 100エネミー）
function buildMaps() {
  return MAP_DEFS.map((def, mi) => {
    const mult = 1 + mi * 0.8; // マップ係数（草原:1.0 〜 魔王城:8.2）
    const dropList = def.drops.map(id => ({ itemId: id, rate: 0.5 }));
    const bossDrop = def.drops.map(id => ({ itemId: id, rate: 0.9 }));
    const stages = [];
    for (let si = 0; si < 9; si++) {
      const ni = si % def.enemies.length;
      stages.push({
        name:        def.enemies[ni],
        hp:          Math.round(20  * mult * (1 + si * 0.15)),
        atk:         Math.round(3   * Math.sqrt(mult) * (1 + si * 0.08)),
        atkInterval: 2000,
        gold:        Math.round(5   * mult * (1 + si * 0.1)),
        img:         def.imgs[ni],
        drops:       dropList,
      });
    }
    const bossHpMult = def.isFinal ? 10 : 6;
    const bossAtkMult = def.isFinal ? 4 : 3;
    const base = stages[8];
    stages.push({
      name:        def.boss,
      hp:          Math.round(base.hp   * bossHpMult),
      atk:         Math.round(base.atk  * bossAtkMult),
      atkInterval: 1500,
      gold:        Math.round(base.gold * 5),
      img:         def.bossImg,
      drops:       bossDrop,
      isBoss:      true,
      isFinal:     def.isFinal || false,
    });
    return { name: def.name, stages };
  });
}

const MAPS = buildMaps();

// --- ショップ定義 ---
const SHOP_DEFS = {
  vit: { baseCost: 15, mult: 1.4, stat: "vit", amount: 2 },
  agi: { baseCost: 20, mult: 1.4, stat: "agi", amount: 3 },
  dex: { baseCost: 15, mult: 1.4, stat: "dex", amount: 3 },
  luk: { baseCost: 25, mult: 1.5, stat: "luk", amount: 3 },
};

function shopStatCost(key) {
  const def = SHOP_DEFS[key];
  return Math.ceil(def.baseCost * Math.pow(def.mult, state.shopLevels[key]));
}

function healCost() {
  return Math.max(20, Math.ceil(state.playerMaxHp * 0.4));
}

// --- ゲーム状態 ---
const state = {
  mapIndex:   0,  // 0〜9（マップ番号）
  stageInMap: 0,  // 0〜9（マップ内ステージ番号）
  attack:     1,
  gold:       0,
  enemyHp:    0,
  enemyMaxHp: 0,
  playerHp:   50,
  playerMaxHp:50,
  inventory:  {}, // { itemId: count }
  cleared:    false,
  shopLevels: { vit: 0, agi: 0, dex: 0, luk: 0 },
};

// --- DOM 参照 ---
const elMapName    = document.getElementById("map-name");
const elStageNum   = document.getElementById("stage-num");
const elEnemyName  = document.getElementById("enemy-name");
const elEnemyImg   = document.getElementById("enemy-img");
const elEnemyHp    = document.getElementById("enemy-hp");
const elEnemyMaxHp = document.getElementById("enemy-max-hp");
const elHpBar           = document.getElementById("hp-bar");
const elEnemyAtkDisplay = document.getElementById("enemy-atk-display");
const elLogBattle  = document.getElementById("log-battle");
const elLogSystem  = document.getElementById("log-system");
const elInventory  = document.getElementById("inventory-list");
const elStatAtk         = document.getElementById("stat-atk");
const elStatStr         = document.getElementById("stat-str");
const elStatVit         = document.getElementById("stat-vit");
const elStatInt         = document.getElementById("stat-int");
const elStatDex         = document.getElementById("stat-dex");
const elStatAgi         = document.getElementById("stat-agi");
const elStatLuk         = document.getElementById("stat-luk");
const elPlayerHpBar     = document.getElementById("player-hp-bar");
const elPlayerHpDisplay = document.getElementById("player-hp-display");
const elInfoHit         = document.getElementById("info-hit");
const elInfoSpd         = document.getElementById("info-spd");
const elInfoCrit        = document.getElementById("info-crit");
const elGold        = document.getElementById("gold");
const elBtnHeal     = document.getElementById("btn-heal");
const elHealCost    = document.getElementById("shop-heal-cost");
const elBtnVit      = document.getElementById("btn-buy-vit");
const elVitCost     = document.getElementById("shop-vit-cost");
const elBtnAgi      = document.getElementById("btn-buy-agi");
const elAgiCost     = document.getElementById("shop-agi-cost");
const elBtnDex      = document.getElementById("btn-buy-dex");
const elDexCost     = document.getElementById("shop-dex-cost");
const elBtnLuk      = document.getElementById("btn-buy-luk");
const elLukCost     = document.getElementById("shop-luk-cost");

// --- ログ ---
function addLog(msg) {
  const line = document.createElement("div");
  line.textContent = msg;
  elLogBattle.prepend(line);
  while (elLogBattle.children.length > 10) {
    elLogBattle.removeChild(elLogBattle.lastChild);
  }
}

function addSystemLog(msg) {
  const line = document.createElement("div");
  line.textContent = msg;
  elLogSystem.prepend(line);
  while (elLogSystem.children.length > 10) {
    elLogSystem.removeChild(elLogSystem.lastChild);
  }
}

// --- 敵攻撃インターバル ---
let enemyAttackIntervalId = null;

function startEnemyAttack(enemy) {
  clearInterval(enemyAttackIntervalId);
  enemyAttackIntervalId = setInterval(() => enemyTick(enemy), enemy.atkInterval);
}

function stopEnemyAttack() {
  clearInterval(enemyAttackIntervalId);
  enemyAttackIntervalId = null;
}

// --- 敵の攻撃処理 ---
function enemyTick(enemy) {
  state.playerHp = Math.max(0, state.playerHp - enemy.atk);
  elPlayerHpBar.style.width = (state.playerHp / state.playerMaxHp * 100) + "%";
  elPlayerHpDisplay.textContent = `${state.playerHp} / ${state.playerMaxHp}`;
  addLog(`${enemy.name} の攻撃！ ${enemy.atk} ダメージを受けた`);

  if (state.playerHp <= 0) {
    stopEnemyAttack();
    addLog("倒れた…マップ1からやり直し！");
    setTimeout(() => {
      state.playerHp  = state.playerMaxHp;
      state.mapIndex  = 0;
      state.stageInMap = 0;
      spawnEnemy();
      updateStatsDisplay();
    }, 2000);
  }
}

// --- ステージ表示更新 ---
function updateStageDisplay() {
  elMapName.textContent  = MAPS[state.mapIndex].name;
  elStageNum.textContent = `${state.stageInMap + 1} / 10`;
}

// --- 敵をセット ---
function spawnEnemy() {
  if (state.cleared) return;
  const enemy = MAPS[state.mapIndex].stages[state.stageInMap];
  state.enemyHp    = enemy.hp;
  state.enemyMaxHp = enemy.hp;
  elEnemyName.textContent = enemy.name;
  elEnemyImg.src          = enemy.img;
  elEnemyAtkDisplay.textContent = `ATK ${enemy.atk}  ${(1000 / enemy.atkInterval).toFixed(1)}/s`;
  updateStageDisplay();
  updateHpDisplay();
  if (enemy.isBoss) {
    addLog(`★ BOSS: ${enemy.name} が現れた！`);
  } else {
    addLog(`${enemy.name} が現れた！`);
  }
  startEnemyAttack(enemy);
}

// --- HP 表示更新 ---
function updateHpDisplay() {
  elEnemyHp.textContent = Math.max(0, state.enemyHp);
  elEnemyMaxHp.textContent = state.enemyMaxHp;
  const pct = (state.enemyHp / state.enemyMaxHp) * 100;
  elHpBar.style.width = Math.max(0, pct) + "%";
}

// --- 攻撃処理 ---
function tick() {
  const s = computePlayerStats();

  // DEX: 命中チェック
  if (Math.random() > s.hitRate) {
    addLog("ミス！");
    return;
  }

  // LUK: クリティカルチェック
  let dmg = s.totalAtk;
  let suffix = "";
  if (Math.random() < s.critChance) {
    dmg = Math.floor(dmg * 1.5);
    suffix = " ★クリティカル！";
  }

  state.enemyHp -= dmg;
  addLog(`攻撃！ ${dmg} ダメージ（残HP: ${Math.max(0, state.enemyHp)}）${suffix}`);
  updateHpDisplay();

  if (state.enemyHp <= 0) {
    stopEnemyAttack();
    const defeatedEnemy = MAPS[state.mapIndex].stages[state.stageInMap];
    const earned = Math.floor(defeatedEnemy.gold * (0.75 + Math.random() * 0.5));
    state.gold += earned;
    addLog(`${defeatedEnemy.name} を倒した！ +${earned}G`);
    playDefeatSound();
    updateShopDisplay();
    rollDrops(defeatedEnemy);

    if (defeatedEnemy.isFinal) {
      gameClear();
      return;
    }

    state.stageInMap++;
    if (state.stageInMap >= 10) {
      state.stageInMap = 0;
      state.mapIndex++;
      if (state.mapIndex >= MAPS.length) { gameClear(); return; }
      addSystemLog(`★ マップクリア！ 「${MAPS[state.mapIndex].name}」へ！`);
    }
    spawnEnemy();
  }
}

// --- ゲームクリア ---
function gameClear() {
  state.cleared = true;
  stopEnemyAttack();
  clearInterval(attackIntervalId);
  elMapName.textContent  = "★ GAME CLEAR ★";
  elStageNum.textContent = "";
  addLog("魔王を倒した！ 世界に平和が訪れた！");
  addSystemLog("★★★ ゲームクリア！ おめでとうございます！ ★★★");
}

// --- ショップ ---
function updateShopDisplay() {
  elGold.textContent = state.gold;

  const hc = healCost();
  elHealCost.textContent  = hc;
  elBtnHeal.disabled = state.gold < hc || state.playerHp >= state.playerMaxHp;

  for (const key of Object.keys(SHOP_DEFS)) {
    const cost = shopStatCost(key);
    document.getElementById(`shop-${key}-cost`).textContent = cost;
    document.getElementById(`btn-buy-${key}`).disabled = state.gold < cost;
  }
}

function buyHeal() {
  const cost = healCost();
  if (state.gold < cost || state.playerHp >= state.playerMaxHp) return;
  state.gold -= cost;
  state.playerHp = state.playerMaxHp;
  updateShopDisplay();
  updateStatsDisplay();
  addSystemLog(`HP全回復！ (${state.playerMaxHp}/${state.playerMaxHp})`);
}

function buyShopStat(key) {
  const cost = shopStatCost(key);
  if (state.gold < cost) return;
  state.gold -= cost;
  state.shopLevels[key]++;
  updateShopDisplay();
  updateStatsDisplay();
  const def = SHOP_DEFS[key];
  const total = state.shopLevels[key] * def.amount;
  addSystemLog(`${key.toUpperCase()}強化！ ${def.stat.toUpperCase()}が合計+${total} (次回: ${shopStatCost(key)}G)`);
}

// --- 音 ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let soundMuted = false;
const elMuteBtn = document.getElementById("mute-btn");

const SVG_SOUND_ON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
</svg>`;
const SVG_SOUND_OFF = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
</svg>`;

function updateMuteBtn() {
  elMuteBtn.innerHTML = soundMuted ? SVG_SOUND_OFF : SVG_SOUND_ON;
  elMuteBtn.classList.toggle("muted", soundMuted);
}

function toggleMute() {
  soundMuted = !soundMuted;
  updateMuteBtn();
}

// --- ステータス計算 ---
// STR  → ATK+  (×0.8)
// INT  → ATK+  (×0.5)
// VIT  → 自分の最大HP+ (50 + VIT×5)
// DEX  → 命中率+ (90% + DEX×0.3%, 上限99%)
// AGI  → 攻撃間隔短縮 (1000ms - AGI×8ms, 下限300ms)
// LUK  → クリティカル率+ (LUK×2%, 上限50%)
function computePlayerStats() {
  const raw = { str: 0, vit: 0, int: 0, dex: 0, agi: 0, luk: 0 };
  for (const [itemId, count] of Object.entries(state.inventory)) {
    const item = ITEM_MAP[itemId];
    if (!item) continue;
    // 基本効果: 個数によらずフラット×1
    for (const s of Object.keys(raw)) raw[s] += item[s];
    // ボーナスティア: 閾値到達ごとにフラット加算
    if (item.bonus) {
      item.bonus.forEach((tier, i) => {
        if (count >= BONUS_THRESHOLDS[i]) {
          for (const s of Object.keys(raw)) raw[s] += (tier[s] || 0);
        }
      });
    }
  }
  // ショップ強化ボーナス
  for (const [key, def] of Object.entries(SHOP_DEFS)) {
    raw[def.stat] += state.shopLevels[key] * def.amount;
  }
  return {
    ...raw,
    totalAtk:       state.attack + Math.floor(raw.str * 0.8) + Math.floor(raw.int * 0.5),
    playerMaxHp:    50 + raw.vit * 5,
    hitRate:        Math.min(0.99, 0.90 + raw.dex * 0.003),
    attackInterval: Math.max(300, 1000 - raw.agi * 8),
    critChance:     Math.min(0.50, raw.luk * 0.02),
  };
}

// --- 可変攻撃インターバル ---
let attackIntervalId = null;
let _lastInterval = -1;

function resetAttackInterval(s) {
  if (s.attackInterval === _lastInterval && attackIntervalId !== null) return;
  _lastInterval = s.attackInterval;
  clearInterval(attackIntervalId);
  attackIntervalId = setInterval(tick, s.attackInterval);
}

function updateStatsDisplay() {
  const s = computePlayerStats();

  // VIT でプレイヤー最大HP変化 → 差分だけ回復
  if (s.playerMaxHp !== state.playerMaxHp) {
    const diff = s.playerMaxHp - state.playerMaxHp;
    state.playerMaxHp = s.playerMaxHp;
    state.playerHp = Math.min(state.playerMaxHp, state.playerHp + Math.max(0, diff));
  }

  elStatAtk.textContent = s.totalAtk;
  elStatStr.textContent = s.str;
  elStatVit.textContent = s.vit;
  elStatInt.textContent = s.int;
  elStatDex.textContent = s.dex;
  elStatAgi.textContent = s.agi;
  elStatLuk.textContent = s.luk;

  elPlayerHpBar.style.width = (state.playerHp / state.playerMaxHp * 100) + "%";
  elPlayerHpDisplay.textContent = `${state.playerHp} / ${state.playerMaxHp}`;

  elInfoHit.textContent  = Math.round(s.hitRate * 100);
  elInfoSpd.textContent  = (1000 / s.attackInterval).toFixed(1);
  elInfoCrit.textContent = Math.round(s.critChance * 100);

  resetAttackInterval(s);
}

// アイテムの現在合計効果を返す（基本×1 + 達成済みボーナス累積）
function calcItemEffect(item, count) {
  const eff = { str: item.str, vit: item.vit, int: item.int,
                dex: item.dex, agi: item.agi, luk: item.luk };
  if (item.bonus) {
    item.bonus.forEach((tier, i) => {
      if (count >= BONUS_THRESHOLDS[i]) {
        for (const s of Object.keys(eff)) eff[s] += (tier[s] || 0);
      }
    });
  }
  return eff;
}

// ステータスオブジェクトを "STR+2 VIT+3" 形式に変換
function statStr(obj, prefix = "") {
  return ["str","vit","int","dex","agi","luk"]
    .filter(s => obj[s] > 0)
    .map(s => `${prefix}${s.toUpperCase()}+${obj[s]}`)
    .join(" ") || "—";
}

function updateInventoryDisplay() {
  const TIER_LABELS = ["", "T1", "T2", "T3"];
  const entries = ITEMS
    .filter(item => state.inventory[item.id] > 0)
    .map(item => {
      const count = state.inventory[item.id];
      const tier  = getItemTier(count);
      const next  = BONUS_THRESHOLDS[tier];

      const tierBadge = tier > 0
        ? `<span class="tier-badge tier-${tier}">${TIER_LABELS[tier]}</span>`
        : `<span class="tier-badge tier-0">T0</span>`;

      const nextHint = next !== undefined
        ? `<span class="inv-next">→${next}</span>`
        : `<span class="inv-next max">MAX</span>`;

      // 現在の合計効果
      const curEff  = calcItemEffect(item, count);
      const curText = statStr(curEff);

      // 次ティアで加わるボーナス
      let nextText = "";
      if (next !== undefined && item.bonus && item.bonus[tier]) {
        nextText = `<span class="inv-next-bonus">次(${next}個): +${statStr(item.bonus[tier])}</span>`;
      }

      return `<div class="inv-entry">
        <div class="inv-row">
          <span class="inv-name">${item.name}</span>
          ${tierBadge}
          <span class="inv-count">×${count}</span>
          ${nextHint}
        </div>
        <div class="inv-detail">
          <span class="inv-cur-bonus">現在: ${curText}</span>
          ${nextText}
        </div>
      </div>`;
    });
  elInventory.innerHTML = entries.length
    ? entries.join("")
    : `<span class="empty-msg">まだアイテムがありません</span>`;
}

// --- ドロップ ---
function rollDrops(enemy) {
  enemy.drops.forEach(drop => {
    if (Math.random() < drop.rate) {
      const item = ITEM_MAP[drop.itemId];
      if (!item) return;
      const prevCount = state.inventory[item.id] || 0;
      state.inventory[item.id] = prevCount + 1;
      const newCount  = state.inventory[item.id];
      const prevTier  = getItemTier(prevCount);
      const newTier   = getItemTier(newCount);
      addSystemLog(`${item.name} を入手！ (×${newCount})`);
      if (newTier > prevTier) {
        addSystemLog(`★ ${item.name} Tier${newTier} 解放！ボーナス加算！`);
      }
      updateStatsDisplay();
      updateInventoryDisplay();
    }
  });
}

function playDefeatSound() {
  if (soundMuted) return;
  const notes = [523, 659, 784]; // C5 E5 G5
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = audioCtx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.start(t);
    osc.stop(t + 0.3);
  });
}

// --- セーブ / ロード ---
const SAVE_KEY = "hotige_save";
const elSaveIndicator = document.getElementById("save-indicator");
let saveIndicatorTimer = null;

function showSaveIndicator() {
  elSaveIndicator.classList.add("show");
  clearTimeout(saveIndicatorTimer);
  saveIndicatorTimer = setTimeout(() => {
    elSaveIndicator.classList.remove("show");
  }, 1500);
}

function saveData() {
  const data = {
    mapIndex:    state.mapIndex,
    stageInMap:  state.stageInMap,
    attack:      state.attack,
    gold:        state.gold,
    enemyHp:     state.enemyHp,
    enemyMaxHp:  state.enemyMaxHp,
    playerHp:    state.playerHp,
    playerMaxHp: state.playerMaxHp,
    inventory:   state.inventory,
    cleared:     state.cleared,
    shopLevels:  state.shopLevels,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function saveGame() {
  saveData();
  showSaveIndicator();
  addSystemLog("セーブしました");
}

function autoSave() {
  saveData();
  showSaveIndicator();
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  const data = JSON.parse(raw);
  state.mapIndex   = data.mapIndex    ?? 0;
  state.stageInMap = data.stageInMap  ?? 0;
  state.attack     = data.attack      ?? 1;
  state.gold       = data.gold        ?? 0;
  state.enemyHp    = data.enemyHp     ?? 0;
  state.enemyMaxHp = data.enemyMaxHp  ?? 0;
  state.playerHp   = data.playerHp    ?? 50;
  state.playerMaxHp= data.playerMaxHp ?? 50;
  state.inventory  = data.inventory   || {};
  state.cleared    = data.cleared     || false;
  state.shopLevels = data.shopLevels  || { vit: 0, agi: 0, dex: 0, luk: 0 };
  return true;
}

function resetSave() {
  if (!confirm("セーブデータを削除してリセットしますか？")) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

// --- 図鑑モーダル ---
function openModal(id) {
  if (id === "item-book")    renderItemBook();
  if (id === "monster-book") renderMonsterBook();
  document.getElementById(`modal-${id}`).classList.add("open");
}

function closeModal(id) {
  document.getElementById(`modal-${id}`).classList.remove("open");
}

function renderItemBook() {
  const TIER_LABELS = ["T0", "T1", "T2", "T3"];
  const cards = ITEMS.map(item => {
    const count = state.inventory[item.id] || 0;
    const tier  = getItemTier(count);
    const unseen = count === 0;

    const tierRows = item.bonus.map((bonus, i) => {
      const threshold = BONUS_THRESHOLDS[i];
      const cleared   = count >= threshold;
      return `<div class="book-tier-line ${cleared ? "cleared" : "locked"}">
        <span class="tier-badge tier-${cleared ? i + 1 : 0}">${TIER_LABELS[i + 1]}</span>
        <span>${threshold}個: ${statStr(bonus)}</span>
        ${cleared ? "<span>✓</span>" : ""}
      </div>`;
    }).join("");

    return `<div class="book-item-card ${unseen ? "unseen" : ""}">
      <div class="book-item-head">
        <span class="book-item-name">${unseen ? "???" : item.name}</span>
        ${!unseen ? `<span class="tier-badge tier-${tier}">${TIER_LABELS[tier]}</span>` : ""}
        <span class="book-item-count">${unseen ? "未入手" : `×${count}`}</span>
      </div>
      ${!unseen ? `
      <div class="book-base-stats">基本: ${statStr(item)}</div>
      <div class="book-tier-list">${tierRows}</div>` : ""}
    </div>`;
  }).join("");

  document.getElementById("item-book-content").innerHTML =
    `<div class="book-item-grid">${cards}</div>`;
}

function renderMonsterBook() {
  const sections = MAPS.map((map, mi) => {
    const rows = map.stages.map((enemy, si) => {
      const seen   = mi < state.mapIndex || (mi === state.mapIndex && si <= state.stageInMap);
      const isBoss = si === 9;
      const drops  = seen
        ? enemy.drops.map(d => `${ITEM_MAP[d.itemId]?.name}(${Math.round(d.rate * 100)}%)`).join(" / ")
        : "—";

      return `<div class="book-monster-row ${!seen ? "unseen" : ""} ${isBoss ? "boss-row" : ""}">
        <span class="book-monster-name ${isBoss ? "boss" : ""}">${seen ? (isBoss ? "★ " + enemy.name : enemy.name) : "???"}</span>
        ${seen ? `
        <span class="book-stat-val">HP ${enemy.hp}</span>
        <span class="book-stat-val">ATK ${enemy.atk}</span>
        <span class="book-stat-val">${(1000 / enemy.atkInterval).toFixed(1)}/s</span>
        <span class="book-drop-list">${drops}</span>` : ""}
      </div>`;
    }).join("");

    return `<div class="book-map-section">
      <div class="book-map-name">${mi + 1}. ${map.name}</div>
      ${rows}
    </div>`;
  }).join("");

  document.getElementById("monster-book-content").innerHTML = sections;
}

// --- 初期化 ---
function init() {
  updateMuteBtn();
  const loaded = loadGame();

  updateStatsDisplay();
  updateInventoryDisplay();
  updateShopDisplay();

  if (loaded && state.cleared) {
    gameClear();
  } else if (loaded) {
    const enemy = MAPS[state.mapIndex].stages[state.stageInMap];
    elEnemyName.textContent = enemy.name;
    elEnemyImg.src = enemy.img;
    elEnemyAtkDisplay.textContent = `ATK ${enemy.atk}  ${(1000 / enemy.atkInterval).toFixed(1)}/s`;
    updateStageDisplay();
    updateHpDisplay();
    startEnemyAttack(enemy);
    addSystemLog("セーブデータをロードしました");
  } else {
    spawnEnemy();
  }

  // 攻撃インターバルはupdateStatsDisplay内のresetAttackIntervalで開始される
  setInterval(autoSave, 5000); // 5秒ごとに自動セーブ
}

init();
