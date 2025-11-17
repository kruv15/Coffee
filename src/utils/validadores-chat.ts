import type { Mensaje, Asunto } from "../types/chat"

export function validarMensaje(mensaje: Partial<Mensaje>): { valido: boolean; errores: string[] } {
  const errores: string[] = []

  if (!mensaje.usuarioId?.trim()) {
    errores.push("ID de usuario requerido")
  }

  if (!mensaje.tipoChat || !["ventas", "atencion_cliente"].includes(mensaje.tipoChat)) {
    errores.push("Tipo de chat inválido")
  }

  if (!mensaje.contenido?.trim() && (!mensaje.archivos || mensaje.archivos.length === 0)) {
    errores.push("El mensaje debe tener contenido o archivos")
  }

  if (mensaje.contenido && mensaje.contenido.length > 500) {
    errores.push("El mensaje no puede exceder 500 caracteres")
  }

  return {
    valido: errores.length === 0,
    errores,
  }
}

export function validarAsunto(asunto: Partial<Asunto>): { valido: boolean; errores: string[] } {
  const errores: string[] = []

  if (!asunto.usuarioId?.trim()) {
    errores.push("ID de usuario requerido")
  }

  if (!asunto.titulo?.trim()) {
    errores.push("Título requerido")
  } else if (asunto.titulo.length > 100) {
    errores.push("El título no puede exceder 100 caracteres")
  }

  if (!asunto.descripcion?.trim()) {
    errores.push("Descripción requerida")
  } else if (asunto.descripcion.length > 500) {
    errores.push("La descripción no puede exceder 500 caracteres")
  }

  return {
    valido: errores.length === 0,
    errores,
  }
}

export function formatearFecha(fecha: Date | string): string {
  const d = new Date(fecha)
  return d.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatearHora(fecha: Date | string): string {
  const d = new Date(fecha)
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
