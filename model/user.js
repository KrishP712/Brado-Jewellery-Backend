const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null
    },
    password: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        default: null
    },
    address: {
        type: String,
        default: null
    },
    otp: {
        type: Number,
        default: null
    },
    otpExpired: {
        type: Date,
        default: null
    },
    location: {
        type: String,
        default: null
    },
    birthdate: {
        type: Date,
        default: null
    },
    
}, { timestamps: true })

const User = mongoose.model("User", UserSchema)

module.exports = User