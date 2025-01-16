const { UnAuthorizeError } = require("../errors");

module.exports = (...roles) => {
 return (req, res, next) => {
  if (!roles.includes(req.user.role)) {
   throw new UnAuthorizeError("UnAuthorize to access this route")
  }
  next()
 }
}