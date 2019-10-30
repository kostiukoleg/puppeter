const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://127.0.0.1:27017";
const lib = require("./lib");
lib.clearDir(0, 'data.csv');
MongoClient.connect(url, {useUnifiedTopology: true}, async function(err, db) {
    let dbo = db.db("mvmlinks");
    let data = await dbo.collection("customers").find().toArray();
    let arr = Object.values(data[0]);
    lib.asyncForEach(arr, lib.getScrabProducts).then(() => console.log('Finish'));
    db.close();
});
