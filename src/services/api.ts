import { supabase } from '../lib/supabase';
import { Table, MenuItem, Order, OrderItem, User, OrderStatus } from '../types/database';
import { generateUniqueCode } from '../lib/qr-utils';

export class ApiService {
  // User methods
  static async createUser(mobileNumber: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{ mobile_number: mobileNumber }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Table methods
  static async getTable(tableNumber: string): Promise<Table | null> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('table_number', tableNumber)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async lockTable(tableId: string, uniqueCode: string): Promise<void> {
    const { error } = await supabase
      .from('tables')
      .update({ locked: true, unique_code: uniqueCode })
      .eq('id', tableId);
    
    if (error) throw error;
  }

  static async unlockTable(tableId: string): Promise<void> {
    const { error } = await supabase
      .from('tables')
      .update({ locked: false, unique_code: null })
      .eq('id', tableId);
    
    if (error) throw error;
  }

  static async validateTableCode(tableNumber: string, code: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('tables')
      .select('unique_code, locked')
      .eq('table_number', tableNumber)
      .single();
    
    if (error) return false;
    return data.locked && data.unique_code === code;
  }

  // Menu methods
  static async getMenu(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .eq('is_available', true)
      .order('category', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Order methods
  static async createOrder(tableId: string, uniqueCode: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        table_id: tableId,
        unique_code: uniqueCode,
        status: 'Pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getActiveOrder(tableId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          menu(*)
        )
      `)
      .eq('table_id', tableId)
      .neq('status', 'Served')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getOrderByCode(uniqueCode: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        tables(*),
        order_items(
          *,
          menu(*)
        )
      `)
      .eq('unique_code', uniqueCode)
      .neq('status', 'Served')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async addOrderItem(orderId: string, menuId: string, quantity: number): Promise<void> {
    // Check if item already exists in order
    const { data: existingItem, error: checkError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .eq('menu_id', menuId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') throw checkError;

    if (existingItem) {
      // Update existing item quantity
      const { error } = await supabase
        .from('order_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);
      
      if (error) throw error;
    } else {
      // Create new item
      const { error } = await supabase
        .from('order_items')
        .insert([{
          order_id: orderId,
          menu_id: menuId,
          quantity: quantity
        }]);
      
      if (error) throw error;
    }
  }

  static async removeOrderItem(orderItemId: string): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', orderItemId);
    
    if (error) throw error;
  }

  static async updateOrderItemQuantity(orderItemId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.removeOrderItem(orderItemId);
      return;
    }

    const { error } = await supabase
      .from('order_items')
      .update({ quantity })
      .eq('id', orderItemId);
    
    if (error) throw error;
  }

  // Kitchen Dashboard methods
  static async getAllActiveOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        tables(*),
        order_items(
          *,
          menu(*)
        )
      `)
      .neq('status', 'Served')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    
    if (error) throw error;

    // If order is served, unlock the table
    if (status === 'Served') {
      const { data: order } = await supabase
        .from('orders')
        .select('table_id')
        .eq('id', orderId)
        .single();
      
      if (order) {
        await this.unlockTable(order.table_id);
      }
    }
  }

  // Real-time subscriptions
  static subscribeToOrders(callback: (orders: Order[]) => void) {
    return supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        this.getAllActiveOrders().then(callback);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
        this.getAllActiveOrders().then(callback);
      })
      .subscribe();
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
}