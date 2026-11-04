const fs = require('fs');

const html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const rest = html.slice(33122);

console.log('Mentions of inoxidable in rest:', rest.match(/inoxidable/gi));
console.log('Mentions of termoesmaltado in rest:', rest.match(/termoesmaltado/gi));
console.log('Mentions of AISI in rest:', rest.match(/AISI/gi));
