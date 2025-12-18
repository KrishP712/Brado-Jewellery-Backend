const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    sku: {
        type: String,
        required: true,
        unique: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    image: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Media",
            required: true,
        },
    ],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Categories",
        required: true,
    },
    offer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
    },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    originalPrice: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
    },
    description: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    newproduct: {
        type: Boolean,
        default: false,
    },
    special: {
        type: Boolean,
        default: false,
    },
    specification: [
        {
            key: {
                type: String,
                required: true,
            },
            value: {
                type: String,
                required: true,
            },
        }
    ],
    filters: [
        {
            filter: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Filter",
                required: true
            },
            filterOption: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "FilterOption",
                    required: true
                }
            ]
        }

    ],
    averageRating: {
        type: Number,
    },
    totalReviews: {
        type: Number,
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review",
        },
    ],

}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;