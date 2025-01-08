//src\components\InventorySummary.tsx
import { Package } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../lib/utils';

interface InventorySummaryProps {
  products: Product[];
}

export function InventorySummary({ products }: InventorySummaryProps) {
  const totalValue = products.reduce(
    (sum, product) => sum + product.unitCost * product.stock,
    0
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-indigo-100 rounded-full">
          <Package className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Total Inventory Value</h2>
          <p className="text-3xl font-bold text-indigo-600">{formatCurrency(totalValue)}</p>
        </div>
      </div>
    </div>
  );
}