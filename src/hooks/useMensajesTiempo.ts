import { useCallback, useState } from "react"
import type { Mensaje } from "../types/chat"

interface UseMensajesTiempoProps {
  mensajeInicial?: Mensaje[]
}

export function useMensajesTiempo({ mensajeInicial = [] }: UseMensajesTiempoProps = {}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajeInicial)

  const agregarMensajeLocal = useCallback((mensaje: Mensaje) => {
    setMensajes((previos) => {
      // Evitar duplicados
      const yaExiste = previos.some((m) => m.id === mensaje.id)
      if (yaExiste) return previos

      return [...previos, mensaje]
    })
  }, [])

  const reemplazarMensajeLocal = useCallback((idTemporal: string, mensajeReal: Mensaje) => {
    setMensajes((previos) => {
      const indice = previos.findIndex((m) => m.id === idTemporal)
      if (indice === -1) {
        // Si no encuentra el temporal, agregar el real
        return [...previos, mensajeReal]
      }

      const copiasMensajes = [...previos]
      copiasMensajes[indice] = mensajeReal
      return copiasMensajes
    })
  }, [])

  const establecerMensajes = useCallback((nuevosMensajes: Mensaje[]) => {
    setMensajes(nuevosMensajes)
  }, [])

  const limpiarMensajes = useCallback(() => {
    setMensajes([])
  }, [])

  const eliminarMensajeLocal = useCallback((id: string) => {
    setMensajes((previos) => previos.filter((m) => m.id !== id))
  }, [])

  return {
    mensajes,
    agregarMensajeLocal,
    reemplazarMensajeLocal,
    establecerMensajes,
    limpiarMensajes,
    eliminarMensajeLocal,
  }
}
