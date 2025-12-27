const router = require("express").Router()

const { placeOrderController, updateOrder, getOrders, getOrderByUser, getOrderForAdmin } = require("../controllers/Order.controller")
const authUser = require("../middleware/authAuthorization")
const authorization = require("../middleware/authorization")
router.post("/placeorder", authUser, placeOrderController)
router.post("/updateorder", updateOrder)
router.get("/allorder", authUser, getOrders)
router.get("/orderbyuser/:orderId", authUser, getOrderByUser)
router.get("/getorderforadmin", authorization, getOrderForAdmin)
module.exports = router
