const puppeteer = require("puppeteer");

async function scrapeGmap(keyword, pincode) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  const query = `${keyword} ${pincode}`;
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: "domcontentloaded" });

  await page.waitForSelector('[role="article"]', { timeout: 10000 });

  const results = await page.evaluate(() => {
    const cards = document.querySelectorAll('[role="article"]');
    const data = [];
    cards.forEach((card) => {
      const name = card.querySelector("h3")?.textContent || "";
      const address = card.querySelector('[data-item-id*="address"]')?.textContent || "";
      const phone = card.querySelector('[data-tooltip*="Phone"]')?.textContent || "";
      data.push({ name, address, phone });
    });
    return data;
  });

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

const [keyword, pincode] = process.argv.slice(2);
scrapeGmap(keyword || "ATM", pincode || "110001");
