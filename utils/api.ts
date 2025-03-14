import AsyncStorage from '@react-native-async-storage/async-storage';

const PROD_API_URL = 'https://itemscout.onrender.com/api';
const DEV_API_URL = 'http://192.168.100.33:5000/api';

const IS_PRODUCTION = process.env.EXPO_PUBLIC_NODE_ENV === 'production';
export const API_URL = IS_PRODUCTION ? PROD_API_URL : DEV_API_URL;

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Get the token from AsyncStorage
const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('token');
};

// Create headers with authentication token
const createHeaders = async (includeToken = true): Promise<HeadersInit_> => {
  const headers: HeadersInit_ = {
    'Content-Type': 'application/json',
  };

  if (includeToken) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// API client methods
export const api = {
  // Auth endpoints
  async register(name: string, email: string, password: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: await createHeaders(false),
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Registration failed' };
      }

      // Save token to AsyncStorage
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
      }));

      return { data };
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'Network error' };
    }
  },

  async login(email: string, password: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: await createHeaders(false),
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Login failed' };
      }

      // Save token to AsyncStorage
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
      }));

      return { data };
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Network error' };
    }
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  // Items endpoints
  async getItems(page = 1, limit = 10): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_URL}/items?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: await createHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Failed to fetch items' };
      }

      return { data };
    } catch (error) {
      console.error('Get items error:', error);
      return { error: 'Network error' };
    }
  },

  async createItem(item: { name: string; description: string; coordinates?: string; image?: string }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: await createHeaders(),
        body: JSON.stringify(item),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Failed to create item' };
      }

      return { data };
    } catch (error) {
      console.error('Create item error:', error);
      return { error: 'Network error' };
    }
  },

  async uploadImage(imageUri: string): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg', // Adjust as needed
        name: 'photo.jpg',
      } as any);

      const token = await getToken();
      const response = await fetch(`${API_URL}/items/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.message || 'Failed to upload image' };
      }

      return { data };
    } catch (error) {
      console.error('Upload image error:', error);
      return { error: 'Network error' };
    }
  },

  async getItemById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_URL}/items/${id}`, {
        method: 'GET',
        headers: await createHeaders(),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        return { error: data.message || 'Failed to fetch item details' };
      }
  
      // Normalize image URL if present
      if (data.image) {
        data.image = data.image.replace(/\\/g, '/');
      }
  
      return { data };
    } catch (error) {
      console.error('Get item details error:', error);
      return { error: 'Network error' };
    }
  },

  async getUserById(id: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'GET',
        headers: await createHeaders(),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        return { error: data.message || 'Failed to fetch user details' };
      }
  
      return { data };
    } catch (error) {
      console.error('Get user details error:', error);
      return { error: 'Network error' };
    }
  }
};