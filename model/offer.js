// models/Offer.js
const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  offerType: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true,
  },
  minQuantity: {
    type: Number,
    required: true,
    default: 1,
  },
  value: {
    type: Number,
    required: true,
  },
  startDate: Date,
  endDate: Date,
  active: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Offer", offerSchema);