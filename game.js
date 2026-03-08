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
    evasion:     enemyDef.evasion  ?? 0,
    critRes:     enemyDef.critRes  ?? 0,
    isRare:      false,
  };
}

function makeRareEnemy(mapIndex, stageInMap) {
  const def  = MAP_DEFS[mapIndex];
  const rare = def.rare;
  const mult = 1 + mapIndex * 0.8;
  const si   = stageInMap;
  const baseHp   = Math.round(20 * mult * (1 + si * 0.15));
  const baseAtk  = Math.round(3  * Math.sqrt(mult) * (1 + si * 0.08));
  const baseGold = Math.round(5  * mult * (1 + si * 0.1));
  return {
    name:        rare.name,
    img:         rare.img,
    drops:       rare.drops ?? [],
    isBoss:      false,
    isRare:      true,
    isFinal:     false,
    hp:          Math.round(baseHp  * (rare.hpMult  ?? 1.0)),
    atk:         Math.round(baseAtk * (rare.atkMult ?? 1.0)),
    atkInterval: 2000,
    gold:        Math.round(baseGold * (rare.goldMult ?? 8)),
    evasion:     rare.evasion  ?? 0,
    critRes:     rare.critRes  ?? 0,
  };
}

// 図鑑用：特定の敵定義から代表ステータスを計算（通常 si=4、ボス si=9）
function computeEnemyStats(mi, enemyDef, isBoss, isRare = false) {
  const def    = MAP_DEFS[mi];
  const mult   = 1 + mi * 0.8;
  const si     = isBoss ? 9 : 4;
  const hpMult   = enemyDef.hpMult  ?? 1.0;
  const atkMult  = enemyDef.atkMult ?? 1.0;
  const bossHpM  = def.isFinal ? 10 : 6;
  const bossAtkM = def.isFinal ? 4  : 3;
  const baseHp   = Math.round(20 * mult * (1 + si * 0.15));
  const baseAtk  = Math.round(3  * Math.sqrt(mult) * (1 + si * 0.08));
  return {
    evasion: enemyDef.evasion ?? 0,
    critRes: enemyDef.critRes ?? 0,
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
  mapIndex:        0,
  stageInMap:      0,
  attack:          1,
  gold:            0,
  enemyHp:         0,
  enemyMaxHp:      0,
  playerHp:        50,
  playerMaxHp:     50,
  inventory:       {},
  itemsObtained:   {},
  cleared:         false,
  shopLevels:      { vit: 0, str: 0, int: 0, agi: 0, dex: 0, luk: 0 },
  currentEnemy:    null,
  monsterKills:    {},
  multiEnemies:    null, // 一括討伐モード中の敵リスト（{ ...enemy, currentHp }[]）
  refine:          null, // 精製中: { recipeId, elapsed: ms, duration: ms, countLeft: number|-1 }
  achievements:    [],
  totalGoldEarned: 0,
  totalRefines:    0,
  totalDeaths:     0,
  totalShopBuys:   0,
  rareKills:       0,
  mapsCleared:     0,
  consumables:     {},
  pendingBatch:    false, // 一括チケット使用中フラグ（次マップ到達で発動、死亡で返却）
  batchFromTicket: false, // 一括討伐がチケット起動かどうか（死亡時に返却判定）
  clearPoints:     0,    // ゲームクリア周回数
};

// --- 定数 ---
const PAGE_BG  = ""; // ゲーム枠の外側（ページ背景）画像パス 例: "img/bg/field.png"
const GAME_BG  = "img/bg/frame.png"; // ゲーム枠の背景画像パス 例: "img/bg/frame.png"
const CHAR_ICON = "img/icon/char.png"; // 例: "img/icon/char.png"

// セーブアイコン: src に画像パスを設定すると画像表示、空なら alt のテキストを表示
const SAVE_ICONS = [
  { id: "save",   src: "", alt: "S", label: "セーブ",           action: "saveGame()" },
  { id: "export", src: "", alt: "E", label: "エクスポート",     action: "openExportModal()" },
  { id: "import", src: "", alt: "I", label: "インポート",       action: "openImportModal()" },
  { id: "home",   src: "", alt: "↩", label: "マップ1へ戻る",   action: "returnToFirstMap()", cls: "home" },
  { id: "reset",  src: "", alt: "R", label: "リセット",         action: "resetSave()",        cls: "reset" },
];

// パネルアイコン: src に画像パスを設定すると画像表示、空なら alt のテキストを表示
const PANEL_ICONS = {
  "pi-player":    { src: "", alt: "能" }, // 例: "img/icon/status.png"
  "pi-inventory": { src: "", alt: "荷" }, // 例: "img/icon/bag.png"
  "pi-shop":      { src: "", alt: "店" }, // 例: "img/icon/shop.png"
  "pi-refine":    { src: "", alt: "精" }, // 例: "img/icon/refine.png"
};

// --- DOM 参照 ---
const elGameBg     = document.getElementById("game-bg");
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
const elEnemyArea      = document.getElementById("enemy-area");
const elStunTimerText  = document.getElementById("stun-timer-text");
const elMultiGrid      = document.getElementById("multi-enemy-grid");
const elMcTrack        = document.getElementById("mc-track");
const elMcPrev         = document.getElementById("mc-prev");
const elMcNext         = document.getElementById("mc-next");

let _mcSlideDir = 0; // 1: 左からスライドイン(次へ), -1: 右からスライドイン(前へ)

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
let stunTimeoutId    = null;
let stunCountdownId  = null;

function stopEnemyAttack() {
  clearInterval(enemyAttackIntervalId);
  enemyAttackIntervalId = null;
}

function clearStun() {
  clearTimeout(stunTimeoutId);
  clearInterval(stunCountdownId);
  stunTimeoutId   = null;
  stunCountdownId = null;
  elEnemyArea.classList.remove("stunned");
}

// --- 単体敵の攻撃 ---
function enemyTick(enemy) {
  state.playerHp = Math.max(0, state.playerHp - enemy.atk);
  elPlayerHpBar.style.width = (state.playerHp / state.playerMaxHp * 100) + "%";
  elPlayerHpDisplay.textContent = `${state.playerHp} / ${state.playerMaxHp}`;
  addLog(`${enemy.name} の攻撃！ ${enemy.atk} ダメージを受けた`);

  if (state.playerHp <= 0) {
    clearStun();
    stopEnemyAttack();
    clearInterval(attackIntervalId);
    attackIntervalId = null;
    _lastInterval = -1;
    state.totalDeaths++;
    checkAchievements();
    addLog("倒れた…マップ1からやり直し！");
    showDeathOverlay(() => {
      if (state.pendingBatch || state.batchFromTicket) {
        state.consumables['batch_ticket'] = (state.consumables['batch_ticket'] || 0) + 1;
        state.pendingBatch = false;
        state.batchFromTicket = false;
        addSystemLog("🎫 一括チケットを返却しました");
        updateConsumableDisplay();
      }
      state.playerHp    = state.playerMaxHp;
      state.mapIndex    = 0;
      state.stageInMap  = 0;
      state.multiEnemies = null;
      elEnemyArea.classList.remove("multi-mode");
      spawnEnemy();
      updateStatsDisplay();
    });
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
    clearStun();
    stopEnemyAttack();
    clearInterval(attackIntervalId);
    attackIntervalId = null;
    _lastInterval = -1;
    state.totalDeaths++;
    checkAchievements();
    addLog("倒れた…マップ1からやり直し！");
    showDeathOverlay(() => {
      if (state.pendingBatch || state.batchFromTicket) {
        state.consumables['batch_ticket'] = (state.consumables['batch_ticket'] || 0) + 1;
        state.pendingBatch = false;
        state.batchFromTicket = false;
        addSystemLog("🎫 一括チケットを返却しました");
        updateConsumableDisplay();
      }
      state.playerHp    = state.playerMaxHp;
      state.mapIndex    = 0;
      state.stageInMap  = 0;
      state.multiEnemies = null;
      elEnemyArea.classList.remove("multi-mode");
      spawnEnemy();
      updateStatsDisplay();
    });
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

// --- マップカルーセル更新 ---
const MC_CONTAINER_W = 220; // #map-carousel の幅
const MC_SIDE_W = 75;       // .mc-side の幅
const MC_CUR_W  = 110;      // #mc-cur の幅
// trackをこの位置にするとmc-curがコンテナ中央に来る
// mc-curの左端はtrack内でMC_SIDE_W=75px位置、中心は75+55=130px
// コンテナ中心は110px → translateX = 110 - 130 = -20px
const MC_OFFSET = (MC_CONTAINER_W / 2) - MC_SIDE_W - (MC_CUR_W / 2); // = -20

function updateMapCarousel() {
  const dir = _mcSlideDir;
  _mcSlideDir = 0;

  const prev = MAP_DEFS[state.mapIndex - 1];
  const next = MAP_DEFS[state.mapIndex + 1];
  elMcPrev.textContent = prev ? prev.name : "";
  elMcNext.textContent = next ? next.name : "";

  if (dir !== 0) {
    // 開始位置: dir=1なら右側ずれ(次マップが右から来る), dir=-1なら左側ずれ
    elMcTrack.classList.remove("mc-slide");
    // dir=1: 右から来る → トラックを右(+)にずらして左へスライドイン
    // dir=-1: 左から来る → トラックを左(-)にずらして右へスライドイン
    elMcTrack.style.transform = `translateX(${MC_OFFSET + dir * MC_CUR_W}px)`;
    // reflow 強制
    void elMcTrack.offsetWidth;
    elMcTrack.classList.add("mc-slide");
    elMcTrack.style.transform = `translateX(${MC_OFFSET}px)`;
    elMcTrack.addEventListener("transitionend", () => {
      elMcTrack.classList.remove("mc-slide");
    }, { once: true });
  } else {
    elMcTrack.classList.remove("mc-slide");
    elMcTrack.style.transform = `translateX(${MC_OFFSET}px)`;
  }
}

// --- ステージ表示更新 ---
function updateStageDisplay() {
  const map = MAP_DEFS[state.mapIndex];
  elMapName.textContent = map.name;

  // 枠内ステージ背景
  if (map.bg) {
    elStageBg.style.backgroundImage = `url('${map.bg}')`;
    elStageBg.style.display = "block";
  } else {
    elStageBg.style.backgroundImage = "";
    elStageBg.style.display = "none";
  }

  // 枠外ページ背景（PAGE_BG が未設定の場合のみマップ別設定を反映）
  if (!PAGE_BG) {
    if (map.pageBg) {
      document.body.style.backgroundImage = `url('${map.pageBg}')`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
    } else {
      document.body.style.backgroundImage = "";
    }
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

  updateMapCarousel();
}

// --- 一括討伐モード開始 ---
function spawnMultiEnemies() {
  state.multiEnemies = [];
  const def = MAP_DEFS[state.mapIndex];
  let rareSpawned = false;
  for (let si = 0; si < 10; si++) {
    let e;
    if (si < 9 && !rareSpawned && def.rare && Math.random() < (def.rare.rate ?? 0.04)) {
      e = makeRareEnemy(state.mapIndex, si);
      rareSpawned = true;
    } else {
      e = makeEnemy(state.mapIndex, si);
    }
    state.multiEnemies.push({ ...e, currentHp: e.hp });
  }

  state.multiCurrentIdx = 0;
  _lastInterval = -1; // 攻撃速度を3倍に切り替えるため強制リセット
  elEnemyArea.classList.add("multi-mode");
  renderMultiGrid();
  updateMultiStats();
  updateStageDisplay();

  // 一括モードの敵攻撃インターバル（2000ms ごとに全員で攻撃）
  clearStun();
  clearInterval(enemyAttackIntervalId);
  enemyAttackIntervalId = setInterval(multiEnemyTick, 2000);

  addLog(`★ 一括討伐モード！ ${state.multiEnemies.length}体が一斉出現！`);
  addSystemLog(`${MAP_DEFS[state.mapIndex].name}: ボス100回討伐達成！`);
  updateConsumableDisplay();
  // 攻撃速度を一括モード（÷3）に確実にリセット
  invalidateStats();
  resetAttackInterval(computePlayerStats());
}

function updateMultiStats() {
  if (!state.multiEnemies) return;
  const idx = state.multiCurrentIdx ?? 0;
  const e   = state.multiEnemies[idx];
  if (!e) return;
  const remaining = state.multiEnemies.filter(en => en.currentHp > 0).length;
  const isBoss    = idx === 9;
  elEnemyName.textContent       = `${e.name}（残り ${remaining}体）`;
  elHpBar.style.width           = Math.max(0, e.currentHp / e.hp * 100) + "%";
  elEnemyHp.textContent         = Math.max(0, e.currentHp);
  elEnemyMaxHp.textContent      = e.hp;
  elEnemyAtkDisplay.textContent = `ATK ${e.atk}  0.5/s`;
  const label = document.getElementById("multi-progress-label");
  if (label) label.textContent = `${idx + 1} / ${state.multiEnemies.length}`;
  const card = document.getElementById(`multi-card-${idx}`);
  if (card) card.classList.toggle("boss-last", isBoss && remaining === 1);
}

const MULTI_CARD_W = 110;
const MULTI_CARD_GAP = 6;

function renderMultiGrid() {
  const enemies = state.multiEnemies || [];
  const idx = state.multiCurrentIdx ?? 0;
  const total = enemies.length;
  elMultiGrid.innerHTML =
    `<div class="enemy-sweep-row" id="multi-sweep-row">${enemies.map((e, i) => {
      const isBoss = i === 9;
      const isCurrent = i === idx;
      return `<div class="multi-enemy-card${isBoss?" boss-card":""}${isCurrent?" current":""}" id="multi-card-${i}">
        <img src="${e.img}" class="multi-enemy-img">
        <div class="mini-hp-bar-wrap" style="width:100%"><div class="mini-hp-bar" id="mini-hp-${i}"></div></div>
      </div>`;
    }).join("")}</div>
    <div class="multi-progress" id="multi-progress-label">${idx + 1} / ${total}</div>`;
  requestAnimationFrame(() => centerCurrentCard(false));
}

function centerCurrentCard(animate) {
  const card = document.getElementById(`multi-card-${state.multiCurrentIdx ?? 0}`);
  if (!card) return;
  card.scrollIntoView({ behavior: animate ? "smooth" : "instant", inline: "center", block: "nearest" });
}

// 死亡後に次の敵へ進む
function advanceToNext(mapSnap) {
  if (!state.multiEnemies || state.mapIndex !== mapSnap) return;
  state.multiCurrentIdx++;
  if (state.multiCurrentIdx >= state.multiEnemies.length) {
    checkMultiComplete();
    return;
  }
  centerCurrentCard(true);
  const nextCard = document.getElementById(`multi-card-${state.multiCurrentIdx}`);
  if (nextCard) nextCard.classList.add("current");
  updateMultiGrid();
  updateMultiStats();
}


function updateMultiGrid() {
  if (!state.multiEnemies) return;
  const idx = state.multiCurrentIdx ?? 0;
  const e   = state.multiEnemies[idx];
  const bar = document.getElementById(`mini-hp-${idx}`);
  if (e && bar) bar.style.width = Math.max(0, e.currentHp / e.hp * 100) + "%";
  updateMultiStats();
}

function checkMultiComplete() {
  if (!state.multiEnemies) return;
  if (state.multiEnemies.some(e => e.currentHp > 0)) return;
  stopEnemyAttack();
  clearInterval(attackIntervalId);
  attackIntervalId = null;
  const hadFinal = state.multiEnemies.some(e => e.isFinal && e.isBoss);
  state.multiEnemies = null;
  state.batchFromTicket = false;
  _lastInterval = -1; // 通常速度に戻すため強制リセット
  elEnemyArea.classList.remove("multi-mode");
  elMultiGrid.innerHTML = "";
  if (hadFinal) { gameClear(); return; }
  state.stageInMap = 0;
  state.mapIndex++;
  if (state.mapIndex >= MAP_DEFS.length) { gameClear(); return; }
  state.mapsCleared++;
  addSystemLog(`★ マップ一括クリア！ 「${MAP_DEFS[state.mapIndex].name}」へ！`);
  checkAchievements();
  updateConsumableDisplay();
  showMapClearOverlay(MAP_DEFS[state.mapIndex].name);
}

// --- デス演出 ---
function showDeathOverlay(onDone) {
  const overlay = document.getElementById('death-overlay');
  const container = document.getElementById('death-particles');
  const symbols = ['×', '✕', '♡', '…', '･'];
  const colors  = ['#e86080', '#c04060', '#a03050', '#804060', '#603050'];
  container.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('span');
    p.className = 'dcp';
    p.textContent = symbols[i % symbols.length];
    p.style.left            = (5 + Math.random() * 90) + '%';
    p.style.top             = (5 + Math.random() * 85) + '%';
    p.style.color           = colors[Math.floor(Math.random() * colors.length)];
    p.style.fontSize        = (0.5 + Math.random() * 0.7) + 'rem';
    p.style.animationDelay    = (Math.random() * 1.5).toFixed(2) + 's';
    p.style.animationDuration = (1.2 + Math.random() * 1.0).toFixed(2) + 's';
    container.appendChild(p);
  }
  overlay.classList.remove('active', 'exit');
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('active'));
  setTimeout(() => {
    overlay.classList.add('exit');
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('active', 'exit');
      onDone();
    }, 320);
  }, 1400);
}

// --- マップクリア演出 ---
function showMapClearOverlay(newMapName) {
  const overlay = document.getElementById('map-clear-overlay');
  const nameEl  = document.getElementById('map-clear-mapname');
  nameEl.textContent = `「${newMapName}」`;

  // パーティクル生成
  const container = document.getElementById('map-clear-particles');
  const symbols   = ['★', '✦', '♪', '◆', '●', '✿'];
  const colors    = ['#ff80aa','#ffa040','#ffe040','#80d0a0','#80b0ff','#d080ff'];
  container.innerHTML = '';
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('span');
    p.className = 'mcp';
    p.textContent = symbols[i % symbols.length];
    p.style.left            = (5 + Math.random() * 90) + '%';
    p.style.top             = (10 + Math.random() * 80) + '%';
    p.style.color           = colors[Math.floor(Math.random() * colors.length)];
    p.style.fontSize        = (0.55 + Math.random() * 0.75) + 'rem';
    p.style.animationDelay    = (Math.random() * 2).toFixed(2) + 's';
    p.style.animationDuration = (1.4 + Math.random() * 1.2).toFixed(2) + 's';
    container.appendChild(p);
  }

  // 表示 → アニメーション開始
  overlay.classList.remove('active', 'exit');
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('active'));

  // 自動クローズ
  setTimeout(() => {
    overlay.classList.add('exit');
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('active', 'exit');
      _mcSlideDir = 1;
      spawnEnemy();
      updateStatsDisplay();
    }, 210);
  }, 1100);
}

// --- 通常の敵をセット ---
function spawnEnemy() {
  if (state.cleared) return;

  // stageInMap=0 かつ一括モード対象マップ or チケット発動中なら全員召喚
  if (state.stageInMap === 0 && (isMultiMode(state.mapIndex) || state.pendingBatch)) {
    if (state.pendingBatch) {
      state.consumables['batch_ticket'] = (state.consumables['batch_ticket'] || 0) - 1;
      state.pendingBatch = false;
      state.batchFromTicket = true;
      addSystemLog("🎫 一括チケット発動！一括討伐モード開始！");
      updateConsumableDisplay();
    }
    spawnMultiEnemies();
    return;
  }

  // 通常モード: 一括モード表示を解除
  state.multiEnemies = null;
  elEnemyArea.classList.remove("multi-mode");
  elMultiGrid.innerHTML = "";

  const def = MAP_DEFS[state.mapIndex];
  const spawnRare = state.stageInMap !== 9 && def.rare
    && Math.random() < (def.rare.rate ?? 0.04);
  const enemy = spawnRare
    ? makeRareEnemy(state.mapIndex, state.stageInMap)
    : makeEnemy(state.mapIndex, state.stageInMap);
  state.currentEnemy = enemy;
  state.enemyHp      = enemy.hp;
  state.enemyMaxHp   = enemy.hp;

  elEnemyName.textContent       = enemy.name;
  elEnemyImg.src                = enemy.img;
  const evaStr = enemy.evasion > 0 ? `  回避率 ${Math.round(enemy.evasion * 100)}%` : "";
  elEnemyAtkDisplay.textContent = `ATK ${enemy.atk}  ${(1000 / enemy.atkInterval).toFixed(1)}/s${evaStr}`;
  updateStageDisplay();
  updateHpDisplay();

  if (enemy.isRare)  addLog(`★ RARE: ${enemy.name} が現れた！`);
  else if (enemy.isBoss) addLog(`★ BOSS: ${enemy.name} が現れた！`);
  else               addLog(`${enemy.name} が現れた！`);

  clearStun();
  clearInterval(enemyAttackIntervalId);
  enemyAttackIntervalId = setInterval(() => enemyTick(enemy), enemy.atkInterval);
  updateConsumableDisplay();
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
  if (!target || target.classList.contains("enemy-hit")) return;
  target.classList.add("enemy-hit");
  target.addEventListener("animationend", () => target.classList.remove("enemy-hit"), { once: true });
}

// --- 単体敵討伐の共通処理（tick / 消費アイテム 共用）---
function _finishEnemyKill() {
  if (state.cleared) return;
  stopEnemyAttack();
  const defeatedEnemy = state.currentEnemy;
  const earned = Math.floor(defeatedEnemy.gold * (0.75 + Math.random() * 0.5));
  state.gold += earned;
  state.totalGoldEarned += earned;
  if (defeatedEnemy.isRare) state.rareKills++;
  addLog(`${defeatedEnemy.name} を倒した！ +${fmt(earned)}G`);
  playDefeatSound();
  updateShopDisplay();
  rollDrops(defeatedEnemy);
  recordKill(state.mapIndex, defeatedEnemy.name);
  checkAchievements();

  if (defeatedEnemy.isFinal && defeatedEnemy.isBoss) { gameClear(); return; }

  state.stageInMap++;
  if (state.stageInMap >= 10) {
    state.stageInMap = 0;
    state.mapIndex++;
    if (state.mapIndex >= MAP_DEFS.length) { gameClear(); return; }
    state.mapsCleared++;
    addSystemLog(`★ マップクリア！ 「${MAP_DEFS[state.mapIndex].name}」へ！`);
    checkAchievements();
    clearInterval(attackIntervalId);
    attackIntervalId = null;
    _lastInterval = -1;
    showMapClearOverlay(MAP_DEFS[state.mapIndex].name);
    return;
  }
  spawnEnemy();
}

// --- プレイヤー攻撃 ---
function tick() {
  if (state.cleared || (!state.currentEnemy && !state.multiEnemies)) return;
  const s = computePlayerStats();
  if (state.multiEnemies !== null) { tickMulti(s); return; }

  // 通常単体：実効命中率 = 命中率 - 敵回避率
  const rand = Math.random();
  const effectiveHit = Math.max(0, s.hitRate - state.currentEnemy.evasion);
  if (rand > effectiveHit) {
    if (state.currentEnemy.evasion > 0 && rand <= s.hitRate) {
      addLog("ミス！");
      showDamageNumber("MISS", "miss");
    } else {
      addLog("ミス！");
      showDamageNumber("MISS", "miss");
    }
    return;
  }

  let dmg = s.totalAtk;
  let suffix = "";
  let dmgType = null;
  const effectiveCrit = Math.max(0, s.critChance - state.currentEnemy.critRes);
  if (Math.random() < effectiveCrit) {
    dmg = Math.floor(dmg * 1.5);
    suffix  = " ★クリティカル！";
    dmgType = "crit";
  }

  state.enemyHp -= dmg;
  showDamageNumber(dmg, dmgType);
  flashEnemyHit();
  addLog(`攻撃！ ${dmg} ダメージ（残HP: ${Math.max(0, state.enemyHp)}）${suffix}`);
  updateHpDisplay();

  if (state.enemyHp <= 0) _finishEnemyKill();
}

// --- 一括討伐モードのプレイヤー攻撃 ---
function tickMulti(s) {
  if (!state.multiEnemies) return;
  const idx = state.multiCurrentIdx ?? 0;
  const e   = state.multiEnemies[idx];
  if (!e || e.currentHp <= 0) return;

  if (e.isBoss) {
    // ボス：通常の攻撃判定（命中・ダメージ・クリティカル）
    const rand = Math.random();
    const effectiveHit = Math.max(0, s.hitRate - (e.evasion || 0));
    if (rand > effectiveHit) {
      if ((e.evasion || 0) > 0 && rand <= s.hitRate) {
        addLog("ミス！");
        showDamageNumber("MISS", "miss");
      } else {
        addLog("ミス！");
        showDamageNumber("MISS", "miss");
      }
      return;
    }
    let dmg = s.totalAtk;
    let dmgType = null;
    let suffix = "";
    if (Math.random() < Math.max(0, s.critChance - (e.critRes || 0))) {
      dmg = Math.floor(dmg * 1.5);
      dmgType = "crit";
      suffix = " ★クリティカル！";
    }
    e.currentHp = Math.max(0, e.currentHp - dmg);
    showDamageNumber(dmg, dmgType);
    flashEnemyHit();
    addLog(`攻撃！ ${dmg} ダメージ（残HP: ${e.currentHp}）${suffix}`);
    updateMultiGrid();
    if (e.currentHp > 0) return;
  } else {
    // 通常敵：必中・一撃必殺
    e.currentHp = 0;
    showDamageNumber("KILL", "crit");
    flashEnemyHit();
  }

  // 討伐確定
  e._counted = true;
  const earned = Math.floor(e.gold * (0.75 + Math.random() * 0.5));
  state.gold += earned;
  state.totalGoldEarned += earned;
  if (e.isRare) state.rareKills++;
  rollDrops(e);
  recordKill(state.mapIndex, e.name);
  checkAchievements();
  addLog(`${e.name} 撃破！ +${fmt(earned)}G`);
  playDefeatSound();
  updateShopDisplay();

  const deadCard = document.getElementById(`multi-card-${idx}`);
  if (deadCard) { deadCard.classList.add("dead"); deadCard.classList.remove("current"); }
  const mapSnap = state.mapIndex;
  setTimeout(() => advanceToNext(mapSnap), 180);
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

  invalidateStats();
  updateStatsDisplay();
}

// --- ゲームクリア ---
function gameClear() {
  state.cleared = true;
  checkAchievements();
  clearStun();
  stopEnemyAttack();
  clearInterval(attackIntervalId);
  attackIntervalId = null;
  _lastInterval = -1;
  document.getElementById('map-carousel').classList.add('gc-cleared');
  document.getElementById('map-icon').style.display = 'none';
  elMapName.textContent = "★ GAME CLEAR ★";
  elMcPrev.textContent = "";
  elMcNext.textContent = "";
  elStageGrid.querySelectorAll(".stage-cell").forEach(c => {
    c.classList.remove("done", "current", "multi-active");
    c.classList.add("done");
    const charEl = c.querySelector(".stage-char");
    if (charEl) charEl.style.visibility = "hidden";
  });
  addLog("魔王を倒した！ 世界に平和が訪れた！");
  addSystemLog("★★★ ゲームクリア！ おめでとうございます！ ★★★");
  _showClearPanel();
}

function _showClearPanel() {
  const panel = document.getElementById('clear-panel');
  if (!panel) return;
  const cp = state.clearPoints;
  panel.style.display = 'flex';
  panel.innerHTML = `
    <div class="ngp-title">🏆 クリア${cp > 0 ? ` ${cp + 1}周目` : ''}達成！</div>
    <div class="ngp-pts">クリアポイント <span class="ngp-pts-val">${cp}</span> → <span class="ngp-pts-new">${cp + 1}</span></div>
    <button class="ngp-btn" onclick="startNewGamePlus()">🔄 New Game+</button>
    <div class="ngp-hint">図鑑・アイテムTier・実績を引き継ぎ<br>最初からスタート</div>
  `;
}

function startNewGamePlus() {
  if (!state.cleared) return;
  const newCp = state.clearPoints + 1;
  // アイテム個数をTier閾値にスナップ（個数はリセット、Tierボーナスのみ維持）
  const snappedInventory = {};
  for (const [id, count] of Object.entries(state.inventory)) {
    const tier = getItemTier(count);
    snappedInventory[id] = BONUS_THRESHOLDS[tier - 1] ?? 0;
  }
  // 引き継ぐデータを保存
  const carry = {
    inventory:       snappedInventory,
    itemsObtained:   state.itemsObtained,
    monsterKills:    state.monsterKills,
    achievements:    state.achievements,
    clearPoints:     newCp,
    totalGoldEarned: state.totalGoldEarned,
    totalRefines:    state.totalRefines,
    totalDeaths:     state.totalDeaths,
    totalShopBuys:   state.totalShopBuys,
    rareKills:       state.rareKills,
    mapsCleared:     state.mapsCleared,
  };
  // state をリセット
  Object.assign(state, {
    mapIndex:      0,
    stageInMap:    0,
    attack:        1,
    gold:          0,
    enemyHp:       0,
    enemyMaxHp:    0,
    playerHp:      50,
    playerMaxHp:   50,
    cleared:       false,
    shopLevels:    { vit: 0, str: 0, int: 0, agi: 0, dex: 0, luk: 0 },
    currentEnemy:  null,
    multiEnemies:  null,
    refine:        null,
    consumables:   {},
    pendingBatch:  false,
    batchFromTicket: false,
  });
  Object.assign(state, carry);
  saveData();
  location.reload();
}

// --- 数値フォーマット（3桁カンマ）---
function fmt(n) { return Math.floor(n).toLocaleString('ja-JP'); }

// --- ショップ ---
function updateShopDisplay() {
  elGold.textContent = fmt(state.gold);
  const hc = healCost();
  elHealCost.textContent = fmt(hc);
  elBtnHeal.disabled = state.gold < hc || state.playerHp >= state.playerMaxHp;
  for (const key of Object.keys(SHOP_DEFS)) {
    const cost1  = shopStatCost(key);
    const cost10 = shopStatCostN(key, 10);
    document.getElementById(`shop-${key}-cost`).textContent    = fmt(cost1);
    document.getElementById(`shop-${key}-cost-10`).textContent = fmt(cost10);
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
  state.shopLevels[key] = (state.shopLevels[key] || 0) + n;
  state.totalShopBuys += n;
  updateShopDisplay();
  invalidateStats();
  updateStatsDisplay();
  checkAchievements();
  const def   = SHOP_DEFS[key];
  const total = state.shopLevels[key] * def.amount;
  addSystemLog(`${key.toUpperCase()}×${n}強化！ ${def.stat.toUpperCase()}が合計+${total} (次回: ${fmt(shopStatCost(key))}G)`);
}

// --- 精製 ---
let refineIntervalId = null;
const REFINE_TICK_MS = 100;

function canRefine(recipe) {
  return recipe.inputs.every(inp => (state.inventory[inp.itemId] || 0) >= inp.count);
}

function maxRefineCount(recipe) {
  return recipe.inputs.reduce((min, inp) => {
    const have = state.inventory[inp.itemId] || 0;
    return Math.min(min, Math.floor(have / inp.count));
  }, Infinity);
}

function consumeRefineInputs(recipe) {
  recipe.inputs.forEach(inp => {
    state.inventory[inp.itemId] = (state.inventory[inp.itemId] || 0) - inp.count;
  });
}

function returnRefineInputs(recipe) {
  recipe.inputs.forEach(inp => {
    state.inventory[inp.itemId] = (state.inventory[inp.itemId] || 0) + inp.count;
  });
}

function startRefine(recipeId, count) {
  if (state.refine) return;
  const recipe = REFINE_RECIPES.find(r => r.id === recipeId);
  if (!recipe || !canRefine(recipe)) return;
  const actualCount = count === -1 ? -1 : Math.min(count, maxRefineCount(recipe));
  consumeRefineInputs(recipe);
  state.refine = {
    recipeId,
    elapsed:   0,
    duration:  recipe.time * 1000,
    countLeft: actualCount, // -1 = 無限
  };
  invalidateStats();
  clearInterval(refineIntervalId);
  refineIntervalId = setInterval(refineTick, REFINE_TICK_MS);
  updateRefineDisplay();
  updateInventoryDisplay();
}

function cancelRefine() {
  if (!state.refine) return;
  const recipe = REFINE_RECIPES.find(r => r.id === state.refine.recipeId);
  if (recipe) returnRefineInputs(recipe);
  clearInterval(refineIntervalId);
  refineIntervalId = null;
  state.refine = null;
  invalidateStats();
  updateRefineDisplay();
  updateInventoryDisplay();
  updateStatsDisplay();
}

function refineTick() {
  if (!state.refine) { clearInterval(refineIntervalId); return; }
  state.refine.elapsed += REFINE_TICK_MS;
  updateRefineProgress();
  if (state.refine.elapsed >= state.refine.duration) {
    completeOneRefine();
  }
}

function completeOneRefine() {
  const recipe = REFINE_RECIPES.find(r => r.id === state.refine.recipeId);
  if (!recipe) { state.refine = null; return; }

  // 成果物を追加
  const outId = recipe.output.itemId;
  const prevObtained = state.itemsObtained[outId] || 0;
  state.itemsObtained[outId] = prevObtained + recipe.output.count;
  state.inventory[outId] = (state.inventory[outId] || 0) + recipe.output.count;
  const newObtained = state.itemsObtained[outId];
  const prevTier = getItemTier(prevObtained);
  const newTier  = getItemTier(newObtained);
  addSystemLog(`${recipe.name} 完成！ ${ITEM_MAP[outId]?.name ?? outId} 累計×${newObtained}`);
  if (newTier > prevTier) addSystemLog(`★ ${ITEM_MAP[outId]?.name} Tier${newTier} 解放！`);
  state.totalRefines++;
  checkAchievements();
  invalidateStats();
  updateStatsDisplay();
  updateInventoryDisplay();

  // 次の精製へ
  const cl = state.refine.countLeft;
  const next = cl === -1 ? -1 : cl - 1;

  if (next !== 0 && canRefine(recipe)) {
    consumeRefineInputs(recipe);
    state.refine.elapsed   = 0;
    state.refine.countLeft = next;
    updateRefineDisplay();
    updateInventoryDisplay();
  } else {
    if (next !== 0) {
      addSystemLog("素材不足で精製が停止しました");
      notifyRefineTab('warn');
    } else {
      addSystemLog(`${recipe.name} の精製がすべて完了しました`);
      notifyRefineTab('success');
    }
    clearInterval(refineIntervalId);
    refineIntervalId = null;
    state.refine = null;
    updateRefineDisplay();
    updateInventoryDisplay();
  }
}

function updateRefineProgress() {
  if (!state.refine) return;
  const pct = Math.min(100, (state.refine.elapsed / state.refine.duration) * 100);
  const remain = ((state.refine.duration - state.refine.elapsed) / 1000).toFixed(1);
  const bar  = document.querySelector(".refine-bar");
  const time = document.querySelector(".refine-time");
  if (bar)  bar.style.width    = pct + "%";
  if (time) time.textContent   = remain + "s";
}

function updateRefineDisplay() {
  const el = document.getElementById("refine-content");
  if (!el) return;

  let html = "";

  // 精製中エリア
  if (state.refine) {
    const recipe  = REFINE_RECIPES.find(r => r.id === state.refine.recipeId);
    const pct     = Math.min(100, (state.refine.elapsed / state.refine.duration) * 100);
    const remain  = ((state.refine.duration - state.refine.elapsed) / 1000).toFixed(1);
    const clLabel = state.refine.countLeft === -1 ? "∞" : `残り ${state.refine.countLeft}回`;
    html += `
      <div class="refine-active">
        <div class="refine-active-info">
          <span class="refine-active-name">${recipe?.name ?? ""}</span>
          <span class="refine-active-count">${clLabel}</span>
          <button class="refine-cancel-btn" onclick="cancelRefine()">✕ キャンセル</button>
        </div>
        <div class="refine-progress-wrap"><div class="refine-bar" style="width:${pct}%"></div></div>
        <div class="refine-time">${remain}s</div>
      </div>`;
  }

  // レシピ一覧
  REFINE_RECIPES.forEach(recipe => {
    const isActive = !!state.refine;
    const ok = !isActive && canRefine(recipe);

    const chipsHtml = recipe.inputs.map(inp => {
      const have   = state.inventory[inp.itemId] || 0;
      const enough = have >= inp.count;
      const name   = ITEM_MAP[inp.itemId]?.name ?? inp.itemId;
      return `<span class="refine-chip${enough ? "" : " missing"}">${name}×${inp.count}<span class="refine-chip-have">(${have})</span></span>`;
    }).join("");

    const outName = ITEM_MAP[recipe.output.itemId]?.name ?? recipe.output.itemId;
    html += `
      <div class="refine-recipe-row${isActive ? " refining" : ""}">
        <div class="refine-recipe-info">
          <div class="refine-recipe-name">${recipe.name}</div>
          <div class="refine-ingredients">${chipsHtml}</div>
          <div class="refine-output">→ ${outName} ×${recipe.output.count}　${recipe.time}秒</div>
        </div>
        <div class="refine-btn-group">
          <button class="refine-btn" ${ok ? "" : "disabled"} onclick="startRefine('${recipe.id}', 1)">×1</button>
          <button class="refine-btn" ${ok ? "" : "disabled"} onclick="startRefine('${recipe.id}', 10)">×10</button>
          <button class="refine-btn" ${ok ? "" : "disabled"} onclick="startRefine('${recipe.id}', -1)">∞</button>
        </div>
      </div>`;
  });

  el.innerHTML = html;
}

// --- 音 ---
const audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);
let soundMuted  = false;
let soundVolume = 0.5;
masterGain.gain.value = soundVolume;

// ブラウザの自動再生ポリシー対策：ユーザー操作時に AudioContext を再開
function resumeAudioCtx() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
document.addEventListener('click',     resumeAudioCtx);
document.addEventListener('keydown',   resumeAudioCtx);
document.addEventListener('touchstart', resumeAudioCtx);
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
  document.getElementById("sound-ctrl").classList.toggle("muted", soundMuted);
}

function setVolume(val) {
  soundVolume = Math.max(0, Math.min(1, val));
  if (!soundMuted) masterGain.gain.value = soundVolume;
  const slider = document.getElementById("volume-slider");
  if (slider) slider.value = Math.round(soundVolume * 100);
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

function switchTab(paneId) {
  document.querySelectorAll('#panel-tabs .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === paneId);
  });
  document.querySelectorAll('#panel-content .tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === paneId);
  });
  // 精製タブを開いたらバッジをクリア
  if (paneId === 'pane-refine') clearRefineBadge();
}

function notifyRefineTab(type) { // type: 'success' | 'warn'
  const btn   = document.querySelector('[data-target="pane-refine"]');
  const badge = document.getElementById('refine-badge');
  if (!btn || !badge) return;
  // アクティブタブなら通知不要
  if (btn.classList.contains('active')) return;
  // バッジ表示
  badge.className = `tab-badge show ${type}`;
  // フラッシュアニメーション（重複リセット）
  btn.classList.remove('flash-success', 'flash-warn');
  void btn.offsetWidth;
  btn.classList.add(type === 'success' ? 'flash-success' : 'flash-warn');
}

function clearRefineBadge() {
  const badge = document.getElementById('refine-badge');
  if (badge) badge.className = 'tab-badge';
}

function togglePanel(id) {} // 互換スタブ（タブ化により不要）

// --- 実績 ---
let _toastTimer = null;

function checkAchievements() {
  let stats = null;
  try { stats = computePlayerStats(); } catch(e) {}
  const newUnlocks = [];
  for (const ach of ACHIEVEMENTS) {
    if (state.achievements.includes(ach.id)) continue;
    try {
      if (ach.check(state, stats)) {
        state.achievements.push(ach.id);
        newUnlocks.push(ach);
      }
    } catch(e) {}
  }
  if (newUnlocks.length > 0) {
    showAchievementToast(newUnlocks[newUnlocks.length - 1]);
  }
}

function showAchievementToast(ach) {
  const toast = document.getElementById('achievement-toast');
  document.getElementById('achievement-toast-icon').textContent = ach.icon + ' ';
  document.getElementById('achievement-toast-name').textContent = ach.name;
  toast.classList.remove('show');
  clearTimeout(_toastTimer);
  setTimeout(() => toast.classList.add('show'), 10);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function openAchievements() {
  const el = document.getElementById('achievement-content');
  const stats = computePlayerStats();
  const unlocked = new Set(state.achievements);
  let count = 0;
  el.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'achievement-grid';
  for (const ach of ACHIEVEMENTS) {
    const isUnlocked = unlocked.has(ach.id);
    if (isUnlocked) count++;
    const card = document.createElement('div');
    card.className = 'achievement-card' + (isUnlocked ? '' : ' locked');
    card.innerHTML = `
      <div class="achievement-icon">${ach.icon}</div>
      <div>
        <div class="achievement-name">${isUnlocked ? ach.name : '???'}</div>
        <div class="achievement-desc">${isUnlocked ? ach.desc : '条件を満たすと解除'}</div>
      </div>`;
    grid.appendChild(card);
  }
  el.appendChild(grid);
  document.getElementById('achievement-progress').textContent =
    `${count} / ${ACHIEVEMENTS.length}`;
  document.getElementById('modal-achievement').classList.add('open');
}

function closeAchievements() {
  document.getElementById('modal-achievement').classList.remove('open');
}

function toggleMute() {
  soundMuted = !soundMuted;
  masterGain.gain.value = soundMuted ? 0 : soundVolume;
  updateMuteBtn();
}

// --- ステータス計算 ---
function computePlayerStats() {
  if (_cachedStats) return _cachedStats;
  const raw = { str: 0, vit: 0, int: 0, dex: 0, agi: 0, luk: 0 };

  // 所持・累計のどちらかがあるアイテムを列挙
  const seenItems = new Set([
    ...Object.keys(state.inventory).filter(id => (state.inventory[id] || 0) > 0),
    ...Object.keys(state.itemsObtained).filter(id => (state.itemsObtained[id] || 0) > 0),
  ]);
  for (const itemId of seenItems) {
    const item = ITEM_MAP[itemId];
    if (!item) continue;
    const held     = state.inventory[itemId]     || 0;
    const obtained = state.itemsObtained[itemId] || held; // 旧セーブ互換
    // 基本ステータス: 現在所持している場合のみ
    if (held > 0) {
      for (const s of Object.keys(raw)) raw[s] += item[s];
    }
    // ボーナス: 累計取得数で判定
    if (item.bonus) {
      item.bonus.forEach((bonusTier, i) => {
        if (obtained >= BONUS_THRESHOLDS[i]) {
          for (const s of Object.keys(raw)) raw[s] += (bonusTier[s] || 0);
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

  _cachedStats = {
    ...raw,
    totalAtk:       state.attack + Math.floor(raw.str * 0.8) + Math.floor(raw.int * 0.5),
    playerMaxHp:    50 + raw.vit * 5,
    hitRate:        0.90 + raw.dex * 0.003 + raw.int * 0.001,
    attackInterval: Math.max(300, 1000 - raw.agi * 8),
    critChance:     raw.luk * 0.02 + raw.int * 0.005,
  };
  return _cachedStats;
}

// --- 可変攻撃インターバル ---
let attackIntervalId = null;
let _lastInterval = -1;
let _cachedStats = null;

function invalidateStats() {
  _cachedStats = null;
}

function resetAttackInterval(s) {
  const interval = state.multiEnemies
    ? Math.max(100, Math.floor(s.attackInterval / 3))
    : s.attackInterval;
  if (interval === _lastInterval && attackIntervalId !== null) return;
  _lastInterval = interval;
  clearInterval(attackIntervalId);
  attackIntervalId = setInterval(tick, interval);
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

  // クリアポイント表示
  const cpRow = document.getElementById('clear-points-row');
  if (cpRow) {
    if (state.clearPoints > 0) {
      cpRow.style.display = '';
      cpRow.innerHTML = `<span class="cp-label">🏆 周回</span><span class="cp-val">${state.clearPoints}</span>`;
    } else {
      cpRow.style.display = 'none';
    }
  }

  resetAttackInterval(s);
}

function calcItemEffect(item, obtained) {
  const count = obtained; // 累計取得数でボーナス判定
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
    .filter(item => (state.itemsObtained[item.id] || 0) > 0)
    .sort((a, b) => {
      const aMax = (state.itemsObtained[a.id] || 0) >= 999;
      const bMax = (state.itemsObtained[b.id] || 0) >= 999;
      return aMax - bMax; // MAX は下へ
    })
    .map(item => {
      const held     = state.inventory[item.id]     || 0;
      const obtained = state.itemsObtained[item.id] || held;
      const tier     = getItemTier(obtained);
      const next     = BONUS_THRESHOLDS[tier];

      const tierBadge = `<span class="tier-badge tier-${tier}">${tier > 0 ? TIER_LABELS[tier] : "T0"}</span>`;
      const nextHint  = next !== undefined
        ? `<span class="inv-next">→${next}</span>`
        : `<span class="inv-next max">MAX</span>`;

      const curEff  = calcItemEffect(item, obtained);
      const curText = statStr(curEff);
      let nextText  = "";
      if (next !== undefined && item.bonus && item.bonus[tier]) {
        nextText = `<span class="inv-next-bonus">次(${next}個): +${statStr(item.bonus[tier])}</span>`;
      }

      const obtainedLabel = `<span class="inv-count">所持 ${held}</span><span class="inv-obtained">累計 ${obtained}</span>`;

      return `<div class="inv-entry">
        <div class="inv-row">
          <span class="inv-name">${item.name}</span>
          ${tierBadge}
          ${obtainedLabel}
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
function _grantItem(itemId) {
  const item = ITEM_MAP[itemId];
  if (!item) return;
  const prevObtained = state.itemsObtained[item.id] || 0;
  state.itemsObtained[item.id] = prevObtained + 1;
  state.inventory[item.id] = (state.inventory[item.id] || 0) + 1;
  const newObtained = state.itemsObtained[item.id];
  const prevTier = getItemTier(prevObtained);
  const newTier  = getItemTier(newObtained);
  addSystemLog(`${item.name} を入手！ (累計×${newObtained})`);
  if (newTier > prevTier) addSystemLog(`★ ${item.name} Tier${newTier} 解放！ボーナス加算！`);
  invalidateStats();
  updateStatsDisplay();
  updateInventoryDisplay();
  updateRefineDisplay();
}

function rollDrops(enemy) {
  enemy.drops.forEach(drop => {
    if (Math.random() < drop.rate) _grantItem(drop.itemId);
  });

  // 一括チケット：全モンスター共有低確率ドロップ
  const ticketRate = enemy.isBoss ? 0.08 : enemy.isRare ? 0.05 : 0.02;
  if (Math.random() < ticketRate) _grantConsumable("batch_ticket");

  // 消費アイテム共有ドロップ
  const bombRate = enemy.isBoss ? 0.12 : enemy.isRare ? 0.07 : 0.03;
  if (Math.random() < bombRate) _grantConsumable("bomb_herb");

  const smokeRate = enemy.isBoss ? 0.10 : enemy.isRare ? 0.05 : 0.02;
  if (Math.random() < smokeRate) _grantConsumable("smoke_ball");
}

// --- 消費アイテム ---
function _grantConsumable(id) {
  const def = CONSUMABLE_MAP[id];
  if (!def) return;
  state.consumables[id] = (state.consumables[id] || 0) + 1;
  addSystemLog(`${def.icon} ${def.name} を入手！ (×${state.consumables[id]})`);
  updateConsumableDisplay();
}

function useConsumable(id) {
  if ((state.consumables[id] || 0) <= 0 || state.cleared) return;
  const def = CONSUMABLE_MAP[id];
  if (!def) return;

  if (def.effect.type === "batch_mode") {
    if (state.pendingBatch || state.multiEnemies !== null) return;
    state.consumables[id]--;
    state.pendingBatch = true;
    addLog(`${def.icon} ${def.name} 使用！ 次のマップで一括討伐モードが発動します`);
    updateConsumableDisplay();
    return;
  }

  if (def.effect.type === "stun") {
    const inMulti = state.multiEnemies !== null;
    const hasEnemy = inMulti
      ? state.multiEnemies.some(e => e.currentHp > 0)
      : (state.currentEnemy != null && state.enemyHp > 0);
    if (!hasEnemy || stunTimeoutId !== null) return;
    clearInterval(enemyAttackIntervalId);
    enemyAttackIntervalId = null;
    state.consumables[id]--;
    const dur = def.effect.duration;
    addLog(`${def.icon} ${def.name} 使用！ 敵の攻撃が${dur / 1000}秒間止まった！`);
    updateConsumableDisplay();
    // オーバーレイ表示 + カウントダウン
    elEnemyArea.classList.add("stunned");
    let remaining = Math.round(dur / 1000);
    elStunTimerText.textContent = `スタン中 ${remaining}s`;
    stunCountdownId = setInterval(() => {
      remaining--;
      elStunTimerText.textContent = `スタン中 ${remaining}s`;
      if (remaining <= 0) { clearInterval(stunCountdownId); stunCountdownId = null; }
    }, 1000);
    stunTimeoutId = setTimeout(() => {
      stunTimeoutId = null;
      elEnemyArea.classList.remove("stunned");
      if (state.multiEnemies && state.multiEnemies.some(e => e.currentHp > 0)) {
        clearInterval(enemyAttackIntervalId);
        enemyAttackIntervalId = setInterval(multiEnemyTick, 2000);
      } else if (state.currentEnemy && state.enemyHp > 0) {
        clearInterval(enemyAttackIntervalId);
        enemyAttackIntervalId = setInterval(() => enemyTick(state.currentEnemy), state.currentEnemy.atkInterval);
      }
      addLog("💨 煙が晴れた！敵が攻撃を再開した！");
      updateConsumableDisplay();
    }, dur);
    return;
  }

  if (def.effect.type === "damage") {
    const dmg = Math.floor(computePlayerStats().totalAtk * def.effect.damageMult);

    if (state.multiEnemies !== null) {
      const idx = state.multiCurrentIdx ?? 0;
      const e = state.multiEnemies[idx];
      if (!e || e.currentHp <= 0) return;
      e.currentHp = Math.max(0, e.currentHp - dmg);
      showDamageNumber(fmt(dmg), "crit");
      flashEnemyHit();
      showExplosionEffect();
      playBombSound();
      addLog(`${def.icon} ${def.name} 使用！ ${fmt(dmg)} ダメージ！`);
      state.consumables[id]--;
      updateConsumableDisplay();
      if (e.currentHp <= 0) {
        e._counted = true;
        const earned = Math.floor(e.gold * (0.75 + Math.random() * 0.5));
        state.gold += earned;
        state.totalGoldEarned += earned;
        if (e.isRare) state.rareKills++;
        rollDrops(e);
        recordKill(state.mapIndex, e.name);
        checkAchievements();
        addLog(`${e.name} 撃破！ +${fmt(earned)}G`);
        playDefeatSound();
        updateShopDisplay();
        const deadCard = document.getElementById(`multi-card-${idx}`);
        if (deadCard) { deadCard.classList.add("dead"); deadCard.classList.remove("current"); }
        const mapSnap = state.mapIndex;
        setTimeout(() => advanceToNext(mapSnap), 180);
      } else {
        updateMultiGrid();
        updateMultiStats();
      }
    } else if (state.currentEnemy && state.enemyHp > 0) {
      state.enemyHp -= dmg;
      showDamageNumber(fmt(dmg), "crit");
      flashEnemyHit();
      showExplosionEffect();
      playBombSound();
      addLog(`${def.icon} ${def.name} 使用！ ${fmt(dmg)} ダメージ！`);
      updateHpDisplay();
      state.consumables[id]--;
      updateConsumableDisplay();
      if (state.enemyHp <= 0) _finishEnemyKill();
    }
  }
}

function cancelBatchTicket() {
  if (!state.pendingBatch) return;
  state.pendingBatch = false;
  state.consumables['batch_ticket'] = (state.consumables['batch_ticket'] || 0) + 1;
  addLog("🎫 一括チケットの予約を解除しました");
  updateConsumableDisplay();
}

function updateConsumableDisplay() {
  const el = document.getElementById('consumable-list');
  if (!el) return;
  const hasEnemy = state.multiEnemies !== null
    ? state.multiEnemies.some(e => e.currentHp > 0)
    : (state.currentEnemy != null && state.enemyHp > 0);
  const entries = CONSUMABLES
    .filter(c => {
      const count = state.consumables[c.id] || 0;
      if (count > 0) return true;
      // batch_ticket: 発動待ち中は0個でも表示
      return c.effect.type === "batch_mode" && state.pendingBatch;
    })
    .map(c => {
      const count = state.consumables[c.id] || 0;
      const isPending = c.effect.type === "batch_mode" && state.pendingBatch;
      let btnLabel = "使う";
      let disabled = "";
      const inMulti = state.multiEnemies !== null;
      if (isPending) {
        btnLabel = "発動中";
        disabled = "disabled";
      } else if (state.cleared) {
        disabled = "disabled";
      } else if (c.effect.type === "damage" && (inMulti || !hasEnemy)) {
        disabled = "disabled";
      } else if (c.effect.type === "batch_mode" && inMulti) {
        disabled = "disabled";
      } else if (c.effect.type === "stun" && (stunTimeoutId !== null || !hasEnemy)) {
        if (stunTimeoutId !== null) btnLabel = "発動中";
        disabled = "disabled";
      }
      const pendingBadge = isPending
        ? '<span class="consumable-pending">次マップで発動</span>'
        : '';
      const cancelBtn = isPending
        ? `<button class="consumable-cancel-btn" onclick="cancelBatchTicket()">解除</button>`
        : '';
      return `<div class="consumable-entry${isPending ? " pending" : ""}">
        <div class="consumable-info">
          <span class="consumable-name">${c.icon} ${c.name}</span>
          <span class="consumable-count">×${count}</span>
          ${pendingBadge}
          <span class="consumable-desc">${c.desc}</span>
        </div>
        <div class="consumable-btn-group">
          <button class="consumable-use-btn" onclick="useConsumable('${c.id}')" ${disabled}>${btnLabel}</button>
          ${cancelBtn}
        </div>
      </div>`;
    });
  el.innerHTML = entries.length
    ? entries.join('')
    : '<span class="empty-msg">消費アイテムなし</span>';
}

let _luckyOpen = false; // 運試し屋中はステージ効果音を止める

function playBombSound() {
  if (soundMuted || audioCtx.state !== 'running' || _luckyOpen) return;
  const now = audioCtx.currentTime;

  // ノイズバースト（爆発の「バン」）
  const bufLen = audioCtx.sampleRate * 0.25;
  const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
  const noise = audioCtx.createBufferSource();
  noise.buffer = buf;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.5, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  noise.connect(noiseGain);
  noiseGain.connect(masterGain);
  noise.start(now);

  // 低音ドン（衝撃波）
  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
  oscGain.gain.setValueAtTime(0.6, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(oscGain);
  oscGain.connect(masterGain);
  osc.onended = () => { osc.disconnect(); oscGain.disconnect(); };
  osc.start(now);
  osc.stop(now + 0.3);
  noise.onended = () => { noise.disconnect(); noiseGain.disconnect(); };
}

function showExplosionEffect() {
  const wrap = document.getElementById("enemy-img-wrap") || elEnemyArea;
  const rect = wrap.getBoundingClientRect();
  const cx = rect.left + rect.width  / 2;
  const cy = rect.top  + rect.height / 2;

  // 爆発リング（複数の輪）
  [0, 80, 160].forEach((delay) => {
    const ring = document.createElement("div");
    ring.className = "explosion-ring";
    ring.style.left  = cx + "px";
    ring.style.top   = cy + "px";
    ring.style.animationDelay = delay + "ms";
    document.body.appendChild(ring);
    ring.addEventListener("animationend", () => ring.remove());
  });

  // 火花パーティクル
  for (let i = 0; i < 8; i++) {
    const spark = document.createElement("div");
    spark.className = "explosion-spark";
    const angle = (i / 8) * 360;
    spark.style.left  = cx + "px";
    spark.style.top   = cy + "px";
    spark.style.setProperty("--angle", angle + "deg");
    document.body.appendChild(spark);
    spark.addEventListener("animationend", () => spark.remove());
  }
}

function playDefeatSound() {
  if (soundMuted || audioCtx.state !== 'running' || _luckyOpen) return;
  // ペンタトニックスケール（何を組み合わせても不協和にならない）
  const PENTA = [261.63, 293.66, 329.63, 392.00, 440.00,
                 523.25, 587.33, 659.25, 783.99, 880.00,
                 1046.5, 1174.7, 1318.5];
  // ランダムな起点から連続する3音をアルペジオ再生
  const root = Math.floor(Math.random() * (PENTA.length - 2));
  const notes = [PENTA[root], PENTA[root + 1], PENTA[root + 2]];
  notes.forEach((freq, i) => {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = audioCtx.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
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
    inventory:      state.inventory,
    itemsObtained:  state.itemsObtained,
    cleared:        state.cleared,
    shopLevels:   state.shopLevels,
    monsterKills:    state.monsterKills,
    refine:          state.refine,
    achievements:    state.achievements,
    totalGoldEarned: state.totalGoldEarned,
    totalRefines:    state.totalRefines,
    totalDeaths:     state.totalDeaths,
    totalShopBuys:   state.totalShopBuys,
    rareKills:       state.rareKills,
    mapsCleared:     state.mapsCleared,
    consumables:     state.consumables,
    pendingBatch:    state.pendingBatch,
    batchFromTicket: state.batchFromTicket,
    clearPoints:     state.clearPoints,
    soundVolume,
    soundMuted,
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
  state.inventory      = data.inventory      || {};
  state.itemsObtained  = data.itemsObtained  || { ...state.inventory }; // 旧セーブ互換
  state.cleared        = data.cleared        || false;
  state.shopLevels   = data.shopLevels   || { vit: 0, agi: 0, dex: 0, luk: 0 };
  state.monsterKills    = data.monsterKills    || {};
  state.refine          = data.refine          || null;
  state.achievements    = data.achievements    || [];
  state.totalGoldEarned = data.totalGoldEarned ?? 0;
  state.totalRefines    = data.totalRefines    ?? 0;
  state.totalDeaths     = data.totalDeaths     ?? 0;
  state.totalShopBuys   = data.totalShopBuys   ?? 0;
  state.rareKills       = data.rareKills       ?? 0;
  state.mapsCleared     = data.mapsCleared     ?? 0;
  state.consumables     = data.consumables     || {};
  state.pendingBatch    = data.pendingBatch    || false;
  state.batchFromTicket = data.batchFromTicket || false;
  state.clearPoints     = data.clearPoints     ?? 0;
  // 旧セーブの batch_ticket がステータスアイテムとして保存されていた場合の移行
  if (state.inventory['batch_ticket']) {
    state.consumables['batch_ticket'] = (state.consumables['batch_ticket'] || 0) + state.inventory['batch_ticket'];
    delete state.inventory['batch_ticket'];
    delete state.itemsObtained['batch_ticket'];
  }
  // 旧セーブの shopLevels に str/int がない場合の補完
  state.shopLevels.str  = state.shopLevels.str ?? 0;
  state.shopLevels.int  = state.shopLevels.int ?? 0;
  if (data.soundVolume != null) soundVolume = data.soundVolume;
  if (data.soundMuted  != null) soundMuted  = data.soundMuted;
  masterGain.gain.value = soundMuted ? 0 : soundVolume;
  invalidateStats();
  // 精製途中なら再開
  if (state.refine) {
    clearInterval(refineIntervalId);
    refineIntervalId = setInterval(refineTick, REFINE_TICK_MS);
  }
  return true;
}

function returnToFirstMap() {
  if (state.cleared) return;
  if (state.mapIndex === 0 && state.stageInMap === 0 && !state.multiEnemies) return;
  clearStun();
  stopEnemyAttack();
  clearInterval(attackIntervalId);
  attackIntervalId = null;
  _lastInterval = -1;
  if (state.batchFromTicket) {
    state.consumables['batch_ticket'] = (state.consumables['batch_ticket'] || 0) + 1;
    state.batchFromTicket = false;
    addSystemLog("🎫 一括チケットを返却しました");
    updateConsumableDisplay();
  }
  state.mapIndex     = 0;
  state.stageInMap   = 0;
  state.multiEnemies = null;
  elEnemyArea.classList.remove("multi-mode");
  elMultiGrid.innerHTML = "";
  addSystemLog("マップ1へ撤退");
  spawnEnemy();
  updateStatsDisplay();
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
    const bossKey    = `${mi}:${def.boss.name}`;
    const bossKills  = state.monsterKills[bossKey] || 0;
    const multiUnlocked = bossKills >= 100;

    // 討伐記録があれば到達済みとみなす（死亡リセット後も維持）
    const allDefs    = [...def.enemies, def.boss]; // マップ制覇チェック（レア除外）
    const displayDefs = [...allDefs, ...(def.rare ? [{ ...def.rare, _isRare: true }] : [])];
    const mapEverVisited = mi === 0 || displayDefs.some(e =>
      (state.monsterKills[`${mi}:${e.name}`] || 0) > 0
    );

    const mapNameText = mapEverVisited ? `${mi + 1}. ${def.name}` : `${mi + 1}. ???`;
    const multiTag = !mapEverVisited
      ? ""
      : multiUnlocked
        ? `<span class="multi-badge">一括×${bossKills}</span>`
        : `<span class="multi-badge locked-multi">一括まで${100 - bossKills}回</span>`;

    const allMax  = allDefs.every(e =>
      (state.monsterKills[`${mi}:${e.name}`] || 0) >= 999
    );

    const cards = displayDefs.map((enemyDef, idx) => {
      const isRare = !!enemyDef._isRare;
      const isBoss = !isRare && idx === def.enemies.length;
      const key    = `${mi}:${enemyDef.name}`;
      const kills  = state.monsterKills[key] || 0;
      const tier   = getItemTier(kills);
      const next   = BONUS_THRESHOLDS[tier];

      if (kills === 0) {
        return `<div class="book-monster-card unseen-enemy">
          <img class="book-monster-img" src="${enemyDef.img}">
          <div class="book-monster-name">???</div>
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

      const st = computeEnemyStats(mi, enemyDef, isBoss, isRare);
      const evaSpan  = st.evasion > 0 ? `<span class="bmc-stat-eva">回避率 ${Math.round(st.evasion * 100)}%</span>` : "";
      const critSpan = st.critRes > 0 ? `<span class="bmc-stat-crit">クリ耐性 ${Math.round(st.critRes * 100)}%</span>` : "";
      const cardCls = isRare ? "rare-card" : isBoss ? "boss-card" : "";
      const topBadge = isRare
        ? `<span class="rare-badge">RARE</span>`
        : `<span class="tier-badge tier-${tier}">${TIER_LABELS[tier]}</span>`;
      const namePrefix = isRare ? "✦ " : isBoss ? "★ " : "";

      return `<div class="book-monster-card ${cardCls}">
        <div class="bmc-top">
          <img class="book-monster-img" src="${enemyDef.img}">
          ${topBadge}
        </div>
        <div class="book-monster-name ${isBoss ? "boss" : isRare ? "rare" : ""}">${namePrefix}${enemyDef.name}</div>
        ${(evaSpan || critSpan) ? `<div class="bmc-stats">${evaSpan}${critSpan}</div>` : ""}
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
      <div class="book-map-name ${!mapEverVisited ? "unseen-map" : ""}">${mapNameText} ${multiTag}</div>
      <div class="book-monster-cards">${cards}</div>
      ${mapBonusHtml}
    </div>`;
  }).join("");

  document.getElementById("book-content").innerHTML = sections;
}

// ============================================================
// 🎰 運試し屋  ── パラメータ設定
// ============================================================
const LUCKY_CONFIG = {
  cost:          10000,  // 1回のコスト (G)

  // ── 大当たり継続確率 ───────────────────────────────────────
  //   高いほど長続きして期待値UP・低いほどすぐ終わる
  jackpotChance: 0.85,   // ← ここを変える (0.0〜1.0)

  // ── 超大当たり（特化ゾーン突入）確率 ──────────────────────
  //   jackpotChance の中に含まれる確率。必ず jackpotChance 未満にすること
  superChance:   0.08,   // ← ここを変える (0.0〜jackpotChance)

  // ── 超運試しのループ確率 ──────────────────────────────────
  zoneLoopChance: 0.80,  // ← ここを変える (0.0〜1.0)

  // ── 初期G 範囲 ────────────────────────────────────────────
  baseMin:  50,           // ← 最小値
  baseMax: 500,           // ← 最大値   平均 = (min+max)/2 = 275G

  // ── 倍率テーブル: [倍率, 相対重み] ────────────────────────
  //   重みが大きいほど出やすい。合計値は自動計算するので自由に増減OK
  multTable: [
    [ 2,  2],  // 出にくい
    [ 3,  3],
    [ 4,  4],
    [ 5,  5],
    [ 6,  5],
    [ 7,  5],
    [ 8,  4],
    [ 9,  3],
    [10,  4],  // 高倍率もそこそこ出る
  ],
  // 合計重み35 → 期待倍率 ≈ 6.2×

  // ── 期待値の目安 ──────────────────────────────────────────
  // 公式: E[報酬] = E[初期G] × { (1-p) + E[倍率] × p/(1-p) }
  //      ≈ 275 × { 0.15 + 6.2 × 0.85/0.15 }
  //      ≈ 275 × 35.2  ≈  9,700G / 回（特化ゾーン込みで約10,000G）
  // 平均大当たり回数: p/(1-p) = 0.85/0.15 ≈ 5.7 回/ゲーム
  // ─────────────────────────────────────────────────────────
};

// ── 運試し屋 効果音 ──────────────────────────────────────────
function _playLuckySfx(type) {
  if (soundMuted || audioCtx.state !== 'running') return;
  const now = audioCtx.currentTime;
  const tone = (freq, t, dur, vol = 0.16, wave = 'sine') => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(masterGain);
    o.type = wave;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.onended = () => { o.disconnect(); g.disconnect(); };
    o.start(t); o.stop(t + dur + 0.01);
  };
  switch (type) {
    case 'base':
      tone(523, now, 0.12); tone(659, now + 0.09, 0.2); break;
    case 'jackpot':
      [523, 659, 784].forEach((f, i) => tone(f, now + i * 0.08, 0.24)); break;
    case 'super':
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, now + i * 0.065, 0.3, 0.22)); break;
    case 'zone_win':
      [784, 1047, 1319, 1568].forEach((f, i) => tone(f, now + i * 0.055, 0.28, 0.14)); break;
    case 'zone_exit':
      tone(523, now, 0.22, 0.15); tone(392, now + 0.12, 0.28, 0.18); tone(330, now + 0.26, 0.3, 0.22); break;
    case 'claim':
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
        tone(f, now + i * 0.055, 0.38, i < 5 ? 0.16 : 0.26)); break;
    case 'miss': {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(masterGain);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(300, now);
      o.frequency.exponentialRampToValueAtTime(130, now + 0.4);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      o.onended = () => { o.disconnect(); g.disconnect(); };
      o.start(now); o.stop(now + 0.42);
      break;
    }
  }
}

// ── 運試し屋 パーティクルバースト ────────────────────────────
function _luckyParticleBurst(type) {
  const modal = document.querySelector('.lucky-modal-box');
  if (!modal) return;
  const rect  = modal.getBoundingClientRect();
  const cx    = rect.left + rect.width / 2;
  const cy    = rect.top  + rect.height * 0.42;
  const count   = type === 'super' ? 24 : type === 'claim' ? 30 : 14;
  const symbols = type === 'claim' ? ['G','G','★','✦'] : ['★','✦','◆','●'];
  const colors  = type === 'super'
    ? ['#ffd700','#ffaa00','#ffee44','#ff8800']
    : type === 'claim'
    ? ['#f0c030','#44dd88','#60a0ff','#ffaa40']
    : ['#ffcc40','#ff90c0','#80d0ff','#a0e080'];

  for (let i = 0; i < count; i++) {
    const el    = document.createElement('span');
    el.className = 'lk-particle';
    el.textContent = symbols[i % symbols.length];
    const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.8;
    const speed = 70 + Math.random() * (type === 'super' ? 130 : 80);
    const dx    = Math.cos(angle) * speed;
    const dy    = Math.sin(angle) * speed * 0.55 - (30 + Math.random() * 50);
    const dur   = 600 + Math.random() * 400;
    el.style.left  = cx + 'px';
    el.style.top   = cy + 'px';
    el.style.color = colors[i % colors.length];
    el.style.fontSize = (0.72 + Math.random() * 0.7) + 'rem';
    el.style.animationDuration = dur + 'ms';
    el.style.animationDelay   = Math.random() * 100 + 'ms';
    el.style.setProperty('--pdx', dx + 'px');
    el.style.setProperty('--pdy', dy + 'px');
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }
}

// multTable から重み付き抽選
function _drawMult() {
  const table  = LUCKY_CONFIG.multTable;
  const total  = table.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [val, w] of table) {
    r -= w;
    if (r < 0) return val;
  }
  return table[table.length - 1][0];
}

const LUCKY_COST = LUCKY_CONFIG.cost;
let _luckyPhase    = null;   // 'idle' | 'base' | 'mult' | 'done'
let _luckyBase     = 0;
let _luckyMults    = [];
let _luckySpinning = false;
let _zoneSpinCount = 0; // 超運試し内のスピン回数（1回目はずれなし保証）

function _luckyTotal() {
  if (!_luckyMults.length) return _luckyBase;
  return _luckyBase * _luckyMults.reduce((s, m) => s + m, 0);
}

function _luckyFormulaHtml() {
  if (!_luckyBase) return '<div class="lk-formula lk-formula-ph"></div>';
  let h = `<span class="lk-base">${_luckyBase}G</span>`;
  if (_luckyMults.length) {
    const sum = _luckyMults.reduce((s, m) => s + m, 0);
    // 4個以上は内訳を省略して合計値だけ表示（1行に収める）
    const sumStr = _luckyMults.length <= 3
      ? (_luckyMults.length === 1 ? `${sum}` : `(${_luckyMults.join(' + ')})`)
      : `${sum} <span class="lk-count">${_luckyMults.length}連</span>`;
    h += ` <span class="lk-op">×</span><span class="lk-mult">${sumStr}</span>`;
    h += ` <span class="lk-op">=</span><span class="lk-total">${fmt(_luckyBase * sum)}G</span>`;
  }
  return `<div class="lk-formula">${h}</div>`;
}

function openLucky() {
  _luckyOpen     = true;
  _luckyPhase    = 'idle';
  _luckyBase     = 0;
  _luckyMults    = [];
  _luckySpinning = false;
  _renderLucky();
  document.getElementById('modal-lucky').style.display = 'flex';
}

function closeLucky() {
  if (_luckySpinning) return;
  _luckyOpen  = false;
  _luckyPhase = null;
  document.querySelector('.lucky-modal-box')?.classList.remove('lk-zone-active');
  document.getElementById('modal-lucky').style.display = 'none';
}

function _renderLucky() {
  const body = document.getElementById('lucky-body');
  if (!body) return;

  // 常に同じ構造: [フォーミュラ行] [中央コンテンツ] [ボタン行]
  let centerHtml = '';
  let btnsHtml   = '';

  if (_luckyPhase === 'idle') {
    const ok = state.gold >= LUCKY_COST;
    centerHtml = `
      <div class="lk-cost-line">1回 <strong>${fmt(LUCKY_COST)}G</strong></div>
      <div class="lk-hint">初期G（${fmt(LUCKY_CONFIG.baseMin)}〜${fmt(LUCKY_CONFIG.baseMax)}）を抽選<br>大当たり（${Math.round(LUCKY_CONFIG.jackpotChance*100)}%）で倍率が積み上がる！<br>はずれで終了・獲得G確定</div>`;
    btnsHtml = `
      <button class="lk-btn lk-btn-start" onclick="luckyStart()" ${ok ? '' : 'disabled'}>🎰 挑戦する</button>
      ${!ok ? `<div class="lk-nogold">G不足（所持: ${fmt(state.gold)}G）</div>` : ''}`;

  } else if (_luckyPhase === 'zone') {
    centerHtml = `
      <div class="lk-zone-header">🌟 超運試し 🌟</div>
      <div class="lk-slot-box"><div class="lk-reel lk-reel-zone" id="lk-reel">?×</div></div>
      <div class="lk-msg" id="lk-msg"></div>`;
    setTimeout(_doZoneSpin, 350);

  } else if (_luckyPhase === 'base' || _luckyPhase === 'mult') {
    const multMin = LUCKY_CONFIG.multTable[0][0];
    const multMax = LUCKY_CONFIG.multTable[LUCKY_CONFIG.multTable.length - 1][0];
    const label = _luckyPhase === 'base'
      ? `初期G 抽選（${fmt(LUCKY_CONFIG.baseMin)} 〜 ${fmt(LUCKY_CONFIG.baseMax)}）`
      : `倍率 抽選（× ${multMin} 〜 ${multMax}）大当たり ${Math.round(LUCKY_CONFIG.jackpotChance*100)}%`;
    const initText = _luckyPhase === 'base' ? '?' : '?×';
    centerHtml = `
      <div class="lk-slot-label">${label}</div>
      <div class="lk-slot-box"><div class="lk-reel" id="lk-reel">${initText}</div></div>
      <div class="lk-msg" id="lk-msg"></div>`;
    if (!_luckySpinning) {
      btnsHtml = `<button class="lk-btn lk-btn-spin" onclick="luckySpin()">🎲 スピン！</button>`;
    }

  } else if (_luckyPhase === 'done') {
    const reward = _luckyTotal();
    centerHtml = `
      <div class="lk-done-label">獲得G</div>
      <div class="lk-done-amount">${fmt(reward)}G</div>`;
    btnsHtml = `<button class="lk-btn lk-btn-claim" onclick="luckyClaim()">✨ 受け取る</button>`;
  }

  body.innerHTML = `
    ${_luckyFormulaHtml()}
    <div class="lk-center">${centerHtml}</div>
    <div class="lk-btns">${btnsHtml}</div>`;

  // ゾーン中はモーダル枠を金色に光らせる
  document.querySelector('.lucky-modal-box')?.classList.toggle('lk-zone-active', _luckyPhase === 'zone');
}

function luckyStart() {
  if (state.gold < LUCKY_COST || _luckySpinning) return;
  _luckyBase     = 0;
  _luckyMults    = [];
  _luckyPhase    = 'base';
  _luckySpinning = false;
  _renderLucky();
}

function luckySpin() {
  if (_luckySpinning) return;
  _luckySpinning = true;

  const isBase   = _luckyPhase === 'base';
  const finalVal = isBase
    ? Math.floor(Math.random() * (LUCKY_CONFIG.baseMax - LUCKY_CONFIG.baseMin + 1)) + LUCKY_CONFIG.baseMin
    : _drawMult();
  // 結果判定: superChance → 超大当たり、jackpotChance → 通常大当たり、それ以上 → はずれ
  // 最初の3回は超大当たり含む当選確定（miss なし）
  const guaranteed = !isBase && _luckyMults.length < 3;
  const roll       = isBase ? -1 : Math.random();
  const isSuper    = !isBase && roll < LUCKY_CONFIG.superChance;
  const jackpot    = !isBase && !isSuper && (guaranteed || roll < LUCKY_CONFIG.jackpotChance);

  _renderLucky(); // スピン中: ボタン非表示、リール表示

  const reel = document.getElementById('lk-reel');
  if (!reel) { _luckySpinning = false; return; }

  if (isSuper) {
    // 超大当たり: 特殊リールアニメーション → ゾーン突入
    _animateSuperReel(reel, () => {
      _luckySpinning = false;
      _luckyPhase    = 'zone';
      _zoneSpinCount = 0;
      _renderLucky();
    });
    return;
  }

  // 通常スピン (miss の場合は null を渡すとリールに「はずれ」を表示)
  _animateLuckyReel(reel, isBase, (jackpot || isBase) ? finalVal : null, () => {
    _luckySpinning = false;

    if (isBase) {
      _luckyBase  = finalVal;
      _luckyPhase = 'mult';
      _playLuckySfx('base');
      const msg = document.getElementById('lk-msg');
      if (msg) msg.innerHTML = `<span class="lk-msg-base">ベースG: ${fmt(finalVal)}G 確定！</span>`;
      setTimeout(_renderLucky, 900);

    } else if (jackpot) {
      _luckyMults.push(finalVal);
      _playLuckySfx('jackpot');
      _luckyParticleBurst('jackpot');
      const msg = document.getElementById('lk-msg');
      if (msg) msg.innerHTML = `<span class="lk-jackpot-msg">🎉 大当たり！ ×${finalVal}！</span>`;
      const r = document.getElementById('lk-reel');
      if (r) r.classList.add('lk-jackpot-flash');
      setTimeout(_renderLucky, 1050);

    } else {
      _playLuckySfx('miss');
      const box = document.querySelector('.lucky-modal-box');
      if (box) { box.classList.add('lk-shake'); setTimeout(() => box.classList.remove('lk-shake'), 500); }
      const msg = document.getElementById('lk-msg');
      if (msg) msg.innerHTML = `<span class="lk-miss-msg">💔 はずれ…</span>`;
      _luckyPhase = 'done';
      setTimeout(_renderLucky, 1250);
    }
  });
}

// 超大当たりリールアニメーション → "★" で止まりゾーン突入
function _animateSuperReel(el, cb) {
  const multMin = LUCKY_CONFIG.multTable[0][0];
  const multMax = LUCKY_CONFIG.multTable[LUCKY_CONFIG.multTable.length - 1][0];
  const duration = 1200;
  const startTime = Date.now();
  el.classList.add('lk-reel-spinning');

  const timer = setInterval(() => {
    const elapsed  = Date.now() - startTime;
    const progress = elapsed / duration;
    if (progress >= 1) {
      clearInterval(timer);
      el.classList.remove('lk-reel-spinning');
      el.textContent = '★';
      el.classList.add('lk-reel-super');
      _playLuckySfx('super');
      _luckyParticleBurst('super');
      const _sbody = document.getElementById('lucky-body');
      if (_sbody) { _sbody.classList.add('lk-super-flash'); setTimeout(() => _sbody.classList.remove('lk-super-flash'), 600); }
      setTimeout(cb, 700);
      return;
    }
    const chance = Math.pow(1 - progress, 1.2);
    if (Math.random() < Math.max(chance, 0.07)) {
      const r = Math.floor(Math.random() * (multMax - multMin + 1)) + multMin;
      el.textContent = `${r}×`;
    }
  }, 80);
}

// 超運試し: 自動スピン (80%ループ、1回目はずれなし保証)
function _doZoneSpin() {
  const reel = document.getElementById('lk-reel');
  if (!reel || _luckyPhase !== 'zone') return;
  _luckySpinning = true;

  const finalVal = _drawMult();
  const cont     = _zoneSpinCount === 0 || Math.random() < LUCKY_CONFIG.zoneLoopChance;
  _zoneSpinCount++;

  _animateLuckyReel(reel, false, cont ? finalVal : null, () => {
    _luckySpinning = false;
    if (cont) {
      _luckyMults.push(finalVal);
      // 計算式だけ差し替え（全再描画せず）
      const body = document.getElementById('lucky-body');
      if (body) {
        const fe = body.querySelector('.lk-formula');
        const newHtml = _luckyFormulaHtml();
        if (fe && newHtml) {
          const tmp = document.createElement('div');
          tmp.innerHTML = newHtml;
          fe.replaceWith(tmp.firstChild);
        } else if (newHtml && !fe) {
          body.insertAdjacentHTML('afterbegin', newHtml);
        }
      }
      _playLuckySfx('zone_win');
      _luckyParticleBurst('jackpot');
      const msg = document.getElementById('lk-msg');
      if (msg) msg.innerHTML = `<span class="lk-jackpot-msg">+${finalVal}× ！</span>`;
      setTimeout(_doZoneSpin, 450); // テンポよく次へ
    } else {
      _playLuckySfx('zone_exit');
      const msg = document.getElementById('lk-msg');
      if (msg) msg.innerHTML = `<span class="lk-zone-exit-msg">超運試し終了…</span>`;
      _luckyPhase = 'mult';
      setTimeout(_renderLucky, 1000);
    }
  }, 700); // ゾーン内は高速アニメ
}

function _animateLuckyReel(el, isBase, finalVal, cb, duration = 1500) {
  // finalVal: 数値(当選) | null(はずれ)
  const min = isBase ? LUCKY_CONFIG.baseMin : LUCKY_CONFIG.multTable[0][0];
  const max = isBase ? LUCKY_CONFIG.baseMax : LUCKY_CONFIG.multTable[LUCKY_CONFIG.multTable.length - 1][0];
  const startTime = Date.now();
  el.classList.remove('lk-reel-land', 'lk-reel-miss', 'lk-reel-super');
  el.classList.add('lk-reel-spinning');

  const timer = setInterval(() => {
    const elapsed  = Date.now() - startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      clearInterval(timer);
      el.classList.remove('lk-reel-spinning');
      if (finalVal !== null) {
        el.textContent = isBase ? `${finalVal}` : `${finalVal}×`;
        el.classList.add('lk-reel-land');
      } else {
        el.textContent = 'はずれ';
        el.classList.add('lk-reel-miss');
      }
      setTimeout(cb, 450);
      return;
    }

    // 徐々にスロー: progress が大きくなるほど数字が変わりにくくなる
    const chance = Math.pow(1 - progress, 1.2);
    if (Math.random() < Math.max(chance, 0.07)) {
      const r = Math.floor(Math.random() * (max - min + 1)) + min;
      el.textContent = isBase ? `${r}` : `${r}×`;
    }
  }, 80);
}

function luckyClaim() {
  const reward = _luckyTotal();
  _playLuckySfx('claim');
  _luckyParticleBurst('claim');
  state.gold += reward - LUCKY_COST;
  updateShopDisplay();
  autoSave();
  const net = reward - LUCKY_COST;
  addSystemLog(`🎰 運試し屋: ${fmt(reward)}G 獲得（コスト差引 ${net >= 0 ? '+' : ''}${fmt(net)}G）`);
  closeLucky();
}

// --- 初期化 ---
function init() {
  if (PAGE_BG) {
    document.body.style.backgroundImage = `url('${PAGE_BG}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
  }
  if (GAME_BG) {
    elGameBg.style.backgroundImage = `url('${GAME_BG}')`;
  }
  updateMuteBtn();
  setVolume(soundVolume);
  initSaveIcons();
  initPanelIcons();
  initStageGrid();
  const loaded = loadGame();

  updateStatsDisplay();
  updateInventoryDisplay();
  updateConsumableDisplay();
  updateShopDisplay();
  updateRefineDisplay();

  if (loaded && state.cleared) gameClear();
  else                         spawnEnemy();

  setInterval(autoSave, 5000);
}

init();
