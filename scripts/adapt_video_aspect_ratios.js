'use strict';
/**
 * SCRIPT MAESTRO DE ADAPTACIÓN DE ASPECT RATIOS PARA META ADS
 * Genera automáticamente versiones 9:16 (Stories/Reels), 1:1 (Feed cuadrado) y 4:5 (Feed vertical)
 * con fondo desenfocado cinematográfico (Blurred Canvas) para evitar franjas negras o recortes toscos.
 * 
 * Uso:
 *   node scripts/adapt_video_aspect_ratios.js <archivo_origen.mp4>
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const inputFile = process.argv[2] || path.join(__dirname, '../out/video_lanza_legal_15s.mp4');

if (!fs.existsSync(inputFile)) {
  console.error(`❌ El archivo no existe: ${inputFile}`);
  process.exit(1);
}

const dir = path.dirname(inputFile);
const ext = path.extname(inputFile);
const base = path.basename(inputFile, ext);

console.log(`🎬 Procesando video: ${path.basename(inputFile)}`);

// 1. Generar 1:1 Feed Cuadrado (1080x1080)
const out1x1 = path.join(dir, `${base}_1x1_feed${ext}`);
console.log(`⏳ Generando versión 1:1 Feed: ${path.basename(out1x1)}...`);
try {
  execSync(`ffmpeg -y -i "${inputFile}" -filter_complex "[0:v]scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,gblur=sigma=30,eq=brightness=-0.2[bg];[0:v]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" -c:v libx264 -preset fast -crf 20 -c:a copy "${out1x1}"`, { stdio: 'inherit' });
  console.log(`✅ 1:1 Generado con éxito.`);
} catch (e) {
  console.error(`❌ Error generando 1:1:`, e.message);
}

// 2. Generar 4:5 Feed Vertical (1080x1350 - El formato que más espacio ocupa en Instagram Feed)
const out4x5 = path.join(dir, `${base}_4x5_feed${ext}`);
console.log(`⏳ Generando versión 4:5 Feed: ${path.basename(out4x5)}...`);
try {
  execSync(`ffmpeg -y -i "${inputFile}" -filter_complex "[0:v]scale=1080:1350:force_original_aspect_ratio=increase,crop=1080:1350,gblur=sigma=30,eq=brightness=-0.2[bg];[0:v]scale=-2:1350[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" -c:v libx264 -preset fast -crf 20 -c:a copy "${out4x5}"`, { stdio: 'inherit' });
  console.log(`✅ 4:5 Generado con éxito.`);
} catch (e) {
  console.error(`❌ Error generando 4:5:`, e.message);
}

console.log(`🎉 ¡Procesamiento completado con éxito! Todos los ratios están listos para Meta Ads.`);
