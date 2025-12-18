const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    rating: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    image: [{
        type: String,
    }],
    reviewDate: {
        type: Date,
        default: Date.now
    }

})
const Review = mongoose.model("Review", reviewSchema)
module.exports = Review