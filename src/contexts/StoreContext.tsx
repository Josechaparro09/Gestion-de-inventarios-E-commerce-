// src/contexts/StoreContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Store, Product } from '../types';
import { fetchUserStores, fetchCurrentStoreProducts, saveCurrentStore, getStoredStore } from '../lib/storeUtils';
import { useAuth } from './AuthContext';

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  products: Product[];
  loading: boolean;
  selectStore: (store: Store) => Promise<void>;
  refreshProducts: () => Promise<void>;
  showStoreSelector: boolean;
  setShowStoreSelector: (show: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  useEffect(() => {
    if (session) {
      initializeStores();
    }
  }, [session]);

  const initializeStores = async () => {
    try {
      setLoading(true);
      const userStores = await fetchUserStores();
      setStores(userStores);

      const storedStore = getStoredStore();
      const validStoredStore = storedStore 
        ? userStores.find(store => store.id === storedStore.id)
        : null;

      if (validStoredStore) {
        await selectStore(validStoredStore);
      } else if (userStores.length === 0) {
        setShowStoreSelector(true);
      } else if (userStores.length === 1) {
        await selectStore(userStores[0]);
      } else {
        setShowStoreSelector(true);
      }
    } catch (error) {
      console.error('Error initializing stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectStore = async (store: Store) => {
    try {
      setLoading(true);
      saveCurrentStore(store);
      setCurrentStore(store);
      await refreshProducts();
      setShowStoreSelector(false);
    } catch (error) {
      console.error('Error selecting store:', error);
      setShowStoreSelector(true);
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = async () => {
    if (!currentStore) return;
    
    const storeProducts = await fetchCurrentStoreProducts(currentStore.id);
    const parsedProducts = storeProducts.map(product => ({
      ...product,
      unitCost: Number(product.unit_cost),
      salePrice: Number(product.sale_price),
      stock: Number(product.stock)
    }));
    setProducts(parsedProducts);
  };

  return (
    <StoreContext.Provider value={{
      stores,
      currentStore,
      products,
      loading,
      selectStore,
      refreshProducts,
      showStoreSelector,
      setShowStoreSelector
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};