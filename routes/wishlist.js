const router = require("express").Router()

const { createWishList, getWishList, removeList } = require("../controllers/WishList.controller")

const authUser = require("../middleware/authAuthorization")
router.post("/create", authUser, createWishList)
router.get("/all", authUser, getWishList)
router.delete("/remove/:productId", authUser, removeList)
module.exports = router