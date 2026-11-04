const fs = require('fs');

const html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const mainEndTag = html.indexOf('</main>');
console.log('mainEndTag:', mainEndTag);
if (mainEndTag !== -1) {
  console.log(html.slice(mainEndTag, mainEndTag + 200));
}
