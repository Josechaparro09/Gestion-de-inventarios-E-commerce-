// src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ProductList } from './components/ProductList';
import { ProductForm } from './components/ProductForm';
import { BarcodeGenerator } from './components/BarcodeGenerator';
import { StoreManagement } from './components/StoreManagement';
import { Modal } from './components/Modal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { Auth } from './components/Auth';
import { Product, Store } from './types';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { NetxelLoader } from './components/NetxelLoader';
import { 
  fetchUserStores, 
  fetchCurrentStoreProducts,
  saveCurrentStore,
  getStoredStore,
  clearStoredStore
} from './lib/storeUtils';

function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  

  useEffect(() => {
    // Verificar si ya hay una sesión almacenada
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSession(session);
        // Solo inicializar tiendas si no se han inicializado antes
        if (stores.length === 0) {
          await initializeUserStores();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          // Solo inicializar tiendas si no se han inicializado
          if (stores.length === 0) {
            await initializeUserStores();
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const initializeUserStores = async () => {
    try {
      setLoading(true);
      const userStores = await fetchUserStores();
      setStores(userStores);

      // Check for stored store
      const storedStore = getStoredStore();

      // Validate stored store exists in current user's stores
      const validStoredStore = storedStore 
        ? userStores.find(store => store.id === storedStore.id)
        : null;

      if (validStoredStore) {
        // If stored store is valid, select it
        selectStore(validStoredStore);
      } else if (userStores.length === 0) {
        // If no stores, show store selector
        setShowStoreSelector(true);
      } else if (userStores.length === 1) {
        // If only one store, select it automatically
        selectStore(userStores[0]);
      } else {
        // Multiple stores, but no valid stored store
        setShowStoreSelector(true);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setToast({
        message: 'No se pudieron cargar las tiendas',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectStore = async (store: Store) => {
    try {
      setLoading(true);
      // Save selected store to localStorage
      saveCurrentStore(store);

      setCurrentStore(store);
      const storeProducts = await fetchCurrentStoreProducts(store.id);
      
      const parsedProducts = storeProducts.map(product => ({
        ...product,
        unitCost: Number(product.unit_cost),
        salePrice: Number(product.sale_price),
        stock: Number(product.stock)
      }));
      
      setProducts(parsedProducts);
      setShowStoreSelector(false);
    } catch (error) {
      console.error('Error fetching store products:', error);
      setToast({
        message: 'No se pudieron cargar los productos de la tienda',
        type: 'error'
      });
    }finally {
      setLoading(false);
    }
  };
  

  const handleStoreCreation = (newStore: Store) => {
    // Update stores list
    setStores(prevStores => [...prevStores, newStore]);
    
    // Automatically select the new store
    selectStore(newStore);
    
    // Close store selector
    setShowStoreSelector(false);
  };

  if (loading) {
    return <NetxelLoader fullScreen />;
  }
  const fetchProductById = async (id: string) => {
    if (!currentStore) {
      console.error('No store selected');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('store_id', currentStore.id)
        .single();

      if (error) throw error;

      return {
        ...data,
        unitCost: Number(data.unit_cost),
        salePrice: Number(data.sale_price),
        stock: Number(data.stock)
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  };

  const handleAddProduct = async (data: any) => {
    try {
      if (!currentStore) {
        throw new Error('No store selected');
      }

      const { image, ...rest } = data;
      
      let imageUrl = '';
      // If image is a File (new image)
      if (image instanceof File) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image);
  
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      } else {
        // If image is a URL (existing image)
        imageUrl = image || '';
      }
  
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
  
      const productData = {
        name: rest.name,
        category: rest.category,
        unit_cost: Number(rest.unitCost),
        sale_price: Number(rest.salePrice),
        stock: Number(rest.stock),
        image: imageUrl,
        barcode: rest.barcode,
        user_id: user?.id,
        store_id: currentStore.id
      };
  
      const { error: saveError } = await supabase
        .from('products')
        .upsert([{
          ...productData,
          id: rest.id // Include ID if exists (editing)
        }]);
  
      if (saveError) throw saveError;
  
      setToast({
        message: `Producto ${rest.id ? 'actualizado' : 'agregado'} exitosamente`,
        type: 'success'
      });
      
      // Refresh products for current store
      const updatedProducts = await fetchCurrentStoreProducts(currentStore.id);
      const parsedProducts = updatedProducts.map(product => ({
        ...product,
        unitCost: Number(product.unit_cost),
        salePrice: Number(product.sale_price),
        stock: Number(product.stock)
      }));
      setProducts(parsedProducts);
    } catch (error) {
      console.error('Error saving product:', error);
      setToast({
        message: `No se pudo ${data.id ? 'actualizar' : 'agregar'} el producto: ${(error as any).message}`,
        type: 'error'
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      // Ensure a store is selected
      if (!currentStore) {
        throw new Error('No store selected');
      }

      // Confirm deletion
      const confirmDelete = window.confirm(
        `¿Estás seguro de eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`
      );

      if (!confirmDelete) return;

      // Delete product from Supabase
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)
        .eq('store_id', currentStore.id);

      if (error) throw error;

      // Show success toast
      setToast({
        message: 'Producto eliminado exitosamente',
        type: 'success'
      });
      
      // Refresh products for current store
      const updatedProducts = await fetchCurrentStoreProducts(currentStore.id);
      const parsedProducts = updatedProducts.map(product => ({
        ...product,
        unitCost: Number(product.unit_cost),
        salePrice: Number(product.sale_price),
        stock: Number(product.stock)
      }));
      setProducts(parsedProducts);
    } catch (error) {
      console.error('Error deleting product:', error);
      setToast({
        message: `No se pudo eliminar el producto: ${(error as any).message}`,
        type: 'error'
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // Clear stored store on sign out
    clearStoredStore();
    setSession(null);
    setStores([]);
    setCurrentStore(null);
    setProducts([]);
  };

  if (!session) {
    return <Auth onSuccess={() => initializeUserStores()} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex flex-1">
        <Sidebar
          currentStore={currentStore}
          stores={stores}
          onStoreChange={selectStore}
          onSignOut={handleSignOut}
        />
        
        <main className="flex-1 ml-64">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Navigate to="/products/list" replace />} />
              
              <Route 
                path="/products/list" 
                element={
                  <ProductList
                    products={products}
                    onDelete={handleDeleteProduct}
                    onShowBarcode={(product) => {
                      setSelectedProduct(product);
                      setShowBarcodeModal(true);
                    }}
                  />
                } 
              />
              
              <Route 
                path="/products/add" 
                element={
                  <ProductForm 
                    onSubmit={handleAddProduct}
                  />
                } 
              />

              <Route 
                path="/products/edit/:id" 
                element={
                  <ProductForm 
                    onSubmit={handleAddProduct}
                    fetchProduct={fetchProductById}
                  />
                } 
              />

              <Route 
                path="/stores" 
                element={
                  <StoreManagement 
                    onStoreCreated={handleStoreCreation} 
                  />
                } 
              />
            </Routes>
          </div>
        </main>
      </div>

      <Footer />

      {/* Store Selector Modal */}
      <Modal
        isOpen={showStoreSelector}
        onClose={() => {}}
        title="Selecciona una Tienda"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Por favor, selecciona una tienda para comenzar.</p>
          
          {stores.length === 0 ? (
            <div className="text-center">
              <p className="text-gray-500">No tienes tiendas. ¡Crea una primera!</p>
              <button
                onClick={() => {
                  navigate('/stores');
                  setShowStoreSelector(false);
                }}
                className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
              >
                Crear Tienda
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => selectStore(store)}
                  className="w-full text-left px-4 py-3 border rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="font-semibold">{store.name}</div>
                  {store.description && (
                    <div className="text-sm text-gray-500">{store.description}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Barcode Modal */}
      <Modal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        title="Código de Barras del Producto"
      >
        {selectedProduct && (
          <BarcodeGenerator
            code={selectedProduct.barcode}
            onBack={() => setShowBarcodeModal(false)}
            onFinish={() => setShowBarcodeModal(false)}
          />
        )}
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;