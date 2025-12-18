
const Testimonial = require("../model/testimonials");
const createTesrtimonial = async (req, res) => {
    try {
        const { userId, feature, submittedAt, testimonialText, rating } = req.body;

        const payload = {
            userId,
            feature,
            submittedAt,
            testimonialText,
            rating
        }

        const testimonial = await Testimonial.create(payload);

        return res.status(200).json({ success: true, testimonial });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

const getAllTestimonials = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const total = await Testimonial.countDocuments();
        const testimonials = await Testimonial.aggregate(
            [
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: {
                        path: '$user',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        email: "$user.email",
                        name: "$user.name",
                        rating: 1,
                        testimonialText: 1,
                        feature: 1,
                        submittedAt: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ]
        );
        return res.status(200).json({ success: true, testimonials , totalTestimonials: total, totalPages: Math.ceil(total / limit), currentPage: page });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

const deleteTestimonial = async (req, res) => {
    try {
        const { id } = req.params;
        const testimonial = await Testimonial.findByIdAndDelete(id);
        return res.status(200).json({ success: true, testimonial });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
const toggleTestmonial = async (req, res) => {
    try {
        const { id } = req.params;
        const testimonials = await Testimonial.findById(id);
        if (!testimonials) {
            return res.status(404).json({ success: false, message: "Testimonial not found" });
        }

        const test = await Testimonial.findByIdAndUpdate(id, { feature: !testimonials.feature });
        return res.status(200).json({ message: "Testimonials deleted successfully", test })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}


module.exports = {
    createTesrtimonial,
    getAllTestimonials,
    deleteTestimonial,
    toggleTestmonial,
}
