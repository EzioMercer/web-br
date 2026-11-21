/** Whether GPU name `gpu` (lower case) is a dedicated graphics card or Apple silicon. */
export const isDedicatedGpu = (gpu: string) => /nvidia|geforce|quadro|radeon (rx|pro)|intel.*\barc\b|apple (gpu|m\d)/
  .test(gpu);
