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

  const searchURL = `https://www.google.com/maps/search/${keyword}+${pincode}`;

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(searchURL, { waitUntil: 'networkidle2' });

    // Scraping logic here (basic version just for demonstration)
    const results = await page.evaluate(() => {
      const data = [];
      const listings = document.querySelectorAll('[role="article"]');
      listings.forEach((el) => {
        const name = el.querySelector('h3')?.innerText || 'No name';
        const address = el.querySelector('[data-tooltip]')?.innerText || 'No address';
        data.push({ name, address });
      });
      return data;
    });

    await browser.close();
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
