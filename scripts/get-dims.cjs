'use strict';
const puppeteer = require('../node_modules/puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const b64 = fs.readFileSync('public/images/logo_transparent.png').toString('base64');
  await page.setContent(`<img id="img" src="data:image/png;base64,${b64}" />`);
  const dims = await page.evaluate(() => {
    const img = document.getElementById('img');
    return { width: img.naturalWidth, height: img.naturalHeight };
  });
  console.log('Dims:', dims);
  await browser.close();
})().catch(console.error);
