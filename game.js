// --- 敵パラメーター計算 ---
function makeEnemy(mapIndex, stageInMap) {
  const def    = MAP_DEFS[mapIndex];
  const isBoss = stageInMap === 9;
  const enemyDef = isBoss
    ? def.boss
    : def.enemies[Math.floor(Math.random() * def.enemies.length)];

  const mult     = 1 + mapIndex * 0.8;
  const si       = stageInMap;
  const hpMult   = enemyDef.hpMult  ?? 1.0;
  const atkMult  = enemyDef.atkMult ?? 1.0;
  const bossHpM  = def.isFinal ? 10 : 6;
  const bossAtkM = def.isFinal ? 4  : 3;

  const baseHp   = Math.round(20 * mult * (1 + si * 0.15));
  const baseAtk  = Math.round(3  * Math.sqrt(mult) * (1 + si * 0.08));
  const baseGold = Math.round(5  * mult * (1 + si * 0.1));

  return {
    name:        enemyDef.name,
    img:         enemyDef.img,
    drops:       enemyDef.drops,
    isBoss,
    isFinal:     def.isFinal || false,
    hp:          isBoss ? Math.round(baseHp  * bossHpM  * hpMult)  : Math.round(baseHp  * hpMult),
    atk:         isBoss ? Math.round(baseAtk * bossAtkM * atkMult) : Math.round(baseAtk * atkMult),
    atkInterval: isBoss ? 1500 : 2000,
    gold:        isBoss ? Math.round(baseGold * 5) : baseGold,
  };
}

function shopStatCost(key) {
  const def = SHOP_DEFS[key];
  return Math.ceil(def.baseCost * Math.pow(def.mult, state.shopLevels[key]));
}

function shopStatCostN(key, n) {
  const def = SHOP_DEFS[key];
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += Math.ceil(def.baseCost * Math.pow(def.mult, state.shopLevels[key] + i));
  }
  return total;
}

function healCost() {
  return Math.max(20, Math.ceil(state.playerMaxHp * 0.4));
}

// ボスを100回倒したマップはステージ1〜9が一括出現モードになる
function isMultiMode(mapIndex) {
  const bossKey = `${mapIndex}:${MAP_DEFS[mapIndex].boss.name}`;
  return (state.monsterKills[bossKey] || 0) >= 100;
}

// --- ゲーム状態 ---
const state = {
  mapIndex:     0,
  stageInMap:   0,
  attack:       1,
  gold:         0,
  enemyHp:      0,
  enemyMaxHp:   0,
  playerHp:     50,
  playerMaxHp:  50,
  inventory:    {},
  cleared:      false,
  shopLevels:   { vit: 0, agi: 0, dex: 0, luk: 0 },
  currentEnemy: null,
  monsterKills: {},
  multiEnemies: null, // 一括討伐モード中の敵リスト（{ ...enemy, currentHp }[]）
};

// --- 定数 ---
const CHAR_ICON = ""; // 例: "img/icon/char.png"

// セーブアイコン: src に画像パスを設定すると画像表示、空なら alt のテキストを表示
const SAVE_ICONS = [
  { id: "save",   src: "", alt: "S", label: "セーブ",       action: "saveGame()" },
  { id: "export", src: "", alt: "E", label: "エクスポート", action: "openExportModal()" },
  { id: "import", src: "", alt: "I", label: "インポート",   action: "openImportModal()" },
  { id: "reset",  src: "", alt: "R", label: "リセット",     action: "resetSave()",        cls: "reset" },
];

// パネルアイコン: src に画像パスを設定すると画像表示、空なら alt のテキストを表示
const PANEL_ICONS = {
  "pi-player":    { src: "", alt: "能" }, // 例: "img/icon/status.png"
  "pi-inventory": { src: "", alt: "荷" }, // 例: "img/icon/bag.png"
  "pi-shop":      { src: "", alt: "店" }, // 例: "img/icon/shop.png"
};

// --- DOM 参照 ---
const elMapName    = document.getElementById("map-name");
const elMapIcon    = document.getElementById("map-icon");
const elStageBg    = document.getElementById("stage-bg");
const elStageGrid  = document.getElementById("stage-grid");
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
const elEnemyArea   = document.getElementById("enemy-area");
const elMultiGrid   = document.getElementById("multi-enemy-grid");

// --- ログ ---
function addLog(msg) {
  const line = document.createElement("div");
  line.textContent = msg;
  elLogBattle.prepend(line);
  while (elLogBattle.children.length > 10) elLogBattle.removeChild(elLogBattle.lastChild);
}

function addSystemLog(msg) {
  const line = document.createElement("div");
  line.textContent = msg;
  elLogSystem.prepend(line);
  while (elLogSystem.children.length > 10) elLogSystem.removeChild(elLogSystem.lastChild);
}

// --- 敵攻撃インターバル ---
let enemyAttackIntervalId = null;

function stopEnemyAttack() {
  clearInterval(enemyAttackIntervalId);
  enemyAttackIntervalId = null;
}

// --- 単体敵の攻撃 ---
function enemyTick(enemy) {
  state.playerHp = Math.max(0, state.playerHp - enemy.atk);
  elPlayerHpBar.style.width = (state.playerHp / state.playerMaxHp * 100) + "%";
  elPlayerHpDisplay.textContent = `${state.playerHp} / ${state.playerMaxHp}`;
  addLog(`${enemy.name} の攻撃！ ${enemy.atk} ダメージを受けた`);

  if (state.playerHp <= 0) {
    stopEnemyAttack();
    addLog("倒れた…マップ1からやり直し！");
    setTimeout(() => {
      state.playerHp    = state.playerMaxHp;
      state.mapIndex    = 0;
      state.stageInMap  = 0;
      state.multiEnemies = null;
      elEnemyArea.classList.remove("multi-mode");
      spawnEnemy();
      updateStatsDisplay();
    }, 2000);
  }
}

// --- 一括モードの敵攻撃（全員合計ATKで殴る）---
function multiEnemyTick() {
  if (!state.multiEnemies) return;
  const alive = state.multiEnemies.filter(e => e.currentHp > 0);
  if (alive.length === 0) return;

  const totalAtk = alive.reduce((s, e) => s + e.atk, 0);
  state.playerHp = Math.max(0, state.playerHp - totalAtk);
  elPlayerHpBar.style.width = (state.playerHp / state.playerMaxHp * 100) + "%";
  elPlayerHpDisplay.textContent = `${state.playerHp} / ${state.playerMaxHp}`;
  addLog(`${alive.length}体の一斉攻撃！ ${totalAtk} ダメージ`);

  if (state.playerHp <= 0) {
    stopEnemyAttack();
    addLog("倒れた…マップ1からやり直し！");
    setTimeout(() => {
      state.playerHp    = state.playerMaxHp;
      state.mapIndex    = 0;
      state.stageInMap  = 0;
      state.multiEnemies = null;
      elEnemyArea.classList.remove("multi-mode");
      spawnEnemy();
      updateStatsDisplay();
    }, 2000);
  }
}

// --- ステージグリッド初期化 ---
function initStageGrid() {
  elStageGrid.innerHTML = "";
  for (let i = 0; i < 10; i++) {
    const cell = document.createElement("div");
    cell.className = "stage-cell";
    cell.dataset.idx = i;
    if (i === 9) cell.classList.add("boss");
    if (CHAR_ICON) {
      const img = document.createElement("img");
      img.src = CHAR_ICON;
      img.className = "stage-char";
      cell.appendChild(img);
    } else {
      const dot = document.createElement("span");
      dot.className = "stage-char";
      dot.textContent = "★";
      cell.appendChild(dot);
    }
    elStageGrid.appendChild(cell);
  }
}

// --- ステージ表示更新 ---
function updateStageDisplay() {
  const map = MAP_DEFS[state.mapIndex];
  elMapName.textContent = map.name;

  // 背景画像
  if (map.bg) {
    elStageBg.style.backgroundImage = `url('${map.bg}')`;
    elStageBg.style.display = "block";
  } else {
    elStageBg.style.backgroundImage = "";
    elStageBg.style.display = "none";
  }

  // マップアイコン
  if (map.icon) {
    elMapIcon.src = map.icon;
    elMapIcon.style.display = "inline-block";
  } else {
    elMapIcon.style.display = "none";
  }

  // ステージグリッド
  const cells = elStageGrid.querySelectorAll(".stage-cell");
  cells.forEach((cell, i) => {
    cell.classList.remove("done", "current", "multi-active");
    if (state.multiEnemies !== null) {
      cell.classList.add("multi-active");
    } else if (i < state.stageInMap) {
      cell.classList.add("done");
    } else if (i === state.stageInMap) {
      cell.classList.add("current");
    }
    const charEl = cell.querySelector(".stage-char");
    if (charEl) charEl.style.visibility = (i === state.stageInMap) ? "visible" : "hidden";
  });
}

// --- 一括討伐モード開始 ---
function spawnMultiEnemies() {
  state.multiEnemies = [];
  for (let si = 0; si < 10; si++) {
    const e = makeEnemy(state.mapIndex, si);
    state.multiEnemies.push({ ...e, currentHp: e.hp });
  }

  elEnemyArea.classList.add("multi-mode");
  renderMultiGrid();
  updateStageDisplay();

  // 一括モードの敵攻撃インターバル（2000ms ごとに全員で攻撃）
  clearInterval(enemyAttackIntervalId);
  enemyAttackIntervalId = setInterval(multiEnemyTick, 2000);

  addLog(`★ 一括討伐モード！ ${state.multiEnemies.length}体が一斉出現！`);
  addSystemLog(`${MAP_DEFS[state.mapIndex].name}: ボス100回討伐達成！`);
}

function renderMultiGrid() {
  elMultiGrid.innerHTML = (state.multiEnemies || []).map((e, i) => `
    <div class="multi-enemy-card" id="multi-card-${i}">
      <img src="${e.img}" class="multi-enemy-img">
      <div class="multi-enemy-info">
        <div class="multi-enemy-name">${e.name}</div>
        <div class="mini-hp-bar-wrap">
          <div class="mini-hp-bar" id="mini-hp-${i}"></div>
        </div>
      </div>
    </div>
  `).join("");
}

function updateMultiGrid() {
  (state.multiEnemies || []).forEach((e, i) => {
    const card = document.getElementById(`multi-card-${i}`);
    const bar  = document.getElementById(`mini-hp-${i}`);
    if (!card || !bar) return;
    const pct = Math.max(0, e.currentHp / e.hp * 100);
    bar.style.width = pct + "%";
    if (e.currentHp <= 0) card.classList.add("dead");
  });
}

// --- 通常の敵をセット ---
function spawnEnemy() {
  if (state.cleared) return;

  // stageInMap=0 かつ一括モード対象マップなら全員召喚
  if (state.stageInMap === 0 && isMultiMode(state.mapIndex)) {
    spawnMultiEnemies();
    return;
  }

  // 通常モード: 一括モード表示を解除
  state.multiEnemies = null;
  elEnemyArea.classList.remove("multi-mode");
  elMultiGrid.innerHTML = "";

  const enemy = makeEnemy(state.mapIndex, state.stageInMap);
  state.currentEnemy = enemy;
  state.enemyHp      = enemy.hp;
  state.enemyMaxHp   = enemy.hp;

  elEnemyName.textContent       = enemy.name;
  elEnemyImg.src                = enemy.img;
  elEnemyAtkDisplay.textContent = `ATK ${enemy.atk}  ${(1000 / enemy.atkInterval).toFixed(1)}/s`;
  updateStageDisplay();
  updateHpDisplay();

  if (enemy.isBoss) addLog(`★ BOSS: ${enemy.name} が現れた！`);
  else              addLog(`${enemy.name} が現れた！`);

  clearInterval(enemyAttackIntervalId);
  enemyAttackIntervalId = setInterval(() => enemyTick(enemy), enemy.atkInterval);
}

function updateHpDisplay() {
  elEnemyHp.textContent    = Math.max(0, state.enemyHp);
  elEnemyMaxHp.textContent = state.enemyMaxHp;
  const pct = (state.enemyHp / state.enemyMaxHp) * 100;
  elHpBar.style.width = Math.max(0, pct) + "%";
}

// --- ダメージ数値エフェクト ---
function showDamageNumber(text, type) {
  const areaRect = elEnemyArea.getBoundingClientRect();
  let centerX, topY;

  if (state.multiEnemies !== null) {
    // 一括モード: グリッド中央基準
    const gridRect = elMultiGrid.getBoundingClientRect();
    centerX = gridRect.left + gridRect.width  / 2 - areaRect.left;
    topY    = gridRect.top  - areaRect.top + 10;
  } else {
    const imgRect = elEnemyImg.getBoundingClientRect();
    centerX = imgRect.left + imgRect.width  / 2 - areaRect.left;
    topY    = imgRect.top  - areaRect.top;
  }

  const el = document.createElement("span");
  el.className   = "damage-number" + (type ? " " + type : "");
  el.textContent = text;

  const spread = type === "crit" ? 55 : 40;
  el.style.left = (centerX + (Math.random() * spread * 2 - spread)) + "px";
  el.style.top  = (topY + Math.random() * 30) + "px";

  elEnemyArea.appendChild(el);
  el.addEventListener("animationend", () => el.remove());
}

function flashEnemyHit() {
  const target = state.multiEnemies !== null ? elMultiGrid : elEnemyImg;
  if (!target) return;
  target.classList.remove("enemy-hit");
  void target.offsetWidth;
  target.classList.add("enemy-hit");
  target.addEventListener("animationend", () => target.classList.remove("enemy-hit"), { once: true });
}

// --- プレイヤー攻撃 ---
function tick() {
  const s = computePlayerStats();
  if (state.multiEnemies !== null) { tickMulti(s); return; }

  // 通常単体
  if (Math.random() > s.hitRate) {
    addLog("ミス！");
    showDamageNumber("MISS", "miss");
    return;
  }

  let dmg = s.totalAtk;
  let suffix = "";
  let dmgType = null;
  if (Math.random() < s.critChance) {
    dmg = Math.floor(dmg * 1.5);
    suffix  = " ★クリティカル！";
    dmgType = "crit";
  }

  state.enemyHp -= dmg;
  showDamageNumber(dmg, dmgType);
  flashEnemyHit();
  addLog(`攻撃！ ${dmg} ダメージ（残HP: ${Math.max(0, state.enemyHp)}）${suffix}`);
  updateHpDisplay();

  if (state.enemyHp <= 0) {
    stopEnemyAttack();
    const defeatedEnemy = state.currentEnemy;
    const earned = Math.floor(defeatedEnemy.gold * (0.75 + Math.random() * 0.5));
    state.gold += earned;
    addLog(`${defeatedEnemy.name} を倒した！ +${earned}G`);
    playDefeatSound();
    updateShopDisplay();
    rollDrops(defeatedEnemy);
    recordKill(state.mapIndex, defeatedEnemy.name);

    if (defeatedEnemy.isFinal) { gameClear(); return; }

    state.stageInMap++;
    if (state.stageInMap >= 10) {
      state.stageInMap = 0;
      state.mapIndex++;
      if (state.mapIndex >= MAP_DEFS.length) { gameClear(); return; }
      addSystemLog(`★ マップクリア！ 「${MAP_DEFS[state.mapIndex].name}」へ！`);
    }
    spawnEnemy();
  }
}

// --- 一括討伐モードのプレイヤー攻撃（全員同時ダメージ）---
function tickMulti(s) {
  const alive = state.multiEnemies.filter(e => e.currentHp > 0);
  if (alive.length === 0) return;

  if (Math.random() > s.hitRate) {
    addLog("ミス！");
    showDamageNumber("MISS", "miss");
    return;
  }

  let dmg = s.totalAtk;
  let dmgType = null;
  let suffix = "";
  if (Math.random() < s.critChance) {
    dmg     = Math.floor(dmg * 1.5);
    dmgType = "crit";
    suffix  = " ★クリティカル！";
  }

  // 全員に同じダメージ
  alive.forEach(e => { e.currentHp -= dmg; });
  showDamageNumber(`${dmg}×${alive.length}`, dmgType);
  flashEnemyHit();
  addLog(`全体攻撃！ ${dmg}×${alive.length}体${suffix}`);

  // 倒れた敵を処理
  const defeated = state.multiEnemies.filter(e => e.currentHp <= 0 && !e._counted);
  if (defeated.length > 0) {
    let totalGold = 0;
    for (const e of defeated) {
      e._counted = true;
      const earned = Math.floor(e.gold * (0.75 + Math.random() * 0.5));
      totalGold += earned;
      rollDrops(e);
      recordKill(state.mapIndex, e.name);
    }
    state.gold += totalGold;
    addLog(`${defeated.map(e => e.name).join("、")} 撃破！ +${totalGold}G`);
    playDefeatSound();
    updateShopDisplay();
  }

  updateMultiGrid();

  // 全員撃破（ボス込み）→ 次のマップへ
  const anyAlive = state.multiEnemies.some(e => e.currentHp > 0);
  if (!anyAlive) {
    stopEnemyAttack();
    const hadFinal = state.multiEnemies.some(e => e.isFinal);
    state.multiEnemies = null;
    elEnemyArea.classList.remove("multi-mode");
    elMultiGrid.innerHTML = "";
    if (hadFinal) { gameClear(); return; }
    state.stageInMap = 0;
    state.mapIndex++;
    if (state.mapIndex >= MAP_DEFS.length) { gameClear(); return; }
    addSystemLog(`★ マップ一括クリア！ 「${MAP_DEFS[state.mapIndex].name}」へ！`);
    spawnEnemy();
  }
}

// --- モンスター討伐記録 ---
function recordKill(mapIndex, enemyName) {
  const key  = `${mapIndex}:${enemyName}`;
  const prev = state.monsterKills[key] || 0;
  state.monsterKills[key] = prev + 1;
  const cur  = state.monsterKills[key];

  BONUS_THRESHOLDS.forEach(thresh => {
    if (prev < thresh && cur >= thresh) {
      addSystemLog(`${enemyName} ${thresh}体討伐！ボーナス解放！`);
    }
  });

  // ボス100回で一括モード解放通知
  const bossName = MAP_DEFS[mapIndex].boss.name;
  if (enemyName === bossName && cur === 100) {
    addSystemLog(`★★ ${MAP_DEFS[mapIndex].name} ボス100体討伐！一括討伐モード解放！`);
  }

  // マップ全員999達成チェック
  if (cur === 999) {
    const def = MAP_DEFS[mapIndex];
    if (def.mapBonus) {
      const allMax = [...def.enemies, def.boss].every(e =>
        (state.monsterKills[`${mapIndex}:${e.name}`] || 0) >= 999
      );
      if (allMax) addSystemLog(`★★ ${def.name}マップ制覇！全モンスター999体ボーナス解放！`);
    }
  }

  updateStatsDisplay();
}

// --- ゲームクリア ---
function gameClear() {
  state.cleared = true;
  stopEnemyAttack();
  clearInterval(attackIntervalId);
  elMapName.textContent = "★ GAME CLEAR ★";
  elStageGrid.querySelectorAll(".stage-cell").forEach(c => {
    c.classList.remove("done", "current", "multi-active");
    c.classList.add("done");
    const charEl = c.querySelector(".stage-char");
    if (charEl) charEl.style.visibility = "hidden";
  });
  addLog("魔王を倒した！ 世界に平和が訪れた！");
  addSystemLog("★★★ ゲームクリア！ おめでとうございます！ ★★★");
}

// --- ショップ ---
function updateShopDisplay() {
  elGold.textContent = state.gold;
  const hc = healCost();
  elHealCost.textContent = hc;
  elBtnHeal.disabled = state.gold < hc || state.playerHp >= state.playerMaxHp;
  for (const key of Object.keys(SHOP_DEFS)) {
    const cost1  = shopStatCost(key);
    const cost10 = shopStatCostN(key, 10);
    document.getElementById(`shop-${key}-cost`).textContent    = cost1;
    document.getElementById(`shop-${key}-cost-10`).textContent = cost10;
    document.getElementById(`btn-buy-${key}`).disabled    = state.gold < cost1;
    document.getElementById(`btn-buy-${key}-10`).disabled = state.gold < cost10;
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

function buyShopStat(key, n = 1) {
  const cost = shopStatCostN(key, n);
  if (state.gold < cost) return;
  state.gold -= cost;
  state.shopLevels[key] += n;
  updateShopDisplay();
  updateStatsDisplay();
  const def   = SHOP_DEFS[key];
  const total = state.shopLevels[key] * def.amount;
  addSystemLog(`${key.toUpperCase()}×${n}強化！ ${def.stat.toUpperCase()}が合計+${total} (次回: ${shopStatCost(key)}G)`);
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

function initSaveIcons() {
  const container = document.getElementById("save-buttons");
  container.innerHTML = SAVE_ICONS.map(icon => {
    const inner = icon.src
      ? `<img src="${icon.src}" alt="${icon.alt}" class="save-icon-img">`
      : `<span class="save-icon-text">${icon.alt}</span>`;
    return `<button class="save-icon-btn ${icon.cls || ''}" onclick="${icon.action}" title="${icon.label}">${inner}</button>`;
  }).join("");
}

function initPanelIcons() {
  for (const [elId, icon] of Object.entries(PANEL_ICONS)) {
    const el = document.getElementById(elId);
    if (!el) continue;
    if (icon.src) {
      el.innerHTML = `<img src="${icon.src}" alt="${icon.alt}" class="panel-icon-img">`;
    } else {
      el.textContent = icon.alt;
    }
  }
}

function togglePanel(id) {
  document.getElementById(id).classList.toggle("open");
}

function toggleMute() {
  soundMuted = !soundMuted;
  updateMuteBtn();
}

// --- ステータス計算 ---
function computePlayerStats() {
  const raw = { str: 0, vit: 0, int: 0, dex: 0, agi: 0, luk: 0 };

  for (const [itemId, count] of Object.entries(state.inventory)) {
    const item = ITEM_MAP[itemId];
    if (!item) continue;
    for (const s of Object.keys(raw)) raw[s] += item[s];
    if (item.bonus) {
      item.bonus.forEach((tier, i) => {
        if (count >= BONUS_THRESHOLDS[i]) {
          for (const s of Object.keys(raw)) raw[s] += (tier[s] || 0);
        }
      });
    }
  }

  for (const [key, def] of Object.entries(SHOP_DEFS)) {
    raw[def.stat] += state.shopLevels[key] * def.amount;
  }

  for (const [mi, def] of MAP_DEFS.entries()) {
    const allDefs = [...def.enemies, def.boss];
    for (const enemyDef of allDefs) {
      if (!enemyDef.killBonus) continue;
      const kills = state.monsterKills[`${mi}:${enemyDef.name}`] || 0;
      enemyDef.killBonus.forEach((tier, i) => {
        if (kills >= BONUS_THRESHOLDS[i]) {
          for (const s of Object.keys(raw)) raw[s] += (tier[s] || 0);
        }
      });
    }
    if (def.mapBonus) {
      const allMax = allDefs.every(e =>
        (state.monsterKills[`${mi}:${e.name}`] || 0) >= 999
      );
      if (allMax) {
        for (const s of Object.keys(raw)) raw[s] += (def.mapBonus[s] || 0);
      }
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

function statStr(obj, prefix = "") {
  return ["str","vit","int","dex","agi","luk"]
    .filter(s => (obj[s] || 0) > 0)
    .map(s => `${prefix}${s.toUpperCase()}+${obj[s]}`)
    .join(" ") || "—";
}

function updateInventoryDisplay() {
  const TIER_LABELS = ["", "T1", "T2", "T3"];
  const entries = ITEMS
    .filter(item => state.inventory[item.id] > 0)
    .sort((a, b) => {
      const aMax = (state.inventory[a.id] || 0) >= 999;
      const bMax = (state.inventory[b.id] || 0) >= 999;
      return aMax - bMax; // MAX は下へ
    })
    .map(item => {
      const count = state.inventory[item.id];
      const tier  = getItemTier(count);
      const next  = BONUS_THRESHOLDS[tier];

      const tierBadge = `<span class="tier-badge tier-${tier}">${tier > 0 ? TIER_LABELS[tier] : "T0"}</span>`;
      const nextHint  = next !== undefined
        ? `<span class="inv-next">→${next}</span>`
        : `<span class="inv-next max">MAX</span>`;

      const curEff  = calcItemEffect(item, count);
      const curText = statStr(curEff);
      let nextText  = "";
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
      const newCount = state.inventory[item.id];
      const prevTier = getItemTier(prevCount);
      const newTier  = getItemTier(newCount);
      addSystemLog(`${item.name} を入手！ (×${newCount})`);
      if (newTier > prevTier) addSystemLog(`★ ${item.name} Tier${newTier} 解放！ボーナス加算！`);
      updateStatsDisplay();
      updateInventoryDisplay();
    }
  });
}

function playDefeatSound() {
  if (soundMuted) return;
  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    const osc  = audioCtx.createOscillator();
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
  saveIndicatorTimer = setTimeout(() => elSaveIndicator.classList.remove("show"), 1500);
}

function saveData() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    mapIndex:     state.mapIndex,
    stageInMap:   state.stageInMap,
    attack:       state.attack,
    gold:         state.gold,
    enemyHp:      state.enemyHp,
    enemyMaxHp:   state.enemyMaxHp,
    playerHp:     state.playerHp,
    playerMaxHp:  state.playerMaxHp,
    inventory:    state.inventory,
    cleared:      state.cleared,
    shopLevels:   state.shopLevels,
    monsterKills: state.monsterKills,
  }));
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
  state.mapIndex     = data.mapIndex     ?? 0;
  state.stageInMap   = data.stageInMap   ?? 0;
  state.attack       = data.attack       ?? 1;
  state.gold         = data.gold         ?? 0;
  state.enemyHp      = data.enemyHp      ?? 0;
  state.enemyMaxHp   = data.enemyMaxHp   ?? 0;
  state.playerHp     = data.playerHp     ?? 50;
  state.playerMaxHp  = data.playerMaxHp  ?? 50;
  state.inventory    = data.inventory    || {};
  state.cleared      = data.cleared      || false;
  state.shopLevels   = data.shopLevels   || { vit: 0, agi: 0, dex: 0, luk: 0 };
  state.monsterKills = data.monsterKills || {};
  return true;
}

function resetSave() {
  if (!confirm("セーブデータを削除してリセットしますか？")) return;
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

// --- エクスポート / インポート ---
function openExportModal() {
  saveData();
  const raw     = localStorage.getItem(SAVE_KEY) || "{}";
  const encoded = btoa(encodeURIComponent(raw));
  const ta      = document.getElementById("savedata-textarea");
  ta.value    = encoded;
  ta.readOnly = true;
  document.getElementById("savedata-title").textContent    = "セーブデータ エクスポート";
  document.getElementById("savedata-hint").textContent     = "以下の文字列をコピーして保管してください";
  document.getElementById("savedata-copy-btn").style.display  = "";
  document.getElementById("savedata-copy-btn").textContent = "コピー";
  document.getElementById("savedata-apply-btn").style.display = "none";
  document.getElementById("modal-savedata").classList.add("open");
}

function openImportModal() {
  const ta    = document.getElementById("savedata-textarea");
  ta.value    = "";
  ta.readOnly = false;
  document.getElementById("savedata-title").textContent    = "セーブデータ インポート";
  document.getElementById("savedata-hint").textContent     = "エクスポートした文字列を貼り付けてください";
  document.getElementById("savedata-copy-btn").style.display  = "none";
  document.getElementById("savedata-apply-btn").style.display = "";
  document.getElementById("modal-savedata").classList.add("open");
  ta.focus();
}

function closeSaveDataModal() {
  document.getElementById("modal-savedata").classList.remove("open");
}

function copyExportData() {
  const ta  = document.getElementById("savedata-textarea");
  const btn = document.getElementById("savedata-copy-btn");
  navigator.clipboard.writeText(ta.value).then(() => {
    btn.textContent = "コピーしました！";
    setTimeout(() => { btn.textContent = "コピー"; }, 1800);
  }).catch(() => {
    ta.select();
    document.execCommand("copy");
    btn.textContent = "コピーしました！";
    setTimeout(() => { btn.textContent = "コピー"; }, 1800);
  });
}

function applyImport() {
  const encoded = document.getElementById("savedata-textarea").value.trim();
  if (!encoded) return;
  try {
    const raw  = decodeURIComponent(atob(encoded));
    const data = JSON.parse(raw);
    if (typeof data.mapIndex !== "number") throw new Error("invalid");
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    closeSaveDataModal();
    location.reload();
  } catch {
    alert("セーブデータが正しくありません。文字列を確認してください。");
  }
}

// --- 図鑑 ---
let currentBookTab = "item";

function openBook(tab) {
  currentBookTab = tab;
  renderBook();
  document.getElementById("modal-book").classList.add("open");
}

function closeBook() {
  document.getElementById("modal-book").classList.remove("open");
}

function switchBookTab(tab) {
  currentBookTab = tab;
  renderBook();
  document.getElementById("tab-item").classList.toggle("active", tab === "item");
  document.getElementById("tab-monster").classList.toggle("active", tab === "monster");
}

function renderBook() {
  document.getElementById("tab-item").classList.toggle("active", currentBookTab === "item");
  document.getElementById("tab-monster").classList.toggle("active", currentBookTab === "monster");
  if (currentBookTab === "item") renderItemBook();
  else                           renderMonsterBook();
}

function renderItemBook() {
  const TIER_LABELS = ["T0", "T1", "T2", "T3"];
  const cards = ITEMS.map(item => {
    const count  = state.inventory[item.id] || 0;
    const tier   = getItemTier(count);
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

  document.getElementById("book-content").innerHTML =
    `<div class="book-item-grid">${cards}</div>`;
}

function renderMonsterBook() {
  const TIER_LABELS = ["T0", "T1", "T2", "T3"];

  const sections = MAP_DEFS.map((def, mi) => {
    const mapReached = mi <= state.mapIndex;
    const bossKey    = `${mi}:${def.boss.name}`;
    const bossKills  = state.monsterKills[bossKey] || 0;
    const multiUnlocked = bossKills >= 100;

    const mapNameText = mapReached ? `${mi + 1}. ${def.name}` : `${mi + 1}. ???`;
    const multiTag = mapReached && multiUnlocked
      ? `<span class="multi-badge">一括×${bossKills}</span>`
      : mapReached && bossKills > 0
        ? `<span class="multi-badge locked-multi">一括まで${100 - bossKills}回</span>`
        : "";

    const allDefs = [...def.enemies, def.boss];
    const allMax  = mapReached && allDefs.every(e =>
      (state.monsterKills[`${mi}:${e.name}`] || 0) >= 999
    );

    const cards = allDefs.map((enemyDef, idx) => {
      const isBoss = idx === def.enemies.length;
      const key    = `${mi}:${enemyDef.name}`;
      const kills  = state.monsterKills[key] || 0;
      const tier   = getItemTier(kills);
      const next   = BONUS_THRESHOLDS[tier];

      if (!mapReached) {
        return `<div class="book-monster-card unseen">
          <img class="book-monster-img" src="${enemyDef.img}">
          <div class="book-monster-name ${isBoss ? "boss" : ""}">???</div>
        </div>`;
      }

      const nextHint = next !== undefined
        ? `→${next}体`
        : `<span class="kill-max">MAX</span>`;

      const killTiers = (enemyDef.killBonus || []).map((bonus, i) => {
        const thresh  = BONUS_THRESHOLDS[i];
        const cleared = kills >= thresh;
        return `<span class="bmc-tier ${cleared ? "cleared" : ""}">${TIER_LABELS[i + 1]}${cleared ? "✓" : ""}</span>`;
      }).join("");

      const drops = enemyDef.drops
        .map(d => `${ITEM_MAP[d.itemId]?.name ?? d.itemId}`)
        .join("<br>");

      return `<div class="book-monster-card ${isBoss ? "boss-card" : ""}">
        <div class="bmc-top">
          <img class="book-monster-img" src="${enemyDef.img}">
          <span class="tier-badge tier-${tier}">${TIER_LABELS[tier]}</span>
        </div>
        <div class="book-monster-name ${isBoss ? "boss" : ""}">${isBoss ? "★ " + enemyDef.name : enemyDef.name}</div>
        <div class="kill-count">×${kills} ${nextHint}</div>
        ${killTiers ? `<div class="bmc-tiers">${killTiers}</div>` : ""}
        <div class="book-drop-info">${drops}</div>
      </div>`;
    }).join("");

    const mapBonusHtml = def.mapBonus
      ? `<div class="book-map-bonus ${allMax ? "cleared" : "locked"}">
          <span>★ マップ制覇 (全員×999)</span>
          <span class="map-bonus-stats">${statStr(def.mapBonus)}</span>
          ${allMax ? "<span>✓</span>" : ""}
        </div>`
      : "";

    return `<div class="book-map-section">
      <div class="book-map-name ${!mapReached ? "unseen-map" : ""}">${mapNameText} ${multiTag}</div>
      <div class="book-monster-cards">${cards}</div>
      ${mapBonusHtml}
    </div>`;
  }).join("");

  document.getElementById("book-content").innerHTML = sections;
}

// --- 初期化 ---
function init() {
  updateMuteBtn();
  initSaveIcons();
  initPanelIcons();
  initStageGrid();
  const loaded = loadGame();

  updateStatsDisplay();
  updateInventoryDisplay();
  updateShopDisplay();

  if (loaded && state.cleared) gameClear();
  else                         spawnEnemy();

  setInterval(autoSave, 5000);
}

init();
