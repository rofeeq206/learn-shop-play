/**
 * API Client - Replace Supabase with your PHP backend
 * Place this file in: src/lib/apiClient.ts
 */

const API_BASE_URL = 'https://smarthubsec.com.ng/api';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// ============================================
// AUTHENTICATION
// ============================================

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      full_name: string | null;
      role?: string;
    };
    token: string;
  };
}

export const auth = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },
};

// ============================================
// PRODUCTS
// ============================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category_id: string | null;
  category_name?: string;
  category_slug?: string;
  stock_quantity: number;
  is_featured: boolean;
  rating: number | null;
  review_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      has_more?: boolean;
    };
  };
}

export const products = {
  // Get all products
  list: async (params?: {
    category?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProductsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.category) queryParams.append('category', params.category);
    if (params?.featured) queryParams.append('featured', '1');
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/products/list.php${queryString ? `?${queryString}` : ''}`;

    return apiRequest<ProductsResponse>(endpoint, {
      method: 'GET',
    });
  },

  // Get single product by slug or id
  getBySlug: async (slug: string): Promise<{ success: boolean; data: { product: Product } }> => {
    return apiRequest<{ success: boolean; data: { product: Product } }>(
      `/products/details.php?slug=${slug}`,
      { method: 'GET' }
    );
  },
};

// ============================================
// CATEGORIES
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export const categories = {
  // Get all categories
  list: async (): Promise<{ success: boolean; data: { categories: Category[] } }> => {
    return apiRequest<{ success: boolean; data: { categories: Category[] } }>(
      '/categories/list.php',
      { method: 'GET' }
    );
  },
};

// ============================================
// CART
// ============================================

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
  created_at: string;
  updated_at: string;
}

export const cart = {
  // Add item to cart
  add: async (productId: string, quantity: number = 1): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>('/cart/add.php', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  },

  // Get user's cart
  list: async (): Promise<{ success: boolean; data: { items: CartItem[] } }> => {
    return apiRequest<{ success: boolean; data: { items: CartItem[] } }>(
      '/cart/list.php',
      { method: 'GET' }
    );
  },

  // Update cart item quantity
  update: async (itemId: string, quantity: number): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>('/cart/update.php', {
      method: 'PUT',
      body: JSON.stringify({ item_id: itemId, quantity }),
    });
  },

  // Remove item from cart
  remove: async (itemId: string): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>('/cart/remove.php', {
      method: 'DELETE',
      body: JSON.stringify({ item_id: itemId }),
    });
  },

  // Clear entire cart
  clear: async (): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>('/cart/clear.php', {
      method: 'DELETE',
    });
  },
};

// ============================================
// ORDERS
// ============================================

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export const orders = {
  // Create new order
  create: async (orderData: {
    shipping_address: string;
    shipping_city: string;
    shipping_postal_code: string;
    shipping_country: string;
    payment_method: string;
    notes?: string;
  }): Promise<{ success: boolean; data: { order: Order } }> => {
    return apiRequest<{ success: boolean; data: { order: Order } }>('/orders/create.php', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Get user's orders
  list: async (): Promise<{ success: boolean; data: { orders: Order[] } }> => {
    return apiRequest<{ success: boolean; data: { orders: Order[] } }>(
      '/orders/list.php',
      { method: 'GET' }
    );
  },

  // Get single order details
  getById: async (orderId: string): Promise<{ success: boolean; data: { order: Order } }> => {
    return apiRequest<{ success: boolean; data: { order: Order } }>(
      `/orders/details.php?id=${orderId}`,
      { method: 'GET' }
    );
  },
};

// ============================================
// PROFILE
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const profile = {
  // Get current user profile
  get: async (): Promise<{ success: boolean; data: { profile: Profile } }> => {
    return apiRequest<{ success: boolean; data: { profile: Profile } }>(
      '/profile/get.php',
      { method: 'GET' }
    );
  },

  // Update user profile
  update: async (profileData: Partial<Profile>): Promise<{ success: boolean; message: string }> => {
    return apiRequest<{ success: boolean; message: string }>('/profile/update.php', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

export default {
  auth,
  products,
  categories,
  cart,
  orders,
  profile,
};
