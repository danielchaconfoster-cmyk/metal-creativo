
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
    
    const filePath = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
    await page.goto(filePath, { waitUntil: 'networkidle0' });
    
    const targetFile = 'C:\\Users\\usuario\\.gemini\\antigravity\\brain\\7c7bd8b0-2ff9-4e3c-a1fa-b89d60c1aa58\\screenshot_footer_final.png';
    
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(r => setTimeout(r, 600));
    
    const footerEl = await page.footer;
    if (footerEl) {
        await footerEl.screenshot({ path: targetFile });
        console.log('OK Footer Guardado:', targetFile);
    }
    
    await browser.close();
})();
