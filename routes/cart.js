const router = require('express').Router()
const { createCart, removeCart, increaseCart, decreaseProduct, getAllCart } = require('../controllers/Cart.controller')
const authUser = require('../middleware/authAuthorization')
router.post('/create',authUser, createCart)
router.delete('/remove',authUser, removeCart)
router.put('/increase',authUser, increaseCart)
router.put('/decrease',authUser, decreaseProduct)
router.get('/all',authUser, getAllCart)
module.exports = router
