const fs = require('fs');
const request = require('request');
const xlsx = require('xlsx');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
let wb = xlsx.readFile('./price/KedrAndrey.xlsx');

module.exports = {

    download: function (uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            //console.log('content-type:', res.headers['content-type']);
            //console.log('content-length:', res.headers['content-length']);
            return request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    },

    rusToLatin: function (str) {

        var ru = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
            'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z', 'и': 'i',
            'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh',
            'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'u', 'я': 'ya',
            ' ': '-', '.': '_', '*': '_'
        }, n_str = [];

        str = str.replace(/[ъь]+/g, '').replace(/й/g, 'i');

        for (var i = 0; i < str.length; ++i) {
            n_str.push(
                ru[str[i]]
                || ru[str[i].toLowerCase()] === undefined && str[i]
                || ru[str[i].toLowerCase()].replace(/^(.)/, function (match) {
                    return match.toLowerCase()
                })
            );
        }

        return n_str.join('');
    },

    getPriceItem: function () {
        let dollar = 24.27 + (24.27 * 0.3),
            item = {},
            arr = [];
        for (let variable in wb.Sheets['Sheet1']) {
            let num = variable.slice(1, variable.length);
            if (variable.slice(0, 1) === "C") {
                if (wb.Sheets['Sheet1'][variable]['v'] === 0) {
                    variable = variable.replace(/C/gi, "B");
                    item['category'] = wb.Sheets['Sheet1'][variable]['v'];
                } else {
                    let v = variable.replace(/C/gi, "B");
                    item['name'] = wb.Sheets['Sheet1'][v]['v'];
                    item['price'] = (wb.Sheets['Sheet1'][variable]['v'] * dollar).toFixed(2);
                    arr.push({'category': item['category'], 'name': item['name'], 'price': item['price']});
                }
            }
        }
        return arr;
    },

    getScrabLinks: async function (link, index = 1) {
        const browser = await puppeteer.launch({ignoreHTTPSErrors: true});
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on("request", request => {
            request.continue();
        });
        await page.emulate(devices['iPhone 6']);
        if (index === 1) {
            await page.goto(link, {timeout: 0, waitUntil: "networkidle0"});
        } else {
            await page.goto(link + '?page=' + index, {timeout: 0, waitUntil: "networkidle0"});
        }
        await page.waitForSelector('div.product-wrapper div.product-name a');
        let allPages = await page.$eval('div.mg-pager div.allPages span', text => {
            return text.innerText
        });
        let href = await page.$$eval('div.product-wrapper div.product-name a', href => {
            return href.map(item => item.href)
        });
        await browser.close();
        return {pages: allPages, hrefs: href};
    },

    getScrabProducts: async function (link) {
        const browser = await puppeteer.launch({ignoreHTTPSErrors: true});
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on("request", request => {
            request.continue();
        });
        await page.emulate(devices['iPhone 6']);
        await page.goto(link, {timeout: 0, waitUntil: "networkidle0"});
        await page.waitForSelector('div.product-code span.code');
        let id = await page.$eval('div.product-code span.code', (text) => {
            console.log(text);
            return text.innerText
        });
        let title = await page.$eval('div.bread-crumbs span.last-crumb', (text) => {
            console.log(text);
            return text.innerText
        });
        let description = await page.$eval('div.product-tabs-container div#tab1', (text) => {
            console.log(text);
            return text.innerHTML
        });
        let price = await page.$eval('div.normal-price span.price', (text) => {
            console.log(text);
            return text.innerText + ' UAH'
        });
        let brand = 'MVM';
        let condition = 'new';
        let url = link;
        let availability = 'in stock';
        let image_link = await page.$eval('div.magnify img.mg-product-image', (img) => {
            console.log(img);
            return img.src
        });
        await browser.close();
        return {id: id, title: title, description: description, price: price, brand: brand, condition: condition, link: url, availability: availability, image_link: image_link};
    },

    generateSequence: function* (link, end) {
        for (let i = 1; i <= end; i++) {
            let subData = this.getScrabData(link, i);
            yield subData.then(function (value) {
                if (Array.isArray(value.hrefs)) {
                    return value.hrefs;
                }
            }).catch(function (e) {
                console.log(e);
            });
        }
    },

    asyncForEach: async function (array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }
}
