// src/components/ProductForm.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Upload } from 'lucide-react';
import { CATEGORIES } from '../types';
import { generateBarcode } from '../lib/utils';

interface ProductFormProps {
  onSubmit: (data: any) => Promise<void>;
  fetchProduct?: (id: string) => Promise<any>;
}

export function ProductForm({ onSubmit, fetchProduct }: ProductFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    defaultValues: {
      name: '',
      unitCost: 0,
      salePrice: 0,
      stock: 0,
      category: '',
      barcode: generateBarcode(),
      image: undefined
    }
  });

  useEffect(() => {
    const loadProduct = async () => {
      if (id && fetchProduct) {
        setLoading(true);
        try {
          const product = await fetchProduct(id);
          if (product) {
            setImagePreview(product.image || '');
            reset({
              name: product.name,
              unitCost: product.unit_cost || product.unitCost,
              salePrice: product.sale_price || product.salePrice,
              stock: product.stock,
              category: product.category,
              barcode: product.barcode
            });
          }
        } catch (error) {
          console.error('Error loading product:', error);
        }
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, fetchProduct, reset]);

  const onFormSubmit = async (data: any) => {
    try {
      const formData = {
        ...data,
        id,
        image: data.image?.[0] || imagePreview
      };
      await onSubmit(formData);
      navigate('/products/list');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {id ? 'Editar producto' : 'Agregar producto'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre
            <input
              type="text"
              {...register('name', { required: 'El nombre es requerido' })}
              className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 focus:ring focus:ring-teal-200 transition-colors"
              placeholder="Nombre del producto"
            />
          </label>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Costo
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('unitCost', {
                    required: 'El costo es requerido',
                    min: { value: 0, message: 'El costo debe ser positivo' },
                    setValueAs: v => Number(v)
                  })}
                  className="block w-full pl-8 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 focus:ring focus:ring-teal-200 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </label>
            {errors.unitCost && (
              <p className="mt-1 text-sm text-red-600">{errors.unitCost.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Precio
              <div className="mt-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('salePrice', {
                    required: 'El precio es requerido',
                    min: { value: 0, message: 'El precio debe ser positivo' },
                    setValueAs: v => Number(v)
                  })}
                  className="block w-full pl-8 pr-4 py-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 focus:ring focus:ring-teal-200 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </label>
            {errors.salePrice && (
              <p className="mt-1 text-sm text-red-600">{errors.salePrice.message as string}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stock
            <input
              type="number"
              {...register('stock', {
                required: 'Stock es requerido',
                min: { value: 0, message: 'El stock debe ser positivo' },
                valueAsNumber: true
              })}
              className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 focus:ring focus:ring-teal-200 transition-colors"
              placeholder="Cantidad disponible"
            />
          </label>
          {errors.stock && (
            <p className="mt-1 text-sm text-red-600">{errors.stock.message as string}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Categoria
            <select
              {...register('category', { required: 'Categoria es requerida' })}
              className="mt-1 block w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-teal-500 focus:ring focus:ring-teal-200 transition-colors"
            >
              <option value="">Seleccionar categoria</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message as string}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Imagen del producto
            <div className="mt-1 flex flex-col space-y-4">
              {imagePreview && (
                <div className="w-full h-48 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-200 border-dashed rounded-lg hover:border-teal-500 transition-colors">
                <div className="space-y-2 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                      <span>Sube una imagen</span>
                      <input
                        type="file"
                        {...register('image', {
                          required: id ? false : 'Imagen es requerida'
                        })}
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setImagePreview(url);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG hasta 10MB</p>
                </div>
              </div>
            </div>
          </label>
          {errors.image && (
            <p className="mt-1 text-sm text-red-600">{errors.image.message as string}</p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/products/list')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : (id ? 'Actualizar producto' : 'Agregar producto')}
          </button>
        </div>
      </form>
    </div>
  );
}