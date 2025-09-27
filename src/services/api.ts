// API Service for Restaurant Ordering System
const API_BASE_URL = 'http://localhost:3001';

export interface User {
  id: string;
  mobile_number: string;
  created_at: string;
}

export interface Table {
  id: string;
  table_number: string;
  is_occupied: boolean;
  current_order_id?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  table_id: string;
  order_code: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price: number;
}

export interface OrderWithDetails extends Order {
  table_number: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // User operations
  async createUser(mobileNumber: string): Promise<User> {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ mobile_number: mobileNumber }),
    });
  }

  // Table operations
  async getTables(): Promise<Table[]> {
    return this.request<Table[]>('/api/tables');
  }

  async getTable(tableNumber: string): Promise<Table> {
    return this.request<Table>(`/api/tables/${tableNumber}`);
  }

  async loginToTable(tableNumber: string, mobileNumber: string): Promise<{
    user: User;
    table: Table;
    order: Order;
  }> {
    return this.request('/api/tables/login', {
      method: 'POST',
      body: JSON.stringify({ table_number: tableNumber, mobile_number: mobileNumber }),
    });
  }

  // Menu operations
  async getMenu(): Promise<MenuItem[]> {
    return this.request<MenuItem[]>('/api/menu');
  }

  // Order operations
  async getOrder(orderId: string): Promise<OrderWithDetails> {
    return this.request<OrderWithDetails>(`/api/orders/${orderId}`);
  }

  async getOrderByCode(orderCode: string): Promise<OrderWithDetails> {
    return this.request<OrderWithDetails>(`/api/orders/code/${orderCode}`);
  }

  async getAllOrders(): Promise<OrderWithDetails[]> {
    return this.request<OrderWithDetails[]>('/api/orders');
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order> {
    return this.request<Order>(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Order items operations
  async addOrderItem(orderId: string, menuItemId: string, quantity: number): Promise<OrderItem> {
    return this.request<OrderItem>('/api/order-items', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, menu_item_id: menuItemId, quantity }),
    });
  }

  async updateOrderItem(itemId: string, quantity: number): Promise<OrderItem> {
    return this.request<OrderItem>(`/api/order-items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeOrderItem(itemId: string): Promise<void> {
    return this.request<void>(`/api/order-items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // QR Code operations
  async generateQRCode(tableNumber: string): Promise<{ qrCodeUrl: string }> {
    return this.request<{ qrCodeUrl: string }>(`/api/qr/generate/${tableNumber}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/api/health');
  }
}

export const apiService = new ApiService();