const { execSync } = require('child_process');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const inspectScript = `
window.addEventListener('DOMContentLoaded', () => {
  const overflowing = [];
  const all = document.querySelectorAll('*');
  for (const el of all) {
    if (el.scrollWidth > el.clientWidth + 2) {
      overflowing.push({
        tag: el.tagName,
        id: el.id,
        classes: el.className ? el.className.slice(0, 80) : '',
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        text: el.innerText ? el.innerText.slice(0, 50).trim() : ''
      });
    }
  }
  document.title = 'OVERFLOW_REPORT:' + JSON.stringify(overflowing) + ':OVERFLOW_END';
});
`;

let html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const withScript = html.replace('</head>', `<script>${inspectScript}</script></head>`);
fs.writeFileSync('public/temp_overflow.html', withScript, 'utf8');

const dump = execSync(`"${chrome}" --headless=new --disable-gpu --window-size=375,667 --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1" --dump-dom "http://127.0.0.1:3000/temp_overflow.html"`, { encoding: 'utf8' });

fs.unlinkSync('public/temp_overflow.html');

const match = dump.match(/OVERFLOW_REPORT:([\s\S]*?):OVERFLOW_END/);
if (match) {
  console.log(JSON.stringify(JSON.parse(match[1]), null, 2));
} else {
  console.log('No report found');
}
