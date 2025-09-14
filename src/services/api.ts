import { Table, MenuItem, Order, OrderItem, User, OrderStatus } from '../types/database';

const API_BASE_URL = 'http://localhost:3001/api';

// Simple event emitter for real-time updates
class EventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  emit(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }
}

const eventEmitter = new EventEmitter();

export class ApiService {
  // Helper method for API calls
  private static async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'API call failed');
    }

    return response.json();
  }

  // User methods
  static async createUser(mobileNumber: string): Promise<User> {
    // This is handled in the initialize order endpoint
    return { id: '', mobile_number: mobileNumber, created_at: '' };
  }

  // Table methods
  static async getTable(tableNumber: string): Promise<Table | null> {
    return this.apiCall(`/tables/${tableNumber}`);
  }

  static async lockTable(tableId: string, uniqueCode: string): Promise<void> {
    // This is handled in the initialize order endpoint
  }

  static async unlockTable(tableId: string): Promise<void> {
    // This is handled in the order status update endpoint
  }

  static async validateTableCode(tableNumber: string, code: string): Promise<boolean> {
    // This functionality is handled by the getOrderByCode method
    const order = await this.getOrderByCode(code);
    return order !== null && order.tables?.table_number === tableNumber;
  }

  // Menu methods
  static async getMenu(): Promise<MenuItem[]> {
    return this.apiCall('/menu');
  }

  // Order methods
  static async createOrder(tableId: string, uniqueCode: string): Promise<Order> {
    // This is handled in the initialize order endpoint
    throw new Error('Use initializeOrder instead');
  }

  static async getActiveOrder(tableId: string): Promise<Order | null> {
    // This is handled in the initialize order endpoint
    throw new Error('Use initializeOrder instead');
  }

  static async getOrderByCode(uniqueCode: string): Promise<Order | null> {
    return this.apiCall(`/orders/code/${uniqueCode}`);
  }

  static async addOrderItem(orderId: string, menuId: string, quantity: number): Promise<void> {
    await this.apiCall(`/orders/${orderId}/items`, {
      method: 'POST',
      body: JSON.stringify({ menuId, quantity }),
    });

    // Emit event for real-time updates
    eventEmitter.emit('order_updated', { orderId });
  }

  static async removeOrderItem(orderItemId: string): Promise<void> {
    await this.apiCall(`/order-items/${orderItemId}/quantity`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: 0 }),
    });
    
    // Emit event for real-time updates
    eventEmitter.emit('order_updated', { orderItemId });
  }

  static async updateOrderItemQuantity(orderItemId: string, quantity: number): Promise<void> {
    await this.apiCall(`/order-items/${orderItemId}/quantity`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    
    // Emit event for real-time updates
    eventEmitter.emit('order_updated', { orderItemId });
  }

  // Kitchen Dashboard methods
  static async getAllActiveOrders(): Promise<Order[]> {
    return this.apiCall('/orders/active');
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    await this.apiCall(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });

    // Emit event for real-time updates
    eventEmitter.emit('order_status_updated', { orderId, status });
  }

  // Real-time subscriptions (simplified)
  static subscribeToOrders(callback: (orders: Order[]) => void) {
    const updateCallback = async () => {
      try {
        const orders = await this.getAllActiveOrders();
        callback(orders);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };

    eventEmitter.on('order_created', updateCallback);
    eventEmitter.on('order_updated', updateCallback);
    eventEmitter.on('order_status_updated', updateCallback);

    // Poll for updates every 5 seconds as a fallback
    const pollInterval = setInterval(updateCallback, 5000);

    // Return unsubscribe function
    return {
      unsubscribe: () => {
        eventEmitter.off('order_created', updateCallback);
        eventEmitter.off('order_updated', updateCallback);
        eventEmitter.off('order_status_updated', updateCallback);
        clearInterval(pollInterval);
      }
    };
  }

  static async initializeOrder(tableNumber: string, mobileNumber: string): Promise<{ order: Order; uniqueCode: string; isNewOrder: boolean }> {
    return this.apiCall('/orders/initialize', {
      method: 'POST',
      body: JSON.stringify({ tableNumber, mobileNumber }),
    });
  }

  // Admin methods for managing tables and menu
  static async getAllTables(): Promise<Table[]> {
    return this.apiCall('/tables');
  }

  static async addTable(tableNumber: string): Promise<void> {
    await this.apiCall('/tables', {
      method: 'POST',
      body: JSON.stringify({ table_number: tableNumber }),
    });
  }

  static async updateTable(tableId: string, tableNumber: string): Promise<void> {
    await this.apiCall(`/tables/${tableId}`, {
      method: 'PUT',
      body: JSON.stringify({ table_number: tableNumber }),
    });
  }

  static async deleteTable(tableId: string): Promise<void> {
    await this.apiCall(`/tables/${tableId}`, {
      method: 'DELETE',
    });
  }

  static async getAllMenuItems(): Promise<MenuItem[]> {
    return this.apiCall('/menu/all');
  }

  static async addMenuItem(item: Omit<MenuItem, 'id' | 'created_at'>): Promise<void> {
    await this.apiCall('/menu', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  static async updateMenuItem(itemId: string, item: Partial<MenuItem>): Promise<void> {
    await this.apiCall(`/menu/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  static async deleteMenuItem(itemId: string): Promise<void> {
    await this.apiCall(`/menu/${itemId}`, {
      method: 'DELETE',
    });
  }
}