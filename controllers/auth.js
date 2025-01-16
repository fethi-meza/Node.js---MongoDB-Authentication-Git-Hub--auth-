const crypto = require("crypto")
const { StatusCodes } = require("http-status-codes")
const User = require("../models/User")

const { BadRequestError, CustomAPIError, NotFoundError} = require("../errors")
const { sendEmail, createHash, attchCookieToResponse, createOTP, userData } = require("../utils")

const register = async (req, res) => {
 // check if user exist if not create user with hashedOTp,with expireDate
 const { email } = req.body
 let user = await User.findOne({ email })

 // if otp has sent and user tried to get another one before it expires
 if (user && user.verifyEmailOtp.code && user.verifyEmailOtp.expiresAt > new Date()) {
  return res.status(StatusCodes.ACCEPTED).json({ message: "email verification otp sent check your email" })
 }
 // first login is ADMIN
 const role = (await User.countDocuments({})) === 0 ? 'admin' : 'user' //first account is admin only

 // can create new user and ready to sent otp 
 const otp = createOTP.OTP()
 const otpExpire = createOTP.expiresAt(process.env.EMAIL_VERIFICATION_OTP_EXPIRESAT)
 // if user is new create him
 if (!user) {
  user = await User.create({ ...req.body, role, verifyEmailOtp: { code: otp, expiresAt: otpExpire } })
 } else {
  // already exist resend a new otp and relife otp expire date
  user.verifyEmailOtp.code = otp;
  user.verifyEmailOtp.expiresAt = otpExpire
 }
 // refreshToken
 // can send otp && i has checked that user cannot sent before otp expires
 await sendEmail({ email, OTP: otp, isEmail: true }).then((value) => {
 }).catch((err) => {
  // ××× email doesnt send ?? so clear otp code and otp expires
  user.verifyEmailOtp.code = null;
  user.verifyEmailOtp.expiresAt = null
  throw new BadRequestError("something happend while sending email try again later")
 }).finally(async () => {

  await user.save()
 })

 // all good and sent otp to email 
 res.status(StatusCodes.CREATED).json({ msg: "check your mail to verify email", email })
}

// @require email and otp
const verifyEmail = async (req, res) => {
 const { email, otp } = req.body;

// check if email and otp exist
 if (!email || !otp) {
  return res.status(StatusCodes.BAD_REQUEST).json({ msg: "invalid credentials required credentials email , otp" })
 }

 // check if user exist to verify him 
 const user = await User.findOne({ email })

 if (!user) {
  return res.status(StatusCodes.NOT_FOUND).json({ msg: "email doesnt exist!" })
 }

 // and cannot verify a verified email!!
 if (user.isEmailVerified) {
  return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Email is already verified" })
 }

 // check if otp has been sent
 if (!user.verifyEmailOtp.code || !user.verifyEmailOtp.expiresAt) {
  return res.status(StatusCodes.BAD_REQUEST).json({ msg: "no token has been sent yet!" })
 }

 // and now check if otp still in time (not_expired)
 if (new Date() > new Date(user.verifyEmailOtp.expiresAt)) {
  return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "expired otp request a new one" })
 }

 // is that the right OTP ?
 if (user.verifyEmailOtp.code.toString() !== otp.toString()) {
  return res.status(StatusCodes.BAD_REQUEST).json({ msg: "Invalid OTP" });
 }

 // all clear and can verify email
 user.isEmailVerified = true
 // clear values we dont need them again
 user.verifyEmailOtp = { code: null, expiresAt: null };

 await user.save()
 const token = user.createToken()
 // user has been loggedIn O_O
 attchCookieToResponse(res, token)
 res.status(StatusCodes.OK).json({ msg: "Email has been verified", user })

}

// @require email and password and check if email is verified
const login = async (req, res) => {
 const { password, email } = req.body
 // make sure credentials exist
 if (!email || !password) {
  throw new CustomAPIError('provide email and password', 400)
 }

 // make sure email is exist
 const user = await User.findOne({ email })
 if (!user) {
  throw new CustomAPIError('email doesnt exist', 404)
 }

 // check if email verified
 if (!user.isEmailVerified) {
  // he must redirect him to verify email page
  // return res.redirect("/api/v1/auth/register") // to sent a new otp or make him check
  return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Email is not verified please check your email" })
 }

 const isPasswordMatch = await user.comparePassword(password)
 if (!isPasswordMatch) {
  throw new CustomAPIError('Invalid Credentials', 403)
 }
 const token = user.createToken()
 attchCookieToResponse(res, token)
 // yes its match
 res.status(StatusCodes.OK).json({ user: userData(user) })
}

const updateUser = async (req, res) => {
 // update only name
 const { name, ...other } = req.body
 const newUpdates = { name }
 // must be authenticated
 const userID = req.user.userID

 const user = await User.findByIdAndUpdate(userID, newUpdates, {
  new: true,
  runValidators: true
 })

 if (!user) {
  throw new NotFoundError('User is not found!!')
 }

 res.status(StatusCodes.OK).json({ user: userData(user) })

}

// sendResetPasswordEmail => send otp to email
const sendResetPasswordEmail = async (req, res) => {
 // email && email is verified
 const { email } = req.body

 if (!email) {
  throw new BadRequestError("email is required")
 }

 const user = await User.findOne({ email })

 if (!user) {
  throw new NotFoundError("email doesnt exist!!")
 }

 // if there is a otp before dont do anything  
 if (user.resetPasswordToken.code && user.resetPasswordToken.expiresAt > new Date()) {
  return res.status(200).json({ msg: "password reset token is already sent pls check your email" })
 }
 const passwordResetToken = crypto.randomBytes(70).toString('hex')

 // user exist then send otp to verify that he can

 try {
  user.resetPasswordToken.code = createHash(passwordResetToken);
  user.resetPasswordToken.expiresAt = new Date(Date.now() + Number(process.env.PASSWORD_RESET_TOKEN_EXPIRESAT))
  await sendEmail({ email, token: passwordResetToken, isEmail: false, message: "Reset Password" })
 } catch (err) {
  user.resetPasswordToken.code = null;
  user.resetPasswordToken.expiresAt = null
  throw new BadRequestError("something happen while sending otp please try again!!")
 }
 await user.save()
 res.status(200).json({ msg: "please check your email verification code has been sent" })
}

// resetPassword => reset password 
const resetPassword = async (req, res) => {

 const { password: newPassword, email, token: resetPassordToken } = req.body

 // check if email and resetPassordToken exist
 if (!email || !resetPassordToken) {
  throw new BadRequestError("please provide email and password reset token")
 }

 const user = await User.findOne({ email })

 if (!user) {
  throw new NotFoundError("email doesnt exist!")
 }

 // check if user has a resetPasswordToken and it is still in time
 if (new Date(user.resetPasswordToken.expiresAt) < new Date()) {
  throw new BadRequestError("request a new password reset")
 };
 
 // check if the token is valid
 if (user.resetPasswordToken.code.toString() !== createHash(resetPassordToken).toString()) {
  throw new BadRequestError("invalid token!!")
 }
 // valid otp now he can reset password
 if (!newPassword) {
  throw new BadRequestError("new password required")
 }

  // reset the password
 user.password = newPassword;
 // clear the resetPasswordToken

 user.resetPasswordToken = { code: null, expiresAt: null }
 await user.save()
 // user has been loggedIn O_O
 const accesstoken = user.createToken()
 // user has been loggedIn O_O
 attchCookieToResponse(res, accesstoken)

 return res.status(200).json({ msg: "password has been changed", success: true })
}




// showCurrentUser => show current user
const showCurrentUser = async (req, res) => {
 const { userID } = req.user

 const user = await User.findById(userID)

 if (!user) {
  throw new NotFoundError("user not found!!")
 }


 // exist => return user
 res.status(StatusCodes.OK).json({ user: userData(user) })
}
  // logout => clear the cookie
const logout = async (req, res) => {
  // clear the cookie
  res.clearCookie('token', {
  httpOnly: true,
  secure: true,
  sameSite: 'None'
 })
 res.status(200).json({ msg: "log out successfully" })
}


const githubAuthCallback = async (req, res) => {
passport.authenticate("github", { failureRedirect: "/" })(req, res, async () => {
  const { _id, username, role } = req.user
  const payload = { userID: _id, username, role }
  // User is logged in, so we can attach the JWT token to the response
  attchCookieToResponse(res, createJWT(payload))
  // callBack to get user data {id,username,role:user}
  res.redirect("/api/v1/auth/me")
})
}

module.exports = {
 register, login, showCurrentUser,
 logout, updateUser, verifyEmail, sendResetPasswordEmail, resetPassword
 ,githubAuthCallback
}