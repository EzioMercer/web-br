/** The GPU's name as the browser reports it ('' if it is hidden). */
export const gpuName = () => {
  try {
    const gl = document.createElement('canvas').getContext('webgl');

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
