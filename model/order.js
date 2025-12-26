const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    couponcode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
        default: null,
    },
    shippingAddress: {
        type: mongoose.Schema.Types.Mixed,
    },
    billingAddress: {
        type: mongoose.Schema.Types.Mixed,
    },
    isBillingAddressSame: {
        type: Boolean,
        default: false,
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
            quantity: {
                type: Number,
                default: 1,
            },
            price: {
                type: Number,
                default: 0,
            },
            totalPrice: {
                type: Number,
                default: 0,
            },
            sku: {
                type: String,
            },
        },
    ],
    subtotal: {
        type: Number,
        required: true,
    },
    couponDiscount: {
        type: Number,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    shippingFee: {
        type: Number,
        default: 70,
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "PREPAID"],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid"],
        default: function () {
            return this.paymentMethod === "COD" ? "pending" : "paid";
        },
    },
    statusTimeline: [
        {
            title: {
                type: String,
                enum: [
                    "Order Placed",
                    "Order Confirmed",
                    "Packed",
                    "Shipped",
                    "Out for Delivery",
                    "Delivered",
                    "Cancelled",
                    "Returned and Refunded",
                ],
                required: true,
            },
            status: {
                type: String,
                enum: ["pending", "completed"],
                default: "pending",
            },
            timestamp: {
                type: Date,
                default: null,
            },
        },
    ],
    estimatedDeliveryDate: {
        type: Date,
        default: function () {
            const date = new Date();
            date.setDate(date.getDate() + 5);
            return date;
        },
    },
    orderDate: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true })
const Order = mongoose.model("Order", orderSchema)
module.exports = Order