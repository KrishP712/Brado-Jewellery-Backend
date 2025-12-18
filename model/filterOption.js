const mongoose = require("mongoose")
const filterOptionSchema = new mongoose.Schema({
    filterId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Filter"
    },
    name:{
        type : String,
        required : true
    },
    slug:{
        type : String,
        required : true
    },
    isActive:{
        type : Boolean,
        default : true
    }
})
const FilterOption = mongoose.model("FilterOption", filterOptionSchema)
module.exports = FilterOption