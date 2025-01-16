const { check } = require("express-validator")
const validatorMiddleware = require("../../middleware/validators")
const User = require("../../models/User")
const { BadRequestError } = require("../../errors")



// username | email | password
exports.register = [
 check("username").notEmpty().withMessage("username required").isLength({ min: 3 }).withMessage("Too short user name"), check("email").notEmpty().withMessage("Email required").isEmail().withMessage("Invalid email addrss").custom(async (emailValue) => {
  const user = await User.findOne({ email: emailValue, isEmailVerified: true })
  if (user) {
   throw new BadRequestError("Email already exist and verified")
  }
 }), check('password')
  .notEmpty()
  .withMessage('Password required')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters'), validatorMiddleware
]


exports.login= [
 check('email')
  .notEmpty()
  .withMessage('Email required')
  .isEmail()
  .withMessage('Invalid email address'),

 check('password')
  .notEmpty()
  .withMessage('Password required')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters'),

 validatorMiddleware,
];