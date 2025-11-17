import { useCallback, useState } from "react"
import { servicioArchivos } from "../services/archivo-servicio"
import type { Archivo } from "../types/chat"

interface ArchivoPreview {
  uri: string
  nombre: string
  tipo: "imagen" | "video"
  tamaño: number
}

export function useArchivosSubida() {
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<any[]>([])
  const [archivosPreview, setArchivosPreview] = useState<ArchivoPreview[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const agregarArchivos = useCallback(async (archivosNuevos: any[]) => {
    setError(null)
    const previews: ArchivoPreview[] = []
    const erroresValidacion: string[] = []

    for (const archivo of archivosNuevos) {
      const validacion = servicioArchivos.validarArchivo(archivo)
      if (!validacion.valido) {
        erroresValidacion.push(`${archivo.name}: ${validacion.error}`)
        continue
      }

      previews.push({
        uri: archivo.uri || URL.createObjectURL(archivo),
        nombre: archivo.name,
        tipo: archivo.type?.startsWith("video") ? "video" : "imagen",
        tamaño: archivo.size,
      })
    }

    if (erroresValidacion.length > 0) {
      setError(erroresValidacion.join("\n"))
    }

    setArchivosSeleccionados(archivosNuevos.filter((_, i) => {
      const validacion = servicioArchivos.validarArchivo(archivosNuevos[i])
      return validacion.valido
    }))
    setArchivosPreview(previews)
  }, [])

  const removerArchivo = useCallback((indice: number) => {
    setArchivosSeleccionados((previos) => previos.filter((_, i) => i !== indice))
    setArchivosPreview((previos) => previos.filter((_, i) => i !== indice))
  }, [])

  const subirArchivos = useCallback(async (): Promise<Archivo[] | null> => {
    if (archivosSeleccionados.length === 0) return []

    setSubiendo(true)
    setError(null)

    try {
      const resultado = await servicioArchivos.subirMultiples(archivosSeleccionados)

      if (!resultado.exito) {
        setError(resultado.errores.join(", "))
        return null
      }

      setArchivosSeleccionados([])
      setArchivosPreview([])
      return resultado.archivos
    } catch (err) {
      const mensajeError = err instanceof Error ? err.message : "Error desconocido"
      setError(mensajeError)
      return null
    } finally {
      setSubiendo(false)
    }
  }, [archivosSeleccionados])

  const limpiar = useCallback(() => {
    setArchivosSeleccionados([])
    setArchivosPreview([])
    setError(null)
  }, [])

  return {
    archivosSeleccionados,
    archivosPreview,
    subiendo,
    error,
    agregarArchivos,
    removerArchivo,
    subirArchivos,
    limpiar,
  }
}
