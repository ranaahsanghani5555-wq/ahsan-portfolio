/**
 * splitLines — a dependency-free line splitter for masked text reveals.
 *
 * Unlike a generic character splitter, this groups words into *visual lines*
 * by measuring each word's rendered offsetTop, then rebuilds the element as
 * one `.split-line` (overflow: hidden) per line holding a `.split-line__inner`
 * (inline-block) that a timeline can translate up behind the mask.
 *
 * The rebuild is destructive, so a `restore()` is returned to put the element
 * back to its plain text — required for React strict-mode double-mounts and
 * for a clean unmount.
 *
 * @param {HTMLElement} element  the rendered element to split
 * @param {Array<{ text: string, emphasis?: boolean }>} parts
 * @returns {{ lines: HTMLElement[], restore: () => void }}
 */
export function splitLines(element, parts) {
  const plain = parts.map((part) => part.text).join('');

  // 1. Lay the words out as inline spans so the browser wraps them naturally.
  element.textContent = '';
  parts.forEach((part) => {
    // Keep whitespace tokens so spacing survives the rebuild.
    part.text.split(/(\s+)/).forEach((token) => {
      if (token === '') return;
      if (/^\s+$/.test(token)) {
        element.appendChild(document.createTextNode(token));
        return;
      }
      const word = document.createElement('span');
      word.className = 'split-word';
      if (part.emphasis) word.classList.add('is-emphasis');
      word.textContent = token;
      element.appendChild(word);
    });
  });

  // 2. Group the rendered child nodes into lines by word offsetTop.
  const groups = [];
  let current = null;
  let lastTop = null;

  Array.from(element.childNodes).forEach((node) => {
    const isWord = node.nodeType === 1 && node.classList.contains('split-word');
    if (isWord) {
      const top = node.offsetTop;
      if (current === null || top !== lastTop) {
        current = [];
        groups.push(current);
        lastTop = top;
      }
      current.push(node);
    } else if (current) {
      current.push(node); // whitespace follows the word it trails
    }
  });

  // 3. Rebuild as masked lines.
  element.textContent = '';
  const lines = [];
  groups.forEach((group) => {
    const line = document.createElement('span');
    line.className = 'split-line';
    line.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('span');
    inner.className = 'split-line__inner';

    group.forEach((node) => inner.appendChild(node));
    line.appendChild(inner);
    element.appendChild(line);
    lines.push(inner);
  });

  return {
    lines,
    restore() {
      element.textContent = plain;
    },
  };
}
