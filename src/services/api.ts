import { ENV } from "../../src/config/env"

const API_BASE_URL = ENV.CHAT_API_URL;

export interface CreateProductData {
  nomProd: string;
  descripcionProd: string;
  precioProd: number;
  stock: number;
  categoria: string;
  imagen: string;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const productService = {
  async createProduct(productData: CreateProductData, token: string): Promise<ProductResponse> {
    try {
      // Asegurar que la categoría sea "cafe"
      const formattedData = {
        ...productData,
        categoria: "cafe"
      };
      
      console.log('Formatted Data:', JSON.stringify(formattedData, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formattedData),
      });
      
      const responseText = await response.text();
      
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        return {
          success: false,
          message: `Error del servidor: ${response.status} - Respuesta no válida`,
        };
      }
      
      if (response.ok) {
        return {
          success: true,
          message: responseData.message || 'Producto creado correctamente en la base de datos',
          data: responseData,
        };
      } else {
        let errorMessage = 'Error al crear el producto en la base de datos';
        
        if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (responseData.errors) {
          if (Array.isArray(responseData.errors)) {
            errorMessage = responseData.errors.join(', ');
          } else if (typeof responseData.errors === 'object') {
            errorMessage = Object.values(responseData.errors).flat().join(', ');
          }
        }

        return {
          success: false,
          message: errorMessage,
          data: responseData,
        };
      }
    } catch (error) {
      console.error('Network Error:', error);
      return {
        success: false,
        message: 'Error de conexión con la base de datos. Verifica tu internet.',
      };
    }
  },

  async updateProduct(productId: string, productData: CreateProductData, token: string): Promise<ProductResponse> {
    try {
      
      const response = await fetch(`${API_BASE_URL}/productos/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: responseData.message || 'Producto actualizado correctamente',
          data: responseData,
        };
      } else {
        return {
          success: false,
          message: responseData.message || 'Error al actualizar el producto',
          data: responseData,
        };
      }
    } catch (error) {
      console.error('Product update error:', error);
      return {
        success: false,
        message: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
      };
    }
  },

  async deleteProduct(productId: string, token: string): Promise<ProductResponse> {
    try { 
      const response = await fetch(`${API_BASE_URL}/productos/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: responseData.message || 'Producto eliminado correctamente',
          data: responseData,
        };
      } else {
        return {
          success: false,
          message: responseData.message || 'Error al eliminar el producto',
          data: responseData,
        };
      }
    } catch (error) {
      console.error('Product delete error:', error);
      return {
        success: false,
        message: 'Error de conexión. Verifica tu internet e intenta nuevamente.',
      };
    }
  },

  async getProducts(params?: {
    categoria?: string;
    buscar?: string;
    page?: number;
    limit?: number;
  }): Promise<ProductResponse> {
    try {
      // Contrutuir la URL con parámetros de consulta si existen
      let url = `${API_BASE_URL}/productos`
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
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        return {
          success: false,
          message: `Error ${response.status}: ${errorText}`,
          data: [],
        };
      }
      
      const data = await response.json();
      console.log('Raw products response:', data);
      console.log('Response type:', typeof data, 'Is array:', Array.isArray(data));
      
      // Your API returns a direct array of products
      if (Array.isArray(data)) {
        console.log(`Products array received: ${data.length} items`);
        if (data.length > 0) {
          console.log('First product sample:', JSON.stringify(data[0], null, 2));
        }
        
        return {
          success: true,
          message: `${data.length} productos encontrados`,
          data: data,
        };
      } else {
        console.log('Unexpected response format, expected array but got:', typeof data);
        return {
          success: false,
          message: 'Formato de respuesta inesperado del servidor',
          data: [],
        };
      }
      
    } catch (error) {
      console.error('Get products network error:', error);
      return {
        success: false,
        message: 'Error de conexión. Verifica tu internet.',
        data: [],
      };
    }
  },

  async getAllProducts(): Promise<ProductResponse> {
    try {
      console.log('Getting products from API...');
      
      const response = await fetch(`${API_BASE_URL}/productos`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Get products response status:', response.status);
      
      const responseText = await response.text();
      console.log('Get products raw response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return {
          success: false,
          message: `Error del servidor: ${response.status} - Respuesta no válida`,
        };
      }
      
      if (response.ok) {
        console.log('Products retrieved successfully');
        return {
          success: true,
          message: 'Productos obtenidos correctamente',
          data: responseData,
        };
      } else {
        return {
          success: false,
          message: responseData.message || 'Error al obtener productos',
          data: responseData,
        };
      }
    } catch (error) {
      console.error('Get products error:', error);
      return {
        success: false,
        message: 'Error de conexión al obtener productos',
      };
    }
  },
};