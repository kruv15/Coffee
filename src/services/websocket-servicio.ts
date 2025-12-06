import type { EventoWebSocket } from "../types/chat"
import { ENV } from "../config/env"

type ManejadorMensaje = (evento: EventoWebSocket) => void

interface ConfiguracionReconexion {
  intentosMaximos: number
  retardoInicial: number
  retardoMaximo: number
}

export class ServicioWebSocket {
  private ws: WebSocket | null = null
  private manejadores: Map<string, ManejadorMensaje[]> = new Map()
  private intentosReconexion = 0
  private configuracion: ConfiguracionReconexion
  private temporizadorReconexion: ReturnType<typeof setTimeout> | null = null
  private enConexion = false
  private urlServidor: string

  constructor(configuracion?: Partial<ConfiguracionReconexion>) {
    this.urlServidor = ENV.WEBSOCKET_URL
    this.configuracion = {
      intentosMaximos: configuracion?.intentosMaximos ?? 5,
      retardoInicial: configuracion?.retardoInicial ?? 1000,
      retardoMaximo: configuracion?.retardoMaximo ?? 30000,
    }
  }

  conectar(usuarioId: string, tipoUsuario: "cliente" | "admin"): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log("[WebSocket] Ya conectado")
        resolve()
        return
      }

      if (this.enConexion) {
        console.log("[WebSocket] Conexión en progreso")
        return
      }

      this.enConexion = true
      console.log("[WebSocket] Iniciando conexión a:", this.urlServidor)

      try {
        this.ws = new WebSocket(this.urlServidor)

        this.ws.onopen = () => {
          console.log("[WebSocket] Conectado exitosamente")
          this.enConexion = false
          this.intentosReconexion = 0

          this.enviar({
            tipo: "conectar",
            usuarioId,
            tipoUsuario,
          })

          resolve()
        }

        this.ws.onmessage = (evento) => {
          try {
            const datos: EventoWebSocket = JSON.parse(evento.data)
            this.procesarMensaje(datos)
          } catch (error) {
            console.error("[WebSocket] Error parseando mensaje:", error)
          }
        }

        this.ws.onerror = (error) => {
          console.error("[WebSocket] Error de conexión:", error)
          this.enConexion = false
          reject(error)
        }

        this.ws.onclose = () => {
          console.log("[WebSocket] Desconectado")
          this.enConexion = false
          this.ws = null
          this.intentarReconectar(usuarioId, tipoUsuario)
        }
      } catch (error) {
        console.error("[WebSocket] Error creando conexión:", error)
        this.enConexion = false
        reject(error)
      }
    })
  }

  private intentarReconectar(usuarioId: string, tipoUsuario: "cliente" | "admin") {
    if (this.intentosReconexion >= this.configuracion.intentosMaximos) {
      console.log("[WebSocket] Máximo de intentos alcanzado")
      return
    }

    this.intentosReconexion++
    const retardo = Math.min(
      this.configuracion.retardoInicial * Math.pow(2, this.intentosReconexion),
      this.configuracion.retardoMaximo,
    )

    console.log(`[WebSocket] Reconectando en ${retardo}ms (intento ${this.intentosReconexion})`)

    this.temporizadorReconexion = setTimeout(() => {
      this.conectar(usuarioId, tipoUsuario).catch((error) => {
        console.error("[WebSocket] Error en reconexión:", error)
      })
    }, retardo)
  }

  desconectar() {
    if (this.temporizadorReconexion) {
      clearTimeout(this.temporizadorReconexion)
      this.temporizadorReconexion = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.manejadores.clear()
    this.intentosReconexion = 0
    console.log("[WebSocket] Desconectado")
  }

  private enviar(datos: EventoWebSocket) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(datos))
    } else {
      console.error("[WebSocket] No conectado. No se puede enviar mensaje.")
    }
  }

  registrar(tipoEvento: string, manejador: ManejadorMensaje) {
    if (!this.manejadores.has(tipoEvento)) {
      this.manejadores.set(tipoEvento, [])
    }
    this.manejadores.get(tipoEvento)!.push(manejador)
  }

  desregistrar(tipoEvento: string, manejador: ManejadorMensaje) {
    const manejadores = this.manejadores.get(tipoEvento)
    if (manejadores) {
      const indice = manejadores.indexOf(manejador)
      if (indice > -1) {
        manejadores.splice(indice, 1)
      }
    }
  }

  private procesarMensaje(evento: EventoWebSocket) {
    const manejadores = this.manejadores.get(evento.tipo)
    if (manejadores) {
      manejadores.forEach((manejador) => manejador(evento))
    }

    const manejadoresGlobales = this.manejadores.get("*")
    if (manejadoresGlobales) {
      manejadoresGlobales.forEach((manejador) => manejador(evento))
    }
  }

  enviarMensaje(usuarioId: string, tipoChat: "ventas" | "atencion_cliente", contenido: string, asuntoId?: string | null) {
    this.enviar({
      tipo: "enviar_mensaje",
      usuarioId,
      tipoChat,
      contenido,
      asuntoId: asuntoId || null,
    })
  }

  solicitarHistorial(usuarioId: string, tipoChat: "ventas" | "atencion_cliente", asuntoId?: string) {
    this.enviar({
      tipo: "solicitar_historial",
      usuarioId,
      tipoChat,
      asuntoId: asuntoId || null,
    })
  }

  crearAsunto(usuarioId: string, titulo: string, descripcion: string) {
    this.enviar({
      tipo: "crear_asunto",
      usuarioId,
      titulo,
      descripcion,
    })
  }

  resolverAsunto(usuarioId: string, asuntoId: string) {
    this.enviar({
      tipo: "resolver_asunto",
      usuarioId,
      asuntoId,
    })
  }

  solicitarConversacionesActivas(tipoChat: "ventas" | "atencion_cliente" | "todos" = "todos") {
    if (tipoChat === "todos") {
      this.enviar({
        tipo: "solicitar_conversaciones_activas",
        tipoChat: "ventas",
      })
      this.enviar({
        tipo: "solicitar_conversaciones_activas",
        tipoChat: "atencion_cliente",
      })
    } else {
      this.enviar({
        tipo: "solicitar_conversaciones_activas",
        tipoChat,
      })
    }
  }

  marcarComoLeido(usuarioId: string, tipoChat: "ventas" | "atencion_cliente", asuntoId?: string | null) {
    this.enviar({
      tipo: "marcar_leido",
      usuarioId,
      tipoChat,
      asuntoId: asuntoId || null,
    })
  }

  enviarMensajeConArchivos(
    usuarioId: string,
    tipoChat: "ventas" | "atencion_cliente",
    contenido: string,
    archivos: any[],
    asuntoId?: string | null,
  ) {
    this.enviar({
      tipo: "enviar_mensaje_con_archivos",
      usuarioId,
      tipoChat,
      contenido,
      asuntoId: asuntoId || null,
      archivos,
    })
  }

  estaConectado(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const servicioWebSocket = new ServicioWebSocket()
