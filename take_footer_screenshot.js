
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
    
    const filePath = 'file://' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
    await page.goto(filePath, { waitUntil: 'networkidle0' });
    
    const brainDir = 'C:/Users/usuario/.gemini/antigravity/brain/7c7bd8b0-2ff9-4e3c-a1fa-b89d60c1aa58';
    
    // Screenshot Footer
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: brainDir + '/screenshot_footer.png', clip: { x: 0, y: 2200, width: 1280, height: 600 } });
    
    await browser.close();
    console.log('Pantallazo del Footer generado');
})();
