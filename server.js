const express = require('express');
const app = express();
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

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
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const searchQuery = `${keyword} near ${pincode}`;
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    // Just capturing the title as a simple test output
    const title = await page.title();

    await browser.close();

    res.json({ message: 'Scraping successful', title });
  } catch (err) {
    console.error('❌ Scraping error:', err.message);
    res.status(500).json({ error: 'Failed to scrape Google Maps', detail: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
