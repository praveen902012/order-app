import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { generateId, generateUniqueCode, getCurrentTimestamp } from './utils.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = new Database('restaurant.db');

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      table_number TEXT UNIQUE NOT NULL,
      unique_code TEXT,
      locked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      floor TEXT DEFAULT 'Ground Floor',
      seating_capacity INTEGER DEFAULT 4
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      image_url TEXT,
      is_available INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      table_id TEXT NOT NULL,
      unique_code TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (table_id) REFERENCES tables(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      menu_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (menu_id) REFERENCES menu_items(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      mobile_number TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);
};

const seedDatabase = () => {
  const tables = db.prepare('SELECT COUNT(*) as count FROM tables').get();
  const menuItems = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();

  if (tables.count === 0) {
    console.log('Seeding tables...');
    const insertTable = db.prepare('INSERT INTO tables (id, table_number, floor, seating_capacity) VALUES (?, ?, ?, ?)');

    for (let i = 1; i <= 10; i++) {
      insertTable.run(generateId(), `T${String(i).padStart(2, '0')}`, 'Ground Floor', 4);
    }
  }

  if (menuItems.count === 0) {
    console.log('Seeding menu items...');
    const insertMenuItem = db.prepare('INSERT INTO menu_items (id, name, category, price, description, image_url) VALUES (?, ?, ?, ?, ?, ?)');

    const sampleMenuItems = [
      { name: 'Classic Burger', category: 'Mains', price: 12.99, description: 'Beef patty with lettuce, tomato, and special sauce', image_url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'Margherita Pizza', category: 'Mains', price: 14.99, description: 'Fresh mozzarella, tomatoes, and basil', image_url: 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'Caesar Salad', category: 'Starters', price: 8.99, description: 'Crisp romaine with parmesan and croutons', image_url: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'Grilled Salmon', category: 'Mains', price: 18.99, description: 'Fresh Atlantic salmon with seasonal vegetables', image_url: 'https://images.pexels.com/photos/3763816/pexels-photo-3763816.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'Chicken Wings', category: 'Starters', price: 9.99, description: 'Spicy buffalo wings with ranch dip', image_url: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'Pasta Carbonara', category: 'Mains', price: 13.99, description: 'Creamy pasta with bacon and parmesan', image_url: 'https://images.pexels.com/photos/4518844/pexels-photo-4518844.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'French Fries', category: 'Sides', price: 4.99, description: 'Crispy golden fries with ketchup', image_url: 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'Onion Rings', category: 'Sides', price: 5.99, description: 'Beer-battered onion rings', image_url: 'https://images.pexels.com/photos/5920742/pexels-photo-5920742.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'Chocolate Cake', category: 'Desserts', price: 8.99, description: 'Rich chocolate cake with vanilla ice cream', image_url: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'Tiramisu', category: 'Desserts', price: 9.99, description: 'Classic Italian dessert with coffee and mascarpone', image_url: 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'Coca Cola', category: 'Beverages', price: 2.99, description: 'Chilled soft drink', image_url: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { name: 'Fresh Orange Juice', category: 'Beverages', price: 4.99, description: 'Freshly squeezed orange juice', image_url: 'https://images.pexels.com/photos/1435740/pexels-photo-1435740.jpeg?auto=compress&cs=tinysrgb&w=400' }
    ];

    sampleMenuItems.forEach(item => {
      insertMenuItem.run(generateId(), item.name, item.category, item.price, item.description, item.image_url);
    });
  }
};

const createDummyOrders = () => {
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();

  if (orderCount.count < 1000) {
    console.log('Creating 1000 dummy order records for testing...');
    const tables = db.prepare('SELECT id, table_number FROM tables').all();
    const menuItems = db.prepare('SELECT id, name, price FROM menu_items').all();

    const insertOrder = db.prepare('INSERT INTO orders (id, table_id, unique_code, status, created_at) VALUES (?, ?, ?, ?, ?)');
    const insertOrderItem = db.prepare('INSERT INTO order_items (id, order_id, menu_id, quantity, price) VALUES (?, ?, ?, ?, ?)');
    const updateTableCode = db.prepare('UPDATE tables SET unique_code = ?, locked = ? WHERE id = ?');

    const statuses = ['Pending', 'Preparing', 'Ready', 'Completed'];
    const startDate = new Date('2023-01-01');
    const endDate = new Date();

    for (let i = 0; i < 1000; i++) {
      const orderId = generateId();
      const uniqueCode = `DUMMY${String(i).padStart(4, '0')}`;
      const randomTable = tables[Math.floor(Math.random() * tables.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));

      insertOrder.run(orderId, randomTable.id, uniqueCode, status, randomDate.toISOString());

      if (status === 'Pending' || status === 'Preparing') {
        updateTableCode.run(uniqueCode, 1, randomTable.id);
      }

      const itemCount = Math.floor(Math.random() * 5) + 1;
      for (let j = 0; j < itemCount; j++) {
        const randomMenuItem = menuItems[Math.floor(Math.random() * menuItems.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        insertOrderItem.run(generateId(), orderId, randomMenuItem.id, quantity, randomMenuItem.price);
      }

      if ((i + 1) % 100 === 0) {
        console.log(`Created ${i + 1}/1000 dummy orders...`);
      }
    }

    console.log('Finished creating 1000 dummy order records!');
  }
};

createTables();
seedDatabase();
createDummyOrders();

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/menu', (req, res) => {
  try {
    const menuItems = db.prepare('SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category, name').all();
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

app.get('/api/menu/all', (req, res) => {
  try {
    const menuItems = db.prepare('SELECT * FROM menu_items ORDER BY category, name').all();
    res.json(menuItems);
  } catch (error) {
    console.error('Error fetching all menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

app.post('/api/menu', (req, res) => {
  try {
    const { name, category, price, description, image_url, is_available } = req.body;
    const id = generateId();

    const stmt = db.prepare('INSERT INTO menu_items (id, name, category, price, description, image_url, is_available) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, name, category, price, description || null, image_url || null, is_available ? 1 : 0);

    const newItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    res.json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error adding menu item:', error);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

app.put('/api/menu/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (key === 'is_available') {
        fields.push(`${key} = ?`);
        values.push(updates[key] ? 1 : 0);
      } else {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    values.push(id);

    const stmt = db.prepare(`UPDATE menu_items SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const updatedItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

app.delete('/api/menu/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM menu_items WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

app.get('/api/tables', (req, res) => {
  try {
    const tables = db.prepare('SELECT * FROM tables ORDER BY table_number').all();
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

app.post('/api/tables', (req, res) => {
  try {
    const { table_number, floor, seating_capacity } = req.body;
    const id = generateId();

    const stmt = db.prepare('INSERT INTO tables (id, table_number, floor, seating_capacity) VALUES (?, ?, ?, ?)');
    stmt.run(id, table_number, floor || 'Ground Floor', seating_capacity || 4);

    const newTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
    res.json({ success: true, table: newTable });
  } catch (error) {
    console.error('Error adding table:', error);
    res.status(500).json({ error: 'Failed to add table' });
  }
});

app.put('/api/tables/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    });

    values.push(id);

    const stmt = db.prepare(`UPDATE tables SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    const updatedTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(id);
    res.json(updatedTable);
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
});

app.delete('/api/tables/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM tables WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

app.post('/api/orders/initialize', (req, res) => {
  try {
    const { tableNumber, mobileNumber } = req.body;

    const table = db.prepare('SELECT * FROM tables WHERE table_number = ?').get(tableNumber);

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    if (table.locked && table.unique_code) {
      const existingOrder = db.prepare('SELECT * FROM orders WHERE table_id = ? AND unique_code = ? AND status != ?').get(table.id, table.unique_code, 'Completed');

      if (existingOrder) {
        const orderWithTable = {
          ...existingOrder,
          tables: table
        };

        return res.json({
          order: orderWithTable,
          uniqueCode: table.unique_code,
          isNewOrder: false
        });
      }
    }

    const uniqueCode = generateUniqueCode();
    const orderId = generateId();

    const insertOrder = db.prepare('INSERT INTO orders (id, table_id, unique_code, status, created_at) VALUES (?, ?, ?, ?, ?)');
    insertOrder.run(orderId, table.id, uniqueCode, 'Pending', getCurrentTimestamp());

    const updateTable = db.prepare('UPDATE tables SET unique_code = ?, locked = 1 WHERE id = ?');
    updateTable.run(uniqueCode, table.id);

    const insertCustomer = db.prepare('INSERT INTO customers (id, order_id, mobile_number) VALUES (?, ?, ?)');
    insertCustomer.run(generateId(), orderId, mobileNumber);

    const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const updatedTable = db.prepare('SELECT * FROM tables WHERE id = ?').get(table.id);

    const orderWithTable = {
      ...newOrder,
      tables: updatedTable
    };

    res.json({
      order: orderWithTable,
      uniqueCode,
      isNewOrder: true
    });
  } catch (error) {
    console.error('Error initializing order:', error);
    res.status(500).json({ error: 'Failed to initialize order' });
  }
});

app.get('/api/orders/code/:code', (req, res) => {
  try {
    const { code } = req.params;

    const order = db.prepare(`
      SELECT o.*, t.table_number, t.floor, t.seating_capacity
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      WHERE o.unique_code = ? AND o.status != ?
    `).get(code, 'Completed');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(order.table_id);

    const orderWithTable = {
      ...order,
      tables: table
    };

    res.json(orderWithTable);
  } catch (error) {
    console.error('Error fetching order by code:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.get('/api/orders/active', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, t.table_number
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      WHERE o.status IN (?, ?, ?)
      ORDER BY o.created_at DESC
    `).all('Pending', 'Preparing', 'Ready');

    const ordersWithDetails = orders.map(order => {
      const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(order.table_id);
      const items = db.prepare(`
        SELECT oi.*, mi.name, mi.category, mi.image_url
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_id = mi.id
        WHERE oi.order_id = ?
      `).all(order.id);

      return {
        ...order,
        tables: table,
        order_items: items
      };
    });

    res.json(ordersWithDetails);
  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({ error: 'Failed to fetch active orders' });
  }
});

app.put('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    stmt.run(status, id);

    if (status === 'Completed') {
      const order = db.prepare('SELECT table_id FROM orders WHERE id = ?').get(id);
      const unlockTable = db.prepare('UPDATE tables SET unique_code = NULL, locked = 0 WHERE id = ?');
      unlockTable.run(order.table_id);
    }

    const updatedOrder = db.prepare(`
      SELECT o.*, t.table_number
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      WHERE o.id = ?
    `).get(id);

    const table = db.prepare('SELECT * FROM tables WHERE id = ?').get(updatedOrder.table_id);

    res.json({
      ...updatedOrder,
      tables: table
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.post('/api/orders/:id/items', (req, res) => {
  try {
    const { id } = req.params;
    const { menuId, quantity, createNewOrder } = req.body;

    let orderId = id;

    if (createNewOrder) {
      const currentOrder = db.prepare('SELECT table_id, unique_code FROM orders WHERE id = ?').get(id);

      const newOrderId = generateId();
      const insertOrder = db.prepare('INSERT INTO orders (id, table_id, unique_code, status, created_at) VALUES (?, ?, ?, ?, ?)');
      insertOrder.run(newOrderId, currentOrder.table_id, currentOrder.unique_code, 'Pending', getCurrentTimestamp());

      orderId = newOrderId;
    }

    const menuItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(menuId);

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    const itemId = generateId();
    const insertOrderItem = db.prepare('INSERT INTO order_items (id, order_id, menu_id, quantity, price) VALUES (?, ?, ?, ?, ?)');
    insertOrderItem.run(itemId, orderId, menuId, quantity, menuItem.price);

    res.json({ success: true, orderId });
  } catch (error) {
    console.error('Error adding order item:', error);
    res.status(500).json({ error: 'Failed to add order item' });
  }
});

app.put('/api/order-items/:id/quantity', (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      const stmt = db.prepare('DELETE FROM order_items WHERE id = ?');
      stmt.run(id);
      return res.json({ success: true, deleted: true });
    }

    const stmt = db.prepare('UPDATE order_items SET quantity = ? WHERE id = ?');
    stmt.run(quantity, id);

    const updatedItem = db.prepare('SELECT * FROM order_items WHERE id = ?').get(id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating order item quantity:', error);
    res.status(500).json({ error: 'Failed to update quantity' });
  }
});

app.get('/api/orders/history', (req, res) => {
  try {
    const { filterType, startDate, endDate, month, year } = req.query;

    let query = `
      SELECT o.*, t.table_number
      FROM orders o
      JOIN tables t ON o.table_id = t.id
      WHERE o.status = ?
    `;
    const params = ['Completed'];

    if (filterType === 'dateRange' && startDate && endDate) {
      query += ' AND DATE(o.created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (filterType === 'month' && month) {
      query += ' AND strftime("%Y-%m", o.created_at) = ?';
      params.push(month);
    } else if (filterType === 'year' && year) {
      query += ' AND strftime("%Y", o.created_at) = ?';
      params.push(year);
    }

    query += ' ORDER BY o.created_at DESC';

    const orders = db.prepare(query).all(...params);

    const ordersWithDetails = orders.map(order => {
      const items = db.prepare(`
        SELECT oi.*, mi.name, mi.category
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_id = mi.id
        WHERE oi.order_id = ?
      `).all(order.id);

      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return {
        ...order,
        items,
        total
      };
    });

    const totalOrders = ordersWithDetails.length;
    const totalSales = ordersWithDetails.reduce((sum, order) => sum + order.total, 0);
    const totalItems = ordersWithDetails.reduce((sum, order) => sum + order.items.reduce((s, i) => s + i.quantity, 0), 0);
    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

    res.json({
      orders: ordersWithDetails,
      analytics: {
        totalOrders,
        totalSales,
        totalItems,
        averageOrder
      }
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
