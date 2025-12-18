const router = require("express").Router();
const { createProduct, getAllProduct, getProductById, ProductUpdate, ProductDelete, searchProducts } = require("../controllers/Product.controller");

router.post("/create", createProduct);
router.get("/all", getAllProduct);
router.get("/allbyid/:slug", getProductById);
router.put("/update/:id", ProductUpdate);
router.delete("/delete/:id", ProductDelete);
router.get("/search", searchProducts);
module.exports = router;
