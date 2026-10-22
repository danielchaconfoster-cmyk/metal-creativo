'use strict';
const puppeteer = require('../node_modules/puppeteer');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const WIDTH = 600;
const HEIGHT = 220;
const TOTAL_FRAMES = 60; // 2.5 seconds at 24fps
const FPS = 24;
const TEMP_DIR = path.join(__dirname, 'temp_frames');
const OUTPUT_GIF = path.join(__dirname, '..', 'public', 'images', 'email-banner-animated.gif');

async function main() {
  console.log('--- GENERATING ANIMATED EMAIL BANNER (METAL CREATIVO FORGE PARTICLES) ---');

  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

  // Clean old frames
  for (const file of fs.readdirSync(TEMP_DIR)) {
    fs.unlinkSync(path.join(TEMP_DIR, file));
  }

  const logoBase64 = fs.readFileSync(path.join(__dirname, '..', 'public', 'images', 'logo_icon_only_transparent.png')).toString('base64');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #07080b;
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    canvas {
      display: block;
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
    }
  </style>
</head>
<body>
  <canvas id="c" width="${WIDTH * 2}" height="${HEIGHT * 2}"></canvas>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const W = ${WIDTH * 2};
    const H = ${HEIGHT * 2};
    const TOTAL = ${TOTAL_FRAMES};

    const logoImg = new Image();
    logoImg.src = "data:image/png;base64,${logoBase64}";

    // Initialize deterministic looping particles
    const sparks = [];
    const NUM_SPARKS = 70;

    for (let i = 0; i < NUM_SPARKS; i++) {
      sparks.push({
        baseX: (Math.sin(i * 997) * 0.5 + 0.5) * (W * 0.85) + (W * 0.075),
        baseY: (Math.cos(i * 613) * 0.5 + 0.5) * (H * 0.8) + (H * 0.1),
        ampX: 15 + (i % 7) * 8,
        ampY: 10 + (i % 5) * 6,
        freqX: (i % 2 === 0 ? 1 : -1) * ((i % 3) + 1),
        freqY: (i % 2 === 0 ? -1 : 1) * (((i + 1) % 2) + 1),
        phase: (i / NUM_SPARKS) * Math.PI * 2,
        size: 1.2 + (i % 4) * 0.9,
        colorType: i % 4, // 0: intense orange, 1: electric gold, 2: white spark, 3: copper glow
        speedYDrift: ((i % 3) + 1) * (H / TOTAL)
      });
    }

    // Logo pixel particles (sampling the logo like America Pulido)
    let logoParticles = [];
    let ready = false;

    logoImg.onload = () => {
      // Draw logo into temp offscreen to sample points
      const offCanvas = document.createElement('canvas');
      offCanvas.width = W;
      offCanvas.height = H;
      const offCtx = offCanvas.getContext('2d');

      // Center logo
      const targetW = 160 * 2;
      const targetH = (logoImg.naturalHeight / logoImg.naturalWidth) * targetW;
      const targetX = (W - targetW) / 2;
      const targetY = (H - targetH) / 2 - 25;

      offCtx.drawImage(logoImg, targetX, targetY, targetW, targetH);
      const imgData = offCtx.getImageData(0, 0, W, H);

      const step = 6; // Sampling density
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          const idx = (y * W + x) * 4;
          if (imgData.data[idx + 3] > 140) {
            if (Math.random() > 0.4) {
              const seed = x * 1337 + y * 991;
              logoParticles.push({
                originX: x,
                originY: y,
                driftAmp: 3 + (seed % 5),
                driftFreq: ((seed % 3) + 1) * (seed % 2 === 0 ? 1 : -1),
                phase: ((seed % 100) / 100) * Math.PI * 2,
                size: 1.0 + (seed % 3) * 0.5,
                colorType: seed % 5
              });
            }
          }
        }
      }
      ready = true;
    };

    window.renderFrame = function(frame) {
      if (!ready) return;

      const progress = frame / TOTAL;
      const angle = progress * Math.PI * 2;

      // 1. Background with radial forge glow
      ctx.fillStyle = '#07080b';
      ctx.fillRect(0, 0, W, H);

      // Core forge amber radial glow
      const glowGrad = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.55);
      const pulseGlow = 0.12 + 0.05 * Math.sin(angle);
      glowGrad.addColorStop(0, 'rgba(255, 106, 0, ' + pulseGlow + ')');
      glowGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.04)');
      glowGrad.addColorStop(1, 'rgba(7, 8, 11, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Subtle industrial grid / metal scan line accent
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // 3. Render official logo centered with dynamic breathing warmth
      const targetW = 160 * 2;
      const targetH = (logoImg.naturalHeight / logoImg.naturalWidth) * targetW;
      const targetX = (W - targetW) / 2;
      const targetY = (H - targetH) / 2 - 25;

      ctx.save();
      // Drop shadow for logo
      ctx.shadowColor = 'rgba(255, 106, 0, ' + (0.4 + 0.2 * Math.sin(angle)) + ')';
      ctx.shadowBlur = 24 + 10 * Math.sin(angle);
      ctx.drawImage(logoImg, targetX, targetY, targetW, targetH);
      ctx.restore();

      // 4. Logo magnetic spark particles (América Pulido style)
      for (let i = 0; i < logoParticles.length; i++) {
        const p = logoParticles[i];
        const px = p.originX + Math.sin(angle * p.driftFreq + p.phase) * p.driftAmp;
        const py = p.originY + Math.cos(angle * p.driftFreq + p.phase) * (p.driftAmp * 0.7);

        let color = 'rgba(255, 106, 0, 0.85)';
        if (p.colorType === 0) color = 'rgba(255, 255, 255, 0.95)';
        else if (p.colorType === 1) color = 'rgba(255, 180, 50, 0.9)';
        else if (p.colorType === 2) color = 'rgba(255, 80, 0, 0.8)';
        else if (p.colorType === 3) color = 'rgba(251, 191, 36, 0.95)';

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Specular Chrome/Gleam Sweep across the logo
      const gleamPos = ((progress * 1.3) % 1.0) * (W * 1.4) - (W * 0.2);
      ctx.save();
      const gleam = ctx.createLinearGradient(gleamPos - 60, 0, gleamPos + 60, 0);
      gleam.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gleam.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
      gleam.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = gleam;
      ctx.fillRect(targetX - 20, targetY - 20, targetW + 40, targetH + 40);
      ctx.restore();

      // 6. Ambient Forge Sparks & Floating Embers (Upward swirl)
      for (let i = 0; i < sparks.length; i++) {
        const s = sparks[i];
        // Swirling harmonic path
        const sx = s.baseX + Math.sin(angle * s.freqX + s.phase) * s.ampX;
        // Continuous upward drift that wraps seamlessly
        const drift = (frame * s.speedYDrift) % H;
        let sy = (s.baseY - drift + H) % H;

        // Fade out at extreme top and bottom edges for seamless disappearance
        let alpha = 1.0;
        if (sy < 40) alpha = sy / 40;
        else if (sy > H - 40) alpha = (H - sy) / 40;

        let col = 'rgba(255, 106, 0, ' + (0.75 * alpha) + ')';
        let glowCol = 'rgba(255, 106, 0, 0.8)';
        if (s.colorType === 1) {
          col = 'rgba(255, 215, 0, ' + (0.9 * alpha) + ')';
          glowCol = 'rgba(255, 215, 0, 0.8)';
        } else if (s.colorType === 2) {
          col = 'rgba(255, 255, 255, ' + (0.95 * alpha) + ')';
          glowCol = 'rgba(255, 255, 255, 0.9)';
        } else if (s.colorType === 3) {
          col = 'rgba(255, 69, 0, ' + (0.7 * alpha) + ')';
          glowCol = 'rgba(255, 69, 0, 0.7)';
        }

        ctx.save();
        ctx.shadowColor = glowCol;
        ctx.shadowBlur = 8 * s.size;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 7. Premium Subtitles & Badge below Logo
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // "CHILE • FABRICACIÓN NACIONAL EN ACERO"
      ctx.font = '800 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.letterSpacing = '5px';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('CHILE • FABRICACIÓN NACIONAL EN ACERO', W / 2, H - 55);

      // Micro badge
      ctx.font = '700 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillStyle = '#ff6a00';
      ctx.fillText('LEY MTT 55/2025 • TALLER METALMECÁNICO OFICIAL', W / 2, H - 28);
    };

    window.isReady = () => ready;
  </script>
</body>
</html>
  `;

  console.log('Launching headless browser with Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await page.setContent(html);

  // Wait until ready
  await page.waitForFunction('window.isReady() === true', { timeout: 10000 });
  console.log('Canvas particle engine initialized successfully.');

  console.log(`Rendering ${TOTAL_FRAMES} frames...`);
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    await page.evaluate((frame) => {
      window.renderFrame(frame);
    }, f);

    const frameFile = path.join(TEMP_DIR, `frame_${String(f).padStart(3, '0')}.png`);
    await page.screenshot({ path: frameFile, type: 'png' });
    if (f % 15 === 0) {
      console.log(`  Rendered frame ${f} / ${TOTAL_FRAMES}`);
    }
  }

  await browser.close();
  console.log('All frames captured! Encoding into animated GIF with FFmpeg...');

  // Use FFmpeg two-pass palette generation for optimal crispness & small file size
  const ffmpegCmd = [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(TEMP_DIR, 'frame_%03d.png'),
    '-filter_complex',
    `scale=${WIDTH}:${HEIGHT}:flags=lanczos,split [a][b];[a] palettegen=reserve_transparent=0:stats_mode=single [p];[b][p] paletteuse=dither=bayer:bayer_scale=3`,
    OUTPUT_GIF
  ];

  const result = spawnSync('ffmpeg', ffmpegCmd, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`FFmpeg exited with status ${result.status}`);
  }

  const stat = fs.statSync(OUTPUT_GIF);
  console.log(`\n🎉 SUCCESS! Generated animated banner:`);
  console.log(`  Path: ${OUTPUT_GIF}`);
  console.log(`  Size: ${(stat.size / 1024).toFixed(1)} KB`);

  // Cleanup temp frames
  for (const file of fs.readdirSync(TEMP_DIR)) {
    fs.unlinkSync(path.join(TEMP_DIR, file));
  }
  fs.rmdirSync(TEMP_DIR);
}

main().catch(err => {
  console.error('Fatal error rendering banner:', err);
  process.exit(1);
});
