const fs = require('fs');
const html = fs.readFileSync('public/barra-de-remolque.html', 'utf8');

const regex = /<section[^>]*id=["']([^"']+)["'][^>]*>/g;
let m;
while ((m = regex.exec(html)) !== null) {
  console.log('Barra Section ID:', m[1]);
}
