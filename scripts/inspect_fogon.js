const fs = require('fs');

const html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');

// Find all images
const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
let m;
const imgs = [];
while ((m = imgRegex.exec(html)) !== null) {
  imgs.push(m[1]);
}
console.log('Images in fogon-bioetanol.html:', imgs);

// Find pricing
const prices = html.match(/\$\d+[\d.,]*/g);
console.log('Prices found:', [...new Set(prices)]);

// Find Alpine x-data
const alpine = html.match(/x-data="[^"]*"/g);
console.log('Alpine x-data:', alpine);
