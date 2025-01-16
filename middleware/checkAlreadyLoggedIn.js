const { StatusCodes } = require("http-status-codes")
const verifyToken = require("../utils/verifyToken")

module.exports = async (req, res, next) => {
 // check user is already logged in 
 try {
  const { token } = req.signedCookies
  const isTokenValid = verifyToken(token)
  if (isTokenValid) {
   return res.status(StatusCodes.BAD_REQUEST).json({ msg: "user already loggedIn!!" })
  }
  next()
 } catch (err) {
  next()
 }
}