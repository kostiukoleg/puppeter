const puppeteer = require("puppeteer");
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

async function processArray(array) {
  // делаем "map" массива в промисы
  const promises = array.map(asyncGrubber);
  // ждем когда всё промисы будут выполнены
  await Promise.all(promises);
}

function download(uri, filename, callback){
  request.head(uri, function(err, res, body){
    //console.log('content-type:', res.headers['content-type']);
    //console.log('content-length:', res.headers['content-length']);
    return request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

async function asyncGrubber(element) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://prom.ua/ua/search?search_term=' + encodeURI(element.name));
    await page.waitForSelector('div.x-gallery-tile__relative a.x-gallery-tile__image-holder.x-image-holder img');
    imgSrc = await page.$eval('div.x-gallery-tile__relative a.x-gallery-tile__image-holder.x-image-holder img', el => el.src);
    await download(imgSrc.replace(/_w200_h200/ig, ''), "img/"+imgSrc.replace(/_w200_h200/ig, '').match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0].replace( /%20\+/g, "_" ), function(){
            element['img'] = imgSrc.replace(/_w200_h200/ig, '').match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0].replace( /%20\+/g, "_" );
            let data = {
		              'cat': 'Дверная фурнитура/Кедр/' +element.category.replace( /[“”]/g, "" ),
		              'url_cat': 'door-furniture/kedr/'+lib.rusToLatin(element.category.replace( /[“”]/g, "" )),
		              'goods': element.name.replace( /[“”]/g, "" ),
		              'variant': null,
		              'description': null,
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
    }); 
}

let newItem = items.slice(0,50);
processArray(newItem);