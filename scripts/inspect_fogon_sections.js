const fs = require('fs');

const html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');

const mainStart = html.indexOf('<main');
const mainEnd = html.indexOf('</main>');

console.log('mainStart:', mainStart, 'mainEnd:', mainEnd);
console.log('After mainEnd:', html.slice(mainEnd, mainEnd + 200));
