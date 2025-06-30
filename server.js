const puppeteer = require("puppeteer");
const fs = require("fs");

// Get input from command line
const keyword = process.argv[2] || "ATM";
const pincode = process.argv[3] || "110001";

// Main scraper function
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const searchQuery = encodeURIComponent(`${keyword} near ${pincode}`);
  const url = `https://www.google.com/maps/search/${searchQuery}`;

  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitForTimeout(5000); // wait for results to load

  const results = await page.evaluate(() => {
    const data = [];
    const cards = document.querySelectorAll('div[role="article"]');
    cards.forEach(card => {
      const name = card.querySelector("h3")?.innerText;
      const address = card.querySelector("span[jsinstance='2']")?.innerText;
      if (name && address) {
        data.push({ name, address });
      }
    });
    return data;
  });

  fs.writeFileSync("output.json", JSON.stringify(results, null, 2));
  console.log(`✅ Scraped ${results.length} results for ${keyword} in ${pincode}`);
  await browser.close();
})();
