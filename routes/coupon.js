const router = require("express").Router()
const { coupenCreate, getCoupon, getByIdCoupon, updateCoupon, deleteCoupon, toogleActive } = require("../controllers/Coupon.controller")
router.post("/create", coupenCreate)
router.get("/all", getCoupon)
router.get("/all/:id", getByIdCoupon)
router.put("/update/:id", updateCoupon)
router.delete("/delete/:id", deleteCoupon)
router.put("/toggle/:id", toogleActive)
module.exports = router