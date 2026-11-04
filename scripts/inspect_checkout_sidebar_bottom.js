const fs = require('fs');

const html = fs.readFileSync('public/checkout.html', 'utf8');
const idx = html.indexOf('COLUMNA DERECHA: RESUMEN');
console.log(html.slice(idx + 1800, idx + 3500));
