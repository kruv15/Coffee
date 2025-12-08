import { ENV } from "../config/env"

interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  format: string
  width?: number
  height?: number
}

/**
 * Servicio para subir imágenes a Cloudinary
 * Utiliza FormData para enviar archivos sin exponer las credenciales en el cliente
 */
export const cloudinaryService = {
  /**
   * Sube una imagen a Cloudinary
   * @param imageUri - URI local de la imagen (file://, data:, etc)
   * @param nombreArchivo - Nombre descriptivo del archivo
   * @returns URL segura de Cloudinary o null si falla
   */
  async subirImagen(imageUri: string, nombreArchivo?: string): Promise<string | null> {
    try {
      if (!ENV.CLOUDINARY_CLOUD_NAME) {
        console.error("[Cloudinary] CLOUDINARY_CLOUD_NAME no configurado")
        return null
      }

      console.log("[Cloudinary] Iniciando subida:", nombreArchivo)

      // Crear FormData con la imagen
      const formData = new FormData()

      // Agregar el archivo
      const file = {
        uri: imageUri,
        type: "image/jpeg",
        name: nombreArchivo || "imagen.jpg",
      }

      formData.append("file", file as any)

      // Agregar timestamp como public_id para evitar duplicados
      const timestamp = Math.floor(Date.now() / 1000)
      formData.append("public_id", `coffee_${timestamp}_${Math.random().toString(36).substring(7)}`)

      // Agregar tags para identificar imágenes de productos
      formData.append("tags", ["coffee-app", "producto"].join(","))

      // Agregar preset de subida
      formData.append("upload_preset", ENV.CLOUDINARY_UPLOAD_PRESET)

      // URL de subida sin autenticación (si usas unsigned)
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${ENV.CLOUDINARY_CLOUD_NAME}/image/upload`

      const uploadResponse = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        console.error("[Cloudinary] Error en respuesta:", error)
        return null
      }

      const resultado: CloudinaryUploadResponse = await uploadResponse.json()

      console.log("[Cloudinary] Subida exitosa:", resultado.secure_url)
      return resultado.secure_url
    } catch (error) {
      console.error("[Cloudinary] Error subiendo imagen:", error)
      return null
    }
  },

  /**
   * Valida que una URL sea de Cloudinary o una URL válida
   */
  esUrlValida(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === "http:" || urlObj.protocol === "https:"
    } catch {
      return false
    }
  },
}
