
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
    
    await page.goto('file:///' + path.resolve(__dirname, 'checkout-success.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    
    const brain = 'C:/Users/usuario/.gemini/antigravity/brain/7c7bd8b0-2ff9-4e3c-a1fa-b89d60c1aa58';
    await page.screenshot({ path: brain + '/screenshot_success_auto.png' });
    
    await browser.close();
    console.log('SUCCESS_AUTO_SHOT_OK');
})();
