import { ENV } from "../config/env"

const API_BASE_URL = ENV.API_BASE_URL

export interface CategoriaResponse {
  success: boolean
  message: string
  data?: any
}

export const categoriaService = {
  async obtenerCategorias(): Promise<CategoriaResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias`, {
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
          message: data.message || "Categorías obtenidas exitosamente",
          data: data.data || data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al obtener categorías",
        }
      }
    } catch (error) {
      console.error("CategoriaService: Error obteniendo categorías:", error)
      return {
        success: false,
        message: "Error de conexión al obtener categorías",
      }
    }
  },

  async obtenerCategoriasPorId(categoryId: string): Promise<CategoriaResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias/${categoryId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: "Categoría obtenida exitosamente",
          data: data.data || data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al obtener la categoría",
        }
      }
    } catch (error) {
      console.error("CategoriaService: Error obteniendo categoría:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  },

  async crearCategoria(categoryData: any, token: string): Promise<CategoriaResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryData),
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: data.message || "Categoría creada exitosamente",
          data: data.data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al crear la categoría",
        }
      }
    } catch (error) {
      console.error("CategoriaService: Error creando categoría:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  },

  async actualizarCategoria(categoryId: string, categoryData: any, token: string): Promise<CategoriaResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias/${categoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoryData),
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: data.message || "Categoría actualizada exitosamente",
          data: data.data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al actualizar la categoría",
        }
      }
    } catch (error) {
      console.error("CategoriaService: Error actualizando categoría:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  },

  async eliminarCategoria(categoryId: string, token: string): Promise<CategoriaResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias/${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: data.message || "Categoría eliminada exitosamente",
          data: data.data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al eliminar la categoría",
        }
      }
    } catch (error) {
      console.error("CategoriaService: Error eliminando categoría:", error)
      return {
        success: false,
        message: "Error de conexión",
      }
    }
  },

  async obtenerCategoriasBasicas(): Promise<CategoriaResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/categorias/basicas`, {
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
          message: data.message || "Categorías obtenidas exitosamente",
          data: data.data || data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al obtener categorías",
        }
      }
    } catch (error) {
      console.error("CategoriaService: Error obteniendo categorías básicas:", error)
      return {
        success: false,
        message: "Error de conexión al obtener categorías",
      }
    }
  },
}
