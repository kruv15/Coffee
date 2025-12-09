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
import { useChatConexion } from "../src/hooks/useChatConexion"
import { useMensajesTiempo } from "../src/hooks/useMensajesTiempo"
import { useArchivosSubida } from "../src/hooks/useArchivosSubida"
import { servicioAPIChat } from "../src/services/api-chat-servicio"
import { servicioWebSocket } from "../src/services/websocket-servicio"
import { SelectorArchivos } from "../src/components/SelectorArchivos"
import { PrevisualizadorArchivos } from "../src/components/PrevisualizadorArchivos"
import { VisorMultimedia } from "../src/components/VisorMultimedia"
import type { Asunto, Mensaje } from "../src/types/chat"

export default function ChatScreen() {
  const { state } = useAuth()
  const [tipoChat, setTipoChat] = useState<"ventas" | "atencion_cliente" | null>(null)
  const [asuntoActual, setAsuntoActual] = useState<Asunto | null>(null)
  const [mostrarModalAsunto, setMostrarModalAsunto] = useState(false)
  const [mostrarSelectorArchivos, setMostrarSelectorArchivos] = useState(false)
  const [tituloAsunto, setTituloAsunto] = useState("")
  const [descripcionAsunto, setDescripcionAsunto] = useState("")
  const [inputTexto, setInputTexto] = useState("")
  const flatListRef = useRef<FlatList>(null)

  // Custom hooks
  const { conectado, cargando, error, registrarManejador, desregistrarManejador } = useChatConexion({
    usuarioId: state.user?._id || "",
    tipoUsuario: "cliente",
    enHabilitado: !!tipoChat && !!state.isAuthenticated,
  })

  const { mensajes, agregarMensajeLocal, reemplazarMensajeLocal, establecerMensajes, limpiarMensajes } =
    useMensajesTiempo()

  const {
    archivosPreview,
    archivosSeleccionados,
    subiendo,
    error: errorArchivos,
    agregarArchivos,
    removerArchivo,
    subirArchivos,
    limpiar: limpiarArchivos,
  } = useArchivosSubida()

  // Cargar asunto activo si es atención al cliente
  useEffect(() => {
    if (tipoChat === "atencion_cliente" && state.user?._id && !cargando) {
      cargarAsuntoActivo()
    }
  }, [tipoChat, state.user?._id, cargando])

  // Registrar manejadores de eventos WebSocket
  useEffect(() => {
    if (!conectado) return

    registrarManejador("historial", manejarHistorial)
    registrarManejador("nuevo_mensaje", manejarNuevoMensaje)
    registrarManejador("confirmacion_mensaje", manejarConfirmacionMensaje)
    registrarManejador("confirmacion_asunto", manejarConfirmacionAsunto)
    registrarManejador("asunto_resuelto", manejarAsuntoResuelto)
    registrarManejador("error", manejarError)

    // Solicitar historial inicial
    if (state.user?._id && tipoChat) {
      servicioWebSocket.solicitarHistorial(
        state.user._id,
        tipoChat,
        tipoChat === "atencion_cliente" ? asuntoActual?.id : undefined,
      )
    }

    return () => {
      desregistrarManejador("historial")
      desregistrarManejador("nuevo_mensaje")
      desregistrarManejador("confirmacion_mensaje")
      desregistrarManejador("confirmacion_asunto")
      desregistrarManejador("asunto_resuelto")
      desregistrarManejador("error")
    }
  }, [conectado, registrarManejador, desregistrarManejador, state.user?._id, tipoChat, asuntoActual?.id])

  const cargarAsuntoActivo = async () => {
    if (!state.user?._id) return

    try {
      const asunto = await servicioAPIChat.obtenerAsuntoActivo(state.user._id)
      if (asunto) {
        setAsuntoActual(asunto)
      } else {
        setMostrarModalAsunto(true)
      }
    } catch (error) {
      console.error("[Chat] Error cargando asunto activo:", error)
    }
  }

  const manejarHistorial = (evento: any) => {
    console.log("[Chat] Historial recibido:", evento.mensajes?.length)
    if (evento.mensajes) {
      establecerMensajes(evento.mensajes)
      desplazarAlFinal()
    }
  }

  const manejarNuevoMensaje = (evento: any) => {
    const mensaje = evento.mensaje
    console.log("[Chat] Nuevo mensaje recibido")

    if (!mensaje) return

    const idTemporal = mensajes.find(
      (m) =>
        m.id.startsWith("temp_") &&
        Math.abs(new Date(m.timestamp).getTime() - new Date(mensaje.timestamp).getTime()) < 10000,
    )?.id

    if (idTemporal) {
      reemplazarMensajeLocal(idTemporal, mensaje)
    } else {
      agregarMensajeLocal(mensaje)
    }

    desplazarAlFinal()
  }

  const manejarConfirmacionMensaje = (evento: any) => {
    console.log("[Chat] Mensaje confirmado")
    // El evento nuevo_mensaje manejará la actualización
  }

  const manejarConfirmacionAsunto = (evento: any) => {
    console.log("[Chat] Asunto creado:", evento.asunto?.titulo)
    if (evento.asunto) {
      setAsuntoActual(evento.asunto)
      setMostrarModalAsunto(false)
      Alert.alert("Éxito", "Tu asunto ha sido creado. Un administrador te atenderá pronto.")
    }
  }

  const manejarAsuntoResuelto = (evento: any) => {
    console.log("[Chat] Asunto resuelto")
    Alert.alert("Asunto Resuelto", "Tu asunto ha sido marcado como resuelto.", [
      {
        text: "OK",
        onPress: () => {
          setAsuntoActual(null)
          limpiarMensajes()
          setTipoChat(null)
        },
      },
    ])
  }

  const manejarError = (evento: any) => {
    console.error("[Chat] Error recibido:", evento.mensaje)
    Alert.alert("Error", evento.mensaje)
  }

  const desplazarAlFinal = () => {
    setTimeout(() => {
      if (flatListRef.current && mensajes.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true })
      }
    }, 100)
  }

  const enviarMensajeSimple = () => {
    if (!inputTexto.trim() || !state.user?._id || !tipoChat) return

    const mensajeTemporal: Mensaje = {
      id: `temp_${Date.now()}`,
      usuarioId: state.user._id,
      tipoChat,
      asuntoId: tipoChat === "atencion_cliente" ? asuntoActual?.id || null : null,
      contenido: inputTexto.trim(),
      tipo: "cliente",
      leido: false,
      timestamp: new Date().toISOString(),
    }

    agregarMensajeLocal(mensajeTemporal)
    desplazarAlFinal()

    servicioWebSocket.enviarMensaje(
      state.user._id,
      tipoChat,
      inputTexto.trim(),
      tipoChat === "atencion_cliente" ? asuntoActual?.id : undefined,
    )

    setInputTexto("")
  }

  const enviarMensajeConArchivosHandler = async () => {
    if (!state.user?._id || !tipoChat || (archivosSeleccionados.length === 0 && !inputTexto.trim())) {
      return
    }

    const idMensajeTemp = `temp_${Date.now()}`

    try {
      // Subir archivos primero ANTES de crear el mensaje temporal
      const archivosSubidos = await subirArchivos()
      if (!archivosSubidos) {
        Alert.alert("Error", errorArchivos || "No se pudieron subir los archivos")
        return
      }

      const mensajeTemporal: Mensaje = {
        id: idMensajeTemp,
        usuarioId: state.user._id,
        tipoChat,
        asuntoId: tipoChat === "atencion_cliente" ? asuntoActual?.id || null : null,
        contenido: inputTexto.trim() || "",
        tipo: "cliente",
        leido: false,
        timestamp: new Date().toISOString(),
        archivos: archivosSubidos,
      }

      agregarMensajeLocal(mensajeTemporal)
      desplazarAlFinal()

      // Enviar mensaje con archivos subidos correctamente
      if (archivosSubidos.length > 0 || inputTexto.trim()) {
        servicioWebSocket.enviarMensajeConArchivos(
          state.user._id,
          tipoChat,
          inputTexto.trim() || "",
          archivosSubidos,
          tipoChat === "atencion_cliente" ? asuntoActual?.id : undefined,
        )

        setInputTexto("")
        limpiarArchivos()
      }
    } catch (error) {
      console.error("[Chat] Error enviando mensaje con archivos:", error)
      Alert.alert("Error", "Hubo un problema al enviar el mensaje")
    }
  }

  const enviarMensaje = () => {
    if (archivosSeleccionados.length > 0) {
      enviarMensajeConArchivosHandler()
    } else {
      enviarMensajeSimple()
    }
  }

  const crearAsunto = () => {
    if (!tituloAsunto.trim() || !descripcionAsunto.trim() || !state.user?._id) {
      Alert.alert("Error", "Por favor completa todos los campos")
      return
    }

    servicioWebSocket.crearAsunto(state.user._id, tituloAsunto.trim(), descripcionAsunto.trim())
    setTituloAsunto("")
    setDescripcionAsunto("")
  }

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
          {renderModalAsunto()}
        </View>
      </SafeAreaView>
    </>
  )

  function renderTipoChatSelector() {
    return (
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
  }

  function renderChat() {
    return (
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
                  conectado ? styles.connectionDotConnected : styles.connectionDotDisconnected,
                ]}
              />
              <Text style={styles.connectionText}>{conectado ? "Conectado" : "Desconectado"}</Text>
            </View>
          </View>
        </View>

        {cargando ? (
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
              renderItem={({ item }) => renderMensaje(item)}
              contentContainerStyle={styles.mensajesContainer}
              onContentSizeChange={() => desplazarAlFinal()}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No hay mensajes aún. Inicia la conversación.</Text>
                </View>
              )}
            />

            {mostrarSelectorArchivos && (
              <SelectorArchivos onArchivosSeleccionados={agregarArchivos} deshabilitado={subiendo} />
            )}

            {archivosPreview.length > 0 && (
              <PrevisualizadorArchivos
                archivos={archivosPreview}
                onRemover={removerArchivo}
                onEnviar={enviarMensajeConArchivosHandler}
                enviando={subiendo}
              />
            )}

            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={[styles.botonAttach, subiendo && styles.botonDeshabilitado]}
                onPress={() => setMostrarSelectorArchivos(!mostrarSelectorArchivos)}
                disabled={subiendo}
              >
                <Ionicons name="attach" size={20} color={Colors.light.primary} />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Escribe un mensaje..."
                value={inputTexto}
                onChangeText={setInputTexto}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputTexto.trim() && archivosSeleccionados.length === 0 && styles.sendButtonDisabled,
                  subiendo && styles.sendButtonDisabled,
                ]}
                onPress={enviarMensaje}
                disabled={(!inputTexto.trim() && archivosSeleccionados.length === 0) || subiendo}
              >
                <Ionicons name={archivosSeleccionados.length > 0 ? "cloud-upload" : "send"} size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    )
  }

  function renderMensaje(item: Mensaje) {
    const esPropio = item.tipo === "cliente"
    const linkStyle = esPropio ? styles.linkTextPropio : styles.linkTextOtro

    return (
      <View style={[styles.mensajeContainer, esPropio ? styles.mensajePropio : styles.mensajeAdmin]}>
        <View style={[styles.mensajeBubble, esPropio ? styles.bubblePropio : styles.bubbleAdmin]}>
          {item.archivos && item.archivos.length > 0 && <VisorMultimedia archivos={item.archivos} />}

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

  function renderModalAsunto() {
    return (
      <Modal visible={mostrarModalAsunto} transparent animationType="slide" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Crear Asunto</Text>
            <Text style={styles.modalSubtitle}>Describe tu consulta para que podamos ayudarte mejor</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Título del asunto"
              value={tituloAsunto}
              onChangeText={setTituloAsunto}
              maxLength={100}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Descripción detallada"
              value={descripcionAsunto}
              onChangeText={setDescripcionAsunto}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setMostrarModalAsunto(false)
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
  }
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
    paddingVertical: Platform.OS === "android" ? 6 : 10,
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
  },
})
