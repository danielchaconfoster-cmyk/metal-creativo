const { execSync } = require('child_process');
const fs = require('fs');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const script = `
const out = {};
const h = document.querySelector('header');
out.headerWidth = h ? h.offsetWidth : 0;
const btns = document.querySelectorAll('header button, header a');
out.elements = Array.from(btns).map(b => ({
  tag: b.tagName,
  text: b.innerText.trim(),
  rect: b.getBoundingClientRect(),
  display: window.getComputedStyle(b).display,
  visible: b.offsetWidth > 0 && b.offsetHeight > 0
}));
console.log(JSON.stringify(out, null, 2));
`;

// Save runner script to evaluate inside Chrome
const testHtml = `<!DOCTYPE html><html><body><script>
window.onload = () => {
  ${script}
};
</script></body></html>`;

fs.writeFileSync('scripts/eval_script.js', script, 'utf8');
console.log('Written eval_script.js');
