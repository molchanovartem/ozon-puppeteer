const OzonHandler = require("./OzonHandler");
const { v4: uuidv4 } = require('uuid');

const p = new OzonHandler(uuidv4());
const cityName =  process.argv[2] ? process.argv[2] : 'Москва';

(async function() {
    await p.setCity(cityName)

    await p.getLinksForScraping()

    await p.pageHandler()

    await p.closeBrowser()
})()
