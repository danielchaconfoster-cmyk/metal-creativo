const fs = require('fs');
const path = require('path');

const copies = [
  {
    src: 'asets videos imagenes reales/WhatsApp Video 2026-10-26 at 16.45.04.mp4',
    dest: 'public/videos/video_armado_lanza.mp4'
  },
  {
    src: 'asets videos imagenes reales/WhatsApp Video 2026-10-26 at 16.16.46.mp4',
    dest: 'public/videos/video_demostracion_barra.mp4'
  },
  {
    src: 'asets videos imagenes reales/WhatsApp Image 2026-11-04 at 18.31.59.jpeg',
    dest: 'public/images/lanza_detalle_acero.jpeg'
  }
];

copies.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${src} -> ${dest} (${fs.statSync(dest).size} bytes)`);
  } else {
    console.error(`Source not found: ${src}`);
  }
});
