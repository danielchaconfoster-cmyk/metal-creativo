const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const start = html.indexOf('id="comparativa-legal"');
const end = html.indexOf('<section id="faq"');

console.log('Section comparativa-legal found:', start !== -1, end !== -1);
if (start !== -1 && end !== -1) {
  const content = html.slice(html.lastIndexOf('<section', start), end);
  console.log('Length:', content.length);
  fs.writeFileSync('scripts/comparativa_legal_snippet.html', content, 'utf8');
  console.log('Saved snippet');
}
