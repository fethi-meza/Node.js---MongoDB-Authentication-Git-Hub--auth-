const passport = require("passport")
const GithubStrategy = require("passport-github2").Strategy
const User = require("../models/User")

passport.use(new GithubStrategy({
 clientID: process.env.GITHUB_CLIENT_ID,
 clientSecret: process.env.GITHUB_CLIENT_SECRET,
 callbackURL: JSON.parse(process.env.NODE_DEV) ? process.env.GITHUB_CALLBACK_URL_DEV : process.env.GITHUB_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
 try {
  let user = await User.findOne({ githubId: profile.id })
  if (!user) {
   user = await User.create({
    githubId: profile.id,
    username: profile.username,
    profileUrl: profile.profileUrl,
    email: profile.emails?.[0]?.value || null,
    isEmailVerified: true
   })
  }
  return done(null, user)

 } catch (err) {
  return done(err)
 }
}))


passport.serializeUser((user, done) => {
 done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
 const user = await User.findById(id);
 done(null, user)
})
