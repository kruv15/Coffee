import { ENV } from "../config/env"

const API_BASE_URL = ENV.API_BASE_URL

export interface CreateProductData {
  nomProd: string
  descripcionProd: string
  stock: number
  categoria: string
  imagen: string
  tamanos: Array<{
    nombre: string
    precio: number
  }>
}

export interface ProductResponse {
  success: boolean
  message: string
  data?: any
}

export const productService = {
  async createProduct(productData: CreateProductData, token: string): Promise<ProductResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/productos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: data.message || "Producto creado correctamente",
          data: data.data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al crear el producto",
          data: data,
        }
      }
    } catch (error) {
      console.error("ProductService: Error creando producto:", error)
      return {
        success: false,
        message: "Error de conexión con la base de datos",
      }
    }
  },

  async updateProduct(productId: string, productData: CreateProductData, token: string): Promise<ProductResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/productos/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: data.message || "Producto actualizado correctamente",
          data: data.data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al actualizar el producto",
          data: data,
        }
      }
    } catch (error) {
      console.error("ProductService: Error actualizando producto:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  },

  async deleteProduct(productId: string, token: string): Promise<ProductResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/productos/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: data.message || "Producto eliminado correctamente",
          data: data.data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al eliminar el producto",
        }
      }
    } catch (error) {
      console.error("ProductService: Error eliminando producto:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  },

  async obtenerProductos(params?: {
    categoria?: string
    buscar?: string
    page?: number
    limit?: number
  }): Promise<ProductResponse> {
    try {
      let url = `${API_BASE_URL}/productos`
      const searchParams = new URLSearchParams()

      if (params?.categoria && params.categoria !== "all") {
        searchParams.append("categoria", params.categoria)
      }
      if (params?.buscar) {
        searchParams.append("buscar", params.buscar)
      }
      if (params?.page) {
        searchParams.append("page", params.page.toString())
      }
      if (params?.limit) {
        searchParams.append("limit", params.limit.toString())
      }

      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: "Productos obtenidos exitosamente",
          data: data.data || data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al obtener productos",
          data: [],
        }
      }
    } catch (error) {
      console.error("ProductService: Error obteniendo productos:", error)
      return {
        success: false,
        message: "Error de conexión",
        data: [],
      }
    }
  },

  async obtenerProductoPorId(productId: string): Promise<ProductResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/productos/${productId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: "Producto obtenido exitosamente",
          data: data.data || data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al obtener el producto",
        }
      }
    } catch (error) {
      console.error("ProductService: Error obteniendo producto:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  },
}
