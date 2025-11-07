import { useState, useEffect } from 'react';
import { Product } from '../types';
import { productService } from '../services/api';

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
  filterByCategory: (category: string) => Promise<void>;
  loadAllProducts: () => Promise<void>;
}

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Café Espresso',
    price: 45,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80',
    description: 'Café espresso intenso y aromático',
    stock: 10,
    category: 'cafe',
  },
  {
    id: '2',
    name: 'Café Americano',
    price: 40,
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=400&q=80',
    description: 'Café americano suave y equilibrado',
    stock: 15,
    category: 'cafe',
  },
  {
    id: '3',
    name: 'Café Latte',
    price: 50,
    image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80',
    description: 'Café latte cremoso con leche vaporizada',
    stock: 8,
    category: 'cafe',
  },
];

export const useProducts = (): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transformApiProduct = (apiProduct: any): Product => {
    return {
      id: apiProduct._id || apiProduct.id || Date.now().toString(),
      name: apiProduct.nomProd || apiProduct.name || 'Producto sin nombre',
      price: apiProduct.precioProd || apiProduct.price || 0,
      image: apiProduct.imagen || apiProduct.image || 'https://via.placeholder.com/300x200?text=Sin+Imagen',
      description: apiProduct.descripcionProd || apiProduct.description || '',
      stock: apiProduct.stock || 0,
      category: apiProduct.categoria || apiProduct.category || 'cafe',
    };
  };

  const fetchProducts = async (params?: {
    categoria?: string;
    buscar?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching products from API...');
      
      // Build URL with parameters
      let url = 'https://back-coffee.onrender.com/api/productos';
      const searchParams = new URLSearchParams();
      
      if (params?.categoria && params.categoria !== 'all') {
        searchParams.append('categoria', params.categoria);
      }
      if (params?.buscar) {
        searchParams.append('buscar', params.buscar);
      }
      if (params?.page) {
        searchParams.append('page', params.page.toString());
      }
      if (params?.limit) {
        searchParams.append('limit', params.limit.toString());
      }
      
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`;
      }
      
      console.log('🌐 Fetching from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Raw API response:', data);
        
        // The API returns a direct array of products
        if (Array.isArray(data)) {
          const transformedProducts = data.map(transformApiProduct);
          console.log('✅ Products transformed:', transformedProducts.length, 'items');
          setProducts(transformedProducts);
        } else {
          console.log('⚠️ API response is not an array:', typeof data);
          setProducts(initialProducts);
          setError('Formato de respuesta inesperado');
        }
      } else {
        console.log(`❌ API failed with status ${response.status}`);
        setProducts(initialProducts);
        setError(`Error del servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setProducts(initialProducts);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = async () => {
    await fetchProducts();
  };

  const searchProducts = async (query: string) => {
    if (query.trim()) {
      await fetchProducts({ buscar: query.trim() });
    } else {
      await fetchProducts();
    }
  };

  const filterByCategory = async (category: string) => {
    if (category && category !== 'all') {
      await fetchProducts({ categoria: category });
    } else {
      await fetchProducts();
    }
  };

  const loadAllProducts = async () => {
    await fetchProducts(); // Fetch all products without filters
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refreshProducts,
    searchProducts,
    filterByCategory,
    loadAllProducts,
  };
};
