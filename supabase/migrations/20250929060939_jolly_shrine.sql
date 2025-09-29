/*
  # Add Floors and Seating Capacity to Tables

  1. Schema Changes
    - Add `floor` column to `tables` table (text, default 'Ground Floor')
    - Add `seating_capacity` column to `tables` table (integer, default 4)
    - Add indexes for better performance

  2. Data Migration
    - Update existing tables with default floor and seating capacity
    - Ensure all tables have proper floor assignments
*/

-- Add floor and seating_capacity columns to tables
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'floor'
    ) THEN
        ALTER TABLE tables ADD COLUMN floor text DEFAULT 'Ground Floor';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tables' AND column_name = 'seating_capacity'
    ) THEN
        ALTER TABLE tables ADD COLUMN seating_capacity integer DEFAULT 4;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tables_floor ON tables(floor);
CREATE INDEX IF NOT EXISTS idx_tables_seating_capacity ON tables(seating_capacity);

-- Update existing tables with varied floor assignments and seating capacities
UPDATE tables SET 
  floor = CASE 
    WHEN table_number IN ('T01', 'T02', 'T03', 'T04') THEN 'Ground Floor'
    WHEN table_number IN ('T05', 'T06', 'T07') THEN 'First Floor'
    WHEN table_number IN ('T08', 'T09', 'T10') THEN 'Second Floor'
    ELSE 'Ground Floor'
  END,
  seating_capacity = CASE 
    WHEN table_number IN ('T01', 'T05', 'T08') THEN 2  -- Small tables
    WHEN table_number IN ('T02', 'T03', 'T06', 'T07', 'T09') THEN 4  -- Medium tables
    WHEN table_number IN ('T04', 'T10') THEN 6  -- Large tables
    ELSE 4
  END
WHERE floor IS NULL OR seating_capacity IS NULL;