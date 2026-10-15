export const DEFAULT_TEXT_MODEL = 'deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo';

export const PRICING_RATES = {
  inputPerMillion: 0.10,
  outputPerMillion: 0.32,
  label: '$0.10 in / $0.32 out / 1M tokens'
};

export const DEFAULT_IMAGE_MODEL = 'black-forest-labs/FLUX-1-schnell';

export const IMAGE_PRICING = {
  baseRate: 0.0005,
  defaultWidth: 1024,
  defaultHeight: 1024,
  defaultIters: 4,
  formulaLabel: '$0.0005 × (W/1024) × (H/1024) × iters',
  calculate: (w = 1024, h = 1024, iters = 4) => (0.0005 * (w / 1024) * (h / 1024) * iters)
};

export const IMAGE_RESOLUTION_PRESETS = [
  { label: '1024 × 1024 (Standard Quality)', width: 1024, height: 1024 },
  { label: '768 × 768 (Medium Balanced)', width: 768, height: 768 },
  { label: '512 × 512 (Fast Lightweight)', width: 512, height: 512 }
];

export const MODEL_OPTIONS = [
  {
    id: 'deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo',
    label: 'Autonomous Psychometric Engine (v2.0 High-Throughput Enterprise)'
  }
];
