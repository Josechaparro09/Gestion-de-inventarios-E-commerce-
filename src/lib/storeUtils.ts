// src/lib/storeUtils.ts
import { supabase } from './supabase';
import { Store, StoreUser } from '../types';

// Types
interface CreateStoreData {
  name: string;
  description?: string;
  address?: string;
}

interface StoresCache {
  data: Store[];
  timestamp: number;
}

// Constants
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const TIMEOUT_DURATION = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Utility Classes
class RateLimiter {
  private lastCall: number = 0;
  private minInterval: number = 1000; // 1 second

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }
    this.lastCall = Date.now();
  }
}

// Logger
enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

function log(level: LogLevel, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${LogLevel[level]}: ${message}`, data || '');
}

// Error logging
function logDetailedError(error: any) {
  log(LogLevel.ERROR, '🔴 DETAILED ERROR:', {
    type: typeof error,
    name: error.name,
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    stack: error.stack
  });
}

// Cache management
let storesCache: StoresCache | null = null;

// Retry logic
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      log(LogLevel.WARN, `Retry attempt ${i + 1} of ${maxRetries}`, { error });
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw lastError;
}

// Data validation
function validateStoreData(data: CreateStoreData): void {
  if (!data.name || data.name.trim().length === 0) {
    throw new Error('Store name is required');
  }
  if (data.name.length > 100) {
    throw new Error('Store name must be less than 100 characters');
  }
  if (data.description && data.description.length > 500) {
    throw new Error('Store description must be less than 500 characters');
  }
  if (data.address && data.address.length > 200) {
    throw new Error('Store address must be less than 200 characters');
  }
}

// Local storage functions
export function saveCurrentStore(store: Store): void {
  try {
    localStorage.setItem('currentStore', JSON.stringify(store));
    log(LogLevel.INFO, 'Store saved to localStorage', { storeId: store.id });
  } catch (error) {
    log(LogLevel.ERROR, 'Error saving store to localStorage', { error });
    throw error;
  }
}

export function getStoredStore(): Store | null {
  try {
    const storedStore = localStorage.getItem('currentStore');
    return storedStore ? JSON.parse(storedStore) : null;
  } catch (error) {
    log(LogLevel.ERROR, 'Error reading store from localStorage', { error });
    return null;
  }
}

export function clearStoredStore(): void {
  try {
    localStorage.removeItem('currentStore');
    log(LogLevel.INFO, 'Store cleared from localStorage');
  } catch (error) {
    log(LogLevel.ERROR, 'Error clearing store from localStorage', { error });
    throw error;
  }
}

// Main functionality
export async function fetchUserStores(): Promise<Store[]> {
  log(LogLevel.INFO, '🚨 FETCH USER STORES - STARTING');

  // Check cache
  if (storesCache && (Date.now() - storesCache.timestamp) < CACHE_DURATION) {
    log(LogLevel.INFO, 'Returning cached stores');
    return storesCache.data;
  }

  return new Promise(async (resolve, reject) => {
    const timeoutId = setTimeout(() => {
      log(LogLevel.ERROR, `⏰ Operation timed out after ${TIMEOUT_DURATION/1000} seconds`);
      reject(new Error(`Fetch stores operation timed out after ${TIMEOUT_DURATION/1000} seconds`));
    }, TIMEOUT_DURATION);

    try {
      // Session check
      log(LogLevel.INFO, '🔐 Checking session');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        log(LogLevel.ERROR, 'Session error', { error: sessionError });
        throw sessionError;
      }

      if (!session) {
        throw new Error('No active session found');
      }

      // User check
      log(LogLevel.INFO, '👤 Getting user');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        log(LogLevel.ERROR, 'User error', { error: userError });
        throw userError;
      }

      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Fetch stores
      log(LogLevel.INFO, '🏪 Fetching stores', { userId: user.id });
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (storesError) {
        log(LogLevel.ERROR, 'Stores query error', { error: storesError });
        throw storesError;
      }

      // Update cache
      storesCache = {
        data: stores || [],
        timestamp: Date.now()
      };

      clearTimeout(timeoutId);
      resolve(stores || []);

    } catch (error) {
      log(LogLevel.ERROR, '🚨 Comprehensive error in fetchUserStores', { error });
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}

export async function createStore(storeData: CreateStoreData): Promise<Store> {
  log(LogLevel.INFO, 'Creating new store', { storeData });
  
  try {
    validateStoreData(storeData);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('stores')
        .insert({
          ...storeData,
          user_id: user.id
        })
        .select()
        .single();
    });

    if (error) throw error;
    if (!data) throw new Error('No data returned from store creation');

    // Invalidate cache
    storesCache = null;

    log(LogLevel.INFO, 'Store created successfully', { storeId: data.id });
    return data;
  } catch (error) {
    log(LogLevel.ERROR, 'Error creating store', { error });
    throw error;
  }
}

export async function fetchCurrentStoreProducts(storeId: string): Promise<any[]> {
  log(LogLevel.INFO, 'Fetching store products', { storeId });

  try {
    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
    });

    if (error) throw error;
    
    log(LogLevel.INFO, 'Products fetched successfully', { 
      storeId, 
      count: data?.length || 0 
    });
    
    return data || [];
  } catch (error) {
    log(LogLevel.ERROR, 'Error fetching store products', { error, storeId });
    throw error;
  }
}

export async function updateCurrentStore(
  storeId: string, 
  storeData: Partial<Store>
): Promise<Store> {
  log(LogLevel.INFO, 'Updating store', { storeId, storeData });

  try {
    if ('name' in storeData) {
      validateStoreData(storeData as CreateStoreData);
    }

    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('stores')
        .update(storeData)
        .eq('id', storeId)
        .select()
        .single();
    });

    if (error) throw error;
    if (!data) throw new Error('No data returned from store update');

    // Invalidate cache
    storesCache = null;

    log(LogLevel.INFO, 'Store updated successfully', { storeId });
    return data;
  } catch (error) {
    log(LogLevel.ERROR, 'Error updating store', { error, storeId });
    throw error;
  }
}

export async function deleteStore(storeId: string): Promise<void> {
  log(LogLevel.INFO, 'Deleting store', { storeId });

  try {
    const { error } = await withRetry(async () => {
      return await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);
    });

    if (error) throw error;

    // Invalidate cache
    storesCache = null;

    log(LogLevel.INFO, 'Store deleted successfully', { storeId });
  } catch (error) {
    log(LogLevel.ERROR, 'Error deleting store', { error, storeId });
    throw error;
  }
}

export async function addUserToStore(
  storeId: string, 
  userId: string, 
  role: StoreUser['role'] = 'staff'
): Promise<StoreUser> {
  log(LogLevel.INFO, 'Adding user to store', { storeId, userId, role });

  try {
    const { data, error } = await withRetry(async () => {
      return await supabase
        .from('store_users')
        .insert({ store_id: storeId, user_id: userId, role })
        .select()
        .single();
    });

    if (error) throw error;
    if (!data) throw new Error('No data returned from user addition');

    log(LogLevel.INFO, 'User added to store successfully', { 
      storeId, 
      userId, 
      role 
    });
    
    return data;
  } catch (error) {
    log(LogLevel.ERROR, 'Error adding user to store', { 
      error, 
      storeId, 
      userId 
    });
    throw error;
  }
}