const express = require("express");
const chromium = require("chrome-aws-lambda");

const app = express();
const port = process.env.PORT || 3000;

app.get("/scrape", async (req, res) => {
  const { keyword, pincode } = req.query;
  if (!keyword || !pincode) return res.status(400).json({ error: "Missing keyword or pincode" });

  try {
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    const query = encodeURIComponent(`${keyword} in ${pincode}`);
    await page.goto(`https://www.google.com/maps/search/${query}`);

    await page.waitForTimeout(3000);
    const title = await page.title();

    await browser.close();
    res.json({ success: true, title });
  } catch (err) {
    res.status(500).json({ error: "Scraping failed", detail: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
