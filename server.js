const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Server is running. Use /scrape?keyword=ATM&pincode=110001');
});

app.get('/scrape', async (req, res) => {
  const { keyword, pincode } = req.query;

  if (!keyword || !pincode) {
    return res.status(400).json({ error: 'Missing keyword or pincode' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const searchQuery = encodeURIComponent(`${keyword} near ${pincode}`);
    await page.goto(`https://www.google.com/maps/search/${searchQuery}`, {
      waitUntil: 'networkidle2'
    });
    await page.waitForTimeout(5000); // Let results load

    const data = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('.hfpxzc').forEach((el) => {
        const name = el.querySelector('.qBF1Pd')?.innerText || '';
        const address = el.querySelector('.rllt__details span')?.innerText || '';
        results.push({ name, address });
      });
      return results;
    });

    await browser.close();
    res.json({ keyword, pincode, results: data });
  } catch (error) {
    res.status(500).json({
      error: 'Scraping failed',
      detail: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
