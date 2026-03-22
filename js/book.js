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
    const held   = state.inventory[item.id] || 0;
    const count  = state.itemsObtained[item.id] || held; // 累計（全周回）
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
        <span class="book-item-name">${unseen ? "???" : `${item.icon ?? ''} ${item.name}`}</span>
        ${!unseen ? `<span class="tier-badge tier-${tier}">${TIER_LABELS[tier]}</span>` : ""}
        <span class="book-item-count">${unseen ? "未入手" : `×${count}`}</span>
      </div>
      ${!unseen ? `
      <div class="book-base-stats">基本: ${statStr(item)}</div>
      <div class="book-tier-list">${tierRows}</div>
      ${itemInfoIcon(item.id)}` : ""}
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
        ? `<span class="multi-badge">連闘×${bossKills}</span>`
        : `<span class="multi-badge locked-multi">連闘まで${100 - bossKills}回</span>`;

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
        .map(d => {
          const name = ITEM_MAP[d.itemId]?.name ?? d.itemId;
          const pct  = Math.round(d.rate * 100);
          return `<span class="drop-row"><span class="drop-name">${name}</span><span class="drop-rate">${pct}%</span></span>`;
        })
        .join("");

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
        ${dropInfoIcon(enemyDef.drops)}
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
