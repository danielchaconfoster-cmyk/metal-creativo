const fs = require('fs');

const html = fs.readFileSync('public/checkout.html', 'utf8');

const mentions = [];
['barra', 'remolque', 'mtt', 'fogon', 'bioetanol', 'piola', 'grillete'].forEach(term => {
  const regex = new RegExp(`[^\\n]*${term}[^\\n]*`, 'gi');
  let m;
  while ((m = regex.exec(html)) !== null) {
    mentions.push(m[0].trim());
  }
});

console.log('Mentions in checkout.html:');
console.log([...new Set(mentions)]);
