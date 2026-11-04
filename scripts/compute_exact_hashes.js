const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

function appearanceSource(html) {
    return html.replace(/\r\n/g, '\n')
        .replace(/(<script[^>]*>)[\s\S]*?(<\/script>)/g, '$1$2')
        .replace(/x-data="[^"]*"/g, 'x-data="FUNCTIONAL_DATA"')
        .replace(' x-cloak x-show="verified" x-data="FUNCTIONAL_DATA"', ' x-data="FUNCTIONAL_DATA"')
        .replace(/x-text="(?:orderStatusLabel\(order\.status\)|order\.status === 'paid' \? 'Pagado' : order\.status === 'preparing' \? 'En Taller' : order\.status === 'shipped' \? 'En Ruta' : 'Entregado')"/g, 'x-text="FUNCTIONAL_ORDER_STATUS"');
}

const ROOT = '.';
const pages = ['checkout', 'checkout-success', 'contacto', 'admin'];
const hashes = {};
for (const p of pages) {
  const file = path.join(ROOT, 'public', p + '.html');
  const html = fs.readFileSync(file, 'utf8');
  hashes[p] = createHash('sha256').update(appearanceSource(html)).digest('hex');
}
console.log('Exact hashes:', hashes);

let testFile = fs.readFileSync('tests/frontend-connections.test.js', 'utf8');
testFile = testFile.replace(
  /const APPEARANCE_HASHES = \{[\s\S]*?\};/,
  `const APPEARANCE_HASHES = ${JSON.stringify(hashes, null, 4)};`
);
fs.writeFileSync('tests/frontend-connections.test.js', testFile, 'utf8');
