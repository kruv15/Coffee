import type { Asunto, Conversacion, Mensaje, Archivo } from "../types/chat"
import { ENV } from "../../src/config/env"

const URL_API = ENV.CHAT_API_URL

export class ServicioAPIChat {
  async obtenerHistorial(
    usuarioId: string,
    tipoChat: "ventas" | "atencion_cliente",
    asuntoId?: string,
  ): Promise<Mensaje[]> {
    try {
      const parametros = new URLSearchParams({ tipoChat })
      if (asuntoId) parametros.append("asuntoId", asuntoId)

      const respuesta = await fetch(`${URL_API}/historial/${usuarioId}?${parametros}`)
      const datos = await respuesta.json()

      return datos.success ? datos.mensajes : []
    } catch (error) {
      console.error("[APIChat] Error obteniendo historial:", error)
      return []
    }
  }

  async obtenerAsuntos(usuarioId: string, estado?: "abierto" | "resuelto"): Promise<Asunto[]> {
    try {
      const parametros = estado ? `?estado=${estado}` : ""
      const respuesta = await fetch(`${URL_API}/asuntos/${usuarioId}${parametros}`)
      const datos = await respuesta.json()

      return datos.success ? datos.asuntos : []
    } catch (error) {
      console.error("[APIChat] Error obteniendo asuntos:", error)
      return []
    }
  }

  async obtenerAsuntoActivo(usuarioId: string): Promise<Asunto | null> {
    try {
      const respuesta = await fetch(`${URL_API}/asunto-activo/${usuarioId}`)
      const datos = await respuesta.json()

      return datos.success ? datos.asunto : null
    } catch (error) {
      console.error("[APIChat] Error obteniendo asunto activo:", error)
      return null
    }
  }

  async obtenerConversacionesActivas(
    tipoChat: "ventas" | "atencion_cliente" | "todos" = "todos",
  ): Promise<Conversacion[]> {
    try {
      if (tipoChat === "todos") {
        const ventasPromise = fetch(`${URL_API}/admin/conversaciones-activas?tipoChat=ventas`).then(res => res.json())
        const atencionPromise = fetch(`${URL_API}/admin/conversaciones-activas?tipoChat=atencion_cliente`).then(res => res.json())
        
        const [ventasData, atencionData] = await Promise.all([ventasPromise, atencionPromise])
        
        const conversacionesVentas = ventasData.success ? ventasData.conversaciones : []
        const conversacionesAtencion = atencionData.success ? atencionData.conversaciones : []
        
        return [...conversacionesVentas, ...conversacionesAtencion]
      }

      const parametros = tipoChat ? `?tipoChat=${tipoChat}` : ""
      const respuesta = await fetch(`${URL_API}/admin/conversaciones-activas${parametros}`)
      const datos = await respuesta.json()

      return datos.success ? datos.conversaciones : []
    } catch (error) {
      console.error("[APIChat] Error obteniendo conversaciones activas:", error)
      return []
    }
  }

  async obtenerEstadisticas(usuarioId: string) {
    try {
      const respuesta = await fetch(`${URL_API}/estadisticas/${usuarioId}`)
      const datos = await respuesta.json()

      return datos.success ? datos.estadisticas : null
    } catch (error) {
      console.error("[APIChat] Error obteniendo estadísticas:", error)
      return null
    }
  }
}

export const servicioAPIChat = new ServicioAPIChat()
