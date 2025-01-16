module.exports = (res, token) => res.cookie("token", token, {
 maxAge: 60 * 10 * 1000,
 secure: true,
 httpOnly: true,
 signed: true
})