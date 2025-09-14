import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { generateUniqueCode } from './utils.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
  const tableCount = db.prepare('SELECT COUNT(*) as count FROM tables').get();
  
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

// API Routes

// Table routes
app.get('/api/tables/:tableNumber', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM tables WHERE table_number = ?');
    const table = stmt.get(req.params.tableNumber);
    res.json(table || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tables', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM tables ORDER BY table_number');
    const tables = stmt.all();
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tables', (req, res) => {
  try {
    const { table_number } = req.body;
    const stmt = db.prepare('INSERT INTO tables (table_number) VALUES (?)');
    stmt.run(table_number);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tables/:id', (req, res) => {
  try {
    const { table_number } = req.body;
    const stmt = db.prepare('UPDATE tables SET table_number = ? WHERE id = ?');
    stmt.run(table_number, req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tables/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM tables WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Menu routes
app.get('/api/menu', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM menu 
      WHERE is_available = 1 
      ORDER BY category
    `);
    const menu = stmt.all();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/menu/all', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM menu ORDER BY category');
    const menu = stmt.all();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu', (req, res) => {
  try {
    const { name, category, price, description, is_available } = req.body;
    const stmt = db.prepare(`
      INSERT INTO menu (name, category, price, description, is_available) 
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(name, category, price, description, is_available ? 1 : 0);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/menu/:id', (req, res) => {
  try {
    const { name, category, price, description, is_available } = req.body;
    const fields = [];
    const values = [];
    
    if (name !== undefined) {
      fields.push('name = ?');
      values.push(name);
    }
    if (category !== undefined) {
      fields.push('category = ?');
      values.push(category);
    }
    if (price !== undefined) {
      fields.push('price = ?');
      values.push(price);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (is_available !== undefined) {
      fields.push('is_available = ?');
      values.push(is_available ? 1 : 0);
    }

    if (fields.length > 0) {
      values.push(req.params.id);
      const stmt = db.prepare(`UPDATE menu SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/menu/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM menu WHERE id = ?');
    stmt.run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Order routes
app.post('/api/orders/initialize', (req, res) => {
  try {
    const { tableNumber, mobileNumber } = req.body;
    
    // Get table
    const tableStmt = db.prepare('SELECT * FROM tables WHERE table_number = ?');
    const table = tableStmt.get(tableNumber);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Check if table is locked with existing order
    if (table.locked && table.unique_code) {
      const existingOrderStmt = db.prepare(`
        SELECT o.*, t.table_number
        FROM orders o
        LEFT JOIN tables t ON o.table_id = t.id
        WHERE o.table_id = ? AND o.status != 'Served'
        ORDER BY o.created_at DESC
        LIMIT 1
      `);
      const existingOrder = existingOrderStmt.get(table.id);
      
      if (existingOrder) {
        // Get order items
        const itemsStmt = db.prepare(`
          SELECT oi.*, m.name, m.category, m.price, m.description
          FROM order_items oi
          LEFT JOIN menu m ON oi.menu_id = m.id
          WHERE oi.order_id = ?
        `);
        const orderItems = itemsStmt.all(existingOrder.id);

        const transformedOrder = {
          ...existingOrder,
          tables: {
            id: table.id,
            table_number: table.table_number,
            unique_code: table.unique_code,
            locked: table.locked,
            created_at: table.created_at
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

        return res.json({ order: transformedOrder, uniqueCode: table.unique_code, isNewOrder: false });
      }
    }

    // Create new order
    const uniqueCode = generateUniqueCode();
    
    // Lock table
    const lockStmt = db.prepare(`
      UPDATE tables 
      SET locked = 1, unique_code = ? 
      WHERE id = ?
    `);
    lockStmt.run(uniqueCode, table.id);
    
    // Create order
    const orderStmt = db.prepare(`
      INSERT INTO orders (table_id, unique_code, status) 
      VALUES (?, ?, 'Pending')
    `);
    const result = orderStmt.run(table.id, uniqueCode);
    
    // Create user
    const userStmt = db.prepare(`
      INSERT INTO users (mobile_number) 
      VALUES (?)
    `);
    userStmt.run(mobileNumber);
    
    // Get created order
    const newOrderStmt = db.prepare('SELECT * FROM orders WHERE rowid = ?');
    const newOrder = newOrderStmt.get(result.lastInsertRowid);
    
    const transformedOrder = {
      ...newOrder,
      tables: {
        id: table.id,
        table_number: table.table_number,
        unique_code: uniqueCode,
        locked: true,
        created_at: table.created_at
      },
      order_items: []
    };

    res.json({ order: transformedOrder, uniqueCode, isNewOrder: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/code/:code', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT o.*, t.table_number, t.id as table_id
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.unique_code = ? AND o.status != 'Served'
    `);
    const order = stmt.get(req.params.code);
    
    if (!order) {
      return res.json(null);
    }

    // Get order items
    const itemsStmt = db.prepare(`
      SELECT oi.*, m.name, m.category, m.price, m.description
      FROM order_items oi
      LEFT JOIN menu m ON oi.menu_id = m.id
      WHERE oi.order_id = ?
    `);
    const orderItems = itemsStmt.all(order.id);

    const transformedOrder = {
      ...order,
      tables: {
        id: order.table_id,
        table_number: order.table_number,
        unique_code: req.params.code,
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

    res.json(transformedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/active', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT o.*, t.table_number
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.status != 'Served'
      ORDER BY o.created_at ASC
    `);
    const orders = stmt.all();
    
    // Get order items for each order
    const ordersWithItems = orders.map(order => {
      const itemsStmt = db.prepare(`
        SELECT oi.*, m.name, m.category, m.price, m.description
        FROM order_items oi
        LEFT JOIN menu m ON oi.menu_id = m.id
        WHERE oi.order_id = ?
      `);
      const orderItems = itemsStmt.all(order.id);

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

    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const stmt = db.prepare(`
      UPDATE orders 
      SET status = ? 
      WHERE id = ?
    `);
    stmt.run(status, req.params.id);

    // If order is served, unlock the table
    if (status === 'Served') {
      const orderStmt = db.prepare('SELECT table_id FROM orders WHERE id = ?');
      const order = orderStmt.get(req.params.id);
      
      if (order) {
        const unlockStmt = db.prepare(`
          UPDATE tables 
          SET locked = 0, unique_code = NULL 
          WHERE id = ?
        `);
        unlockStmt.run(order.table_id);
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:id/items', (req, res) => {
  try {
    const { menuId, quantity } = req.body;
    
    // Check if item already exists in order
    const existingStmt = db.prepare(`
      SELECT * FROM order_items 
      WHERE order_id = ? AND menu_id = ?
    `);
    const existingItem = existingStmt.get(req.params.id, menuId);

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
      insertStmt.run(req.params.id, menuId, quantity);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/order-items/:id/quantity', (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (quantity <= 0) {
      const deleteStmt = db.prepare('DELETE FROM order_items WHERE id = ?');
      deleteStmt.run(req.params.id);
    } else {
      const updateStmt = db.prepare(`
        UPDATE order_items 
        SET quantity = ? 
        WHERE id = ?
      `);
      updateStmt.run(quantity, req.params.id);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});