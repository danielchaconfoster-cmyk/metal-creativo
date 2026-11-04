const fs = require('fs');

const html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const insideMain = html.slice(17882, 40007);

const comments = insideMain.match(/<!--[\s\S]*?-->/g);
console.log('Comments in main:', comments);
