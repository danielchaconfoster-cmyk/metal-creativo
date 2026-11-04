const fs = require('fs');

const files = ['public/barra-de-remolque.html', 'public/fogon-bioetanol.html', 'public/index.html', 'public/checkout.html'];

for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  console.log('--- ' + f + ' ---');
  // Look for tables not inside overflow-x-auto
  const tables = content.match(/<table[\s\S]*?<\/table>/g) || [];
  console.log('Tables found:', tables.length);
  tables.forEach((t, i) => {
    const tableIndex = content.indexOf(t);
    const before = content.slice(Math.max(0, tableIndex - 120), tableIndex);
    const hasOverflow = before.includes('overflow-x-auto') || before.includes('overflow-hidden');
    console.log(`Table ${i + 1} wrapped in overflow:`, hasOverflow);
  });
  
  // Check for large fixed widths like w-[...px] or style="width: ...px"
  const fixedWidths = content.match(/width:\s*[5-9]\d{2,}px|w-\[\s*[5-9]\d{2,}px\]/g) || [];
  console.log('Fixed large widths (>500px):', fixedWidths);
}
