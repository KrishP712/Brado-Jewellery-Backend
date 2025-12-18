const mongoose = require("mongoose");

const TestimonialsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    feature: {
        type: Boolean,
        default: true,
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    testimonialText: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    }
},{timestamps:true})

const Testimonial = mongoose.model("Testimonials", TestimonialsSchema)

module.exports = Testimonial