import { useState, useRef, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpToLine, RotateCcw, Truck, X } from 'lucide-react';
import { searchProductByBarcode, createInventoryMovement, getCarriers } from '../lib/movementUtils';
import { Product } from '../types';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from './Modal';
import { formatCurrency } from '../lib/utils';

interface SelectedProduct extends Product {
  quantity: number;
}

export function InventoryMovement() {
  const { currentStore } = useStore();
  const { session } = useAuth();
  const { showToast } = useToast();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const trackingInputRef = useRef<HTMLInputElement>(null);

  const [barcode, setBarcode] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [movementType, setMovementType] = useState<'entrada' | 'salida' | 'devolucion'>('entrada');
  const [notes, setNotes] = useState('');
  
  // Nuevos estados para las funcionalidades adicionales
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isSingleUnit, setIsSingleUnit] = useState(false);
  const [isLocal, setIsLocal] = useState(false);
  const [hasPackingList, setHasPackingList] = useState(false);
  const [hasDispatchRelation, setHasDispatchRelation] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [carriers, setCarriers] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (movementType === 'salida' && hasDispatchRelation) {
      loadCarriers();
    }
  }, [movementType, hasDispatchRelation]);

  const loadCarriers = async () => {
    try {
      const carriersList = await getCarriers();
      setCarriers(carriersList);
    } catch (error) {
      console.error('Error loading carriers:', error);
    }
  };

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

        console.log('Producto encontrado:', foundProduct.salePrice);
        // Verificar si el producto ya está en la lista
        const existingProductIndex = selectedProducts.findIndex(p => p.id === foundProduct.id);
        
        if (existingProductIndex >= 0) {
          // Si el producto ya existe, incrementar su cantidad
          const updatedProducts = [...selectedProducts];
          updatedProducts[existingProductIndex].quantity += 1;
          setSelectedProducts(updatedProducts);
        } else {
          // Si es un nuevo producto, agregarlo a la lista
          setSelectedProducts([...selectedProducts, { ...foundProduct, quantity: 1 }]);
        }

        showToast({
          message: `Producto ${foundProduct.name} agregado`,
          type: 'success'
        });

        // Manejar el focus según la configuración
        if (isSingleUnit && trackingInputRef.current && !isLocal && !isPending && movementType === 'salida') {
          trackingInputRef.current.focus();
        } else {
          setBarcode(''); // Limpiar el input para escanear el siguiente producto
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
          }
        }
      } else {
        showToast({
          message: 'Producto no encontrado',
          type: 'error'
        });
      }
    }
  };



  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const updateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, quantity: newQuantity } : p
    ));
  };

  const handleSubmitMovement = async () => {
    if (selectedProducts.length === 0 || !currentStore || !session) {
      showToast({
        message: 'No hay productos seleccionados',
        type: 'error'
      });
      return;
    }

    // Validaciones adicionales para salidas
    if (movementType === 'salida' && !isLocal && !isPending && !trackingNumber) {
      showToast({
        message: 'El número de guía es requerido para envíos no locales',
        type: 'error'
      });
      return;
    }

    try {
      // Crear un movimiento para cada producto
      for (const product of selectedProducts) {
        const movement = await createInventoryMovement({
          product_id: product.id,
          store_id: currentStore.id,
          type: movementType,
          quantity: product.quantity,
          notes,
          user_id: session.user.id,
          tracking_number: trackingNumber || null,
          is_pending: isPending,
          is_single_unit: isSingleUnit,
          is_local: isLocal,
          has_packing_list: hasPackingList,
          carrier_id: hasDispatchRelation ? selectedCarrier : null
        });

        if (!movement) throw new Error(`Error al procesar el producto ${product.name}`);
      }

      showToast({
        message: `Movimiento de ${movementType} registrado exitosamente`,
        type: 'success'
      });
      
      // Reset form
      resetForm();
    } catch (error) {
      showToast({
        message: 'Error al procesar el movimiento',
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setBarcode('');
    setSelectedProducts([]);
    setNotes('');
    setTrackingNumber('');
    setIsPending(false);
    setIsSingleUnit(false);
    setIsLocal(false);
    setHasPackingList(false);
    setHasDispatchRelation(false);
    setSelectedCarrier(null);
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Movimientos de Inventario</h2>

      {/* Movement Type Selection */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setMovementType('entrada')}
          className={`flex items-center justify-center p-4 rounded-lg transition-colors ${
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
          className={`flex items-center justify-center p-4 rounded-lg transition-colors ${
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
          className={`flex items-center justify-center p-4 rounded-lg transition-colors ${
            movementType === 'devolucion' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Devolución
        </button>
      </div>

      {/* Opciones adicionales para salidas */}
      {movementType === 'salida' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPending"
              checked={isPending}
              onChange={(e) => setIsPending(e.target.checked)}
              className="w-4 h-4 text-teal-600"
            />
            <label htmlFor="isPending">Guía Pendiente</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isSingleUnit"
              checked={isSingleUnit}
              onChange={(e) => setIsSingleUnit(e.target.checked)}
              className="w-4 h-4 text-teal-600"
            />
            <label htmlFor="isSingleUnit">Unidad Única</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isLocal"
              checked={isLocal}
              onChange={(e) => setIsLocal(e.target.checked)}
              className="w-4 h-4 text-teal-600"
            />
            <label htmlFor="isLocal">Envío Local</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasPackingList"
              checked={hasPackingList}
              onChange={(e) => setHasPackingList(e.target.checked)}
              className="w-4 h-4 text-teal-600"
            />
            <label htmlFor="hasPackingList">Packing List</label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasDispatchRelation"
              checked={hasDispatchRelation}
              onChange={(e) => setHasDispatchRelation(e.target.checked)}
              className="w-4 h-4 text-teal-600"
            />
            <label htmlFor="hasDispatchRelation">Relación de Despacho</label>
          </div>
        </div>
      )}

      {/* Barcode Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Producto por Código de Barras
        </label>
        <input
          ref={barcodeInputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={handleBarcodeSearch}
          placeholder="Escanea o ingresa el código de barras"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring focus:ring-teal-200 transition-colors"
        />
      </div>

      {/* Selected Products List */}
      {selectedProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img 
                        src={product.image || '/images/default/product-placeholder.png'} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.barcode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateProductQuantity(product.id, product.quantity - 1)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center border rounded"
                        min="1"
                      />
                      <button
                        onClick={() => updateProductQuantity(product.id, product.quantity + 1)}
                        className="p-1 rounded hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">

                    {formatCurrency(product.salePrice)}
                  </td>
                  <td className="px-6 py-4">
                    {formatCurrency(product.salePrice * product.quantity)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => removeProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td colSpan={3} className="px-6 py-4 text-right font-medium">
                  Total:
                </td>
                <td className="px-6 py-4 font-medium">
                  {formatCurrency(
                    selectedProducts.reduce((sum, p) => sum + (p.salePrice * p.quantity), 0)
                  )}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tracking Number and Carrier Selection */}
      {movementType === 'salida' && !isPending && !isLocal && (
        <div className="space-y-4">
          {hasDispatchRelation && (
            <button
              onClick={() => setShowCarrierModal(true)}
              className="w-full flex items-center justify-center px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Truck className="w-5 h-5 mr-2" />
              {selectedCarrier ? 
                `Transportadora: ${carriers.find(c => c.id === selectedCarrier)?.name}` : 
                'Seleccionar Transportadora'}
            </button>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Guía
            </label>
            <input
              ref={trackingInputRef}
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Ingresa el número de guía"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring focus:ring-teal-200 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas (Opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Agrega notas adicionales"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-teal-500 focus:ring focus:ring-teal-200 transition-colors"
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmitMovement}
        disabled={selectedProducts.length === 0}
        className={`w-full py-3 rounded-lg transition-colors ${
          selectedProducts.length > 0 
            ? 'bg-teal-600 text-white hover:bg-teal-700' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Registrar Movimiento
      </button>

      {/* Carrier Selection Modal */}
      <Modal
        isOpen={showCarrierModal}
        onClose={() => setShowCarrierModal(false)}
        title="Seleccionar Transportadora"
      >
        <div className="grid grid-cols-1 gap-2">
          {carriers.map((carrier) => (
            <button
              key={carrier.id}
              onClick={() => {
                setSelectedCarrier(carrier.id);
                setShowCarrierModal(false);
              }}
              className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                selectedCarrier === carrier.id
                  ? 'bg-teal-100 text-teal-800'
                  : 'hover:bg-gray-100'
              }`}
            >
              <span className="font-medium">{carrier.name}</span>
              <Truck className="w-5 h-5" />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}