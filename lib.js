const fs = require('fs');
const request = require('request');
const xlsx = require('xlsx');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
let wb = xlsx.readFile('./price/KedrAndrey.xlsx');
const download = function (uri, filename, callback){
  request.head(uri, function(err, res, body){
    //console.log('content-type:', res.headers['content-type']);
    //console.log('content-length:', res.headers['content-length']);
    return request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
}

const rusToLatin = function ( str ) {
    
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
    
    for ( var i = 0; i < str.length; ++i ) {
       n_str.push(
              ru[ str[i] ]
           || ru[ str[i].toLowerCase() ] == undefined && str[i]
           || ru[ str[i].toLowerCase() ].replace(/^(.)/, function ( match ) { return match.toLowerCase() })
       );
    }
    
    return n_str.join('');
}

const getPriceItem = function () {
  let dollar = 24.27+(24.27*0.3),
  item = {},
  arr = [];
  for (variable in wb.Sheets['Sheet1']) {
    let num = variable.slice(1,variable.length);
    if (variable.slice(0,1) == "C") {
      if(wb.Sheets['Sheet1'][variable]['v'] === 0) {
        variable = variable.replace(/C/gi,"B");
        item['category'] = wb.Sheets['Sheet1'][variable]['v'];
      } else {
        v = variable.replace(/C/gi,"B");
        item['name'] = wb.Sheets['Sheet1'][v]['v'];
        item['price'] =  (wb.Sheets['Sheet1'][variable]['v'] * dollar).toFixed(2);
        arr.push( { 'category' : item['category'], 'name' : item['name'], 'price' : item['price'] } );
      }
    } 
  }
  return arr;
}

const getScrabData = async function(link, index = 1) {
    const browser = await puppeteer.launch({ignoreHTTPSErrors: true});
    const page = await browser.newPage();
    await page.setRequestInterception(true);
	page.on("request", request => {
   		request.continue();	
	});
    await page.emulate(devices['iPhone 6']);
    if (index == 1) {
        await page.goto(link, { timeout: 0, waitUntil: "networkidle0" });
    } else {
        await page.goto(link+'?page='+index, { timeout: 0, waitUntil: "networkidle0" });
    }
    await page.waitForSelector('div.product-wrapper div.product-name a');
    await page.screenshot({path: 'full.png', fullPage: true});
    let allPages = await page.$eval('div.mg-pager div.allPages span', text => { return text.innerText });
    let href = await page.$$eval('div.product-wrapper div.product-name a', href => { return href.map(item => item.href) });
    await browser.close();
    return {pages: allPages, hrefs: href};
}

const generateSequence = function* (link, end) {
  for (let i = 1; i <= end; i++) {
    let subData = this.getScrabData(link, i);
    yield subData.then(function(value) {
                    if (Array.isArray(value.hrefs)) {
                        return value.hrefs;
                    }
                }).catch(function(e) {
                    console.log(e);
                });
  }
}

const asyncForEach = async function (array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

module.exports.download = download;
module.exports.rusToLatin = rusToLatin;
module.exports.getPriceItem = getPriceItem;
module.exports.asyncForEach = asyncForEach;
module.exports.getScrabData = getScrabData;
module.exports.generateSequence = generateSequence;