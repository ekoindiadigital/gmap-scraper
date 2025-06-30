const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const scrape = async (keyword, pincode) => {
  const searchQuery = `${keyword} ${pincode}`;
  const outputFile = `results-${keyword}-${pincode}.json`;

  console.log(`🔍 Searching for: ${searchQuery}`);

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  try {
    const encodedSearch = encodeURIComponent(searchQuery);
    const searchURL = `https://www.google.com/maps/search/${encodedSearch}`;
    await page.goto(searchURL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Manual delay instead of page.waitForTimeout
    await delay(3000);

    // Scroll to load more results
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await delay(2000);
    }

    const data = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('a.hfpxzc');

      cards.forEach(card => {
        const name = card.querySelector('div.Nv2PK span')?.textContent || '';
        const address = card.querySelector('.W4Efsd')?.textContent || '';
        const phoneMatch = card.innerText.match(/(\+91[-\s]?)?\d{10}/);
        const phone = phoneMatch ? phoneMatch[0] : '';
        const website = card.href;

        if (name) {
          results.push({ name, address, phone, website });
        }
      });

      return results;
    });

    fs.writeFileSync(path.join(__dirname, outputFile), JSON.stringify(data, null, 2));
    console.log(`✅ Scraped ${data.length} entries. Saved to ${outputFile}`);
  } catch (err) {
    console.error('❌ Scraping failed:', err.message);
  } finally {
    await browser.close();
  }
};

// CLI input
const [,, keyword, pincode] = process.argv;
if (!keyword || !pincode) {
  console.log('Usage: node scraper.js <keyword> <pincode>');
  process.exit(1);
}

scrape(keyword, pincode);
