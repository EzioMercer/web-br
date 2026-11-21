/** Whether GPU name `gpu` (lower case) is a software renderer: no GPU, the browser draws on the CPU. */
export const isSoftwareGpu = (gpu: string) => /swiftshader|llvmpipe|softpipe|software|basic render/.test(gpu);
