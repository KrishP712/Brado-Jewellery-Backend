const User = require("../model/user");
const jwt = require('jsonwebtoken')
const ObjectId = require('mongodb').ObjectId;
const { sendOtpEmail } = require("../utils/mailsender");

const userLogin = async (req, res) => {
    try {
        const { email } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpiry = Date.now() + 2 * 60 * 1000;

        let user = await User.findOne({ email });
        
        // Existing user
        if (user) {
            await User.findByIdAndUpdate(user._id, { otp, otpExpired: otpExpiry });

            const result = await sendOtpEmail(email, otp);

            return res.status(200).json({
                success: result.success,
                _id: user._id,
                message: result.success ? "OTP sent successfully" : "Failed to send OTP"
            });
        }

        // New user
        const newUser = await User.create({ email, otp, otpExpired: otpExpiry });

        const result = await sendOtpEmail(email, otp);

        return res.status(200).json({
            success: result.success,
            _id: newUser._id,
            message: result.success ? "OTP sent successfully" : "Failed to send OTP"
        });

    } catch (error) {
        console.error("userLogin error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { _id, otp } = req.body;

        const user = await User.findOne({
            _id,
            otp,
            otpExpired: { $gt: Date.now() },
        });

        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "Invalid or expired OTP" });
        }

        await User.findByIdAndUpdate(user._id, {
            $set: { otp: null, otpExpired: null },
        });

        const token = jwt.sign(
            { _id: user._id, email: user.email },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1d" },
        );

        return res.status(200).json({ success: true, message: "User login Successfully", token });
    } catch (error) {
        console.error("verifyOtp error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const resendOtp = async (req, res) => {
    try {
        const { _id } = req.body;
        const user = await User.findById(id);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpiry = Date.now() + 2 * 60 * 1000;

        await User.findByIdAndUpdate(id, { $set: { otp, otpExpired: otpExpiry } });

        return res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
const update = async (req, res) => {
    try {
        const { id } = req.user;
        const user = await User.findById(id);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        await User.findByIdAndUpdate(id, { $set: { name: req.body.name, address: req.body.address, phone: req.body.phone, gender: req.body.gender, email: req.body.email, password: req.body.password, location: req.body.location, birthdate: req.body.birthdate, } });

        return res.status(200).json({ success: true, message: "User updated successfully" });
    } catch (error) {
        console.error('Error in update:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}
const logout = async (req, res) => {
    try {
        const usertoken = req.cookies.usertoken;
        if (!usertoken) {
            return res.status(401).json({ success: false, message: "Authorization token is required!" });
        }
        
        return res.status(200).json({ success: true, message: "User logged out successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
const getAllUsers = async (req, res) => {
    try {
        // const users = await User.find()
        const users = await User.find().select('name email _id phone gender location birthdate')
        const id = req.user._id;
        return res.status(200).json({ success: true, users, id });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
module.exports = { userLogin, verifyOtp, resendOtp, update, getAllUsers, logout }