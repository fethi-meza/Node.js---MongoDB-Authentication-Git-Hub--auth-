const jwt = require("jsonwebtoken")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const { BadRequestError } = require("../errors")

const UserSchema = new mongoose.Schema({
 githubId: {
  type: String,
  defualt: null
 },
 profileUrl: String,
 username: {
  type: String,
  required: [true, 'Please provide name'],
  minLength: 3,
  maxLength: 50,
  trim: true,
 },
 email: {
  type: String,
  required: function () {
   return !this.githubId
  },
  match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'invalid email'],
  unique: true,
  immutable: true, // Prevents updates to this field
  trim: true,
  lowercase: true,
 },
 password: {
  type: String,
  required: function () {
   return !this.githubId
  },
  minLength: 3,
  maxLength: 250,
 trim: true,
 },
 role: {
  type: String,
  enum: ["user", "admin"],
  default: "user",
  immutable: true
 },
 isEmailVerified: {
  type: Boolean,
  default: false,
 },
 verifyEmailOtp: {
  code: {
   type: String,
   defualt: null
  },
  expiresAt: {
   type: Date,
   default: null
  }
 },
 resetPasswordToken: {
  code: {
   type: String,
   default: null
  },
  expiresAt: {
   type: Date,
   default: null
  }
 },

 updatedAt: {
  type: Date,
  default: Date.now
 }
}, { timestamps: true })

UserSchema.pre('save', async function () {
 this.updatedAt = Date.now()
 if (this.isModified('password')) {
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
 }
})

UserSchema.pre("findOneAndUpdate", function (next) {
 const update = this.getUpdate()
 if (update.email) {
  throw new BadRequestError('email cannot be updated')
 }
 next()
})

UserSchema.methods.createToken = function () {
 return jwt.sign({ userID: this._id, username: this.username, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_LIFETIME })
}

UserSchema.methods.comparePassword = async function (credential) {
 return await bcrypt.compare(credential, this.password)
}

module.exports = mongoose.model("User", UserSchema)