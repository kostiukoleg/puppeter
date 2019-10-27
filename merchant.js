const puppeteer = require("puppeteer");
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://127.0.0.1:27017";
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
       /* let data = await lib.getScrabLinks('https://www.ecostyle.pp.ua/door-furniture/mbm/ruchki-na-rozetke');
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
        MongoClient.connect(url, {useUnifiedTopology: true}, function(err, db) {
            if (err) throw err;
            let dbo = db.db("mvmlinks");
            let myobj = Object.assign({}, newLinks);
            dbo.collection("customers").insertOne(myobj, function(err, res) {
                if (err) throw err;
                console.log("Document inserted");
                db.close();
            });
        });*/
        MongoClient.connect(url, {useUnifiedTopology: true}, async function(err, db) {
            let dbo = db.db("mvmlinks");
            dbo.collection("customers").findOne({}, async function(err, docs) {
                for (let i = 0; i < Object.keys(docs).length-1; i++) {//Object.keys(docs).length-1
                    let productData = await lib.getScrabProducts(docs[i]);
                    let imgProduct = await lib.getScrabProductIMG(`https://www.zamochniki.com.ua/search-engine.htm?slovo=${encodeURI(productData.title)}&search_submit=&hledatjak=2`);
                    let color = productData.title.match(/\s{1}\S+/gi);
                    let writeData = {
                        'id': productData.id,
                        'title': 'Ручка МВМ ' + productData.title + lib.getMVMcolor(color[0]),
                        'description': productData.description,
                        'price': productData.price,
                        'brand': productData.brand,
                        'condition': productData.condition,
                        'link': productData.link,
                        'availability': productData.availability,
                        'image_link': imgProduct,
                        'end': '\n'
                    };
                    csvWriter.writeRecords([writeData]).then(() => console.log('The CSV file '+i+' was written successfully'));
                    writeData = {};
                }
            });
            db.close();
        });
})();
