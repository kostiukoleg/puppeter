const puppeteer = require("puppeteer");
const devices = require('puppeteer/DeviceDescriptors');
const fs = require("fs-extra");
const request = require('request');
const lib = require("./lib");
let items = lib.getPriceItem();
const createCsvWriter  = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'data.csv',
  header: [
    {id: 'cat', title: 'Категория'},//\ufeff
    {id: 'url_cat', title: 'URL категории'},
    {id: 'goods', title: 'Товар'},
    {id: 'variant', title: 'Вариант'},
    {id: 'description', title: 'Описание'},
    {id: 'price', title: 'Цена'},
    {id: 'url', title: 'URL'},
    {id: 'image', title: 'Изображение'},
    {id: 'article', title: 'Артикул'},
    {id: 'quantity', title: 'Количество'},
    {id: 'activity', title: 'Активность'},
    {id: 'title_seo', title: 'Заголовок [SEO]'},
    {id: 'keys_seo', title: 'Ключевые слова [SEO]'},
    {id: 'description_seo', title: 'Описание [SEO]'},
    {id: 'old_price', title: 'Старая цена'},
    {id: 'recommended', title: 'Рекомендуемый'},
    {id: 'new', title: 'Новый'},
    {id: 'sort', title: 'Сортировка'},
    {id: 'weight', title: 'Вес'},
    {id: 'bined_article', title: 'Связанные артикулы'},
    {id: 'similar_cat', title: 'Смежные категории'},
    {id: 'url_goods', title: 'Ссылка на товар'},
    {id: 'currency', title: 'Валюта'},
    {id: 'property', title: 'Свойства'},
    {id: 'end', title: '\n'}
  ],
  fieldDelimiter: ';',
  encoding: 'utf8',
  alwaysQuote: true,
  flags: 'w',
  mode: '0744'
});
lib.clearDir('img');
lib.clearDir(0, 'data.csv');
const asyncGrubber = async function (element) {
    try {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on("request", request => {
            request.continue();
        });
        await page.emulate(devices['iPad Pro']);
        await page.goto('https://prom.ua/ua/search?search_term=' + encodeURI(element.name));
        await page.waitForSelector('div.productTile__content--2UlvD a.productTile__tileLink--204An');
        let href = await page.$eval('div.productTile__content--2UlvD a.productTile__tileLink--204An', el => el.href);
        await page.waitForSelector('div.productTile__content--2UlvD div.productTile__imageHolder--3BuD9 img');
        let imgSrc = await page.$eval('div.productTile__content--2UlvD div.productTile__imageHolder--3BuD9 img', el => el.src);
        await lib.download(imgSrc.replace(/_w200_h200/ig, ''), "img/"+imgSrc.replace(/_w200_h200/ig, '').match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0].replace( /%20\+/g, "_" ), function(){
            element['img'] = imgSrc.replace(/_w200_h200/ig, '').match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0].replace( /%20\+/g, "_" );
        });
        await page.goto(href);
        await page.waitForSelector('span.iconedText__root--3jNtn span b');
        await page.evaluate(() => {
            [...document.querySelectorAll('span.iconedText__root--3jNtn span b')].find(element => element.textContent === 'Всі характеристики').click();
        });
        await page.evaluate(() => {
            [...document.querySelectorAll('span.iconedText__root--3jNtn span b')].find(element => element.textContent === 'Весь опис').click();
        });
        let property = await page.$eval('div.productExtra__root--3cHd8 div.productExtra__section--37buY ul.productAttributes__list--3D4yd', el => el.innerHTML);
        let description = await page.$eval('div.customContent__root--1kf9S div', el => el.innerHTML);
        let data = {
            'cat': 'Дверная фурнитура/Кедр/' +element.category.replace( /[“”]/g, "" ),
            'url_cat': 'door-furniture/kedr/'+lib.rusToLatin(element.category.replace( /[“”]/g, "" )),
            'goods': element.name.replace( /[“”]/g, "" ),
            'variant': null,
            'description': "<ul>"+property+"</ul><p>"+description+"</p>",
            'price': element.price,
            'url': null,
            'image': element.img+"[:param:][alt="+element.name.replace( /[“”]/g, "" )+"][title="+element.name.replace( /[“”]/g, "" )+"]",
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
        csvWriter.writeRecords([data]).then(()=> console.log('The CSV file was written successfully'));
        await browser.close();
    } catch (e) {
        console.log(e);
    }
}

let newItem = items.slice(0,10);
lib.asyncForEach(newItem, asyncGrubber);
