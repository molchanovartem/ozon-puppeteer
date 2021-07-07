const puppeteer = require('puppeteer');

class PuppeteerHandler {
    constructor() {
        this.browser = null;
    }

    async initBrowser() {
        this.browser = await puppeteer.launch({
            headless: false,
        });
    }

    closeBrowser() {
        this.browser.close();
    }
}

module.exports = PuppeteerHandler
