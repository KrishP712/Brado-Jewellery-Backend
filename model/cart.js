const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
            quantity: {
                type: Number,
                default: 1
            }
        }
    ],
    couponcode: {
        type: mongoose.Schema.Types.ObjectId, // or String if you store the code instead of ID
        ref: "Coupon",
        default: null,
    }
})

const Cart = mongoose.model("Cart", cartSchema)

module.exports = Cart