const Newsletter = require("../model/newsletter")

const createNewsLetter = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" })
        }
        const newsletter = await Newsletter.create({ email })
        return res.status(200).json({ success: true, message: "Newsletter created", newsletter })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
const getNewsLetter = async (req, res) => {
    try {
        const newsletter = await Newsletter.find()
        return res.status(200).json({ success: true, message: "Newsletter fetched", newsletter })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
const deleteNewsLetter = async (req, res) => {
    try {
        const newsletter = await Newsletter.findByIdAndDelete(req.params.id)
        return res.status(200).json({ success: true, message: "Newsletter deleted", newsletter })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
module.exports = { createNewsLetter, getNewsLetter, deleteNewsLetter }