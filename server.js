const puppeteer = require('puppeteer');

const search = process.argv[2];
const pincode = process.argv[3];

if (!search || !pincode) {
  console.log('Usage: node scraper.js <keyword> <pincode>');
  process.exit(1);
}

const query = `${search} ${pincode}`;
const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log(`🔍 Searching for: ${query}`);

  // Scroll to load listings
  let previousHeight;
  try {
    previousHeight = await page.evaluate('document.body.scrollHeight');
    await page.evaluate('window.scrollBy(0, window.innerHeight)');
    await page.waitForTimeout(3000);
  } catch (err) {
    console.error('❌ Scroll error:', err);
  }

  // Extract titles and addresses
  const data = await page.evaluate(() => {
    const results = [];
    const cards = document.querySelectorAll('.Nv2PK');

    cards.forEach(card => {
      const title = card.querySelector('.qBF1Pd')?.innerText || '';
      const address = card.querySelector('.rllt__details div:nth-child(2)')?.innerText || '';
      results.push({ title, address });
    });

    return results;
  });

  const fs = require('fs');
  const fileName = `results-${search}-${pincode}.json`;
  fs.writeFileSync(fileName, JSON.stringify(data, null, 2));

  console.log(`✅ Scraped ${data.length} entries. Saved to ${fileName}`);

  await browser.close();
})();
