const puppeteer = require('puppeteer');
const $         = require('cheerio');
const telegram  = require('telegram-bot-api');
const CronJob   = require('cron').CronJob;

const topsecret = require('./topsecret');

const url = 'https://www.currys.co.uk/gbuk/s_action/compare/10206234-10206236-10206237-10206235.html'
// const url = 'https://www.currys.co.uk/gbuk/s_action/compare/10198827-10198832-10198830-10163022.html'
const domain = 'Currys.co.uk';

(async () => {
    console.log('init');
    startTracking();
})();

async function startTracking() {
    const page = await configureBrowser();

    let job = new CronJob('*/15 * * * * *', function() { //runs every 5 secs in this config
      var d = new Date();
      var now = d.toLocaleDateString('en-UK')+' '+d.toLocaleTimeString('en-UK');

      console.log('Starting at: '+now);
      in_stock = checkAvailability(page);
    }, null, true, null, null, true);
    job.start();
}

async function configureBrowser() {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
    await page.goto(url);
    return page;
}

async function checkAvailability(page) {
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    let html = await page.evaluate(() => document.body.innerHTML);
    // console.log(html);
    console.log('Checking availability on '+domain);

    var in_stock      = false;
    var in_stock_tag  = 'Available'

    $('#compareTable > tbody > tr.disablePrint > td', html).each(function() {
        availability = $(this).text().trim();
        // in_stock_tag = 'Add to basket';
        // console.log(availability);

        if (availability == 'Add to basket') {
            console.log("Status: " + availability);
            if (in_stock == false){
              sendNotification();
            };
            in_stock = true;
        }
      });
    return in_stock;
}

async function sendNotification() {
      var api = new telegram({
        token: topsecret.telegram_token
      });

      api.sendMessage({
          chat_id: topsecret.telegram_chat_id,
          text: 'In stock: '+url,
      });
}
