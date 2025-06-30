import express from 'express';
import puppeteer from 'puppeteer-core';
import chromium from 'chrome-aws-lambda';

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

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const searchURL = `https://www.google.com/maps/search/${encodeURIComponent(
      keyword
    )}+${pincode}`;

    await page.goto(searchURL, { waitUntil: 'networkidle0' });

    const data = await page.evaluate(() => {
      const results = [];
      const listings = document.querySelectorAll('.hfpxzc');

      listings.forEach((el) => {
        const name = el.querySelector('.qBF1Pd')?.textContent || 'No name';
        const address = el.querySelector('.rllt__details span:nth-child(2)')?.textContent || 'No address';
        results.push({ name, address });
      });

      return results;
    });

    await browser.close();
    res.json({ results: data });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to scrape Google Maps',
      detail: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
