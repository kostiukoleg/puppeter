const MongoClient = require('mongodb').MongoClient;
const mongo = "mongodb://127.0.0.1:27017";
const lib = require("./lib");
lib.clearDir('img');
lib.clearDir(0, 'data.csv');
(async function main(){
    let url = process.argv[2];
    let links = await lib.getNewStyleLinks(url).catch((e)=>{
                console.log(e);
            });
    await MongoClient.connect(mongo, {useUnifiedTopology: true}, function(err, db) {
        if (err) throw err;
        let dbo = db.db("newStylelinks");
        let myobj = Object.assign({}, links);
        dbo.collection("links").insertOne(myobj, function(err) {
            if (err) throw err;
            console.log("Document inserted");
            db.close();
        });
    });
})();
