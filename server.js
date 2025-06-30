const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ GMap Scraper is running!');
});

app.get('/scrape', async (req, res) => {
  const { keyword, pincode } = req.query;

  if (!keyword || !pincode) {
    return res.status(400).json({ error: 'Missing keyword or pincode' });
  }

  const query = `${keyword} in ${pincode}`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(`https://www.google.com/maps`, { waitUntil: 'domcontentloaded' });

    // Type in search query
    await page.waitForSelector('input[aria-label="Search Google Maps"]');
    await page.type('input[aria-label="Search Google Maps"]', query);
    await page.keyboard.press('Enter');

    // Wait for search results
    await page.waitForTimeout(5000);

    // Extract place names from the results
    const results = await page.evaluate(() => {
      const nodes = document.querySelectorAll('div[role="article"] h3 span');
      return Array.from(nodes).map(el => el.textContent);
    });

    await browser.close();

    res.json({ success: true, query, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to scrape Google Maps', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
