/* Technical report page.
   One master clock per viewer, 48 half-hour ticks over 24 hours. Layers map the
   current tick to their own frame index, so a three-hour layer holds each frame
   for six ticks and stays aligned with the half-hour layers rather than drifting. */

// Page language: index.ko.html sets <html lang="ko">. t() returns the Korean text of an English
// string (the English text is the key) and fills its {0}, {1}, ... placeholders.
const LANG = (document.documentElement.lang || 'en').toLowerCase().startsWith('ko') ? 'ko' : 'en';
const KO = {
  // exhibits, units and status
  'Fig. {0}.': '그림 {0}.', 'Table {0}.': '표 {0}.',
  'MAE and CRPS in mm per three hours.': 'MAE와 CRPS의 단위는 3시간당 mm이다.',
  'not yet available': '아직 없음',
  'loading {0} frames': '프레임 {0}개 불러오는 중',
  '{0} of {1} frames failed to load': '프레임 {1}개 중 {0}개를 불러오지 못했다',
  // regions and case viewer
  'South Korea': '한국', 'Indonesia': '인도네시아', 'Philippines': '필리핀', 'Ghana': '가나', 'Tonga': '통가',
  '{0} cases': '{0} 사례',
  '{0}, {1}–24:00 UTC': '{0} {1}–24:00 UTC', '{0}, {1} – {2}, {3} UTC': '{0} {1} – {2} {3} UTC',
  'Play': '재생', 'Pause': '일시정지',
  'AWS stations': 'AWS 관측소', 'Estate gauges': '농장 우량계', '{0}, 48 km zoom': '{0}, 48 km 확대',
  'no observation': '관측 없음',
  'Divider between IFS and {0}, {1}': 'IFS와 {0} 사이 구분선, {1}',
  // display names of models, layers and stations
  'SpateGAN-IFS, second run': 'SpateGAN-IFS, 두 번째 학습 실행', 'CEDDAR, second run': 'CEDDAR, 두 번째 학습 실행',
  'Published SpateGAN': '공개 SpateGAN', 'Radar': '레이더', 'PAGASA radar': 'PAGASA 레이더',
  'AWS station': 'AWS 관측소', 'Gauge': '우량계',
  'Without GFS pretraining': 'GFS 사전학습 없음', 'With GFS pretraining': 'GFS 사전학습 있음', '{0}, run {1}': '{0}, 실행 {1}',
  // station chart
  'Station': '관측소', '{0} {1} · {2} in 24 h': '{0} {1} · 24 h 누적 {2}',
  '24-hour total at this station: ': '이 관측소의 24시간 누적: ',
  'Time (UTC)': '시간 (UTC)', 'Rain so far (mm)': '누적 강수량 (mm)',
  // tables: headers
  'Model': '모델', 'Ensemble FSS': '앙상블 FSS', 'Ensemble FSS ↑': '앙상블 FSS ↑',
  'One training sample': '학습 샘플 1개', 'IFS training samples': 'IFS 학습 샘플',
  'Validation samples': '검증 샘플', 'Reserved test samples': '독립 시험 샘플',
  'Validation block': '검증 구간', 'Start': '시작', 'End': '종료',
  'Training per stage': '단계별 학습량', 'Batch size': '배치 크기', 'Time per stage': '단계별 소요 시간',
  'GPU-hours, all runs': 'GPU 시간, 전체 실행',
  'Parameters (M)': '파라미터 (M)', 'GFLOPs per<br>sample (est.)': '샘플당<br>GFLOPs (추정)',
  'Inference per<br>sample (s)': '샘플당<br>추론 시간 (s)', 'Peak GPU<br>memory (GiB)': '최대 GPU<br>메모리 (GiB)',
  'Inference per<br>case (s)': '사례당<br>추론 시간 (s)',
  'Threshold (mm/hour)': '임계값 (mm/h)', 'As a three-hour amount (mm)': '3시간 누적량 (mm)',
  'Ensemble spread (mm/3 h)': '앙상블 퍼짐 (mm/3 h)', '10–90% interval coverage': '10–90% 구간 포함률',
  'Group': '그룹', 'Stage 1 (GFS)': '1단계 (GFS)', 'Stage 2 (IFS)': '2단계 (IFS)',
  'Split': '분할', 'Dates': '기간', 'SpateGAN samples': 'SpateGAN 샘플', 'CEDDAR samples': 'CEDDAR 샘플',
  'Run': '실행', 'FSS without GFS': 'FSS (GFS 없음)', 'FSS with GFS': 'FSS (GFS 있음)',
  'Δ|volume bias|': 'Δ|총량 편향|', 'Step': '스텝', '{0} (pick)': '{0} (선택)',
  // tables: cells (data-metrics.js)
  'None (IFS training pool only)': '없음 (IFS 학습 풀만)', 'IFS training pool': 'IFS 학습 풀',
  'All eligible GFS, 2021–2023': '사용 가능한 GFS 전체, 2021–2023', 'Same IFS training pool': '같은 IFS 학습 풀',
  'GFS pretraining': 'GFS 사전학습', 'IFS training': 'IFS 학습', 'Validation': '검증', 'Reserved test': '독립 시험',
  'Feb 2024 – Sep 2025': '2024년 2월 – 2025년 9월', 'Four 8-day blocks, 2025': '2025년, 8일 구간 4개',
  'Cycles 28 Sep – 31 Dec 2025': '2025년 9월 28일 – 12월 31일 예보 사이클',
  '1,000 steps': '1,000 스텝', '60 epochs': '60 에포크', '1 x V100 or A100': '1 x V100 또는 A100',
  'about 1.3–2.7 h': '약 1.3–2.7 h', 'about 1.4–3.3 h': '약 1.4–3.3 h',
  'A 48-hour input sequence paired with a central 24-hour rainfall sequence': '48시간 입력 시퀀스와 중앙 24시간 강수 시퀀스의 쌍',
  'One paired three-hour rainfall field': '짝지은 3시간 강수장 1개',
  'Winter': '겨울', 'Spring': '봄', 'Summer': '여름', 'Autumn': '가을',
  // charts
  'Ens. FSS': '앙상블 FSS', 'Rain ratio': '강수량 비율', 'Frequency bias': '빈도 편향',
  '{0} better than IFS': 'IFS 대비 {0} 향상', '{0} worse than IFS': 'IFS 대비 {0} 저하',
  '1.0 = same as observed': '1.0 = 관측과 같음', 'model ÷ observed': '모델 ÷ 관측',
  'produces {0}% more than observed': '관측보다 {0}% 많이 생성', 'produces {0}% less than observed': '관측보다 {0}% 적게 생성',
  'Metric': '지표', 'Interval': '간격', '30 minutes': '30분', '3 hours': '3시간',
  'Forecast lead time (hours after the forecast was issued)': '예보 선행 시간 (예보 발표 후 경과 시간)', 'Lead': '선행 시간',
  'Rainfall threshold (mm per hour)': '강수 임계값 (mm/h)', 'Threshold': '임계값',
  'Show': '표시', 'Difference from IFS': 'IFS와의 차이', 'FSS value': 'FSS 값',
  'Blue cells: better than IFS; orange cells: worse.': '파란 칸은 IFS보다 좋고, 주황 칸은 나쁘다.',
  'Darker cells: higher FSS.': '진한 칸일수록 FSS가 높다.'
};
const t = (s, ...args) => {
  const text = LANG === 'ko' && Object.hasOwn(KO, s) ? KO[s] : s;
  return args.length ? text.replace(/\{(\d)\}/g, (_, i) => args[i]) : text;
};

const TICKS = 48;            // 24 h at 30 min
const TICK_MIN = 30;
const PENDING = `<span class="pending" title="${t('not yet available')}">&ndash;</span>`;

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const fmt4 = v => (v == null ? PENDING : v.toFixed(4));
// Keep parenthetical label notes together when wrapping.
const noBreakParens = s => s.replace(/\([^)]*\)\*?/g, m => '<span class="nb">' + m + '</span>');
const datasetLabel = s => s.replace(/PEAK_HSP/g, 'PEAK<sub>HSP</sub>');
// One display name per model or layer, used wherever a name is shown (panels, layer chips,
// table rows, chart and station legends, compare tags). Data keys stay unchanged.
const DISPLAY_NAMES = {
  'SpateGAN-IFS (seed 43)': 'SpateGAN-IFS, second run',
  'CEDDAR-IFS': 'CEDDAR', 'CEDDAR-IFS (supplementary)': 'CEDDAR', 'CEDDAR-IFS (seed 505)': 'CEDDAR, second run',
  'SpateGAN-ERA5': 'Published SpateGAN',
  'PEAK_HSP (target)': 'Radar', 'PEAK_HSP': 'Radar',
  'PAGASA radar (provisional)': 'PAGASA radar'
};
const displayName = s => t(DISPLAY_NAMES[s] || String(s));
// Model labels carry their training variant after "_" (SpateGAN-IFS_GFS-100); render it
// as a subscript, keeping the selected-model star outside. Plain text (dropdowns) uses "-".
const modelLabel = s => datasetLabel(displayName(s)).replace(/_([^\s*<]+)(\*?)/g, '<sub>$1</sub>$2');
const plainLabel = s => displayName(s).replace(/_/g, '-');
// GFS runs: seed 42 / 504 is run 1, seed 43 / 505 is run 2.
const runNumber = seed => (/^(42|504)$/.test(String(seed)) ? 1 : /^(43|505)$/.test(String(seed)) ? 2 : seed);
const gfsGroup = g => g === 'GFS-0' ? t('Without GFS pretraining') : g === 'GFS-100' ? t('With GFS pretraining') : g;
const gfsRun = s => String(s).replace(/^(GFS-0|GFS-100), seed (\d+)$/, (_, g, seed) => t('{0}, run {1}', gfsGroup(g), runNumber(seed)));
// Case-layer and case display names come from build-cases.py (LAYERS and the case label file).
// The final operational model; CEDDAR-IFS is supplementary and off by default.
const FINAL_MODEL = 'SpateGAN-IFS';
const REGION_NAMES = { kr: 'South Korea', ind: 'Indonesia', ph: 'Philippines', gh: 'Ghana', to: 'Tonga' };
// Generated scores (build-metrics.py, data-leadtime.js) join the hand-maintained tables.
if (window.SCORES) Object.assign(window.METRICS, window.SCORES);
const pad = n => String(n).padStart(2, '0');

function addMinutes(iso, mins) {
  return new Date(Date.parse(iso) + mins * 60000);
}
// Korean dates read "2025년 7월 16일"; times stay in UTC.
const koDay = d => `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
const dateLabel = d => LANG === 'ko' ? koDay(d) : `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const hourLabel = d => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
function clockLabel(d) {
  return `${dateLabel(d)} ${hourLabel(d)} UTC`;
}
// A case's short name and title; the Korean page uses label_ko and title_ko from data-cases.js.
const caseLabel = c => (LANG === 'ko' && c.label_ko) || c.label || c.id;
const caseTitle = c => (LANG === 'ko' && c.title_ko) || c.title || caseLabel(c);
// A case's date, shown apart from its short name: the start of its UTC window.
const caseStart = c => new Date(Date.parse((c.window && c.window[0]) || c.start));
const caseDate = c => dateLabel(caseStart(c));
// A case's UTC window for the viewer meta line: "16 Jul 2025, 00:00–24:00 UTC", or with both
// dates when the window starts mid-day: "10 May 2025, 12:00 – 11 May 2025, 12:00 UTC".
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayLabel = d => LANG === 'ko' ? koDay(d) : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
function caseRange(c) {
  const a = caseStart(c);
  const b = c.window && c.window[1] ? new Date(Date.parse(c.window[1])) : addMinutes(a.toISOString(), 24 * 60);
  if (hourLabel(b) === '00:00' && b - a <= 864e5 && dayLabel(addMinutes(b.toISOString(), -1)) === dayLabel(a)) {
    return t('{0}, {1}–24:00 UTC', dayLabel(a), hourLabel(a));
  }
  return t('{0}, {1} – {2}, {3} UTC', dayLabel(a), hourLabel(a), dayLabel(b), hourLabel(b));
}

/* ------------------------------------------------------------------ viewer */



// Panels and layer buttons are ordered by role, then by the layer's own order.
const ROLE_RANK = { input: 0, model: 1, target: 2, observed: 3, product: 4 };
const byRole = (a, b) => ((ROLE_RANK[a.role] ?? 5) - (ROLE_RANK[b.role] ?? 5)) || ((a.order || 0) - (b.order || 0));

class CaseViewer {
  constructor(mount, { region, domain, cases, layers }) {
    this.mount = mount;
    this.region = region;
    this.domain = domain;
    this.only = layers;   // optional list of layer keys for the main-report viewers
    this.cases = window.CASES.filter(c => c.region === region && (!cases || cases.includes(c.id)));
    this.caseIdx = 0;
    this.tick = 0;
    this.playing = false;
    this.msPerTick = 200;
    this.acc = 0;
    this.last = 0;
    this.panels = [];

    const first = this.layersFor(this.cases[0]);
    // Start with the default layers (a listed layer that is off by default stays a toggle).
    this.active = new Set(first.filter(l => l.def.default).map(l => l.key));

    this.render();
    this.rebuildPanels();

    this.io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      this.io.disconnect();
      this.near = true;
      this.preload();
    }, { rootMargin: '600px 0px' });
    this.io.observe(this.mount);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  layersFor(c) {
    return Object.entries(c.layers)
      .filter(([key, def]) => def.domain === this.domain && (!this.only || this.only.includes(key)))
      // The Philippine radar is a visual reference, not a scoring target.
      .map(([key, def]) => ({ key, def: key === 'radar-mp' && def.role === 'target' ? Object.assign({}, def, { role: 'observed' }) : def }))
      .sort((a, b) => byRole(a.def, b.def));
  }

  get current() { return this.cases[this.caseIdx]; }

  render() {
    const bar = el('div', 'viewer-bar');

    const caseTabs = el('div', 'tabs');
    caseTabs.setAttribute('aria-label', t('{0} cases', t(REGION_NAMES[this.region] || this.region)));
    this.cases.forEach((c, i) => {
      const b = el('button', null, caseLabel(c));
      b.title = `${caseTitle(c)}, ${caseDate(c)}`;
      b.setAttribute('aria-selected', i === 0);
      b.onclick = () => this.selectCase(i);
      caseTabs.append(b);
    });
    this.caseTabs = caseTabs;

    // Layer chips share the header row with the case tabs and wrap under them on narrow screens.
    this.toggles = el('div', 'layer-toggles');
    bar.append(caseTabs, this.toggles);

    this.meta = el('div', 'viewer-meta');
    this.grid = el('div', 'panels');

    const controls = el('div', 'controls');
    this.playBtn = el('button', 'btn btn-play', '&#9654;');
    this.playBtn.setAttribute('aria-label', t('Play'));
    this.playBtn.title = t('Play');
    this.playBtn.onclick = () => this.toggle();
    const back = el('button', 'btn', '&#8592;');
    back.onclick = () => { this.pause(); this.seek(this.tick - 1); };
    const fwd = el('button', 'btn', '&#8594;');
    fwd.onclick = () => { this.pause(); this.seek(this.tick + 1); };

    this.scrub = el('input', 'scrub');
    Object.assign(this.scrub, { type: 'range', min: 0, max: TICKS - 1, step: 1, value: 0 });
    this.scrub.oninput = () => { this.pause(); this.seek(+this.scrub.value); };

    this.speed = el('select', 'speed');
    [['0.5x', 400], ['1x', 200], ['2x', 100], ['4x', 50]].forEach(([label, ms]) => {
      const o = el('option', null, label);
      o.value = ms;
      if (ms === 200) o.selected = true;
      this.speed.append(o);
    });
    this.speed.onchange = () => { this.msPerTick = +this.speed.value; };

    this.clock = el('div', 'clock');
    controls.append(this.playBtn, back, fwd, this.scrub, this.clock, this.speed);

    // Shown only while frames load, or when some failed.
    this.loadEl = el('div', 'loading');

    // The colourbar belongs to the viewer, so it lives inside the pane, directly under the controls.
    this.cbar = el('div', 'cbar');
    colourbar(this.cbar);

    this.chart = el('div', 'station-chart');
    this.mount.append(bar, this.meta, this.grid, controls, this.cbar, this.loadEl, this.chart);
  }

  selectCase(i) {
    this.caseIdx = i;
    [...this.caseTabs.children].forEach((b, j) => b.setAttribute('aria-selected', i === j));
    this.seek(0);
    this.rebuildPanels();
  }

  get stations() {
    return (window.STATIONS || {})[`${this.region}:${this.current.id}`] || null;
  }

  // Station files load on demand; the viewer redraws once a case's file arrives.
  loadStations() {
    const key = `${this.region}:${this.current.id}`;
    const url = (window.STATION_FILES || {})[key];
    window.STATIONS = window.STATIONS || {};
    if (!url || window.STATIONS[key] || (this._loading || new Set()).has(key)) return;
    (this._loading = this._loading || new Set()).add(key);
    fetch(url).then(r => r.ok ? r.json() : null).then(data => {
      if (!data) return;
      window.STATIONS[key] = data;
      if (`${this.region}:${this.current.id}` === key) this.rebuildPanels();
    }).catch(() => {});
  }

  rebuildPanels() {
    const c = this.current;
    this.loadStations();
    const layers = this.layersFor(c);
    if (!layers.some(l => this.active.has(l.key))) {
      layers.filter(l => l.def.default).forEach(l => this.active.add(l.key));
    }
    const shown = layers.filter(l => this.active.has(l.key));

    this.grid.innerHTML = '';
    // Stations never sit on the model maps. Korean AWS get their own panel; other point gauges get 48 km zoom
    // panels around the gauges (one per input/model layer) plus a gauges-only panel.
    const st = this.stations;
    const stOn = this.stationsOn !== false;
    const mode = st && stOn ? (st.source === 'kr_aws' ? 'panel' : 'zoom') : null;
    const view = mode === 'zoom' ? zoomView(st, this.domain) : null;
    const makePanel = (def, title, opts = {}) => {
      const p = el('div', 'panel');
      const head = el('div', 'panel-head');
      head.append(el('span', 'panel-title', noBreakParens(title)));
      const frame = el('div', 'frame' + (def.native ? ' is-native' : '') + (opts.view ? ' is-zoom' : ''));
      const holder = opts.view ? el('div', 'zoom-inner') : frame;
      if (opts.view) {
        const v = opts.view, k = 100 / v.w;
        Object.assign(holder.style, { width: k + '%', height: k + '%', left: (-v.x0 * k) + '%', top: (-v.y0 * k) + '%' });
        frame.append(holder);
      }
      if (def.base) holder.style.backgroundImage = `url("${def.base}")`;
      const imgs = [];
      if (def.frames) {
        const a = el('img'), b = el('img');
        [a, b].forEach(img => { img.alt = title; img.decoding = 'sync'; });
        a.classList.add('on');
        holder.append(a, b);
        imgs.push(a, b);
      }
      frame.append(el('span', 'cadence', cadenceLabel(def.cadence)));
      if (opts.box) frame.append(zoomBox(opts.box));
      const dots = opts.dots ? stationLayer(st, this.domain, opts.view) : null;
      if (dots) frame.append(dots.svg);
      p.append(head, frame);
      this.grid.append(p);
      return { def, imgs, cur: 0, url: null, dots };
    };
    // Panel order follows the role: input, model(s), target, observed, then products such as DI Cast.
    const items = shown.map(({ def }) => ({ def, title: modelLabel(def.label), opts: { box: view } }));
    if (mode === 'panel') {
      const base = shown[0] && shown[0].def.base;
      items.push({ def: { role: 'observed', cadence: st.interval_seconds / 60, base, order: 0 }, title: t('AWS stations'), opts: { dots: true } });
    }
    items.sort((p, q) => byRole(p.def, q.def));
    this.panels = items.map(i => makePanel(i.def, i.title, i.opts));
    if (mode === 'zoom') {
      shown.filter(({ key }) => /^ifs-|-final$/.test(key)).forEach(({ def }) =>
        this.panels.push(makePanel(def, t('{0}, 48 km zoom', plainLabel(modelLabel(def.label))), { view, dots: true })));
      const base = shown[0] && shown[0].def.base;
      this.panels.push(makePanel({ role: 'observed', cadence: st.interval_seconds / 60, base, native: true },
        t('{0}, 48 km zoom', t('Estate gauges')), { view, dots: true }));
    }

    // Toggle any layer while keeping at least one visible.
    this.toggles.innerHTML = '';
    layers.forEach(({ key, def }) => {
      const selected = this.active.has(key);
      const button = el('button', selected ? '' : 'is-off', modelLabel(def.label));
      button.type = 'button';
      button.setAttribute('aria-pressed', String(selected));
      button.disabled = selected && shown.length === 1;
      button.onclick = () => {
        selected ? this.active.delete(key) : this.active.add(key);
        this.rebuildPanels();
      };
      this.toggles.append(button);
    });
    // The station panels toggle like a layer; they are never the only thing shown.
    if (st) {
      const button = el('button', stOn ? '' : 'is-off', t(st.source === 'kr_aws' ? 'AWS stations' : 'Estate gauges'));
      button.type = 'button';
      button.setAttribute('aria-pressed', String(stOn));
      button.onclick = () => { this.stationsOn = !stOn; this.rebuildPanels(); };
      this.toggles.append(button);
    }

    this.meta.innerHTML = '';
    this.meta.append(el('b', null, caseTitle(c)), document.createTextNode(` · ${caseRange(c)}`));
    this.stationChart();
    if (this.near) this.preload();
    else this.loadEl.innerHTML = '';
    this.paint();
  }

  stationChart() {
    this.chart.innerHTML = '';
    const s = (window.STATIONS || {})[`${this.region}:${this.current.id}`];
    if (!s || !s.series_stations.length) return;
    // Series are values at each station's own pixel, so both viewers show the same set.
    // A page limited to some models (window.PAGE_MODELS) keeps only those and the references
    // (window.PAGE_REFERENCES, default radar and DI Cast).
    const keep = window.PAGE_MODELS;
    const refs = window.PAGE_REFERENCES || ['PEAK_HSP', 'DI Cast'];
    const names = Object.keys(s.series).filter(n => !SECOND_SEEDS.includes(n) && !DROPPED.includes(n)
      && (!keep || keep.includes(n) || refs.includes(n)));
    cumulativeChart(this.chart, s, names, this.domain);
  }

  frameIndex(def) {
    const step = def.cadence / TICK_MIN;         // 1 for 30 min, 6 for 3 h
    return Math.min(Math.floor(this.tick / step), def.frames.length - 1);
  }

  preload() {
    const urls = [...new Set(this.panels.flatMap(p => [p.def.base, ...(p.def.frames || [])].filter(Boolean)))];
    let done = 0, failed = 0;
    this.token = Symbol();
    if (!urls.length) { this.loadEl.innerHTML = ''; return; }
    const bar = el('span', 'bar');
    const fill = el('i');
    bar.append(fill);
    this.loadEl.innerHTML = '';
    this.loadEl.append(bar, document.createTextNode(t('loading {0} frames', urls.length)));
    const token = this.token;
    urls.forEach(u => {
      const img = new Image();
      const tally = (ok) => {
        if (token !== this.token) return;
        done++;
        if (!ok) failed++;
        fill.style.width = (done / urls.length * 100) + '%';
        if (done === urls.length) this.loadEl.textContent = failed
          ? t('{0} of {1} frames failed to load', failed, urls.length)
          : '';
      };
      img.onload = () => tally(true);
      img.onerror = () => tally(false);
      img.src = u;
    });
  }

  paint() {
    for (const p of this.panels) {
      if (!p.def.frames) continue;
      const index = this.frameIndex(p.def);
      const url = p.def.frames[index];
      if (url === p.url) continue;
      p.url = url;
      const next = p.imgs[1 - p.cur], cur = p.imgs[p.cur];
      const swap = () => { next.classList.add('on'); cur.classList.remove('on'); p.cur = 1 - p.cur; };
      next.onload = swap;
      next.src = url;
      if (next.complete) swap();
    }
    const stamp = addMinutes(this.current.start, (this.tick + 1) * TICK_MIN);
    const s = this.stations;
    if (s) {
      const end = stamp.getTime() / 1000;
      const k = s.times.findIndex(t => t >= end);
      for (const p of this.panels) if (p.dots) p.dots.paint(k < 0 ? null : k, s.interval_seconds);
    }
    this.clock.textContent = clockLabel(stamp);
    this.scrub.value = this.tick;
    if (this.chart._setTime) this.chart._setTime(stamp.getTime() / 1000);
  }

  seek(t) {
    this.tick = ((t % TICKS) + TICKS) % TICKS;
    this.paint();
  }

  toggle() { this.playing ? this.pause() : this.play(); }
  play() { this.playing = true; this.last = performance.now(); this.playBtn.textContent = 'Ⅱ'; this.playBtn.setAttribute('aria-label', t('Pause')); this.playBtn.title = t('Pause'); }
  pause() { this.playing = false; this.playBtn.textContent = '▶'; this.playBtn.setAttribute('aria-label', t('Play')); this.playBtn.title = t('Play'); }

  loop(now) {
    if (this.playing) {
      this.acc += now - this.last;
      while (this.acc >= this.msPerTick) { this.acc -= this.msPerTick; this.seek(this.tick + 1); }
    }
    this.last = now;
    requestAnimationFrame(this.loop);
  }
}

// 48 km window centred on the stations, as fractions of the panel (SpateGAN area 336 km, CEDDAR 256 km).
const DOMAIN_KM = { spategan: 336, ceddar: 256 };
function zoomView(s, domain) {
  const pts = s.stations.map(st => domain === 'ceddar' ? st.ceddar : [st.fx, st.fy]).filter(Boolean);
  if (!pts.length) return null;
  const w = 48 / (DOMAIN_KM[domain] || 336);
  const cx = (Math.min(...pts.map(p => p[0])) + Math.max(...pts.map(p => p[0]))) / 2;
  const cy = (Math.min(...pts.map(p => p[1])) + Math.max(...pts.map(p => p[1]))) / 2;
  const clamp = v => Math.max(0, Math.min(1 - w, v));
  return { x0: clamp(cx - w / 2), y0: clamp(cy - w / 2), w };
}
// Outline of the zoom window on the full-area panels.
function zoomBox(v) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'zoom-box');
  svg.setAttribute('viewBox', '0 0 1000 1000');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.append(svgEl('rect', { x: v.x0 * 1000, y: v.y0 * 1000, width: v.w * 1000, height: v.w * 1000 }));
  return svg;
}
const cadenceLabel = m => m === 30 ? '30 min' : m === 60 ? '1 h' : m === 180 ? '3 h' : m + ' min';

/* ---------------------------------------------------------------- stations */

// Station observations as dots on each panel, coloured with the frame palette
// (interval amount converted to mm/hour). Missing observations are hollow.
function paletteColour(rate) {
  const p = window.METRICS.palette;
  if (rate == null) return null;
  if (rate < p.bounds[0]) return 'transparent';
  for (let i = p.levels.length - 1; i >= 0; i--) if (rate >= p.bounds[i]) return p.levels[i];
  return p.levels[0];
}

function stationLayer(s, domain, view) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'station-dots');
  // Dots scale with the panel (about 3.6 px radius on a 300 px panel, as in the report stills);
  // the outline stays thin at any size (non-scaling stroke).
  svg.setAttribute('viewBox', '0 0 1000 1000');
  svg.setAttribute('preserveAspectRatio', 'none');
  const dots = [];
  s.stations.forEach((st, i) => {
    let pos = domain === 'ceddar' ? st.ceddar : [st.fx, st.fy];
    if (!pos) return;
    if (view) {
      pos = [(pos[0] - view.x0) / view.w, (pos[1] - view.y0) / view.w];
      if (pos.some(v => v < 0 || v > 1)) return;
    }
    const c = svgEl('circle', { cx: (pos[0] * 1000).toFixed(1), cy: (pos[1] * 1000).toFixed(1), r: view ? 27 : (s.stations.length > 40 ? 12 : 16) });
    const title = svgEl('title'); c.append(title);
    svg.append(c);
    dots.push({ c, title, i, st });
  });
  return {
    svg,
    paint(k, seconds) {
      for (const d of dots) {
        const v = k == null ? null : d.st.values[k];
        const colour = v == null ? null : paletteColour(v * 3600 / seconds);
        d.c.setAttribute('class', v == null ? 'is-missing' : (colour === 'transparent' ? 'is-dry' : ''));
        d.c.style.fill = colour && colour !== 'transparent' ? colour : '';
        d.title.textContent = `${d.st.id}: ${v == null ? t('no observation') : v.toFixed(1) + ' mm'}`;
      }
    }
  };
}

// Station-chart series: the final model is shown; CEDDAR starts hidden.
const STATION_HIDDEN = new Set(['CEDDAR-IFS']);
const STATION_STYLE = {
  'IFS': { dash: '5 4' }, 'PEAK_HSP': { dash: '2 3', colour: 'IFS' }, 'DI Cast': { dash: '2 3' },
  'SpateGAN-IFS': { width: 2.6 }
};
const STATION_ORDER = ['IFS', 'PEAK_HSP', 'DI Cast', 'SpateGAN-IFS', 'CEDDAR-IFS'];

// Cumulative rainfall at one station: observations against each source at the
// pixel containing the station. Totals make 30-minute, hourly and three-hour
// sources directly comparable.
function cumulativeChart(mount, s, names, domain) {
  const state = mount._state || (mount._state = { station: s.series_stations[0], hidden: new Set(STATION_HIDDEN) });
  if (!s.series_stations.includes(state.station)) state.station = s.series_stations[0];
  const rank = n => { const i = STATION_ORDER.indexOf(n); return i < 0 ? 99 : i; };
  names = [...names].sort((a, b) => rank(a) - rank(b));
  // Whole millimetres; one decimal for small non-zero totals (e.g. 0.3 mm).
  const mm = v => (v > 0 && v < 1 ? v.toFixed(1) : v.toFixed(0)) + ' mm';
  const draw = () => {
    mount.innerHTML = '';
    const bar = el('div', 'chart-controls');
    bar.append(picker(t('Station'), s.series_stations.map(id => {
      const st = s.stations.find(x => x.id === id);
      return { value: id, label: t('{0} {1} · {2} in 24 h', s.source === 'kr_aws' ? 'AWS' : t('Gauge'), id, mm(st.total)) };
    }), state.station, v => { state.station = v; draw(); }));
    mount.append(bar);
    const st = s.stations.find(x => x.id === state.station);
    const series = [];
    // Accumulate only intervals ending inside the case window (IFS files span 48 hours).
    const w0 = s.times[0] - s.interval_seconds, w1 = s.times[s.times.length - 1];
    const cum = (times, vals) => { let acc = 0, any = false; return times.map((t, i) => ({ t, v: vals[i] })).filter(p => p.t > w0 && p.t <= w1)
      .map(p => { if (p.v != null) { acc += p.v; any = true; } return { t: p.t, v: any ? acc : null }; }); };
    series.push({ name: s.source === 'kr_aws' ? 'AWS station' : 'Gauge', colour: 'var(--ink)', width: 3, points: cum(s.times, st.values) });
    for (const name of names) {
      const entry = s.series[name] && s.series[name].stations[state.station];
      if (!entry) continue;
      const style = STATION_STYLE[name] || {};
      series.push({ name, key: name, colour: colourOf(style.colour || name), dash: style.dash || null,
                    width: style.width || 1.6, points: cum(s.series[name].times, entry.mean) });
    }
    // Totals line: last cumulative value of each series currently shown.
    const totals = series.filter(sr => !state.hidden.has(sr.key)).map(sr => {
      const last = sr.points.filter(p => p.v != null).pop();
      return `${modelLabel(sr.name)} ${last ? mm(last.v) : '–'}`;
    });
    mount.append(el('p', 'chart-totals', t('24-hour total at this station: ') + totals.join(' · ')));
    // Size from the container (capped like the other charts); a hidden container falls back to 760.
    const W = Math.max(280, Math.min(760, mount.clientWidth || 760)), H = W < 500 ? 280 : 250, L = 52, R = 16, T = 14, B = 46;
    const t0 = s.times[0] - s.interval_seconds, t1 = s.times[s.times.length - 1];
    const hi = Math.max(1, ...series.filter(x => !state.hidden.has(x.key)).flatMap(x => x.points.map(p => p.v || 0))) * 1.08;
    const x = t => L + (t - t0) / (t1 - t0) * (W - L - R), y = v => T + (H - T - B) * (1 - v / hi);
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img' });
    niceTicks(0, hi).forEach(v => {
      svg.append(svgEl('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: 'var(--line-2)' }));
      const lab = svgEl('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'chart-tick' }); lab.textContent = v; svg.append(lab);
    });
    for (let h = 0; h <= 24; h += 6) {
      const t = t0 + h * 3600, lab = svgEl('text', { x: x(t), y: H - B + 18, 'text-anchor': 'middle', class: 'chart-tick' });
      lab.textContent = new Date(t * 1000).toISOString().slice(11, 16); svg.append(lab);
    }
    const ax = svgEl('text', { x: L + (W - L - R) / 2, y: H - 8, 'text-anchor': 'middle', class: 'chart-axis' });
    ax.textContent = t('Time (UTC)'); svg.append(ax);
    const ay = svgEl('text', { x: 0, y: 0, 'text-anchor': 'middle', class: 'chart-axis',
                               transform: `translate(14 ${T + (H - T - B) / 2}) rotate(-90)` });
    ay.textContent = t('Rain so far (mm)'); svg.append(ay);
    for (const sr of series) {
      const pts = sr.points.filter(p => p.v != null);
      if (!pts.length || state.hidden.has(sr.key)) continue;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + x(p.t).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(' ');
      svg.append(svgEl('path', Object.assign({ d, fill: 'none', stroke: sr.colour, 'stroke-width': sr.width, 'stroke-linejoin': 'round' },
                                             sr.dash ? { 'stroke-dasharray': sr.dash } : {})));
    }
    // Time line: follows the viewer's clock (set through mount._setTime).
    const now = svgEl('line', { y1: T, y2: H - B, class: 'chart-now' });
    svg.append(now);
    mount._setTime = t => {
      const c = Math.max(t0, Math.min(t1, t));
      now.setAttribute('x1', x(c).toFixed(1)); now.setAttribute('x2', x(c).toFixed(1));
      mount._time = t;
    };
    if (mount._time != null) mount._setTime(mount._time); else mount._setTime(t0);
    mount.append(svg);
    // Observations always show; every other series is a toggle in the legend.
    const legend = el('div', 'chart-legend');
    series.forEach(sr => {
      const text = modelLabel(sr.name);
      const swatch = Object.assign(el('i'), { style: `background:${sr.colour}` });
      if (!sr.key) {
        const b = el('span', 'legend-item');
        b.append(swatch, el('span', null, text));
        legend.append(b);
        return;
      }
      const off = state.hidden.has(sr.key);
      const b = el('button', 'legend-item' + (off ? ' is-off' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', String(!off));
      b.append(swatch, el('span', null, text));
      b.onclick = () => { off ? state.hidden.delete(sr.key) : state.hidden.add(sr.key); draw(); };
      legend.append(b);
    });
    mount.append(legend);
  };
  draw();
}

/* ------------------------------------------------------------------ tables */

function summaryTable(key) {
  const data = window.METRICS.summary[key];
  if (!data) return document.createDocumentFragment();
  // Headers carry their units and wrap to two lines; the column then sizes to
  // the longest word rather than the whole string.
  const dir = d => '&nbsp;<span class="dir">' + (d === 'up' ? '&uarr;' : '&darr;') + '</span>';
  const cols = [['mae', 'MAE' + dir('dn')], ['pod', 'POD-M' + dir('up')],
                ['far', 'FAR-M' + dir('dn')], ['csi', 'CSI-M' + dir('up')],
                ['fss', t('Ensemble FSS') + dir('up')], ['crps', 'CRPS' + dir('dn')]];
  const table = el('table');
  const thead = el('thead');
  const hr = el('tr');
  hr.append(el('th', null, t('Model')));
  cols.forEach(([, label]) => hr.append(el('th', 'num', label)));
  thead.append(hr);
  const tb = el('tbody');
  data.rows.forEach(r => {
    const tr = el('tr', r.ref ? 'is-ref' : r.best ? 'is-best' : (r.pilot || r.comparison) ? 'is-pilot' : '');
    tr.append(el('td', null, noBreakParens(modelLabel(r.model))));
    cols.forEach(([k]) => tr.append(el('td', 'num', fmt4(r[k]))));
    tb.append(tr);
  });
  table.append(thead, tb);
  const wrap = el('div', 'tw');
  wrap.append(table);
  return wrap;
}

function simpleTable(rows, cols) {
  const table = el('table');
  const thead = el('thead'), hr = el('tr');
  cols.forEach(c => hr.append(el('th', c.num ? 'num' : '', t(c.label))));
  thead.append(hr);
  const tb = el('tbody');
  rows.forEach(r => {
    const tr = el('tr');
    cols.forEach(c => tr.append(el('td', c.num ? 'num' : '',
      r[c.key] == null ? PENDING : noBreakParens(c.key === 'model' ? modelLabel(r[c.key]) : t(String(r[c.key]))))));
    tb.append(tr);
  });
  table.append(thead, tb);
  const wrap = el('div', 'tw');
  wrap.append(table);
  return wrap;
}

// Slim colour scale: one strip, the bin edges under it and the unit at its right end.
// What the colours mean is explained in the page text.
function colourbar(mount) {
  const p = window.METRICS.palette;
  const n = p.levels.length;
  mount.classList.add('cbar');

  const strip = el('div', 'cbar-strip');
  p.levels.forEach(c => { const i = el('i'); i.style.background = c; strip.append(i); });

  // One tick per bin edge, positioned at the boundary between swatches.
  const ticks = el('div', 'cbar-ticks');
  p.bounds.forEach((b, i) => {
    const s = el('span', null, String(b));
    s.style.left = (i / n * 100) + '%';
    if (i === 0) s.classList.add('is-first');
    if (i === p.bounds.length - 1) s.classList.add('is-last');
    ticks.append(s);
  });

  mount.append(strip, el('span', 'cbar-unit', 'mm/h'), ticks);
}


/* ----------------------------------------------------------- numbering */

// Figures are numbered 1, 2, 3 with the label below; tables 1, 2, 3 with the
// label above. The interactive case viewers are deliberately left unnumbered.
function numberExhibits() {
  const supp = n => !!n.closest('#supplementary');
  const count = { fig: [0, 0], tab: [0, 0] };
  document.querySelectorAll('figure > figcaption').forEach(cap => {
    const s = supp(cap) ? 1 : 0, n = ++count.fig[s];
    cap.innerHTML = '<b>' + t('Fig. {0}.', s ? 'S' + n : n) + '</b> ' + cap.innerHTML;
  });
  document.querySelectorAll('table').forEach(tbl => {
    const host = tbl.closest('.tw') || tbl;
    const src = tbl.closest('[data-caption]');
    const caption = src ? ' ' + src.dataset.caption : '';
    const s = supp(tbl) ? 1 : 0, n = ++count.tab[s];
    const label = el('div', 'table-label',
      '<b>' + t('Table {0}.', s ? 'S' + n : n) + '</b>' + modelLabel(caption));
    // A redrawn table (the FSS grid) keeps its label; data-key adds a short colour key to it.
    if (src && src.dataset.key) label.append(el('span', 'cap-key', ' ' + src.dataset.key));
    if (src) src._caption = label;
    const parent = host.parentNode, next = host.nextSibling;
    const box = exhibit(label, host);
    parent.insertBefore(box, next);
    // A lettered footnote directly after the table moves into the box, so it lines up with the table.
    const after = box.nextElementSibling;
    if (after && after.classList.contains('table-note')) box.append(after);
  });
}

// Label and table share one box, so the label is exactly as wide as the table
// (or the screen, when a wide table scrolls sideways under it).
function exhibit(label, table) {
  const box = el('div', 'exhibit');
  box.append(label, table);
  return box;
}

/* --------------------------------------------------------------- compare */

// Before/after slider: IFS shows left of the divider and the final model right of it, at one time.
// data-lo / data-hi pick the layers (default: IFS and SpateGAN-IFS on the SpateGAN area).
// Drag with a mouse or finger; the hidden range input gives keyboard control and an accessible name.
// All sliders on the page move together, so every region is compared at the same split.
const compareGroup = [];
function compareSlider(node) {
  const [region, id, stamp] = node.dataset.compare.split(':');
  const c = window.CASES.find(x => x.region === region && x.id === id);
  const loKey = node.dataset.lo || 'ifs-spategan', hiKey = node.dataset.hi || 'spategan-final';
  const hiName = plainLabel(c.layers[hiKey].label);
  const side = (key, cls) => {
    const layer = c.layers[key];
    const div = el('div', 'compare-side ' + cls + (layer.native ? ' is-native' : ''));
    if (layer.base) div.style.backgroundImage = `url("${layer.base}")`;
    const img = el('img');
    img.alt = `${plainLabel(layer.label)}, ${node.dataset.name}`;
    img.loading = 'lazy';
    img.src = layer.frames[layer.stamps.indexOf(stamp)];
    div.append(img);
    return div;
  };
  const frame = el('div', 'compare-frame');
  const range = el('input', 'compare-range');
  Object.assign(range, { type: 'range', min: 0, max: 100, value: 50 });
  range.setAttribute('aria-label', t('Divider between IFS and {0}, {1}', hiName, node.dataset.name));
  const tagLo = el('span', 'compare-tag is-left', '24 km');
  const tagHi = el('span', 'compare-tag is-right', '2 km');
  frame.append(side(hiKey, 'is-hi'), side(loKey, 'is-lo'), el('div', 'compare-handle'),
    tagLo, tagHi, range);

  // A label shows only while its own side is visible under it.
  const show = (v = +range.value) => {
    frame.style.setProperty('--pos', v + '%');
    range.value = v;
    const x = v / 100 * frame.clientWidth;
    tagLo.classList.toggle('is-hidden', x < tagLo.offsetLeft + tagLo.offsetWidth);
    tagHi.classList.toggle('is-hidden', x > tagHi.offsetLeft);
  };
  compareGroup.push(show);
  const set = v => {
    v = Math.max(0, Math.min(100, v));
    compareGroup.forEach(f => f(v));
  };
  const fromPointer = e => {
    const r = frame.getBoundingClientRect();
    set((e.clientX - r.left) / r.width * 100);
  };
  range.oninput = () => { compareTouched = true; set(+range.value); };
  frame.addEventListener('pointerdown', e => {
    compareTouched = true;
    frame.setPointerCapture(e.pointerId);
    fromPointer(e);
  });
  frame.addEventListener('pointermove', e => { if (frame.hasPointerCapture(e.pointerId)) fromPointer(e); });
  // focus after the browser's own mouse-down focus handling, so the arrow keys keep working after a drag
  frame.addEventListener('pointerup', () => range.focus({ preventScroll: true }));
  const end = new Date(stamp.replace(/(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z/, '$1-$2-$3T$4:$5:$6Z'));
  node.append(frame, el('div', 'compare-cap', `<b>${node.dataset.name}</b><br><span class="nb">${clockLabel(end)}</span>`));
  set(50);   // after the frame is in the page, so label positions can be measured
  if (compareGroup.length === 1) addEventListener('resize', () => compareGroup.forEach(f => f()));
}

// Until someone moves a divider, the sliders sweep 50 -> 30 -> 70 -> 50 % when they scroll into view, and once more
// after a pause if still untouched, so readers see that they move. Never with reduced motion; at most four sweeps.
let compareTouched = false;
function compareHint(fig) {
  if (!fig || !compareGroup.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const path = [50, 30, 70, 50], ease = t => t < .5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2;
  let left = 4, visible = false, running = false;
  const sweep = () => new Promise(done => {
    const t0 = performance.now();
    const step = now => {
      if (compareTouched) return done();
      const p = Math.min(1, (now - t0) / 2400), seg = Math.min(2, Math.floor(p * 3));
      const v = path[seg] + (path[seg + 1] - path[seg]) * ease(p * 3 - seg);
      compareGroup.forEach(f => f(v));
      p < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  });
  const run = async () => {
    if (running) return;
    running = true;
    for (let i = 0; i < 2 && left > 0 && visible && !compareTouched; i++) {
      left--;
      await sweep();
      await new Promise(r => setTimeout(r, 3000));
    }
    running = false;
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) setTimeout(run, 600);
  }, { threshold: .5 }).observe(fig);
}

/* ---------------------------------------------------------------- chrome */

function chrome() {
  const top = document.getElementById('toTop');
  if (top) {
    top.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const onScroll = () => top.classList.toggle('show', window.scrollY > 700);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Highlight the nav entry for whichever section is nearest the top.
  const links = new Map();
  document.querySelectorAll('.nav a[href^="#"]').forEach(a => links.set(a.getAttribute('href').slice(1), a));
  const testsSummary = document.querySelector('.nav-tests summary');
  if (testsSummary) links.set('supplementary', testsSummary);
  const sections = [...document.querySelectorAll('[id]')].filter(node => links.has(node.id));
  if (!sections.length) return;
  const sync = () => {
    let active = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= 140) active = s;
    links.forEach(a => a && a.classList.remove('is-active'));
    links.get(active.id)?.classList.add('is-active');
    testsSummary?.classList.toggle('is-active', !!active.closest('#supplementary'));
  };
  addEventListener('scroll', sync, { passive: true });
  sync();
}

/* ------------------------------------------------------------------ init */

document.addEventListener('DOMContentLoaded', () => {
  // Key findings: the bold lead becomes the label column, the rest of the item the finding.
  document.querySelectorAll('.key-results > li').forEach(li => {
    const lead = li.firstElementChild;
    if (!lead || !/^(B|STRONG)$/.test(lead.tagName) || li.firstChild !== lead) return;
    const text = el('span', 'kr-text');
    while (lead.nextSibling) text.append(lead.nextSibling);
    text.innerHTML = text.innerHTML.replace(/^[\s:]+/, '');
    lead.classList.add('kr-label');
    lead.textContent = lead.textContent.replace(/\.$/, '');
    li.append(text);
  });
  // A page can limit every score table and chart to some models (window.PAGE_MODELS); IFS rows always stay.
  const keep = window.PAGE_MODELS;
  if (keep) {
    Object.values(window.METRICS.summary || {}).forEach(t => {
      t.rows = t.rows.filter(r => r.ref || keep.includes(r.model));
      if (t.note) t.note = t.note.replace(/\s*Shaded rows?[^.]*\./, '');
    });
    ['LEADTIME', 'BYTHRESHOLD'].forEach(k => { if (window[k]) window[k] = window[k].filter(r => keep.includes(r.model)); });
  }
  // The previous selection is dropped from every table, chart and grid.
  const M0 = window.METRICS;
  const keepRow = r => !DROPPED.includes(r.model);
  Object.values(M0.summary || {}).forEach(t => {
    t.rows = t.rows.filter(keepRow);
    t.note = (t.note || '')
      .replace('Shaded rows are comparisons: the previous selection and the released SpateGAN-ERA5', 'The shaded row is a comparison: the published SpateGAN')
      .replace(/\s*Shaded row: the previous CEDDAR selection[^.]*\./, '')
      .replace('CEDDAR-IFS is GFS-0 seed 504', 'CEDDAR is run 1 without GFS pretraining');
  });
  ['LEADTIME', 'BYTHRESHOLD'].forEach(k => { if (window[k]) window[k] = window[k].filter(keepRow); });
  // Second training runs go to the supplement: each score table gets a "-seeds" copy (IFS and both runs);
  // the main tables, charts, grids and the half-hour and spread tables keep run 1 only.
  Object.keys(M0.summary || {}).forEach(k => {
    const t = M0.summary[k];
    M0.summary[k + '-seeds'] = Object.assign({}, t, {
      rows: t.rows.filter(r => r.ref || !COMPARISONS.includes(r.model)),
      note: (t.note || '').replace(/\s*(Shaded rows?|The shaded row)[^.]*\./, '')
    });
    t.rows = t.rows.filter(r => !SECOND_SEEDS.includes(r.model));
  });
  const mainRow = r => keepRow(r) && !SECOND_SEEDS.includes(r.model);
  ['halfHour', 'spread'].forEach(k => { if (M0[k]) M0[k] = M0[k].filter(mainRow); });
  Object.values(M0.fssGrid || {}).forEach(g => Object.keys(g).forEach(m => { if (!mainRow({ model: m })) delete g[m]; }));
  // Only use explicitly available compressed copies.
  const optimized = window.OPTIMIZED_IMAGES || {};
  // The published copy splits each sequence into one basemap per folder and rain-only overlays.
  const bases = window.FRAME_BASES || {};
  window.CASES.forEach(c => Object.entries(c.layers).forEach(([key, layer]) => {
    layer.frames = layer.frames.map(url => optimized[url] || url);
    layer.base = layer.base || bases[layer.frames[0]?.replace(/[^/]*$/, '')];
  }));

  document.querySelectorAll('[data-compare]').forEach(compareSlider);
  compareHint(document.querySelector('.compare-grid'));
  document.querySelectorAll('.compare-cbar').forEach(colourbar);

  document.querySelectorAll('[data-viewer]').forEach(node => {
    const [region, domain] = node.dataset.viewer.split(':');
    const list = k => node.dataset[k] ? node.dataset[k].split(',') : null;
    new CaseViewer(node, { region, domain, cases: list('cases'), layers: list('layers') });
  });

  const UNITS = t('MAE and CRPS in mm per three hours.');
  document.querySelectorAll('[data-summary]').forEach(n => {
    const cap = (n.dataset.caption || '').trim();
    if (!/mm per three hours/.test(cap) && !cap.includes(UNITS)) n.dataset.caption = (cap ? cap + ' ' : '') + UNITS;
    n.append(summaryTable(n.dataset.summary));
  });

  const M = window.METRICS;
  const tableAt = (key, rows, cols) => {
    const n = document.querySelector(`[data-table="${key}"]`);
    if (n) n.append(simpleTable(rows, cols));
  };
  tableAt('samples', M.samples, [
    { key: 'model', label: 'Model' }, { key: 'unit', label: 'One training sample' },
    { key: 'train', label: 'IFS training samples', num: true }, { key: 'val', label: 'Validation samples', num: true },
    { key: 'test', label: 'Reserved test samples', num: true }]);
  tableAt('blocks', M.validationBlocks, [
    { key: 'block', label: 'Validation block' },
    { key: 'start', label: 'Start' }, { key: 'end', label: 'End' }]);
  tableAt('training', M.training, [
    { key: 'model', label: 'Model' }, { key: 'completed', label: 'Training per stage' },
    { key: 'gpu', label: 'GPU' }, { key: 'batch', label: 'Batch size', num: true },
    { key: 'wall', label: 'Time per stage', num: true }, { key: 'gpuHours', label: 'GPU-hours, all runs', num: true }]);
  tableAt('inference', M.inference, [
    { key: 'model', label: 'Model' }, { key: 'params', label: 'Parameters (M)', num: true },
    { key: 'gflops', label: 'GFLOPs per<br>sample (est.)', num: true }, { key: 'perSample', label: 'Inference per<br>sample (s)', num: true },
    { key: 'mem', label: 'Peak GPU<br>memory (GiB)', num: true }, { key: 'perCase', label: 'Inference per<br>case (s)', num: true }]);
  tableAt('thresholds', M.thresholds, [
    { key: 'hourly', label: 'Threshold (mm/hour)', num: true },
    { key: 'threeHour', label: 'As a three-hour amount (mm)', num: true }]);

  tableAt('halfhour', M.halfHour, [
    { key: 'model', label: 'Model' }, { key: 'mae', label: 'MAE (mm/30 min) ↓', num: true },
    { key: 'pod', label: 'POD-M ↑', num: true }, { key: 'far', label: 'FAR-M ↓', num: true },
    { key: 'csi', label: 'CSI-M ↑', num: true }, { key: 'fss', label: 'Ensemble FSS ↑', num: true },
    { key: 'crps', label: 'CRPS (mm/30 min) ↓', num: true }]);
  tableAt('spread', M.spread, [
    { key: 'model', label: 'Model' }, { key: 'spread', label: 'Ensemble spread (mm/3 h)', num: true },
    { key: 'mae', label: 'MAE (mm/3 h)', num: true }, { key: 'coverage', label: '10–90% interval coverage', num: true }]);
  tableAt('gfs-design', M.gfs.design.map(r => Object.assign({}, r, { group: gfsGroup(r.group) })), [
    { key: 'group', label: 'Group' }, { key: 'first', label: 'Stage 1 (GFS)' }, { key: 'second', label: 'Stage 2 (IFS)' }]);
  tableAt('gfs-counts', M.gfs.counts, [
    { key: 'split', label: 'Split' }, { key: 'dates', label: 'Dates' },
    { key: 'spategan', label: 'SpateGAN samples', num: true }, { key: 'ceddar', label: 'CEDDAR samples', num: true }]);
  tableAt('gfs-decision', M.gfs.decision.map(r => Object.assign({}, r, { seed: runNumber(r.seed) })), [
    { key: 'model', label: 'Model' }, { key: 'seed', label: 'Run', num: true },
    { key: 'fssWithout', label: 'FSS without GFS', num: true }, { key: 'fssWith', label: 'FSS with GFS', num: true },
    { key: 'dfss', label: 'ΔFSS', num: true }, { key: 'ci', label: '95% CI', num: true },
    { key: 'dcrps', label: 'ΔCRPS', num: true }, { key: 'dcsi', label: 'ΔCSI', num: true },
    { key: 'dbias', label: 'Δ|volume bias|', num: true }]);
  tableAt('candidates', M.candidates.map(r => Object.assign({}, r, { run: gfsRun(r.run), step: r.pick ? t('{0} (pick)', r.step) : r.step })), [
    { key: 'run', label: 'Run' }, { key: 'step', label: 'Step' }, { key: 'fss', label: 'Ensemble FSS ↑', num: true },
    { key: 'crps', label: 'CRPS ↓', num: true }, { key: 'csi', label: 'CSI-M ↑', num: true },
    { key: 'mae', label: 'MAE ↓', num: true }, { key: 'ratio', label: 'Rain ratio', num: true }]);
  document.querySelectorAll('[data-fss-grid]').forEach(n => fssGridTable(n, n.dataset.fssGrid));

  // The report revision date is maintained in index.html, separately from metrics.
  document.querySelectorAll('[data-chart]').forEach(n => relativeChart(n, n.dataset.chart));
  document.querySelectorAll('[data-ratio-chart]').forEach(n => ratioChart(n, n.dataset.ratioChart));
  document.querySelectorAll('[data-lead-chart]').forEach(n => leadChart(n, n.dataset.leadChart));
  document.querySelectorAll('[data-threshold-chart]').forEach(n => thresholdChart(n, n.dataset.thresholdChart));
  numberExhibits();
  chrome();
  theme();
});

/* ----------------------------------------------------------------- theme */

function theme() {
  const btn = document.getElementById('themeToggle');
  const stored = (() => { try { return localStorage.getItem('g26-theme'); } catch { return null; } })();
  const system = matchMedia('(prefers-color-scheme: dark)');
  const apply = t => document.documentElement.setAttribute('data-theme', t);

  apply(stored || (system.matches ? 'dark' : 'light'));
  system.addEventListener('change', e => { if (!localStorage.getItem('g26-theme')) apply(e.matches ? 'dark' : 'light'); });

  if (!btn) return;
  btn.onclick = () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem('g26-theme', next); } catch { /* private mode */ }
    document.querySelectorAll('[data-chart]').forEach(n => relativeChart(n, n.dataset.chart));
  document.querySelectorAll('[data-ratio-chart]').forEach(n => ratioChart(n, n.dataset.ratioChart));
  };
}

/* ----------------------------------------------------------------- chart */

const CHART_COLOURS = ['#4e79a7', '#e8912a', '#4f9d55', '#d1544f'];
// One colour per model across every chart. The final model is blue, its second run a
// lighter blue; CEDDAR is orange; the published SpateGAN is green.
const MODEL_COLOURS = {
  'IFS': 'var(--ink-3)',
  'SpateGAN-IFS': '#4e79a7', 'SpateGAN-IFS (seed 43)': '#6d8fb8',
  'CEDDAR-IFS': '#e8912a', 'CEDDAR-IFS (seed 505)': '#f2c48d',
  'SpateGAN-ERA5': '#4f9d55'
};
const colourOf = m => MODEL_COLOURS[m] || 'var(--ink-3)';
const CHART_METRICS = [
  { key: 'mae',  label: 'MAE',      better: 'lower'  },
  { key: 'pod',  label: 'POD-M',    better: 'higher' },
  { key: 'far',  label: 'FAR-M',    better: 'lower'  },
  { key: 'csi',  label: 'CSI-M',    better: 'higher' },
  { key: 'fss',  label: t('Ens. FSS'), better: 'higher' },
  { key: 'crps', label: 'CRPS',     better: 'lower'  }
];

const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  return n;
};

function niceTicks(min, max) {
  const span = Math.max(max - min, 1e-6);
  const raw = span / 5;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].find(m => m * mag >= raw) * mag;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

/* Each model against its own matched IFS reference, as a percentage change
   with the sign flipped for the lower-is-better metrics, so on this chart
   "up" always means better. */
function relativeChart(mount, familyKey) {
  const data = window.METRICS.summary[familyKey];
  if (!data) return;
  const ref = data.rows.find(r => r.ref);
  const models = data.rows.filter(r => !r.ref);
  if (!ref || !models.length) return;

  const hidden = mount._hidden || (mount._hidden = new Set());
  const gain = (row, m) => {
    const a = row[m.key], b = ref[m.key];
    if (a == null || b == null || !b) return null;
    return (m.better === 'lower' ? b - a : a - b) / Math.abs(b);
  };

  const draw = () => {
    mount.innerHTML = '';
    mount.style.position = 'relative';

    const shown = models.filter((_, i) => !hidden.has(i));
    const W = matchMedia('(max-width: 700px)').matches ? Math.max(280, mount.clientWidth) : 760, H = matchMedia('(max-width: 700px)').matches ? 300 : 240, L = 52, R = 14, T = 16, B = 54;
    const pw = W - L - R, ph = H - T - B;

    let lo = 0, hi = 0;
    shown.forEach(row => CHART_METRICS.forEach(m => {
      const g = gain(row, m);
      if (g == null) return;
      lo = Math.min(lo, g); hi = Math.max(hi, g);
    }));
    const pad = (hi - lo) * 0.12 || 0.05;
    lo -= pad; hi += pad;
    const y = v => T + ph - (v - lo) / (hi - lo) * ph;

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img' });

    niceTicks(lo, hi).forEach(t => {
      const zero = Math.abs(t) < 1e-9;
      svg.append(svgEl('line', {
        x1: L, x2: W - R, y1: y(t), y2: y(t),
        stroke: zero ? 'var(--ink-3)' : 'var(--line-2)', 'stroke-width': zero ? 1.4 : 1
      }));
      const lab = svgEl('text', { x: L - 8, y: y(t) + 4, 'text-anchor': 'end', class: 'chart-tick' });
      lab.textContent = (t * 100).toFixed(0) + '%';
      svg.append(lab);
    });

    const gw = pw / CHART_METRICS.length;
    CHART_METRICS.forEach((m, gi) => {
      const inner = gw * 0.66, bw = shown.length ? inner / shown.length : inner;
      const x0 = L + gi * gw + (gw - inner) / 2;

      shown.forEach((row, si) => {
        const g = gain(row, m);
        if (g == null) return;
        const idx = models.indexOf(row);
        const top = Math.min(y(g), y(0)), h = Math.abs(y(g) - y(0));
        const rect = svgEl('rect', {
          x: x0 + si * bw, y: top, width: Math.max(bw - 3, 1), height: Math.max(h, 1),
          fill: colourOf(row.model), rx: 2, class: 'chart-bar'
        });
        rect.addEventListener('mousemove', e => {
          const b = mount.getBoundingClientRect();
          tip.innerHTML = `<b>${modelLabel(row.model)}</b><br>${m.label}: ${row[m.key].toFixed(4)}`
            + `<br>IFS: ${ref[m.key].toFixed(4)}`
            + '<br>' + t(g >= 0 ? '{0} better than IFS' : '{0} worse than IFS', `<b>${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}%</b>`);
          tip.style.left = (e.clientX - b.left) + 'px';
          tip.style.top = (e.clientY - b.top) + 'px';
          tip.classList.add('on');
        });
        rect.addEventListener('mouseleave', () => tip.classList.remove('on'));
        svg.append(rect);
      });

      const lab = svgEl('text', { x: L + gi * gw + gw / 2, y: H - B + 22, 'text-anchor': 'middle', class: 'chart-axis' });
      lab.textContent = m.label;
      svg.append(lab);
    });

    const better = svgEl('text', { x: L - 8, y: T + 4, 'text-anchor': 'end', class: 'chart-tick' });
    svg.append(svgEl('line', { x1: L, x2: L, y1: T, y2: T + ph, stroke: 'var(--line)', 'stroke-width': 1 }));
    mount.append(svg);

    const legend = el('div', 'chart-legend');
    models.forEach((row, i) => {
      const b = el('button');
      b.type = 'button';
      if (hidden.has(i)) b.classList.add('is-off');
      b.append(Object.assign(el('i'), { style: `background:${colourOf(row.model)}` }),
               el('span', null, modelLabel(row.model)));
      b.onclick = () => {
        hidden.has(i) ? hidden.delete(i) : hidden.add(i);
        if (hidden.size === models.length) hidden.delete(i);
        draw();
      };
      legend.append(b);
    });
    mount.append(legend);

    var tip = el('div', 'chart-tip');
    mount.append(tip);
  };

  draw();
}

/* Ratios where 1.0 is the target, not where IFS is the reference: how much
   rain each model produces, and in how many places. IFS is shown as a bar
   here rather than as the baseline, because the baseline is the observation. */
const RATIO_METRICS = [
  { key: 'ratio', label: t('Rain ratio') },
  { key: 'fbias', label: t('Frequency bias') }
];

function ratioChart(mount, familyKey) {
  const data = window.METRICS.summary[familyKey];
  if (!data) return;
  const rows = data.rows.filter(r => r.ratio != null);
  if (!rows.length) return;
  const hidden = mount._hidden || (mount._hidden = new Set());
  const colour = r => colourOf(r.model);

  const draw = () => {
    mount.innerHTML = '';
    mount.style.position = 'relative';
    const shown = rows.filter((_, i) => !hidden.has(i));

    const W = matchMedia('(max-width: 700px)').matches ? Math.max(280, mount.clientWidth) : 760, H = matchMedia('(max-width: 700px)').matches ? 280 : 240, L = 52, R = 14, T = 16, B = 54;
    const pw = W - L - R, ph = H - T - B;
    const hi = Math.max(1.15, ...shown.flatMap(r => RATIO_METRICS.map(m => r[m.key] || 0))) * 1.06;
    const y = v => T + ph - (v / hi) * ph;

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img' });

    niceTicks(0, hi).forEach(t => {
      svg.append(svgEl('line', { x1: L, x2: W - R, y1: y(t), y2: y(t), stroke: 'var(--line-2)', 'stroke-width': 1 }));
      const lab = svgEl('text', { x: L - 8, y: y(t) + 4, 'text-anchor': 'end', class: 'chart-tick' });
      lab.textContent = t.toFixed(1);
      svg.append(lab);
    });

    // the target line: 1.0 means the model produces exactly what was observed
    svg.append(svgEl('line', {
      x1: L, x2: W - R, y1: y(1), y2: y(1),
      stroke: 'var(--ink-2)', 'stroke-width': 1.5, 'stroke-dasharray': '5 4'
    }));
    const tgt = svgEl('text', { x: W - R, y: y(1) - 7, 'text-anchor': 'end', class: 'chart-target' });
    tgt.textContent = t('1.0 = same as observed');
    svg.append(tgt);

    const gw = pw / RATIO_METRICS.length;
    RATIO_METRICS.forEach((m, gi) => {
      const inner = gw * 0.58, bw = shown.length ? inner / shown.length : inner;
      const x0 = L + gi * gw + (gw - inner) / 2;
      shown.forEach((row, si) => {
        const v = row[m.key];
        if (v == null) return;
        const rect = svgEl('rect', {
          x: x0 + si * bw, y: y(v), width: Math.max(bw - 3, 1), height: Math.max(y(0) - y(v), 1),
          fill: colour(row), rx: 2, class: 'chart-bar'
        });
        rect.addEventListener('mousemove', e => {
          const b = mount.getBoundingClientRect();
          const off = ((v - 1) * 100).toFixed(1);
          tip.innerHTML = `<b>${modelLabel(row.model)}</b><br>${m.label}: ${v.toFixed(4)}`
            + '<br>' + (v >= 1 ? t('produces {0}% more than observed', off) : t('produces {0}% less than observed', Math.abs(off)));
          tip.style.left = (e.clientX - b.left) + 'px';
          tip.style.top = (e.clientY - b.top) + 'px';
          tip.classList.add('on');
        });
        rect.addEventListener('mouseleave', () => tip.classList.remove('on'));
        svg.append(rect);
      });
      const lab = svgEl('text', { x: L + gi * gw + gw / 2, y: H - B + 22, 'text-anchor': 'middle', class: 'chart-axis' });
      lab.textContent = m.label;
      svg.append(lab);
    });

    svg.append(svgEl('line', { x1: L, x2: L, y1: T, y2: T + ph, stroke: 'var(--line)', 'stroke-width': 1 }));
    const ylab = svgEl('text', { x: 14, y: T + ph / 2, 'text-anchor': 'middle', class: 'chart-axis',
                                 transform: `rotate(-90 14 ${T + ph / 2})` });
    ylab.textContent = t('model \u00f7 observed');
    svg.append(ylab);
    mount.append(svg);

    const legend = el('div', 'chart-legend');
    rows.forEach((row, i) => {
      const b = el('button');
      b.type = 'button';
      if (hidden.has(i)) b.classList.add('is-off');
      b.append(Object.assign(el('i'), { style: `background:${colour(row)}` }),
               el('span', null, modelLabel(row.model)));
      b.onclick = () => {
        hidden.has(i) ? hidden.delete(i) : hidden.add(i);
        if (hidden.size === rows.length) hidden.delete(i);
        draw();
      };
      legend.append(b);
    });
    mount.append(legend);

    var tip = el('div', 'chart-tip');
    mount.append(tip);
  };

  draw();
}

/* ------------------------------------------------------- series charts */

// Colours stay consistent with the bar charts: the IFS reference is grey and
// each model keeps the colour it has in the summary table order.
function familyColours(family, explicit) {
  return explicit || new Proxy({}, { get: (_, m) => colourOf(m) });
}

const LEAD_METRICS = [
  { key: 'csi',   label: 'CSI-M' },
  { key: 'pod',   label: 'POD-M' },
  { key: 'far',   label: 'FAR-M' },
  { key: 'fss',   label: t('Ensemble FSS') },
  { key: 'mae',   label: 'MAE' },
  { key: 'crps',  label: 'CRPS' },
  { key: 'fbias', label: t('Frequency bias') },
  { key: 'ratio', label: t('Rain ratio') }
];

const THRESHOLD_METRICS = [
  { key: 'csi',   label: 'CSI' },
  { key: 'pod',   label: 'POD' },
  { key: 'far',   label: 'FAR' },
  { key: 'fbias', label: t('Frequency bias') }
];

function picker(label, options, value, onChange) {
  const wrap = el('label', 'chart-picker', '<span>' + label + '</span>');
  const sel = el('select');
  options.forEach(o => {
    const opt = el('option', null, o.label);
    opt.value = o.value;
    if (o.value === value) opt.selected = true;
    sel.append(opt);
  });
  sel.onchange = () => onChange(sel.value);
  wrap.append(sel);
  return wrap;
}

/* One line per model across an ordered x axis: forecast lead hour, or
   rainfall threshold. */
function seriesChart(mount, cfg) {
  const colours = familyColours(cfg.family, cfg.colours);
  const formatV = cfg.formatV || (v => v.toFixed(4));
  const hidden = mount._hidden || (mount._hidden = new Set());
  const state = mount._state || (mount._state = { metric: cfg.metrics[0].key, interval: cfg.intervals[0] });

  const draw = () => {
    mount.innerHTML = '';
    mount.style.position = 'relative';

    const bar = el('div', 'chart-controls');
    bar.append(picker(t('Metric'), cfg.metrics.map(m => ({ value: m.key, label: m.label })),
                      state.metric, v => { state.metric = v; draw(); }));
    if (cfg.intervals.length > 1) {
      bar.append(picker(t('Interval'), cfg.intervals.map(i => ({ value: i, label: t(i === '30min' ? '30 minutes' : '3 hours') })),
                        state.interval, v => { state.interval = v; draw(); }));
    }
    mount.append(bar);

    const rows = cfg.rows.filter(r => r.interval === state.interval && (!cfg.models || cfg.models.includes(r.model)));
    // Legend order follows the summary table (cfg.models) when given.
    const present = new Set(rows.map(r => r.model));
    const models = cfg.models ? cfg.models.filter(m => present.has(m)) : [...present];
    const shown = models.filter(m => !hidden.has(m));
    const xs = [...new Set(rows.map(r => r[cfg.xKey]))].sort((a, b) => a - b);

    const W = matchMedia('(max-width: 700px)').matches ? Math.max(280, mount.clientWidth) : 760, H = matchMedia('(max-width: 700px)').matches ? 300 : 240, L = 56, R = 16, T = 18, B = 56;
    const pw = W - L - R, ph = H - T - B;
    const vals = rows.filter(r => shown.includes(r.model)).map(r => r[state.metric]).filter(v => v != null);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (!vals.length) { lo = 0; hi = 1; }
    const padv = (hi - lo) * 0.12 || Math.abs(hi) * 0.1 || 0.05;
    lo -= padv; hi += padv;
    const x = cfg.ordinal
      ? i => L + (xs.length === 1 ? pw / 2 : (i / (xs.length - 1)) * pw)
      : v => L + (v - xs[0]) / ((xs[xs.length - 1] - xs[0]) || 1) * pw;
    const y = v => T + ph - (v - lo) / ((hi - lo) || 1) * ph;

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart-svg', role: 'img' });
    niceTicks(lo, hi).forEach(t => {
      svg.append(svgEl('line', { x1: L, x2: W - R, y1: y(t), y2: y(t), stroke: 'var(--line-2)', 'stroke-width': 1 }));
      const lab = svgEl('text', { x: L - 8, y: y(t) + 4, 'text-anchor': 'end', class: 'chart-tick' });
      lab.textContent = Math.abs(t) >= 10 ? t.toFixed(0) : t.toFixed(2);
      svg.append(lab);
    });

    const tip = el('div', 'chart-tip');
    shown.forEach(model => {
      const pts = xs.map((xv, i) => {
        const r = rows.find(rr => rr.model === model && rr[cfg.xKey] === xv);
        return r && r[state.metric] != null ? { cx: cfg.ordinal ? x(i) : x(xv), cy: y(r[state.metric]), v: r[state.metric], xv } : null;
      }).filter(Boolean);
      if (!pts.length) return;
      svg.append(svgEl('path', {
        d: pts.map((p, i) => (i ? 'L' : 'M') + p.cx.toFixed(1) + ' ' + p.cy.toFixed(1)).join(' '),
        fill: 'none', stroke: colours[model] || 'var(--ink-3)', 'stroke-width': 2,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round'
      }));
      pts.forEach(p => {
        const dot = svgEl('circle', { cx: p.cx, cy: p.cy, r: pts.length > 30 ? 2.2 : 3.4,
                                      fill: colours[model] || 'var(--ink-3)', class: 'chart-dot' });
        dot.addEventListener('mousemove', e => {
          const b = mount.getBoundingClientRect();
          tip.innerHTML = `<b>${modelLabel(model)}</b><br>${cfg.xLabelShort}: ${cfg.formatX(p.xv)}`
            + `<br>${cfg.metrics.find(m => m.key === state.metric).label}: ${formatV(p.v, state.metric)}`;
          tip.style.left = (e.clientX - b.left) + 'px';
          tip.style.top = (e.clientY - b.top) + 'px';
          tip.classList.add('on');
        });
        dot.addEventListener('mouseleave', () => tip.classList.remove('on'));
        svg.append(dot);
      });
    });

    const every = Math.ceil(xs.length / 12);
    xs.forEach((xv, i) => {
      if (i % every) return;
      const lab = svgEl('text', { x: cfg.ordinal ? x(i) : x(xv), y: H - B + 22, 'text-anchor': 'middle', class: 'chart-tick' });
      lab.textContent = cfg.formatX(xv);
      svg.append(lab);
    });
    const xlab = svgEl('text', { x: L + pw / 2, y: H - B + 44, 'text-anchor': 'middle', class: 'chart-axis' });
    xlab.textContent = cfg.xLabel;
    svg.append(xlab);
    svg.append(svgEl('line', { x1: L, x2: L, y1: T, y2: T + ph, stroke: 'var(--line)', 'stroke-width': 1 }));
    mount.append(svg);

    const legend = el('div', 'chart-legend');
    models.forEach(model => {
      const b = el('button');
      b.type = 'button';
      if (hidden.has(model)) b.classList.add('is-off');
      b.append(Object.assign(el('i'), { style: `background:${colours[model] || 'var(--ink-3)'}` }),
               el('span', null, modelLabel(model)));
      b.onclick = () => {
        hidden.has(model) ? hidden.delete(model) : hidden.add(model);
        if (hidden.size === models.length) hidden.delete(model);
        draw();
      };
      legend.append(b);
    });
    mount.append(legend, tip);
  };

  draw();
}

// Second training runs (shown only in the supplement) and the comparison rows.
const SECOND_SEEDS = ['SpateGAN-IFS (seed 43)', 'CEDDAR-IFS (seed 505)'];
const COMPARISONS = ['SpateGAN-ERA5'];
// The previous selection is not shown anywhere on the page.
const DROPPED = ['Previous selection'];
const modelsFor = key => (window.METRICS.summary[key] ? window.METRICS.summary[key].rows.map(r => r.model) : []);

// Rows carry the summary key as their family (spategan, spategan-test, ...).
const familyOf = (rows, key) => { key = key.replace(/-seeds$/, ''); return rows.some(r => r.family === key) ? key : key.split('-')[0]; };

function leadChart(mount, key) {
  const models = modelsFor(key), family = familyOf(window.LEADTIME || [], key);
  const rows = (window.LEADTIME || []).filter(r => r.family === family && models.includes(r.model));
  if (!rows.length) return;
  const intervals = [...new Set(rows.map(r => r.interval))].sort().reverse(); // 3h first
  seriesChart(mount, {
    family, rows, intervals, metrics: LEAD_METRICS, models,
    xKey: 'lead', ordinal: false,
    xLabel: t('Forecast lead time (hours after the forecast was issued)'),
    xLabelShort: t('Lead'), formatX: v => v + ' h'
  });
}

function thresholdChart(mount, key) {
  const models = modelsFor(key), family = familyOf(window.BYTHRESHOLD || [], key);
  const rows = (window.BYTHRESHOLD || []).filter(r => r.family === family && models.includes(r.model));
  if (!rows.length) return;
  const intervals = [...new Set(rows.map(r => r.interval))].sort().reverse();
  seriesChart(mount, {
    family, rows, intervals, metrics: THRESHOLD_METRICS, models,
    xKey: 'threshold_mmh', ordinal: true,
    xLabel: t('Rainfall threshold (mm per hour)'),
    xLabelShort: t('Threshold'), formatX: v => v + ' mm/h'
  });
}

/* Ensemble FSS by threshold and neighbourhood size. "Difference from IFS"
   subtracts the matched IFS grid from the same suite, so blue cells are where
   the model's spatial agreement beats IFS. */
function fssGridTable(mount, family) {
  const M = window.METRICS;
  const grids = M.fssGrid[family];
  const models = Object.keys(grids);
  const state = mount._state || (mount._state = {
    model: models.includes(FINAL_MODEL) ? FINAL_MODEL : (models.find(m => m !== 'IFS') || models[0]), mode: 'diff' });

  const draw = () => {
    mount.innerHTML = '';
    const bar = el('div', 'chart-controls');
    bar.append(picker(t('Model'), models.map(m => ({ value: m, label: plainLabel(m) })), state.model,
                      v => { state.model = v; draw(); }));
    if (state.model !== 'IFS') {
      bar.append(picker(t('Show'), [{ value: 'diff', label: t('Difference from IFS') }, { value: 'value', label: t('FSS value') }],
                        state.mode, v => { state.mode = v; draw(); }));
    }
    mount.append(bar);

    const diff = state.mode === 'diff' && state.model !== 'IFS';
    const g = grids[state.model], ref = grids.IFS;
    const table = el('table', 'fss-grid');
    mount.dataset.key = t(diff ? 'Blue cells: better than IFS; orange cells: worse.' : 'Darker cells: higher FSS.');
    const cap = mount._caption;
    const key = cap && cap.querySelector('.cap-key');
    if (key) key.textContent = ' ' + mount.dataset.key;
    const hr = el('tr');
    hr.append(el('th', null, t('Threshold')));
    M.fssScales.forEach(s => hr.append(el('th', 'num', s + ' km')));
    const thead = el('thead');
    thead.append(hr);
    const tb = el('tbody');
    M.thresholds.forEach((th, i) => {
      const tr = el('tr');
      tr.append(el('td', null, th.hourly + ' mm/h'));
      g[i].forEach((v, j) => {
        const d = v - ref[i][j];
        const shown = diff ? (d >= 0 ? '+' : '−') + Math.abs(d).toFixed(3) : v.toFixed(3);
        const td = el('td', 'num', shown);
        // Square-root shading keeps small differences visible next to large ones.
        const pct = diff ? Math.sqrt(Math.min(Math.abs(d) / 0.3, 1)) * 40 : v * 40;   // capped so cell text keeps 4.5:1 in both themes
        const hue = diff && d < 0 ? 'var(--warn)' : 'var(--accent)';
        td.style.background = `color-mix(in srgb, ${hue} ${pct.toFixed(0)}%, var(--card))`;
        td.title = `${plainLabel(state.model)}: ${v.toFixed(4)} · IFS: ${ref[i][j].toFixed(4)}`;
        tr.append(td);
      });
      tb.append(tr);
    });
    table.append(thead, tb);
    const wrap = el('div', 'tw');
    wrap.append(table);
    mount.append(cap ? exhibit(cap, wrap) : wrap);
  };
  draw();
}

// Repeat the project identity in navigation only after the title leaves view.
const reportHeader = document.querySelector('.hero');
const reportNav = document.querySelector('.nav');
new IntersectionObserver(([entry]) => {
  const pastHeader = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0;
  reportNav.classList.toggle('past-header', pastHeader);
  reportNav.querySelector('.nav-brand').setAttribute('aria-hidden', String(!pastHeader));
  reportNav.querySelector('.nav-brand').tabIndex = pastHeader ? 0 : -1;
}, { threshold: 0 }).observe(reportHeader);

const testsMenu = document.querySelector('.nav-tests');
// Supplementary sections and the references are collapsed; following a link into one opens it first.
const openBox = target => {
  const box = target && (target.matches('details') ? target : target.closest('details.supp, details.refs'));
  if (box) box.open = true;
  return box;
};
const openTarget = () => {
  const target = location.hash && document.querySelector(location.hash);
  if (openBox(target)) target.scrollIntoView();
};
addEventListener('hashchange', openTarget);
document.addEventListener('DOMContentLoaded', openTarget);
// A link to the hash already in the address bar fires no hashchange, so open its box on click as well.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link && link.getAttribute('href').length > 1) openBox(document.querySelector(link.getAttribute('href')));
});
// The language switch keeps the reader's place: index.html#methods opens index.ko.html#methods.
document.addEventListener('click', event => {
  const link = event.target.closest('a.lang-toggle');
  if (link) link.hash = location.hash;
});
if (testsMenu) {
  testsMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { testsMenu.open = false; }));
  document.addEventListener('click', event => { if (!testsMenu.contains(event.target)) testsMenu.open = false; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && testsMenu.open) { testsMenu.open = false; testsMenu.querySelector('summary').focus(); } });
}

// Render navigation help outside the bar so labels do not resize or clip controls.
(() => {
 const tip = document.createElement('div'); tip.className = 'nav-help'; tip.hidden = true; tip.id = 'nav-help'; tip.setAttribute('role', 'tooltip'); document.body.append(tip);
 document.querySelectorAll('.nav a[title], .nav summary[title], .nav button[title]').forEach(el => {
  const label = el.getAttribute('title'); el.removeAttribute('title');
  const hide = () => { tip.hidden = true; el.removeAttribute('aria-describedby'); };
  const show = () => { tip.textContent = label; tip.hidden = false; el.setAttribute('aria-describedby', tip.id); const r = el.getBoundingClientRect(); tip.style.top = `${r.bottom + 8}px`; tip.style.left = `${Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, r.left + r.width / 2 - tip.offsetWidth / 2))}px`; };
  el.addEventListener('mouseenter', show); el.addEventListener('focus', show); el.addEventListener('mouseleave', hide); el.addEventListener('blur', hide); el.addEventListener('click', hide); el.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
 });
 window.addEventListener('scroll', () => { tip.hidden = true; }, {passive:true});
})();
