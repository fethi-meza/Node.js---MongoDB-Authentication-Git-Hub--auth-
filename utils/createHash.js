const crypto = require("crypto")

module.exports = (string) => crypto.createHash("md5").update(string).digest("hex")