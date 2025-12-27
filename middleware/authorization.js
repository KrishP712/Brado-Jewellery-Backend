const jwt = require("jsonwebtoken");
const Login = require("../model/authAdmin");

async function authorization(req, res, next) {
  try {
    // ✅ Read token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Authorization token is required!" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const admin = await Login.findById(decoded.id);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found!" });
    }

    req.user = admin;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}

module.exports = authorization;
