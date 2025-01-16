const { UnAuthenticatedError } = require("../errors");
const verifyToken = require("../utils/verifyToken");

module.exports = async (req, res, next) => {

 try {
  const { token } = req.signedCookies
  // check if token is valid and exist
  const payload = verifyToken(token)
  // set user to response
  req.user = { userID: payload.userID, username: payload.username, role: payload.role }
  return next()
 } catch (err) {
  throw new UnAuthenticatedError("Authentication Invalid")
 }

}
