const fs = require('fs');

// Let's inspect the HTML of public/fogon-bioetanol.html to see if there is any style or class
const html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const headerMatch = html.match(/<header[\s\S]*?<\/header>/);
console.log(headerMatch ? headerMatch[0] : 'no header');
