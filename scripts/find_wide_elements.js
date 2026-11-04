const { execSync } = require('child_process');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const inspectScript = `
window.addEventListener('DOMContentLoaded', () => {
  const wide = [];
  const all = document.querySelectorAll('*');
  for (const el of all) {
    if (el.offsetWidth > 390) {
      wide.push({
        tag: el.tagName,
        id: el.id,
        classes: el.className ? el.className.slice(0, 80) : '',
        width: el.offsetWidth,
        scrollWidth: el.scrollWidth,
        text: el.innerText ? el.innerText.slice(0, 50).trim() : ''
      });
    }
  }
  document.title = 'WIDE_REPORT:' + JSON.stringify(wide) + ':WIDE_END';
});
`;

let html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const withScript = html.replace('</head>', `<script>${inspectScript}</script></head>`);
fs.writeFileSync('public/temp_wide.html', withScript, 'utf8');

const dump = execSync(`"${chrome}" --headless=new --disable-gpu --window-size=390,844 --run-all-compositor-stages-before-draw --virtual-time-budget=1000 --dump-dom "http://127.0.0.1:3000/temp_wide.html"`, { encoding: 'utf8' });

fs.unlinkSync('public/temp_wide.html');

const match = dump.match(/WIDE_REPORT:([\s\S]*?):WIDE_END/);
if (match) {
  const items = JSON.parse(match[1]);
  console.log('Total elements > 390px:', items.length);
  // Filter for lowest-level children that are wide
  const leafWide = items.filter(it => it.tag !== 'HTML' && it.tag !== 'BODY' && it.tag !== 'MAIN' && it.tag !== 'SECTION' && it.tag !== 'HEADER');
  console.log(JSON.stringify(leafWide.slice(0, 10), null, 2));
} else {
  console.log('No wide report found');
}
