const otpGenrator = require("otp-generator")
module.exports.OTP = () => otpGenrator.generate(6, {
 digits: true, lowerCaseAlphabets: false,
 specialChars: false,
 upperCaseAlphabets: false
})


module.exports.expiresAt = (timeout) => new Date(Date.now() + Number(timeout))