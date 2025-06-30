const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✅ Server is live. Use /scrape?keyword=ATM&pincode=110001");
});

app.get("/scrape", async (req, res) => {
  const { keyword, pincode } = req.query;

  if (!keyword || !pincode) {
    return res.status(400).json({ error: "Missing keyword or pincode" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    const searchURL = `https://www.google.com/maps/search/${encodeURIComponent(
      keyword + " near " + pincode
    )}`;

    await page.goto(searchURL, { waitUntil: "networkidle2" });
    await page.waitForTimeout(3000);

    const results = await page.evaluate(() => {
      const places = [];
      document.querySelectorAll(".hfpxzc").forEach((el) => {
        const name = el.querySelector(".qBF1Pd")?.innerText || "";
        const address = el.querySelector(".rllt__details span")?.innerText || "";
        places.push({ name, address });
      });
      return places;
    });

    await browser.close();
    res.json({ keyword, pincode, results });
  } catch (err) {
    res.status(500).json({
      error: "Scraping failed",
      detail: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
