// const jwt = require('jsonwebtoken');
// const SignUp = require('../model/signUp');
// const { passHash, passCompare } = require('../utils/Password');

// const signUp = async (req, res) => {
//   try {
//     const { fullname, email, password, phone } = req.body;

//     const existingUser = await SignUp.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ success: false, message: "Email already exists!" });
//     }

//     const hash = await passHash(password);
//     const newUser = await SignUp.create({ fullname, email, password: hash, phone });
    
//     return res.status(201).json({ success: true, message: "Admin registered successfully!" });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// const signIn = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await SignUp.findOne({ email });

//     if (!user) {
//       return res.status(400).json({ success: false, message: "Email or password invalid!" });
//     }

//     const isMatch = await passCompare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ success: false, message: "Email or password invalid!" });
//     }

//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });

//     // Save token in DB (optional)
//     await SignUp.findByIdAndUpdate(user._id, { token });

//     res.status(200)
//       .cookie('token', token, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === 'production',
//         sameSite: 'lax',
//         maxAge: 2 * 24 * 60 * 60 * 1000
//       })
//       .json({ success: true, message: "Login successful", token });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// const otpSend = async (req, res) => {
//   try {
//     const { phone } = req.body;
//     const user = await SignUp.findOne({ phone });

//     if (!user) {
//       return res.status(400).json({ success: false, message: "Phone number not found!" });
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000);
//     await SignUp.findByIdAndUpdate(user._id, { otp });

//     return res.status(200).json({ success: true, message: `OTP sent: ${otp} to phone ${phone}` });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = { signUp, signIn, otpSend };
