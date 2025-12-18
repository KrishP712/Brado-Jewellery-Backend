const router = require("express").Router()
const { register, login, changePassword, logout } = require("../controllers/AuthAdmin.controllers")
const authorization = require("../middleware/authorization")
// router.post("/register", register)
router.post("/login", login)
router.post("/changepassword", authorization, changePassword)
router.post("/logout", authorization, logout)
module.exports = router
