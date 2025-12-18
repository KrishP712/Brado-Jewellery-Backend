const router = require('express').Router();
const mediaRoutes = require('./Media');
const productRoutes = require('./product');
const authAdminRoutes = require('./authAdmin');
const categoryRoutes = require('./category');
const filterRoutes = require('./filter');
const filterOptionRoutes = require('./filterOption');
const couponRoutes = require('./coupon')
const userRoutes = require('./user')
const testimonialRoutes = require('./testimonial')
const cartRoutes = require('./cart')
const carouselRoutes = require('./carousel')
const newsletterRoutes = require('./newsletters')
const addressRoutes = require('./addressbook')
const wishlistRoutes = require('./wishlist')
const orderRoutes = require('./order')
const reviewRoutes = require('./review')      
const contactusRoutes = require('./contactus')
const offerRoutes = require('./offer')
router.use('/address', addressRoutes)
router.use('/user', userRoutes)
router.use('/authAdmin', authAdminRoutes);
router.use('/carousel', carouselRoutes)
router.use('/cart', cartRoutes)
router.use('/offer', offerRoutes)
router.use('/category', categoryRoutes);
router.use('/contactus', contactusRoutes)
router.use('/coupon', couponRoutes)
router.use('/filter', filterRoutes)
router.use('/filteroption', filterOptionRoutes)
router.use('/media', mediaRoutes);
router.use('/newsletter', newsletterRoutes)
router.use('/order', orderRoutes)
router.use('/products', productRoutes);
router.use('/review', reviewRoutes)
router.use('/testimonial', testimonialRoutes)
router.use('/wishlist', wishlistRoutes)

module.exports = router;
