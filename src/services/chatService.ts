// Servicio de chat con WebSocket
import type { Asunto, Conversacion, Mensaje, WebSocketEvent } from "../types/chat"

const WS_URL = "wss://back-coffee.onrender.com"
const API_URL = "https://back-coffee.onrender.com/api/chat"

type MessageHandler = (event: WebSocketEvent) => void

class ChatService {
  private ws: WebSocket | null = null
  private messageHandlers: Map<string, MessageHandler[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isConnecting = false

  // Conectar al WebSocket
  connect(usuarioId: string, tipoUsuario: "cliente" | "admin"): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log("[ChatService] Ya conectado al WebSocket")
        resolve()
        return
      }

      if (this.isConnecting) {
        console.log("[ChatService] Conexión en progreso...")
        return
      }

      this.isConnecting = true
      console.log("[ChatService] Conectando al WebSocket...", WS_URL)

      try {
        this.ws = new WebSocket(WS_URL)

        this.ws.onopen = () => {
          console.log("[ChatService] WebSocket conectado")
          this.isConnecting = false
          this.reconnectAttempts = 0

          // Enviar evento de conexión
          this.send({
            tipo: "conectar",
            usuarioId,
            tipoUsuario,
          })

          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketEvent = JSON.parse(event.data)
            console.log("[ChatService] Mensaje recibido:", data.tipo)
            this.handleMessage(data)
          } catch (error) {
            console.error("[ChatService] Error parseando mensaje:", error)
          }
        }

        this.ws.onerror = (error) => {
          console.error("[ChatService] Error en WebSocket:", error)
          this.isConnecting = false
          reject(error)
        }

        this.ws.onclose = () => {
          console.log("[ChatService] WebSocket desconectado")
          this.isConnecting = false
          this.ws = null
          this.attemptReconnect(usuarioId, tipoUsuario)
        }
      } catch (error) {
        console.error("[ChatService] Error creando WebSocket:", error)
        this.isConnecting = false
        reject(error)
      }
    })
  }

  // Intentar reconexión automática
  private attemptReconnect(usuarioId: string, tipoUsuario: "cliente" | "admin") {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[ChatService] Máximo de intentos de reconexión alcanzado")
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

    console.log(`[ChatService] Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts})`)

    this.reconnectTimeout = setTimeout(() => {
      this.connect(usuarioId, tipoUsuario).catch((error) => {
        console.error("[ChatService] Error en reconexión:", error)
      })
    }, delay)
  }

  // Desconectar WebSocket
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.messageHandlers.clear()
    this.reconnectAttempts = 0
    console.log("[ChatService] Desconectado del WebSocket")
  }

  // Enviar mensaje por WebSocket
  private send(data: WebSocketEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
      console.log("[ChatService] Mensaje enviado:", data.tipo)
    } else {
      console.error("[ChatService] WebSocket no está conectado")
    }
  }

  // Enviar mensaje de chat
  enviarMensaje(usuarioId: string, tipoChat: "ventas" | "atencion_cliente", contenido: string, asuntoId?: string) {
    this.send({
      tipo: "enviar_mensaje",
      usuarioId,
      tipoChat,
      contenido,
      asuntoId: asuntoId || null,
    })
  }

  // Solicitar historial de mensajes
  solicitarHistorial(usuarioId: string, tipoChat: "ventas" | "atencion_cliente", asuntoId?: string) {
    this.send({
      tipo: "solicitar_historial",
      usuarioId,
      tipoChat,
      asuntoId: asuntoId || null,
    })
  }

  // Crear asunto (atención al cliente)
  crearAsunto(usuarioId: string, titulo: string, descripcion: string) {
    this.send({
      tipo: "crear_asunto",
      usuarioId,
      titulo,
      descripcion,
    })
  }

  // Resolver asunto (admin)
  resolverAsunto(usuarioId: string, asuntoId: string) {
    this.send({
      tipo: "resolver_asunto",
      usuarioId,
      asuntoId,
    })
  }

  // Solicitar conversaciones activas (admin)
  solicitarConversacionesActivas(tipoChat?: "ventas" | "atencion_cliente" | "todos") {
    this.send({
      tipo: "solicitar_conversaciones_activas",
      tipoChat: tipoChat || "todos",
    })
  }

  // Marcar mensajes como leídos
  marcarComoLeido(usuarioId: string, tipoChat: "ventas" | "atencion_cliente", asuntoId?: string) {
    this.send({
      tipo: "marcar_leido",
      usuarioId,
      tipoChat,
      asuntoId: asuntoId || null,
    })
  }

  // Registrar handler para eventos
  on(eventType: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, [])
    }
    this.messageHandlers.get(eventType)!.push(handler)
  }

  // Remover handler
  off(eventType: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // Manejar mensajes recibidos
  private handleMessage(event: WebSocketEvent) {
    const handlers = this.messageHandlers.get(event.tipo)
    if (handlers) {
      handlers.forEach((handler) => handler(event))
    }

    // Handler global para todos los eventos
    const globalHandlers = this.messageHandlers.get("*")
    if (globalHandlers) {
      globalHandlers.forEach((handler) => handler(event))
    }
  }

  // API REST: Obtener historial
  async obtenerHistorialAPI(
    usuarioId: string,
    tipoChat: "ventas" | "atencion_cliente",
    asuntoId?: string,
  ): Promise<Mensaje[]> {
    try {
      const params = new URLSearchParams({ tipoChat })
      if (asuntoId) params.append("asuntoId", asuntoId)

      const response = await fetch(`${API_URL}/historial/${usuarioId}?${params}`)
      const data = await response.json()

      if (data.success) {
        return data.mensajes
      }
      return []
    } catch (error) {
      console.error("[ChatService] Error obteniendo historial:", error)
      return []
    }
  }

  // API REST: Obtener asuntos
  async obtenerAsuntosAPI(usuarioId: string, estado?: "abierto" | "resuelto"): Promise<Asunto[]> {
    try {
      const params = estado ? `?estado=${estado}` : ""
      const response = await fetch(`${API_URL}/asuntos/${usuarioId}${params}`)
      const data = await response.json()

      if (data.success) {
        return data.asuntos
      }
      return []
    } catch (error) {
      console.error("[ChatService] Error obteniendo asuntos:", error)
      return []
    }
  }

  // API REST: Obtener asunto activo
  async obtenerAsuntoActivoAPI(usuarioId: string): Promise<Asunto | null> {
    try {
      const response = await fetch(`${API_URL}/asunto-activo/${usuarioId}`)
      const data = await response.json()

      if (data.success) {
        return data.asunto
      }
      return null
    } catch (error) {
      console.error("[ChatService] Error obteniendo asunto activo:", error)
      return null
    }
  }

  // API REST: Obtener conversaciones activas (admin)
  async obtenerConversacionesActivasAPI(tipoChat?: "ventas" | "atencion_cliente" | "todos"): Promise<Conversacion[]> {
    try {
      const params = tipoChat ? `?tipoChat=${tipoChat}` : ""
      const response = await fetch(`${API_URL}/admin/conversaciones-activas${params}`)
      const data = await response.json()

      if (data.success) {
        return data.conversaciones
      }
      return []
    } catch (error) {
      console.error("[ChatService] Error obteniendo conversaciones activas:", error)
      return []
    }
  }
}

export const chatService = new ChatService()
