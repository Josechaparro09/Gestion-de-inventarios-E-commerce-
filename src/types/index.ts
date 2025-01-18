//src/types/index.ts
export type Store = {
  id: string;
  name: string;
  description?: string;
  address?: string;
  created_at: string;
  user_id: string;
};

export type StoreUser = {
  store_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff';
};

// Update Product type to include store_id
export type Product = {
  id: string;
  name: string;
  unitCost: number;
  salePrice: number;
  stock: number;
  image: string;
  category: string;
  barcode: string;
  user_id?: string;
  store_id?: string;
};

export type ViewMode = 'cards' | 'table';

export const CATEGORIES = [
  'Sandalias',
  'Electronica',
  'Moda',
  'Comida',
  'Libros',
  'Hogar',
  'Deporte',
  'Otra'
] as const;

export type InventoryMovement = {
  id?: string;
  product_id: string;
  store_id: string;
  type: 'entrada' | 'salida' | 'devolucion';
  quantity: number;
  notes?: string;
  created_at?: string;
  user_id: string;
};
export type Category = typeof CATEGORIES[number];

export interface BarcodeUtils {
  generateUniqueBarcode(): Promise<string>;
  isBarcodeUnique(barcode: string): Promise<boolean>;
}