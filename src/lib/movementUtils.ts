// src/lib/movementUtils.ts
import { supabase } from './supabase';
import { Product, InventoryMovement } from '../types';

export async function searchProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .single();

    if (error) {
      console.error('Error searching product:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error searching product:', error);
    return null;
  }
}

export async function createInventoryMovement(
  movement: Omit<InventoryMovement, 'id' | 'created_at'>
): Promise<InventoryMovement | null> {
  try {
    // First, update product stock based on movement type
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', movement.product_id)
      .single();

    if (productError) throw productError;

    let newStock = productData.stock;
    switch (movement.type) {
      case 'entrada':
        newStock += movement.quantity;
        break;
      case 'salida':
      case 'devolucion':
        newStock -= movement.quantity;
        break;
    }

    // Validate stock doesn't go negative
    if (newStock < 0) {
      throw new Error('Insufficient stock for this movement');
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', movement.product_id);

    if (updateError) throw updateError;

    // Create movement record
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert(movement)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating inventory movement:', error);
    return null;
  }
}

export async function fetchInventoryMovements(
  storeId: string, 
  options?: {
    limit?: number, 
    page?: number, 
    type?: InventoryMovement['type']
  }
): Promise<{
  movements: (InventoryMovement & { product_name?: string })[], 
  total: number
}> {
  try {
    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        products (name)
      `, { count: 'exact' })
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (options?.type) {
      query = query.eq('type', options.type);
    }

    if (options?.limit) {
      query = query.range(
        (options.page || 0) * options.limit, 
        ((options.page || 0) * options.limit) + options.limit - 1
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data to include product name
    const movements = (data || []).map(movement => ({
      ...movement,
      product_name: movement.products?.name || 'Producto eliminado'
    }));

    return {
      movements,
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    return { movements: [], total: 0 };
  }
}