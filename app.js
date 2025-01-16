// config
require("./config")

// imports
const express = require("express")
const app = express()
const dbConnect = require("./config/dbConnection")

// routes
const authRouter = require("./routes/auth")

// middleware
const errorHandlerMiddleware = require("./middleware/error-handler")
const notFoundMiddleware = require("./middleware/not-found")
const authenticationMiddleware = require("./middleware/auth")
const validatorsMiddleware = require("./middleware/validators")

const swaggerUI = require("swagger-ui-express")
const swaggeerDocument = require("./swagger.json")
const CSS_URL = "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.6.2/swagger-ui.min.css"
const { checkPermisson } = require("./utils")

// start services
require("./utils/services")(app, express)

// start routing
app.get("/", (req, res) => {
 res.send("<h1>Jobs API</h1> <a href='/api-docs'>Documentation</a>")
})
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggeerDocument))
app.use("/api/v1/auth", authRouter)
app.use("/api/v1/protected", authenticationMiddleware, (req, res) => {
 res.status(200).json({ user: req.user })
})
app.use("/api/v1/dashboard", [authenticationMiddleware, checkPermisson('admin')], (req, res) => {
 res.status(200).json({ user: req.user })
})
app.use("/api/v1/", (req, res) => {
 res.status(200).write(`<a href='/api/v1/auth/github'>github login</a>`)
 res.end()
})
// global Middleware
app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

// start
const start = async () => {
 try {
  await dbConnect()
  app.listen(process.env.PORT, () => console.log(`running on ${JSON.parse(process.env.NODE_DEV) ? process.env.BASE_URL_DEV : process.env.BASE_URL}`))
 } catch (err) {
  console.log({ err })
 }
}

start()