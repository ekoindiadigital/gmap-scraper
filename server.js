const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

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

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const searchUrl = `https://www.google.com/maps/search/${keyword}+${pincode}`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

    const title = await page.title();

    res.json({ message: 'Scraping successful', title });

  } catch (error) {
    res.status(500).json({ error: 'Failed to scrape Google Maps', detail: error.message });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
