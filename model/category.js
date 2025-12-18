const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
    },
    bannerImage: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Media",
        },
    ],
    sliderImage: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Media",
        },
    ],
    icons: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media",
    },
    categorySlug: {
        type: String,
        required: true,
    },
}, { versionKey: false, timestamps: true });

const Categories = mongoose.model("Categories", CategorySchema);

module.exports = Categories;