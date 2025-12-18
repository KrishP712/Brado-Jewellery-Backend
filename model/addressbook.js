const mongoose = require("mongoose")

const addressbookSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    address: [
        {
            contactno: {
                type: String,
                required: true
            },
            name: {
                type: String,
                required: true
            },
            address1: {
                type: String,
                required: true
            },
            address2: {
                type: String,
                required: true
            },
            landmark: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            pincode: {
                type: Number,
                require: true
            },
            country: {
                type: String,
                require: true
            },
            isDefault: {
                type: Boolean,
                default: false
            }
        }
    ]
}, { timestamps: true, versionKey: false })

Addressbook = mongoose.model("Addressbook", addressbookSchema)
module.exports = Addressbook