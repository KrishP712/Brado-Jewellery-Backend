const router = require("express").Router()
const { createFilter, getFilter, filterEdit, deleteFilter } = require("../controllers/Filter.controller")
router.post("/create", createFilter)
router.get("/all", getFilter)
router.put("/update/:id", filterEdit)
router.delete("/delete/:id", deleteFilter)
module.exports = router