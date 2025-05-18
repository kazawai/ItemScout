const jwt = require('jsonwebtoken');
const { register, login, getCurrentUser } = require('../controllers/authController');
const User = require('../models/User');

// Mock dependencies
jest.mock('../models/User');
jest.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let req, res;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console.error to avoid cluttering test output
    console.error = jest.fn();
    
    // Setup request and response objects
    req = {
      body: {},
      user: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    // Setup default JWT mock
    process.env.JWT_SECRET = 'test-secret';
    jwt.sign.mockReturnValue('test-token');
  });

  describe('register', () => {
    test('should register a user and return a JWT token', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      };
      
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      
      // Act
      await register(req, res);
      
      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(User.create).toHaveBeenCalledWith(req.body);
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        token: 'test-token'
      });
    });

    test('should return 400 if user already exists', async () => {
      // Arrange
      req.body = {
        email: 'existing@example.com',
        password: 'password123'
      };
      
      User.findOne.mockResolvedValue({ email: 'existing@example.com' });
      
      // Act
      await register(req, res);
      
      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
      expect(User.create).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
    });

    test('should return 500 on server error during registration', async () => {
      // Arrange
      req.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const errorMessage = 'Database connection failed';
      User.findOne.mockRejectedValue(new Error(errorMessage));
      
      // Act
      await register(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: errorMessage
      });
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    test('should login user and return a JWT token', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Act
      await login(req, res);
      
      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user123' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      expect(res.json).toHaveBeenCalledWith({
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        token: 'test-token'
      });
    });

    test('should return 401 if user is not found', async () => {
      // Arrange
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };
      
      User.findOne.mockResolvedValue(null);
      
      // Act
      await login(req, res);
      
      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    test('should return 401 if password is incorrect', async () => {
      // Arrange
      const mockUser = {
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      
      req.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Act
      await login(req, res);
      
      // Assert
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    test('should return 500 on server error during login', async () => {
      // Arrange
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const errorMessage = 'Database error';
      User.findOne.mockRejectedValue(new Error(errorMessage));
      
      // Act
      await login(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: errorMessage
      });
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    test('should return current user profile', async () => {
      // Arrange
      req.user = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      };
      
      // Act
      await getCurrentUser(req, res);
      
      // Assert
      expect(res.json).toHaveBeenCalledWith({
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com'
      });
    });

    test('should return 500 on server error when getting current user', async () => {
      // Arrange
      req.user = null; // Will cause error when accessing properties
      
      // Act
      await getCurrentUser(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error',
        error: expect.any(String)
      });
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('JWT functionality', () => {
    test('should use correct parameters when generating JWT token', async () => {
      // Arrange
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      
      req.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      User.findOne.mockResolvedValue(mockUser);
      
      // Act
      await login(req, res);
      
      // Assert JWT token generation
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
    });

    test('should generate different tokens for different users', async () => {
      // Arrange for first user
      const firstUser = {
        _id: 'user1',
        name: 'First User',
        email: 'first@example.com'
      };
      
      req.body = {
        name: 'First User',
        email: 'first@example.com',
        password: 'password123'
      };
      
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(firstUser);
      jwt.sign.mockReturnValueOnce('token-for-user1');
      
      // Act for first user
      await register(req, res);
      
      // Verify first token generation
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user1' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'token-for-user1'
      }));
      
      // Setup for second user
      jest.clearAllMocks();
      const secondUser = {
        _id: 'user2',
        name: 'Second User',
        email: 'second@example.com'
      };
      
      req.body = {
        name: 'Second User',
        email: 'second@example.com',
        password: 'password456'
      };
      
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(secondUser);
      jwt.sign.mockReturnValueOnce('token-for-user2');
      
      // Act for second user
      await register(req, res);
      
      // Verify second token generation
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: 'user2' },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'token-for-user2'
      }));
    });
  });
});