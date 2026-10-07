const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outDir = path.resolve(__dirname, 'google_flow_assets');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

const master = path.resolve(__dirname, 'asets videos imagenes reales/01_video_maestro_armado_y_arrastre_126s.mp4');
const hook = path.resolve(__dirname, 'asets videos imagenes reales/04_enganche_trasero_parachoques_grillete.mp4');

const frames = [
    { name: 'Escena_1_Enganche_Cosecha.png', src: hook, time: '00:00:03' },
    { name: 'Escena_2_Tramos_Pasto.png', src: master, time: '00:00:03' },
    { name: 'Escena_3_Armado_Pasador.png', src: master, time: '00:00:23' },
    { name: 'Escena_4_Levante_Mano.png', src: master, time: '00:00:54' },
    { name: 'Escena_5_Arrastre_Ruta.png', src: master, time: '00:01:48' }
];

frames.forEach(f => {
    const dest = path.join(outDir, f.name);
    const cmd = `ffmpeg -y -ss ${f.time} -i "${f.src}" -vframes 1 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" "${dest}"`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('✅ Extraído:', f.name);
});

console.log('🎉 Todas las imágenes para Google Flow listas en:', outDir);
