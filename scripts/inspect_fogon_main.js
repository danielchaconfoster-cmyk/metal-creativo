const fs = require('fs');

const html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const idx = html.indexOf('MAIN PRODUCT SECTION');
console.log(html.slice(idx, idx + 2500));
