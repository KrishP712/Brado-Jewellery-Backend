const Coupon = require("../model/coupon");

const coupenCreate = async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountpercentageValue,
            discountfixedValue,
            minorderamount,
            startdate,
            enddate,
            usageLimit,
            isactive
        } = req.body;

        function generateCouponCode(length = 10) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let coupon = '';
            for (let i = 0; i < length; i++) {
                coupon += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return coupon;
        }

        const payload = {
            code: code && code.trim() !== "" ? code : generateCouponCode(),
            discountType,
            discountpercentageValue,
            discountfixedValue,
            minorderamount,
            startdate,
            enddate,
            usageLimit,
            isactive
        };

        const coupon = await Coupon.create(payload);
        return res.status(200).json({
            success: true,
            message: "Coupon created successfully",
            coupon
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};


const getCoupon = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;   // Current page
        const limit = parseInt(req.query.limit) || 12; // Records per page
        const skip = (page - 1) * limit;

        const total = await Coupon.countDocuments();
        const coupons = await Coupon.find({})
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 }); // Optional: newest first

        return res.status(200).json({
            success: true,
            message: "Coupons fetched successfully",
            coupons,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCoupons: total
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

const getByIdCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id)
        return res.status(200).json({ success: true, message: "coupon fetched successfully", coupon })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message })
    }
}

const updateCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body)
        return res.status(200).json({ success: true, message: "coupon updated successfully", coupon })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message })
    }
}
const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id)
        return res.status(200).json({ success: true, message: "coupon deleted successfully", coupon })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message })
    }
}

const toogleActive = async (req, res) => {
    try {
        const currentCoupon = await Coupon.findById(req.params.id);
        if (!currentCoupon) {
            return res.status(404).json({ success: false, message: "coupon not found" })
        }
        const coupon = await Coupon.findByIdAndUpdate(currentCoupon, { isactive: !currentCoupon.isactive }, { new: true })
        return res.status(200).json({ success: true, message: "coupon updated successfully", coupon })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message })
    }
}
module.exports = { coupenCreate, getCoupon, getByIdCoupon, updateCoupon, deleteCoupon, toogleActive }