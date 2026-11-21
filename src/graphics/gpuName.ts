const probe = () => {
  try {
    // the same GPU preference as the game's renderer, so this names the GPU the game will run on
    const gl = document.createElement('canvas').getContext('webgl', { powerPreference: 'high-performance' });

    if (!gl) {
      return '';
    }

    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');

    gl.getExtension('WEBGL_lose_context')?.loseContext();

    return name;
  } catch {
    return '';
  }
};

let cached: string | null = null;

/** The GPU's name as the browser reports it ('' if it is hidden). */
export const gpuName = () => {
  cached ??= probe();
  return cached;
};
