const router = require("express").Router()
const { createNewsLetter, getNewsLetter, deleteNewsLetter } = require("../controllers/Newsletters")
router.post("/create", createNewsLetter)
router.get("/all", getNewsLetter)
router.delete("/delete/:id", deleteNewsLetter)
module.exports = router
