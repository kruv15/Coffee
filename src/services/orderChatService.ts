import type { CartItem, User } from "../types"

// Servicio para formatear y enviar pedidos por el chat en vivo
export const orderChatService = {
    
  formatOrderMessage(orderData: {
    cartItems: CartItem[]
    total: number
    deliveryAddress: {
      address: string
      additionalInfo: string
      coordinates?: {
        latitude: number
        longitude: number
      }
    }
    user?: User | null
    orderId?: string
  }): string {
    const { cartItems, total, deliveryAddress, user, orderId } = orderData

    let message = "🛒 NUEVO PEDIDO - COFFEE\n\n"

    // Información del cliente
    if (user) {
      message += "👤 DATOS DEL CLIENTE:\n"
      message += `• Nombre: ${user.nombreUsr}`
      if (user.apellidoUsr) {
        message += ` ${user.apellidoUsr}`
      }
      message += "\n"
      message += `• Email: ${user.emailUsr}\n`
      if (user.celUsr) {
        message += `• Teléfono: ${user.celUsr}\n`
      }
      message += "\n"
    }

    // ID del pedido
    if (orderId) {
      message += `📌 ID DEL PEDIDO: ${orderId}\n\n`
    }

    // Productos
    message += "📋 PRODUCTOS:\n"
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.nomProd}\n`
      message += `   • Presentación: ${item.tamano}\n`
      message += `   • Cantidad: ${item.cantidad}\n`
      message += `   • Precio unitario: Bs${item.precioProd.toFixed(2)}\n`
      message += `   • Subtotal: Bs${(item.precioProd * item.cantidad).toFixed(2)}\n\n`
    })

    // Total
    message += `💰 TOTAL: Bs${total.toFixed(2)}\n\n`

    // Dirección de entrega
    message += "📍 DIRECCIÓN DE ENTREGA:\n"
    message += `${deliveryAddress.address}\n`

    if (deliveryAddress.additionalInfo.trim()) {
      message += `Información adicional: ${deliveryAddress.additionalInfo}\n`
    }

    // Agregar coordenadas si están disponibles
    if (
      deliveryAddress.coordinates &&
      deliveryAddress.coordinates.latitude !== 0 &&
      deliveryAddress.coordinates.longitude !== 0
    ) {
      const { latitude, longitude } = deliveryAddress.coordinates
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
      message += `\n🗺️ UBICACIÓN EN EL MAPA:\n${googleMapsUrl}\n`
      message += `📌 Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n`
    }

    message += "\n"

    // Información adicional
    message += "⏰ Fecha del pedido: " + new Date().toLocaleString("es-ES")
    message += "\n\n"
    message += "🚚 INSTRUCCIONES PARA ENTREGA:\n"
    if (
      deliveryAddress.coordinates &&
      deliveryAddress.coordinates.latitude !== 0 &&
      deliveryAddress.coordinates.longitude !== 0
    ) {
      message += "• Toca el enlace del mapa para ver la ubicación exacta\n"
      message += "• Las coordenadas te llevarán al punto exacto de entrega\n"
    }
    message += "• Contacta al cliente si necesitas más referencias\n\n"
    message += "✅ Por favor confirma la recepción de este pedido"

    return message
  },
}
