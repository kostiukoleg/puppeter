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
const asyncGrubber = async function (element, index) {
    try {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on("request", request => {
            request.continue();
        });
        await page.emulate(devices['iPad Pro']);
        await page.goto('https://stroimasterrost.com.ua/search/?search=' + encodeURI(element.name)).catch((e)=>{
                console.log(e.message);
            });
        await page.waitForSelector('div#boxfeatured.product-grid div.item.block div.half_2 div.name a', {visible: true, timeout: 5000 }).then(async function(){
            let href = await page.$eval('div#boxfeatured.product-grid div.item.block div.half_2 div.name a', el => el.href).catch((e)=>{  
                console.log(e.message);
            });
            return href;
        }).then(async function(href){
                    await page.goto(href).catch((e)=>{
                            console.log(e.message);
                        });
                    let img = await page.waitForSelector('div#content div.cart_wrapp div.product-info div.left div.image a.colorbox.cboxElement img', {visible: true, timeout: 5000 }).then(async function(){
                        let imgSrc = await page.$eval('div#content div.cart_wrapp div.product-info div.left div.image a.colorbox.cboxElement img', el => el.src).catch((e)=>{
                            console.log(e.message);
                        });
                        await lib.download(imgSrc.replace(/-300x300/gm, '-800x800'), "img/"+index+"_"+imgSrc.replace(/-300x300/gm, '').match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0], function(){
                            //console.log(`Image ${imgSrc.replace(/300x300/gm, '').match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0]} downloaded.`);
                        }).catch((e)=>{
                            console.log(e.message);
                        });
                        let imgIn = index+"_"+imgSrc.replace(/-300x300/gm, '').match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0];
                        return imgIn;
                    }).catch((e)=>{
                            console.log(e.message);
                        });
                    let price = await page.waitForSelector('span#formated_price', {visible: true, timeout: 5000 }).then(async function(){
                        let price = await page.$eval('span#formated_price', el => el.innerText).catch((e)=>{
                            console.log(e.message);
                        });
                        price = +price.replace(/\sгрн/gm, '');
                        return price;
                    }).catch((e)=>{
                            console.log(e.message);
                        });
                    let description = await page.waitForSelector('div#tab-description', {visible: true, timeout: 5000 }).then(async function(){
                        let description = await page.$eval('div#tab-description', el => el.innerHTML).catch((e)=>{
                            console.log(e.message);
                        });
                        return description;
                    }).catch((e)=>{
                            console.log(e.message);
                        });
                    let color = element.name.match(/\s(AB|CR|GP|NI|CP|G|NP|SN|Graffit|PB|MACC|белый|серый|коричневый)/gi);
                    if (Array.isArray(color)) {
                        switch (color[0]) {
                        case ' AB':
                            color = ' стара бронза';
                            break;
                        case ' CR':
                            color = ' хром';
                            break;
                        case ' GP':
                            color = ' золото';
                            break;
                        case ' NI':
                            color = ' никель';
                            break;
                        case ' CP':
                            color = ' полированний хром';
                            break;
                        case ' G':
                            color = ' золото';
                            break;
                        case ' NP':
                            color = ' никель';
                            break;
                        case ' SN':
                            color = ' матовий никель';
                            break;
                        case ' Graffit':
                            color = ' графит';
                            break;
                        case ' PB':
                            color = ' полированая латунь';
                            break;
                        case ' MACC':
                            color = ' матовая бронза';
                            break;
                        case ' белый':
                            color = ' белый';
                            break;
                        case ' серый':
                            color = ' серый';
                            break;
                        case ' коричневый':
                            color = ' коричневый';
                            break;
                        default:
                            color = '';
                    }
                    }
                    let data = {
                        'cat': 'Дверная фурнитура/Кедр/' +element.category.replace( /[“”]/g, "" ),
                        'url_cat': 'door-furniture/kedr/'+lib.rusToLatin(element.category.replace( /[“”]/g, "" )),
                        'goods': element.name.replace( /[“”]/g, "" ),
                        'variant': null,
                        'description': description.replace( /&nbsp;/g, " " ).replace( /\r?\n|\r/g, "" ).replace( /\>\s+/gm, ">" ).replace( /\s+\</gm, "<" ),
                        'price': element.price,
                        'url': null,
                        'image': (img) ? img+"[:param:][alt="+element.name.replace( /[“”]/g, "" )+"][title="+element.name.replace( /[“”]/g, "" )+"]" : null,
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
                        'property': (color !== '') ? 'Тип='+element.category.replace( /[“”]/g, "" )+'&Страна-производитель товара=Фабричный Китай&Цвет покрытия='+color+'&Производитель=[type=assortmentCheckBox value=Кедр product_margin=Милано|Новый Стиль|Стеко|Арма|Апекс|Века|Омис|Кроноспан|Tower Floor|Кедр|Брама|НДС Двери|Marley|Agata Stal|Tikkurila]' : 'Тип='+element.category.replace( /[“”]/g, "" )+'&Страна-производитель товара=Фабричный Китай&Производитель=[type=assortmentCheckBox value=Кедр product_margin=Милано|Новый Стиль|Стеко|Арма|Апекс|Века|Омис|Кроноспан|Tower Floor|Кедр|Брама|НДС Двери|Marley|Agata Stal|Tikkurila]',
                        'end': '\n'
                    };
                    csvWriter.writeRecords([data]).catch((e)=>{//.then(()=> console.log('The CSV file was written successfully'))
                            console.log(e.message);
                        });
        }).catch((e)=>{
                console.log(e.message);
            });
        await browser.close();
    } catch (e) {
        console.log(e.message);
    }
}

let newItem = items.slice(50,100);
lib.asyncForEach(newItem, asyncGrubber);
