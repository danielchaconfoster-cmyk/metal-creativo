const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const idx = html.indexOf('prueba_arrastre_amarok.mp4');
console.log(html.slice(idx - 500, idx + 500));
