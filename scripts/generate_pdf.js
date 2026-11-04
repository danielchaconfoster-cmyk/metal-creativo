const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlFile = path.resolve('public/manual-lanza-pdf.html');
const pdfFile = path.resolve('public/Manual_Tecnico_Lanza_Metal_Creativo.pdf');

// Ensure manual-lanza-pdf.html is in public/
fs.copyFileSync('manual-lanza-pdf.html', 'public/manual-lanza-pdf.html');

console.log('Rendering PDF from:', htmlFile);
console.log('Target PDF:', pdfFile);

try {
  const fileUrl = 'file:///' + htmlFile.replace(/\\/g, '/');
  const cmd = `"${chromePath}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfFile}" "${fileUrl}"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('PDF regenerated successfully! Size:', fs.statSync(pdfFile).size);
} catch (e) {
  console.error('Failed to generate PDF:', e.message);
}
