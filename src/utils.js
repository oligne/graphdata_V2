export function simplifyPath(path) {
  const desktopIdx = path.indexOf('Desktop');
  if (desktopIdx !== -1) {
    path = path.substring(desktopIdx + 'Desktop'.length);
  }
  return path
    .split('/')
    .map(part => part
      .replace(/^\d+_/, '')
      .replace(/[^a-zA-Z ]/g, '')
      .trim()
    )
    .filter(part => part.length > 0)
    .join(' / ');
}

// Corrigé : le callback reçoit le texte à afficher
export function typeWriter(text, callback) {
  let i = 0;
  let out = '';
  function write() {
    if (i < text.length) {
      out += text.charAt(i) === '\n' ? '<br>' : text.charAt(i);
      if (callback) callback(out);
      i++;
      setTimeout(write, 15);
    } else if (callback) {
      callback(out);
    }
  }
  write();
}

function positionTooltip(e) {
  let left = e.clientX + 15;
  let top = e.clientY + 15;
  const tooltipRect = tooltip.getBoundingClientRect();
  const padding = 10;

  if (left + tooltipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width - padding;
  }
  if (top + tooltipRect.height > window.innerHeight - padding) {
    top = window.innerHeight - tooltipRect.height - padding;
  }
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}