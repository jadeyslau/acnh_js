const puppeteer  = require('puppeteer');
const $ = require('cheerio');
const telegram = require('telegram-bot-api');
const CronJob = require('cron').CronJob;

const tgram = require('./details').telegram;

var d = new Date();
var now = d.toLocaleDateString('en-UK')+' '+d.toLocaleTimeString('en-UK');

const url = 'https://www.amazon.co.uk/gp/offer-listing/B081W4XHMZ/ref=olp_twister_all?ie=UTF8&mv_edition=all&mv_platform_for_display=0';

(async () => {
    console.log('init');
    startTracking();
})();

async function startTracking() {
    const page = await configureBrowser();

    let job = new CronJob('*/5 * * * * *', function() { //runs every 5 secs in this config
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

    let html = await page.evaluate(() => document.body.innerHTML);
    // console.log(html);
    console.log(now+' Checking price');

    $('.olpOfferPrice', html).each(function() {
        let price = $(this).text();
        console.log(price);
        let value = Number(price.replace(/[^0-9.-]+/g,""));


        if (value < 360) {
            console.log("BUY!!!! " + value);
            sendNotification(value);
        }
    });
}

async function sendNotification(value) {
      var api = new telegram({
        token: tgram.telegram_token
      });

      api.sendMessage({
          chat_id: tgram.telegram_chat_id,
          text: 'In stock: '+url,
      });
}
