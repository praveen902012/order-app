/*
  # Add image_url column to menu table

  1. Schema Changes
    - Add `image_url` column to `menu` table
    - Column is nullable (text)
    - Add index for better performance

  2. Data Migration
    - Update existing menu items with sample image URLs
    - Ensure all items have proper image references
*/

-- Add image_url column to menu table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'menu' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE menu ADD COLUMN image_url text;
    END IF;
END $$;

-- Create index for image_url column
CREATE INDEX IF NOT EXISTS idx_menu_image_url ON menu(image_url);

-- Update existing menu items with sample image URLs
UPDATE menu SET image_url = 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Garlic Bread' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Caesar Salad' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Chicken Wings' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Bruschetta' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Margherita Pizza' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Grilled Salmon' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Chicken Parmesan' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Beef Burger' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Pasta Carbonara' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Coca Cola' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Orange Juice' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Coffee' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Beer' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/434311/pexels-photo-434311.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'House Wine' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Chocolate Cake' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/6880219/pexels-photo-6880219.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Tiramisu' AND image_url IS NULL;

UPDATE menu SET image_url = 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg?auto=compress&cs=tinysrgb&w=400' 
WHERE name = 'Ice Cream' AND image_url IS NULL;