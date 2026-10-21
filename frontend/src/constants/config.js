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
