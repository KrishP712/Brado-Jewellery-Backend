const FilterOption = require("../model/filterOption")

const createOption = async (req, res) => {
    try {
        const { filterId, name, slug } = req.body
        const payload = { filterId, name, slug }
        if (!filterId || !name || !slug) {
            return res.status(400).json({ success: false, message: "All fields are required!" })
        }
        const option = await FilterOption.create(payload)
        res.status(201).json({
            success: true,
            message: "Option created successfully!",
            data: option
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
const getFilterOption = async (req, res) => {
    try {
        const option = await FilterOption.aggregate(
            [
                {
                    $lookup: {
                        from: "filters",
                        localField: "filterId",
                        foreignField: "_id",
                        as: "fil_res"
                    }
                },
                {
                    $unwind: {
                        path: "$fil_res",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        name: "$name",
                        slug: "$slug",
                        filterName: "$fil_res.filterName",
                        filterSlug: "$fil_res.filterSlug",
                        filterId: "$fil_res._id"
                    }
                }
            ]
        )
        res.status(200).json({
            success: true,
            message: "Option fetched successfully!",
            data: option
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
const updateFilterOption = async (req, res) => {
    try {
        const { filterId, name, slug } = req.body
        const payload = { filterId, name, slug }
        if (!filterId || !name || !slug) {
            return res.status(400).json({ success: false, message: "All fields are required!" })
        }
        const option = await FilterOption.findOneAndUpdate({ filterId: filterId }, { $set: payload }, { new: true })
        res.status(200).json({
            success: true,
            message: "Option updated successfully!",
            data: option
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
const deleteFilterOption = async (req,res)=>{
    try {
        const {id} = req.params
        const option = await FilterOption.findByIdAndDelete(id)
        res.status(200).json({
            success : true,
            message : "Option deleted successfully!",
            data : option
        })       
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

module.exports = { createOption, getFilterOption, updateFilterOption, deleteFilterOption }