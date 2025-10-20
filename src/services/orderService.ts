const API_BASE_URL = "https://prueba-b5a7.onrender.com/api"

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
  async createOrder(orderData: CreateOrderRequest, token: string): Promise<OrderResponse> {
    try {
      console.log("📝 OrderService: Creating order:", orderData)

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
      console.log("📡 OrderService: Create order response:", response.status, data)

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
      console.error("❌ OrderService: Create order error:", error)
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
      console.log("📋 OrderService: Getting orders with params:", params)

      // Build URL with parameters
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

      console.log("🌐 OrderService: Final URL:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      const data = await response.json()
      console.log("📡 OrderService: Get orders response:", response.status, JSON.stringify(data, null, 2))

      if (response.ok && data.success) {
        return {
          success: true,
          message: data.message || "Pedidos obtenidos exitosamente",
          data: data.data, // This contains { pedidos, totalPages, currentPage, total }
        }
      } else {
        return {
          success: false,
          message: data.message || "Error al obtener los pedidos",
        }
      }
    } catch (error) {
      console.error("❌ OrderService: Get orders error:", error)
      return {
        success: false,
        message: "Error de conexión al obtener los pedidos",
      }
    }
  },

  async getOrderById(orderId: string, token: string): Promise<OrderResponse> {
    try {
      console.log("🔍 OrderService: Getting order by ID:", orderId)

      const response = await fetch(`${API_BASE_URL}/pedidos/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })

      const data = await response.json()
      console.log("📡 OrderService: Get order response:", response.status, data)

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
      console.error("❌ OrderService: Get order error:", error)
      return {
        success: false,
        message: "Error de conexión al obtener el pedido",
      }
    }
  },

  async updateOrderStatus(orderId: string, status: string, token: string): Promise<OrderResponse> {
    try {
      console.log("🔄 OrderService: Updating order status:", orderId, status)

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
      console.log("📡 OrderService: Update status response:", response.status, data)

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
      console.error("❌ OrderService: Update status error:", error)
      return {
        success: false,
        message: "Error de conexión al actualizar el estado",
      }
    }
  },

  async cancelOrder(orderId: string, token: string): Promise<OrderResponse> {
    try {
      console.log("❌ OrderService: Cancelling order:", orderId)

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
      console.log("📡 OrderService: Cancel order response:", response.status, data)

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
      console.error("❌ OrderService: Cancel order error:", error)
      return {
        success: false,
        message: "Error de conexión al cancelar el pedido",
      }
    }
  },
}
