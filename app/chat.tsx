"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { Linking } from "react-native"
import { StatusBar } from "expo-status-bar"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "../src/constants/Colors"
import { useAuth } from "../src/context/AuthContext"
import { chatService } from "../src/services/chatService"
import { SelectorArchivos } from "../src/components/SelectorArchivos"
import { PrevisualizadorArchivos } from "../src/components/PrevisualizadorArchivos"
import { VisorMultimedia } from "../src/components/VisorMultimedia"
import type { Asunto, Mensaje } from "../src/types/chat"
import type { Archivo } from "../src/types/chat"

export default function ChatScreen() {
  const { state } = useAuth()
  const [tipoChat, setTipoChat] = useState<"ventas" | "atencion_cliente" | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [inputText, setInputText] = useState("")
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [asuntoActual, setAsuntoActual] = useState<Asunto | null>(null)
  const [showAsuntoModal, setShowAsuntoModal] = useState(false)
  const [asuntoTitulo, setAsuntoTitulo] = useState("")
  const [asuntoDescripcion, setAsuntoDescripcion] = useState("")
  const [archivosSeleccionados, setArchivosSeleccionados] = useState<any[]>([])
  const [archivosPrevistos, setArchivosPrevistos] = useState<any[]>([])
  const [subiendoArchivos, setSubiendoArchivos] = useState(false)
  const [mostrarSelectorArchivos, setMostrarSelectorArchivos] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  // Conectar al WebSocket cuando se selecciona tipo de chat
  useEffect(() => {
    if (tipoChat && state.user?.id && !connected) {
      conectarChat()
    }

    return () => {
      if (connected) {
        chatService.disconnect()
      }
    }
  }, [tipoChat, state.user?.id])

  const conectarChat = async () => {
    if (!state.user?.id) {
      Alert.alert("Error", "Debes iniciar sesión para usar el chat")
      return
    }

    setLoading(true)

    try {
      // Conectar al WebSocket
      await chatService.connect(state.user.id, "cliente")
      setConnected(true)

      // Si es atención al cliente, verificar si hay asunto activo
      if (tipoChat === "atencion_cliente") {
        const asunto = await chatService.obtenerAsuntoActivoAPI(state.user.id)
        if (asunto) {
          setAsuntoActual(asunto)
          // Solicitar historial del asunto
          chatService.solicitarHistorial(state.user.id, tipoChat, asunto.id)
        } else {
          // Mostrar modal para crear asunto
          setShowAsuntoModal(true)
        }
      } else {
        // Para ventas, solicitar historial directamente
        chatService.solicitarHistorial(state.user.id, tipoChat as any)
      }

      // Registrar handlers de eventos
      chatService.on("historial", handleHistorial)
      chatService.on("nuevo_mensaje", handleNuevoMensaje)
      chatService.on("confirmacion_mensaje", handleConfirmacionMensaje)
      chatService.on("confirmacion_asunto", handleConfirmacionAsunto)
      chatService.on("asunto_resuelto", handleAsuntoResuelto)
      chatService.on("error", handleError)
    } catch (error) {
      console.error("[Chat] Error conectando:", error)
      Alert.alert("Error", "No se pudo conectar al chat. Intenta nuevamente.")
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const handleHistorial = (event: any) => {
    console.log("[Chat] Historial recibido:", event.mensajes?.length)
    if (event.mensajes) {
      setMensajes(event.mensajes)
      setTimeout(() => scrollToBottom(), 100)
    }
  }

  const handleNuevoMensaje = (event: any) => {
    const mensaje = event.mensaje
    console.log("[Chat] 📩 Nuevo mensaje recibido:", mensaje)
    if (!mensaje) return

    setMensajes((prev) => {
      // Buscar si existe un mensaje temporal cercano en tiempo
      const idxTemp = prev.findIndex(
        (m) =>
          m.id.startsWith("temp_") &&
          m.tipo === mensaje.tipo &&
          m.usuarioId === mensaje.usuarioId &&
          Math.abs(new Date(m.timestamp).getTime() - new Date(mensaje.timestamp).getTime()) < 10000
      )

      if (idxTemp !== -1) {
        const copia = [...prev]
        copia[idxTemp] = mensaje // reemplazamos el temporal con el mensaje real (con URLs Cloudinary)
        return copia
      }

      // Si no hay temporal, agregarlo al final
      const yaExiste = prev.some((m) => m.id === mensaje.id)
      if (yaExiste) return prev
      return [...prev, mensaje]
    })

    setTimeout(() => scrollToBottom(), 100)
  }

  const handleConfirmacionMensaje = (event: any) => {
    const mensaje = event.mensaje
    console.log("[Chat] ✅ Confirmación mensaje:", mensaje)

    // Si el backend no envía el mensaje completo, lo ignoramos y esperamos el evento "nuevo_mensaje"
    if (!mensaje) {
      console.log("[Chat] ⚠️ confirmacion_mensaje vacío, esperando nuevo_mensaje")
      return
    }

    setMensajes((prev) => {
      const idxTemp = prev.findIndex(
        (m) =>
          m.id.startsWith("temp_") &&
          m.tipo === mensaje.tipo &&
          m.usuarioId === mensaje.usuarioId &&
          Math.abs(new Date(m.timestamp).getTime() - new Date(mensaje.timestamp).getTime()) < 10000
      )
      if (idxTemp !== -1) {
        const copia = [...prev]
        copia[idxTemp] = mensaje
        return copia
      }
      return [...prev, mensaje]
    })
  }

  const handleConfirmacionAsunto = (event: any) => {
    console.log("[Chat] Asunto creado:", event.asunto)
    if (event.asunto) {
      setAsuntoActual(event.asunto)
      setShowAsuntoModal(false)
      Alert.alert("Éxito", "Tu asunto ha sido creado. Un administrador te atenderá pronto.")
    }
  }

  const handleAsuntoResuelto = (event: any) => {
    console.log("[Chat] Asunto resuelto")
    Alert.alert("Asunto Resuelto", "Tu asunto ha sido marcado como resuelto por un administrador.", [
      {
        text: "OK",
        onPress: () => {
          setAsuntoActual(null)
          setMensajes([])
          setTipoChat(null)
        },
      },
    ])
  }

  const handleError = (event: any) => {
    console.error("[Chat] Error:", event.mensaje)
    Alert.alert("Error", event.mensaje)
  }

  const scrollToBottom = () => {
    if (flatListRef.current && mensajes.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true })
    }
  }

  const handleArchivosSeleccionados = async (archivosNuevos: any[]) => {
    setArchivosSeleccionados(archivosNuevos)
    setMostrarSelectorArchivos(false)

    // Preparar previsualizaciones
    const previsualizaciones: any[] = []
    for (const archivo of archivosNuevos) {
      previsualizaciones.push({
        uri: archivo.uri || URL.createObjectURL(archivo),
        nombre: archivo.name,
        tipo: archivo.type.startsWith("video") ? "video" : "imagen",
        tamaño: archivo.size,
      })
    }
    setArchivosPrevistos(previsualizaciones)
  }

  const removerArchivo = (indice: number) => {
    setArchivosSeleccionados((prev) => prev.filter((_, i) => i !== indice))
    setArchivosPrevistos((prev) => prev.filter((_, i) => i !== indice))
  }

  const enviarMensajeConArchivos = async () => {
  if (!state.user?.id || !tipoChat || (archivosSeleccionados.length === 0 && !inputText.trim())) {
    return
  }

  // 🔹 Crear mensaje temporal visible al instante
  const mensajeTemporal: Mensaje = {
    id: `temp_${Date.now()}`,
    usuarioId: state.user.id,
    tipoChat,
    asuntoId: tipoChat === "atencion_cliente" ? asuntoActual?.id || null : null,
    contenido: inputText.trim() || "(archivo adjunto)",
    tipo: "cliente",
    leido: false,
    timestamp: new Date().toISOString(),
    archivos: archivosPrevistos.map((a) => ({
      tipo: a.tipo,
      urlCloudinary: a.uri, // usamos la URI local de preview
      nombreOriginal: a.nombre,
      tamaño: a.tamaño,
      publicId: "local_preview",
    })),
  }

  // Mostrarlo inmediatamente en el chat
  setMensajes((prev) => [...prev, mensajeTemporal])
  setTimeout(() => scrollToBottom(), 100)

  setSubiendoArchivos(true)

  try {
    const archivosSubidos: Archivo[] = []

    for (const archivo of archivosSeleccionados) {
      try {
        const archivoSubido = await chatService.subirArchivo(archivo)
        archivosSubidos.push(archivoSubido)
      } catch (error) {
        console.error("[Chat] Error subiendo archivo:", error)
        Alert.alert("Error", "No se pudo subir uno de los archivos. Intenta nuevamente.")
        setSubiendoArchivos(false)
        return
      }
    }

    // 🔹 Solo incluir asuntoId si existe (no enviar null ni undefined)
    const asuntoIdValido =
      tipoChat === "atencion_cliente" && asuntoActual?.id ? asuntoActual.id : undefined

    // 🔹 Evitar mandar contenido vacío si solo hay archivos
    const contenidoValido = inputText.trim() || ""

    // 🔹 Enviar solo si hay algo que mandar
    if (archivosSubidos.length > 0 || contenidoValido) {
      chatService.enviarMensajeConArchivos(
        state.user.id,
        tipoChat,
        contenidoValido,
        archivosSubidos,
        asuntoIdValido
      )

      // 🔹 Limpiar estados
      setInputText("")
      setArchivosSeleccionados([])
      setArchivosPrevistos([])
    }
  } catch (error) {
    console.error("[Chat] Error enviando mensaje con archivos:", error)
    Alert.alert("Error", "No se pudo enviar el mensaje")
  } finally {
    setSubiendoArchivos(false)
  }
}


  const enviarMensaje = () => {
    if (archivosSeleccionados.length > 0) {
      enviarMensajeConArchivos()
    } else if (inputText.trim() && state.user?.id && tipoChat) {
      const asuntoId = tipoChat === "atencion_cliente" ? asuntoActual?.id : undefined

      const mensajeTemporal: Mensaje = {
        id: `temp_${Date.now()}`,
        usuarioId: state.user.id,
        tipoChat,
        asuntoId: asuntoId || null,
        contenido: inputText.trim(),
        tipo: "cliente",
        leido: false,
        timestamp: new Date().toISOString(),
      }

      // Agregar mensaje temporal a la lista
      setMensajes((prev) => [...prev, mensajeTemporal])
      setTimeout(() => scrollToBottom(), 100)

      // Enviar mensaje al servidor
      chatService.enviarMensaje(state.user.id, tipoChat, inputText.trim(), asuntoId)
      setInputText("")
    }
  }

  const crearAsunto = () => {
    if (!asuntoTitulo.trim() || !asuntoDescripcion.trim() || !state.user?.id) {
      Alert.alert("Error", "Por favor completa todos los campos")
      return
    }

    chatService.crearAsunto(state.user.id, asuntoTitulo.trim(), asuntoDescripcion.trim())
    setAsuntoTitulo("")
    setAsuntoDescripcion("")
  }

  const renderTipoChatSelector = () => (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>Selecciona el tipo de consulta</Text>
      <TouchableOpacity style={styles.tipoChatButton} onPress={() => setTipoChat("ventas")}>
        <Ionicons name="cart" size={32} color={Colors.light.primary} />
        <Text style={styles.tipoChatButtonText}>Venta de Producto</Text>
        <Text style={styles.tipoChatButtonDesc}>Consultas sobre productos, precios y pedidos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tipoChatButton} onPress={() => setTipoChat("atencion_cliente")}>
        <Ionicons name="help-circle" size={32} color={Colors.light.primary} />
        <Text style={styles.tipoChatButtonText}>Atención al Cliente</Text>
        <Text style={styles.tipoChatButtonDesc}>Soporte técnico, reclamos y consultas generales</Text>
      </TouchableOpacity>
    </View>
  )

  const renderMensaje = ({ item }: { item: Mensaje }) => {
    const esPropio = item.tipo === "cliente"
    const linkStyle = esPropio ? styles.linkTextPropio : styles.linkTextOtro

    return (
      <View style={[styles.mensajeContainer, esPropio ? styles.mensajePropio : styles.mensajeAdmin]}>
        <View style={[styles.mensajeBubble, esPropio ? styles.bubblePropio : styles.bubbleAdmin]}>
          {item.archivos && item.archivos.length > 0 && <VisorMultimedia archivos={item.archivos} />}

          {/* Mostrar contenido del mensaje */}
          {item.contenido && (
            <Text style={[styles.mensajeTexto, esPropio && styles.mensajeTextoPropio]}>
              {item.contenido.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
                part.match(/^https?:\/\//) ? (
                  <Text key={index} style={linkStyle} onPress={() => Linking.openURL(part)}>
                    {part}
                  </Text>
                ) : (
                  <Text key={index}>{part}</Text>
                ),
              )}
            </Text>
          )}

          <Text style={[styles.mensajeHora, esPropio && styles.mensajeHoraPropia]}>
            {new Date(item.timestamp).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    )
  }

  const renderChat = () => (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setTipoChat(null)}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderTitle}>{tipoChat === "ventas" ? "Ventas" : "Atención al Cliente"}</Text>
          {asuntoActual && <Text style={styles.chatHeaderSubtitle}>{asuntoActual.titulo}</Text>}
          <View style={styles.connectionStatus}>
            <View
              style={[
                styles.connectionDot,
                connected ? styles.connectionDotConnected : styles.connectionDotDisconnected,
              ]}
            />
            <Text style={styles.connectionText}>{connected ? "Conectado" : "Desconectado"}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Conectando al chat...</Text>
        </View>
      ) : (
        <>
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
                <Text style={styles.emptyText}>No hay mensajes aún. Inicia la conversación.</Text>
              </View>
            )}
          />

          {mostrarSelectorArchivos && (
            <SelectorArchivos onArchivosSeleccionados={handleArchivosSeleccionados} deshabilitado={subiendoArchivos} />
          )}

          {archivosPrevistos.length > 0 && (
            <PrevisualizadorArchivos
              archivos={archivosPrevistos}
              onRemover={removerArchivo}
              onEnviar={enviarMensajeConArchivos}
              enviando={subiendoArchivos}
            />
          )}

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[styles.botonAttach, subiendoArchivos && styles.botonDeshabilitado]}
              onPress={() => setMostrarSelectorArchivos(!mostrarSelectorArchivos)}
              disabled={subiendoArchivos}
            >
              <Ionicons name="attach" size={20} color={Colors.light.primary} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Escribe un mensaje..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && archivosSeleccionados.length === 0 && styles.sendButtonDisabled,
                subiendoArchivos && styles.sendButtonDisabled,
              ]}
              onPress={enviarMensaje}
              disabled={(!inputText.trim() && archivosSeleccionados.length === 0) || subiendoArchivos}
            >
              <Ionicons name={archivosSeleccionados.length > 0 ? "cloud-upload" : "send"} size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  )

  const renderAsuntoModal = () => (
    <Modal visible={showAsuntoModal} transparent animationType="slide" onRequestClose={() => {}}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Crear Asunto</Text>
          <Text style={styles.modalSubtitle}>Describe tu consulta para que podamos ayudarte mejor</Text>

          <TextInput
            style={styles.modalInput}
            placeholder="Título del asunto"
            value={asuntoTitulo}
            onChangeText={setAsuntoTitulo}
            maxLength={100}
          />

          <TextInput
            style={[styles.modalInput, styles.modalTextArea]}
            placeholder="Descripción detallada"
            value={asuntoDescripcion}
            onChangeText={setAsuntoDescripcion}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => {
                setShowAsuntoModal(false)
                setTipoChat(null)
              }}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={crearAsunto}>
              <Text style={styles.modalButtonTextPrimary}>Crear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )

  if (!state.isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.notAuthContainer}>
          <Ionicons name="lock-closed" size={64} color="#ccc" />
          <Text style={styles.notAuthText}>Debes iniciar sesión para usar el chat</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push("/")}>
            <Text style={styles.loginButtonText}>Ir a Inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <>
      <StatusBar backgroundColor={Colors.light.primary} style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {!tipoChat ? renderTipoChatSelector() : renderChat()}
          {renderAsuntoModal()}
        </View>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: Platform.OS === "ios" ? 48 : 0,
  },
  selectorContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  selectorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 32,
    textAlign: "center",
  },
  tipoChatButton: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  tipoChatButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 12,
  },
  tipoChatButtonDesc: {
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 8,
    textAlign: "center",
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
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
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
    color: "#fff",
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.icon,
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
  mensajeAdmin: {
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
  bubbleAdmin: {
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
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "android" ? 6 : 10, // ✅ más compacto en Android
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
    gap: 6,
  },
  botonAttach: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: Colors.light.primary,
  },
  modalButtonSecondary: {
    backgroundColor: "#e0e0e0",
  },
  modalButtonTextPrimary: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextSecondary: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
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
    marginBottom: 24,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkTextPropio: {
    color: "#FFEBC1",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  linkTextOtro: {
    color: "#8B5E3C",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  }
})
