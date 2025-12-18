const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true
    },
    discountpercentageValue: {
        type: Number,
        required: function () {
            return this.discountType === "percentage"
        }
    },
    discountfixedValue: {
        type: Number,
        required: function () {
            return this.discountType === "fixed"
        }
    },
    minorderamount: {
        type: Number,
        required: true
    },
    startdate: {
        type: Date,
        required: true
    },
    enddate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        required: true
    },
    isactive: {
        type: Boolean,
        default: true
    }
})

const Coupon = mongoose.model("Coupon",couponSchema)

module.exports = Coupon