// --- セーブ / ロード ---
const SAVE_KEY = "hotige_save";
const elSaveIndicator = document.getElementById("save-indicator");
let saveIndicatorTimer = null;

function showSaveIndicator() {
  elSaveIndicator.classList.add("show");
  clearTimeout(saveIndicatorTimer);
  saveIndicatorTimer = setTimeout(() => elSaveIndicator.classList.remove("show"), 1500);
}

let _pendingOfflineBonus = null; // { secs, gold }

function saveData() {
  localStorage.setItem(SAVE_KEY, JSON.stringify({
    lastSavedAt: Date.now(),
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
    bestMapIndex:    state.bestMapIndex,
    consumables:     state.consumables,
    pendingBatch:    state.pendingBatch,
    batchFromTicket: state.batchFromTicket,
    clearPoints:     state.clearPoints,
    skills:          state.skills,
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
  state.bestMapIndex    = data.bestMapIndex    ?? state.mapIndex;
  state.consumables     = data.consumables     || {};
  state.pendingBatch    = data.pendingBatch    || false;
  state.batchFromTicket = data.batchFromTicket || false;
  state.clearPoints     = data.clearPoints     ?? 0;
  state.skills          = data.skills          || {};
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

  // オフラインボーナス計算（前回セーブから60秒以上経過していた場合）
  if (data.lastSavedAt) {
    const offlineSecs = Math.min((Date.now() - data.lastSavedAt) / 1000, 43200); // 最大12時間
    if (offlineSecs >= 60) {
      const mult       = Math.pow(2, state.bestMapIndex);
      const goldPerSec = 5 * mult * 0.5; // 最高到達マップ基準・50%効率
      const bonus      = Math.max(1, Math.floor(offlineSecs * goldPerSec));
      state.gold            += bonus;
      state.totalGoldEarned += bonus;
      _pendingOfflineBonus = { secs: Math.floor(offlineSecs), gold: bonus };
    }
  }

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
    addSystemLog("🎫 連闘チケットを返却しました");
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
