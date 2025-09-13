/*
  # Restaurant Ordering System Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `mobile_number` (text, required)
      - `created_at` (timestamp)
    - `tables`
      - `id` (uuid, primary key) 
      - `table_number` (text, unique, required)
      - `unique_code` (text, nullable)
      - `locked` (boolean, default false)
    - `menu`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `category` (text, required)
      - `price` (numeric, required)
      - `description` (text)
      - `is_available` (boolean, default true)
    - `orders`
      - `id` (uuid, primary key)
      - `table_id` (uuid, foreign key)
      - `unique_code` (text, required)
      - `status` (text, enum)
      - `created_at` (timestamp)
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `menu_id` (uuid, foreign key)
      - `quantity` (integer, required)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (restaurant context)

  3. Sample Data
    - Sample tables, menu items, and initial data
*/

-- Create custom types
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('Pending', 'Preparing', 'Ready', 'Served');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tables table  
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number text UNIQUE NOT NULL,
  unique_code text,
  locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Menu table
CREATE TABLE IF NOT EXISTS menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price numeric(10,2) NOT NULL,
  description text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES tables(id) ON DELETE CASCADE,
  unique_code text NOT NULL,
  status order_status DEFAULT 'Pending',
  created_at timestamptz DEFAULT now()
);

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_id uuid REFERENCES menu(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow public access for restaurant ordering)
CREATE POLICY "Allow public access to users" ON users FOR ALL USING (true);
CREATE POLICY "Allow public access to tables" ON tables FOR ALL USING (true);
CREATE POLICY "Allow public access to menu" ON menu FOR ALL USING (true);
CREATE POLICY "Allow public access to orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow public access to order_items" ON order_items FOR ALL USING (true);

-- Sample data
INSERT INTO tables (table_number) VALUES 
  ('T01'), ('T02'), ('T03'), ('T04'), ('T05'),
  ('T06'), ('T07'), ('T08'), ('T09'), ('T10');

INSERT INTO menu (name, category, price, description, is_available) VALUES
  -- Starters
  ('Garlic Bread', 'Starters', 8.99, 'Crispy bread with garlic butter and herbs', true),
  ('Caesar Salad', 'Starters', 12.99, 'Fresh romaine lettuce, parmesan, croutons', true),
  ('Chicken Wings', 'Starters', 14.99, 'Spicy buffalo wings with blue cheese dip', true),
  ('Bruschetta', 'Starters', 10.99, 'Toasted bread with tomato, basil, and mozzarella', true),
  
  -- Mains
  ('Margherita Pizza', 'Mains', 18.99, 'Classic tomato sauce, mozzarella, and basil', true),
  ('Grilled Salmon', 'Mains', 26.99, 'Atlantic salmon with lemon butter sauce', true),
  ('Chicken Parmesan', 'Mains', 22.99, 'Breaded chicken breast with marinara and cheese', true),
  ('Beef Burger', 'Mains', 19.99, 'Angus beef with lettuce, tomato, and fries', true),
  ('Pasta Carbonara', 'Mains', 17.99, 'Creamy pasta with bacon and parmesan', true),
  
  -- Drinks
  ('Coca Cola', 'Drinks', 3.99, 'Classic soft drink', true),
  ('Orange Juice', 'Drinks', 4.99, 'Fresh squeezed orange juice', true),
  ('Coffee', 'Drinks', 2.99, 'Premium roasted coffee', true),
  ('Beer', 'Drinks', 5.99, 'Ice cold draft beer', true),
  ('House Wine', 'Drinks', 7.99, 'Red or white wine by the glass', true),
  
  -- Desserts
  ('Chocolate Cake', 'Desserts', 8.99, 'Rich chocolate cake with vanilla ice cream', true),
  ('Tiramisu', 'Desserts', 9.99, 'Classic Italian dessert with coffee and mascarpone', true),
  ('Ice Cream', 'Desserts', 6.99, 'Vanilla, chocolate, or strawberry', true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tables_table_number ON tables(table_number);
CREATE INDEX IF NOT EXISTS idx_tables_unique_code ON tables(unique_code);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_unique_code ON orders(unique_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_category ON menu(category);