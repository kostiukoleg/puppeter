const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://127.0.0.1:27017";
const lib = require("./lib");
lib.clearDir('img');
lib.clearDir(0, 'data.csv');
(async function main(){
    let data = await lib.getScrabLinks('https://www.ecostyle.pp.ua/door-furniture/mbm/ruchki-na-rozetke').catch((e)=>{
                console.log(e);
            });
    let pages = +data.pages;
    let links = data.hrefs;
    let newLinks = [];

    for (let i=2; i<=pages; i++) {
        let newData = await lib.getScrabLinks('https://www.ecostyle.pp.ua/door-furniture/mbm/ruchki-na-rozetke', i).catch((e)=>{
                console.log(e);
            });
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
    });
});
MongoClient.connect(url, {useUnifiedTopology: true}, async function(err, db) {
    let dbo = db.db("mvmlinks");
    let data = await dbo.collection("customers").find().toArray();
    let arr = Object.values(data[0]);
    lib.asyncForEach(arr, lib.getScrabProducts).then(() => console.log('Finish'));
    db.close();
});
