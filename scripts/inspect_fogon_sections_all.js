const fs = require('fs');

const h = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const sections = h.match(/<!--\s*SECCIÓN[\s\S]*?-->/g) || [];
console.log('Sections in fogon-bioetanol.html:');
sections.forEach(s => console.log(s.trim()));
