// Tipos para el sistema de chat
export interface Mensaje {
  id: string
  usuarioId: string
  tipoChat: "ventas" | "atencion_cliente"
  asuntoId?: string | null
  contenido: string
  tipo: "cliente" | "admin"
  leido: boolean
  archivos?: Archivo[]
  timestamp: Date | string
}

export interface Asunto {
  id: string
  usuarioId: string
  titulo: string
  descripcion: string
  estado: "abierto" | "resuelto"
  prioridad: "baja" | "media" | "alta"
  fechaApertura: Date | string
  fechaResolucion?: Date | string | null
  timestamp: Date | string
}

export interface Conversacion {
  usuarioId: string
  tipoChat: "ventas" | "atencion_cliente"
  asuntoId?: string | null
  usuario: {
    nombre: string
    email: string
    celular?: string
  }
  asunto?: {
    id: string
    titulo: string
    descripcion: string
    prioridad: string
    fechaApertura: Date | string
  }
  ultimoMensaje: {
    contenido: string
    tipo: "cliente" | "admin"
    timestamp: Date | string
  } | null
  mensajesNoLeidos: number
  totalMensajes: number
  activo: boolean
}

export interface WebSocketEvent {
  tipo: string
  [key: string]: any
}

export interface Archivo {
  tipo: "imagen" | "video"
  nombreOriginal: string
  urlCloudinary: string
  publicId: string
  tamaño?: number
  duracion?: number
  anchoAlto?: string
  subidoEn?: Date | string
}
