const puppeteer = require('puppeteer');
const $         = require('cheerio');
const telegram  = require('telegram-bot-api');
const CronJob   = require('cron').CronJob;

const topsecret = require('./topsecret');

const url = topsecret.amz_url;
// const url = 'https://www.amazon.co.uk/gp/offer-listing/0825640172/ref=olp_f_primeEligible?ie=UTF8&qid=&sr=&f_new=true&f_primeEligible=true'
// const url = 'https://www.amazon.co.uk/gp/offer-listing/0825640172/ref=olp_f_usedGood?ie=UTF8&qid=&sr=&f_freeShipping=true&f_usedGood=true'
const screenshot = 'amz.png';
const threshold = 360;
const domain = 'Amazon.co.uk';

(async () => {
    console.log('init');
    const page = await configureBrowser();
    loggedIn   = await logIn(page);
    stock      = false;
    startTracking(loggedIn, stock);
})();

async function configureBrowser() {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
    await page.goto(url);
    return page;
}

async function logIn(page) {
    console.log('logging in');
    await page.click('#nav-tools a');
    await page.waitForSelector('input#ap_email');
    await page.type('input#ap_email', topsecret.user);
    await page.click('#continue');
    await page.waitForSelector('input#ap_password');
    await page.type('input#ap_password', topsecret.pass);
    await page.click('#signInSubmit');
    return page;
}

async function startTracking(page, stock) {

    let job = new CronJob('*/20 * * * * *', async function() { //runs every 20 secs in this config
      var d = new Date();
      var now = d.toLocaleDateString('en-UK')+' '+d.toLocaleTimeString('en-UK');
      console.log('Starting at: '+now);

      stock = await checkPrice(page);
      if (stock){
        job.stop();
        console.log('cron cancelled');

      };
    }, null, true, null, null, true);
    job.start();
}

async function addToBasket(page) {
    // page = await logIn(page);

    await page.waitFor('.olpBuyColumn > div > form > span > span > span > [name="submit.addToCart"]').then(console.log('done waiting'));
    var addToBasketBtn = await page.$('.olpBuyColumn > div > form > span > span > span > [name="submit.addToCart"]');
    await addToBasketBtn.click().then(console.log('added to basket'));
    await page.waitForNavigation();
    checkBasket(page);
}

async function checkBasket(page){
  //Check if item is in the basket, if not then return to page and repeat add to basket
  var success = false;
  console.log('checking basket');
  // await page.waitForNavigation();

  let html = await page.evaluate(() => document.body.innerHTML);
  var confirmation = $('#huc-v2-order-row-confirm-text',html).text().trim();

  if (confirmation == 'Added to Basket'){
    console.log("basket success");
    success = true;
    checkOut(page);
  };

};

async function checkOut(page){
  console.log('checking out');

  await page.click('#hlb-ptc-btn-native');
  await page.waitForNavigation();

  if ($('input#ap_password').length){
    await page.type('input#ap_password', topsecret.pass);
    await page.click('#signInSubmit');
    await page.waitForNavigation();
  };

  //check order total
  let html = await page.evaluate(() => document.body.innerHTML);
  var grandTotal  = $('#subtotals-marketplace-table > tbody > tr > td.grand-total-price', html).text().trim();
  let grandTotalV = Number(grandTotal.replace(/[^0-9.-]+/g,""));

  if (grandTotalV < threshold){
    console.log('buying now');
    //buy now
    var buyNowBtn = await page.$('#submitOrderButtonId > span > [name="placeYourOrder1"]');
    await buyNowBtn.click().then(console.log('Buy now clicked'));

    await page.waitForNavigation();
    await page.screenshot({path: screenshot, fullPage: true});

  }else{
    console.log('failed: grand total of '+grandTotalV+' not right');
  };
};

async function checkPrice(page) {
    await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    let html = await page.evaluate(() => document.body.innerHTML);
    // console.log(html);
    console.log('Checking price on '+domain);
    var in_stock = false;
    var price = $('.olpOfferPrice', html).text().trim();
    var seller = $('.olpSellerName', html).text().trim();

    if (seller.length == 0){
      var seller = $('.olpSellerName', html).children('img').attr('alt');
    };

    console.log(price, seller);

    let value = Number(price.replace(/[^0-9.-]+/g,""));

    if (value < threshold && seller == 'Amazon.co.uk') {
        console.log("IN STOCK: " +value+" ...adding to basket!");
        addToBasket(page);
        sendNotification(value);
        in_stock = true;
    }

    return in_stock;
}

async function sendNotification(value) {
      var api = new telegram({
        token: topsecret.telegram_token,
      });

      api.sendMessage({
          chat_id: topsecret.telegram_chat_id,
          text: 'In stock: '+url,
      })
}
