"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { Linking } from "react-native"
import { Colors } from "../src/constants/Colors"
import { useAuth } from "../src/context/AuthContext"
import { chatService } from "../src/services/chatService"
import type { Conversacion, Mensaje } from "../src/types/chat"

export default function AdminChatScreen() {
  const { state } = useAuth()
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [conversacionActual, setConversacionActual] = useState<Conversacion | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [connected, setConnected] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "ventas" | "atencion_cliente">("todos")
  const flatListRef = useRef<FlatList>(null)

  // Verificar que el usuario sea admin
  useEffect(() => {
    if (state.isAuthenticated && state.user?.role !== "admin") {
      Alert.alert("Acceso Denegado", "Solo los administradores pueden acceder al chat", [
        { text: "OK", onPress: () => router.back() },
      ])
    }
  }, [state.isAuthenticated, state.user?.role])

  // Conectar al WebSocket
  useEffect(() => {
    if (state.user?.id && state.user?.role === "admin") {
      conectarChat()
    }

    return () => {
      if (connected) {
        chatService.disconnect()
      }
    }
  }, [state.user?.id, state.user?.role])

  const conectarChat = async () => {
    if (!state.user?.id) return

    setLoading(true)

    try {
      await chatService.connect(state.user.id, "admin")
      setConnected(true)

      // Solicitar conversaciones activas
      chatService.solicitarConversacionesActivas(filtroTipo)

      // Registrar handlers
      chatService.on("conversaciones_activas", handleConversacionesActivas)
      chatService.on("nuevo_mensaje", handleNuevoMensaje)
      chatService.on("nuevo_asunto", handleNuevoAsunto)
      chatService.on("historial", handleHistorial)
      chatService.on("confirmacion_mensaje", handleConfirmacionMensaje)
      chatService.on("error", handleError)
    } catch (error) {
      console.error("[AdminChat] Error conectando:", error)
      Alert.alert("Error", "No se pudo conectar al chat")
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const handleConversacionesActivas = (event: any) => {
    console.log("[AdminChat] Conversaciones activas recibidas:", event.conversaciones?.length)
    if (event.conversaciones) {
      setConversaciones(event.conversaciones)
    }
  }

  const handleNuevoMensaje = (event: any) => {
    console.log("[AdminChat] Nuevo mensaje recibido")
    if (event.mensaje) {
      // Si el mensaje es de la conversación actual, agregarlo
      if (
        conversacionActual &&
        event.mensaje.usuarioId === conversacionActual.usuarioId &&
        event.mensaje.tipoChat === conversacionActual.tipoChat
      ) {
        setMensajes((prev) => [...prev, event.mensaje])
        setTimeout(() => scrollToBottom(), 100)
      }

      // Actualizar lista de conversaciones
      cargarConversaciones()
    }
  }

  const handleNuevoAsunto = (event: any) => {
    console.log("[AdminChat] Nuevo asunto recibido")
    Alert.alert("Nuevo Asunto", `Se ha creado un nuevo asunto: ${event.asunto?.titulo}`)
    cargarConversaciones()
  }

  const handleHistorial = (event: any) => {
    console.log("[AdminChat] Historial recibido:", event.mensajes?.length)
    if (event.mensajes) {
      setMensajes(event.mensajes)
      setTimeout(() => scrollToBottom(), 100)
    }
  }

  const handleConfirmacionMensaje = (event: any) => {
    console.log("[AdminChat] Mensaje confirmado:", event.mensaje)
    if (event.mensaje && conversacionActual) {
      // Verificar que el mensaje pertenece a la conversación actual
      if (
        event.mensaje.usuarioId === conversacionActual.usuarioId &&
        event.mensaje.tipoChat === conversacionActual.tipoChat
      ) {
        setMensajes((prev) => {
          // Verificar que no exista ya el mensaje para evitar duplicados
          const existe = prev.some((m) => m.id === event.mensaje.id)
          if (existe) return prev
          return [...prev, event.mensaje]
        })
        setTimeout(() => scrollToBottom(), 100)
      }
    }
  }

  const handleError = (event: any) => {
    console.error("[AdminChat] Error:", event.mensaje)
    Alert.alert("Error", event.mensaje)
  }

  const scrollToBottom = () => {
    if (flatListRef.current && mensajes.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true })
    }
  }

  const cargarConversaciones = async () => {
    try {
      const conversacionesData = await chatService.obtenerConversacionesActivasAPI(filtroTipo)
      setConversaciones(conversacionesData)
    } catch (error) {
      console.error("[AdminChat] Error cargando conversaciones:", error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await cargarConversaciones()
    setRefreshing(false)
  }

  const seleccionarConversacion = (conversacion: Conversacion) => {
    setConversacionActual(conversacion)
    setMensajes([])

    // Solicitar historial
    if (state.user?.id) {
      chatService.solicitarHistorial(conversacion.usuarioId, conversacion.tipoChat, conversacion.asuntoId || undefined)

      // Marcar como leído
      chatService.marcarComoLeido(conversacion.usuarioId, conversacion.tipoChat, conversacion.asuntoId || undefined)
    }
  }

  const enviarMensaje = () => {
    if (!inputText.trim() || !conversacionActual || !state.user?.id) return

    const mensajeTemporal: Mensaje = {
      id: `temp_${Date.now()}`,
      usuarioId: conversacionActual.usuarioId,
      tipoChat: conversacionActual.tipoChat,
      asuntoId: conversacionActual.asuntoId || null,
      contenido: inputText.trim(),
      tipo: "admin",
      leido: false,
      timestamp: new Date().toISOString(),
    }

    // Agregar mensaje temporal a la lista
    setMensajes((prev) => [...prev, mensajeTemporal])
    setTimeout(() => scrollToBottom(), 100)

    // Enviar mensaje al servidor
    chatService.enviarMensaje(
      conversacionActual.usuarioId,
      conversacionActual.tipoChat,
      inputText.trim(),
      conversacionActual.asuntoId || undefined,
    )
    setInputText("")
  }

  const resolverAsunto = () => {
    if (!conversacionActual || !conversacionActual.asuntoId || !state.user?.id) return

    Alert.alert("Resolver Asunto", "¿Estás seguro de que quieres marcar este asunto como resuelto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Resolver",
        onPress: () => {
          chatService.resolverAsunto(conversacionActual.usuarioId, conversacionActual.asuntoId!)
          setConversacionActual(null)
          setMensajes([])
          cargarConversaciones()
        },
      },
    ])
  }

  const renderConversacion = ({ item }: { item: Conversacion }) => (
    <TouchableOpacity
      style={[
        styles.conversacionItem,
        conversacionActual?.usuarioId === item.usuarioId &&
          conversacionActual?.tipoChat === item.tipoChat &&
          styles.conversacionItemActiva,
      ]}
      onPress={() => seleccionarConversacion(item)}
    >
      <View style={styles.conversacionAvatar}>
        <Ionicons name={item.tipoChat === "ventas" ? "cart" : "help-circle"} size={24} color={Colors.light.primary} />
      </View>
      <View style={styles.conversacionInfo}>
        <View style={styles.conversacionHeader}>
          <Text style={styles.conversacionNombre} numberOfLines={1}>
            {item.usuario.nombre}
          </Text>
          {item.ultimoMensaje && (
            <Text style={styles.conversacionHora}>
              {new Date(item.ultimoMensaje.timestamp).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>
        <Text style={styles.conversacionTipo}>
          {item.tipoChat === "ventas" ? "Ventas" : "Atención al Cliente"}
          {item.asunto && ` - ${item.asunto.titulo}`}
        </Text>
        {item.ultimoMensaje && (
          <Text style={styles.conversacionUltimoMensaje} numberOfLines={1}>
            {item.ultimoMensaje.tipo === "admin" ? "Tú: " : ""}
            {item.ultimoMensaje.contenido}
          </Text>
        )}
        {item.mensajesNoLeidos > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.mensajesNoLeidos}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )

  const renderMensaje = ({ item }: { item: Mensaje }) => {
    const esAdmin = item.tipo === "admin"
    const linkStyle = esAdmin ? styles.linkTextPropio : styles.linkTextCliente

    return (
      <View style={[styles.mensajeContainer, esAdmin ? styles.mensajePropio : styles.mensajeCliente]}>
        <View style={[styles.mensajeBubble, esAdmin ? styles.bubblePropio : styles.bubbleCliente]}>
          <Text style={[styles.mensajeTexto, esAdmin && styles.mensajeTextoPropio]}>
            {item.contenido.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
              part.match(/^https?:\/\//) ? (
                <Text
                  key={index}
                  style={linkStyle}
                  onPress={() => Linking.openURL(part)}
                >
                  {part}
                </Text>
              ) : (
                <Text key={index}>{part}</Text>
              )
            )}
          </Text>
          <Text style={[styles.mensajeHora, esAdmin && styles.mensajeHoraPropia]}>
            {new Date(item.timestamp).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    )
  }

  const renderListaConversaciones = () => (
    <View style={styles.listaContainer}>
      <View style={styles.listaHeader}>
        <Text style={styles.listaTitle}>Conversaciones Activas</Text>
        <View style={styles.connectionStatus}>
          <View
            style={[styles.connectionDot, connected ? styles.connectionDotConnected : styles.connectionDotDisconnected]}
          />
          <Text style={styles.connectionText}>{connected ? "Conectado" : "Desconectado"}</Text>
        </View>
      </View>

      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[styles.filtroButton, filtroTipo === "todos" && styles.filtroButtonActivo]}
          onPress={() => {
            setFiltroTipo("todos")
            chatService.solicitarConversacionesActivas("todos")
          }}
        >
          <Text style={[styles.filtroButtonText, filtroTipo === "todos" && styles.filtroButtonTextActivo]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filtroButton, filtroTipo === "ventas" && styles.filtroButtonActivo]}
          onPress={() => {
            setFiltroTipo("ventas")
            chatService.solicitarConversacionesActivas("ventas")
          }}
        >
          <Text style={[styles.filtroButtonText, filtroTipo === "ventas" && styles.filtroButtonTextActivo]}>
            Ventas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filtroButton, filtroTipo === "atencion_cliente" && styles.filtroButtonActivo]}
          onPress={() => {
            setFiltroTipo("atencion_cliente")
            chatService.solicitarConversacionesActivas("atencion_cliente")
          }}
        >
          <Text style={[styles.filtroButtonText, filtroTipo === "atencion_cliente" && styles.filtroButtonTextActivo]}>
            Atención
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={conversaciones}
          keyExtractor={(item, index) => `${item.usuarioId}_${item.tipoChat}_${item.asuntoId || "null"}_${index}`}
          renderItem={renderConversacion}
          contentContainerStyle={styles.conversacionesList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay conversaciones activas</Text>
            </View>
          )}
        />
      )}
    </View>
  )

  const renderChat = () => (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setConversacionActual(null)}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderTitle}>{conversacionActual?.usuario.nombre}</Text>
          <Text style={styles.chatHeaderSubtitle}>
            {conversacionActual?.usuario.email}
            {conversacionActual?.asunto && ` - ${conversacionActual.asunto.titulo}`}
          </Text>
        </View>
        {conversacionActual?.tipoChat === "atencion_cliente" && conversacionActual?.asuntoId && (
          <TouchableOpacity onPress={resolverAsunto} style={styles.resolverButton}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={mensajes}
        keyExtractor={(item, index) => `${item.id || index}`}
        renderItem={renderMensaje}
        contentContainerStyle={styles.mensajesContainer}
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay mensajes en esta conversación</Text>
          </View>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={enviarMensaje}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )

  if (!state.isAuthenticated || state.user?.role !== "admin") {
    return (
      <View style={styles.container}>
        <View style={styles.notAuthContainer}>
          <Ionicons name="lock-closed" size={64} color="#ccc" />
          <Text style={styles.notAuthText}>Acceso solo para administradores</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>Chat Administrativo</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>{!conversacionActual ? renderListaConversaciones() : renderChat()}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  content: {
    flex: 1,
  },
  listaContainer: {
    flex: 1,
  },
  listaHeader: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  listaTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionDotConnected: {
    backgroundColor: "#4CAF50",
  },
  connectionDotDisconnected: {
    backgroundColor: "#f44336",
  },
  connectionText: {
    fontSize: 12,
    color: "#666",
  },
  filtrosContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  filtroButtonActivo: {
    backgroundColor: Colors.light.primary,
  },
  filtroButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  filtroButtonTextActivo: {
    color: "#fff",
  },
  conversacionesList: {
    padding: 8,
  },
  conversacionItem: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  conversacionItemActiva: {
    borderColor: Colors.light.primary,
    backgroundColor: "#f0f8ff",
  },
  conversacionAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  conversacionInfo: {
    flex: 1,
  },
  conversacionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  conversacionNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    flex: 1,
  },
  conversacionHora: {
    fontSize: 12,
    color: "#999",
  },
  conversacionTipo: {
    fontSize: 13,
    color: Colors.light.primary,
    marginBottom: 4,
  },
  conversacionUltimoMensaje: {
    fontSize: 14,
    color: "#666",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#f44336",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    padding: 16,
    gap: 12,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  chatHeaderSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 2,
  },
  resolverButton: {
    padding: 4,
  },
  mensajesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  mensajeContainer: {
    marginBottom: 12,
  },
  mensajePropio: {
    alignItems: "flex-end",
  },
  mensajeCliente: {
    alignItems: "flex-start",
  },
  mensajeBubble: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
  },
  bubblePropio: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: 4,
  },
  bubbleCliente: {
    backgroundColor: "#e0e0e0",
    borderBottomLeftRadius: 4,
  },
  mensajeTexto: {
    fontSize: 16,
    color: "#333",
  },
  mensajeTextoPropio: {
    color: "#fff",
  },
  mensajeHora: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  mensajeHoraPropia: {
    color: "#fff",
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: Colors.light.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  notAuthText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  // Enlaces del admin (enviados)
  linkTextPropio: {
    color: '#FFEBC1', // caramelo claro para fondo azul
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  // Enlaces del cliente (recibidos)
  linkTextCliente: {
    color: '#8B5E3C', // marrón cálido oscuro para fondo gris
    textDecorationLine: 'underline',
    fontWeight: '600',
  }
})
