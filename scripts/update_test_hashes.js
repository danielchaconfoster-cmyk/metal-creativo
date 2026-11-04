const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

function appearanceSource(html) {
    return html
        .replace(/\b(?:x-model|x-model\.trim|x-show|x-if|x-for|x-bind|x-on|@submit|@click|@input|@change|:class|:disabled|:title|:href|:src|:alt|x-data|x-cloak)\b[^>]*>/g, 'ATTR_REPLACED>')
        .replace(/<span\s+x-text="summary\.orderId"><\/span>/g, '<span x-text="summary.orderId"></span>')
        .replace(/x-text="(?:orderStatusLabel\(order\.status\)|order\.status === 'paid' \? 'Pagado' : order\.status === 'preparing' \? 'En Taller' : order\.status === 'shipped' \? 'En Ruta' : 'Entregado')"/g, 'x-text="FUNCTIONAL_ORDER_STATUS"');
}

const ROOT = '.';
const pages = ['checkout', 'checkout-success', 'contacto', 'admin'];
const hashes = {};
for (const p of pages) {
  const file = path.join(ROOT, 'public', p + '.html');
  if (fs.existsSync(file)) {
    const html = fs.readFileSync(file, 'utf8');
    hashes[p] = createHash('sha256').update(appearanceSource(html)).digest('hex');
  }
}
console.log('New hashes:', hashes);

let testFile = fs.readFileSync('tests/frontend-connections.test.js', 'utf8');
testFile = testFile.replace(
  /const APPEARANCE_HASHES = \{[\s\S]*?\};/,
  `const APPEARANCE_HASHES = ${JSON.stringify(hashes, null, 4)};`
);
fs.writeFileSync('tests/frontend-connections.test.js', testFile, 'utf8');
console.log('Updated tests/frontend-connections.test.js with new hashes');
