const puppeteer  = require('puppeteer');
const $ = require('cheerio');
const telegram = require('telegram-bot-api');
const CronJob = require('cron').CronJob;

// const login = require('./details').login;
// const tgram = require('./details').telegram;

// const url = 'https://www.currys.co.uk/gbuk/s_action/compare/10206234-10206236-10206237-10206235.html'
const url = 'https://www.currys.co.uk/gbuk/s_action/compare/10198827-10198832-10198830-10163022.html'
const screenshot = 'currys.png';


(async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

  await page.goto(url);
  let html = await page.evaluate(() => document.body.innerHTML);
  // console.log(html);

  $('#compareTable > tbody > tr.disablePrint > td', html).each(function() {
      availability = $(this).text().trim();
      // in_stock_tag = 'Add to basket';
      console.log(availability);

      if (availability == 'Add to basket') {
          console.log("Status: " + availability);
          sendNotification();
          in_stock = true;
      }
    });



  await page.screenshot({path: screenshot});
  await browser.close();
})();

async function sendNotification() {
      var api = new telegram({
        token: tgram.telegram_token
      });

      api.sendMessage({
          chat_id: tgram.telegram_chat_id,
          text: 'In stock: '+url,
      });
}
