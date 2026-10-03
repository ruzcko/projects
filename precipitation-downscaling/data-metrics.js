// Hand-maintained from G-26IND-A. Values are three-hour rainfall amounts,
// rounded to four decimals, Korean PEAK validation only.
// `null` renders as an em-free pending marker, matching the report convention.

window.METRICS = {
  updated: '2026-09-14',

  // ---- Headline tables -------------------------------------------------
  summary: {
    spategan: {
      note: 'Full 489-sequence PEAK validation, three ensemble members, central 144 x 144 cells at 2 km and central 18 hours per sequence. Three-hour amounts sum six half-hours. 2,934 scored window intervals across 824 unique forecast and 241 unique observation intervals; overlapping windows stay weighted as sampled. Replaces the earlier 437-case review, whose scores are not mixed in.',
      rows: [
        { model: 'IFS', ref: true, mae: 1.1026, pod: 0.3386, far: 0.6618, csi: 0.2145, fss: 0.4093, crps: 1.1026, ratio: 0.8825, fbias: 0.848 },
        { model: 'SpateGAN-IFS', mae: 1.2489, pod: 0.2721, far: 0.7152, csi: 0.1666, fss: 0.3790, crps: 1.1132, ratio: 0.895, fbias: 0.8692 },
        { model: 'SpateGAN-KMA', mae: 1.1745, pod: 0.2752, far: 0.6925, csi: 0.1727, fss: 0.3860, crps: 1.0408, ratio: 0.8374, fbias: 0.7741 },
        { model: 'SpateGAN-PEAK*', best: true, mae: 1.0663, pod: 0.2569, far: 0.6803, csi: 0.1660, fss: 0.3471, crps: 0.9556, ratio: 0.7179, fbias: 0.6016 },
        { model: 'SpateGAN-PEAK-5k', mae: 1.0407, pod: 0.1461, far: 0.7582, csi: 0.0997, fss: 0.2084, crps: 0.9663, ratio: 0.4119, fbias: 0.348 }
      ]
    },
    ceddar: {
      note: 'Full 1,518-forecast PEAK validation, three ensemble members, 56 denoising steps, full 128 x 128 domain at 2 km. Forecasts represent 253 unique observation interval ends. Selected checkpoint is corrected PEAK B0, epoch 19, selected by minimum validation EDM loss within that run.',
      rows: [
        { model: 'IFS', ref: true, mae: 1.0673, pod: 0.3430, far: 0.6429, csi: 0.2211, fss: 0.4155, crps: 1.0673, ratio: 0.8566, fbias: 0.8247 },
        { model: 'CEDDAR-PEAK*', best: true, mae: 1.3559, pod: 0.2910, far: 0.7546, csi: 0.1682, fss: 0.3836, crps: 0.9713, ratio: 1.0514, fbias: 1.0273 }
      ]
    }
  },

  // ---- Disaggregated results: awaiting sync ----------------------------
  // Shapes are fixed so populating these is a data drop, not new work.
  // byThreshold: { model: { '0.3': {pod, far, csi, n}, ... } }
  // fss:         { model: { '0.3': { '1': v, '4': v, ... } } }
  byThreshold: null,
  fssGrid: null,
  byLeadTime: null,

  thresholds: [
    { hourly: 0.1, threeHour: 0.3 },
    { hourly: 1, threeHour: 3 },
    { hourly: 3, threeHour: 9 },
    { hourly: 5, threeHour: 15 },
    { hourly: 8, threeHour: 24 }
  ],
  fssScales: [1, 4, 8, 16, 32, 64, 128],

  // ---- Cost ------------------------------------------------------------
  training: [
    { model: 'SpateGAN-PEAK', completed: '1,000 steps', gpu: '1 x V100 (32 GB)', batch: '9 (effective)', wall: '2 h 32 min', gpuHours: 2.54 },
    { model: 'CEDDAR-PEAK', completed: '400 epochs', gpu: '1 x V100 (32 GB)', batch: '16', wall: '10 h 29 min', gpuHours: 10.49 }
  ],
  inference: [
    { model: 'SpateGAN-PEAK', params: 4.484, gflops: 12857.0, perSample: '0.400 ± 0.002', mem: 2.052, perCase: '0.400 ± 0.002' },
    { model: 'CEDDAR-PEAK', params: 18.092, gflops: 998.7, perSample: '0.954 ± 0.003', mem: 0.133, perCase: '7.634 ± 0.011' }
  ],

  // ---- Dataset ---------------------------------------------------------
  samples: [
    { model: 'SpateGAN', unit: 'A 48-hour input sequence paired with a central 24-hour rainfall sequence', train: '9,242', val: '489' },
    { model: 'CEDDAR', unit: 'One paired three-hour rainfall field', train: '29,514', val: '1,518' }
  ],
  validationBlocks: [
    { block: 'Winter', start: '2025-02-13', end: '2025-02-21' },
    { block: 'Spring', start: '2025-05-05', end: '2025-05-13' },
    { block: 'Summer', start: '2025-07-16', end: '2025-07-24' },
    { block: 'Autumn', start: '2025-09-02', end: '2025-09-10' }
  ],

  // ---- Rainfall colour ramp -------------------------------------------
  // ecmwf_accumulation: ListedColormap over BoundaryNorm. 12 bins, 13 edges.
  // Below the first edge is unshaded; missing data is grey.
  palette: {
    levels: ['#efdbb7', '#b5f9aa', '#77f472', '#b5eff9', '#77baf9', '#3d96f4',
             '#1e6ded', '#ffe877', '#ffa000', '#ff0000', '#a32121', '#ff00ff'],
    bounds: [0.1, 1, 2, 5, 10, 15, 20, 30, 40, 50, 100, 300, 1000],
    under: null,          // below 0.1 mm: transparent
    over: '#ff00ff',      // above 1000 mm
    missing: '#bfbfbf'    // bad / no observation
  }
};
