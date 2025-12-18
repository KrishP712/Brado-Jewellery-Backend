const mongoose = require("mongoose");

const CarouselSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true
    },
    desktop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media"
    },
    mobile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Media"
    }
}, { timestamps: true })

const Carousel = mongoose.model("Carousel", CarouselSchema);

module.exports = Carousel;
