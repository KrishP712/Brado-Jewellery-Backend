const router = require("express").Router()
const { createOption, getFilterOption, updateFilterOption, deleteFilterOption } = require("../controllers/FilterOption.controller")
router.post("/create", createOption)
router.get("/all", getFilterOption)
router.put("/update/:id", updateFilterOption)
router.delete("/delete/:id", deleteFilterOption)
module.exports = router
