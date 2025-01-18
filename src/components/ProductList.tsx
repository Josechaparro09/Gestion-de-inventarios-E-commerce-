import { useState, useMemo, useEffect } from 'react';
import { Edit2, Trash2, Barcode, Search } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { InventoryDashboard } from './InventoryDashboard';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Modal } from './Modal';
import { BarcodeGenerator } from './BarcodeGenerator';

export function ProductList() {
  const { products, currentStore, refreshProducts } = useStore();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);
  
  const handleDeleteProduct = async (product: Product) => {
    try {
      if (!currentStore) {
        throw new Error('No store selected');
      }

      const confirmDelete = window.confirm(
        `¿Estás seguro de eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`
      );

      if (!confirmDelete) return;

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id)
        .eq('store_id', currentStore.id);

      if (error) throw error;

      showToast({
        message: 'Producto eliminado exitosamente',
        type: 'success'
      });
      
      await refreshProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast({
        message: `No se pudo eliminar el producto: ${(error as any).message}`,
        type: 'error'
      });
    }
  };

  const handleShowBarcode = (product: Product) => {
    setSelectedProduct(product);
    setShowBarcodeModal(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
        <Link
          to="/products/add"
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
        >
          Agregar Producto
        </Link>
      </div>

      {/* Dashboard */}
      <InventoryDashboard products={products} />

      {/* Búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, categoría o código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-24 w-24 flex-shrink-0">
                        <img
                          src={product.image || '/images/default/product-placeholder.png'}
                          alt={product.name}
                          className="h-24 w-24 object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {product.barcode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-teal-100 text-teal-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(product.unitCost)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(product.salePrice)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Margen: {((product.salePrice - product.unitCost) / product.salePrice * 100).toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`text-sm font-medium ${
                      product.stock > 10 ? 'text-green-600' : 
                      product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {product.stock}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleShowBarcode(product)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Ver código"
                      >
                        <Barcode className="w-5 h-5" />
                      </button>
                      <Link
                        to={`/products/edit/${product.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron productos que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>

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
    </div>
  );
}