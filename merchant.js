const puppeteer = require("puppeteer");
const createCsvWriter  = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: 'data.csv',
    header: [
        {id: 'cat', title: 'id'},
        {id: 'url_cat', title: 'title'},
        {id: 'goods', title: 'description'},
        {id: 'variant', title: 'price'},
        {id: 'description', title: 'brand'},
        {id: 'price', title: 'condition'},
        {id: 'url', title: 'link'},
        {id: 'image', title: 'availability'},
        {id: 'article', title: 'image_link'},
        {id: 'end', title: '\n'}
    ],
    fieldDelimiter: ';',
    encoding: 'utf8',
    alwaysQuote: true,
    flags: 'w',
    mode: '0744'
});
const lib = require("./lib");
let items = lib.getPriceItem();
(async function main(){     
        let data = lib.getScrabData('https://www.ecostyle.pp.ua/door-furniture/mbm/ruchki-na-rozetke');
        data.then(function(value) {
            let pages = +value.pages;
            let links = value.hrefs;

            for (let value of lib.generateSequence('https://www.ecostyle.pp.ua/door-furniture/mbm/ruchki-na-rozetke', pages)) {
              value.then(function(value) {
                  return value[0] += value[0];
                  }).then(function(value) {
                  console.log(value);
                  }).catch(function(e) {
                    console.log(e);
                });
            }

        }).catch(function(e) {
          console.log(e);
        });
		/* lib.asyncForEach(items,
		async function (element) {
			try {
				const browser = await puppeteer.launch();
				const page = await browser.newPage();
				await page.goto('https://www.ecostyle.pp.ua/door-furniture/mbm/ruchki-na-rozetke');
				await page.waitForSelector('div.product-wrapper div.product-name a');
				let href = await page.$$eval('div.product-wrapper div.product-name a', href => { return href.map(item => item.href) });
                     
				lib.download(imgSrc.replace(/_w200_h200/ig, ''), "img/"+imgSrc.replace(/_w200_h200/ig, '').match(/[a-zA-z%\-0-9]+.{1}[jpgJPGpngPNGgifGIF]{3}/)[0].replace( /%20\+/g, "_" ),
					function(element){
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
						data = {};
					}
				);
			} catch(e) {
				console.log('Our errors', e);
			}
		}); */
})();
