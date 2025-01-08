// src/components/InventoryDashboard.tsx
import { useMemo } from 'react';
import { Package2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { formatCurrency } from '../lib/utils';

interface InventoryDashboardProps {
  products: Product[];
}

export function InventoryDashboard({ products }: InventoryDashboardProps) {
  const stats = useMemo(() => {
    return products.reduce((acc, product) => {
      // Valores básicos
      acc.totalProducts += 1;
      acc.totalStock += product.stock;
      acc.totalInventoryValue += product.unitCost * product.stock;
      acc.potentialRevenue += product.salePrice * product.stock;
      
      // Productos con bajo stock (menos de 5 unidades)
      if (product.stock < 5) {
        acc.lowStockCount += 1;
      }

      // Margen promedio
      acc.totalMargin += (product.salePrice - product.unitCost) / product.salePrice * 100;

      return acc;
    }, {
      totalProducts: 0,
      totalStock: 0,
      totalInventoryValue: 0,
      potentialRevenue: 0,
      lowStockCount: 0,
      totalMargin: 0,
    });
  }, [products]);

  const cards = [
    {
      title: "Total en Inventario",
      value: formatCurrency(stats.totalInventoryValue),
      description: `${stats.totalProducts} productos en total`,
      icon: Package2,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Ingresos Potenciales",
      value: formatCurrency(stats.potentialRevenue),
      description: `Margen promedio: ${(stats.totalMargin / stats.totalProducts).toFixed(1)}%`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Ganancia Potencial",
      value: formatCurrency(stats.potentialRevenue - stats.totalInventoryValue),
      description: `${stats.totalStock} unidades en total`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Stock Bajo",
      value: stats.lowStockCount,
      description: "Productos con menos de 5 unidades",
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {card.value}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {card.description}
              </p>
            </div>
            <div className={`p-3 rounded-full ${card.bgColor}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}