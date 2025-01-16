const path = require("path")
// imports
const cookieParser = require("cookie-parser")
const session = require("express-session")
const passport = require("passport")

// security
const rateLimiter = require("express-rate-limit")
const helmet = require("helmet")
const cors = require("cors")
const xss = require("xss-clean")

// start
function init(app, express) {
 app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
 }))

 app.set('trust proxy', 1);
 app.use(rateLimiter({
  windowsMs: 60 * 1000 * 15,
  max: 100
 }))
 app.use(helmet())
 app.use(cors())
 app.use(xss())

 app.use(passport.initialize())
 app.use(passport.session())
 app.use(express.json());
 app.use(cookieParser(process.env.JWT_SECRET));

 // app.use(express.static(path.join(__dirname, 'assets')));
 app.use("/api-docs", express.static("./assets"));

}

module.exports = init