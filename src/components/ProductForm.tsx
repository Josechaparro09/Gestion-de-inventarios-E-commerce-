// src/components/ProductForm.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CATEGORIES } from '../types';
import { generateBarcode } from '../lib/utils';
import { optimizeImage } from '../lib/imageUtils';
import { useStore } from '../contexts/StoreContext';
import { useToast } from '../contexts/ToastContext';

export function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentStore } = useStore();
  const { showToast } = useToast();
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

  // Fetch product for editing
  const fetchProduct = async (productId: string) => {
    if (!currentStore) return null;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('store_id', currentStore.id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return data;
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (id && currentStore) {
        setLoading(true);
        try {
          const product = await fetchProduct(id);
          if (product) {
            setImagePreview(product.image || '');
            reset({
              name: product.name,
              unitCost: Number(product.unit_cost),
              salePrice: Number(product.sale_price),
              stock: Number(product.stock),
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
  }, [id, currentStore, reset]);

  // Upload image to Supabase storage
  const uploadImage = async (file: File) => {
    if (!currentStore) return null;

    try {
      // Optimize image
      const optimizedBlob = await optimizeImage(file);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentStore.id}/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, optimizedBlob);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      showToast({ 
        message: 'Error al cargar la imagen', 
        type: 'error' 
      });
      return null;
    }
  };

  // Submit product
  const onSubmit = async (formData: any) => {
    if (!currentStore) {
      showToast({ 
        message: 'Debe seleccionar una tienda primero', 
        type: 'error' 
      });
      return;
    }

    setLoading(true);
    try {
      // Handle image upload if new image is provided
      let imageUrl = imagePreview;
      if (formData.image && formData.image[0]) {
        const uploadedImageUrl = await uploadImage(formData.image[0]);
        if (uploadedImageUrl) imageUrl = uploadedImageUrl;
      }

      const productData = {
        name: formData.name,
        unit_cost: formData.unitCost,
        sale_price: formData.salePrice,
        stock: formData.stock,
        category: formData.category,
        barcode: formData.barcode,
        image: imageUrl,
        store_id: currentStore.id
      };

      if (id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
      }

      showToast({ 
        message: id ? 'Producto actualizado' : 'Producto creado', 
        type: 'success' 
      });

      navigate('/products/list');
    } catch (error) {
      console.error('Error submitting product:', error);
      showToast({ 
        message: 'Error al guardar el producto', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
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