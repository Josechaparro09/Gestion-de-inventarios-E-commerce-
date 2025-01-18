// src/components/InventoryMovementsList.tsx
import { useState, useEffect } from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpToLine, 
  RotateCcw, 
  Filter,
  Download 
} from 'lucide-react';
import { fetchInventoryMovements } from '../lib/movementUtils';
import { useStore } from '../contexts/StoreContext';
import { formatCurrency } from '../lib/utils';
import Papa from 'papaparse';

export function InventoryMovementsList() {
  const { currentStore, products } = useStore();
  const [movements, setMovements] = useState<any[]>([]);
  const [totalMovements, setTotalMovements] = useState(0);
  const [filter, setFilter] = useState<'entrada' | 'salida' | 'devolucion' | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const pageSize = 10;

  useEffect(() => {
    loadMovements();
  }, [currentStore, filter, page]);

  const loadMovements = async () => {
    if (!currentStore) return;

    setLoading(true);
    try {
      const { movements, total } = await fetchInventoryMovements(
        currentStore.id, 
        { 
          limit: pageSize, 
          page, 
          type: filter || undefined 
        }
      );
      setMovements(movements);
      setTotalMovements(total);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMovementIcon = (type: string) => {
    switch (type) {
      case 'entrada':
        return <ArrowDownToLine className="w-5 h-5 text-green-600" />;
      case 'salida':
        return <ArrowUpToLine className="w-5 h-5 text-red-600" />;
      case 'devolucion':
        return <RotateCcw className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'salida': return 'Salida';
      case 'devolucion': return 'Devolución';
      default: return type;
    }
  };

  const handleExportToCSV = () => {
    if (!movements.length) return;

    const csvData = movements.map(movement => ({
      Fecha: new Date(movement.created_at).toLocaleString(),
      Producto: movement.product_name,
      Tipo: getMovementTypeLabel(movement.type),
      Cantidad: movement.quantity,
      Notas: movement.notes || '-'
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `movimientos_inventario_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Movimientos de Inventario
        </h2>
        
        <div className="flex items-center space-x-4">
          {/* Filter Buttons */}
          <button 
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === null 
                ? 'bg-teal-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          
          <button 
            onClick={() => setFilter('entrada')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              filter === 'entrada' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowDownToLine className="w-5 h-5 mr-2" />
            Entradas
          </button>
          
          <button 
            onClick={() => setFilter('salida')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              filter === 'salida' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowUpToLine className="w-5 h-5 mr-2" />
            Salidas
          </button>
          
          <button 
            onClick={() => setFilter('devolucion')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              filter === 'devolucion' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Devoluciones
          </button>

          {/* Export to CSV Button */}
          <button 
            onClick={handleExportToCSV}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="Exportar a CSV"
          >
            <Download className="w-5 h-5 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : (
        <>
          {/* Movements Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(movement.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {movement.product_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center">
                        {renderMovementIcon(movement.type)}
                        <span className="ml-2">
                          {getMovementTypeLabel(movement.type)}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {movements.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No hay movimientos para mostrar
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-700">
              Mostrando{' '}
              <span className="font-medium">
                {page * pageSize + 1}
              </span>{' '}
              a{' '}
              <span className="font-medium">
                {Math.min((page + 1) * pageSize, totalMovements)}
              </span>{' '}
              de{' '}
              <span className="font-medium">
                {totalMovements}
              </span>{' '}
              movimientos
            </span>

            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * pageSize >= totalMovements}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}