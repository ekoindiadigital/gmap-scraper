const express = require("express");
const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

const app = express();

app.get("/", (req, res) => {
  res.send("✅ Gmap Scraper is live. Use /scrape?keyword=...&pincode=...");
});

app.get("/scrape", async (req, res) => {
  const { keyword, pincode } = req.query;

  if (!keyword || !pincode) {
    return res.status(400).json({ error: "Missing keyword or pincode" });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const url = `https://www.google.com/maps/search/${encodeURIComponent(keyword)}+${encodeURIComponent(pincode)}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      const data = [];
      const elements = document.querySelectorAll('[role="article"]');

      elements.forEach(el => {
        const name = el.querySelector("div[aria-label]")?.getAttribute("aria-label") || null;
        const address = el.querySelector(".W4Efsd div:nth-child(2) .W4Efsd")?.textContent || null;
        if (name) data.push({ name, address });
      });

      return data;
    });

    res.json({ keyword, pincode, count: results.length, results });
  } catch (err) {
    res.status(500).json({
      error: "Failed to scrape Google Maps",
      detail: err.message,
    });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
