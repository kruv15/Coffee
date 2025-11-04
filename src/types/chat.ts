// Tipos para el sistema de chat
export interface Mensaje {
  id: string
  usuarioId: string
  tipoChat: "ventas" | "atencion_cliente"
  asuntoId?: string | null
  contenido: string
  tipo: "cliente" | "admin"
  leido: boolean
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
