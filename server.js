const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const keyword = process.argv[2];
const pincode = process.argv[3];

if (!keyword || !pincode) {
  console.error('❌ Usage: node scraper.js <KEYWORD> <PINCODE>');
  process.exit(1);
}

const searchURL = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}+${pincode}`;

(async () => {
  console.log(`🔍 Searching for: ${keyword} in ${pincode}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    await page.goto(searchURL, { waitUntil: 'domcontentloaded', timeout: 0 });

    // Wait for results list container
    await page.waitForSelector('div[role="main"]', { timeout: 15000 });

    // Scroll to load more listings
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('PageDown');
      await new Promise(res => setTimeout(res, 1000));
    }

    const data = await page.evaluate(() => {
      const items = document.querySelectorAll('div[role="article"]');
      const results = [];

      items.forEach(item => {
        const name = item.querySelector('div[aria-label]')?.getAttribute('aria-label') || '';
        const address = item.querySelector('.W4Efsd')?.textContent || '';
        const phoneMatch = item.innerText.match(/(\+91[-\s]?)?\d{10}/);
        const phone = phoneMatch ? phoneMatch[0] : '';
        const website = item.querySelector('a[href^="http"]')?.href || '';

        if (name) results.push({ name, address, phone, website });
      });

      return results;
    });

    const filename = `results-${keyword}-${pincode}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`✅ Scraped ${data.length} entries. Saved to ${filename}`);
  } catch (err) {
    console.error('❌ Scraping failed:', err.message);
  } finally {
    await browser.close();
  }
})();
