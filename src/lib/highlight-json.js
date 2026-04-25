// Tiny JSON syntax highlighter — produces HTML with classes the slide CSS
// styles. Dependency-free; trusted input (everything is hardcoded in
// outline.js, so no XSS surface here that ordinary escape doesn't cover).
//
// Token classes:
//   .jk — JSON object key (the string literal before a colon)
//   .js — JSON string value
//   .jn — JSON numeric literal
//   .jl — JSON literal (true / false / null)
//
// All other characters (braces, brackets, commas, colons, whitespace,
// commentary) are emitted as-is, escaped for HTML safety.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

export function highlightJson(src) {
  const re =
    /"(?:[^"\\]|\\.)*"\s*:|"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b|\s+|[^\s"\d-]+|[-]/g;
  const out = [];
  let m;
  while ((m = re.exec(String(src))) !== null) {
    const t = m[0];
    if (/^"[^]*"\s*:$/.test(t)) {
      // key followed by colon — color the string, leave the colon and any whitespace plain
      const closeQuote = t.lastIndexOf('"') + 1;
      const key = t.slice(0, closeQuote);
      const rest = t.slice(closeQuote);
      out.push(`<span class="jk">${escape(key)}</span>${escape(rest)}`);
    } else if (t.startsWith('"')) {
      out.push(`<span class="js">${escape(t)}</span>`);
    } else if (/^-?\d/.test(t)) {
      out.push(`<span class="jn">${escape(t)}</span>`);
    } else if (t === 'true' || t === 'false' || t === 'null') {
      out.push(`<span class="jl">${t}</span>`);
    } else {
      out.push(escape(t));
    }
  }
  return out.join('');
}
