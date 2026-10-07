const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outDir = path.resolve(__dirname, 'public/videos/reel_opcion2');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const masterVideo = path.resolve(__dirname, 'asets videos imagenes reales/01_video_maestro_armado_y_arrastre_126s.mp4');
const hookVideo = path.resolve(__dirname, 'asets videos imagenes reales/04_enganche_trasero_parachoques_grillete.mp4');

const cuts = [
    { name: 'clip1_barra_autos.mp4', src: masterVideo, start: '00:01:22', duration: '4.5' },
    { name: 'clip2_enganche_grillete.mp4', src: hookVideo, start: '00:00:01', duration: '5.5' },
    { name: 'clip3_tubos_pasto.mp4', src: masterVideo, start: '00:00:00.5', duration: '5.5' },
    { name: 'clip4_pasadores.mp4', src: masterVideo, start: '00:00:20', duration: '6.5' },
    { name: 'clip5_carretera.mp4', src: masterVideo, start: '00:01:46', duration: '5.5' },
];

for (const cut of cuts) {
    const dest = path.join(outDir, cut.name);
    console.log(`Extrayendo ${cut.name}...`);
    const cmd = `ffmpeg -y -ss ${cut.start} -i "${cut.src}" -t ${cut.duration} -an -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -preset fast -crf 20 -r 30 "${dest}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ Creado: ${dest}`);
}

console.log('🎉 Todos los clips del Reel 2 extraídos con éxito.');
