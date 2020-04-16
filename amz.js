const puppeteer  = require('puppeteer');
const $ = require('cheerio');
const telegram = require('telegram-bot-api');
const CronJob = require('cron').CronJob;

const login = require('./details').login;
const tgram = require('./details').telegram;

const url = 'https://www.amazon.co.uk/gp/offer-listing/B081W4XHMZ/ref=olp_twister_all?ie=UTF8&mv_edition=all&mv_platform_for_display=0'
const screenshot = 'amz.png';

(async () => {
    console.log('init');
    // const page = await configureBrowser();

    // let isLogged = false;
    // isLogged = await loggedCheck(page);
    // checkPrice(page);
    startTracking();


})();

async function configureBrowser() {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');s
    await page.goto(url);
    return page;
}

// const loggedCheck = async (page) => {
//     try {
//         await page.waitForSelector('#bluebarRoot', { timeout: 10000 });
//         return true;
//     } catch(err) {
//         return false;
//     }
// };

// async function logIn(page) {
//     console.log('logging in');
//     await page.click('#nav-tools a')
//     await page.waitForSelector('input#ap_email')
//     await page.type('input#ap_email', login.user);
//     await page.click('#continue')
//     await page.waitForSelector('input#ap_password')
//     await page.type('input#ap_password', login.pass);
//     await page.click('#signInSubmit')
//     return page;
// }

async function purchase(page) {
    page = logIn(page);
    await page.waitForNavigation();
    let html = await page.evaluate(() => document.body.innerHTML);
    console.log(html);
    // await page.screenshot({path: screenshot});
}

async function checkPrice(page) {
    // await page.reload();
    let html = await page.evaluate(() => document.body.innerHTML);
    // console.log(html);
    console.log('check price');
    // let
    $('.olpOfferPrice', html).each(function() {
        let price = $(this).text();
        // console.log(price);
        let value = Number(price.replace(/[^0-9.-]+/g,""));
        // purchase(page);

        if (value < 360) {
            console.log("BUY!!!! " + value);
            sendNotification(value);
        }
    });
}

async function startTracking() {
    const page = await configureBrowser();

    let job = new CronJob('*/1 * * * * *', function() { //runs every 1 minutes in this config
      checkPrice(page);
    }, null, true, null, null, true);
    job.start();
}

async function sendNotification(value) {
      var api = new telegram({
        token: tgram.telegram_token,
      });

      api.sendMessage({
          chat_id: tgram.telegram_chat_id,
          text: 'In stock: '+url,
      })
}




// (async () => {
//   const browser = await puppeteer.launch({headless: true});
//   const page = await browser.newPage();
//
//   await page.goto(url);
//
//   //log in
//   await page.click('#nav-tools a')
//   await page.waitForSelector('input#ap_email')
//   await page.type('input#ap_email', login.user);
//   await page.click('#continue')
//   await page.waitForSelector('input#ap_password')
//   await page.type('input#ap_password', login.pass);
//   await page.click('signInSubmit')
//
//   await page.waitForSelector('olpOfferPrice')
//
//   // await page.waitForSelector('input#ap_email')
//   await page.screenshot({path: screenshot});
//   await browser.close();
// })();
