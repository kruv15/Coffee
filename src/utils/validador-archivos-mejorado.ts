// Configuración de archivos permitidos sincronizada con el backend
export const CONFIG_ARCHIVOS = {
  imagenes: {
    extensionesPermitidas: ["jpg", "jpeg", "png", "gif", "webp"],
    tamanioMaximoMB: 10,
    tamanioMaximoBytes: 10 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  videos: {
    extensionesPermitidas: ["mp4", "avi", "mov", "mkv", "webm"],
    tamanioMaximoMB: 100,
    tamanioMaximoBytes: 100 * 1024 * 1024,
    mimeTypes: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"],
  },
}

// Mapeo de extensiones a MIME types correcto (ImagePicker a veces devuelve tipos incorrecto)
const MAPEO_EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  avi: "video/x-msvideo",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
  webm: "video/webm",
}

/**
 * Obtener MIME type correcto basado en extensión y MIME type del dispositivo
 */
export function obtenerMimeTypeCorrecto(nombreArchivo: string, mimeTypeDisp: string): string {
  const extension = nombreArchivo.split(".").pop()?.toLowerCase()
  if (!extension) return mimeTypeDisp

  // Si tenemos un mapeo exacto, usarlo
  const mimeTypeMapeado = MAPEO_EXTENSION_MIME[extension]
  if (mimeTypeMapeado) {
    return mimeTypeMapeado
  }

  // Si el MIME type del dispositivo es válido, usarlo
  if (mimeTypeDisp && mimeTypeDisp.startsWith("image/")) {
    return mimeTypeDisp
  }
  if (mimeTypeDisp && mimeTypeDisp.startsWith("video/")) {
    return mimeTypeDisp
  }

  // Fallback por defecto
  return "image/jpeg"
}

//Validar archivo con las reglas exactas del backend
export function validarArchivoFrontend(archivo: {
  name: string
  size: number
  type?: string
}): { valido: boolean; error?: string; tipoArchivo?: "imagen" | "video" } {
  if (!archivo) {
    return { valido: false, error: "No se proporcionó archivo" }
  }

  const { name, size, type } = archivo
  const extension = name.split(".").pop()?.toLowerCase()

  if (!extension) {
    return { valido: false, error: "Archivo sin extensión válida" }
  }

  const esImagen = CONFIG_ARCHIVOS.imagenes.extensionesPermitidas.includes(extension)
  const esVideo = CONFIG_ARCHIVOS.videos.extensionesPermitidas.includes(extension)

  if (!esImagen && !esVideo) {
    return {
      valido: false,
      error: `Extensión no permitida. Válidas: ${[...CONFIG_ARCHIVOS.imagenes.extensionesPermitidas, ...CONFIG_ARCHIVOS.videos.extensionesPermitidas].join(", ")}`,
    }
  }

  const tipoArchivo = esImagen ? "imagen" : "video"
  const config = esImagen ? CONFIG_ARCHIVOS.imagenes : CONFIG_ARCHIVOS.videos

  if (size > config.tamanioMaximoBytes) {
    return {
      valido: false,
      error: `Archivo muy grande. Máximo: ${config.tamanioMaximoMB}MB, Tu archivo: ${(size / (1024 * 1024)).toFixed(2)}MB`,
    }
  }

  return { valido: true, tipoArchivo }
}

//Normalizar archivo antes de subir (asegurar MIME type correcto)
export function normalizarArchivoParaSubir(archivo: any): any {
  const mimeTypeCorrecto = obtenerMimeTypeCorrecto(archivo.name, archivo.type)

  return {
    ...archivo,
    type: mimeTypeCorrecto,
  }
}
