const fs = require('fs');
const path = require('path');

const UICONS_DIR = path.join(__dirname, '..', 'node_modules', '@flaticon', 'flaticon-uicons', 'css');

const families = [
  { dir: 'regular/rounded.css', prefix: 'fi-rr-', label: 'Regular Rounded' },
  { dir: 'regular/straight.css', prefix: 'fi-rs-', label: 'Regular Straight' },
  { dir: 'bold/rounded.css', prefix: 'fi-br-', label: 'Bold Rounded' },
  { dir: 'bold/straight.css', prefix: 'fi-bs-', label: 'Bold Straight' },
  { dir: 'thin/rounded.css', prefix: 'fi-tr-', label: 'Thin Rounded' },
  { dir: 'thin/straight.css', prefix: 'fi-ts-', label: 'Thin Straight' },
  { dir: 'solid/rounded.css', prefix: 'fi-sr-', label: 'Solid Rounded' },
  { dir: 'solid/straight.css', prefix: 'fi-ss-', label: 'Solid Straight' },
  { dir: 'brands/all.css', prefix: 'fi-brands-', label: 'Brands' },
];

function extractIcons(cssContent, prefix) {
  const regex = new RegExp(`\\.${prefix.replace('-', '\\-')}([a-z0-9][a-z0-9-]*)`, 'g');
  const icons = new Set();
  let match;
  while ((match = regex.exec(cssContent)) !== null) {
    const name = match[1];
    if (name) icons.add(name);
  }
  return [...icons].sort();
}

const familyData = families.map(f => {
  const cssPath = path.join(UICONS_DIR, f.dir);
  const css = fs.readFileSync(cssPath, 'utf-8');
  const icons = extractIcons(css, f.prefix);
  console.log(`${f.label} (${f.prefix}): ${icons.length} icons`);
  return { ...f, icons };
});

const pkgVersion = JSON.parse(
  fs.readFileSync(path.join(UICONS_DIR, '..', 'package.json'), 'utf-8')
).version;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Flaticon UIcons - Catálogo de iconos</title>

<!-- Flaticon UIcons CSS from CDN -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@flaticon/flaticon-uicons@${pkgVersion}/css/all/all.css">

<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f0f2f5;
    color: #333;
    padding: 0;
  }

  .header {
    background: #1e979f;
    color: white;
    padding: 24px 32px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }

  .header h1 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .header .subtitle {
    font-size: 13px;
    opacity: 0.85;
  }

  .search-bar {
    margin-top: 16px;
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .search-bar input {
    flex: 1;
    padding: 10px 16px;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    outline: none;
    background: rgba(255,255,255,0.95);
    max-width: 500px;
  }

  .search-bar .count {
    font-size: 13px;
    opacity: 0.85;
    white-space: nowrap;
  }

  .tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 12px 32px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
    position: sticky;
    top: 92px;
    z-index: 99;
  }

  .tab {
    padding: 6px 14px;
    border: 1px solid #d0d0d0;
    border-radius: 20px;
    background: #fff;
    cursor: pointer;
    font-size: 13px;
    color: #555;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .tab:hover { background: #f0f0f0; }

  .tab.active {
    background: #1e979f;
    color: #fff;
    border-color: #1e979f;
  }

  .tab .badge {
    font-size: 11px;
    opacity: 0.7;
    margin-left: 4px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    padding: 24px 32px;
  }

  .icon-card {
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    padding: 16px 8px 10px;
    text-align: center;
    cursor: pointer;
    transition: all 0.15s;
    position: relative;
  }

  .icon-card:hover {
    border-color: #1e979f;
    box-shadow: 0 2px 8px rgba(30,151,159,0.15);
    transform: translateY(-1px);
  }

  .icon-card i {
    font-size: 28px;
    color: #333;
    display: block;
    margin-bottom: 8px;
    height: 32px;
    line-height: 32px;
  }

  .icon-card .name {
    font-size: 11px;
    color: #888;
    word-break: break-all;
    line-height: 1.3;
  }

  .icon-card .code {
    font-size: 10px;
    color: #aaa;
    margin-top: 4px;
    font-family: 'SF Mono', Monaco, monospace;
    word-break: break-all;
    line-height: 1.3;
  }

  .icon-card.copied::after {
    content: 'Copiado!';
    position: absolute;
    top: 4px;
    right: 4px;
    background: #1e979f;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .empty {
    text-align: center;
    padding: 60px 32px;
    color: #999;
    font-size: 16px;
  }

  @media (max-width: 600px) {
    .header { padding: 16px; }
    .tabs { padding: 8px 16px; }
    .grid { padding: 16px; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
  }
</style>
</head>
<body>

<div class="header">
  <h1>Flaticon UIcons v${pkgVersion}</h1>
  <p class="subtitle">Catálogo completo de iconos - Haz clic en un icono para copiar su código</p>
  <div class="search-bar">
    <input type="text" id="search" placeholder="Buscar icono..." autocomplete="off" autofocus>
    <span class="count" id="count"></span>
  </div>
</div>

<div class="tabs" id="tabs"></div>
<div class="grid" id="grid"></div>
<div class="empty" id="empty" style="display:none">No se encontraron iconos</div>

<script>
const DATA = ${JSON.stringify(familyData.map(f => ({
  prefix: f.prefix,
  label: f.label,
  icons: f.icons
})))};

let activeFamily = 0;
let searchTerm = '';

const tabsEl = document.getElementById('tabs');
const gridEl = document.getElementById('grid');
const countEl = document.getElementById('count');
const emptyEl = document.getElementById('empty');
const searchEl = document.getElementById('search');

function render() {
  const family = DATA[activeFamily];
  const filtered = searchTerm
    ? family.icons.filter(name => name.includes(searchTerm))
    : family.icons;

  countEl.textContent = filtered.length + ' / ' + family.icons.length + ' iconos';
  emptyEl.style.display = filtered.length === 0 ? '' : 'none';
  gridEl.style.display = filtered.length === 0 ? 'none' : '';

  gridEl.innerHTML = filtered.map(name => {
    const cls = 'fi ' + family.prefix + name;
    const code = '<i class="' + cls + '"><\\/i>';
    return '<div class="icon-card" data-code="' + code.replace(/"/g, '&quot;') + '">'
      + '<i class="' + cls + '"></i>'
      + '<div class="name">' + name + '</div>'
      + '<div class="code">' + family.prefix + name + '</div>'
      + '</div>';
  }).join('');
}

function renderTabs() {
  tabsEl.innerHTML = DATA.map((f, i) =>
    '<button class="tab' + (i === activeFamily ? ' active' : '') + '" data-idx="' + i + '">'
    + f.label + '<span class="badge">(' + f.icons.length + ')</span></button>'
  ).join('');
}

tabsEl.addEventListener('click', e => {
  const btn = e.target.closest('.tab');
  if (!btn) return;
  activeFamily = parseInt(btn.dataset.idx);
  renderTabs();
  render();
});

gridEl.addEventListener('click', e => {
  const card = e.target.closest('.icon-card');
  if (!card) return;
  const code = card.dataset.code.replace(/\\\\\\//g, '/');
  navigator.clipboard.writeText(code).then(() => {
    card.classList.add('copied');
    setTimeout(() => card.classList.remove('copied'), 1200);
  });
});

searchEl.addEventListener('input', e => {
  searchTerm = e.target.value.toLowerCase().trim();
  render();
});

renderTabs();
render();
</script>
</body>
</html>`;

const outPath = path.join(__dirname, '..', 'icons.html');
fs.writeFileSync(outPath, html, 'utf-8');
console.log(`\nGenerated: ${outPath}`);
console.log(`Total families: ${familyData.length}`);
console.log(`Total icon entries: ${familyData.reduce((s, f) => s + f.icons.length, 0)}`);
