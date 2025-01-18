import React, { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../contexts/ToastContext';

interface ProductRow {
  name: string;
  store_id: string;
  stock: number;
  unit_cost: number;
  sale_price: number;
  image: string;
  category: string;
  barcode: string;
}

export function BulkProductImport({ onFinish }: { onFinish?: () => void }) {
  const { currentStore, refreshProducts } = useStore();
  const { showToast } = useToast();
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const downloadTemplate = () => {
    const template = XLSX.utils.book_new();
    const headers = ['name', 'store_id', 'stock', 'unit_cost', 'sale_price', 'image', 'category', 'barcode'];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    XLSX.utils.book_append_sheet(template, ws, 'Template');
    XLSX.writeFile(template, 'product_import_template.xlsx');
  };

  const processExcelFile = async (file: File) => {
    try {
      setImporting(true);
      
      // Read Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<ProductRow>(worksheet);

      if (rows.length === 0) {
        throw new Error('El archivo está vacío o no tiene datos válidos');
      }

      // Validate data before processing
      const validationErrors = rows.map((row, index) => {
        const errors = [];
        if (!row.name) errors.push('Nombre es requerido');
        if (!row.category) errors.push('Categoría es requerida');
        if (!row.unit_cost || isNaN(Number(row.unit_cost))) errors.push('Costo unitario inválido');
        if (!row.sale_price || isNaN(Number(row.sale_price))) errors.push('Precio de venta inválido');
        
        return { index, errors };
      }).filter(validation => validation.errors.length > 0);

      if (validationErrors.length > 0) {
        const errorMessages = validationErrors
          .map(({ index, errors }) => `Fila ${index + 2}: ${errors.join(', ')}`)
          .join('\n');
        throw new Error(`Errores de validación:\n${errorMessages}`);
      }

      setProgress({ current: 0, total: rows.length });

      // Process each row
      for (let [index, row] of rows.entries()) {
        try {
          // Get the base URL without query parameters
          const imageUrl = row.image ? row.image.split('?')[0] : '/images/default/product-placeholder.png';

          // Prepare product data
          const productData = {
            name: row.name,
            store_id: currentStore?.id,
            stock: Number(row.stock),
            unit_cost: Number(row.unit_cost),
            sale_price: Number(row.sale_price),
            image: imageUrl,
            category: row.category,
            barcode: row.barcode
          };

          // Insert into database
          const { error } = await supabase
            .from('products')
            .insert(productData);

          if (error) throw error;

          setProgress(prev => ({ ...prev, current: index + 1 }));
        } catch (error) {
          console.error(`Error processing row ${index + 1}:`, error);
          showToast({
            message: `Error en fila ${index + 1}: ${(error as Error).message}`,
            type: 'error'
          });
        }
      }

      showToast({
        message: 'Importación completada exitosamente',
        type: 'success'
      });

      await refreshProducts();
      onFinish?.();
    } catch (error) {
      console.error('Error processing file:', error);
      showToast({
        message: `Error procesando archivo: ${(error as Error).message}`,
        type: 'error'
      });
    } finally {
      setImporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Template Download */}
      <div className="flex justify-end">
        <button
          onClick={downloadTemplate}
          className="text-sm text-teal-600 hover:text-teal-700"
        >
          Descargar plantilla Excel
        </button>
      </div>

      {/* Upload Area */}
      <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={importing}
        />
        
        <div className="space-y-3">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="text-gray-600">
            <span className="font-medium text-teal-600">
              Haz clic para subir
            </span>{' '}
            o arrastra y suelta
          </div>
          <p className="text-sm text-gray-500">
            Excel (.xlsx, .xls)
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      {importing && progress.total > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Procesando productos...</span>
            <span>{progress.current} de {progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-600 h-2 rounded-full transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Warning Message */}
      <div className="flex items-start p-4 bg-yellow-50 rounded-lg">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="text-sm text-yellow-700">
          <p className="font-medium">Importante:</p>
          <ul className="list-disc ml-5 mt-1 space-y-1">
            <li>Asegúrate de usar la plantilla correcta</li>
            <li>Los URLs de las imágenes deben ser URLs base de S3 (sin parámetros de firma)</li>
            <li>Todos los campos son obligatorios</li>
            <li>Las categorías deben coincidir con las existentes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}