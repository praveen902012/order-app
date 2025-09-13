import Database from 'better-sqlite3';
import { OrderStatus } from '../types/database';

// Initialize SQLite database
const db = new Database('restaurant.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
const createTables = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      mobile_number TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tables table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      table_number TEXT UNIQUE NOT NULL,
      unique_code TEXT,
      locked BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Menu table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      is_available BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      table_id TEXT REFERENCES tables(id) ON DELETE CASCADE,
      unique_code TEXT NOT NULL,
      status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Served')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Order Items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
      menu_id TEXT REFERENCES menu(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tables_table_number ON tables(table_number);
    CREATE INDEX IF NOT EXISTS idx_tables_unique_code ON tables(unique_code);
    CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
    CREATE INDEX IF NOT EXISTS idx_orders_unique_code ON orders(unique_code);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_menu_category ON menu(category);
  `);
};

// Initialize sample data
const initializeSampleData = () => {
  // Check if tables already exist
  const tableCount = db.prepare('SELECT COUNT(*) as count FROM tables').get() as { count: number };
  
  if (tableCount.count === 0) {
    // Insert sample tables
    const insertTable = db.prepare('INSERT INTO tables (table_number) VALUES (?)');
    for (let i = 1; i <= 10; i++) {
      insertTable.run(`T${i.toString().padStart(2, '0')}`);
    }

    // Insert sample menu items
    const insertMenuItem = db.prepare(`
      INSERT INTO menu (name, category, price, description, is_available) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const menuItems = [
      // Starters
      ['Garlic Bread', 'Starters', 8.99, 'Crispy bread with garlic butter and herbs', 1],
      ['Caesar Salad', 'Starters', 12.99, 'Fresh romaine lettuce, parmesan, croutons', 1],
      ['Chicken Wings', 'Starters', 14.99, 'Spicy buffalo wings with blue cheese dip', 1],
      ['Bruschetta', 'Starters', 10.99, 'Toasted bread with tomato, basil, and mozzarella', 1],
      
      // Mains
      ['Margherita Pizza', 'Mains', 18.99, 'Classic tomato sauce, mozzarella, and basil', 1],
      ['Grilled Salmon', 'Mains', 26.99, 'Atlantic salmon with lemon butter sauce', 1],
      ['Chicken Parmesan', 'Mains', 22.99, 'Breaded chicken breast with marinara and cheese', 1],
      ['Beef Burger', 'Mains', 19.99, 'Angus beef with lettuce, tomato, and fries', 1],
      ['Pasta Carbonara', 'Mains', 17.99, 'Creamy pasta with bacon and parmesan', 1],
      
      // Drinks
      ['Coca Cola', 'Drinks', 3.99, 'Classic soft drink', 1],
      ['Orange Juice', 'Drinks', 4.99, 'Fresh squeezed orange juice', 1],
      ['Coffee', 'Drinks', 2.99, 'Premium roasted coffee', 1],
      ['Beer', 'Drinks', 5.99, 'Ice cold draft beer', 1],
      ['House Wine', 'Drinks', 7.99, 'Red or white wine by the glass', 1],
      
      // Desserts
      ['Chocolate Cake', 'Desserts', 8.99, 'Rich chocolate cake with vanilla ice cream', 1],
      ['Tiramisu', 'Desserts', 9.99, 'Classic Italian dessert with coffee and mascarpone', 1],
      ['Ice Cream', 'Desserts', 6.99, 'Vanilla, chocolate, or strawberry', 1]
    ];

    menuItems.forEach(item => {
      insertMenuItem.run(...item);
    });
  }
};

// Initialize database
createTables();
initializeSampleData();

export { db };