// import {PuppeteerHandler} from "./PuppeteerHandler";
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const PuppeteerHandler = require('./PuppeteerHandler');

 class OzonHandler extends PuppeteerHandler {
    constructor(folderName) {
        super();

        this.folderName = folderName;
        this.linksForScraping = [];

        try {
            if (!fs.existsSync(folderName)){
                fs.mkdirSync(folderName)
            }
        } catch (err) {
            console.error(err)
        }
    }

    async setCity(cityName) {
        if (!this.browser) {
            await this.initBrowser();
        }

        const page = await this.browser.newPage()
        await page.goto('https://www.ozon.ru/')

        await page.waitForSelector('._1-6r')
        await page.click('._1-6r')

        await page.waitForSelector('.a3')
        await page.waitForSelector('._3tp2._1Hye')
        await page.click('._3tp2._1Hye')

        await page.type('._16XE._2HHF', cityName, {delay: 20});

        await page.click('div.a3 > ul > li:nth-child(1) > a');
    }

    async getLinksForScraping() {
        if (!this.browser) {
            await this.initBrowser();
        }

        let pageNumber = 1
        let flag = true
        const page = await this.browser.newPage()

        while (flag) {
            const buttonNext = await page.evaluate(() => document.querySelector('.b9i0._2avF' ));

            if (!buttonNext) {
                flag = false
            }

            await page.goto(`https://www.ozon.ru/category/kvas-9469/?page=${pageNumber}`)
            await page.waitForTimeout(3000)
            await page.waitForSelector('a.tile-hover-target.b3u9')

            let html = await page.evaluate(async () => {
                let urls = []

                try {
                    let links = document.querySelectorAll('a.tile-hover-target.b3u9')

                    links.forEach(a => urls.push(a.href))
                } catch (e) {
                    console.log(e)
                }

                return urls
            }, {waitUntil: 'a.tile-hover-target.b3u9'})

            pageNumber++

            this.linksForScraping.push(html)
        }
    }

    async pageHandler() {
        let json = []
        const page = await this.browser.newPage()

        for (const pgItem of this.linksForScraping.flat()) {
            await page.goto(pgItem)

            try {
                await page.waitForSelector('h1.b3a8')
                await page.waitForSelector('span.c2h5')
                await page.waitForSelector('div.da3 div dl.db8')
            } catch (e) {
                console.log('AAAAAAAAAAAAAAAAa', e)
            }

            let html = await page.evaluate(async () => {
                let page = {}

                let dls = document.querySelectorAll('div.da3 div dl.db8')

                for await (let dl of dls) {
                    const [name, value] = dl.children

                    if (name.innerText.toLocaleLowerCase().includes('артикул')) {
                        page.code = value.innerText
                    }
                }

                try {
                    try {
                        let name = document.querySelector('h1.b3a8')
                        page.name = name.innerText
                    } catch {
                        page.name = '-'
                    }

                    try {
                        let salePrice = document.querySelector('span.c2h5.c2h6 span')
                        let price = document.querySelector('span.c2h8')
                        page.salePrice = salePrice.innerText
                        page.price = price.innerText
                    } catch {
                        page.salePrice = '-'
                    }

                    if (page.price === undefined) {
                        try {
                            let price = document.querySelector('span.c2h5 span')
                            page.price = price.innerText
                        } catch {
                            page.price = '-'
                        }
                    }
                } catch (e) {
                    console.log(e)
                }

                return page
            }, {waitUntil: 'networkidle0'})

            json.push(html)
            await page.screenshot({ path: `${this.folderName}/${uuidv4()}.png`, fullPage: true });
        }

        fs.writeFile(`${this.folderName}/data.json`, JSON.stringify({'data': json.flat()}), { flag: 'w+' }, err => {
            console.log('err', err)
        })
    }
}

module.exports = OzonHandler
