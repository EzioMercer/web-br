/** Last value written per element and key, so unchanged values are not written again. */
const written = new WeakMap<HTMLElement, Record<string, string>>();

/**
 * Sets `key` of element `el`: `text`, `html`, `class`, or a style property (`width`, `--g`...). Writes only when the
 * value changed: every write, even of the same value, can make the browser recalculate styles and layout.
 */
export const writeDom = (el: HTMLElement, key: string, v: string) => {
  let w = written.get(el);

  if (!w) {
    w = {};
    written.set(el, w);
  }

  if (w[key] === v) {
    return;
  }

  w[key] = v;

  if (key === 'text') {
    el.textContent = v;
  } else if (key === 'html') {
    el.innerHTML = v;
  } else if (key === 'class') {
    el.className = v;
  } else {
    el.style.setProperty(key, v);
  }
};
