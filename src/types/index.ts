//src/types/index.ts
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
};

export type ViewMode = 'cards' | 'table';

export const CATEGORIES = [
  'Electronica',
  'Moda',
  'Comida',
  'Libros',
  'Hogar',
  'Deporte',
  'Otra'
] as const;

export type Category = typeof CATEGORIES[number];

export interface BarcodeUtils {
  generateUniqueBarcode(): Promise<string>;
  isBarcodeUnique(barcode: string): Promise<boolean>;
}