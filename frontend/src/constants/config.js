export const DEFAULT_TEXT_MODEL = 'deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017';

export const PRICING_RATES = {
  inputPerMillion: 0.098,
  outputPerMillion: 0.294,
  label: 'DeepSeek-V4.1-Flash High-Throughput Reasoning Engine'
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
