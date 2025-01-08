// src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ProductList } from './components/ProductList';
import { ProductForm } from './components/ProductForm';
import { BarcodeGenerator } from './components/BarcodeGenerator';
import { Modal } from './components/Modal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';
import { Auth } from './components/Auth';
import { Product } from './types';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProducts();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProducts();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const parsedProducts = data?.map(product => ({
        ...product,
        unitCost: Number(product.unit_cost),
        salePrice: Number(product.sale_price),
        stock: Number(product.stock)
      })) || [];
      
      setProducts(parsedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setToast({
        message: 'Failed to fetch products',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
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
      const { image, ...rest } = data;
      
      let imageUrl = '';
      // Handle image upload if it's a new File
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
        // Use existing image URL or empty string
        imageUrl = image || '';
      }
  
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
  
      // Create product data object with all required fields
      const productData = {
        id: rest.id || crypto.randomUUID(), // Generate UUID for new products
        name: rest.name,
        category: rest.category,
        unit_cost: Number(rest.unitCost),
        sale_price: Number(rest.salePrice),
        stock: Number(rest.stock),
        image: imageUrl,
        barcode: rest.barcode,
        user_id: user?.id,
        created_at: rest.id ? undefined : new Date().toISOString() // Only set for new products
      };
  
      // Use upsert for both creating and updating
      const { error: saveError } = await supabase
        .from('products')
        .upsert([productData], {
          onConflict: 'id'
        });
  
      if (saveError) throw saveError;
  
      setToast({
        message: `Product ${rest.id ? 'updated' : 'added'} successfully`,
        type: 'success'
      });
      
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      setToast({
        message: `Failed to ${data.id ? 'update' : 'add'} product: ${(error as any).message}`,
        type: 'error'
      });
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      setToast({
        message: 'Product deleted successfully',
        type: 'success'
      });
      
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setToast({
        message: 'Failed to delete product',
        type: 'error'
      });
    }
  };

  if (!session) {
    return <Auth onSuccess={() => fetchProducts()} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex flex-1">
        <Sidebar
          onSignOut={async () => {
            await supabase.auth.signOut();
            setSession(null);
          }}
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
            </Routes>
          </div>
        </main>
      </div>

      <Footer />

      <Modal
        isOpen={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        title="Product Barcode"
      >
        {selectedProduct && (
          <BarcodeGenerator
            code={selectedProduct.barcode}
            onBack={() => setShowBarcodeModal(false)}
            onFinish={() => setShowBarcodeModal(false)}
          />
        )}
      </Modal>

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