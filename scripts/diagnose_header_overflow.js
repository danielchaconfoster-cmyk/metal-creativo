const { execSync } = require('child_process');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const inspectScript = `
window.addEventListener('DOMContentLoaded', () => {
  const h = document.querySelector('header');
  const inner = h.children[0];
  const row = inner.children[0];
  const logo = row.children[0];
  const nav = row.children[1];
  const actions = row.children[2];
  
  const report = {
    windowWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    headerWidth: h.offsetWidth,
    innerWidth: inner.offsetWidth,
    rowWidth: row.offsetWidth,
    logoRect: logo.getBoundingClientRect(),
    navDisplay: window.getComputedStyle(nav).display,
    actionsRect: actions.getBoundingClientRect(),
    actionsChildren: Array.from(actions.children).map(c => ({
      tag: c.tagName,
      display: window.getComputedStyle(c).display,
      rect: c.getBoundingClientRect(),
      classes: c.className
    }))
  };
  document.title = 'REPORT_START' + JSON.stringify(report) + 'REPORT_END';
});
`;

let html = fs.readFileSync('public/fogon-bioetanol.html', 'utf8');
const withScript = html.replace('</head>', `<script>${inspectScript}</script></head>`);
fs.writeFileSync('public/temp_report.html', withScript, 'utf8');

const dump = execSync(`"${chrome}" --headless=new --disable-gpu --window-size=390,844 --run-all-compositor-stages-before-draw --virtual-time-budget=1000 --dump-dom "http://127.0.0.1:3000/temp_report.html"`, { encoding: 'utf8' });

fs.unlinkSync('public/temp_report.html');

const match = dump.match(/REPORT_START([\s\S]*?)REPORT_END/);
if (match) {
  console.log(JSON.stringify(JSON.parse(match[1]), null, 2));
} else {
  console.log('No report found in title');
}
