const Categories = require("../model/category")

const CretaCategory = async (req, res) => {
    try {
        const { categoryName, categorySlug, sliderImage, icons, bannerImage, video } = req.body

        const payload = {
            categoryName,
            categorySlug,
            sliderImage,
            icons,
            bannerImage,
            video,
        }

        if (!categoryName || !categorySlug || !sliderImage || !icons || !bannerImage || !video) {
            return res.status(400).json({ success: false, message: "All fields are required!" })
        }

        const category = await Categories.create(payload)

        res.status(201).json({
            success: true,
            message: "Category created successfully!",
            data: category
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const getAllCategory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;   // Current page
        const limit = parseInt(req.query.limit) || 12; // Categories per page
        const skip = (page - 1) * limit;

        // Step 1: Count total categories
        const totalCategories = await Categories.countDocuments();

        // Step 2: Fetch paginated categories
        const categories = await Categories.find({})
            .populate("sliderImage")
            .populate("bannerImage")
            .populate("icons")
            .populate("video")
            .skip(skip)
            .limit(limit)
            .lean();

        if (!categories || categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No categories found!"
            });
        }

        // Step 3: Transform response
        const transformedCategories = categories.map(category => ({
            ...category,
            sliderimage: category.sliderImage?.map((img) => img?.images).filter(Boolean) || [],
            categorybanner: category.bannerImage?.map((img) => img?.images).filter(Boolean) || [],
        }));

        // Step 4: Return paginated response
        res.status(200).json({
            success: true,
            message: "Categories fetched successfully!",
            data: transformedCategories,
            totalCategories,
            totalPages: Math.ceil(totalCategories / limit),
            currentPage: page
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


const getAllCategoryById = async (req, res) => {
    try {
        const category = await Categories.findById(req.params.id)
            .populate("sliderImage", "images")
            .populate("bannerImage", "images")
            .populate("icons", "images")
            .populate("video", "images")
            .lean();

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found!"
            })
        }

        // Transform the data
        const categoryData = {
            ...category,
            sliderimage: category.sliderImage?.map((img) => img?.images).filter(Boolean) || [],
            categorybanner: category.bannerImage?.map((img) => img?.images).filter(Boolean) || [],
        }

        res.status(200).json({
            success: true,
            message: "Category fetched successfully!",
            data: categoryData
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const updateCategory = async (req, res) => {
    try {
        const { categoryName, categorySlug, sliderImage, icons, bannerImage, video } = req.body
        const payload = { categoryName, categorySlug, sliderImage, icons, bannerImage, video }

        const category = await Categories.findByIdAndUpdate(
            req.params.id,
            payload,
            { new: true, runValidators: true } // Return updated document
        )

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found!"
            })
        }

        res.status(200).json({
            success: true,
            message: "Category updated successfully!",
            data: category
        })
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const deleteCategory = async (req, res) => {
    try {
        const category = await Categories.findByIdAndDelete(req.params.id)

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found!"
            })
        }

        res.status(200).json({
            success: true,
            message: "Category deleted successfully!",
            data: category
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

module.exports = {
    CretaCategory,
    getAllCategory,
    getAllCategoryById,
    updateCategory,
    deleteCategory
}