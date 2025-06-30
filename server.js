const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Server is live. Use /scrape?keyword=ATM&pincode=110001');
});

app.get('/scrape', async (req, res) => {
  const { keyword, pincode } = req.query;
  if (!keyword || !pincode) {
    return res.status(400).json({ error: 'Missing keyword or pincode' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const searchQuery = `https://www.google.com/maps/search/${keyword}+${pincode}`;
    await page.goto(searchQuery, { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('.hfpxzc'); // location listing
    const results = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.hfpxzc')).map(el => {
        const name = el.querySelector('.qBF1Pd')?.textContent || '';
        const address = el.querySelector('.rllt__details span')?.textContent || '';
        return { name, address };
      });
    });

    await browser.close();
    res.json({ keyword, pincode, count: results.length, results });
  } catch (error) {
    res.status(500).json({
      error: 'Scraping failed',
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
