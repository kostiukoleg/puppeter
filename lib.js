const fs = require('fs');
const request = require('request');
const path = require('path');
const xlsx = require('xlsx');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
let wb = xlsx.readFile('price/KedrAndrey.xlsx');
const createCsvWriter  = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: 'data.csv',
    header: [
        {id: 'id', title: 'id'},
        {id: 'title', title: 'title'},
        {id: 'description', title: 'description'},
        {id: 'price', title: 'price'},
        {id: 'brand', title: 'brand'},
        {id: 'condition', title: 'condition'},
        {id: 'link', title: 'link'},
        {id: 'availability', title: 'availability'},
        {id: 'image_link', title: 'image_link'},
        {id: 'unit_pricing_measure', title: 'unit_pricing_measure'},
        {id: 'end', title: '\n'}
    ],
    fieldDelimiter: ';',
    encoding: 'utf8',
    alwaysQuote: true,
    flags: 'a',
    mode: '0744'
});

    async function download (uri, filename, callback) {
        request.head(uri, function(err, res, body){
            if (err) callback(err, filename);
            else {
                var stream = request(uri);
                stream.pipe(
                    fs.createWriteStream(filename)
                        .on('error', function(err){
                            callback(error, filename);
                            stream.read();
                        })
                )
                    .on('close', function() {
                        callback(null, filename);
                    });
            }
        });
    }

    function rusToLatin (str) {

        let ru = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
            'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z', 'и': 'i',
            'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh',
            'щ': 'shch', 'ы': 'y', 'э': 'e', 'ю': 'u', 'я': 'ya',
            ' ': '-', '*': '_'
        }, n_str = [];

        str = str.replace(/[ъь]+/g, '').replace(/й/g, 'i');

        for (let i = 0; i < str.length; ++i) {
            n_str.push(
                ru[str[i]]
                || ru[str[i].toLowerCase()] === undefined && str[i]
                || ru[str[i].toLowerCase()].replace(/^(.)/, function (match) {
                    return match.toLowerCase()
                })
            );
        }

        return n_str.join('');
    }

    function getPriceItem () {
        let dollar = 24.27 + (24.27 * 0.3),
            item = {},
            arr = [];
        for (variable in wb.Sheets['Sheet1']) {
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
    }

    async function getScrabLinks (link, index = 1) {
        try {
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
            await page.waitForSelector('div.product-wrapper div.product-name a').catch((e)=>{
                console.log(e);
            });
            let allPages = await page.$eval('div.mg-pager div.allPages span', text => {
                return text.innerText
            }).catch((e)=>{
                console.log(e);
            });
            let href = await page.$$eval('div.product-wrapper div.product-name a', href => {
                return href.map(item => item.href)
            }).catch((e)=>{
                console.log(e);
            });
            await browser.close();
            return {pages: allPages, hrefs: href};
        } catch (e) {
            console.log(e);
        }
    }

    async function getNewStyleLinks (link) {
        try {
            const browser = await puppeteer.launch({ignoreHTTPSErrors: true, headless: false});
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on("request", request => {
                request.continue();
            });
            await page.emulate(devices['iPad Pro landscape']);
            await page.goto(link, {timeout: 0, waitUntil: "networkidle0"});
            await page.waitForSelector('div.catalog-collection div.cards a.cards__img').catch((e)=>{
                console.log(e);
            });
            let href = await page.$$eval('div.catalog-collection div.cards a.cards__img', href => {
                return href.map(item => item.href)
            }).catch((e)=>{
                console.log(e);
            });
            await browser.close();
            return href;
        } catch (e) {
            console.log(e);
        }
    }

    async function getScrabProducts (link) {
        try {
            const browser = await puppeteer.launch({ignoreHTTPSErrors: true, headless: false});
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on("request", request => {
                request.continue();
            });
            await page.emulate(devices['iPhone 6']);
            await page.goto(link, {timeout: 0, waitUntil: "networkidle0"}).catch((e)=>{
                console.log(e);
            });
            await page.waitForSelector('div.product-code span.code').catch((e)=>{
                console.log(e);
            });
            let id = await page.$eval('div.product-code span.code', (text) => {
                return text.innerText
            }).catch((e)=>{
                console.log(e);
            });
            await page.waitForSelector('div.bread-crumbs span.last-crumb').catch((e)=>{
                console.log(e);
            });
            let title = await page.$eval('div.bread-crumbs span.last-crumb', (text) => {
                return text.innerText
            }).catch((e)=>{
                console.log(e);
            });
            await page.waitForSelector('div.product-tabs-container div#tab1').catch((e)=>{
                console.log(e);
            });
            let description = await page.$eval('div.product-tabs-container div#tab1', (text) => {
                return text.innerHTML
            }).catch((e)=>{
                console.log(e);
            });
            await page.waitForSelector('div.normal-price span.price').catch((e)=>{
                console.log(e);
            });
            let price = await page.$eval('div.normal-price span.price', (text) => {
                return `${text.innerText} UAH`
            }).catch((e)=>{
                console.log(e);
            });
            let brand = 'MVM';
            let condition = 'new';
            let url = link;
            let availability = 'in stock';
            await page.goto("https://www.zamochniki.com.ua/search-engine.htm?slovo="+encodeURI(title)+"&search_submit=&hledatjak=2", {timeout: 0, waitUntil: "networkidle0"}).catch((e)=>{
                console.log(e);
            });
            await page.waitForSelector('div.productBody div.img_box a img').catch((e)=>{
               // console.log(e);
            });
            let image_link = await page.$eval('div.productBody div.img_box a img', (img) => {
                return img.src
            }).catch((e)=>{
                //console.log(e);
            });
            if(!image_link){
                image_link = '';
            }
            let unit_pricing_measure = 'ct';
            let color = title.match(/\s{1}\S+/gi).catch((e)=>{
                console.log(e);
            });
            switch (color[0]) {
                case ' MAB':
                    color = ' матова антична бронза';
                    break;
                case ' SN':
                    color = ' матовий никель';
                    break;
                case ' AB':
                    color = ' стара бронза';
                    break;
                case ' PB':
                    color = ' полированная латунь';
                    break;
                case ' SB':
                    color = ' матовая латунь';
                    break;
                case ' CP':
                    color = ' полированний хром';
                    break;
                case ' MC':
                    color = ' матовий хром';
                    break;
                case ' MACC':
                    color = ' матовая бронза';
                    break;
                case ' MN':
                    color = ' матовий никель';
                    break;
                case ' BN/SBN':
                    color = ' чорний никель/матовий чорний никель';
                    break;
                case ' PB/SB':
                    color = ' полированая латунь/матовая латунь';
                    break;
                case ' SN/CP':
                    color = ' матовий никель/полирований хром';
                    break;
                case ' Black/CP':
                    color = ' чёрный/полированный хром';
                    break;
                case ' PCF':
                    color = ' полирована бронза';
                    break;
                case ' SS':
                    color = ' нержавеющая сталь';
                    break;
                case ' W':
                    color = ' белый';
                    break;
                case ' S':
                    color = ' серебрянный';
                    break;
                case ' B':
                    color = ' коричневий';
                    break;
                default:
                    color = "Нет таких значений";
            }
            csvWriter.writeRecords([{
                'id': id,
                'title': "Ручка на розетке MVM "+title+color,
                'description': description.replace(/&nbsp;/g, " ").replace(/\<p\>\s{2,}/g, "<p>").replace(/\<p\>\s{1}\<\/p\>/g, "").replace(/<[^>]*>?/gm, '').replace(/\S{1,}(Ручка)\s?/gm, 'Ручка'),
                'price': price,
                'brand': brand,
                'condition': condition,
                'link': url,
                'availability': availability,
                'image_link': image_link,
                'unit_pricing_measure': unit_pricing_measure,
                'end': '\n'
            }]);
            await browser.close();
        } catch (e) {
            console.error(e);
        }
    }

     async function getScrabNsProducts (link) {
        try {
            const browser = await puppeteer.launch({ignoreHTTPSErrors: true, headless: true});
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on("request", request => {
                request.continue();
            });
            await page.emulate(devices['iPad Pro landscape']);
            await page.goto(link, {timeout: 0, waitUntil: "networkidle0"}).catch((e)=>{
                console.log(e);
            });
            await page.waitForSelector('div.path-page a.path-page__link').catch((e)=>{
                console.log(e);
            });
            let category = await page.$$eval('div.path-page a.path-page__link', (text) => {
                return text.map(item => item.innerText);
            }).catch((e)=>{
                console.log(e);
            });
            await page.waitForSelector('h2.title-section').catch((e)=>{
                console.log(e);
            });
            let title = await page.$eval('h2.title-section', (text) => {
                return text.innerText
            }).catch((e)=>{
                console.log(e);
            });
            await page.waitForSelector('div.open-model__desc div.open-model__group-info>p').catch((e)=>{
                console.log(e);
            });
            let description = await page.$eval('div.open-model__desc div.open-model__group-info>p', (text) => {
                return text.innerHTML
            }).catch((e)=>{
                console.log(e);
            });
            await page.waitForSelector('div.open-model__info div.product_desc>p').catch((e)=>{
                console.log(e);
            });
            let description2 = await page.$eval('div.open-model__info div.product_desc>p', (text) => {
                return text.innerHTML
            }).catch((e)=>{
                console.log(e);
            });
            await page.waitForSelector('div.model-slider-nav__item[role="option"] a').catch((e)=>{
               console.log(e);
            });
            let image_links = await page.$$eval('div.model-slider-nav__item[role="option"] a', href => {
                return href.map(item => item.href)
            }).catch((e)=>{
                console.log(e);
            });
            if(!image_links){
                image_links = '';
            }
            const src = image_links.map(function(item){
                download(item, "img/"+rusToLatin(decodeURI(item.match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0].replace( /%20\+/g, "_" ))), function(err, fileName){
                    if (err) console.log(err);
                });
                return rusToLatin(decodeURI(item.match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0].replace( /%20\+/g, "_" )))+"[:param:][alt="+decodeURI(item.match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0].replace( /%20\+/g, " " ).replace( /.{1}[jpgJPGpngPNGgifGIF]{3}/g, "" ).replace( /-/g, " " ))+"][title="+decodeURI(item.match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0].replace( /%20\+/g, " " ).replace( /.{1}[jpgJPGpngPNGgifGIF]{3}/g, "" ).replace( /-/g, " " ))+"]";
            });
            let data = {
                'cat': 'Межкомнатные двери/Новый стиль/' +category[2],
                'url_cat': 'interior-doors/new-style/'+rusToLatin(category[2].replace( /[“”]/g, "" )),
                'goods': title.replace( /[“”]/g, "" ),
                'variant': null,
                'description': "<p>"+description+"</p><p>"+description2+"</p>",
                'price': null,
                'url': null,
                'image': src.join('|'),
                'article': null,
                'quantity': -1,
                'activity': 1,
                'title_seo': null,
                'keys_seo': null,
                'description_seo': null,
                'old_price': null,
                'recommended': 0,
                'new': 0,
                'sort': null,
                'weight': 0,
                'bined_article': null,
                'similar_cat': null,
                'url_goods': null,
                'currency': 'UAH',
                'property': null,
                'end': '\n'
            };
            csvWriter.writeRecords([data]).then(()=> console.log('The CSV file was written successfully')).catch((e)=>{
                console.log(e);
            });
            await browser.close();
        } catch (e) {
            console.error(e);
        }
    }

    async function getScrabProductIMG (link) {
        try {
            const browser = await puppeteer.launch({ignoreHTTPSErrors: true});
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on("request", request => {
                request.continue();
            });
            await page.emulate(devices['iPhone 6']);
            await page.goto(link, {timeout: 0, waitUntil: "networkidle0"});
            await page.waitForSelector('div.productBody div.img_box a img');
            let img = await page.$eval('div.productBody div.img_box a img', (img) => {
                console.log(img);
                return img.src
            });
            await browser.close();
            return img;
        } catch (e) {
            console.error(e);
        }
    }

    function* generateSequence (link, end) {
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
    }

    async function getData (arr) {
        return await Promise.all(arr.map(item => this.getScrabProducts(item)));
    }

    async function asyncForEach (array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
            console.log(index);
        }
    }

    async function asyncForEachAll (array, callback) {
        let index = 0;
        while (index < array.length) {
            let newArr = array.slice(index, index + 10);
            await Promise.all(newArr.map(item => callback(item))).catch(function (err) {
                console.log('A promise failed to resolve', err);
            });
            console.log(index);
            index += 10;
            await this.sleep(3000);
        }
    }

    async function sleep (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function clearDir (directory = 0, file = 0) {
        if (file !== 0 && fs.existsSync(file)) {
            fs.unlink(file, err => {
                if (err) throw err;
            });
        } else if(directory !== 0) {
            fs.readdir(directory, (err, files) => {
                if (err) throw err;
                for (const file of files) {
                    fs.unlink(path.join(directory, file), err => {
                        if (err) throw err;
                    });
                }
            });
        }
    }
module.exports = {download, rusToLatin, getPriceItem, getScrabLinks, getNewStyleLinks, getScrabProducts, getScrabNsProducts, getScrabProductIMG, generateSequence, getData, asyncForEach, asyncForEachAll, sleep, clearDir};
