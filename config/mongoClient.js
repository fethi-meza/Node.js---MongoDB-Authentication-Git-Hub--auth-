const { MongoClient } = require("mongodb")
module.exports = new MongoClient(JSON.parse(process.env.NODE_DEV) ? process.env.MONGO_URL : process.env.MONGO_URL_ONLINE)