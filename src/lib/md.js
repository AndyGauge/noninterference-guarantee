// Minimal markdown helpers. All input is hardcoded in outline.js (trusted).
//
// `md(text)`    — inline: **bold**, *em*, `code`
// `mdBlock(t)`  — block: splits on blank lines into <p>…</p>, inline inside
//                 each. Dash lists become <ul>.

const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPE[c]);

function inline(safe) {
  return safe
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

export function md(text) {
  if (!text) return '';
  return inline(escape(text));
}

export function mdBlock(text) {
  if (!text) return '';
  const paragraphs = String(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs
    .map((p) => {
      const lines = p.split('\n');
      const isList = lines.every((l) => /^\s*-\s+/.test(l));
      if (isList) {
        const items = lines
          .map((l) => inline(escape(l.replace(/^\s*-\s+/, ''))))
          .map((item) => `<li>${item}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      return `<p>${inline(escape(p))}</p>`;
    })
    .join('');
}
