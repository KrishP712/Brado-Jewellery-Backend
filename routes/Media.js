const router = require('express').Router();
const multer = require('multer');
const { createMedia, getAllMedia, deleteMediaById } = require('../controllers/Media.controllers');
const path = require('path')
const storage = multer.diskStorage({
    destination: function (req, res, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });
router.post('/create', upload.array('media') , createMedia);
router.get('/all', getAllMedia);
router.delete('/delete/:id', deleteMediaById);

module.exports = router;


