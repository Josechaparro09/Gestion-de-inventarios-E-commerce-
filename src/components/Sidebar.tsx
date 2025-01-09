// src/components/Sidebar.tsx
import { useState } from 'react';
import { Package2, List, LogOut, Store, SwitchCamera, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Store as StoreType } from '../types';
import { Modal } from './Modal';

interface SidebarProps {
  currentStore: StoreType | null;
  stores: StoreType[];
  onStoreChange: (store: StoreType) => void;
  onSignOut: () => void;
}

export function Sidebar({ 
  currentStore, 
  stores, 
  onStoreChange, 
  onSignOut 
}: SidebarProps) {
  const location = useLocation();
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  return (
    <>
      <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-teal-900 to-teal-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-between px-6 border-b border-teal-700">
          <img src="/images/Logo White.png" alt="Netxel" className="h-8" />
          
          {/* Store Switcher */}
          {currentStore && (
            <button 
              onClick={() => setIsStoreModalOpen(true)}
              className="flex items-center text-sm text-teal-100 hover:text-white"
              title="Cambiar tienda"
            >
              <SwitchCamera className="w-5 h-5 mr-2" />
              Cambiar
            </button>
          )}
        </div>

        {/* Current Store Display */}
        {currentStore && (
          <div className="px-6 py-4 border-b border-teal-700">
            <div className="flex items-center space-x-3">
              <Store className="w-6 h-6 text-teal-300" />
              <div>
                <p className="text-sm font-medium truncate">{currentStore.name}</p>
                <p className="text-xs text-teal-200 truncate">
                  {currentStore.description || 'Sin descripción'}
                </p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <div className="px-3 py-2 text-sm text-teal-300 uppercase tracking-wider">
              Menú
            </div>
            
            <div className="space-y-1">
              <Link
                to="/products/add"
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  location.pathname === '/products/add'
                    ? 'bg-teal-700 text-white'
                    : 'text-teal-100 hover:bg-teal-800'
                )}
              >
                <Package2 className="w-5 h-5" />
                <span>Agregar producto</span>
              </Link>

              <Link
                to="/products/list"
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  location.pathname === '/products/list'
                    ? 'bg-teal-700 text-white'
                    : 'text-teal-100 hover:bg-teal-800'
                )}
              >
                <List className="w-5 h-5" />
                <span>Lista de productos</span>
              </Link>

              <Link
                to="/stores"
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  location.pathname === '/stores'
                    ? 'bg-teal-700 text-white'
                    : 'text-teal-100 hover:bg-teal-800'
                )}
              >
                <Settings className="w-5 h-5" />
                <span>Administrar Tiendas</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-teal-700">
          <button
            onClick={onSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-teal-100 hover:bg-teal-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Store Selector Modal */}
      <Modal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        title="Seleccionar Tienda"
      >
        <div className="space-y-4">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => {
                onStoreChange(store);
                setIsStoreModalOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-colors",
                currentStore?.id === store.id 
                  ? 'bg-teal-100 text-teal-800'
                  : 'hover:bg-gray-100'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{store.name}</div>
                  {store.description && (
                    <div className="text-sm text-gray-500">{store.description}</div>
                  )}
                </div>
                {currentStore?.id === store.id && (
                  <Store className="w-5 h-5 text-teal-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}