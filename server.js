const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fs = require('fs');
const path = require('path');

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

  try {
    const page = await browser.newPage();
    await page.goto(searchURL, {
      waitUntil: 'domcontentloaded',
      timeout: 90000,
    });

    // Wait for listings to load (replacing waitForTimeout with a native delay)
    await new Promise(resolve => setTimeout(resolve, 6000));

    const data = await page.evaluate(() => {
      const listings = document.querySelectorAll('div[role="article"]');
      const results = [];

      listings.forEach(el => {
        const name = el.querySelector('div[aria-label]')?.getAttribute('aria-label') || '';
        const address = el.querySelector('.W4Efsd')?.textContent || '';
        const phoneMatch = el.innerText.match(/(\+91[-\s]?)?\d{10}/);
        const phone = phoneMatch ? phoneMatch[0] : '';
        const website = el.querySelector('a[href^="http"]')?.href || '';
        results.push({ name, address, phone, website });
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
