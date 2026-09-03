
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 850, deviceScaleFactor: 2 });
    
    const filePath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
    await page.goto(filePath, { waitUntil: 'networkidle0' });
    
    // 1. Hero Screenshot
    await page.screenshot({ path: path.join(__dirname, 'hero_v4.png') });
    
    // 2. Products Screenshot
    await page.evaluate(() => {
        document.getElementById('showcase').scrollIntoView();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(__dirname, 'products_v4.png') });
    
    // 3. Footer Screenshot
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(__dirname, 'footer_v4.png') });
    
    await browser.close();
    console.log('OK_SHOTS');
})();
