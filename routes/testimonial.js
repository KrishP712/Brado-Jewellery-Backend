const router = require("express").Router();
const { createTesrtimonial, getAllTestimonials,deleteTestimonial,toggleTestmonial } = require("../controllers/Testimonial.controller");
router.post("/create", createTesrtimonial);
router.get("/all", getAllTestimonials);
router.delete("/delete/:id", deleteTestimonial);
router.put("/toggle/:id", toggleTestmonial);
module.exports = router;