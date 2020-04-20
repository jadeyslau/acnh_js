const puppeteer = require('puppeteer');
const $         = require('cheerio');
const telegram  = require('telegram-bot-api');
const CronJob   = require('cron').CronJob;

const topsecret = require('./topsecret');

const url = topsecret.amz_url;
const domain = 'Amazon.co.uk';

(async () => {
    console.log('init');
    startTracking();
})();

async function startTracking() {
    const page = await configureBrowser();

    let job = new CronJob('*/10 * * * * *', function() { //runs every 5 secs in this config
      var d = new Date();
      var now = d.toLocaleDateString('en-UK')+' '+d.toLocaleTimeString('en-UK');

      console.log('Starting at: '+now);
      checkPrice(page);
    }, null, true, null, null, true);
    job.start();
}

async function configureBrowser() {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto(url);
    return page;
}

async function checkPrice(page) {
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    let html = await page.evaluate(() => document.body.innerHTML);
    // console.log(html);
    console.log('Checking price on '+domain);

    $('.olpOfferPrice', html).each(function() {
        let price = $(this).text();
        console.log(price);
        let value = Number(price.replace(/[^0-9.-]+/g,""));


        if (value < 360) {
            console.log("BUY!!!! " + value);
            //olpSellerName
            sendNotification(value);
        }
    });
}

async function sendNotification(value) {
      var api = new telegram({
        token: topsecret.telegram_token
      });

      api.sendMessage({
          chat_id: topsecret.telegram_chat_id,
          text: 'In stock: '+url,
      });
}
