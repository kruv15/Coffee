import { Linking } from "react-native"
import type { CartItem, User } from "../types"

// Número de WhatsApp de la empresa (formato internacional sin +)
const WHATSAPP_NUMBER = "59177491244" // 591 (Bolivia) + 72284092 (tu número)

interface OrderData {
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
  paymentMethod: string
  user?: User | null
  orderId?: string // Add order ID from database
}

export const whatsappService = {
  formatOrderMessage(orderData: OrderData): string {
    const { cartItems, total, deliveryAddress, paymentMethod, user } = orderData

    let message = "🛒 *NUEVO PEDIDO - AMBER INFUSIÓN*\n\n"

    // Información del cliente
    if (user) {
      message += "👤 *DATOS DEL CLIENTE:*\n"
      message += `• Nombre: ${user.name}`
      if (user.lastName) {
        message += ` ${user.lastName}`
      }
      message += "\n"
      message += `• Email: ${user.email}\n`
      if (user.phone) {
        message += `• Teléfono: ${user.phone}\n`
      }
      message += "\n"
    }

    // Productos
    message += "📋 *PRODUCTOS:*\n"
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`
      message += `   • Presentación: ${item.pack}\n`
      message += `   • Cantidad: ${item.quantity}\n`
      message += `   • Precio unitario: Bs${item.price.toFixed(2)}\n`
      message += `   • Subtotal: Bs${(item.price * item.quantity).toFixed(2)}\n\n`
    })

    // Total
    message += `💰 *TOTAL: Bs${total.toFixed(2)}*\n\n`

    // Dirección de entrega con enlace al mapa
    message += "📍 *DIRECCIÓN DE ENTREGA:*\n"
    message += `${deliveryAddress.address}\n`

    if (deliveryAddress.additionalInfo.trim()) {
      message += `Información adicional: ${deliveryAddress.additionalInfo}\n`
    }

    // Agregar enlace de Google Maps si hay coordenadas
    if (
      deliveryAddress.coordinates &&
      deliveryAddress.coordinates.latitude !== 0 &&
      deliveryAddress.coordinates.longitude !== 0
    ) {
      const { latitude, longitude } = deliveryAddress.coordinates
      const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`
      message += `\n🗺️ *UBICACIÓN EN EL MAPA:*\n${googleMapsUrl}\n`
      message += `📌 *Coordenadas:* ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n`
    }
    message += "\n"

    // Método de pago
    message += "💳 *MÉTODO DE PAGO:*\n"
    message +=
      paymentMethod === "qr" ? "📱 Pago con QR" : paymentMethod === "card" ? "💳 Tarjeta de crédito" : "📱 WhatsApp"
    message += "\n\n"

    // Información adicional
    message += "⏰ *Fecha del pedido:* " + new Date().toLocaleString("es-ES")
    message += "\n\n"
    message += "🚚 *INSTRUCCIONES PARA ENTREGA:*\n"
    message += "• Toca el enlace del mapa para ver la ubicación exacta\n"
    message += "• Las coordenadas te llevarán al punto exacto de entrega\n"
    message += "• Contacta al cliente si necesitas más referencias\n\n"
    message += "✅ *Por favor confirma la recepción de este pedido*"

    return message
  },

  async sendOrderToWhatsApp(orderData: OrderData): Promise<boolean> {
    try {
      console.log("📱 Iniciando envío a WhatsApp...")
      console.log("📍 Coordenadas de entrega:", orderData.deliveryAddress.coordinates)

      const message = this.formatOrderMessage(orderData)
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `whatsapp://send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`

      console.log("🔗 URL de WhatsApp generada")
      console.log("📝 Mensaje incluye:", {
        hasCoordinates: !!(
          orderData.deliveryAddress.coordinates?.latitude && orderData.deliveryAddress.coordinates?.longitude
        ),
        address: orderData.deliveryAddress.address,
        coordinates: orderData.deliveryAddress.coordinates,
      })

      // Verificar si WhatsApp está disponible
      const canOpen = await Linking.canOpenURL(whatsappUrl)
      console.log("📱 ¿Puede abrir WhatsApp?:", canOpen)

      if (canOpen) {
        console.log("✅ Abriendo WhatsApp...")
        await Linking.openURL(whatsappUrl)
        return true
      } else {
        // Si WhatsApp no está disponible, intentar con WhatsApp Web
        console.log("🌐 WhatsApp no disponible, intentando con WhatsApp Web...")
        const webUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`
        console.log("🔗 URL de WhatsApp Web generada")
        await Linking.openURL(webUrl)
        return true
      }
    } catch (error) {
      console.error("❌ Error al enviar mensaje de WhatsApp:", error)
      return false
    }
  },

  // Función auxiliar para generar enlace de Google Maps
  generateGoogleMapsLink(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`
  },

  // Función auxiliar para generar enlace de Waze (alternativa)
  generateWazeLink(latitude: number, longitude: number): string {
    return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
  },

  validatePhoneNumber(phoneNumber: string): boolean {
    // Validar que el número tenga el formato correcto
    const phoneRegex = /^\d{10,15}$/
    return phoneRegex.test(phoneNumber.replace(/\D/g, ""))
  },
}
