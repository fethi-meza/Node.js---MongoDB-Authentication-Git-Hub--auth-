const { validationResult } = require("express-validator")
const { StatusCodes } = require("http-status-codes")


module.exports = (req, res, next) => {
 const errors = validationResult(req)
 if (validationResult(req).isEmpty()) {
  return next()
 }
 return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() })
}