const fs = require('fs');

const html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const insideMain = html.slice(17882, 40007);

const regex = /<section[^>]*id=["']([^"']+)["'][^>]*>/g;
let m;
while ((m = regex.exec(insideMain)) !== null) {
  console.log('Section in main:', m[1]);
}
