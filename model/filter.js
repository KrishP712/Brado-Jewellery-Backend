const mongoose = require("mongoose");


const filterSchema = new mongoose.Schema({
    filterName: {
        type: String,
        required: true,
    },
    filterSlug: {
        type: String,
        required: true,
    }
}, { timestamps: true, versionKey: false })

const Filter = mongoose.model("Filter", filterSchema)

module.exports = Filter
