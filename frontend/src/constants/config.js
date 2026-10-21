export const DEFAULT_TEXT_MODEL = 'deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo';

export const PRICING_RATES = {
  inputPerMillion: 0.10,
  outputPerMillion: 0.32,
  label: 'Proprietary High-Throughput Exam Engine'
};

export const DEFAULT_IMAGE_MODEL = 'black-forest-labs/FLUX-2-klein-4b';

export const IMAGE_PRICING = {
  baseRate: 0.014,
  defaultWidth: 1024,
  defaultHeight: 1024,
  defaultIters: 0,
  formulaLabel: 'FLUX-2 Klein Ultra-Fast Neural Synthesis ($0.014 / img)',
  calculate: (w = 1024, h = 1024) => 0.014 * (w / 1024) * (h / 1024)
};

export const IMAGE_RESOLUTION_PRESETS = [
  { label: '1024 × 1024 (Standard Quality)', width: 1024, height: 1024 },
  { label: '768 × 768 (Medium Balanced)', width: 768, height: 768 },
  { label: '512 × 512 (Fast Lightweight)', width: 512, height: 512 }
];

export const MODEL_OPTIONS = [
  {
    id: 'deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo',
    label: 'Infynno Autonomous Psychometric Engine (v2.0 Enterprise)'
  }
];

