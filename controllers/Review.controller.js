const Product = require("../model/product");
const Review = require("../model/review");
const Order = require("../model/order");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

// Create Review
const createReview = async (req, res) => {
    try {
        const { productId, orderId, title, comment, rating } = req.body;
        const userId = req.user._id;
        const userName = req.user.name;

        // Validation
        if (!productId || !orderId || !title || !comment || !rating) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }



        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        const order = await Order.findOne({
            _id: orderId,
            userId: userId,
        });

        const orderStatus = order.statusTimeline.find((status) => status.title == "Delivered" && status.status == "completed");



        if (!orderStatus) {
            return res.status(400).json({
                success: false,
                message: "order not delivered so not can write the review"
            });
        }


        const existingReview = await Review.findOne({
            productId,
            orderId,
            userId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this product for this order"
            });
        }

        const reviewData = await Review.create({
            productId,
            orderId,
            userId,
            title,
            comment,
            rating,
        });

        // Update product rating
        await updateProductRating(productId);

        return res.status(201).json({
            success: true,
            message: "Review created successfully",
            data: reviewData,
        });
    } catch (error) {
        console.error("Error creating review:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all reviews (admin)
const getAllReview = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const reviews = await Review.find()
            .populate("userId", "name email phone")
            .populate("productId", "name image price")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Review.countDocuments();

        return res.status(200).json({
            success: true,
            message: "Reviews fetched successfully",
            data: {
                reviews,
                totalReviews: total,
                totalPages: Math.ceil(total / limit),
                currentPage: Number(page)
            }
        });
    } catch (error) {
        console.error("Error fetching reviews:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get review by ID
const getReviewById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID"
            });
        }

        const review = await Review.findById(id)
            .populate("userId", "name email")
            .populate("productId", "name image price");

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Review fetched successfully",
            data: review,
        });
    } catch (error) {
        console.error("Error fetching review:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get reviews by product ID
const getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, sortBy = "recent" } = req.query;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID"
            });
        }

        // Determine sort option
        let sortOption = { createdAt: -1 }; // Default: recent first
        if (sortBy === "highest") {
            sortOption = { rating: -1, createdAt: -1 };
        } else if (sortBy === "lowest") {
            sortOption = { rating: 1, createdAt: -1 };
        }

        const reviews = await Review.find({ productId })
            .populate("userId", "name email phone")
            .sort(sortOption)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Review.countDocuments({ productId });

        // Get rating breakdown
        const ratingStats = await Review.aggregate([
            { $match: { productId: mongoose.Types.ObjectId(productId) } },
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } }
        ]);

        // Calculate average rating
        const avgRating = await Review.aggregate([
            { $match: { productId: mongoose.Types.ObjectId(productId) } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$rating" }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            message: "Product reviews fetched successfully",
            data: {
                reviews,
                totalReviews: total,
                totalPages: Math.ceil(total / limit),
                currentPage: Number(page),
                averageRating: avgRating.length > 0 ? avgRating[0].avgRating.toFixed(1) : 0,
                ratingBreakdown: ratingStats
            }
        });
    } catch (error) {
        console.error("Error fetching product reviews:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Check if user can review a product
const checkReviewEligibility = async (req, res) => {
    try {
        const { productId, orderId } = req.query;
        const userId = req.user._id;

        if (!productId || !orderId) {
            return res.status(400).json({
                success: false,
                message: "Product ID and Order ID are required"
            });
        }

        const existingReview = await Review.findOne({
            productId,
            orderId,
            userId
        });



        if (existingReview) {
            return res.status(200).json({
                success: true,
                canReview: false,
                reason: "Already reviewed",
                reviewData: existingReview
            });
        }

        return res.status(200).json({
            success: true,
            canReview: true,
            reason: "Order not delivered yet or not found"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get user's reviews
const getMyReviews = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10 } = req.query;

        const reviews = await Review.find({ userId })
            .populate("productId", "name image price")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Review.countDocuments({ userId });

        return res.status(200).json({
            success: true,
            message: "Your reviews fetched successfully",
            data: {
                reviews,
                totalReviews: total,
                totalPages: Math.ceil(total / limit),
                currentPage: Number(page)
            }
        });
    } catch (error) {
        console.error("Error fetching user reviews:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update review
const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, comment, rating } = req.body;
        const userId = req.user._id;

        const review = await Review.findOne({ _id: id, userId });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission"
            });
        }

        if (title) review.title = title;
        if (comment) review.comment = comment;
        if (rating) {
            if (rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: "Rating must be between 1 and 5"
                });
            }
            review.rating = rating;
        }

        await review.save();

        // Update product rating
        await updateProductRating(review.productId);

        return res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: review
        });
    } catch (error) {
        console.error("Error updating review:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete review
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const review = await Review.findOneAndDelete({ _id: id, userId });

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found or you don't have permission"
            });
        }

        // Update product rating
        await updateProductRating(review.productId);

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting review:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Helper function to update product rating
const updateProductRating = async (productId) => {
    try {
        const reviews = await Review.find({ productId });
        console.log(reviews);
        if (reviews.length === 0) {
            // If no reviews, set to 0
            await Product.findByIdAndUpdate(productId, {
                totalReviews: 0,
                averageRating: 0
            });
            return;
        }

        // Calculate total reviews
        const totalReviews = reviews.length;

        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = (totalRating / totalReviews).toFixed(1); // Round to 1 decimal place

        // Update product
        await Product.findByIdAndUpdate(productId, {
            totalReviews,
            averageRating: parseFloat(averageRating)
        });


    } catch (error) {
        console.error('Error updating product rating:', error);
        throw error;
    }
};

module.exports = {
    createReview,
    getAllReview,
    getReviewById,
    getReviewsByProduct,
    checkReviewEligibility,
    getMyReviews,
    updateReview,
    deleteReview
};