/* G-26IND-A technical report page.
   One master clock per viewer, 48 half-hour ticks over 24 hours. Layers map the
   current tick to their own frame index, so a three-hour layer holds each frame
   for six ticks and stays aligned with the half-hour layers rather than drifting. */

const TICKS = 48;            // 24 h at 30 min
const TICK_MIN = 30;
const PENDING = '<span class="pending" title="not yet available">&ndash;</span>';

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
const pad = n => String(n).padStart(2, '0');

function addMinutes(iso, mins) {
  return new Date(Date.parse(iso) + mins * 60000);
}
function clockLabel(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} `
       + `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/* ------------------------------------------------------------------ viewer */



class CaseViewer {
  constructor(mount, { region, domain }) {
    this.mount = mount;
    this.region = region;
    this.domain = domain;
    this.cases = window.CASES.filter(c => c.region === region);
    this.caseIdx = 0;
    this.tick = 0;
    this.playing = false;
    this.msPerTick = 200;
    this.acc = 0;
    this.last = 0;
    this.panels = [];

    const first = this.layersFor(this.cases[0]);
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
      .filter(([, def]) => def.domain === this.domain)
      .map(([key, def]) => ({ key, def }))
      .sort((a, b) => a.def.order - b.def.order);
  }

  get current() { return this.cases[this.caseIdx]; }

  render() {
    const bar = el('div', 'viewer-bar');

    const caseTabs = el('div', 'tabs');
    this.cases.forEach((c, i) => {
      const b = el('button', null, c.label || c.id);
      b.setAttribute('aria-selected', i === 0);
      b.onclick = () => this.selectCase(i);
      caseTabs.append(b);
    });
    this.caseTabs = caseTabs;

    this.meta = el('div', 'viewer-meta');
    bar.append(caseTabs, this.meta);

    this.grid = el('div', 'panels');

    const controls = el('div', 'controls');
    this.playBtn = el('button', 'btn btn-play', '&#9654;');
    this.playBtn.setAttribute('aria-label', 'Play');
    this.playBtn.title = 'Play';
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
    controls.append(this.playBtn, back, fwd, this.scrub, this.speed, this.clock);

    this.loadEl = el('div', 'loading');

    this.toggles = el('div', 'layer-toggles');

    // The colourbar belongs to the viewer, so it lives inside the pane.
    this.cbar = el('div', 'cbar');
    colourbar(this.cbar);

    const timingNote = el('p', 'timing-note', 'Three-hour totals stay fixed while the half-hour frames advance.');
    this.mount.append(bar, this.toggles, this.grid, controls, timingNote, this.loadEl, this.cbar);
  }

  selectCase(i) {
    this.caseIdx = i;
    [...this.caseTabs.children].forEach((b, j) => b.setAttribute('aria-selected', i === j));
    this.seek(0);
    this.rebuildPanels();
  }

  rebuildPanels() {
    const c = this.current;
    const layers = this.layersFor(c);
    if (!layers.some(l => this.active.has(l.key))) {
      layers.filter(l => l.def.default).forEach(l => this.active.add(l.key));
    }
    const shown = layers.filter(l => this.active.has(l.key));

    this.grid.innerHTML = '';
    this.panels = shown.map(({ key, def }) => {
      const p = el('div', 'panel' + (def.role === 'target' ? ' is-target' : ''));
      const head = el('div', 'panel-head');
      head.append(el('span', 'panel-title', noBreakParens(datasetLabel(def.label))),
                  el('span', 'panel-role role-' + def.role, def.role));
      const frame = el('div', 'frame');
      if (def.base) frame.style.backgroundImage = `url("${def.base}")`;
      const a = el('img'), b = el('img');
      [a, b].forEach(img => { img.alt = def.label; img.decoding = 'sync'; });
      a.classList.add('on');
      frame.append(a, b, el('span', 'cadence', def.cadence === 30 ? '30 min' : '3 h'));
      p.append(head, frame);
      this.grid.append(p);
      return { def, imgs: [a, b], cur: 0, url: null };
    });

    // Toggle any layer while keeping at least one visible.
    this.toggles.innerHTML = '';
    this.toggles.append(el('span', 'hint', 'Show tiles:'));
    layers.forEach(({ key, def }) => {
      const selected = this.active.has(key);
      const button = el('button', selected ? '' : 'is-off', datasetLabel(def.label));
      button.type = 'button';
      button.setAttribute('aria-pressed', String(selected));
      button.disabled = selected && shown.length === 1;
      button.onclick = () => {
        selected ? this.active.delete(key) : this.active.add(key);
        this.rebuildPanels();
      };
      this.toggles.append(button);
    });

    this.meta.textContent = `${shown.length} panels · 24 h from ${clockLabel(new Date(Date.parse(c.start)))}`;
    if (this.near) this.preload();
    else this.loadEl.textContent = 'frames load when you scroll here';
    this.paint();
  }

  frameIndex(def) {
    const step = def.cadence / TICK_MIN;         // 1 for 30 min, 6 for 3 h
    return Math.min(Math.floor(this.tick / step), def.frames.length - 1);
  }

  preload() {
    const urls = this.panels.flatMap(p => p.def.base ? [p.def.base, ...p.def.frames] : p.def.frames);
    let done = 0, failed = 0;
    const bar = el('span', 'bar');
    const fill = el('i');
    bar.append(fill);
    this.loadEl.innerHTML = '';
    this.loadEl.append(bar, document.createTextNode(`loading ${urls.length} frames`));
    const token = (this.token = Symbol());
    urls.forEach(u => {
      const img = new Image();
      const tally = (ok) => {
        if (token !== this.token) return;
        done++;
        if (!ok) failed++;
        fill.style.width = (done / urls.length * 100) + '%';
        if (done === urls.length) this.loadEl.textContent = failed
          ? `${done - failed}/${urls.length} frames loaded · ${failed} failed`
          : `${urls.length} frames ready`;
      };
      img.onload = () => tally(true);
      img.onerror = () => tally(false);
      img.src = u;
    });
  }

  paint() {
    for (const p of this.panels) {
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
    this.clock.textContent = clockLabel(stamp);
    this.scrub.value = this.tick;
  }

  seek(t) {
    this.tick = ((t % TICKS) + TICKS) % TICKS;
    this.paint();
  }

  toggle() { this.playing ? this.pause() : this.play(); }
  play() { this.playing = true; this.last = performance.now(); this.playBtn.textContent = 'Ⅱ'; this.playBtn.setAttribute('aria-label', 'Pause'); this.playBtn.title = 'Pause'; }
  pause() { this.playing = false; this.playBtn.textContent = '▶'; this.playBtn.setAttribute('aria-label', 'Play'); this.playBtn.title = 'Play'; }

  loop(now) {
    if (this.playing) {
      this.acc += now - this.last;
      while (this.acc >= this.msPerTick) { this.acc -= this.msPerTick; this.seek(this.tick + 1); }
    }
    this.last = now;
    requestAnimationFrame(this.loop);
  }
}

/* ------------------------------------------------------------------ tables */

function summaryTable(key) {
  const data = window.METRICS.summary[key];
  // Headers carry their units and wrap to two lines; the column then sizes to
  // the longest word rather than the whole string.
  const dir = d => '&nbsp;<span class="dir">' + (d === 'up' ? '&uarr;' : '&darr;') + '</span>';
  const cols = [['mae', 'MAE' + dir('dn')], ['pod', 'POD-M' + dir('up')],
                ['far', 'FAR-M' + dir('dn')], ['csi', 'CSI-M' + dir('up')],
                ['fss', 'Ensemble FSS' + dir('up')], ['crps', 'CRPS' + dir('dn')]];
  const t = el('table');
  const thead = el('thead');
  const hr = el('tr');
  hr.append(el('th', null, 'Model'));
  cols.forEach(([, label]) => hr.append(el('th', 'num', label)));
  thead.append(hr);
  const tb = el('tbody');
  data.rows.forEach(r => {
    const tr = el('tr', r.ref ? 'is-ref' : r.best ? 'is-best' : '');
    tr.append(el('td', null, noBreakParens(r.model)));
    cols.forEach(([k]) => tr.append(el('td', 'num', fmt4(r[k]))));
    tb.append(tr);
  });
  t.append(thead, tb);
  const wrap = el('div', 'tw');
  wrap.append(t);
  const box = document.createDocumentFragment();
  box.append(wrap, el('p', 'tnote',
    'MAE and CRPS are in <span class="nb">mm per three hours</span>; the detection '
    + 'and FSS scores are dimensionless. ' + data.note));
  return box;
}

function simpleTable(rows, cols) {
  const t = el('table');
  const thead = el('thead'), hr = el('tr');
  cols.forEach(c => hr.append(el('th', c.num ? 'num' : '', c.label)));
  thead.append(hr);
  const tb = el('tbody');
  rows.forEach(r => {
    const tr = el('tr');
    cols.forEach(c => tr.append(el('td', c.num ? 'num' : '',
      r[c.key] == null ? PENDING : noBreakParens(String(r[c.key])))));
    tb.append(tr);
  });
  t.append(thead, tb);
  const wrap = el('div', 'tw');
  wrap.append(t);
  return wrap;
}

function colourbar(mount) {
  const p = window.METRICS.palette;
  const n = p.levels.length;

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

  const keys = el('div', 'cbar-keys');
  const swatch = (colour, label) => {
    const k = el('span', 'cbar-key');
    const box = el('i');
    if (colour) box.style.background = colour;
    else box.classList.add('is-clear');
    k.append(box, document.createTextNode(label));
    return k;
  };
  keys.append(swatch(null, 'below 0.1 mm, unshaded'),
              swatch(p.missing, 'missing observation'));

  mount.append(strip, ticks, keys);
  mount.append(el('p', 'cbar-note',
    'Rainfall accumulation in mm. The same scale is used for the half-hour and three-hour panels, '
    + 'so a three-hour field accumulates over six times the window of a half-hour field.'));
}


/* ----------------------------------------------------------- numbering */

const ROMAN = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
function roman(n) {
  let out = '';
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v; }
  return out;
}

// Figures are numbered 1, 2, 3 with the label below; tables I, II, III with the
// label above. The interactive case viewers are deliberately left unnumbered.
function numberExhibits() {
  document.querySelectorAll('figure > figcaption').forEach((cap, i) => {
    cap.innerHTML = '<b>Fig. ' + (i + 1) + '.</b> ' + cap.innerHTML;
  });
  document.querySelectorAll('table').forEach((tbl, i) => {
    const host = tbl.closest('.tw') || tbl;
    const src = tbl.closest('[data-caption]');
    const caption = src ? ' ' + src.dataset.caption : '';
    const label = el('div', 'table-label',
      '<b>Table ' + roman(i + 1) + '.</b>' + datasetLabel(caption));
    host.parentNode.insertBefore(label, host);
  });
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
  links.set('crossproject', testsSummary);
  const sections = [...document.querySelectorAll('[id]')].filter(node => links.has(node.id));
  if (!sections.length) return;
  const sync = () => {
    let active = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= 140) active = s;
    links.forEach(a => a.classList.remove('is-active'));
    links.get(active.id)?.classList.add('is-active');
    testsSummary.classList.toggle('is-active', ['indonesia', 'crossproject', 'philippines', 'ghana'].includes(active.id));
  };
  addEventListener('scroll', sync, { passive: true });
  sync();
}

/* ------------------------------------------------------------------ init */

document.addEventListener('DOMContentLoaded', () => {
  // Only use explicitly available compressed copies.
  const optimized = window.OPTIMIZED_IMAGES || {};
  // The published copy splits each sequence into one basemap per folder and rain-only overlays.
  const bases = window.FRAME_BASES || {};
  window.CASES.forEach(c => Object.values(c.layers).forEach(layer => {
    layer.frames = layer.frames.map(url => optimized[url] || url);
    layer.base = bases[layer.frames[0]?.replace(/[^/]*$/, '')];
  }));

  document.querySelectorAll('[data-viewer]').forEach(node => {
    const [region, domain] = node.dataset.viewer.split(':');
    new CaseViewer(node, { region, domain });
  });

  document.querySelectorAll('[data-summary]').forEach(n => n.append(summaryTable(n.dataset.summary)));

  const M = window.METRICS;
  document.querySelector('[data-table="samples"]').append(simpleTable(M.samples, [
    { key: 'model', label: 'Model' }, { key: 'unit', label: 'One training sample' },
    { key: 'train', label: 'Training samples', num: true }, { key: 'val', label: 'Validation samples', num: true }]));

  document.querySelector('[data-table="blocks"]').append(simpleTable(M.validationBlocks, [
    { key: 'block', label: 'Validation block' },
    { key: 'start', label: 'Start (UTC, inclusive)' }, { key: 'end', label: 'End (UTC, exclusive)' }]));

  document.querySelector('[data-table="training"]').append(simpleTable(M.training, [
    { key: 'model', label: 'Model' }, { key: 'completed', label: 'Completed training' },
    { key: 'gpu', label: 'GPU' }, { key: 'batch', label: 'Batch size', num: true },
    { key: 'wall', label: 'Full run time', num: true }, { key: 'gpuHours', label: 'GPU-hours', num: true }]));

  document.querySelector('[data-table="inference"]').append(simpleTable(M.inference, [
    { key: 'model', label: 'Model' }, { key: 'params', label: 'Parameters (M)', num: true },
    { key: 'gflops', label: 'Est. GFLOPs / sample', num: true }, { key: 'perSample', label: 'Inference / sample (s)', num: true },
    { key: 'mem', label: 'Peak GPU memory (GiB)', num: true }, { key: 'perCase', label: 'Inference / 24-h case (s)', num: true }]));

  document.querySelector('[data-table="thresholds"]').append(simpleTable(M.thresholds, [
    { key: 'hourly', label: 'Threshold (mm/hour)', num: true },
    { key: 'threeHour', label: 'Converted (mm per 3 hours)', num: true }]));

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
const CHART_METRICS = [
  { key: 'mae',  label: 'MAE',      better: 'lower'  },
  { key: 'pod',  label: 'POD-M',    better: 'higher' },
  { key: 'far',  label: 'FAR-M',    better: 'lower'  },
  { key: 'csi',  label: 'CSI-M',    better: 'higher' },
  { key: 'fss',  label: 'Ens. FSS', better: 'higher' },
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
          fill: CHART_COLOURS[idx % CHART_COLOURS.length], rx: 2, class: 'chart-bar'
        });
        rect.addEventListener('mousemove', e => {
          const b = mount.getBoundingClientRect();
          tip.innerHTML = `<b>${row.model}</b><br>${m.label}: ${row[m.key].toFixed(4)}`
            + `<br>IFS: ${ref[m.key].toFixed(4)}`
            + `<br><b>${g >= 0 ? '+' : ''}${(g * 100).toFixed(1)}%</b> ${g >= 0 ? 'better' : 'worse'} than IFS`;
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
      b.append(Object.assign(el('i'), { style: `background:${CHART_COLOURS[i % CHART_COLOURS.length]}` }),
               document.createTextNode(row.model));
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
  { key: 'ratio', label: 'Rainfall total ratio' },
  { key: 'fbias', label: 'Frequency bias' }
];

function ratioChart(mount, familyKey) {
  const rows = window.METRICS.summary[familyKey].rows.filter(r => r.ratio != null);
  if (!rows.length) return;
  const hidden = mount._hidden || (mount._hidden = new Set());
  const colour = r => (r.ref ? 'var(--ink-3)' : CHART_COLOURS[rows.filter(x => !x.ref).indexOf(r) % CHART_COLOURS.length]);

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
    tgt.textContent = '1.0 = same as observed';
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
          tip.innerHTML = `<b>${row.model}</b><br>${m.label}: ${v.toFixed(4)}`
            + `<br>${v >= 1 ? 'produces ' + off + '% more' : 'produces ' + Math.abs(off) + '% less'} than observed`;
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
    ylab.textContent = 'model \u00f7 observed';
    svg.append(ylab);
    mount.append(svg);

    const legend = el('div', 'chart-legend');
    rows.forEach((row, i) => {
      const b = el('button');
      b.type = 'button';
      if (hidden.has(i)) b.classList.add('is-off');
      b.append(Object.assign(el('i'), { style: `background:${colour(row)}` }),
               document.createTextNode(row.model + (row.ref ? ' (reference)' : '')));
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
function familyColours(family) {
  const rows = window.METRICS.summary[family].rows;
  const map = {};
  let i = 0;
  rows.forEach(r => { map[r.model] = r.ref ? 'var(--ink-3)' : CHART_COLOURS[i++ % CHART_COLOURS.length]; });
  return map;
}

const LEAD_METRICS = [
  { key: 'csi',   label: 'CSI-M' },
  { key: 'pod',   label: 'POD-M' },
  { key: 'far',   label: 'FAR-M' },
  { key: 'fss',   label: 'Ensemble FSS' },
  { key: 'mae',   label: 'MAE' },
  { key: 'crps',  label: 'CRPS' },
  { key: 'fbias', label: 'Frequency bias' },
  { key: 'ratio', label: 'Rainfall total ratio' }
];

const THRESHOLD_METRICS = [
  { key: 'csi',   label: 'CSI' },
  { key: 'pod',   label: 'POD' },
  { key: 'far',   label: 'FAR' },
  { key: 'fbias', label: 'Frequency bias' }
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
  const colours = familyColours(cfg.family);
  const hidden = mount._hidden || (mount._hidden = new Set());
  const state = mount._state || (mount._state = { metric: cfg.metrics[0].key, interval: cfg.intervals[0] });

  const draw = () => {
    mount.innerHTML = '';
    mount.style.position = 'relative';

    const bar = el('div', 'chart-controls');
    bar.append(picker('Metric', cfg.metrics.map(m => ({ value: m.key, label: m.label })),
                      state.metric, v => { state.metric = v; draw(); }));
    if (cfg.intervals.length > 1) {
      bar.append(picker('Interval', cfg.intervals.map(i => ({ value: i, label: i === '30min' ? '30 minutes' : '3 hours' })),
                        state.interval, v => { state.interval = v; draw(); }));
    }
    mount.append(bar);

    const rows = cfg.rows.filter(r => r.interval === state.interval);
    const models = [...new Set(rows.map(r => r.model))];
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
          tip.innerHTML = `<b>${model}</b><br>${cfg.xLabelShort}: ${cfg.formatX(p.xv)}`
            + `<br>${cfg.metrics.find(m => m.key === state.metric).label}: ${p.v.toFixed(4)}`;
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
               document.createTextNode(model));
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

function leadChart(mount, family) {
  const rows = (window.LEADTIME || []).filter(r => r.family === family);
  if (!rows.length) return;
  const intervals = [...new Set(rows.map(r => r.interval))].sort().reverse(); // 3h first
  seriesChart(mount, {
    family, rows, intervals, metrics: LEAD_METRICS,
    xKey: 'lead', ordinal: false,
    xLabel: 'Forecast lead time (hours after the forecast was issued)',
    xLabelShort: 'Lead', formatX: v => v + ' h'
  });
}

function thresholdChart(mount, family) {
  const rows = (window.BYTHRESHOLD || []).filter(r => r.family === family);
  if (!rows.length) return;
  const intervals = [...new Set(rows.map(r => r.interval))].sort().reverse();
  seriesChart(mount, {
    family, rows, intervals, metrics: THRESHOLD_METRICS,
    xKey: 'threshold_mmh', ordinal: true,
    xLabel: 'Rainfall threshold (mm per hour)',
    xLabelShort: 'Threshold', formatX: v => v + ' mm/h'
  });
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
testsMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { testsMenu.open = false; }));
document.addEventListener('click', event => { if (!testsMenu.contains(event.target)) testsMenu.open = false; });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && testsMenu.open) { testsMenu.open = false; testsMenu.querySelector('summary').focus(); } });

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
