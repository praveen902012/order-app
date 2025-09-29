import { Order, Table, MenuItem, OrderStatus, OrderItem } from '../types/database';

// API Service for Restaurant Ordering System
const API_BASE_URL = 'http://localhost:3001';

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

  // Initialize order (table login)
  async initializeOrder(tableNumber: string, mobileNumber: string): Promise<{
    order: Order;
    uniqueCode: string;
  }> {
    return this.request('/api/orders/initialize', {
      method: 'POST',
      body: JSON.stringify({ tableNumber, mobileNumber }),
    });
  }

  // Get order by code
  async getOrderByCode(orderCode: string): Promise<Order | null> {
    try {
      return await this.request<Order>(`/api/orders/code/${orderCode}`);
    } catch (error) {
      return null;
    }
  }

  // Menu operations
  async getMenu(): Promise<MenuItem[]> {
    return this.request<MenuItem[]>('/api/menu');
  }

  async getAllMenuItems(): Promise<MenuItem[]> {
    return this.request<MenuItem[]>('/api/menu/all');
  }

  async addMenuItem(item: {
    name: string;
    category: string;
    price: number;
    description: string | null;
    image_url: string | null;
    is_available: boolean;
  }): Promise<MenuItem> {
    return this.request<MenuItem>('/api/menu', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateMenuItem(itemId: string, updates: {
    name?: string;
    category?: string;
    price?: number;
    description?: string | null;
    image_url?: string | null;
    is_available?: boolean;
  }): Promise<MenuItem> {
    return this.request<MenuItem>(`/api/menu/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMenuItem(itemId: string): Promise<void> {
    return this.request<void>(`/api/menu/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Table operations
  async getAllTables(): Promise<Table[]> {
    return this.request<Table[]>('/api/tables');
  }

  async addTable(tableNumber: string): Promise<Table> {
    return this.request<Table>('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ 
        table_number: tableNumber,
        floor: 'Ground Floor',
        seating_capacity: 4
      }),
    });
  }

  async updateTable(tableId: string, updates: {
    table_number?: string;
    floor?: string;
    seating_capacity?: number;
  }): Promise<Table> {
    return this.request<Table>(`/api/tables/${tableId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTable(tableId: string): Promise<void> {
    return this.request<void>(`/api/tables/${tableId}`, {
      method: 'DELETE',
    });
  }

  // Order operations
  async getAllActiveOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/orders/active');
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return this.request<Order>(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Order items operations
  async addOrderItem(orderId: string, menuItemId: string, quantity: number, createNewOrder: boolean = false): Promise<{ success: boolean; orderId?: string }> {
    return this.request<{ success: boolean; orderId?: string }>(`/api/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify({ menuId: menuItemId, quantity, createNewOrder }),
    });
  }

  async updateOrderItemQuantity(itemId: string, quantity: number): Promise<OrderItem> {
    return this.request<OrderItem>(`/api/order-items/${itemId}/quantity`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  // Real-time subscriptions (mock implementation)
  subscribeToOrders(callback: (orders: Order[]) => void) {
    // Simple polling implementation for real-time updates
    const interval = setInterval(async () => {
      try {
        const orders = await this.getAllActiveOrders();
        callback(orders);
      } catch (error) {
        console.error('Failed to fetch orders for subscription:', error);
      }
    }, 5000); // Poll every 5 seconds

    return {
      unsubscribe: () => clearInterval(interval)
    };
  }

  // Order history operations
  async getOrderHistory(filters: {
    filterType: 'dateRange' | 'month' | 'year';
    startDate?: string;
    endDate?: string;
    month?: string;
    year?: string;
  }): Promise<{
    orders: any[];
    analytics: {
      totalOrders: number;
      totalSales: number;
      totalItems: number;
      averageOrder: number;
    };
  }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    return this.request<{
      orders: any[];
      analytics: {
        totalOrders: number;
        totalSales: number;
        totalItems: number;
        averageOrder: number;
      };
    }>(`/api/orders/history?${params.toString()}`);
  }
}

// Export both the class and an instance
export { ApiService };
export const apiService = new ApiService();