const jwt = require("jsonwebtoken")

module.exports =  (payload) => {
 return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME })
}