// src/components/BulkImport.tsx
import { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../contexts/ToastContext';
import { generateBarcode } from '../lib/utils';

export default function BulkImport() {
  const { currentStore, refreshProducts } = useStore();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const downloadImageAndUpload = async (imageUrl: string): Promise<string | null> => {
    try {
      // En lugar de descargar la imagen, la procesamos directamente desde la URL
      const fileName = `${currentStore?.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      
      // Get public URL directamente
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error processing image:', error);
      return null;
    }
  };

  const processExcelFile = async (file: File) => {
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convertir todas las celdas a texto
      Object.keys(worksheet).forEach(cell => {
        if (cell[0] !== '!') { // Ignorar celdas especiales
          worksheet[cell].t = 's'; // Forzar tipo string
        }
      });
      
      // Leer los datos como array
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false,
        defval: '' // Valor por defecto para celdas vacías
      }) as any[][];

      // Filtrar filas vacías y la fila de encabezado
      const products = rawData.slice(1).filter(row => row.length > 0 && row[0]); // Asegurarse de que hay un nombre
      
      console.log('Total products found:', products.length);
      setProgress({ current: 0, total: products.length });

      let successCount = 0;
      let errorCount = 0;

      for (const row of products) {
        try {
          const [name, store_id, stock, unit_cost, sale_price, image_url, category] = row;
          
          console.log('Processing:', { name, store_id, stock, unit_cost, sale_price, category });

          // Verificar store_id
          if (store_id !== currentStore?.id) {
            console.log('Different store_id, skipping:', store_id);
            continue;
          }

          // Limpiar valores monetarios
          const cleanUnitCost = (unit_cost || '').toString().replace('$', '').replace(',', '').trim();
          const cleanSalePrice = (sale_price || '').toString().replace('$', '').replace(',', '').trim();

          const productData = {
            name: name?.toString().trim(),
            store_id: store_id?.toString().trim(),
            stock: Number(stock || 0),
            unit_cost: Number(cleanUnitCost || 0),
            sale_price: Number(cleanSalePrice || 0),
            image: image_url || null, // Usar la URL directamente
            category: category?.toString().trim() || 'Otra',
            barcode: generateBarcode()
          };

          console.log('Inserting product:', productData);

          const { error: insertError } = await supabase
            .from('products')
            .insert(productData);

          if (insertError) {
            console.error('Insert error:', insertError);
            errorCount++;
            continue;
          }

          successCount++;
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
          
        } catch (error) {
          console.error('Error processing row:', error);
          errorCount++;
        }
      }

      showToast({
        message: `Importación completada: ${successCount} productos importados, ${errorCount} errores`,
        type: errorCount === 0 ? 'success' : 'error'
      });

      await refreshProducts();
      
    } catch (error) {
      console.error('Error processing file:', error);
      showToast({
        message: 'Error al procesar el archivo',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center p-4 bg-yellow-50 rounded-lg">
        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
        <p className="text-yellow-700">Selecciona una tienda primero</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-teal-500 transition-colors">
        <div className="space-y-2 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none">
              <span>Importar productos desde Excel</span>
              <input
                type="file"
                className="sr-only"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={loading}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500">XLSX, XLS hasta 10MB</p>
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-teal-600 h-2.5 rounded-full transition-all"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 text-center">
            Procesando {progress.current} de {progress.total} productos...
          </p>
        </div>
      )}
    </div>
  );
}