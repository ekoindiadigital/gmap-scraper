const puppeteer = require('puppeteer');

async function scrape(keyword, pincode) {
  const searchURL = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}+${encodeURIComponent(pincode)}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    await page.goto(searchURL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Optional delay to ensure page loads all listings
    await page.waitForTimeout(5000);

    // Get data from the results
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

// Handle command line args
const [,, keyword, pincode] = process.argv;

if (!keyword || !pincode) {
  console.error('Usage: node scraper.js <keyword> <pincode>');
  process.exit(1);
}

scrape(keyword, pincode);
