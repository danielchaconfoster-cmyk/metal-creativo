const fs = require('fs');

const indexHtml = fs.readFileSync('public/index.html', 'utf8');
const originalBarra = fs.readFileSync('public/barra-de-remolque.html', 'utf8');

const dualVideoSection = fs.readFileSync('scripts/generated_dual_video.html', 'utf8');
const fotosRealesSection = fs.readFileSync('scripts/generated_fotos_reales.html', 'utf8');
const enviosResenasSection = fs.readFileSync('scripts/generated_envios_resenas.html', 'utf8');

// Extract canvas styles
const canvasStyle = `
        /* LIENZOS DE EFECTOS ESPECIALES (CHISPAS Y BRASAS CONTINUAS) */
        #emberCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 20;
        }

        #sparkCanvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
        }

        .spark-trigger {
            cursor: pointer;
        }
`;

// Extract particle scripts from index.html
const emberScriptMatch = indexHtml.match(/\/\/ 1\. CHISPAS Y FUEGO ASCENDENTE CONTINUO[\s\S]*?<\/script>/);
const particleScript = emberScriptMatch ? emberScriptMatch[0].replace('</script>', '') : '';

// Let's modify originalBarra:
// 1. Add canvas style into <style>
let updated = originalBarra;
if (!updated.includes('#emberCanvas')) {
  updated = updated.replace('</style>', canvasStyle + '\n    </style>');
}

// 2. Add canvases right after <body ...>
if (!updated.includes('<canvas id="emberCanvas"></canvas>')) {
  updated = updated.replace(
    /(<body[^>]*>)/i,
    '$1\n\n    <!-- 1. LIENZO CONTINUO DE ASCOAS Y FUEGO ASCENDENTE -->\n    <canvas id="emberCanvas"></canvas>\n\n    <!-- 2. LIENZO EN VIVO DE CHISPAS REACTIVAS AL MOUSE Y CLIC -->\n    <canvas id="sparkCanvas"></canvas>\n'
  );
}

// 3. Replace the single video section (id="video-armado") with the full dual video + real photos + reviews
const oldVideoStart = updated.indexOf('<section id="video-armado"');
const educationSectionStart = updated.indexOf('<!-- SECCIÓN EDUCATIVA Y LEGAL');

if (oldVideoStart !== -1 && educationSectionStart !== -1) {
  const combinedRichContent = dualVideoSection + '\n' + fotosRealesSection + '\n';
  updated = updated.slice(0, oldVideoStart) + combinedRichContent + updated.slice(educationSectionStart);
  console.log('Replaced old single video with dual video and fotos reales');
}

// 4. Insert enviosResenasSection before FAQ
const faqStart = updated.indexOf('<!-- SECCIÓN PREGUNTAS FRECUENTES FAQ');
if (faqStart !== -1 && !updated.includes('id="envios-resenas"')) {
  updated = updated.slice(0, faqStart) + enviosResenasSection + '\n' + updated.slice(faqStart);
  console.log('Inserted envios-resenas before FAQ');
}

// 5. Add particle scripts before </body>
if (!updated.includes('initEmbers')) {
  updated = updated.replace(
    '</script>\n</body>',
    '\n' + particleScript + '\n    </script>\n</body>'
  );
  console.log('Added particle animation scripts');
}

// Write to public/barra-de-remolque.html and root barra-de-remolque.html
fs.writeFileSync('public/barra-de-remolque.html', updated, 'utf8');
if (fs.existsSync('barra-de-remolque.html')) {
  fs.writeFileSync('barra-de-remolque.html', updated, 'utf8');
}

console.log('Successfully written upgraded barra-de-remolque.html! Size:', updated.length);
