//src\lib\barcodeUtils.ts
import { supabase } from './supabase';

export async function generateUniqueBarcode(): Promise<string> {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      // Genera un código base
      const sequence = Math.floor(1000 + Math.random() * 9000);
      const barcode = `FULREF${sequence}`;

      // Verifica si existe en la base de datos
      const { data, error } = await supabase
        .from('products')
        .select('barcode')
        .eq('barcode', barcode)
        .single();

      // Si no hay error y no hay datos, significa que el código es único
      if (!error && !data) {
        return barcode;
      }
    } catch (error) {
      console.error('Error al generar código:', error);
    }
    attempts++;
  }
  throw new Error('No se pudo generar un código único después de varios intentos');
}

export async function isBarcodeUnique(barcode: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('products')
    .select('barcode')
    .eq('barcode', barcode)
    .single();
  
  // Si no hay error y no hay datos, el código es único
  return !error && !data;
}