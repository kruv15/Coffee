import * as FileSystem from "expo-file-system/legacy"
import type { Archivo } from "../types/chat"
import { validarArchivoFrontend, normalizarArchivoParaSubir } from "../utils/validador-archivos-mejorado"

const URL_UPLOAD = "https://back-coffee.onrender.com/api/chat/subir-archivo"

interface ResultadoSubida {
  exito: boolean
  archivo?: Archivo
  error?: string
}

export class ServicioArchivos {
  async subirArchivo(archivo: any): Promise<ResultadoSubida> {
    try {
      const validacion = validarArchivoFrontend(archivo)
      if (!validacion.valido) {
        console.error("[Archivos] Validación fallida:", validacion.error)
        return { exito: false, error: validacion.error }
      }

      const archivoNormalizado = normalizarArchivoParaSubir(archivo)

      console.log("[Archivos] Subiendo archivo:", archivoNormalizado.name, "MIME:", archivoNormalizado.type)

      const respuesta = await FileSystem.uploadAsync(URL_UPLOAD, archivoNormalizado.uri, {
        fieldName: "archivo",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        mimeType: archivoNormalizado.type,
        parameters: { nombre: archivoNormalizado.name },
      })

      const datos = JSON.parse(respuesta.body)
      console.log("[Archivos] Archivo subido exitosamente")

      if (datos.success && datos.archivo) {
        return { exito: true, archivo: datos.archivo }
      }

      return { exito: false, error: datos.message || "Error desconocido" }
    } catch (error) {
      console.error("[Archivos] Error subiendo archivo:", error)
      return { exito: false, error: String(error) }
    }
  }

  async subirMultiples(archivos: any[]): Promise<{ exito: boolean; archivos: Archivo[]; errores: string[] }> {
    const archivosSubidos: Archivo[] = []
    const errores: string[] = []

    for (const archivo of archivos) {
      const validacion = validarArchivoFrontend(archivo)
      if (!validacion.valido) {
        errores.push(`${archivo.name}: ${validacion.error}`)
        continue
      }

      const resultado = await this.subirArchivo(archivo)
      if (resultado.exito && resultado.archivo) {
        archivosSubidos.push(resultado.archivo)
      } else {
        errores.push(resultado.error || "Error desconocido")
      }
    }

    return {
      exito: errores.length === 0,
      archivos: archivosSubidos,
      errores,
    }
  }

  validarArchivo(archivo: any): { valido: boolean; error?: string } {
    return validarArchivoFrontend(archivo)
  }
}

export const servicioArchivos = new ServicioArchivos()
