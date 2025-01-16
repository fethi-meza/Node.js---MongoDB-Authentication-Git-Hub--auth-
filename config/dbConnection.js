const mongoose = require("mongoose")

module.exports = async (URL = JSON.parse(process.env.NODE_DEV) ? process.env.MONGO_URL : process.env.MONGO_URL_ONLINE) => {
 await mongoose.connect(URL).then((value) => {
  console.log("connected");
 }).catch((err) => {
  console.log({ err })
 })
}