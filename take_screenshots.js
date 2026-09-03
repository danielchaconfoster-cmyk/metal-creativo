
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
    
    const filePath = 'file://' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
    await page.goto(filePath, { waitUntil: 'networkidle0' });
    
    const brainDir = 'C:/Users/usuario/.gemini/antigravity/brain/7c7bd8b0-2ff9-4e3c-a1fa-b89d60c1aa58';
    
    // Screenshot 1: Hero
    await page.screenshot({ path: brainDir + '/screenshot_hero.png', clip: { x: 0, y: 0, width: 1280, height: 750 } });
    
    // Screenshot 2: Showcase / Products
    await page.evaluate(() => {
        document.getElementById('showcase').scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: brainDir + '/screenshot_products.png', clip: { x: 0, y: 720, width: 1280, height: 850 } });
    
    // Screenshot 3: Real Gallery & Video
    await page.evaluate(() => {
        document.getElementById('galeria-real').scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: brainDir + '/screenshot_real_gallery.png', clip: { x: 0, y: 1550, width: 1280, height: 950 } });
    
    await browser.close();
    console.log('3 Pantallazos generados exitosamente');
})();
