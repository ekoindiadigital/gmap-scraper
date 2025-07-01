const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,  // Show the browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    timeout: 60000     // Give more time to load
  });

  const page = await browser.newPage();
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  await page.waitForTimeout(3000); // Wait so you can see it
  console.log(await page.title());
  await browser.close();
})();
