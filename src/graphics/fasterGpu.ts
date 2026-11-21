import { gpuLabel } from './gpuLabel';

/** What WebGPU tells about an adapter (older browsers: requestAdapterInfo()). */
type AdapterInfo = { vendor?: string; architecture?: string; description?: string };

type Adapter = { info?: AdapterInfo; requestAdapterInfo?: () => Promise<AdapterInfo> };

type Gpu = { requestAdapter: (o: { powerPreference: string }) => Promise<Adapter | null> };

let found: Promise<string> | null = null;

const VENDORS: Record<string, string> = { nvidia: 'NVIDIA', amd: 'AMD', intel: 'Intel', apple: 'Apple' };

const probe = async () => {
  const gpu = (navigator as { gpu?: Gpu }).gpu;

  if (!gpu) {
    return '';
  }

  const a = await gpu.requestAdapter({ powerPreference: 'high-performance' });
  const info = a?.info ?? (await a?.requestAdapterInfo?.());
  const vendor = (info?.vendor ?? '').toLowerCase();
  const name = info?.description || VENDORS[vendor] || '';

  // the same maker as the GPU the game draws with: no other, stronger GPU in sight
  if (!vendor || !VENDORS[vendor] || gpuLabel().toLowerCase().includes(vendor)) {
    return '';
  }

  return name;
};

/**
 * A stronger GPU this computer has but the browser does not draw the game with (e.g. a laptop's graphics card while
 * the browser runs on the integrated GPU), or ''. Browsers only show it to WebGPU, and not all do: best effort.
 */
export const fasterGpu = () => {
  found ??= probe().catch(() => '');
  return found;
};
