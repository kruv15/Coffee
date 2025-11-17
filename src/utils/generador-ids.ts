export function generarIdTemporal(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

export function crearMensajeTemporal(
  usuarioId: string,
  tipoChat: "ventas" | "atencion_cliente",
  contenido: string,
  tipo: "cliente" | "admin",
  asuntoId?: string | null,
) {
  return {
    id: generarIdTemporal(),
    usuarioId,
    tipoChat,
    contenido,
    tipo,
    leido: false,
    asuntoId: asuntoId || null,
    timestamp: new Date().toISOString(),
  }
}
