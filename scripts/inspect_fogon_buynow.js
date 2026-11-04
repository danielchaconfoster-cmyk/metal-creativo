const fs = require('fs');

const html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const buyMatches = html.match(/buyNow\([^)]+\)/g);
console.log('buyNow calls in fogon-bioetanol.html:', buyMatches);
const addMatches = html.match(/addItem\([^)]+\)/g);
console.log('addItem calls in fogon-bioetanol.html:', addMatches);
