const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true
    },
    media: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
}, { timestamps: true, versionKey: false })

Media = mongoose.model("Media", mediaSchema);
module.exports = Media

