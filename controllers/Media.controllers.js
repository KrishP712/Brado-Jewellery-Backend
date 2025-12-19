
const Media = require('../model/media')
const fs = require('fs');
// CREATE media
const createMedia = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ success: false, message: "No file uploaded!" });
    }

    const { type } = req.body;

    const mediaDocs = req.files.map(file => ({
      type,
      media: `https://brado-jewellery-backend-2gq8.onrender.com/uploads${file.filename}`,
      size: file.size,
    }));

    const mediaData = await Media.create(mediaDocs);

    res.status(201).json({ success: true, message: "Media created successfully!", mediaData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET all media
const getAllMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;   
    const limit = parseInt(req.query.limit) || 12; 
    const skip = (page - 1) * limit;
    
    const total = await Media.countDocuments();
    const media = await Media.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      message: "All media fetched successfully!",
      media,
      totalMedia: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// DELETE media by ID
const deleteMediaById = async (req, res) => {
  try {
    const media = await Media.findByIdAndDelete(req.params.id);
    if (!media) return res.status(404).json({ success: false, message: "Media not found!" });

    const filePath = media.media.split('/')[media.media.split('/').length - 1]
    fs.unlinkSync(`uploads/${filePath}`);
    res.status(200).json({ success: true, message: "Media deleted successfully!", media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createMedia, getAllMedia, deleteMediaById };
