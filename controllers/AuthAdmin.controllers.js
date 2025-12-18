const Login = require("../model/authAdmin");
const { passCompare, passHash } = require("../utils/Password");
const jwt = require("jsonwebtoken");

// const register = async (req, res) => {
//     try {
//         const { name, email, password } = req.body
//         if (!name || !email || !password) {
//             return res.status(400).json({ success: false, message: "Name, email and password are required!" })
//         }

//         const user = await Login.findOne({ email })
//         if (user) {
//             return res.status(400).json({ success: false, message: "User already exists!" })
//         }
//         const hashPassword = await passHash(password)
//         const userCreate = await Login.create({ name, email, password: hashPassword })
//         res.status(201).json({ success: true, message: "User created successfully!", user: userCreate })
//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message })
//     }
// }
const login = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required!" })
        }
        const user = await Login.findOne({ email })
        if (!user) {
            return res.status(400).json({ success: false, message: "Email Or Password Incorrect!" })
        }
        const isMatch = await passCompare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid Email Or Password!" })
        }
        const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" })
        const userUpdate = await Login.findOneAndUpdate({ email }, { token }, { new: true })
        res.status(200).json(
            {
                success: true,
                message: "Login successful",
                user: userUpdate
            })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
};

const changePassword = async (req, res) => {
    const { oldpassword, password } = req.body

    if (!oldpassword || !password) {
        return res.status(400).json({ success: false, message: "Old password and new password are required!" })
    }

    const user = await Login.findOne({ _id: req.user._id })
    if (!user) {
        return res.status(400).json({ success: false, message: "Email Or Password Incorrect!" })
    }
    const isMatch = await passCompare(oldpassword, user.password)
    if (!isMatch) {
        return res.status(400).json({ success: false, message: "Invalid Email Or Password!" })
    }
    const hashPassword = await passHash(password)
    const userUpdate = await Login.findOneAndUpdate({ _id: req.user._id }, { password: hashPassword }, { new: true })
    res.status(200).json(
        {
            success: true,
            message: "Password changed successfully",
            user: userUpdate
        })
}

const logout = async (req, res) => {
    try {
        res.clearCookie("token").json({
            success: true,
            message: "Logout successful"
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
module.exports = {login, changePassword, logout };
