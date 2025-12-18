const Filter = require("../model/filter")

const createFilter = async (req, res) => {
    try {
        const { filterName, filterSlug } = req.body

        const payload = { filterName, filterSlug }
        if (!filterName || !filterSlug) {
            return res.status(400).json({ success: false, message: "All fields are required!" })
        }

        const filter = await Filter.create(payload)

        res.status(201).json({
            success: true,
            message: "Filter created successfully!",
            data: filter
        })

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const getFilter = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const total = await Filter.countDocuments();
        const filter = await Filter.find().skip(skip).limit(limit)
        if (!filter) {
            return res.status(404).json({ success: false, message: "Filter not found!" })
        }
        res.status(200).json(
            {
                success: true,
                message: "Filter fetched successfully!",
                data: filter,
                totalFilters: total,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
const deleteFilter = async (req, res) => {
    try {
        const filter = await Filter.findByIdAndDelete(req.params.id)
        if (!filter) {
            return res.status(404).json({ success: false, message: "Filter not found!" })
        }
        res.status(200).json({
            success: true,
            message: "Filter deleted successfully!",
            data: filter
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
const filterEdit = async (req, res) => {
    try {
        const { filterName, filterSlug } = req.body
        const payload = { filterName, filterSlug }
        if (!filterName || !filterSlug) {
            return res.status(400).json({ success: false, message: "All fields are required!" })
        }
        const filter = await Filter.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true })
        if (!filter) {
            return res.status(404).json({ success: false, message: "Filter not found!" })
        }
        res.status(200).json({
            success: true,
            message: "Filter updated successfully!",
            data: filter
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

module.exports = {
    createFilter,
    getFilter,
    filterEdit,
    deleteFilter
}