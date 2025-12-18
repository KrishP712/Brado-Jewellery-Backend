const jwt = require('jsonwebtoken');
const Login = require('../model/authAdmin');

async function authorization(req, res, next) {
    try {
        const token = req.cookies.token;
        // console.log(token, "TOKEN");
        if (!token) {
            return res.status(401).json({ success: false, message: "Authorization token is required!" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        // console.log(decoded, "DECODED");

        const user = await Login.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found!" });
        }
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = authorization
