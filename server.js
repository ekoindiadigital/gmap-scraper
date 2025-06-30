const express = require('express');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ GMap Scraper is running with headless Chrome!');
});

app.get('/scrape', async (req, res) => {
  const { keyword, pincode } = req.query;

  if (!keyword || !pincode) {
    return res.status(400).json({ error: 'Missing keyword or pincode' });
  }

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    const query = `${keyword} in ${pincode}`;
    await page.goto('https://www.google.com/maps', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('input[aria-label="Search Google Maps"]');
    await page.type('input[aria-label="Search Google Maps"]', query);
    await page.keyboard.press('Enter');

    await page.waitForTimeout(5000);

    const results = await page.evaluate(() => {
      const titles = document.querySelectorAll('div[role="article"] h3 span');
      return Array.from(titles).map(el => el.textContent);
    });

    await browser.close();
    res.json({ success: true, query, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to scrape Google Maps', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
