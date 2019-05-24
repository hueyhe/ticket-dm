const puppeteer = require('puppeteer');
const { Cluster } = require('puppeteer-cluster');
const configs = require('./config');
const instanceCount = configs.length;

const mainUrl = 'https://www.damai.cn/';
// const loginUrl = 'https://passport.damai.cn/login?ru=https%3A%2F%2Fwww.damai.cn%2F';
const dota2Url = 'https://detail.damai.cn/item.htm?spm=a2oeg.search_category.0.0.531c58efwCT24N&id=593089517773&clicktitle=2019%20DOTA2%20%E5%9B%BD%E9%99%85%E9%82%80%E8%AF%B7%E8%B5%9B';
// const dota2Url = 'https://detail.damai.cn/item.htm?spm=a2oeg.home.card_0.ditem_1.591b23e18ScHHd&id=594350362632';
// 2019/5/24 11:59:59
const startTime = 1558670399000;

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: instanceCount,
    timeout: 9999999,
    puppeteerOptions: {
      headless: false,
      devtools: true,
    },
  });

  cluster.on('taskerror', (err, data) => {
    console.log(`Error crawling ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data: config }) => {
    const {
      prerogativeCode,
      cookies,
    } = config;
    await page.goto(mainUrl);
    page.setCookie(...cookies);

    // Verify login
    await Promise.all([
      page.waitForNavigation(),
      page.click('div.login-user'),
    ]);
    await page.goBack();

    // open dota2 page
    await page.goto(dota2Url);

    // wait for sale time
    await page.waitForFunction((startTime) => {
      const now = +new Date();
      const diff = startTime - now;
      const ready = diff <= 0;
      if (!ready) {
        const remain = diff / 1000;
        console.log(`${remain}s remaining...`);
      }
      return ready;
    }, {
      polling: 100,
      timeout: 9999999,
    }, startTime);

    // Check if prerogative confirm button ready
    while (await page.$('button.privilege_sub.disabled') !== null) {
      await page.reload();
    }

    // submit prerogative code
    await page.type('#privilege_val', prerogativeCode);
    await page.click('button.privilege_sub');

    // Choose options
    // await page.waitForSelector('body .perform');
    await page.click('.select_right_list_item:nth-child(3)');

    console.log('Waiting for submit button ready...');
    while (await page.$('.buybtn.disabled') !== null) {
    }
    console.log('Ready!');
    // Buy two tickets
    await page.click('.cafe-c-input-number-handler-up');
    // await page.type('.cafe-c-input-number-input', '2');
    // Submit
    await Promise.all([
      page.waitForNavigation(),
      page.click('.buybtn'),
    ]);

    // Check identifications
    while (true) {
      let buyer1 = await page.$('.buyer-list-item:nth-child(1) label .next-checkbox');
      let buyer1Checked = await page.$('.buyer-list-item:nth-child(1) .checked');
      let buyer2 = await page.$('.buyer-list-item:nth-child(2) label .next-checkbox');
      let buyer2Checked = await page.$('.buyer-list-item:nth-child(2) .checked');
      if (buyer1 && !buyer1Checked) {
        await page.click('.buyer-list-item:nth-child(1) label');
      }
      if (buyer2 && !buyer2Checked) {
        await page.click('.buyer-list-item:nth-child(2) label');
      }
      buyer1 = await page.$('.buyer-list-item:nth-child(1) label .next-checkbox');
      buyer1Checked = await page.$('.buyer-list-item:nth-child(1) .checked');
      buyer2 = await page.$('.buyer-list-item:nth-child(2) label .next-checkbox');
      buyer2Checked = await page.$('.buyer-list-item:nth-child(2) .checked');
      if ((!buyer1 || buyer1Checked) && (!buyer2 || buyer2Checked)) {
        break;
      }
    }

    // Submit!!!
    while (true) {
      await page.click('.submit-wrapper button');
    }
  });

  configs.forEach(conf => cluster.queue(conf));

  await cluster.idle();
  await cluster.close();
})();

