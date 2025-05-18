const { getUserById } = require('../controllers/userController');
const User = require('../models/User');

// Mock the User model
jest.mock('../models/User');

describe('User Controller - getUserById', () => {
  let req;
  let res;
  
  beforeEach(() => {
    req = {
      params: {
        id: 'mockUserId'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should return user when user exists', async () => {
    // Arrange
    const mockUser = {
      _id: 'mockUserId',
      name: 'Test User',
      email: 'test@example.com'
    };
    
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    // Act
    await getUserById(req, res);
    
    // Assert
    expect(User.findById).toHaveBeenCalledWith('mockUserId');
    expect(res.json).toHaveBeenCalledWith(mockUser);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('should return 404 when user is not found', async () => {
    // Arrange
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    // Act
    await getUserById(req, res);

    // Assert
    expect(User.findById).toHaveBeenCalledWith('mockUserId');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  test('should return 500 when server error occurs', async () => {
    // Arrange
    const errorMessage = 'Database connection failed';
    User.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error(errorMessage))
    });
    console.error = jest.fn(); // Mock console.error

    // Act
    await getUserById(req, res);

    // Assert
    expect(User.findById).toHaveBeenCalledWith('mockUserId');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server error',
      error: errorMessage
    });
    expect(console.error).toHaveBeenCalled();
  });
});