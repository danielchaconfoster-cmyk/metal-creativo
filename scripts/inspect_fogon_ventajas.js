const fs = require('fs');

const h = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const idx = h.indexOf('<!-- SECCIÓN VENTAJAS BIOETANOL VS LEÑA O GAS -->');
console.log(h.slice(idx, idx + 2500));
