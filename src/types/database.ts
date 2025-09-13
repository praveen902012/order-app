export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served';

export interface User {
  id: string;
  mobile_number: string;
  created_at: string;
}

export interface Table {
  id: string;
  table_number: string;
  unique_code: string | null;
  locked: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  is_available: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  table_id: string;
  unique_code: string;
  status: OrderStatus;
  created_at: string;
  tables?: Table;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_id: string;
  quantity: number;
  created_at: string;
  menu?: MenuItem;
}

export interface CartItem extends MenuItem {
  quantity: number;
}