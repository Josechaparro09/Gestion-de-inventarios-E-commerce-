import { useState, useEffect } from 'react';
import { 
  Package2, 
  List, 
  LogOut, 
  Store, 
  SwitchCamera, 
  Settings,
  PackageOpen,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Store as StoreType } from '../types';
import { Modal } from './Modal';
import { useToast } from '../contexts/ToastContext';
import { fetchUserStores } from '../lib/storeUtils';
import { NetxelLoader } from './NetxelLoader';

interface SidebarProps {
  currentStore: StoreType | null;
  stores: StoreType[];
  onStoreChange: (store: StoreType) => void;
  onSignOut: () => void;
}

export function Sidebar({ 
  currentStore, 
  stores: initialStores, 
  onStoreChange, 
  onSignOut 
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [stores, setStores] = useState(initialStores);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh stores list
  const refreshStores = async () => {
    try {
      setIsLoading(true);
      const updatedStores = await fetchUserStores();
      setStores(updatedStores);
      
      // If current store was deleted, select first available store
      if (currentStore && !updatedStores.find(store => store.id === currentStore.id)) {
        if (updatedStores.length > 0) {
          onStoreChange(updatedStores[0]);
        }
      }
    } catch (error) {
      console.error('Error refreshing stores:', error);
      showToast({
        message: 'Error al actualizar la lista de tiendas',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh stores when component mounts
  useEffect(() => {
    refreshStores();
  }, []);

  // Refresh stores when current store changes
  useEffect(() => {
    refreshStores();
  }, [currentStore]);

  const handleStoreSelect = async (store: StoreType) => {
    try {
      setIsLoading(true);
      await onStoreChange(store);
      setIsStoreModalOpen(false);
      showToast({
        message: `Tienda "${store.name}" seleccionada`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error changing store:', error);
      showToast({
        message: 'Error al cambiar de tienda',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStoreClick = () => {
    setIsStoreModalOpen(false);
    navigate('/stores');
  };

  // Helper function to determine if a route is active
  const isActiveRoute = (route: string) => {
    return location.pathname === route;
  };

  return (
    <>
      <aside className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-teal-900 to-teal-800 text-white flex flex-col">
        {/* Header with Logo and Store Switcher */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-teal-700">
          <img 
            src="/images/NetxelGreen.svg" 
            alt="Netxel" 
            className="h-8" 
          />
          
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
        <div className="px-6 py-4 border-b border-teal-700">
          {currentStore ? (
            <div className="flex items-center space-x-3">
              <Store className="w-6 h-6 text-teal-300" />
              <div>
                <p className="text-sm font-medium truncate">
                  {currentStore.name}
                </p>
                <p className="text-xs text-teal-200 truncate">
                  {currentStore.description || 'Sin descripción'}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsStoreModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-teal-700 rounded-lg hover:bg-teal-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Seleccionar Tienda</span>
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {/* Productos Section */}
            <div className="px-3 py-2 text-sm text-teal-300 uppercase tracking-wider">
              Productos
            </div>
            
            <div className="space-y-1">
              <Link
                to="/products/add"
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActiveRoute('/products/add')
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
                  isActiveRoute('/products/list')
                    ? 'bg-teal-700 text-white' 
                    : 'text-teal-100 hover:bg-teal-800'
                )}
              >
                <List className="w-5 h-5" />
                <span>Lista de productos</span>
              </Link>
            </div>

            {/* Inventory Section */}
            <div className="px-3 py-2 text-sm text-teal-300 uppercase tracking-wider">
              Inventario
            </div>
            
            <div className="space-y-1">
              <Link
                to="/inventory/movements"
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActiveRoute('/inventory/movements')
                    ? 'bg-teal-700 text-white' 
                    : 'text-teal-100 hover:bg-teal-800'
                )}
              >
                <PackageOpen className="w-5 h-5" />
                <span>Movimientos</span>
              </Link>

              <Link
                to="/inventory/history"
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActiveRoute('/inventory/history')
                    ? 'bg-teal-700 text-white' 
                    : 'text-teal-100 hover:bg-teal-800'
                )}
              >
                <RefreshCw className="w-5 h-5" />
                <span>Historial</span>
              </Link>
            </div>

            {/* Settings Section */}
            <div className="px-3 py-2 text-sm text-teal-300 uppercase tracking-wider">
              Configuración
            </div>
            
            <div className="space-y-1">
              <Link
                to="/stores"
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors",
                  isActiveRoute('/stores')
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

        {/* Sign Out Section */}
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
        {isLoading ? (
          <div className="flex justify-center py-8">
            <NetxelLoader size="large" />
          </div>
        ) : (
          <div className="space-y-4">
            {stores.length === 0 ? (
              <div className="text-center py-6">
                <Store className="w-16 h-16 mx-auto text-teal-600 mb-4" />
                <p className="text-gray-500 mb-4">No tienes tiendas creadas aún.</p>
                <button
                  onClick={handleCreateStoreClick}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                >
                  Crear mi primera tienda
                </button>
              </div>
            ) : (
              <>
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreSelect(store)}
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
                          <div className="text-sm text-gray-500">
                            {store.description}
                          </div>
                        )}
                      </div>
                      {currentStore?.id === store.id && (
                        <Store className="w-5 h-5 text-teal-600" />
                      )}
                    </div>
                  </button>
                ))}

                <div className="pt-4 border-t mt-4">
                  <button
                    onClick={handleCreateStoreClick}
                    className="w-full flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                  >
                    <Store className="w-5 h-5 mr-2" />
                    Crear nueva tienda
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}