// src/components/InventoryMovement.tsx
import { useState } from 'react';
import { Package, RefreshCw, ArrowDownToLine, ArrowUpToLine, RotateCcw } from 'lucide-react';
import { searchProductByBarcode, createInventoryMovement } from '../lib/movementUtils';
import { Product } from '../types';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export function InventoryMovement() {
  const { currentStore } = useStore();
  const { session } = useAuth();
  const { showToast } = useToast();

  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'salida' | 'devolucion'>('entrada');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleBarcodeSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!currentStore) {
        showToast({
          message: 'Por favor, selecciona una tienda primero',
          type: 'error'
        });
        return;
      }

      const foundProduct = await searchProductByBarcode(barcode);
      if (foundProduct) {
        setProduct(foundProduct);
        showToast({
          message: `Producto encontrado: ${foundProduct.name}`,
          type: 'success'
        });
      } else {
        showToast({
          message: 'Producto no encontrado',
          type: 'error'
        });
        setProduct(null);
      }
    }
  };

  const handleSubmitMovement = async () => {
    if (!product || !currentStore || !session) {
      showToast({
        message: 'Datos incompletos para realizar el movimiento',
        type: 'error'
      });
      return;
    }

    try {
      const movement = await createInventoryMovement({
        product_id: product.id,
        store_id: currentStore.id,
        type: movementType,
        quantity,
        notes,
        user_id: session.user.id
      });

      if (movement) {
        showToast({
          message: `Movimiento de ${movementType} registrado exitosamente`,
          type: 'success'
        });
        
        // Reset form
        setBarcode('');
        setProduct(null);
        setQuantity(1);
        setNotes('');
      } else {
        showToast({
          message: 'Error al registrar el movimiento',
          type: 'error'
        });
      }
    } catch (error) {
      showToast({
        message: 'Error al procesar el movimiento',
        type: 'error'
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Movimientos de Inventario</h2>

      {/* Barcode Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Producto por Código de Barras
        </label>
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleBarcodeSearch}
          placeholder="Escanea o ingresa el código de barras"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring focus:ring-teal-200 transition-colors"
        />
      </div>

      {/* Product Display */}
      {product && (
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-6">
          <img
            src={product.image || '/images/default/product-placeholder.png'}
            alt={product.name}
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-600">Código: {product.barcode}</p>
            <p className="text-sm text-gray-600">Stock Actual: {product.stock}</p>
          </div>
        </div>
      )}

      {/* Movement Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Movimiento
        </label>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setMovementType('entrada')}
            className={`flex items-center justify-center py-3 rounded-lg transition-colors ${
              movementType === 'entrada' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowDownToLine className="w-5 h-5 mr-2" />
            Entrada
          </button>
          <button
            onClick={() => setMovementType('salida')}
            className={`flex items-center justify-center py-3 rounded-lg transition-colors ${
              movementType === 'salida' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowUpToLine className="w-5 h-5 mr-2" />
            Salida
          </button>
          <button
            onClick={() => setMovementType('devolucion')}
            className={`flex items-center justify-center py-3 rounded-lg transition-colors ${
              movementType === 'devolucion' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Devolución
          </button>
        </div>
      </div>

      {/* Quantity and Notes */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring focus:ring-teal-200 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas (Opcional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring focus:ring-teal-200 transition-colors"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          onClick={handleSubmitMovement}
          disabled={!product}
          className={`w-full py-3 rounded-lg transition-colors ${
            product 
              ? 'bg-teal-600 text-white hover:bg-teal-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Registrar Movimiento
        </button>
      </div>
    </div>
  );
}