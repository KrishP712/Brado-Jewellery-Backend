const router = require("express").Router()

const { placeOrderController, updateOrder, getOrders, getOrderByUser } = require("../controllers/Order.controller")
const authUser = require("../middleware/authAuthorization")
router.post("/placeorder", authUser, placeOrderController)
router.post("/updateorder", updateOrder)
router.get("/allorder", authUser, getOrders)
router.get("/orderbyuser/:orderId", authUser, getOrderByUser)
module.exports = router
