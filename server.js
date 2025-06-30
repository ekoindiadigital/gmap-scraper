const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function scrape(keyword, pincode) {
  const searchURL = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}+${encodeURIComponent(pincode)}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  const page = await browser.newPage();

  // Set user-agent to pretend it's a real browser
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  try {
    await page.goto(searchURL, {
      waitUntil: 'domcontentloaded',
      timeout: 90000, // 90 seconds
    });

    await page.waitForTimeout(6000); // wait for listings to load

    const data = await page.evaluate(() => {
      const results = [];
      const items = document.querySelectorAll('div[role="article"]');

      items.forEach(item => {
        const name = item.querySelector('div[aria-label]')?.getAttribute('aria-label') || '';
        const address = item.querySelector('span[jsinstance]')?.innerText || '';
        const phone = item.innerText.match(/\+91[-\s]?\d{10}/)?.[0] || '';

        results.push({ name, address, phone });
      });

      return results;
    });

    console.log(data);
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
  } finally {
    await browser.close();
  }
}

const [,, keyword, pincode] = process.argv;

if (!keyword || !pincode) {
  console.error('Usage: node scraper.js <keyword> <pincode>');
  process.exit(1);
}

scrape(keyword, pincode);
