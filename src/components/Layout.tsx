// src/components/Layout.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Modal } from './Modal';
import { useStore } from '../contexts/StoreContext';
import { useAuth } from '../contexts/AuthContext';

export function Layout() {
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
        <div className="space-y-4">
          {stores.length === 0 ? (
            <p className="text-center text-gray-600">
              No tienes tiendas. Crea una tienda primero.
            </p>
          ) : (
            stores.map((store) => (
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
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}