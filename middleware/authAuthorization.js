const jwt = require("jsonwebtoken");
const User = require("../model/user");

async function authUser(req, res, next) {
    try {
        const usertoken = req.cookies.usertoken;
        if (!usertoken) {
            return res.status(401).json({ success: false, message: "Authorization token is required!" });
        }
        const decoded = jwt.verify(usertoken, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

module.exports = authUser
