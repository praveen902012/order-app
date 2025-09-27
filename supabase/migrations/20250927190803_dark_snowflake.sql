/*
  # Add Dummy Order Records for Testing

  1. Sample Orders
    - Creates test orders for different tables
    - Various order statuses (Pending, Preparing, Ready)
    - Different order codes for testing

  2. Sample Order Items
    - Multiple items per order
    - Different quantities
    - Mix of menu categories

  3. Table States
    - Some tables locked with active orders
    - Some tables available
*/

-- Add some dummy orders for testing
DO $$
DECLARE
    table_t01_id uuid;
    table_t02_id uuid;
    table_t03_id uuid;
    order1_id uuid;
    order2_id uuid;
    order3_id uuid;
    menu_pizza_id uuid;
    menu_burger_id uuid;
    menu_wings_id uuid;
    menu_salad_id uuid;
    menu_coke_id uuid;
    menu_beer_id uuid;
    menu_cake_id uuid;
BEGIN
    -- Get table IDs
    SELECT id INTO table_t01_id FROM tables WHERE table_number = 'T01';
    SELECT id INTO table_t02_id FROM tables WHERE table_number = 'T02';
    SELECT id INTO table_t03_id FROM tables WHERE table_number = 'T03';
    
    -- Get some menu item IDs
    SELECT id INTO menu_pizza_id FROM menu WHERE name = 'Margherita Pizza';
    SELECT id INTO menu_burger_id FROM menu WHERE name = 'Beef Burger';
    SELECT id INTO menu_wings_id FROM menu WHERE name = 'Chicken Wings';
    SELECT id INTO menu_salad_id FROM menu WHERE name = 'Caesar Salad';
    SELECT id INTO menu_coke_id FROM menu WHERE name = 'Coca Cola';
    SELECT id INTO menu_beer_id FROM menu WHERE name = 'Beer';
    SELECT id INTO menu_cake_id FROM menu WHERE name = 'Chocolate Cake';

    -- Lock tables and set unique codes
    UPDATE tables SET locked = true, unique_code = 'ABC123' WHERE id = table_t01_id;
    UPDATE tables SET locked = true, unique_code = 'DEF456' WHERE id = table_t02_id;
    UPDATE tables SET locked = true, unique_code = 'GHI789' WHERE id = table_t03_id;

    -- Create dummy orders
    INSERT INTO orders (id, table_id, unique_code, status, created_at) VALUES
        (gen_random_uuid(), table_t01_id, 'ABC123', 'Pending', now() - interval '10 minutes'),
        (gen_random_uuid(), table_t02_id, 'DEF456', 'Preparing', now() - interval '25 minutes'),
        (gen_random_uuid(), table_t03_id, 'GHI789', 'Ready', now() - interval '35 minutes')
    RETURNING id INTO order1_id;

    -- Get the order IDs we just created
    SELECT id INTO order1_id FROM orders WHERE unique_code = 'ABC123';
    SELECT id INTO order2_id FROM orders WHERE unique_code = 'DEF456';
    SELECT id INTO order3_id FROM orders WHERE unique_code = 'GHI789';

    -- Add order items for Order 1 (Table T01 - Pending)
    INSERT INTO order_items (order_id, menu_id, quantity) VALUES
        (order1_id, menu_pizza_id, 2),
        (order1_id, menu_wings_id, 1),
        (order1_id, menu_coke_id, 3);

    -- Add order items for Order 2 (Table T02 - Preparing)
    INSERT INTO order_items (order_id, menu_id, quantity) VALUES
        (order2_id, menu_burger_id, 2),
        (order2_id, menu_salad_id, 1),
        (order2_id, menu_beer_id, 2),
        (order2_id, menu_cake_id, 1);

    -- Add order items for Order 3 (Table T03 - Ready)
    INSERT INTO order_items (order_id, menu_id, quantity) VALUES
        (order3_id, menu_pizza_id, 1),
        (order3_id, menu_burger_id, 1),
        (order3_id, menu_wings_id, 2),
        (order3_id, menu_coke_id, 2),
        (order3_id, menu_cake_id, 2);

    -- Add some dummy users
    INSERT INTO users (mobile_number) VALUES
        ('+1234567890'),
        ('+1987654321'),
        ('+1555123456');

END $$;