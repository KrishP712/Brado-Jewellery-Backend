const Contact = require("../model/contactus");

const createContactUs = async (req, res) => {
    try {
        const { name, email, message, contactno } = req.body;
        const contactUs = await Contact.create({ name, email, message, contactno });
        return res.status(201).json({
            success: true,
            message: "Contact Us created successfully",
            data: contactUs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create Contact Us",
            error: error.message,
        });
    }
}

const getContactUs = async (req, res) => {
    try {
        const contactUs = await Contact.find();
        return res.status(200).json({
            success: true,
            message: "Contact Us fetched successfully",
            data: contactUs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch Contact Us",
            error: error.message,
        });
    }
}

const updateContactUs = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await Contact.findById(id);
        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Contact Us not found",
            });
        }
        if (data.status === "completed") {
            return res.status(200).json({
                success: true,
                message: "Contact Us already completed",
                data: data,
            });
        }
        const contactUs = await Contact.findByIdAndUpdate(id, { status: "completed" }, { new: true });
        return res.status(200).json({
            success: true,
            message: "Contact Us updated successfully",
            data: contactUs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update Contact Us",
            error: error.message,
        });
    }
}
module.exports = {
    createContactUs,
    getContactUs,
    updateContactUs
}

