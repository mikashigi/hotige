// --- 敵パラメーター計算 ---
function makeEnemy(mapIndex, stageInMap) {
  const def    = MAP_DEFS[mapIndex];
  const isBoss = stageInMap === 9;
  const enemyDef = isBoss
    ? def.boss
    : def.enemies[Math.floor(Math.random() * def.enemies.length)];

  const mult     = Math.pow(2, mapIndex); // マップごとに2倍
  const si       = stageInMap;
  const hpMult   = enemyDef.hpMult  ?? 1.0;
  const atkMult  = enemyDef.atkMult ?? 1.0;
  const bossHpM  = def.isFinal ? 10 : 6;
  const bossAtkM = def.isFinal ? 4  : 3;

  // 草原1-1=5, 1-2=10, 1-3≈16, 1-4≈24 になる二次曲線
  const baseHp   = Math.round(5 * mult * (1 + si * 0.9 + si * si * 0.12));
  const baseAtk  = Math.round(3 * Math.sqrt(mult) * (1 + si * 0.08));
  const baseGold = Math.round(5 * mult * (1 + si * 0.1));

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
  const mult = Math.pow(2, mapIndex);
  const si   = stageInMap;
  const baseHp   = Math.round(5 * mult * (1 + si * 0.9 + si * si * 0.12));
  const baseAtk  = Math.round(3 * Math.sqrt(mult) * (1 + si * 0.08));
  const baseGold = Math.round(5 * mult * (1 + si * 0.1));
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
  const mult   = Math.pow(2, mi);
  const si     = isBoss ? 9 : 4;
  const hpMult   = enemyDef.hpMult  ?? 1.0;
  const atkMult  = enemyDef.atkMult ?? 1.0;
  const bossHpM  = def.isFinal ? 10 : 6;
  const bossAtkM = def.isFinal ? 4  : 3;
  const baseHp   = Math.round(5 * mult * (1 + si * 0.9 + si * si * 0.12));
  const baseAtk  = Math.round(3 * Math.sqrt(mult) * (1 + si * 0.08));
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
  bestMapIndex:    0,
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
  { id: "save",   src: "", alt: "SAVE",   label: "セーブ",       action: "saveGame()" },
  { id: "export", src: "", alt: "EXPORT", label: "エクスポート", action: "openExportModal()" },
  { id: "import", src: "", alt: "IMPORT", label: "インポート",   action: "openImportModal()" },
  { id: "reset",  src: "", alt: "RESET",  label: "リセット",     action: "resetSave()",        cls: "reset" },
  { id: "home",   src: "", alt: "HOME",   label: "マップ1へ戻る", action: "returnToFirstMap()", cls: "home" },
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
      if (state.batchFromTicket) {
        state.consumables['batch_ticket'] = (state.consumables['batch_ticket'] || 0) + 1;
        state.batchFromTicket = false;
        addSystemLog("🎫 連闘チケットを返却しました");
        updateConsumableDisplay();
      }
      state.pendingBatch = false;
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
      if (state.batchFromTicket) {
        state.consumables['batch_ticket'] = (state.consumables['batch_ticket'] || 0) + 1;
        state.batchFromTicket = false;
        addSystemLog("🎫 連闘チケットを返却しました");
        updateConsumableDisplay();
      }
      state.pendingBatch = false;
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

  addLog(`★ 連闘モード！ ${state.multiEnemies.length}体が一斉出現！`);
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
  // multi-mode解除・グリッドクリアはspawnEnemy()に任せる（マップクリアオーバーレイ中の縮みを防止）
  if (hadFinal) {
    elEnemyArea.classList.remove("multi-mode");
    elMultiGrid.innerHTML = "";
    gameClear();
    return;
  }
  state.stageInMap = 0;
  state.mapIndex++;
  if (state.mapIndex >= MAP_DEFS.length) { gameClear(); return; }
  state.mapsCleared++;
  state.bestMapIndex = Math.max(state.bestMapIndex, state.mapIndex);
  addSystemLog(`★ マップ連闘クリア！ 「${MAP_DEFS[state.mapIndex].name}」へ！`);
  checkAchievements();
  updateConsumableDisplay();
  showMapClearOverlay(MAP_DEFS[state.mapIndex].name, true);
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

// --- 連闘 NEXT スウィープ演出 ---
function _showNextSweep() {
  const game = document.getElementById('game');
  if (!game) { _mcSlideDir = 1; spawnEnemy(); updateStatsDisplay(); return; }

  const el = document.createElement('div');
  el.className = 'next-sweep-overlay';
  const arrows = '→ → → → → → → → → → → → → → → → → → → →';
  el.innerHTML = `
    <div class="next-sweep-track">
      <div class="next-sweep-arrows">${arrows}</div>
      <div class="next-sweep-main">▶▶ NEXT ▶▶</div>
      <div class="next-sweep-arrows">${arrows}</div>
    </div>`;
  game.appendChild(el);

  setTimeout(() => {
    el.remove();
    _mcSlideDir = 1;
    spawnEnemy();
    updateStatsDisplay();
  }, 1020);
}

// --- マップクリア演出 ---
function showMapClearOverlay(newMapName, isMulti = false) {
  if (isMulti) { _showNextSweep(); return; }
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
      addSystemLog("🎫 連闘チケット発動！連闘モード開始！");
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
    state.bestMapIndex = Math.max(state.bestMapIndex, state.mapIndex);
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
  if (state.multiEnemies !== null) {
    for (let i = 0; i < s.multiAttackCount; i++) tickMulti(s);
    return;
  }

  // 通常単体：ダブルアタック対応
  for (let hit = 0; hit < s.attackCount; hit++) {
    if (!state.currentEnemy || state.enemyHp <= 0) break;

    const rand = Math.random();
    const effectiveHit = Math.max(0, s.hitRate - state.currentEnemy.evasion);
    if (rand > effectiveHit) {
      addLog("ミス！");
      showDamageNumber("MISS", "miss");
      continue;
    }

    let dmg = s.totalAtk;
    let suffix = "";
    let dmgType = null;
    const effectiveCrit = Math.max(0, s.critChance - state.currentEnemy.critRes);
    if (Math.random() < effectiveCrit) {
      const mult = _critMult(
        Math.round(s.critChance * 100),
        Math.round(state.currentEnemy.critRes * 100)
      );
      dmg = Math.floor(dmg * mult);
      suffix  = ` ★クリティカル！（×${mult.toFixed(2)}）`;
      dmgType = "crit";
    }

    state.enemyHp -= dmg;
    showDamageNumber(dmg, dmgType);
    flashEnemyHit();
    playHitSound(dmgType === "crit");
    addLog(`攻撃！ ${dmg} ダメージ（残HP: ${Math.max(0, state.enemyHp)}）${suffix}`);
    updateHpDisplay();

    if (state.enemyHp <= 0) { _finishEnemyKill(); break; }
  }
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
      const mult = _critMult(
        Math.round(s.critChance * 100),
        Math.round((e.critRes || 0) * 100)
      );
      dmg = Math.floor(dmg * mult);
      dmgType = "crit";
      suffix = ` ★クリティカル！（×${mult.toFixed(2)}）`;
    }
    e.currentHp = Math.max(0, e.currentHp - dmg);
    showDamageNumber(dmg, dmgType);
    flashEnemyHit();
    playHitSound(dmgType === "crit");
    addLog(`攻撃！ ${dmg} ダメージ（残HP: ${e.currentHp}）${suffix}`);
    updateMultiGrid();
    if (e.currentHp > 0) return;
  } else {
    // 通常敵：必中・一撃必殺
    e.currentHp = 0;
    showDamageNumber("KILL", "crit");
    flashEnemyHit();
    playHitSound(true);
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
    addSystemLog(`★★ ${MAP_DEFS[mapIndex].name} ボス100体討伐！連闘モード解放！`);
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
  const overlay = document.getElementById('game-clear-overlay');
  if (!overlay) return;
  const cp = state.clearPoints;

  // Stars row
  const starsRow = overlay.querySelector('.gc-stars-row');
  if (starsRow) starsRow.textContent = '⭐ ✨ 🌟 ✨ ⭐';

  // Clear points row
  const cpRow = document.getElementById('gc-cp-row');
  if (cpRow) {
    if (cp >= 0) {
      cpRow.innerHTML = `<span class="gc-cp-badge">🏆 ${cp > 0 ? `${cp}周目 → ` : ''}<span class="gc-cp-new">${cp + 1}周目</span></span>`;
      cpRow.style.display = '';
    } else {
      cpRow.style.display = 'none';
    }
  }

  // Falling particles
  const gcParticles = document.getElementById('gc-particles');
  if (gcParticles) {
    gcParticles.innerHTML = '';
    const symbols = ['🌟','✨','💫','⭐','🎊','🎉','💖','🌈','🍀','🎀'];
    for (let i = 0; i < 35; i++) {
      const el = document.createElement('span');
      el.className = 'gc-particle';
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      el.style.left = Math.random() * 100 + '%';
      el.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
      el.style.animationDuration = (2.5 + Math.random() * 4) + 's';
      el.style.animationDelay = (Math.random() * 5) + 's';
      gcParticles.appendChild(el);
    }
  }

  overlay.style.display = 'flex';
}

function startNewGamePlus() {
  if (!state.cleared) return;
  const overlay = document.getElementById('game-clear-overlay');
  if (overlay) overlay.style.display = 'none';
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
// ショップ用：大きい数字をK/M略称で6文字以内に収める
function fmtShop(n) {
  n = Math.floor(n);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 10000)   return Math.floor(n / 1000) + 'K';
  return fmt(n);
}

// --- ショップ ---
function updateShopDisplay() {
  elGold.textContent = fmtShop(state.gold);
  const hc = healCost();
  elHealCost.textContent = fmtShop(hc);
  elBtnHeal.disabled = state.gold < hc || state.playerHp >= state.playerMaxHp;
  for (const key of Object.keys(SHOP_DEFS)) {
    const cost1  = shopStatCost(key);
    const cost10 = shopStatCostN(key, 10);
    document.getElementById(`shop-${key}-cost`).textContent    = fmtShop(cost1);
    document.getElementById(`shop-${key}-cost-10`).textContent = fmtShop(cost10);
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
    // 継続中は DOM 再構築せずカウントのみ更新（クリック競合防止）
    const countEl = document.querySelector('.refine-active-count');
    if (countEl) countEl.textContent = next === -1 ? '∞' : `残り ${next}回`;
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
      return `<span class="refine-chip${enough ? "" : " missing"}">${name}×${inp.count}<span class="refine-chip-have">(<span class="refine-num">${have}</span>)</span></span>`;
    }).join("");

    const outItem  = ITEM_MAP[recipe.output.itemId];
    const outName  = outItem?.name ?? recipe.output.itemId;
    const outHave  = state.inventory[recipe.output.itemId] || 0;
    const outTier  = getItemTier(outHave);
    const tierStr  = outTier > 0 ? ` / Tier${outTier}` : "";
    html += `
      <div class="refine-recipe-row${isActive ? " refining" : ""}">
        <div class="refine-recipe-info">
          <div class="refine-recipe-name">${recipe.name}</div>
          <div class="refine-ingredients">${chipsHtml}</div>
          <div class="refine-output">→ ${outName} ×${recipe.output.count}　${recipe.time}秒　<span class="refine-out-have">所持: ${outHave}${tierStr}</span></div>
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
// クリアポイント補正込みのクリティカル倍率
// critChancePct: プレイヤーのクリ率(%), critResPct: 敵のクリ耐性(%)
function _critMult(critChancePct, critResPct) {
  const BASE = 1.5;
  if (state.clearPoints <= 0) return BASE;
  const diff = critChancePct - critResPct;
  if (diff <= 100) return BASE;
  const excess  = diff - 100;
  const divisor = Math.max(2, 11 - state.clearPoints); // cp=1→10, cp=2→9, ...
  return BASE + Math.floor(excess / divisor) / 100;
}

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

  const rawInterval    = 1000 - raw.agi * 5;
  const normInterval   = Math.max(300, rawInterval);
  // 速度上限(AGI=140)到達後、AGI999で20HITに線形スケール
  const normCount      = rawInterval < 300
    ? Math.min(20, 1 + Math.floor((raw.agi - 140) * 19 / 859))
    : 1;
  const multiInterval  = Math.max(100, Math.floor(normInterval / 3));
  // 連闘マルチアタック: AGI0→1HIT、AGI999→20HIT 線形
  const multiCount     = Math.min(20, Math.max(1, 1 + Math.floor(raw.agi * 19 / 999)));

  _cachedStats = {
    ...raw,
    totalAtk:          state.attack + Math.floor(raw.str * 1.0) + Math.floor(raw.int * 0.4),
    playerMaxHp:       50 + raw.vit * 5,
    hitRate:           0.90 + raw.dex * 0.0015 + raw.int * 0.001,
    attackInterval:    normInterval,
    attackCount:       normCount,
    multiInterval,
    multiAttackCount:  multiCount,
    critChance:        raw.luk * 0.008 + raw.int * 0.003,
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
  const interval = state.multiEnemies ? s.multiInterval : s.attackInterval;
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
  const effSpd = s.attackCount * 1000 / s.attackInterval;
  elInfoSpd.textContent  = s.attackCount > 1
    ? `${(1000 / s.attackInterval).toFixed(1)}×${s.attackCount}`
    : effSpd.toFixed(1);
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

// --- アイテム情報ポップアップ ---
const SVG_INFO = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`;

function showItemInfoPopup(itemId) {
  const item    = ITEM_MAP[itemId];
  if (!item) return;
  const recipes = ITEM_RECIPE_MAP[itemId];
  const recipeStr = recipes
    ? `<div class="ipu-recipes"><span class="ipu-label">使い道</span>${recipes.join("・")}</div>`
    : `<div class="ipu-recipes ipu-no-recipe">精製には使いません</div>`;
  document.getElementById("item-info-content").innerHTML = `
    <div class="ipu-name">${item.name}</div>
    <div class="ipu-stats"><span class="ipu-label">基本効果</span>${statStr(item)}</div>
    ${recipeStr}`;
  document.getElementById("item-info-overlay").classList.add("open");
}

function showDropsInfoPopup(dropsJson) {
  const drops = JSON.parse(dropsJson);
  const rows = drops.map(d => {
    const item    = ITEM_MAP[d.itemId];
    const name    = item?.name ?? d.itemId;
    const pct     = Math.round(d.rate * 100);
    const recipes = ITEM_RECIPE_MAP[d.itemId];
    const recipeStr = recipes ? `<span class="ipu-drop-recipe">→ ${recipes.join("・")}</span>` : "";
    return `<div class="ipu-drop-row"><span class="ipu-drop-name">${name} <span class="ipu-drop-pct">${pct}%</span></span>${recipeStr}</div>`;
  }).join("");
  document.getElementById("item-info-content").innerHTML = `
    <div class="ipu-name">ドロップアイテム</div>
    ${rows}`;
  document.getElementById("item-info-overlay").classList.add("open");
}

function closeItemInfoPopup() {
  document.getElementById("item-info-overlay").classList.remove("open");
}

// アイテム図鑑・インベントリ用アイコン
function itemInfoIcon(itemId) {
  return `<button class="info-icon-btn" onclick="event.stopPropagation();showItemInfoPopup('${itemId}')">${SVG_INFO}</button>`;
}
// モンスター図鑑用アイコン（ドロップ情報）
function dropInfoIcon(drops) {
  const json = JSON.stringify(drops).replace(/'/g, "&#39;");
  return `<button class="info-icon-btn" onclick="event.stopPropagation();showDropsInfoPopup('${json}')">${SVG_INFO}</button>`;
}

const ITEM_RECIPE_MAP = (() => {
  const map = {};
  REFINE_RECIPES.forEach(r => {
    r.inputs.forEach(inp => {
      if (!map[inp.itemId]) map[inp.itemId] = [];
      map[inp.itemId].push(r.name);
    });
  });
  return map;
})();

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
        ? `<span class="inv-next">→<span class="inv-num">${next}</span></span>`
        : `<span class="inv-next max">MAX</span>`;

      const curEff  = calcItemEffect(item, obtained);
      const curText = statStr(curEff);
      let nextText  = "";
      if (next !== undefined && item.bonus && item.bonus[tier]) {
        nextText = `<span class="inv-next-bonus">次(${next}個): +${statStr(item.bonus[tier])}</span>`;
      }

      const obtainedLabel = `<span class="inv-count">所持<span class="inv-num">${fmt(held)}</span></span><span class="inv-obtained">累計<span class="inv-num">${fmt(obtained)}</span></span>`;

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
        ${itemInfoIcon(item.id)}
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
  if (state.multiEnemies !== null) return; // 連闘中は全アイテム使用不可
  const def = CONSUMABLE_MAP[id];
  if (!def) return;

  if (def.effect.type === "batch_mode") {
    if (state.pendingBatch || state.multiEnemies !== null) return;
    // 消費は発動時（spawnEnemy）に行う。ここでは予約のみ。
    state.pendingBatch = true;
    addLog(`${def.icon} ${def.name} 使用！ 次のマップで連闘モードが発動します`);
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
  addLog("🎫 連闘チケットの予約を解除しました");
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
      } else if (inMulti) {
        btnLabel = "連闘中";
        disabled = "disabled";
      } else if (state.cleared) {
        disabled = "disabled";
      } else if (c.effect.type === "damage" && !hasEnemy) {
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
          <div class="consumable-name-row">
            <span class="consumable-name">${c.icon} ${c.name}</span>
            ${pendingBadge}
          </div>
          <span class="consumable-count">×${count}</span>
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

let _lastHitSoundTime = 0;

// ノイズバースト生成ヘルパー
function _makeNoise(dur) {
  const bufLen = Math.floor(audioCtx.sampleRate * dur);
  const buf  = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1);
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  return src;
}

function playHitSound(isCrit = false) {
  if (soundMuted || audioCtx.state !== 'running' || _luckyOpen) return;
  const now = audioCtx.currentTime;
  if (now - _lastHitSoundTime < 0.03) return;
  _lastHitSoundTime = now;

  // ランダムで微妙にピッチ・長さをずらす
  const pitchVar = 0.8 + Math.random() * 0.4;   // ×0.8〜1.2
  const volVar   = 0.9 + Math.random() * 0.2;   // ×0.9〜1.1

  if (isCrit) {
    // ===== クリティカル: ざん＋キン =====
    const dur = 0.13;
    const noise = _makeNoise(dur);
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(5000 * pitchVar, now);
    filter.Q.value = 0.7;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.38 * volVar, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    noise.connect(filter); filter.connect(gain); gain.connect(masterGain);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
    noise.start(now);

    // キン（金属音）
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(2000 * pitchVar, now);
    osc.frequency.exponentialRampToValueAtTime(800 * pitchVar, now + 0.12);
    oscGain.gain.setValueAtTime(0.18 * volVar, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(oscGain); oscGain.connect(masterGain);
    osc.onended = () => { osc.disconnect(); oscGain.disconnect(); };
    osc.start(now); osc.stop(now + 0.12);
    return;
  }

  // ===== 通常ヒット: ざしゅ系（ピッチ・長さ・帯域をランダムに揺らす）=====
  const dur = 0.06 + Math.random() * 0.04;
  const freq = (3000 + Math.random() * 1500) * pitchVar;
  const q    = 0.6 + Math.random() * 0.5;

  const noise = _makeNoise(dur);
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freq, now);
  filter.Q.value = q;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.22 * volVar, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  noise.connect(filter); filter.connect(gain); gain.connect(masterGain);
  noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
  noise.start(now);
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

  // オフラインボーナス表示
  if (_pendingOfflineBonus) {
    const { secs, gold } = _pendingOfflineBonus;
    _pendingOfflineBonus = null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const timeStr = h > 0 ? `${h}時間${m}分` : m > 0 ? `${m}分${s}秒` : `${s}秒`;
    document.getElementById("offline-bonus-time").textContent = `放置時間: ${timeStr}`;
    document.getElementById("offline-bonus-gold").textContent = `+${fmt(gold)} G`;
    document.getElementById("offline-bonus-overlay").classList.add("active");
    updateStatsDisplay();
  }
}

function closeOfflineBonus() {
  document.getElementById("offline-bonus-overlay").classList.remove("active");
}

init();
