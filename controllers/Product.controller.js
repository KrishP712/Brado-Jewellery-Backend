const Product = require("../model/product");
const Media = require("../model/media");
const Category = require("../model/category");
const ObjectId = require("mongoose").Types.ObjectId;
// In your Product controller
const getAllProduct = async (req, res) => {
    try {
        const {
            category,
            page = 1,
            limit = 12,
            minPrice = 0,
            maxPrice = 999999,
            sortBy = "Latest",
            ...filters
        } = req.query;

        const skip = (page - 1) * limit;

        // --- Category filter ---
        let categoryQuery = {};
        if (category) {
            const categoryDoc = await Category.findOne({ categorySlug: category });

            if (!categoryDoc)
                return res
                    .status(404)
                    .json({ success: false, message: "Category not found" });

            categoryQuery = { category: categoryDoc._id };
        }

        // --- Sorting ---
        let sortStage = {};
        switch (sortBy) {
            case "Price Low To High":
                sortStage = { price: 1 };
                break;
            case "Price High To Low":
                sortStage = { price: -1 };
                break;
            case "Discount":
                sortStage = { discount: -1 };
                break;
            case "Latest":
            default:
                sortStage = { createdAt: -1 };
                break;
        }

        // --- Match stage ---
        let initialMatchStage = {
            ...categoryQuery,
            price: { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) },
        };

        // --- Get filter name mapping ---
        const allProductFilters = await Product.aggregate([
            { $match: categoryQuery },
            { $unwind: "$filters" },
            {
                $lookup: {
                    from: "filters",
                    localField: "filters.filter",
                    foreignField: "_id",
                    as: "filterInfo",
                },
            },
            { $unwind: "$filterInfo" },
            {
                $group: {
                    _id: null,
                    filterNames: {
                        $addToSet: {
                            normalized: {
                                $toLower: {
                                    $replaceAll: {
                                        input: "$filterInfo.filterName",
                                        find: " ",
                                        replacement: "",
                                    },
                                },
                            },
                            actual: "$filterInfo.filterName",
                        },
                    },
                },
            },
        ]);

        const filterNameMap = {};
        if (allProductFilters.length > 0) {
            allProductFilters[0].filterNames.forEach((filter) => {
                filterNameMap[filter.normalized] = filter.actual;
            });
        }

        // --- Build filter match conditions ---
        let filterMatchConditions = [];
        Object.keys(filters).forEach((filterKey) => {
            const filterValue = filters[filterKey];
            if (filterValue) {
                const actualFilterName = filterNameMap[filterKey.toLowerCase()];
                if (actualFilterName) {
                    const filterArray = Array.isArray(filterValue)
                        ? filterValue
                        : filterValue.split(",");
                    if (filterArray.length > 0) {
                        const orConditions = filterArray.map((value) => ({
                            $and: [
                                { "filters.filterName": actualFilterName },
                                {
                                    "filters.filterOptions.optionName": {
                                        $regex: `^${value.trim()}$`,
                                        $options: "i",
                                    },
                                },
                            ],
                        }));
                        filterMatchConditions.push({ $or: orConditions });
                    }
                }
            }
        });

        // --- Main product pipeline ---
        const productsPipeline = [
            { $match: initialMatchStage },

            // --- Filter lookup ---
            {
                $lookup: {
                    from: "filters",
                    localField: "filters.filter",
                    foreignField: "_id",
                    as: "filterDetails",
                },
            },

            // --- Filter options lookup ---
            {
                $lookup: {
                    from: "filteroptions",
                    localField: "filters.filterOption",
                    foreignField: "_id",
                    as: "filterOptionDetails",
                },
            },

            // --- Transform filters array ---
            {
                $addFields: {
                    filters: {
                        $map: {
                            input: "$filters",
                            as: "filterItem",
                            in: {
                                filterId: "$$filterItem.filter",
                                filterName: {
                                    $let: {
                                        vars: {
                                            matchedFilter: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$filterDetails",
                                                            as: "fd",
                                                            cond: { $eq: ["$$fd._id", "$$filterItem.filter"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: "$$matchedFilter.filterName",
                                    },
                                },
                                filterOptions: {
                                    $map: {
                                        input: "$$filterItem.filterOption",
                                        as: "optionId",
                                        in: {
                                            optionId: "$$optionId",
                                            optionName: {
                                                $let: {
                                                    vars: {
                                                        matchedOption: {
                                                            $arrayElemAt: [
                                                                {
                                                                    $filter: {
                                                                        input: "$filterOptionDetails",
                                                                        as: "fod",
                                                                        cond: { $eq: ["$$fod._id", "$$optionId"] },
                                                                    },
                                                                },
                                                                0,
                                                            ],
                                                        },
                                                    },
                                                    in: "$$matchedOption.name",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // --- Offer lookup ---
            {
                $lookup: {
                    from: "offers",
                    localField: "offer",
                    foreignField: "_id",
                    as: "offerDetails",
                },
            },

            // --- Category lookup ---
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryDetails",
                },
            },
            {
                $unwind: {
                    path: "$categoryDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // --- Image lookup ---
            {
                $lookup: {
                    from: "media",
                    localField: "image",
                    foreignField: "_id",
                    as: "imageDetails",
                },
            },
            {
                $lookup: {
                    from: "reviews", 
                    localField: "_id",
                    foreignField: "product",
                    as: "reviews"
                }
            },

            // --- Final field formatting ---
            {
                $addFields: {
                    imagesUrl: {
                        $map: {
                            input: "$imageDetails",
                            as: "img",
                            in: "$$img.media",
                        },
                    },
                    categoryName: "$categoryDetails.categoryName",
                    categoryId: "$categoryDetails._id",
                    offer: {
                        $cond: [
                            { $isArray: "$offer" },
                            "$offer",
                            { $cond: [{ $ne: ["$offer", null] }, ["$offer"], null] },
                        ],
                    },
                    offers: {
                        $map: {
                            input: "$offerDetails",
                            as: "o",
                            in: {
                                _id: "$$o._id",
                                title: "$$o.title",
                                offerType: "$$o.offerType",
                                minQuantity: "$$o.minQuantity",
                                value: "$$o.value",
                                startDate: "$$o.startDate",
                                endDate: "$$o.endDate",
                                active: "$$o.active",
                            },
                        },
                    },
                    discountPrice: {
                        $cond: [
                            { $ifNull: ["$originalPrice", false] },
                            {
                                $subtract: [
                                    "$originalPrice",
                                    {
                                        $multiply: [
                                            "$originalPrice",
                                            { $divide: ["$discount", 100] },
                                        ],
                                    },
                                ],
                            },
                            "$price",
                        ],
                    },
                    reviews: {
                        $map: {
                            input: "$reviews",
                            as: "rev",
                            in: {
                                _id: "$$rev._id",
                                rating: "$$rev.rating",
                                comment: "$$rev.comment",
                                user: "$$rev.user",     
                                createdAt: "$$rev.createdAt",
                                updatedAt: "$$rev.updatedAt",
                            },
                        },
                    },
                    averageRating: {
                        $cond: [
                            { $gt: [{ $size: "$reviews" }, 0] },
                            { $round: [{ $avg: "$reviews.rating" }, 1] },
                            0,
                        ],
                    },
                    totalReviews: { $size: "$reviews" },
                },
            },

            // --- Clean up temporary fields ---
            {
                $project: {
                    filterDetails: 0,
                    filterOptionDetails: 0,
                    offerDetails: 0,
                    imageDetails: 0,
                    categoryDetails: 0,
                },
            },

            // --- Sort ---
            { $sort: sortStage },
        ];

        // --- Apply filter conditions if any ---
        if (filterMatchConditions.length > 0) {
            productsPipeline.push({ $match: { $and: filterMatchConditions } });
        }

        // --- Count total products ---
        const countPipeline = [...productsPipeline, { $count: "total" }];
        const countResult = await Product.aggregate(countPipeline);
        const total = countResult.length > 0 ? countResult[0].total : 0;

        // --- Pagination ---
        productsPipeline.push({ $skip: parseInt(skip) });
        productsPipeline.push({ $limit: parseInt(limit) });

        // --- Execute main query ---
        const products = await Product.aggregate(productsPipeline);

        // --- Get available filters for the current category/query ---
        const availableFiltersPipeline = [
            { $match: initialMatchStage },
            { $unwind: "$filters" },
            {
                $lookup: {
                    from: "filters",
                    localField: "filters.filter",
                    foreignField: "_id",
                    as: "filterInfo",
                },
            },
            { $unwind: "$filterInfo" },
            { $unwind: "$filters.filterOption" },
            {
                $lookup: {
                    from: "filteroptions",
                    localField: "filters.filterOption",
                    foreignField: "_id",
                    as: "optionInfo",
                },
            },
            { $unwind: "$optionInfo" },
            {
                $group: {
                    _id: {
                        filterId: "$filterInfo._id",
                        filterName: "$filterInfo.filterName",
                    },
                    options: {
                        $addToSet: {
                            optionId: "$optionInfo._id",
                            optionName: "$optionInfo.name",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    filterId: "$_id.filterId",
                    filterName: "$_id.filterName",
                    options: {
                        $sortArray: {
                            input: "$options",
                            sortBy: { optionName: 1 },
                        },
                    },
                },
            },
            { $sort: { filterName: 1 } },
        ];

        const availableFilters = await Product.aggregate(availableFiltersPipeline);

        // --- Price range ---
        const priceRangeResult = await Product.aggregate([
            { $match: initialMatchStage },
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" },
                },
            },
        ]);

        const priceRange =
            priceRangeResult.length > 0
                ? priceRangeResult[0]
                : { minPrice: 0, maxPrice: 0 };

        // --- Response ---
        res.json({
            success: true,
            data: {
                products,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit),
                availableFilters,
                priceRange: {
                    min: priceRange.minPrice || 0,
                    max: priceRange.maxPrice || 0,
                },
            },
        });
    } catch (err) {
        console.error("❌ Error in getAllProduct:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const createProduct = async (req, res) => {
    try {
        const { sku, slug, title, image, category, name, price, originalPrice, discount, description, stock, newproduct, special, specification, filters } = req.body;
        if (!slug || !title || !image || !category || !name || !price || !originalPrice || !discount || !description || !stock || !filters) {
            return res.status(400).json({ success: false, error: "All fields are required" });
        }

        const payload = {
            sku,
            slug,
            title,
            image,
            category,
            name,
            price,
            originalPrice,
            discount,
            description,
            stock,
            newproduct,
            special,
            specification,
            filters,
        };
        const product = await Product.create(payload)

        if (!product) {
            return res.status(400).json({ success: false, error: "Product not created" });
        }

        res.status(201).json({
            success: true,
            message: "Product created successfully!",
            product,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getProductById = async (req, res) => {
    try {
        let { slug } = req.params;
        slug = decodeURIComponent(slug).trim();
        console.log(slug);
        if (!slug || slug === "undefined") {
            return res.status(400).json({ success: false, error: "Product slug is required" });
        }
        const product = await Product.aggregate([
            {
                $match: {
                    $expr: {
                        $eq: [
                            { $trim: { input: "$slug" } },    // TRIM slug in DB
                            slug                         // Clean slug from URL
                        ]
                    }
                }
            },

            // --- Filter lookup ---
            {
                $lookup: {
                    from: "filters",
                    localField: "filters.filter",
                    foreignField: "_id",
                    as: "filterDetails",
                },
            },

            // --- Filter options lookup ---
            {
                $lookup: {
                    from: "filteroptions",
                    localField: "filters.filterOption",
                    foreignField: "_id",
                    as: "filterOptionDetails",
                },
            },

            // --- Transform filters array ---
            {
                $addFields: {
                    filters: {
                        $map: {
                            input: "$filters",
                            as: "filterItem",
                            in: {
                                filterId: "$$filterItem.filter",
                                filterName: {
                                    $let: {
                                        vars: {
                                            matchedFilter: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$filterDetails",
                                                            as: "fd",
                                                            cond: { $eq: ["$$fd._id", "$$filterItem.filter"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                        },
                                        in: "$$matchedFilter.filterName",
                                    },
                                },
                                filterOptions: {
                                    $map: {
                                        input: "$$filterItem.filterOption",
                                        as: "optionId",
                                        in: {
                                            optionId: "$$optionId",
                                            optionName: {
                                                $let: {
                                                    vars: {
                                                        matchedOption: {
                                                            $arrayElemAt: [
                                                                {
                                                                    $filter: {
                                                                        input: "$filterOptionDetails",
                                                                        as: "fod",
                                                                        cond: { $eq: ["$$fod._id", "$$optionId"] },
                                                                    },
                                                                },
                                                                0,
                                                            ],
                                                        },
                                                    },
                                                    in: "$$matchedOption.name",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },

            // --- Offer lookup ---
            {
                $lookup: {
                    from: "offers",
                    localField: "offer",
                    foreignField: "_id",
                    as: "offerDetails",
                },
            },

            // --- Category lookup ---
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryDetails",
                },
            },
            {
                $unwind: {
                    path: "$categoryDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },

            // --- Image lookup ---
            {
                $lookup: {
                    from: "media",
                    localField: "image",
                    foreignField: "_id",
                    as: "imageDetails",
                },
            },

            // --- Final field formatting ---
            {
                $addFields: {
                    imagesUrl: {
                        $map: {
                            input: "$imageDetails",
                            as: "img",
                            in: "$$img.media",
                        },
                    },
                    categoryName: "$categoryDetails.categoryName",
                    categoryId: "$categoryDetails._id",
                    offer: {
                        $cond: [
                            { $isArray: "$offer" },
                            "$offer",
                            { $cond: [{ $ne: ["$offer", null] }, ["$offer"], null] },
                        ],
                    },
                    offers: {
                        $map: {
                            input: "$offerDetails",
                            as: "o",
                            in: {
                                _id: "$$o._id",
                                title: "$$o.title",
                                offerType: "$$o.offerType",
                                minQuantity: "$$o.minQuantity",
                                value: "$$o.value",
                                startDate: "$$o.startDate",
                                endDate: "$$o.endDate",
                                active: "$$o.active",
                            },
                        },
                    },
                    discountPrice: {
                        $cond: [
                            { $ifNull: ["$originalPrice", false] },
                            {
                                $subtract: [
                                    "$originalPrice",
                                    {
                                        $multiply: [
                                            "$originalPrice",
                                            { $divide: ["$discount", 100] },
                                        ],
                                    },
                                ],
                            },
                            "$price",
                        ],
                    },
                },
            },

            // --- Clean up temporary fields ---
            {
                $project: {
                    filterDetails: 0,
                    filterOptionDetails: 0,
                    offerDetails: 0,
                    imageDetails: 0,
                    categoryDetails: 0,
                },
            }
        ])
        console.log(product);
        if (!product) {
            return res.status(404).json({ success: false, error: "Product not found" });
        }
        res.status(200).json({
            success: true,
            message: "Product found successfully!",
            product,
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

const ProductUpdate = async (req, res) => {
    try {
        const { id } = req.params;
        const { sku, slug, title, image, category, name, price, originalPrice, discount, description, stock, newproduct, special, specification, filters, offer } = req.body;
        if (!id || !sku || !slug || !title || !image || !category || !name || !price || !originalPrice || !discount || !description || !stock || !filters) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const payload = { sku, slug, title, image, category, name, price, originalPrice, discount, description, stock, newproduct, special, specification, filters }

        if (offer && ObjectId.isValid(offer)) {
            payload.offer = offer;
        } else {
            payload.offer = null; // prevents CastError
        }
        const product = await Product.findByIdAndUpdate(id, { $set: payload }, { new: true });
        res.json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }


}

const ProductDelete = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(400).json({ success: false, error: "Product not found" });
        }

        res.status(200).json({ success: true, message: "Product deleted successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}


const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        console.log(query);
        if (!query || query.trim() === "") {
            return res.json({ success: true, products: [] });
        }

        const products = await Product.find({
            title: { $regex: query, $options: "i" }
        })
            .populate("image")
            .populate("category")
            .limit(10);
        console.log(products);
        const finalProducts = products.map((p) => ({
            title: p.title,
            slug: p.slug,
            imagesUrl: p.image?.map((img) => img.media) || [],
            categoryName: p.category?.categoryName || "",
        }));

        res.json({ success: true, products: finalProducts });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    createProduct,
    getAllProduct,
    getProductById,
    ProductUpdate,
    ProductDelete,
    searchProducts
};