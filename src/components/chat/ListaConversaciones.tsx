import { Ionicons } from "@expo/vector-icons"
import React from "react"
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { Colors } from "../../constants/Colors"
import type { Conversacion } from "../../types/chat"

interface ListaConversacionesProps {
  conversaciones: Conversacion[]
  conversacionActual: Conversacion | null
  onSeleccionar: (conversacion: Conversacion) => void
  onRefresh: () => void
  actualizando: boolean
  vacia: boolean
}

export function ListaConversaciones({
  conversaciones,
  conversacionActual,
  onSeleccionar,
  onRefresh,
  actualizando,
  vacia,
}: ListaConversacionesProps) {
  const renderConversacion = (conversacion: Conversacion) => {
    const esActiva =
      conversacionActual?.usuarioId === conversacion.usuarioId &&
      conversacionActual?.tipoChat === conversacion.tipoChat

    return (
      <TouchableOpacity
        style={[styles.item, esActiva && styles.itemActivo]}
        onPress={() => onSeleccionar(conversacion)}
      >
        <View style={styles.avatar}>
          <Ionicons
            name={conversacion.tipoChat === "ventas" ? "cart" : "help-circle"}
            size={24}
            color={Colors.light.primary}
          />
        </View>

        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.nombre} numberOfLines={1}>
              {conversacion.usuario.nombre}
            </Text>
            {conversacion.ultimoMensaje && (
              <Text style={styles.hora}>
                {new Date(conversacion.ultimoMensaje.timestamp).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </View>

          <Text style={styles.tipo}>
            {conversacion.tipoChat === "ventas" ? "Ventas" : "Atención al Cliente"}
            {conversacion.asunto && ` - ${conversacion.asunto.titulo}`}
          </Text>

          {conversacion.ultimoMensaje && (
            <Text style={styles.ultimoMensaje} numberOfLines={1}>
              {conversacion.ultimoMensaje.tipo === "admin" ? "Tú: " : ""}
              {conversacion.ultimoMensaje.contenido}
            </Text>
          )}

          {conversacion.mensajesNoLeidos > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>{conversacion.mensajesNoLeidos}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <FlatList
      data={conversaciones}
      keyExtractor={(item, index) =>
        `${item.usuarioId}_${item.tipoChat}_${item.asuntoId || "null"}_${index}`
      }
      renderItem={({ item }) => renderConversacion(item)}
      contentContainerStyle={styles.lista}
      refreshControl={
        <RefreshControl refreshing={actualizando} onRefresh={onRefresh} />
      }
      ListEmptyComponent={() =>
        !vacia ? null : (
          <View style={styles.vacio}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.textoVacio}>No hay conversaciones activas</Text>
          </View>
        )
      }
    />
  )
}

const styles = StyleSheet.create({
  lista: {
    padding: 8,
  },
  item: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  itemActivo: {
    borderColor: Colors.light.primary,
    backgroundColor: "#f0f8ff",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  nombre: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
    flex: 1,
  },
  hora: {
    fontSize: 12,
    color: "#999",
  },
  tipo: {
    fontSize: 13,
    color: Colors.light.primary,
    marginBottom: 4,
  },
  ultimoMensaje: {
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
  badgeTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  vacio: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  textoVacio: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
})
