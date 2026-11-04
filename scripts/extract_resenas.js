const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const start = html.indexOf('id="envios-resenas"');
const end = html.indexOf('<section id="fotos-reales"');

console.log('Section envios-resenas found:', start !== -1, end !== -1);
if (start !== -1 && end !== -1) {
  const content = html.slice(html.lastIndexOf('<section', start), end);
  console.log('Length:', content.length);
  fs.writeFileSync('scripts/envios_resenas_snippet.html', content, 'utf8');
  console.log('Saved snippet');
}
