const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

function extractSection(id) {
  const start = html.indexOf(`id="${id}"`);
  if (start === -1) return '';
  const nextSection = html.indexOf('<section', start + 10);
  return html.slice(start - 20, nextSection !== -1 ? nextSection : start + 3000);
}

console.log('=== FOTOS REALES ===');
console.log(extractSection('fotos-reales').slice(0, 1500));
