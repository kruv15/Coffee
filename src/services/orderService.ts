import { ENV } from "../../src/config/env"

const API_BASE_URL = ENV.API_BASE_URL

export interface CreateOrderRequest {
  productos: {
    productoId: string
    cantidad: number
  }[]
  direccionEntrega: string
  infoAdicional: string
}

export interface Order {
  _id: string
  userId: {
    _id: string
    nombreUsr: string
    apellidoUsr: string
    emailUsr: string
    celUsr?: string
  }
  productos: {
    productoId: {
      _id: string
      nomProd: string
      imagen: string
      precioProd: number
    }
    cantidad: number
    precio: number
  }[]
  total: number
  status: "pendiente" | "confirmado" | "preparando" | "listo" | "entregado" | "cancelado"
  direccionEntrega: string
  infoAdicional: string
  createdAt: string
}

export interface OrderResponse {
  success: boolean
  message: string
  data?: {
    pedidos: Order[]
    totalPages: number
    currentPage: number
    total: number
  }
}

export const orderService = {
  async obtenerMisPedidos(token: string): Promise<OrderResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos/mis-pedidos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      const data = await response.json()
      console.log("OrderService: Respuesta mis pedidos:", response.status, JSON.stringify(data, null, 2))

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || "Pedidos obtenidos exitosamente",
          data: {
            pedidos: data.data,
            totalPages: 1,
            currentPage: 1,
            total: data.data?.length || 0,
          },
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al obtener los pedidos",
        }
      }
    } catch (error) {
      console.error("OrderService: Error obteniendo mis pedidos:", error)
      return {
        success: false,
        message: "Error de conexión al obtener los pedidos",
      }
    }
  },
  async createOrder(orderData: CreateOrderRequest, token: string): Promise<OrderResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          message: data.message || "Pedido creado exitosamente",
          data: data.data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al crear el pedido",
        }
      }
    } catch (error) {
      console.error("OrderService: Create order error:", error)
      return {
        success: false,
        message: "Error de conexión al crear el pedido",
      }
    }
  },

  async getOrders(
    token: string,
    params?: {
      status?: string
      page?: number
      limit?: number
    },
  ): Promise<OrderResponse> {
    try {
      let url = `${API_BASE_URL}/pedidos`
      const searchParams = new URLSearchParams()

      if (params?.status && params.status !== "all") {
        searchParams.append("status", params.status)
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
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      const data = await response.json()
      console.log("OrderService: Get orders response:", response.status, JSON.stringify(data, null, 2))

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || "Pedidos obtenidos exitosamente",
          data: data.data, // Esto contiene { pedidos, totalPages, currentPage, total }
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al obtener los pedidos",
        }
      }
    } catch (error) {
      console.error("OrderService: Get orders error:", error)
      return {
        success: false,
        message: "Error de conexión al obtener los pedidos",
      }
    }
  },

  async getOrderById(orderId: string, token: string): Promise<OrderResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || "Pedido obtenido exitosamente",
          data: data.data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al obtener el pedido",
        }
      }
    } catch (error) {
      console.error("OrderService: Get order error:", error)
      return {
        success: false,
        message: "Error de conexión al obtener el pedido",
      }
    }
  },

  async updateOrderStatus(orderId: string, status: string, token: string): Promise<OrderResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos/${orderId}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || "Estado del pedido actualizado",
          data: data.data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al actualizar el estado del pedido",
        }
      }
    } catch (error) {
      console.error("OrderService: Update status error:", error)
      return {
        success: false,
        message: "Error de conexión al actualizar el estado",
      }
    }
  },

  async cancelOrder(orderId: string, token: string): Promise<OrderResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidos/${orderId}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ status: "cancelado" }),
      })

      const data = await response.json()
      console.log("OrderService: Cancel order response:", response.status, data)

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || "Pedido cancelado exitosamente",
          data: data.data,
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al cancelar el pedido",
        }
      }
    } catch (error) {
      console.error("OrderService: Cancel order error:", error)
      return {
        success: false,
        message: "Error de conexión al cancelar el pedido",
      }
    }
  },
}
