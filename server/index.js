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
      image_url TEXT,
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
      INSERT INTO menu (name, category, price, description, image_url, is_available) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const menuItems = [
      // Starters
      ['Garlic Bread', 'Starters', 8.99, 'Crispy bread with garlic butter and herbs', 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Caesar Salad', 'Starters', 12.99, 'Fresh romaine lettuce, parmesan, croutons', 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Chicken Wings', 'Starters', 14.99, 'Spicy buffalo wings with blue cheese dip', 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Bruschetta', 'Starters', 10.99, 'Toasted bread with tomato, basil, and mozzarella', 'https://images.pexels.com/photos/5792329/pexels-photo-5792329.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Mozzarella Sticks', 'Starters', 9.99, 'Golden fried mozzarella with marinara sauce', 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Onion Rings', 'Starters', 7.99, 'Crispy beer-battered onion rings', 'https://images.pexels.com/photos/209540/pexels-photo-209540.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      
      // Mains
      ['Margherita Pizza', 'Mains', 18.99, 'Classic tomato sauce, mozzarella, and basil', 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Grilled Salmon', 'Mains', 26.99, 'Atlantic salmon with lemon butter sauce', 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Chicken Parmesan', 'Mains', 22.99, 'Breaded chicken breast with marinara and cheese', 'https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Beef Burger', 'Mains', 19.99, 'Angus beef with lettuce, tomato, and fries', 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Pasta Carbonara', 'Mains', 17.99, 'Creamy pasta with bacon and parmesan', 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['BBQ Ribs', 'Mains', 24.99, 'Slow-cooked ribs with BBQ sauce and coleslaw', 'https://images.pexels.com/photos/1268549/pexels-photo-1268549.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Fish and Chips', 'Mains', 16.99, 'Beer-battered cod with crispy fries', 'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Vegetarian Pasta', 'Mains', 15.99, 'Penne with roasted vegetables and pesto', 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      
      // Drinks
      ['Coca Cola', 'Drinks', 3.99, 'Classic soft drink', 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Orange Juice', 'Drinks', 4.99, 'Fresh squeezed orange juice', 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Coffee', 'Drinks', 2.99, 'Premium roasted coffee', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Beer', 'Drinks', 5.99, 'Ice cold draft beer', 'https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['House Wine', 'Drinks', 7.99, 'Red or white wine by the glass', 'https://images.pexels.com/photos/434311/pexels-photo-434311.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Iced Tea', 'Drinks', 2.99, 'Refreshing iced tea with lemon', 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Milkshake', 'Drinks', 5.99, 'Vanilla, chocolate, or strawberry milkshake', 'https://images.pexels.com/photos/103566/pexels-photo-103566.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Sparkling Water', 'Drinks', 2.49, 'Premium sparkling water', 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      
      // Desserts
      ['Chocolate Cake', 'Desserts', 8.99, 'Rich chocolate cake with vanilla ice cream', 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Tiramisu', 'Desserts', 9.99, 'Classic Italian dessert with coffee and mascarpone', 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Ice Cream', 'Desserts', 6.99, 'Vanilla, chocolate, or strawberry', 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Cheesecake', 'Desserts', 7.99, 'New York style cheesecake with berry sauce', 'https://images.pexels.com/photos/140831/pexels-photo-140831.jpeg?auto=compress&cs=tinysrgb&w=400', 1],
      ['Apple Pie', 'Desserts', 6.99, 'Homemade apple pie with cinnamon ice cream', 'https://images.pexels.com/photos/7525161/pexels-photo-7525161.jpeg?auto=compress&cs=tinysrgb&w=400', 1]
    ];

    menuItems.forEach(item => {
      insertMenuItem.run(...item);
    });

    // Add dummy users for testing
    const insertUser = db.prepare('INSERT INTO users (mobile_number) VALUES (?)');
    const testUsers = [
      '+1234567890',
      '+1987654321',
      '+1555123456',
      '+1444555666',
      '+1777888999'
    ];
    
    testUsers.forEach(mobile => {
      insertUser.run(mobile);
    });

    // Add some dummy orders for testing
    const tables = db.prepare('SELECT * FROM tables ORDER BY table_number LIMIT 5').all();
    const menuItemsData = db.prepare('SELECT * FROM menu').all();
    
    if (tables.length > 0 && menuItemsData.length > 0) {
      // Lock some tables and create orders
      const updateTable = db.prepare('UPDATE tables SET locked = 1, unique_code = ? WHERE id = ?');
      const insertOrder = db.prepare('INSERT INTO orders (table_id, unique_code, status) VALUES (?, ?, ?)');
      const insertOrderItem = db.prepare('INSERT INTO order_items (order_id, menu_id, quantity) VALUES (?, ?, ?)');
      
      // Order 1 - Table T01 (Pending)
      const code1 = generateUniqueCode();
      updateTable.run(code1, tables[0].id);
      const order1Result = insertOrder.run(tables[0].id, code1, 'Pending');
      const order1Id = db.prepare('SELECT id FROM orders WHERE rowid = ?').get(order1Result.lastInsertRowid).id;
      
      // Add items to order 1
      insertOrderItem.run(order1Id, menuItemsData[0].id, 2); // Garlic Bread x2
      insertOrderItem.run(order1Id, menuItemsData[5].id, 1); // Margherita Pizza x1
      insertOrderItem.run(order1Id, menuItemsData[10].id, 3); // Coca Cola x3
      
      // Order 2 - Table T02 (Preparing)
      const code2 = generateUniqueCode();
      updateTable.run(code2, tables[1].id);
      const order2Result = insertOrder.run(tables[1].id, code2, 'Preparing');
      const order2Id = db.prepare('SELECT id FROM orders WHERE rowid = ?').get(order2Result.lastInsertRowid).id;
      
      // Add items to order 2
      insertOrderItem.run(order2Id, menuItemsData[8].id, 2); // Beef Burger x2
      insertOrderItem.run(order2Id, menuItemsData[1].id, 1); // Caesar Salad x1
      insertOrderItem.run(order2Id, menuItemsData[13].id, 2); // Beer x2
      insertOrderItem.run(order2Id, menuItemsData[15].id, 1); // Chocolate Cake x1
      
      // Order 3 - Table T03 (Ready)
      const code3 = generateUniqueCode();
      updateTable.run(code3, tables[2].id);
      const order3Result = insertOrder.run(tables[2].id, code3, 'Ready');
      const order3Id = db.prepare('SELECT id FROM orders WHERE rowid = ?').get(order3Result.lastInsertRowid).id;
      
      // Add items to order 3
      insertOrderItem.run(order3Id, menuItemsData[7].id, 1); // Grilled Salmon x1
      insertOrderItem.run(order3Id, menuItemsData[2].id, 1); // Chicken Wings x1
      insertOrderItem.run(order3Id, menuItemsData[14].id, 1); // House Wine x1
      insertOrderItem.run(order3Id, menuItemsData[16].id, 2); // Tiramisu x2
      
      // Order 4 - Table T04 (Pending - Large order)
      const code4 = generateUniqueCode();
      updateTable.run(code4, tables[3].id);
      const order4Result = insertOrder.run(tables[3].id, code4, 'Pending');
      const order4Id = db.prepare('SELECT id FROM orders WHERE rowid = ?').get(order4Result.lastInsertRowid).id;
      
      // Add many items to order 4 (family order)
      insertOrderItem.run(order4Id, menuItemsData[0].id, 1); // Garlic Bread x1
      insertOrderItem.run(order4Id, menuItemsData[4].id, 1); // Mozzarella Sticks x1
      insertOrderItem.run(order4Id, menuItemsData[6].id, 2); // Margherita Pizza x2
      insertOrderItem.run(order4Id, menuItemsData[8].id, 1); // Beef Burger x1
      insertOrderItem.run(order4Id, menuItemsData[11].id, 1); // BBQ Ribs x1
      insertOrderItem.run(order4Id, menuItemsData[10].id, 4); // Coca Cola x4
      insertOrderItem.run(order4Id, menuItemsData[18].id, 2); // Milkshake x2
      insertOrderItem.run(order4Id, menuItemsData[15].id, 1); // Chocolate Cake x1
      insertOrderItem.run(order4Id, menuItemsData[20].id, 1); // Cheesecake x1
    }
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
    const stmt = db.prepare('SELECT * FROM menu ORDER BY category, name');
    const menu = stmt.all();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu', (req, res) => {
  try {
    const { name, category, price, description, image_url, is_available } = req.body;
    const stmt = db.prepare(`
      INSERT INTO menu (name, category, price, description, image_url, is_available) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(name, category, price, description, image_url, is_available ? 1 : 0);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/menu/:id', (req, res) => {
  try {
    const { name, category, price, description, image_url, is_available } = req.body;
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
    if (image_url !== undefined) {
      fields.push('image_url = ?');
      values.push(image_url);
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
        SELECT o.*, t.table_number, t.unique_code
        FROM orders o
        LEFT JOIN tables t ON o.table_id = t.id
        WHERE o.table_id = ? AND o.status != 'Served'
        ORDER BY o.created_at DESC
      `);
      const existingOrders = existingOrderStmt.all(table.id);
      
      if (existingOrders.length > 0) {
        // Get all order items for all active orders at this table
        const allOrderItems = [];
        for (const order of existingOrders) {
          const itemsStmt = db.prepare(`
            SELECT oi.*, m.name, m.category, m.price, m.description, m.image_url
            FROM order_items oi
            LEFT JOIN menu m ON oi.menu_id = m.id
            WHERE oi.order_id = ?
          `);
          const orderItems = itemsStmt.all(order.id);
          allOrderItems.push(...orderItems.map(item => ({
            ...item,
            order_unique_code: order.unique_code,
            order_status: order.status,
            order_created_at: order.created_at
          })));
        }

        // Return the most recent order for continuation
        const mostRecentOrder = existingOrders[0];
        const itemsStmt = db.prepare(`
          SELECT oi.*, m.name, m.category, m.price, m.description, m.image_url
          FROM order_items oi
          LEFT JOIN menu m ON oi.menu_id = m.id
          WHERE oi.order_id = ?
        `);
        const orderItems = itemsStmt.all(mostRecentOrder.id);

        const transformedOrder = {
          ...mostRecentOrder,
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
              image_url: item.image_url,
              is_available: true,
              created_at: ''
            }
          })),
          all_table_items: allOrderItems.map(item => ({
            id: item.id,
            order_id: item.order_id,
            menu_id: item.menu_id,
            quantity: item.quantity,
            created_at: item.created_at,
            order_unique_code: item.order_unique_code,
            order_status: item.order_status,
            order_created_at: item.order_created_at,
            menu: {
              id: item.menu_id,
              name: item.name,
              category: item.category,
              price: item.price,
              description: item.description,
              image_url: item.image_url,
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
      SELECT oi.*, m.name, m.category, m.price, m.description, m.image_url
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
          image_url: item.image_url,
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
        SELECT oi.*, m.name, m.category, m.price, m.description, m.image_url
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
            image_url: item.image_url,
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
    const { menuId, quantity, createNewOrder } = req.body;
    
    let orderId = req.params.id;
    
    // If createNewOrder is true, create a new sub-order
    if (createNewOrder) {
      // Get the current order to get table info
      const currentOrderStmt = db.prepare('SELECT * FROM orders WHERE id = ?');
      const currentOrder = currentOrderStmt.get(req.params.id);
      
      if (!currentOrder) {
        return res.status(404).json({ error: 'Original order not found' });
      }
      
      // Create new sub-order with same table and unique code
      const newOrderStmt = db.prepare(`
        INSERT INTO orders (table_id, unique_code, status) 
        VALUES (?, ?, 'Pending')
      `);
      const result = newOrderStmt.run(currentOrder.table_id, currentOrder.unique_code);
      
      // Get the new order ID
      const newOrderIdStmt = db.prepare('SELECT id FROM orders WHERE rowid = ?');
      const newOrder = newOrderIdStmt.get(result.lastInsertRowid);
      orderId = newOrder.id;
    }
    
    // Check if item already exists in order
    const existingStmt = db.prepare(`
      SELECT * FROM order_items 
      WHERE order_id = ? AND menu_id = ?
    `);
    const existingItem = existingStmt.get(orderId, menuId);

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

    res.json({ success: true, orderId: orderId });
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