// test.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://example.com', { waitUntil: 'networkidle2' });
  await page.waitForTimeout(3000); // This line should NOT throw error
  console.log(await page.title());

  await browser.close();
})();
