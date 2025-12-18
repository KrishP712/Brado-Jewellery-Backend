const router = require('express').Router()
const { createCarousel, getAllCarousel, getByIdCarousel, updateCarousel, deleteCarousel } = require('../controllers/Carousel.controller')
const authUser = require('../middleware/authAuthorization')
router.post('/create', createCarousel)
router.get('/all', getAllCarousel)
router.get('/all/:id', getByIdCarousel)
router.put('/update/:id', updateCarousel)
router.delete('/delete/:id', deleteCarousel)
module.exports = router