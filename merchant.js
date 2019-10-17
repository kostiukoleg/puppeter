const puppeteer = require("puppeteer");
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
        {id: 'end', title: '\n'}
    ],
    fieldDelimiter: ';',
    encoding: 'utf8',
    alwaysQuote: true,
    flags: 'w',
    mode: '0744'
});
const lib = require("./lib");
//console.log(lib.getPriceItem());
(async function main(){
        let data = await lib.getScrabLinks('https://www.ecostyle.pp.ua/door-furniture/mbm/ruchki-na-rozetke');
        let pages = +data.pages;
        let links = data.hrefs;
        let newLinks = [];

        for (let i=2; i<=pages; i++) {
            let newData = await lib.getScrabLinks('https://www.ecostyle.pp.ua/door-furniture/mbm/ruchki-na-rozetke', i);
            if (i === 2) {
                newLinks = links.concat(newData.hrefs);
            } else {
                newLinks = newLinks.concat(newData.hrefs);
            }
        }

        for (let i=0; i<5; i++) {//newLinks.length
            let productData = await lib.getScrabProducts('https://www.ecostyle.pp.ua/door-furniture/mbm/ruchki-na-rozetke', i);
            let writeData = {
                'id': productData.id,
                'title': productData.title,
                'description': productData.description,
                'price': productData.price,
                'brand': productData.brand,
                'condition': productData.condition,
                'link': productData.link,
                'availability': productData.availability,
                'image_link': productData.image_link,
                'end': '\n'
            };
            csvWriter.writeRecords([writeData]).then(()=> console.log('The CSV file was written successfully'));
            writeData = {};
        }
})();
