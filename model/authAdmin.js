const mongoose = require("mongoose")

const LoginSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        default: ""
    },

}, {timestamps: true , versionKey: false})

const Login = mongoose.model("Login", LoginSchema)

module.exports = Login