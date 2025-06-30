const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.post('/scrape', async (req, res) => {
  const searchUrl = req.body.url;
  if (!searchUrl) return res.status(400).json({ error: 'Missing URL' });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });

    // Scroll to load results
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise(r => setTimeout(r, 1000));
    }

    const data = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('[role="article"]');

      cards.forEach(card => {
        const name = card.querySelector('[aria-label]')?.getAttribute('aria-label') || '';
        const website = card.querySelector('a[href^="http"]')?.href || '';
        const addressMatch = card.innerText.match(/Address:(.*)/);
        const phoneMatch = card.innerText.match(/Phone:(.*)/);

        results.push({
          name,
          address: addressMatch ? addressMatch[1].trim() : '',
          phone: phoneMatch ? phoneMatch[1].trim() : '',
          website
        });
      });

      return results.slice(0, 10); // Return only top 10 results
    });

    await browser.close();
    res.json(data);

  }
