const puppeteer = require('puppeteer');
const $         = require('cheerio');
const telegram  = require('telegram-bot-api');
const CronJob   = require('cron').CronJob;

const topsecret = require('./topsecret');
const url    = 'https://www.very.co.uk/nintendo-switch-nintendo-switch-animal-crossing-new-horizons-edition-console/1600456594.prd';
// const url    = 'https://www.very.co.uk/nintendo-switch-lite-switch-lite-console-yellow/1600394797.prd';
const domain = 'Very.co.uk';

(async () => {
    console.log('init');
    startTracking();
    // const page = await configureBrowser();
    // checkAvailability(page);
})();

async function startTracking() {
    const page = await configureBrowser();

    let job = new CronJob('*/15 * * * * *', function() { //runs every 5 secs in this config
      var d = new Date();
      var now = d.toLocaleDateString('en-UK')+' '+d.toLocaleTimeString('en-UK');

      console.log('Starting at: '+now);
      in_stock = checkAvailability(page);
      // console.log(in_stock);
      // if (in_stock) {
      //   let current_job = schedule.scheduledJobs[uniqueJobName];
      //   current_job.cancel();
      // };

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

    $('.stockMessaging > span.indicator', html).each(function() {
        let availablity = $(this).text();
        console.log(availablity);
        // let value = Number(price.replace(/[^0-9.-]+/g,""));

        if (availablity == in_stock_tag) {
            console.log("Status: " + availablity);
            sendNotification();
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
