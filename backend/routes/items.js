const express = require('express');
const {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
} = require('../controllers/itemController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getItems)
  .post(createItem);

router.route('/:id')
  .get(getItemById)
  .put(updateItem)
  .delete(deleteItem);

router.post('/upload', upload.single('image'), (req, res) => {
  try {
    const filePath = req.file.path.replace(/^uploads\//, '');
    res.json({
      imageUrl: `${req.protocol}://${req.get('host')}/uploads/${filePath}`
    });
    console.log('File uploaded:', req.file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
  });

module.exports = router;