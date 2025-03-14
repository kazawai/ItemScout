const Item = require('../models/Item');

// Get all items (with pagination)
exports.getItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get only items created by the current user
    const items = await Item.find({ user: req.user.id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const totalItems = await Item.countDocuments({ user: req.user.id });

    res.json({
      items,
      page,
      pages: Math.ceil(totalItems / limit),
      total: totalItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user owns the item
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to access this item' });
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new item
exports.createItem = async (req, res) => {
  try {
    const { name, description, coordinates, image } = req.body;

    const item = await Item.create({
      name,
      description,
      coordinates,
      image,
      user: req.user.id
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an existing item
exports.updateItem = async (req, res) => {
  try {
    const { name, description, coordinates, image } = req.body;
    
    let item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user owns the item
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to update this item' });
    }

    item = await Item.findByIdAndUpdate(
      req.params.id,
      { name, description, coordinates, image },
      { new: true, runValidators: true }
    );

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if user owns the item
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this item' });
    }

    await item.remove();

    res.json({ message: 'Item removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};