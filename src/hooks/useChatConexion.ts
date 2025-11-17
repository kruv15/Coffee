import { useCallback, useEffect, useRef, useState } from "react"
import { servicioWebSocket } from "../services/websocket-servicio"
import type { EventoWebSocket } from "../types/chat"

interface UseChatConexionProps {
  usuarioId: string
  tipoUsuario: "cliente" | "admin"
  enHabilitado?: boolean
}

export function useChatConexion({ usuarioId, tipoUsuario, enHabilitado = true }: UseChatConexionProps) {
  const [conectado, setConectado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const manejadoresRef = useRef<Map<string, (evento: EventoWebSocket) => void>>(new Map())

  const conectar = useCallback(async () => {
    if (!enHabilitado || !usuarioId) return

    setCargando(true)
    setError(null)

    try {
      await servicioWebSocket.conectar(usuarioId, tipoUsuario)
      setConectado(true)
    } catch (err) {
      const mensajeError = err instanceof Error ? err.message : "Error desconocido"
      setError(mensajeError)
      console.error("[useChatConexion] Error:", mensajeError)
    } finally {
      setCargando(false)
    }
  }, [usuarioId, tipoUsuario, enHabilitado])

  const desconectar = useCallback(() => {
    servicioWebSocket.desconectar()
    setConectado(false)
    manejadoresRef.current.clear()
  }, [])

  const registrarManejador = useCallback(
    (tipoEvento: string, manejador: (evento: EventoWebSocket) => void) => {
      servicioWebSocket.registrar(tipoEvento, manejador)
      manejadoresRef.current.set(tipoEvento, manejador)
    },
    [],
  )

  const desregistrarManejador = useCallback((tipoEvento: string) => {
    const manejador = manejadoresRef.current.get(tipoEvento)
    if (manejador) {
      servicioWebSocket.desregistrar(tipoEvento, manejador)
      manejadoresRef.current.delete(tipoEvento)
    }
  }, [])

  useEffect(() => {
    conectar()
    return () => desconectar()
  }, [conectar, desconectar])

  return {
    conectado,
    cargando,
    error,
    registrarManejador,
    desregistrarManejador,
    reconectar: conectar,
  }
}
