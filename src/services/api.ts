import { db } from '../lib/database';
import { Table, MenuItem, Order, OrderItem, User, OrderStatus } from '../types/database';
import { generateUniqueCode } from '../lib/qr-utils';

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
  // User methods
  static async createUser(mobileNumber: string): Promise<User> {
    const stmt = db.prepare(`
      INSERT INTO users (mobile_number) 
      VALUES (?)
    `);
    
    const result = stmt.run(mobileNumber);
    
    const user = db.prepare('SELECT * FROM users WHERE rowid = ?').get(result.lastInsertRowid) as User;
    return user;
  }

  // Table methods
  static async getTable(tableNumber: string): Promise<Table | null> {
    const stmt = db.prepare('SELECT * FROM tables WHERE table_number = ?');
    const table = stmt.get(tableNumber) as Table | undefined;
    return table || null;
  }

  static async lockTable(tableId: string, uniqueCode: string): Promise<void> {
    const stmt = db.prepare(`
      UPDATE tables 
      SET locked = 1, unique_code = ? 
      WHERE id = ?
    `);
    stmt.run(uniqueCode, tableId);
  }

  static async unlockTable(tableId: string): Promise<void> {
    const stmt = db.prepare(`
      UPDATE tables 
      SET locked = 0, unique_code = NULL 
      WHERE id = ?
    `);
    stmt.run(tableId);
  }

  static async validateTableCode(tableNumber: string, code: string): Promise<boolean> {
    const stmt = db.prepare(`
      SELECT unique_code, locked 
      FROM tables 
      WHERE table_number = ?
    `);
    const table = stmt.get(tableNumber) as { unique_code: string | null; locked: number } | undefined;
    
    if (!table) return false;
    return table.locked === 1 && table.unique_code === code;
  }

  // Menu methods
  static async getMenu(): Promise<MenuItem[]> {
    const stmt = db.prepare(`
      SELECT * FROM menu 
      WHERE is_available = 1 
      ORDER BY category
    `);
    return stmt.all() as MenuItem[];
  }

  // Order methods
  static async createOrder(tableId: string, uniqueCode: string): Promise<Order> {
    const stmt = db.prepare(`
      INSERT INTO orders (table_id, unique_code, status) 
      VALUES (?, ?, 'Pending')
    `);
    
    const result = stmt.run(tableId, uniqueCode);
    
    const order = db.prepare('SELECT * FROM orders WHERE rowid = ?').get(result.lastInsertRowid) as Order;
    
    // Emit event for real-time updates
    eventEmitter.emit('order_created', order);
    
    return order;
  }

  static async getActiveOrder(tableId: string): Promise<Order | null> {
    const stmt = db.prepare(`
      SELECT o.*, t.table_number
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.table_id = ? AND o.status != 'Served'
      ORDER BY o.created_at DESC
      LIMIT 1
    `);
    
    const order = stmt.get(tableId) as (Order & { table_number: string }) | undefined;
    
    if (!order) return null;

    // Get order items with menu details
    const itemsStmt = db.prepare(`
      SELECT oi.*, m.name, m.category, m.price, m.description
      FROM order_items oi
      LEFT JOIN menu m ON oi.menu_id = m.id
      WHERE oi.order_id = ?
    `);
    
    const orderItems = itemsStmt.all(order.id) as (OrderItem & {
      name: string;
      category: string;
      price: number;
      description: string;
    })[];

    // Transform to match expected structure
    const transformedOrder: Order = {
      ...order,
      tables: {
        id: tableId,
        table_number: order.table_number,
        unique_code: null,
        locked: false,
        created_at: ''
      },
      order_items: orderItems.map(item => ({
        id: item.id,
        order_id: item.order_id,
        menu_id: item.menu_id,
        quantity: item.quantity,
        created_at: item.created_at,
        menu: {
          id: item.menu_id,
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          is_available: true,
          created_at: ''
        }
      }))
    };

    return transformedOrder;
  }

  static async getOrderByCode(uniqueCode: string): Promise<Order | null> {
    const stmt = db.prepare(`
      SELECT o.*, t.table_number, t.id as table_id
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.unique_code = ? AND o.status != 'Served'
    `);
    
    const order = stmt.get(uniqueCode) as (Order & { table_number: string; table_id: string }) | undefined;
    
    if (!order) return null;

    // Get order items with menu details
    const itemsStmt = db.prepare(`
      SELECT oi.*, m.name, m.category, m.price, m.description
      FROM order_items oi
      LEFT JOIN menu m ON oi.menu_id = m.id
      WHERE oi.order_id = ?
    `);
    
    const orderItems = itemsStmt.all(order.id) as (OrderItem & {
      name: string;
      category: string;
      price: number;
      description: string;
    })[];

    // Transform to match expected structure
    const transformedOrder: Order = {
      ...order,
      tables: {
        id: order.table_id,
        table_number: order.table_number,
        unique_code: uniqueCode,
        locked: true,
        created_at: ''
      },
      order_items: orderItems.map(item => ({
        id: item.id,
        order_id: item.order_id,
        menu_id: item.menu_id,
        quantity: item.quantity,
        created_at: item.created_at,
        menu: {
          id: item.menu_id,
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          is_available: true,
          created_at: ''
        }
      }))
    };

    return transformedOrder;
  }

  static async addOrderItem(orderId: string, menuId: string, quantity: number): Promise<void> {
    // Check if item already exists in order
    const existingStmt = db.prepare(`
      SELECT * FROM order_items 
      WHERE order_id = ? AND menu_id = ?
    `);
    const existingItem = existingStmt.get(orderId, menuId) as OrderItem | undefined;

    if (existingItem) {
      // Update existing item quantity
      const updateStmt = db.prepare(`
        UPDATE order_items 
        SET quantity = quantity + ? 
        WHERE id = ?
      `);
      updateStmt.run(quantity, existingItem.id);
    } else {
      // Create new item
      const insertStmt = db.prepare(`
        INSERT INTO order_items (order_id, menu_id, quantity) 
        VALUES (?, ?, ?)
      `);
      insertStmt.run(orderId, menuId, quantity);
    }

    // Emit event for real-time updates
    eventEmitter.emit('order_updated', { orderId });
  }

  static async removeOrderItem(orderItemId: string): Promise<void> {
    const stmt = db.prepare('DELETE FROM order_items WHERE id = ?');
    stmt.run(orderItemId);
    
    // Emit event for real-time updates
    eventEmitter.emit('order_updated', { orderItemId });
  }

  static async updateOrderItemQuantity(orderItemId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeOrderItem(orderItemId);
      return;
    }

    const stmt = db.prepare(`
      UPDATE order_items 
      SET quantity = ? 
      WHERE id = ?
    `);
    stmt.run(quantity, orderItemId);
    
    // Emit event for real-time updates
    eventEmitter.emit('order_updated', { orderItemId });
  }

  // Kitchen Dashboard methods
  static async getAllActiveOrders(): Promise<Order[]> {
    const stmt = db.prepare(`
      SELECT o.*, t.table_number
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.status != 'Served'
      ORDER BY o.created_at ASC
    `);
    
    const orders = stmt.all() as (Order & { table_number: string })[];
    
    // Get order items for each order
    const ordersWithItems = orders.map(order => {
      const itemsStmt = db.prepare(`
        SELECT oi.*, m.name, m.category, m.price, m.description
        FROM order_items oi
        LEFT JOIN menu m ON oi.menu_id = m.id
        WHERE oi.order_id = ?
      `);
      
      const orderItems = itemsStmt.all(order.id) as (OrderItem & {
        name: string;
        category: string;
        price: number;
        description: string;
      })[];

      return {
        ...order,
        tables: {
          id: order.table_id,
          table_number: order.table_number,
          unique_code: order.unique_code,
          locked: true,
          created_at: ''
        },
        order_items: orderItems.map(item => ({
          id: item.id,
          order_id: item.order_id,
          menu_id: item.menu_id,
          quantity: item.quantity,
          created_at: item.created_at,
          menu: {
            id: item.menu_id,
            name: item.name,
            category: item.category,
            price: item.price,
            description: item.description,
            is_available: true,
            created_at: ''
          }
        }))
      };
    });

    return ordersWithItems;
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const stmt = db.prepare(`
      UPDATE orders 
      SET status = ? 
      WHERE id = ?
    `);
    stmt.run(status, orderId);

    // If order is served, unlock the table
    if (status === 'Served') {
      const orderStmt = db.prepare('SELECT table_id FROM orders WHERE id = ?');
      const order = orderStmt.get(orderId) as { table_id: string } | undefined;
      
      if (order) {
        await this.unlockTable(order.table_id);
      }
    }

    // Emit event for real-time updates
    eventEmitter.emit('order_status_updated', { orderId, status });
  }

  // Real-time subscriptions (simplified)
  static subscribeToOrders(callback: (orders: Order[]) => void) {
    const updateCallback = async () => {
      const orders = await this.getAllActiveOrders();
      callback(orders);
    };

    eventEmitter.on('order_created', updateCallback);
    eventEmitter.on('order_updated', updateCallback);
    eventEmitter.on('order_status_updated', updateCallback);

    // Return unsubscribe function
    return {
      unsubscribe: () => {
        eventEmitter.off('order_created', updateCallback);
        eventEmitter.off('order_updated', updateCallback);
        eventEmitter.off('order_status_updated', updateCallback);
      }
    };
  }

  static async initializeOrder(tableNumber: string, mobileNumber: string): Promise<{ order: Order; uniqueCode: string; isNewOrder: boolean }> {
    // Get table
    const table = await this.getTable(tableNumber);
    if (!table) throw new Error('Table not found');

    // Check if table is locked with existing order
    if (table.locked && table.unique_code) {
      const existingOrder = await this.getActiveOrder(table.id);
      if (existingOrder) {
        return { order: existingOrder, uniqueCode: table.unique_code, isNewOrder: false };
      }
    }

    // Create new order
    const uniqueCode = generateUniqueCode();
    await this.lockTable(table.id, uniqueCode);
    
    const order = await this.createOrder(table.id, uniqueCode);
    await this.createUser(mobileNumber);

    return { order, uniqueCode, isNewOrder: true };
  }

  // Admin methods for managing tables and menu
  static async getAllTables(): Promise<Table[]> {
    const stmt = db.prepare('SELECT * FROM tables ORDER BY table_number');
    return stmt.all() as Table[];
  }

  static async addTable(tableNumber: string): Promise<void> {
    const stmt = db.prepare('INSERT INTO tables (table_number) VALUES (?)');
    stmt.run(tableNumber);
  }

  static async updateTable(tableId: string, tableNumber: string): Promise<void> {
    const stmt = db.prepare('UPDATE tables SET table_number = ? WHERE id = ?');
    stmt.run(tableNumber, tableId);
  }

  static async deleteTable(tableId: string): Promise<void> {
    const stmt = db.prepare('DELETE FROM tables WHERE id = ?');
    stmt.run(tableId);
  }

  static async getAllMenuItems(): Promise<MenuItem[]> {
    const stmt = db.prepare('SELECT * FROM menu ORDER BY category');
    return stmt.all() as MenuItem[];
  }

  static async addMenuItem(item: Omit<MenuItem, 'id' | 'created_at'>): Promise<void> {
    const stmt = db.prepare(`
      INSERT INTO menu (name, category, price, description, is_available) 
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(item.name, item.category, item.price, item.description, item.is_available ? 1 : 0);
  }

  static async updateMenuItem(itemId: string, item: Partial<MenuItem>): Promise<void> {
    const fields = [];
    const values = [];
    
    if (item.name !== undefined) {
      fields.push('name = ?');
      values.push(item.name);
    }
    if (item.category !== undefined) {
      fields.push('category = ?');
      values.push(item.category);
    }
    if (item.price !== undefined) {
      fields.push('price = ?');
      values.push(item.price);
    }
    if (item.description !== undefined) {
      fields.push('description = ?');
      values.push(item.description);
    }
    if (item.is_available !== undefined) {
      fields.push('is_available = ?');
      values.push(item.is_available ? 1 : 0);
    }

    if (fields.length > 0) {
      values.push(itemId);
      const stmt = db.prepare(`UPDATE menu SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
  }

  static async deleteMenuItem(itemId: string): Promise<void> {
    const stmt = db.prepare('DELETE FROM menu WHERE id = ?');
    stmt.run(itemId);
  }
}