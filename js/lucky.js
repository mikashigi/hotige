let _luckyOpen = false; // 運試し屋中はステージ効果音を止める

// ============================================================
// 🎰 運試し屋  ── パラメータ設定
// ============================================================
const LUCKY_CONFIG = {
  // ── コスト・初期G ティア ─────────────────────────────────
  tiers: [
    { cost:       1000, baseMin:    10, baseMax:    50 },
    { cost:      10000, baseMin:   100, baseMax:   500 },
    { cost:     100000, baseMin:  1000, baseMax:  5000 },
    { cost:    1000000, baseMin: 10000, baseMax: 50000 },
  ],

  // ── 各リールの当たり確率 ─────────────────────────────────
  //   3リール同時抽選。全当たりで続行、ゾロ目で超運試し突入
  //   はずれ混じりで終了、全はずれで復活確定（×10追加）
  jackpotChance: 0.80,   // ← ここを変える (0.0〜1.0)

  // ── 超運試しのループ確率 ──────────────────────────────────
  zoneLoopChance: 0.88,  // ← ここを変える (0.0〜1.0)

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

  // ── 期待値の目安（3リール版） ────────────────────────────
  // P(終了) = P(混合: 1か2つはずれ) = 0.480
  // 1スピン期待倍率加算（ゾーン込み, zoneLoop=0.88）≈ 18.2
  // E[倍率合計] = 18.2 / 0.480 ≈ 37.9
  // E[報酬] = 275 × 37.9 ≈ 10,400G（ゾーン入場補正込み）
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
    case 'zone_entry': {
      // 低音ドラム → 上昇ファンファーレ → 高音キラキラ
      tone(80,  now,        0.20, 0.25, 'sawtooth');
      tone(100, now + 0.08, 0.18, 0.20, 'sawtooth');
      [330, 440, 554, 659, 880, 1047, 1319].forEach((f, i) =>
        tone(f, now + 0.18 + i * 0.08, 0.35, 0.18, 'sine'));
      [1568, 2093, 2637].forEach((f, i) =>
        tone(f, now + 0.80 + i * 0.07, 0.30, 0.16, 'triangle'));
      break;
    }
    case 'zone_win':
      [784, 1047, 1319, 1568].forEach((f, i) => tone(f, now + i * 0.055, 0.28, 0.14)); break;
    case 'zone_exit':
      tone(523, now, 0.22, 0.15); tone(392, now + 0.12, 0.28, 0.18); tone(330, now + 0.26, 0.3, 0.22); break;
    case 'claim':
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
        tone(f, now + i * 0.055, 0.38, i < 5 ? 0.16 : 0.26)); break;
    case 'mega': {
      // 上昇スケール→頂点でキラキラ
      [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) =>
        tone(f, now + i * 0.055, 0.45, 0.22, 'sine'));
      // 高音キラキラ
      [2093, 2637, 3136].forEach((f, i) =>
        tone(f, now + 0.42 + i * 0.07, 0.28, 0.18, 'triangle'));
      break;
    }
    case 'revival_lock': {
      // 不穏な低音 → ドキドキ
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(masterGain);
      o.type = 'square';
      o.frequency.setValueAtTime(110, now);
      o.frequency.setValueAtTime(90,  now + 0.18);
      o.frequency.setValueAtTime(110, now + 0.36);
      g.gain.setValueAtTime(0.10, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      o.onended = () => { o.disconnect(); g.disconnect(); };
      o.start(now); o.stop(now + 0.52);
      break;
    }
    case 'revival_crash': {
      // 下降 → ドン！→ 上昇ファンファーレ
      const o2 = audioCtx.createOscillator();
      const g2 = audioCtx.createGain();
      o2.connect(g2); g2.connect(masterGain);
      o2.type = 'sawtooth';
      o2.frequency.setValueAtTime(600, now);
      o2.frequency.exponentialRampToValueAtTime(80, now + 0.25);
      g2.gain.setValueAtTime(0.22, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      o2.onended = () => { o2.disconnect(); g2.disconnect(); };
      o2.start(now); o2.stop(now + 0.30);
      // ファンファーレ
      [330, 440, 554, 660, 880].forEach((f, i) =>
        tone(f, now + 0.25 + i * 0.075, 0.35, 0.18, 'triangle'));
      break;
    }
    case 'spin_tick': {
      // リール回転中のカチカチ音
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(masterGain);
      o.type = 'square';
      o.frequency.setValueAtTime(900, now);
      o.frequency.exponentialRampToValueAtTime(500, now + 0.018);
      g.gain.setValueAtTime(0.055, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.022);
      o.onended = () => { o.disconnect(); g.disconnect(); };
      o.start(now); o.stop(now + 0.025);
      break;
    }
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
  const count   = type === 'mega' ? 55 : type === 'super' ? 24 : type === 'claim' ? 30 : 14;
  const symbols = type === 'mega'  ? ['🪙','🪙','🪙','★','💰','✨','🌟','💎']
                : type === 'claim' ? ['🪙','🪙','★','✦'] : ['★','✦','◆','●'];
  const colors  = type === 'mega'
    ? ['#ffd700','#ffaa00','#ff5050','#ff44cc','#44ddff','#aaff44','#ffffff']
    : type === 'super'
    ? ['#ffd700','#ffaa00','#ffee44','#ff8800']
    : type === 'claim'
    ? ['#f0c030','#44dd88','#60a0ff','#ffaa40']
    : ['#ffcc40','#ff90c0','#80d0ff','#a0e080'];

  for (let i = 0; i < count; i++) {
    const el    = document.createElement('span');
    el.className = 'lk-particle';
    el.textContent = symbols[i % symbols.length];
    const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.8;
    const speed = 70 + Math.random() * (type === 'mega' ? 200 : type === 'super' ? 130 : 80);
    const dx    = Math.cos(angle) * speed;
    const dy    = Math.sin(angle) * speed * 0.55 - (30 + Math.random() * (type === 'mega' ? 90 : 50));
    const dur   = (type === 'mega' ? 900 : 600) + Math.random() * 400;
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

let _luckyTierIdx  = 1;  // デフォルト: 10,000G ティア
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
  let h = `<span class="lk-base">${_luckyBase}🪙</span>`;
  if (_luckyMults.length) {
    const sum = _luckyMults.reduce((s, m) => s + m, 0);
    // 4個以上は内訳を省略して合計値だけ表示（1行に収める）
    const sumStr = _luckyMults.length <= 3
      ? (_luckyMults.length === 1 ? `${sum}` : `(${_luckyMults.join(' + ')})`)
      : `${sum} <span class="lk-count">${_luckyMults.length}連</span>`;
    h += ` <span class="lk-op">×</span><span class="lk-mult">${sumStr}</span>`;
    h += ` <span class="lk-op">=</span><span class="lk-total">${fmt(_luckyBase * sum)}🪙</span>`;
  }
  return `<div class="lk-formula">${h}</div>`;
}

function openLucky() {
  _luckyOpen = true;
  // 進行中のセッションがあればそのまま再表示、なければ新規
  if (!_luckyPhase || _luckyPhase === 'idle') {
    _luckyPhase    = 'idle';
    _luckyBase     = 0;
    _luckyMults    = [];
    _luckySpinning = false;
  }
  _renderLucky();
  document.getElementById('modal-lucky').style.display = 'flex';
}

function closeLucky() {
  if (_luckySpinning) return;
  _luckyOpen = false;
  // done なら状態をリセット（クレーム済み or 受け取らず閉じた場合）
  if (_luckyPhase === 'done') {
    _luckyPhase = null;
    _luckyBase  = 0;
    _luckyMults = [];
  }
  // 進行中（base/mult/zone）は状態を保持したまま非表示
  document.querySelector('.lucky-modal-box')?.classList.remove('lk-zone-active', 'lk-mega-active');
  document.getElementById('modal-lucky').style.display = 'none';
}

function _renderLucky() {
  const body = document.getElementById('lucky-body');
  if (!body) return;

  // 常に同じ構造: [フォーミュラ行] [中央コンテンツ] [ボタン行]
  let centerHtml = '';
  let btnsHtml   = '';

  if (_luckyPhase === 'idle') {
    const tier = LUCKY_CONFIG.tiers[_luckyTierIdx];
    const ok = state.gold >= tier.cost;
    const tierBtns = LUCKY_CONFIG.tiers.map((t, i) =>
      `<button class="lk-tier-btn${i === _luckyTierIdx ? ' active' : ''}" onclick="_setLuckyTier(${i})">${fmtShop(t.cost)}</button>`
    ).join('');
    centerHtml = `
      <div class="lk-tier-row">${tierBtns}</div>
      <div class="lk-cost-line">1回 <strong>${fmt(tier.cost)}🪙</strong></div>
      <div class="lk-hint">初期🪙を抽選後、3リールで倍率を同時抽選！<br>全当たりで続行・ゾロ目で超運試し突入<br>はずれ混じりで終了・全はずれは復活確定</div>`;
    btnsHtml = `
      <button class="lk-btn lk-btn-start" onclick="luckyStart()" ${ok ? '' : 'disabled'}>🎰 挑戦する</button>
      ${!ok ? `<div class="lk-nogold">🪙不足（所持: ${fmt(state.gold)}🪙）</div>` : ''}`;

  } else if (_luckyPhase === 'zone') {
    centerHtml = `
      <div class="lk-zone-header">🌟 超運試し 🌟</div>
      <div class="lk-slot-box"><div class="lk-reel lk-reel-zone" id="lk-reel">?×</div></div>
      <div class="lk-msg" id="lk-msg"></div>`;
    setTimeout(_doZoneSpin, 350);

  } else if (_luckyPhase === 'base') {
    centerHtml = `
      <div class="lk-slot-label">初期🪙 抽選（${fmt(LUCKY_CONFIG.tiers[_luckyTierIdx].baseMin)} 〜 ${fmt(LUCKY_CONFIG.tiers[_luckyTierIdx].baseMax)}）</div>
      <div class="lk-slot-box"><div class="lk-reel" id="lk-reel">?</div></div>
      <div class="lk-msg" id="lk-msg"></div>`;
    if (!_luckySpinning) {
      btnsHtml = `<button class="lk-btn lk-btn-spin" onclick="luckySpin()">🎲 スピン！</button>`;
    }

  } else if (_luckyPhase === 'mult') {
    const multMin = LUCKY_CONFIG.multTable[0][0];
    const multMax = LUCKY_CONFIG.multTable[LUCKY_CONFIG.multTable.length - 1][0];
    centerHtml = `
      <div class="lk-slot-label">倍率 抽選（× ${multMin} 〜 ${multMax}）大当たり ${Math.round(LUCKY_CONFIG.jackpotChance*100)}%</div>
      <div class="lk-triple-slot-box">
        <div class="lk-reel" id="lk-reel-0">?×</div>
        <div class="lk-reel" id="lk-reel-1">?×</div>
        <div class="lk-reel" id="lk-reel-2">?×</div>
      </div>
      <div class="lk-msg" id="lk-msg"></div>`;
    if (!_luckySpinning) {
      btnsHtml = `<button class="lk-btn lk-btn-spin" onclick="luckySpin()">🎲 スピン！</button>`;
    }

  } else if (_luckyPhase === 'done') {
    const reward = _luckyTotal();
    const megaCls = reward >= LUCKY_CONFIG.tiers[_luckyTierIdx].cost * 2 ? ' lk-mega' : '';
    centerHtml = `
      <div class="lk-done-label">獲得🪙</div>
      <div class="lk-done-amount${megaCls}">${fmt(reward)}🪙</div>`;
    btnsHtml = `<button class="lk-btn lk-btn-claim" onclick="luckyClaim()">✨ 受け取る</button>`;
  }

  body.innerHTML = `
    ${_luckyFormulaHtml()}
    <div class="lk-center">${centerHtml}</div>
    <div class="lk-btns">${btnsHtml}</div>`;

  // ゾーン中はモーダル枠を金色に光らせる
  const _lkBox = document.querySelector('.lucky-modal-box');
  if (_lkBox) {
    _lkBox.classList.toggle('lk-zone-active', _luckyPhase === 'zone');
    _lkBox.classList.toggle('lk-mega-active', _luckyPhase === 'done' && _luckyTotal() >= LUCKY_CONFIG.tiers[_luckyTierIdx].cost * 2);
  }
}

function _setLuckyTier(idx) {
  _luckyTierIdx = idx;
  _renderLucky();
}

function luckyStart() {
  const tier = LUCKY_CONFIG.tiers[_luckyTierIdx];
  if (state.gold < tier.cost || _luckySpinning) return;
  _luckyBase     = 0;
  _luckyMults    = [];
  _luckyPhase    = 'base';
  _luckySpinning = false;
  _renderLucky();
}

function luckySpin() {
  if (_luckySpinning) return;
  _luckySpinning = true;

  if (_luckyPhase === 'base') {
    // ── ベース抽選（1リール）──────────────────────────────
    const _t = LUCKY_CONFIG.tiers[_luckyTierIdx];
    const finalVal = Math.floor(Math.random() * (_t.baseMax - _t.baseMin + 1)) + _t.baseMin;
    _renderLucky();
    const reel = document.getElementById('lk-reel');
    if (!reel) { _luckySpinning = false; return; }
    _animateLuckyReel(reel, true, finalVal, () => {
      _luckySpinning = false;
      _luckyBase  = finalVal;
      _luckyPhase = 'mult';
      _playLuckySfx('base');
      const msg = document.getElementById('lk-msg');
      if (msg) msg.innerHTML = `<span class="lk-msg-base">ベース🪙: ${fmt(finalVal)}🪙 確定！</span>`;
      setTimeout(_renderLucky, 900);
    });

  } else if (_luckyPhase === 'mult') {
    // ── 3リール同時抽選 ──────────────────────────────────
    _spinTriple();
  }
}

// ── 3リール同時スピン ───────────────────────────────────────────
function _spinTriple() {
  _renderLucky(); // 3リール表示（ボタン非表示）
  const reels = [0, 1, 2].map(i => document.getElementById(`lk-reel-${i}`));
  if (reels.some(r => !r)) { _luckySpinning = false; return; }

  // 各リールの結果を決定（superChance 撤廃・ゾロ目がゾーン入り条件）
  const draws = [0, 1, 2].map(() => {
    const val   = _drawMult();
    const isHit = Math.random() < LUCKY_CONFIG.jackpotChance;
    return { val, isHit };
  });

  // スタガードアニメーション: 0ms / 250ms / 500ms ずらして開始
  let done = 0;
  draws.forEach((draw, i) => {
    setTimeout(() => {
      _animateLuckyReel(reels[i], false, draw.isHit ? draw.val : null, () => {
        done++;
        if (done === 3) _evalTriple(draws, reels);
      }, 1100 + i * 100);
    }, i * 250);
  });
}

// ── 3リール結果評価 ─────────────────────────────────────────────
function _evalTriple(draws, reels) {
  _luckySpinning = false;
  const hits   = draws.filter(d => d.isHit);
  const misses = draws.filter(d => !d.isHit);
  const msg    = document.getElementById('lk-msg');

  if (misses.length === 3) {
    // 全はずれ → 復活確定
    _playLuckySfx('miss');
    const box = document.querySelector('.lucky-modal-box');
    if (box) { box.classList.add('lk-shake'); setTimeout(() => box.classList.remove('lk-shake'), 500); }
    if (msg) msg.innerHTML = `<span class="lk-miss-msg">💔 全はずれ… 復活！</span>`;
    setTimeout(_luckyRevival, 900);

  } else if (misses.length > 0) {
    // はずれ混じり → 当たり分を取得して終了
    hits.forEach(d => _luckyMults.push(d.val));
    // はずれリールをグレーアウト
    draws.forEach((d, i) => { if (!d.isHit) reels[i].classList.add('lk-reel-dead'); });
    _playLuckySfx('jackpot');
    if (hits.length) _luckyParticleBurst('jackpot');
    const hitStr = hits.length ? hits.map(d => `×${d.val}`).join('・') + ' 取得！' : '';
    if (msg) msg.innerHTML = `<span class="lk-miss-msg">💔 はずれあり… ${hitStr}</span>`;
    _luckyPhase = 'done';
    setTimeout(_renderLucky, 1500);

  } else {
    // 全当たり
    draws.forEach(d => _luckyMults.push(d.val));
    const isZoroi = draws[0].val === draws[1].val && draws[1].val === draws[2].val;
    if (isZoroi) {
      // ゾロ目 → 超運試し突入
      _handleZoroi(draws[0].val, reels);
    } else {
      _playLuckySfx('jackpot');
      _luckyParticleBurst('jackpot');
      if (msg) msg.innerHTML = `<span class="lk-jackpot-msg">🎉 大当たり！ ${draws.map(d => `×${d.val}`).join('・')}！</span>`;
      setTimeout(_renderLucky, 1100);
    }
  }
}

// ── ゾロ目演出 → 超運試し突入 ─────────────────────────────────
function _handleZoroi(val, reels) {
  const msg  = document.getElementById('lk-msg');
  const body = document.getElementById('lucky-body');

  // Step1: 全リールをゾロ目フラッシュ + パーティクル
  reels.forEach(r => {
    r.classList.add('lk-reel-super', 'lk-zoroi-flash');
    setTimeout(() => r.classList.remove('lk-zoroi-flash'), 700);
  });
  if (msg) msg.innerHTML = `<span class="lk-jackpot-msg">✨ ゾロ目！ ×${val} × 3！</span>`;
  _playLuckySfx('super');
  _luckyParticleBurst('super');

  // Step2: 800ms 後に突入演出オーバーレイを表示
  setTimeout(() => {
    if (body) {
      // 突入テキストオーバーレイを body 上に重ねる
      const overlay = document.createElement('div');
      overlay.className = 'lk-zone-entry-overlay';
      overlay.id = 'lk-zone-entry-overlay';
      overlay.innerHTML = `
        <div class="lk-zone-entry-title">🌟 超運試し 🌟<br>突　入！！</div>
        <div class="lk-zone-entry-sub">継続率 ${Math.round(LUCKY_CONFIG.zoneLoopChance * 100)}%</div>`;
      body.appendChild(overlay);
    }
    // モーダル枠フラッシュ
    const lkBox = document.querySelector('.lucky-modal-box');
    if (lkBox) {
      lkBox.classList.add('lk-zone-entry-flash');
      setTimeout(() => lkBox.classList.remove('lk-zone-entry-flash'), 1900);
    }
    _playLuckySfx('zone_entry');
    _luckyParticleBurst('super');
    _luckyParticleBurst('super');

    // Step3: 1.8s 後にゾーンフェーズへ
    setTimeout(() => {
      _luckyPhase    = 'zone';
      _zoneSpinCount = 0;
      _renderLucky();
    }, 1800);
  }, 800);
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
      _reelSetValue(el, `${r}×`);
      _playLuckySfx('spin_tick');
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

// ── 復活演出 ─────────────────────────────────────────────────────
function _luckyRevival() {
  // mult フェーズでは lk-reel-0/1/2、zone フェーズでは lk-reel
  const reel = document.getElementById('lk-reel-0') || document.getElementById('lk-reel');
  const msg  = document.getElementById('lk-msg');
  if (!reel) return;

  // 3リール表示中なら他2つをフェードアウト
  [1, 2].forEach(i => {
    const r = document.getElementById(`lk-reel-${i}`);
    if (r) r.style.transition = 'opacity 0.4s', r.style.opacity = '0.15';
  });

  // Step1: リールロック（赤枠ドキドキ）
  reel.classList.remove('lk-reel-miss');
  reel.classList.add('lk-reel-lock');
  if (msg) msg.innerHTML = '';
  _playLuckySfx('revival_lock');

  // Step2: 0.5s 後に高速上スクロール開始
  const scrollSymbols = ['はずれ','2×','はずれ','5×','はずれ','3×','はずれ','10×'];
  let si = 0;
  setTimeout(() => {
    reel.classList.remove('lk-reel-lock');
    reel.classList.add('lk-reel-revival');
    if (msg) msg.innerHTML = '';

    const spinTimer = setInterval(() => {
      reel.textContent = scrollSymbols[si % scrollSymbols.length];
      si++;
      _playLuckySfx('spin_tick');
    }, 90);

    // Step3: 1.4s 後にがしゃーん！ 10× で止める
    setTimeout(() => {
      clearInterval(spinTimer);
      reel.classList.remove('lk-reel-revival');
      reel.textContent = '10×';
      reel.classList.add('lk-reel-crash');

      // フラッシュ
      const body = document.getElementById('lucky-body');
      if (body) {
        body.classList.add('lk-revival-flash');
        setTimeout(() => body.classList.remove('lk-revival-flash'), 500);
      }
      // パーティクル
      _luckyParticleBurst('jackpot');
      _playLuckySfx('revival_crash');

      if (msg) msg.innerHTML = `<span class="lk-revival-msg">💥 復活！ ×10 追加！！</span>`;

      // Step4: 1s 後に mult フェーズへ復帰
      setTimeout(() => {
        _luckyMults.push(10);
        reel.classList.remove('lk-reel-crash');
        _luckyPhase = 'mult';
        _luckySpinning = false;
        _renderLucky();
      }, 1100);
    }, 1400);
  }, 500);
}

// リールに値をセットしてスライドアニメを再生
function _reelSetValue(el, text) {
  el.textContent = text;
  el.style.animation = 'none';
  // 強制リフロー後に再セットしてアニメをリスタート
  void el.offsetWidth;
  el.style.animation = 'lkReelSlide 0.05s ease-out';
}

function _animateLuckyReel(el, isBase, finalVal, cb, duration = 1500) {
  // finalVal: 数値(当選) | null(はずれ)
  const min = isBase ? LUCKY_CONFIG.tiers[_luckyTierIdx].baseMin : LUCKY_CONFIG.multTable[0][0];
  const max = isBase ? LUCKY_CONFIG.tiers[_luckyTierIdx].baseMax : LUCKY_CONFIG.multTable[LUCKY_CONFIG.multTable.length - 1][0];
  const startTime = performance.now();
  let lastUpdate = 0;
  el.classList.remove('lk-reel-land', 'lk-reel-miss', 'lk-reel-super');
  el.classList.add('lk-reel-spinning');

  const frame = (now) => {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) {
      el.classList.remove('lk-reel-spinning');
      el.style.animation = '';
      if (finalVal !== null) {
        _reelSetValue(el, isBase ? `${finalVal}` : `${finalVal}×`);
        el.classList.add('lk-reel-land');
      } else {
        _reelSetValue(el, 'はずれ');
        el.classList.add('lk-reel-miss');
      }
      setTimeout(cb, 450);
      return;
    }

    // 高速(40ms)→低速(220ms)へ滑らかに変化
    const interval = 40 + 180 * Math.pow(progress, 1.6);
    if (now - lastUpdate >= interval) {
      const r = Math.floor(Math.random() * (max - min + 1)) + min;
      _reelSetValue(el, isBase ? `${r}` : `${r}×`);
      _playLuckySfx('spin_tick');
      lastUpdate = now;
    }

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

function luckyClaim() {
  const reward = _luckyTotal();
  if (reward >= LUCKY_CONFIG.tiers[_luckyTierIdx].cost * 2) {
    _playLuckySfx('mega');
    _luckyParticleBurst('mega');
    const _lkBox = document.querySelector('.lucky-modal-box');
    if (_lkBox) {
      _lkBox.classList.add('lk-mega-flash');
      setTimeout(() => _lkBox.classList.remove('lk-mega-flash'), 700);
    }
  } else {
    _playLuckySfx('claim');
    _luckyParticleBurst('claim');
  }
  const _tc = LUCKY_CONFIG.tiers[_luckyTierIdx].cost;
  state.gold += reward - _tc;
  updateShopDisplay();
  autoSave();
  const net = reward - _tc;
  addSystemLog(`🎰 運試し屋: ${fmt(reward)}🪙 獲得（コスト差引 ${net >= 0 ? '+' : ''}${fmt(net)}🪙）`);
  closeLucky();
}

