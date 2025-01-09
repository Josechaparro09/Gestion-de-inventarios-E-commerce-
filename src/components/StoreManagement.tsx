import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Store as StoreIcon } from 'lucide-react';
import { 
  createStore, 
  fetchUserStores, 
  updateCurrentStore, 
  deleteStore 
} from '../lib/storeUtils';
import { Store } from '../types';
import { Modal } from './Modal';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { NetxelLoader } from './NetxelLoader';

interface StoreManagementProps {
  onStoreCreated?: (store: Store) => void;
}

export function StoreManagement({ onStoreCreated }: StoreManagementProps) {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [loading, setLoading] = useState(true);
  const [specificLoading, setSpecificLoading] = useState({
    create: false,
    update: false,
    delete: {} as Record<string, boolean>,
    fetchStores: false
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<Store>();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      setSpecificLoading(prev => ({...prev, fetchStores: true}));
      const userStores = await fetchUserStores();
      setStores(userStores);
    } catch (error) {
      console.error('Error loading stores:', error);
      // Aquí podrías añadir un toast de error
    } finally {
      setLoading(false);
      setSpecificLoading(prev => ({...prev, fetchStores: false}));
    }
  };

  const handleCreateStore = async (data: Omit<Store, 'id' | 'created_at' | 'user_id'>) => {
    try {
      setSpecificLoading(prev => ({...prev, create: true}));
      const newStore = await createStore(data);
      
      if (newStore) {
        // Reload stores to ensure we get the latest list
        await loadStores();
        
        // Optional: Call callback if provided
        if (onStoreCreated) {
          onStoreCreated(newStore);
        }
        
        setIsModalOpen(false);
        reset();
        
        // Navigate to the new store's product list
        navigate('/products/list');
      }
    } catch (error) {
      console.error('Error creating store:', error);
      // Aquí podrías añadir un toast de error
    } finally {
      setSpecificLoading(prev => ({...prev, create: false}));
    }
  };

  const handleUpdateStore = async (data: Partial<Store>) => {
    if (!selectedStore) return;

    try {
      setSpecificLoading(prev => ({...prev, update: true}));
      await updateCurrentStore(selectedStore.id, data);
      await loadStores();
      setIsModalOpen(false);
      reset();
      setSelectedStore(null);
    } catch (error) {
      console.error('Error updating store:', error);
      // Aquí podrías añadir un toast de error
    } finally {
      setSpecificLoading(prev => ({...prev, update: false}));
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta tienda? Esta acción no se puede deshacer.')) return;

    try {
      setSpecificLoading(prev => ({
        ...prev, 
        delete: {
          ...prev.delete,
          [storeId]: true
        }
      }));
      await deleteStore(storeId);
      await loadStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      // Aquí podrías añadir un toast de error
    } finally {
      setSpecificLoading(prev => ({
        ...prev, 
        delete: {
          ...prev.delete,
          [storeId]: false
        }
      }));
    }
  };

  // Loader de pantalla completa mientras se cargan las tiendas
  if (loading) {
    return <NetxelLoader fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Mis Tiendas</h2>
        <button
          onClick={() => {
            setModalMode('add');
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          disabled={specificLoading.create}
        >
          {specificLoading.create ? (
            <NetxelLoader size="small" />
          ) : (
            <>
              <Plus className="w-5 h-5 mr-2 inline" />
              Agregar Tienda
            </>
          )}
        </button>
      </div>

      {stores.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <StoreIcon className="w-16 h-16 mx-auto text-teal-600 mb-4" />
          <p className="text-gray-600">No tienes tiendas creadas aún.</p>
          <p className="text-gray-500 mb-6">Comienza agregando tu primera tienda.</p>
          <button
            onClick={() => {
              setModalMode('add');
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
          >
            Crear Primera Tienda
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <div 
              key={store.id} 
              className="bg-white rounded-lg shadow-md p-6 relative"
            >
              <div className="flex items-center space-x-4 mb-4">
                <StoreIcon className="w-10 h-10 text-teal-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {store.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {store.description || 'Sin descripción'}
                  </p>
                </div>
              </div>
              
              {store.address && (
                <div className="text-sm text-gray-600 mb-4">
                  <strong>Dirección:</strong> {store.address}
                </div>
              )}
              
              <div className="absolute bottom-4 right-4 flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedStore(store);
                    setModalMode('edit');
                    reset({
                      name: store.name,
                      description: store.description,
                      address: store.address
                    });
                    setIsModalOpen(true);
                  }}
                  disabled={specificLoading.update}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {specificLoading.update ? (
                    <NetxelLoader size="small" />
                  ) : (
                    <Edit2 className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => handleDeleteStore(store.id)}
                  disabled={specificLoading.delete[store.id]}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Agregar Tienda' : 'Editar Tienda'}
      >
        <form 
          onSubmit={handleSubmit(modalMode === 'add' ? handleCreateStore : handleUpdateStore)}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre de la Tienda
              <input
                type="text"
                {...register('name', { required: 'El nombre es requerido' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Nombre de la tienda"
              />
            </label>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Descripción (Opcional)
              <textarea
                {...register('description')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Descripción de la tienda"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Dirección (Opcional)
              <input
                type="text"
                {...register('address')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Dirección de la tienda"
              />
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={specificLoading.create || specificLoading.update}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-50"
            >
              {specificLoading.create || specificLoading.update ? (
                <NetxelLoader size="small" />
              ) : (
                modalMode === 'add' ? 'Crear Tienda' : 'Actualizar Tienda'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}