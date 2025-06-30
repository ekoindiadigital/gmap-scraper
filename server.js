const express = require("express");
const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✅ GMap Scraper is running!");
});

app.get("/scrape", async (req, res) => {
  const keyword = req.query.keyword;
  const pincode = req.query.pincode;

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
    const url = `https://www.google.com/maps/search/${keyword}+${pincode}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    // 🟡 You can customize scraping logic here
    const title = await page.title();

    res.json({ success: true, title });
  } catch (err) {
    console.error("Scrape error:", err.message);
    res.status(500).json({ error: "Failed to scrape Google Maps", detail: err.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
