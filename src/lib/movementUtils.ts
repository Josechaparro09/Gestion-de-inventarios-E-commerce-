// src/lib/movementUtils.ts
import { supabase } from './supabase';
import { Product } from '../types';

// Tipos
interface InventoryMovement {
  id: string;
  product_id: string;
  store_id: string;
  user_id: string;
  type: 'entrada' | 'salida' | 'devolucion';
  quantity: number;
  notes?: string;
  reference_number?: string;
  created_at: string;
  previous_stock?: number;
  new_stock?: number;
  source?: string;
  device_info?: any;
  tracking_number?: string;
  is_pending: boolean;
  is_single_unit: boolean;
  is_local: boolean;
  has_packing_list: boolean;
  carrier_id?: string;
}

interface InventoryMovementCreate {
  product_id: string;
  store_id: string;
  user_id: string;
  type: 'entrada' | 'salida' | 'devolucion';
  quantity: number;
  notes?: string;
  tracking_number?: string | null;
  is_pending?: boolean;
  is_single_unit?: boolean;
  is_local?: boolean;
  has_packing_list?: boolean;
  carrier_id?: string | null;
  device_info?: any;
}

interface MovementQueryOptions {
  limit?: number;
  page?: number;
  type?: 'entrada' | 'salida' | 'devolucion';
  startDate?: Date;
  endDate?: Date;
  productId?: string;
  carrierId?: string;
  isPending?: boolean;
  hasPackingList?: boolean;
}

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

export async function getCarriers() {
  try {
    const { data, error } = await supabase
      .from('carriers')
      .select('id, name, code')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching carriers:', error);
    return [];
  }
}

export async function createInventoryMovement(
  movement: InventoryMovementCreate
): Promise<InventoryMovement | null> {
  try {
    // Validaciones iniciales
    if (!movement.product_id || !movement.store_id || !movement.user_id) {
      throw new Error('Missing required fields');
    }

    if (movement.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    // Validaciones específicas para salidas
    if (movement.type === 'salida') {
      if (!movement.is_local && !movement.is_pending && !movement.tracking_number) {
        throw new Error('Tracking number is required for non-local, non-pending shipments');
      }

      if (movement.carrier_id && !movement.tracking_number&& !movement.is_pending && !movement.is_local) {
        throw new Error('Tracking number is required when carrier is selected');
      }
    }

    // Obtener stock actual
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', movement.product_id)
      .single();

    if (productError) throw productError;

    // Calcular nuevo stock
    let newStock = productData.stock;
    switch (movement.type) {
      case 'entrada':
        newStock += movement.quantity;
        break;
      case 'salida':
        newStock -= movement.quantity;
        break;
      case 'devolucion':
        newStock += movement.quantity; // Las devoluciones aumentan el stock
        break;
    }

    // Validar stock suficiente
    if (newStock < 0) {
      throw new Error('Stock insuficiente para este movimiento');
    }

    // Actualizar stock del producto
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', movement.product_id);

    if (updateError) throw updateError;

    // Crear registro de movimiento
    const { data, error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        ...movement,
        previous_stock: productData.stock,
        new_stock: newStock,
        device_info: movement.device_info || {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (movementError) throw movementError;

    return data;
  } catch (error) {
    console.error('Error creating inventory movement:', error);
    throw error;
  }
}

export async function fetchInventoryMovements(
  storeId: string,
  options: MovementQueryOptions = {}
): Promise<{
  movements: (InventoryMovement & { 
    product_name: string;
    carrier_name: string | null;
  })[];
  total: number;
}> {
  try {
    let query = supabase
      .from('inventory_movements')
      .select(`
        *,
        products (name),
        carriers (name)
      `, { count: 'exact' })
      .eq('store_id', storeId);

    // Aplicar filtros
    if (options.type) {
      query = query.eq('type', options.type);
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    if (options.productId) {
      query = query.eq('product_id', options.productId);
    }

    if (options.carrierId) {
      query = query.eq('carrier_id', options.carrierId);
    }

    if (options.isPending !== undefined) {
      query = query.eq('is_pending', options.isPending);
    }

    if (options.hasPackingList !== undefined) {
      query = query.eq('has_packing_list', options.hasPackingList);
    }

    // Ordenar por fecha de creación descendente
    query = query.order('created_at', { ascending: false });

    // Aplicar paginación
    if (options.limit) {
      const from = (options.page || 0) * options.limit;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Transformar datos y agregar nombres de producto y transportadora
    const movements = (data || []).map(movement => ({
      ...movement,
      product_name: movement.products?.name || 'Producto eliminado',
      carrier_name: movement.carriers?.name || null
    }));

    return {
      movements,
      total: count || 0
    };
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    throw error;
  }
}

export async function updateMovementStatus(
  movementId: string,
  updates: {
    tracking_number?: string;
    carrier_id?: string;
    is_pending?: boolean;
    notes?: string;
  }
): Promise<InventoryMovement | null> {
  try {
    const { data, error } = await supabase
      .from('inventory_movements')
      .update(updates)
      .eq('id', movementId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating movement status:', error);
    throw error;
  }
}

export async function getMovementStats(storeId: string, days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        type,
        quantity,
        created_at
      `)
      .eq('store_id', storeId)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Procesar estadísticas
    const stats = {
      total_movements: data.length,
      entries: data.filter(m => m.type === 'entrada').length,
      exits: data.filter(m => m.type === 'salida').length,
      returns: data.filter(m => m.type === 'devolucion').length,
      total_quantity: data.reduce((sum, m) => sum + m.quantity, 0),
      by_day: {} as Record<string, {
        entries: number,
        exits: number,
        returns: number
      }>
    };

    // Agrupar por día
    data.forEach(movement => {
      const date = movement.created_at.split('T')[0];
      if (!stats.by_day[date]) {
        stats.by_day[date] = { entries: 0, exits: 0, returns: 0 };
      }
      switch (movement.type) {
        case 'entrada':
          stats.by_day[date].entries++;
          break;
        case 'salida':
          stats.by_day[date].exits++;
          break;
        case 'devolucion':
          stats.by_day[date].returns++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting movement stats:', error);
    throw error;
  }
}