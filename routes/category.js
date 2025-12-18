const router = require("express").Router()
const { CretaCategory, getAllCategory, getAllCategoryById, updateCategory, deleteCategory } = require("../controllers/Category.controller")


router.post("/create", CretaCategory)
router.get("/all", getAllCategory)
router.get("/all/:id", getAllCategoryById)
router.put("/update/:id", updateCategory)
router.delete("/delete/:id", deleteCategory)
module.exports = router