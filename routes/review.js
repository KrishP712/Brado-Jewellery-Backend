const router = require("express").Router()
const { createReview, getAllReview, getReviewById, getReviewsByProduct, getMyReviews, updateReview, deleteReview } = require("../controllers/Review.controller")
const authUser = require("../middleware/authAuthorization")

router.post("/create", authUser, createReview)
router.get("/get", getAllReview)
router.get("/get/:id", getReviewById)
router.get("/get/product/:id", getReviewsByProduct)
router.get("/get/user/:id", getMyReviews)
router.put("/update/:id", authUser, updateReview)
router.delete("/delete/:id", authUser, deleteReview)
module.exports = router
