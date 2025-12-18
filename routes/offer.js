const router = require("express").Router()
const { createOffer, getAllOffer, updateOffer, deleteOffer, toggleOffer } = require("../controllers/Offer.controller")
router.post("/create", createOffer)
router.get("/all", getAllOffer)
router.put("/update/:id", updateOffer)
router.delete("/delete/:id", deleteOffer)
router.put("/toggle/:id", toggleOffer)
module.exports = router
