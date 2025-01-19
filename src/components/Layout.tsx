// src/components/Layout.tsx
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Modal } from './Modal';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
  const navigate = useNavigate();
  const { 
    stores, 
    currentStore, 
    selectStore, 
    showStoreSelector,
    setShowStoreSelector 
  } = useStore();
  const { signOut } = useAuth();

  const handleStoreChange = async (store: any) => {
    await selectStore(store);
    setShowStoreSelector(false);
  };

  const handleCreateStore = () => {
    setShowStoreSelector(false);
    navigate('/stores');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar 
        currentStore={currentStore}
        stores={stores}
        onStoreChange={handleStoreChange}
        onSignOut={signOut}
      />

      <div className="flex flex-col flex-1 ml-64">
        <main className="flex-1 p-6">
          <Outlet />
        </main>
        
        <Footer />
      </div>

      {/* Store Selector Modal */}
      <Modal
        isOpen={showStoreSelector}
        onClose={() => {}}
        title="Selecciona una Tienda"
      >
        <div className="space-y-6">
          {stores.length === 0 ? (
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                No tienes tiendas creadas aún.
              </p>
              <button
                onClick={handleCreateStore}
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear mi primera tienda
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleStoreChange(store)}
                  className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-semibold">{store.name}</div>
                  <div className="text-sm text-gray-500">
                    {store.description || 'Sin descripción'}
                  </div>
                </button>
              ))}
              
              <div className="pt-4 border-t">
                <button
                  onClick={handleCreateStore}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear nueva tienda
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}