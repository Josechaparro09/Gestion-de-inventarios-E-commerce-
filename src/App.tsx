import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StoreProvider } from './contexts/StoreContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { ProductList } from './components/ProductList';
import { ProductForm } from './components/ProductForm';
import { StoreManagement } from './components/StoreManagement';
import { InventoryMovement } from './components/InventoryMovement';
import { InventoryMovementsList } from './components/InventoryMovementsList';

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <ToastProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/products/list" replace />} />
              <Route path="/products/list" element={<ProductList />} />
              <Route path="/products/add" element={<ProductForm />} />
              <Route path="/products/edit/:id" element={<ProductForm />} />
              <Route path="/stores" element={<StoreManagement />} />
              <Route path="/inventory/movements" element={<InventoryMovement />} />
              <Route path="/inventory/history" element={<InventoryMovementsList />} />
            </Route>
          </Routes>
        </ToastProvider>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;