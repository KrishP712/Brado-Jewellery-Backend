const { ObjectId } = require('mongoose').Types;
const Carousel = require("../model/carousel")

const createCarousel = async (req, res) => {
    try {
        const { slug, desktop, mobile } = req.body
        if (!slug || !desktop || !mobile) {
            return res.status(400).json({ success: false, message: "All fields are required" })
        }
        const payload = { slug, desktop, mobile }
        const carousel = await Carousel.create(payload)
        return res.status(200).json({ success: true, message: "Carousel created", carousel })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
const getAllCarousel = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const total = await Carousel.countDocuments();
        const carousel = await Carousel.aggregate(
            [
                {
                    $lookup: {
                        from: 'media',
                        localField: 'desktop',
                        foreignField: '_id',
                        as: 'desktopimage'
                    }
                },
                {
                    $unwind: {
                        path: '$desktopimage',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'media',
                        localField: 'mobile',
                        foreignField: '_id',
                        as: 'mobileimage'
                    }
                },
                {
                    $unwind: {
                        path: '$mobileimage',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        slug: 1,
                        desktopimage: "$desktopimage.media",
                        mobileimage: "$mobileimage.media",
                    }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ]
        )
        return res.status(200).json({ success: true, message: "Carousel fetched", carousel , totalCarousels: total, totalPages: Math.ceil(total / limit), currentPage: page })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const getByIdCarousel = async (req, res) => {
    try {

        const carousel = await Carousel.aggregate(
            [
                {
                    $match: {
                        _id: new ObjectId(req.params.id)
                    }
                },
                {
                    $lookup: {
                        from: 'media',
                        localField: 'desktop',
                        foreignField: '_id',
                        as: 'desktopimage'
                    }
                },
                {
                    $unwind: {
                        path: '$desktopimage',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'media',
                        localField: 'mobile',
                        foreignField: '_id',
                        as: 'mobileimage'
                    }
                },
                {
                    $unwind: {
                        path: '$mobileimage',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        slug: 1,
                        desktopimage: "$desktopimage.media",
                        mobileimage: "$mobileimage.media",
                    }
                }
            ]
        )
        return res.status(200).json({ success: true, message: "Carousel fetched", carousel })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const updateCarousel = async (req, res) => {
    try {
        const { slug, desktop, mobile } = req.body
        const carousel = await Carousel.findByIdAndUpdate(req.params.id, { slug, desktop, mobile }, { new: true })
        return res.status(200).json({ success: true, message: "Carousel updated", carousel })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
const deleteCarousel = async (req, res) => {
    try {
        const carousel = await Carousel.findByIdAndDelete(req.params.id)
        return res.status(200).json({ success: true, message: "Carousel deleted", carousel })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}
module.exports = { createCarousel, getAllCarousel, getByIdCarousel, updateCarousel, deleteCarousel }