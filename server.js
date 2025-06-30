const express = require("express");
const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/scrape", async (req, res) => {
  const { keyword, pincode } = req.query;
  if (!keyword || !pincode) {
    return res.status(400).json({ error: "Missing keyword or pincode" });
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
    await page.goto(`https://www.google.com/maps/search/${keyword}+${pincode}`, {
      waitUntil: "networkidle2",
    });

    const data = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href^="https://www.google.com/maps/place/"]'))
        .map(link => ({
          name: link.textContent.trim(),
          url: link.href,
        }))
        .filter(item => item.name.length > 0);
    });

    res.json({ keyword, pincode, results: data });
  } catch (error) {
    res.status(500).json({ error: "Failed to scrape Google Maps", detail: error.message });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
