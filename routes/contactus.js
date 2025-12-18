const router = require("express").Router();
const { createContactUs, getContactUs, updateContactUs } = require("../controllers/ContactUs.controller");

router.post("/create", createContactUs);
router.get("/get", getContactUs);
router.put("/update/:id", updateContactUs);

module.exports = router;
