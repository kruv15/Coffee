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
import type { Conversacion, Mensaje } from "../src/types/chat"

export default function AdminChatScreen() {
  const { state } = useAuth()
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [conversacionActual, setConversacionActual] = useState<Conversacion | null>(null)
  const [inputTexto, setInputTexto] = useState("")
  const [mostrarSelectorArchivos, setMostrarSelectorArchivos] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "ventas" | "atencion_cliente">("todos")
  const flatListRef = useRef<FlatList>(null)

  // Custom hooks
  const { conectado, cargando, error, registrarManejador, desregistrarManejador } = useChatConexion({
    usuarioId: state.user?._id || "",
    tipoUsuario: "admin",
    enHabilitado: !!state.isAuthenticated && state.user?.rol === "admin",
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

  // Verificar que sea admin
  useEffect(() => {
    if (state.isAuthenticated && state.user?.rol !== "admin") {
      Alert.alert("Acceso Denegado", "Solo los administradores pueden acceder", [
        { text: "OK", onPress: () => router.back() },
      ])
    }
  }, [state.isAuthenticated, state.user?.rol])

  // Registrar manejadores de eventos
  useEffect(() => {
    if (!conectado) return

    registrarManejador("conversaciones_activas", manejarConversacionesActivas)
    registrarManejador("nuevo_mensaje", manejarNuevoMensaje)
    registrarManejador("nuevo_asunto", manejarNuevoAsunto)
    registrarManejador("historial", manejarHistorial)
    registrarManejador("confirmacion_mensaje", manejarConfirmacionMensaje)
    registrarManejador("error", manejarError)

    // Solicitar conversaciones activas al conectar
    servicioWebSocket.solicitarConversacionesActivas(tipoFiltro)

    return () => {
      desregistrarManejador("conversaciones_activas")
      desregistrarManejador("nuevo_mensaje")
      desregistrarManejador("nuevo_asunto")
      desregistrarManejador("historial")
      desregistrarManejador("confirmacion_mensaje")
      desregistrarManejador("error")
    }
  }, [conectado, registrarManejador, desregistrarManejador, tipoFiltro])

  const manejarConversacionesActivas = (evento: any) => {
    console.log("[AdminChat] Conversaciones recibidas:", evento.conversaciones?.length)
    if (evento.conversaciones) {
      if (tipoFiltro === "todos") {
        setConversaciones((previas) => {
          // Evitar duplicados combinando por ID único (usuarioId + tipoChat + asuntoId)
          const mapConversaciones = new Map<string, Conversacion>()

          previas.forEach((conv) => {
            const clave = `${conv.usuarioId}_${conv.tipoChat}_${conv.asuntoId || "null"}`
            mapConversaciones.set(clave, conv)
          })

          evento.conversaciones.forEach((conv: Conversacion) => {
            const clave = `${conv.usuarioId}_${conv.tipoChat}_${conv.asuntoId || "null"}`
            mapConversaciones.set(clave, conv)
          })

          return Array.from(mapConversaciones.values())
        })
      } else {
        setConversaciones(evento.conversaciones)
      }
    }
  }

  const manejarNuevoMensaje = async (evento: any) => {
    const mensaje = evento.mensaje
    console.log("[AdminChat] Nuevo mensaje recibido")

    if (!mensaje) return

    // Si pertenece a la conversación actual, agregarlo
    const perteneceAConversacionActual =
      conversacionActual &&
      mensaje.tipoChat === conversacionActual.tipoChat &&
      mensaje.usuarioId === conversacionActual.usuarioId &&
      (conversacionActual.asuntoId ?? null) === (mensaje.asuntoId ?? null)

    if (perteneceAConversacionActual) {
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
    } else {
      console.log("[AdminChat] Mensaje de otra conversación, actualizando lista")

      // Refrescar conversaciones activas
      const nuevasConversaciones = await servicioAPIChat.obtenerConversacionesActivas(tipoFiltro)
      setConversaciones(nuevasConversaciones)

      // Abrir automáticamente si no hay conversación seleccionada
      if (!conversacionActual) {
        const conversacionDelCliente = nuevasConversaciones.find(
          (conv) =>
            conv.usuarioId === mensaje.usuarioId &&
            conv.tipoChat === mensaje.tipoChat &&
            (conv.asuntoId ?? null) === (mensaje.asuntoId ?? null),
        )

        if (conversacionDelCliente) {
          console.log("[AdminChat] Abriendo conversación automáticamente")
          seleccionarConversacion(conversacionDelCliente)
        }
      }
    }
  }

  const manejarNuevoAsunto = (evento: any) => {
    console.log("[AdminChat] Nuevo asunto creado")
    Alert.alert("Nuevo Asunto", `Nuevo: ${evento.asunto?.titulo}`)
    cargarConversaciones()
  }

  const manejarHistorial = (evento: any) => {
    console.log("[AdminChat] Historial recibido:", evento.mensajes?.length)
    if (evento.mensajes) {
      establecerMensajes(evento.mensajes)
      desplazarAlFinal()
    }
  }

  const manejarConfirmacionMensaje = (evento: any) => {
    console.log("[AdminChat] Mensaje confirmado")
    // El evento nuevo_mensaje manejará la actualización
  }

  const manejarError = (evento: any) => {
    console.error("[AdminChat] Error:", evento.mensaje)
    Alert.alert("Error", evento.mensaje)
  }

  const desplazarAlFinal = () => {
    setTimeout(() => {
      if (flatListRef.current && mensajes.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true })
      }
    }, 100)
  }

  const cargarConversaciones = async () => {
    try {
      const conversacionesData = await servicioAPIChat.obtenerConversacionesActivas(tipoFiltro)
      setConversaciones(conversacionesData)
    } catch (error) {
      console.error("[AdminChat] Error cargando conversaciones:", error)
    }
  }

  const actualizarConversaciones = async () => {
    setActualizando(true)
    await cargarConversaciones()
    setActualizando(false)
  }

  const seleccionarConversacion = (conversacion: Conversacion) => {
    setConversacionActual(conversacion)
    limpiarMensajes()
    limpiarArchivos()
    setInputTexto("")

    // Solicitar historial
    servicioWebSocket.solicitarHistorial(
      conversacion.usuarioId,
      conversacion.tipoChat,
      conversacion.asuntoId ?? undefined,
    )

    // Marcar como leído
    servicioWebSocket.marcarComoLeido(conversacion.usuarioId, conversacion.tipoChat, conversacion.asuntoId || null)
  }

  const enviarMensajeSimple = () => {
    if (!inputTexto.trim() || !conversacionActual) return

    const mensajeTemporal: Mensaje = {
      id: `temp_${Date.now()}`,
      usuarioId: conversacionActual.usuarioId,
      tipoChat: conversacionActual.tipoChat,
      asuntoId: conversacionActual.asuntoId || null,
      contenido: inputTexto.trim(),
      tipo: "admin",
      leido: false,
      timestamp: new Date().toISOString(),
    }

    agregarMensajeLocal(mensajeTemporal)
    desplazarAlFinal()

    servicioWebSocket.enviarMensaje(
      conversacionActual.usuarioId,
      conversacionActual.tipoChat,
      inputTexto.trim(),
      conversacionActual.asuntoId || undefined,
    )

    setInputTexto("")
  }

  const enviarMensajeConArchivosHandler = async () => {
    if (!conversacionActual || (archivosSeleccionados.length === 0 && !inputTexto.trim())) {
      return
    }

    // Subir archivos primero ANTES de crear el mensaje temporal
    const idMensajeTemp = `temp_${Date.now()}`

    try {
      // Subir archivos primero ANTES de crear el mensaje temporal
      const archivosSubidos = await subirArchivos()
      if (!archivosSubidos) {
        Alert.alert("Error", errorArchivos || "No se pudieron subir los archivos")
        return
      }

      // Ahora crear el mensaje temporal con archivos reales subidos
      const mensajeTemporal: Mensaje = {
        id: idMensajeTemp,
        usuarioId: conversacionActual.usuarioId,
        tipoChat: conversacionActual.tipoChat,
        asuntoId: conversacionActual.asuntoId || null,
        contenido: inputTexto.trim() || "",
        tipo: "admin",
        leido: false,
        timestamp: new Date().toISOString(),
        // Usar archivos ya subidos con urlCloudinary correcta
        archivos: archivosSubidos,
      }

      agregarMensajeLocal(mensajeTemporal)
      desplazarAlFinal()

      // Enviar mensaje con archivos subidos correctamente
      if (archivosSubidos.length > 0 || inputTexto.trim()) {
        servicioWebSocket.enviarMensajeConArchivos(
          conversacionActual.usuarioId,
          conversacionActual.tipoChat,
          inputTexto.trim() || "",
          archivosSubidos,
          conversacionActual.asuntoId || undefined,
        )

        setInputTexto("")
        limpiarArchivos()
      }
    } catch (error) {
      console.error("[AdminChat] Error enviando mensaje con archivos:", error)
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

  const resolverAsunto = () => {
    if (!conversacionActual || !conversacionActual.asuntoId) return

    Alert.alert("Resolver Asunto", "¿Estás seguro de que quieres marcar este asunto como resuelto?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Resolver",
        onPress: () => {
          servicioWebSocket.resolverAsunto(conversacionActual.usuarioId, conversacionActual.asuntoId!)
          setConversacionActual(null)
          limpiarMensajes()
          cargarConversaciones()
        },
      },
    ])
  }

  if (!state.isAuthenticated || state.user?.rol !== "admin") {
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
    <>
      <StatusBar backgroundColor={Colors.light.primary} style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>{!conversacionActual ? renderListaConversaciones() : renderChat()}</View>
      </SafeAreaView>
    </>
  )

  function renderListaConversaciones() {
    return (
      <View style={styles.listaContainer}>
        <View style={styles.listaHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.listaTitle}>Conversaciones Activas</Text>
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

        <View style={styles.filtrosContainer}>
          <TouchableOpacity
            style={[styles.filtroButton, tipoFiltro === "todos" && styles.filtroButtonActivo]}
            onPress={() => {
              setTipoFiltro("todos")
              servicioWebSocket.solicitarConversacionesActivas("todos")
            }}
          >
            <Text style={[styles.filtroButtonText, tipoFiltro === "todos" && styles.filtroButtonTextActivo]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filtroButton, tipoFiltro === "ventas" && styles.filtroButtonActivo]}
            onPress={() => {
              setTipoFiltro("ventas")
              servicioWebSocket.solicitarConversacionesActivas("ventas")
            }}
          >
            <Text style={[styles.filtroButtonText, tipoFiltro === "ventas" && styles.filtroButtonTextActivo]}>
              Ventas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filtroButton, tipoFiltro === "atencion_cliente" && styles.filtroButtonActivo]}
            onPress={() => {
              setTipoFiltro("atencion_cliente")
              servicioWebSocket.solicitarConversacionesActivas("atencion_cliente")
            }}
          >
            <Text style={[styles.filtroButtonText, tipoFiltro === "atencion_cliente" && styles.filtroButtonTextActivo]}>
              Atención
            </Text>
          </TouchableOpacity>
        </View>

        {cargando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : (
          <FlatList
            data={conversaciones}
            keyExtractor={(item, index) => `${item.usuarioId}_${item.tipoChat}_${item.asuntoId || "null"}_${index}`}
            renderItem={({ item }) => renderConversacion(item)}
            contentContainerStyle={styles.conversacionesList}
            refreshControl={<RefreshControl refreshing={actualizando} onRefresh={actualizarConversaciones} />}
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
  }

  function renderConversacion(item: Conversacion) {
    const esActiva = conversacionActual?.usuarioId === item.usuarioId && conversacionActual?.tipoChat === item.tipoChat

    return (
      <TouchableOpacity
        style={[styles.conversacionItem, esActiva && styles.conversacionItemActiva]}
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
  }

  function renderChat() {
    return (
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
          renderItem={({ item }) => renderMensaje(item)}
          contentContainerStyle={styles.mensajesContainer}
          onContentSizeChange={() => desplazarAlFinal()}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay mensajes en esta conversación</Text>
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
      </KeyboardAvoidingView>
    )
  }

  function renderMensaje(item: Mensaje) {
    const esAdmin = item.tipo === "admin"
    const linkStyle = esAdmin ? styles.linkTextPropio : styles.linkTextCliente

    return (
      <View style={[styles.mensajeContainer, esAdmin ? styles.mensajePropio : styles.mensajeCliente]}>
        <View style={[styles.mensajeBubble, esAdmin ? styles.bubblePropio : styles.bubbleCliente]}>
          {item.archivos && item.archivos.length > 0 && <VisorMultimedia archivos={item.archivos} />}

          {item.contenido && (
            <Text style={[styles.mensajeTexto, esAdmin && styles.mensajeTextoPropio]}>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: Platform.OS === "ios" ? 48 : 0,
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
    flexDirection: "row",
    alignItems: "center", // 🔹 Centra verticalmente
    justifyContent: "space-between",
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
  linkTextPropio: {
    color: "#FFEBC1",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  linkTextCliente: {
    color: "#8B5E3C",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
})
