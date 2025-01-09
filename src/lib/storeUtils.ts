// src/lib/storeUtils.ts
import { supabase } from './supabase';
import { Store, StoreUser } from '../types';

export function saveCurrentStore(store: Store) {
    localStorage.setItem('currentStore', JSON.stringify(store));
  }
  
  // Function to retrieve stored store
  export function getStoredStore(): Store | null {
    const storedStore = localStorage.getItem('currentStore');
    return storedStore ? JSON.parse(storedStore) : null;
  }
  
  // Function to clear stored store
  export function clearStoredStore() {
    localStorage.removeItem('currentStore');
  }
  

export async function fetchUserStores(): Promise<Store[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('No authenticated user');
  
    // Fetch stores owned by the user
    const { data: ownedStores, error: ownedError } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
  
    if (ownedError) throw ownedError;
  
    // If no owned stores, return empty array
    return ownedStores || [];
}

  export async function createStore(storeData: Omit<Store, 'id' | 'created_at' | 'user_id'>): Promise<Store | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('No authenticated user');
  
    const { data, error } = await supabase
      .from('stores')
      .insert({
        ...storeData,
        user_id: user.id
      })
      .select()
      .single();
  
    if (error) throw error;
    return data;
  }
  export async function fetchCurrentStoreProducts(storeId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
  
    if (error) throw error;
    return data || [];
  }
  
  export async function updateCurrentStore(storeId: string, storeData: Partial<Store>) {
    const { data, error } = await supabase
      .from('stores')
      .update(storeData)
      .eq('id', storeId)
      .select()
      .single();
  
    if (error) throw error;
    return data;
  }
  
  export async function deleteStore(storeId: string) {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', storeId);
  
    if (error) throw error;
  }
  
  export async function addUserToStore(storeId: string, userId: string, role: StoreUser['role'] = 'staff') {
    const { data, error } = await supabase
      .from('store_users')
      .insert({ store_id: storeId, user_id: userId, role })
      .select()
      .single();
  
    if (error) throw error;
    return data;
  }