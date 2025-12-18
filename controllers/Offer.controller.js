const Offer = require("../model/offer");

const createOffer = async (req, res) => {
    try {
        const { title, offerType, minQuantity, value, startDate, endDate } = req.body;
        const offer = await Offer.create({
            title,
            offerType,
            minQuantity,
            value,
            startDate,
            endDate,
        });
        return res.status(201).json({
            success: true,
            message: "Offer created successfully",
            data: offer,
        });
    } catch (error) {
        console.error("Error creating offer:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getAllOffer = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const total = await Offer.countDocuments();
        const offer = await Offer.find().skip(skip).limit(limit);
        return res.status(200).json({
            success: true,
            message: "Offers fetched successfully",
            data: offer,
            totalOffers: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error("Error fetching offers:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};


const updateOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findByIdAndUpdate(id, req.body, { new: true });
        return res.status(200).json({
            success: true,
            message: "Offer updated successfully",
            data: offer,
        });
    } catch (error) {
        console.error("Error updating offer:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const deleteOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findByIdAndDelete(id);
        return res.status(200).json({
            success: true,
            message: "Offer deleted successfully",
            data: offer,
        });
    } catch (error) {
        console.error("Error deleting offer:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

const toggleOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).json({ success: false, message: "Offer not found" });
        }
         await Offer.findByIdAndUpdate(id, { active: !offer.active }, { new: true });
        return res.status(200).json({
            success: true,
            message: "Offer toggled successfully",
            data: offer,
        });
    } catch (error) {
        console.error("Error toggling offer:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};


module.exports = {
    createOffer,
    getAllOffer,
    updateOffer,
    deleteOffer,
    toggleOffer
}   