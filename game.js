'use strict';

/* ---------- Rules (pure, also loaded by test.js under node) ---------- */
const Paydirt = (() => {
  const SIZE = 6, ENERGY = 18, SECONDS = 60, PROBE_COST = 1, DIG_COST = 2;

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function neighbours(i) {
    const r = Math.floor(i / SIZE), c = i % SIZE, out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) out.push(nr * SIZE + nc);
    }
    return out;
  }

  // Later claims are leaner: 8 pay-dirt tiles at first, down to 5.
  function payCount(claimNo) { return Math.max(5, 8 - Math.floor((claimNo - 1) / 3)); }

  function newClaim(seed, claimNo = 1) {
    const rand = rng(seed);
    const tiles = Array.from({ length: SIZE * SIZE }, () => ({ pay: false, grams: 0, state: 'dirt', count: 0 }));
    const order = tiles.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const n = payCount(claimNo);
    order.slice(0, n).forEach((idx, k) => {
      tiles[idx].pay = true;
      // One mother lode per claim, the rest ordinary nuggets.
      tiles[idx].grams = Math.round((k === 0 ? 5 + rand() * 2 : 0.8 + rand() * 2.4) * 10) / 10;
    });
    tiles.forEach((t, i) => { t.count = neighbours(i).filter((j) => tiles[j].pay).length; });
    const available = Math.round(tiles.reduce((s, t) => s + t.grams, 0) * 10) / 10;
    return { tiles, energy: ENERGY, gold: 0, found: 0, pay: n, available, claimNo, seed };
  }

  function probe(claim, i) {
    const t = claim.tiles[i];
    if (!t || t.state !== 'dirt' || claim.energy < PROBE_COST) return null;
    claim.energy -= PROBE_COST;
    t.state = 'probed';
    return { count: t.count };
  }

  function dig(claim, i) {
    const t = claim.tiles[i];
    if (!t || t.state === 'empty' || t.state === 'gold' || claim.energy < DIG_COST) return null;
    claim.energy -= DIG_COST;
    if (!t.pay) { t.state = 'empty'; return { gold: 0, count: t.count }; }
    t.state = 'gold';
    claim.found++;
    claim.gold = Math.round((claim.gold + t.grams) * 10) / 10;
    return { gold: t.grams, count: t.count };
  }

  function isOver(claim) { return claim.energy < PROBE_COST || claim.found === claim.pay; }

  function grade(claim) {
    const share = claim.available ? claim.gold / claim.available : 0;
    if (share >= 0.85) return 'Bonanza';
    if (share >= 0.6) return 'Master Assayer';
    if (share >= 0.35) return 'Prospector';
    if (share > 0) return 'Pan Handler';
    return "Fool's Gold";
  }

  return { SIZE, ENERGY, SECONDS, PROBE_COST, DIG_COST, neighbours, payCount, newClaim, probe, dig, isOver, grade };
})();

if (typeof module !== 'undefined') module.exports = Paydirt;

/* ---------- Interface ---------- */
if (typeof document !== 'undefined') (() => {
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('paydirt.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('paydirt.' + k, JSON.stringify(v)); } catch { /* private mode */ } }
  };

  let claim = null, tool = 'probe', timeLeft = Paydirt.SECONDS, ticking = null, over = true;
  let claimNo = 1, purse = store.get('purse', 0), best = store.get('best', 0), muted = store.get('muted', false);
  let audio = null;

  function blip(freq, dur = 0.09, type = 'sine', vol = 0.06) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
      o.connect(g).connect(audio.destination);
      o.start(); o.stop(audio.currentTime + dur);
    } catch { /* audio unavailable */ }
  }

  function buildGrid() {
    const grid = $('grid');
    grid.textContent = '';
    claim.tiles.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'tile';
      b.type = 'button';
      b.dataset.i = i;
      grid.appendChild(b);
    });
    paint();
  }

  function paintTile(b, t, reveal) {
    b.className = 'tile ' + t.state + (reveal && t.pay && t.state !== 'gold' ? ' missed' : '');
    const r = Math.floor(b.dataset.i / Paydirt.SIZE) + 1, c = (b.dataset.i % Paydirt.SIZE) + 1;
    let label = `Row ${r}, column ${c}: `;
    if (t.state === 'gold') { b.innerHTML = '<span class="nugget"></span><span class="g">' + t.grams.toFixed(1) + 'g</span>'; label += `gold, ${t.grams} grams`; }
    else if (t.state === 'dirt') { b.innerHTML = reveal && t.pay ? '<span class="nugget ghost"></span>' : ''; label += reveal && t.pay ? 'missed pay dirt' : 'untouched dirt'; }
    else { b.innerHTML = `<span class="n n${Math.min(t.count, 4)}">${t.count}</span>`; label += `${t.state === 'probed' ? 'probed' : 'dug, empty'}, ${t.count} pay dirt nearby`; }
    b.setAttribute('aria-label', label);
    b.disabled = over || t.state === 'gold' || t.state === 'empty';
  }

  function paint(reveal = false) {
    [...$('grid').children].forEach((b, i) => paintTile(b, claim.tiles[i], reveal));
    $('gold').textContent = claim.gold.toFixed(1);
    $('found').textContent = `${claim.found}/${claim.pay}`;
    $('energy').textContent = claim.energy;
    $('pips').style.setProperty('--fill', (claim.energy / Paydirt.ENERGY * 100) + '%');
    $('time').textContent = Math.ceil(timeLeft);
    $('clock').style.setProperty('--fill', (timeLeft / Paydirt.SECONDS * 100) + '%');
    $('clock').classList.toggle('low', timeLeft <= 10);
    $('claimNo').textContent = claimNo;
    $('purse').textContent = purse.toFixed(1);
    $('best').textContent = best.toFixed(1);
    $('tool-dig').classList.toggle('broke', claim.energy < Paydirt.DIG_COST);
  }

  function setTool(t) {
    tool = t;
    $('tool-probe').setAttribute('aria-pressed', t === 'probe');
    $('tool-dig').setAttribute('aria-pressed', t === 'dig');
    $('grid').dataset.tool = t;
  }

  function float(b, text, cls) {
    const f = document.createElement('span');
    f.className = 'float ' + cls;
    f.textContent = text;
    b.appendChild(f);
    setTimeout(() => f.remove(), 900);
  }

  function act(i, forceTool) {
    if (over) return;
    const use = forceTool || tool, b = $('grid').children[i];
    const res = use === 'probe' ? Paydirt.probe(claim, i) : Paydirt.dig(claim, i);
    if (!res) {
      if (use === 'dig' && claim.energy < Paydirt.DIG_COST && claim.tiles[i].state !== 'gold' && claim.tiles[i].state !== 'empty') {
        $('pips').classList.remove('shake'); void $('pips').offsetWidth; $('pips').classList.add('shake');
        blip(140, 0.12, 'square', 0.04);
      }
      return;
    }
    if (!ticking) startClock();
    paint();
    if (use === 'probe') { blip(520 + res.count * 70, 0.08); }
    else if (res.gold) { float(b, '+' + res.gold.toFixed(1) + 'g', 'win'); blip(880, 0.1); setTimeout(() => blip(1320, 0.16), 90); if (navigator.vibrate) navigator.vibrate(25); }
    else { blip(180, 0.1, 'triangle'); }
    if (Paydirt.isOver(claim)) finish(claim.found === claim.pay ? 'Claim cleaned out' : 'Out of energy');
  }

  function startClock() {
    let last = performance.now();
    ticking = setInterval(() => {
      const now = performance.now();
      timeLeft = Math.max(0, timeLeft - (now - last) / 1000);
      last = now;
      $('time').textContent = Math.ceil(timeLeft);
      $('clock').style.setProperty('--fill', (timeLeft / Paydirt.SECONDS * 100) + '%');
      $('clock').classList.toggle('low', timeLeft <= 10);
      if (timeLeft <= 0) finish("Time's up");
    }, 100);
  }

  function finish(reason) {
    if (over) return;
    over = true;
    clearInterval(ticking); ticking = null;
    purse = Math.round((purse + claim.gold) * 10) / 10;
    const record = claim.gold > best;
    if (record) best = claim.gold;
    store.set('purse', purse); store.set('best', best);
    paint(true);
    $('r-reason').textContent = reason;
    $('r-grade').textContent = Paydirt.grade(claim);
    $('r-gold').textContent = claim.gold.toFixed(1) + ' g';
    $('r-found').textContent = `${claim.found} of ${claim.pay}`;
    $('r-left').textContent = (Math.round((claim.available - claim.gold) * 10) / 10).toFixed(1) + ' g';
    $('r-record').hidden = !record || claim.gold === 0;
    setTimeout(() => { $('report').hidden = false; $('next').focus(); }, params.has('replay') ? 0 : 650);
    if (claim.gold) { blip(660, 0.12); setTimeout(() => blip(990, 0.2), 120); }
  }

  function stake(advance) {
    if (advance) claimNo++;
    const seed = params.has('seed') ? +params.get('seed') + claimNo : (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    claim = Paydirt.newClaim(seed, claimNo);
    timeLeft = Paydirt.SECONDS; over = false;
    clearInterval(ticking); ticking = null;
    $('report').hidden = true; $('intro').hidden = true;
    setTool('probe');
    buildGrid();
  }

  $('grid').addEventListener('click', (e) => { const b = e.target.closest('.tile'); if (b) act(+b.dataset.i); });
  $('grid').addEventListener('contextmenu', (e) => { const b = e.target.closest('.tile'); if (b) { e.preventDefault(); act(+b.dataset.i, 'dig'); } });
  $('tool-probe').addEventListener('click', () => setTool('probe'));
  $('tool-dig').addEventListener('click', () => setTool('dig'));
  $('start').addEventListener('click', () => stake(false));
  $('next').addEventListener('click', () => stake(true));
  $('mute').addEventListener('click', () => { muted = !muted; store.set('muted', muted); $('mute').setAttribute('aria-pressed', muted); });
  $('mute').setAttribute('aria-pressed', muted);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') setTool('probe');
    if (e.key === 's' || e.key === 'S') setTool('dig');
  });

  // Preview board behind the intro card.
  claim = Paydirt.newClaim(1, 1);
  buildGrid();

  // Dev: ?seed=3&replay=p0,d7,... plays moves so a headless screenshot can show mid-game or end states.
  if (params.has('replay')) {
    stake(false);
    params.get('replay').split(',').filter(Boolean).forEach((m) => act(+m.slice(1), m[0] === 'd' ? 'dig' : 'probe'));
    if (params.has('end')) finish("Time's up");
    clearInterval(ticking);
  }
})();
