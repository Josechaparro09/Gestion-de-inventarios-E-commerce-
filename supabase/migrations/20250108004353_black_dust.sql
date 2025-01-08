--supabase\migrations\20250108004353_black_dust.sql
/*
  # Create products table

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `unit_cost` (numeric)
      - `sale_price` (numeric)
      - `stock` (integer)
      - `image_url` (text)
      - `category` (text)
      - `barcode` (text)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `products` table
    - Add policies for CRUD operations
*/

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
  sale_price NUMERIC(10,2) NOT NULL CHECK (sale_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  barcode TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON products FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON products FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON products FOR DELETE 
USING (auth.role() = 'authenticated');