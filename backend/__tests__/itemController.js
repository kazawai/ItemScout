const Item = require("../models/Item");

const {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getItemSearch,
} = require("../controllers/itemController");

// Mock the Item model
jest.mock("../models/Item");

describe("Item Controller", () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock console.error to avoid cluttering test output
    console.error = jest.fn();

    // Setup request and response objects
    req = {
      params: {},
      query: {},
      body: {},
      user: { id: "user123" },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("getItems", () => {
    test("should get all items with pagination", async () => {
      // Arrange
      const mockItems = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];
      req.query = { page: "2", limit: "5" };

      Item.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockItems),
      });

      Item.countDocuments.mockResolvedValue(12);

      // Act
      await getItems(req, res);

      // Assert
      expect(Item.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        items: mockItems,
        page: 2,
        pages: 3, // 12 items / 5 per page = 3 pages
        total: 12,
      });
    });

    test("should handle default pagination values", async () => {
      // Arrange
      const mockItems = [{ id: "1", name: "Item 1" }];
      req.query = {};

      Item.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockItems),
      });

      Item.countDocuments.mockResolvedValue(5);

      // Act
      await getItems(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        items: mockItems,
        page: 1, // Default page
        pages: 1, // 5 items / 10 per page = 1 page
        total: 5,
      });
    });

    test("should handle server errors", async () => {
      // Arrange
      Item.find.mockImplementation(() => {
        throw new Error("Database error");
      });

      // Act
      await getItems(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "Database error",
      });
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getItemById", () => {
    test("should return item when found and user is authorized", async () => {
      // Arrange
      const mockItem = {
        _id: "item123",
        name: "Test Item",
        user: "user123",
        toString: jest.fn().mockReturnValue("user123"),
      };
      req.params.id = "item123";

      Item.findById.mockResolvedValue(mockItem);

      // Act
      await getItemById(req, res);

      // Assert
      expect(Item.findById).toHaveBeenCalledWith("item123");
      expect(res.json).toHaveBeenCalledWith(mockItem);
    });

    test("should return 404 when item is not found", async () => {
      // Arrange
      req.params.id = "nonexistent";
      Item.findById.mockResolvedValue(null);

      // Act
      await getItemById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Item not found" });
    });

    test("should return 401 when user is not authorized", async () => {
      // Arrange
      const mockItem = {
        _id: "item123",
        name: "Test Item",
        user: "otherUser",
        toString: jest.fn().mockReturnValue("otherUser"),
      };
      req.params.id = "item123";
      req.user.id = "user123"; // Different from item.user

      Item.findById.mockResolvedValue(mockItem);

      // Act
      await getItemById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "User not authorized to access this item",
      });
    });

    test("should handle server errors", async () => {
      // Arrange
      req.params.id = "item123";
      Item.findById.mockImplementation(() => {
        throw new Error("Database error");
      });

      // Act
      await getItemById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "Database error",
      });
    });
  });

  describe("createItem", () => {
    test("should create a new item successfully", async () => {
      // Arrange
      const newItem = {
        name: "New Item",
        description: "Test description",
        coordinates: { lat: 40.712776, lng: -74.005974 },
        image: "image-url.jpg",
      };

      req.body = newItem;
      req.user.id = "user123";

      const createdItem = { ...newItem, _id: "item123", user: "user123" };
      Item.create.mockResolvedValue(createdItem);

      // Act
      await createItem(req, res);

      // Assert
      expect(Item.create).toHaveBeenCalledWith({
        ...newItem,
        user: "user123",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdItem);
    });

    test("should handle server errors", async () => {
      // Arrange
      req.body = { name: "Test Item" };
      Item.create.mockImplementation(() => {
        throw new Error("Validation error");
      });

      // Act
      await createItem(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "Validation error",
      });
    });
  });

  describe("updateItem", () => {
    test("should update item when found and user is authorized", async () => {
      // Arrange
      const itemId = "item123";
      const updateData = {
        name: "Updated Item",
        description: "Updated description",
        coordinates: { lat: 40.7, lng: -74.0 },
        image: "updated-image.jpg",
      };

      req.params.id = itemId;
      req.body = updateData;
      req.user.id = "user123";

      const existingItem = {
        _id: itemId,
        user: "user123",
        toString: jest.fn().mockReturnValue("user123"),
      };

      const updatedItem = { ...existingItem, ...updateData };

      Item.findById.mockResolvedValue(existingItem);
      Item.findByIdAndUpdate.mockResolvedValue(updatedItem);

      // Act
      await updateItem(req, res);

      // Assert
      expect(Item.findByIdAndUpdate).toHaveBeenCalledWith(itemId, updateData, {
        new: true,
        runValidators: true,
      });
      expect(res.json).toHaveBeenCalledWith(updatedItem);
    });

    test("should return 404 when item to update is not found", async () => {
      // Arrange
      req.params.id = "nonexistent";
      Item.findById.mockResolvedValue(null);

      // Act
      await updateItem(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Item not found" });
      expect(Item.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test("should return 401 when user is not authorized to update", async () => {
      // Arrange
      const itemId = "item123";
      req.params.id = itemId;
      req.user.id = "user123";

      const existingItem = {
        _id: itemId,
        user: "otherUser",
        toString: jest.fn().mockReturnValue("otherUser"),
      };

      Item.findById.mockResolvedValue(existingItem);

      // Act
      await updateItem(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "User not authorized to update this item",
      });
      expect(Item.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test("should handle server errors", async () => {
      // Arrange
      req.params.id = "item123";
      Item.findById.mockImplementation(() => {
        throw new Error("Database error");
      });

      // Act
      await updateItem(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "Database error",
      });
    });
  });

  describe("deleteItem", () => {
    test("should delete item when found and user is authorized", async () => {
      // Arrange
      const itemId = "item123";
      req.params.id = itemId;
      req.user.id = "user123";

      const existingItem = {
        _id: itemId,
        user: "user123",
        toString: jest.fn().mockReturnValue("user123"),
        deleteOne: jest.fn().mockResolvedValue({}),
      };

      Item.findById.mockResolvedValue(existingItem);

      // Act
      await deleteItem(req, res);

      // Assert
      expect(Item.findById).toHaveBeenCalledWith(itemId);
      expect(existingItem.deleteOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: "Item removed" });
    });

    test("should return 404 when item to delete is not found", async () => {
      // Arrange
      req.params.id = "nonexistent";
      Item.findById.mockResolvedValue(null);

      // Act
      await deleteItem(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Item not found" });
    });

    test("should return 401 when user is not authorized to delete", async () => {
      // Arrange
      const itemId = "item123";
      req.params.id = itemId;
      req.user.id = "user123";

      const existingItem = {
        _id: itemId,
        user: "otherUser",
        toString: jest.fn().mockReturnValue("otherUser"),
      };

      Item.findById.mockResolvedValue(existingItem);

      // Act
      await deleteItem(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "User not authorized to delete this item",
      });
    });

    test("should handle server errors", async () => {
      // Arrange
      req.params.id = "item123";
      Item.findById.mockImplementation(() => {
        throw new Error("Database error");
      });

      // Act
      await deleteItem(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "Database error",
      });
    });
  });

  describe("getItemSearch", () => {
    test("should return items matching search query", async () => {
      // Arrange
      const mockItems = [
        { _id: "1", name: "Test Chair" },
        { _id: "2", name: "Test Table" },
      ];

      req.query = {
        search: "Test",
        page: "1",
        limit: "10",
      };

      Item.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockItems),
      });

      // Act
      await getItemSearch(req, res);

      // Assert
      expect(Item.find).toHaveBeenCalledWith({
        name: { $regex: "Test", $options: "i" },
      });
      expect(res.json).toHaveBeenCalledWith(mockItems);
    });

    test("should return 400 when search query is empty", async () => {
      // Arrange
      req.query = {
        page: "1",
        limit: "10",
      };

      // Act
      await getItemSearch(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Search query is required",
      });
      expect(Item.find).not.toHaveBeenCalled();
    });

    test("should handle server errors", async () => {
      // Arrange
      req.query = { search: "Test" };
      Item.find.mockImplementation(() => {
        throw new Error("Database error");
      });

      // Act
      await getItemSearch(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Server error",
        error: "Database error",
      });
    });
  });
});
