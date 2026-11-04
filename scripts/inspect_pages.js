const fs = require('fs');

function inspect(file) {
  console.log(`\n=== INSPECTING ${file} ===`);
  const html = fs.readFileSync(file, 'utf8');
  
  // Find all images
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
  let m;
  const imgs = [];
  while ((m = imgRegex.exec(html)) !== null) {
    imgs.push(m[1]);
  }
  console.log('Images:', imgs);

  // Check if any referenced local files are missing
  for (const img of imgs) {
    if (img.startsWith('/') || img.startsWith('./')) {
      const clean = img.replace(/^\.?\//, 'public/');
      const exists = fs.existsSync(clean);
      if (!exists) {
        console.warn(`WARNING: Missing file: ${clean} (referenced as ${img})`);
      }
    }
  }

  // Videos
  const vidRegex = /<source[^>]+src=["']([^"']+)["']/g;
  while ((m = vidRegex.exec(html)) !== null) {
    console.log('Video:', m[1]);
    const clean = m[1].replace(/^\.?\//, 'public/');
    console.log('Video exists:', fs.existsSync(clean));
  }
}

inspect('public/barra-de-remolque.html');
inspect('public/index.html');
