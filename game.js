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

// --- 敵データ ---
// hp          : 最大HP
// atk         : 攻撃力（プレイヤーへのダメージ）
// atkInterval : 攻撃間隔 (ms)
// drops       : [{ itemId, rate }] の形式で複数追加可能
const ENEMIES = [
  { name: "スライム", hp: 10,  atk: 2,  atkInterval: 2000, img: "enemy_slime.png",
    drops: [{ itemId: "slime_gel",    rate: 0.6 }] },
  { name: "ゴブリン", hp: 25,  atk: 4,  atkInterval: 2000, img: "enemy_goblin.png",
    drops: [{ itemId: "goblin_fang",  rate: 0.5 }, { itemId: "lucky_coin", rate: 0.1 }] },
  { name: "オーク",   hp: 50,  atk: 7,  atkInterval: 2000, img: "enemy_orc.png",
    drops: [{ itemId: "orc_hide",     rate: 0.5 }] },
  { name: "トロル",   hp: 100, atk: 12, atkInterval: 2000, img: "enemy_troll.png",
    drops: [{ itemId: "troll_blood",  rate: 0.4 }, { itemId: "lucky_coin", rate: 0.2 }] },
  { name: "ドラゴン", hp: 200, atk: 20, atkInterval: 2000, img: "enemy_dragon.png",
    drops: [{ itemId: "dragon_scale", rate: 0.7 }, { itemId: "lucky_coin", rate: 0.3 }] },
];

// --- ゲーム状態 ---
const state = {
  stage: 1,
  attack: 1,
  enemyIndex: 0,
  enemyHp: 0,
  enemyMaxHp: 0,
  playerHp: 50,
  playerMaxHp: 50,
  inventory: {}, // { itemId: count }
};

// --- DOM 参照 ---
const elStage      = document.getElementById("stage");
const elEnemyName  = document.getElementById("enemy-name");
const elEnemyImg   = document.getElementById("enemy-img");
const elEnemyHp    = document.getElementById("enemy-hp");
const elEnemyMaxHp = document.getElementById("enemy-max-hp");
const elHpBar           = document.getElementById("hp-bar");
const elEnemyAtkDisplay = document.getElementById("enemy-atk-display");
const elAttack          = document.getElementById("stat-atk"); // 後方互換
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

// --- ログ ---
function addLog(msg) {
  const line = document.createElement("div");
  line.textContent = msg;
  elLogBattle.prepend(line);
  while (elLogBattle.children.length > 5) {
    elLogBattle.removeChild(elLogBattle.lastChild);
  }
}

function addSystemLog(msg) {
  const line = document.createElement("div");
  line.textContent = msg;
  elLogSystem.prepend(line);
  while (elLogSystem.children.length > 5) {
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
    addLog("倒れた…ステージ1からやり直し！");
    setTimeout(() => {
      state.playerHp = state.playerMaxHp;
      state.stage = 1;
      state.enemyIndex = 0;
      elStage.textContent = state.stage;
      spawnEnemy();
      updateStatsDisplay();
    }, 2000);
  }
}

// --- 敵をセット ---
function spawnEnemy() {
  const idx = state.enemyIndex % ENEMIES.length;
  const enemy = ENEMIES[idx];
  state.enemyHp = enemy.hp;
  state.enemyMaxHp = enemy.hp;
  elEnemyName.textContent = enemy.name;
  elEnemyImg.src = enemy.img;
  elEnemyAtkDisplay.textContent = `ATK ${enemy.atk}  ${(1000 / enemy.atkInterval).toFixed(1)}/s`;
  updateHpDisplay();
  addLog(`${enemy.name} が現れた！`);
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
    addLog(`${elEnemyName.textContent} を倒した！`);
    playDefeatSound();
    rollDrops(ENEMIES[state.enemyIndex % ENEMIES.length]);
    state.enemyIndex++;
    state.stage++;
    elStage.textContent = state.stage;
    spawnEnemy();
  }
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
    stage:        state.stage,
    attack:       state.attack,
    enemyIndex:   state.enemyIndex,
    enemyHp:      state.enemyHp,
    enemyMaxHp:   state.enemyMaxHp,
    playerHp:     state.playerHp,
    playerMaxHp:  state.playerMaxHp,
    inventory:    state.inventory,
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
  state.stage       = data.stage;
  state.attack      = data.attack;
  state.enemyIndex  = data.enemyIndex;
  state.enemyHp     = data.enemyHp;
  state.enemyMaxHp  = data.enemyMaxHp;
  state.playerHp    = data.playerHp    ?? 50;
  state.playerMaxHp = data.playerMaxHp ?? 50;
  state.inventory   = data.inventory   || {};
  return true;
}

function resetSave() {
  if (!confirm("セーブデータを削除してリセットしますか？")) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

// --- 初期化 ---
function init() {
  updateMuteBtn();
  const loaded = loadGame();

  elAttack.textContent = state.attack;
  elStage.textContent  = state.stage;

  updateStatsDisplay();
  updateInventoryDisplay();

  if (loaded) {
    const idx = state.enemyIndex % ENEMIES.length;
    const enemy = ENEMIES[idx];
    elEnemyName.textContent = enemy.name;
    elEnemyImg.src = enemy.img;
    elEnemyAtkDisplay.textContent = `ATK ${enemy.atk}  ${(1000 / enemy.atkInterval).toFixed(1)}/s`;
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
