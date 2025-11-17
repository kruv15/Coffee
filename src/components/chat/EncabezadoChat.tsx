import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Colors } from "../../constants/Colors"
import { EstadoConexion } from "./EstadoConexion"
import React from "react"

interface EncabezadoChatProps {
  titulo: string
  subtitulo?: string
  conectado: boolean
  onPresarAtras: () => void
  botonSecundario?: {
    icono: string
    onPresionar: () => void
  }
}

export function EncabezadoChat({
  titulo,
  subtitulo,
  conectado,
  onPresarAtras,
  botonSecundario,
}: EncabezadoChatProps) {
  return (
    <View style={styles.encabezado}>
      <TouchableOpacity onPress={onPresarAtras}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
        <EstadoConexion conectado={conectado} />
      </View>

      {botonSecundario && (
        <TouchableOpacity onPress={botonSecundario.onPresionar} style={styles.botonSecundario}>
          <Ionicons name={botonSecundario.icono as any} size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    padding: 16,
    gap: 12,
  },
  info: {
    flex: 1,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitulo: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 2,
  },
  botonSecundario: {
    padding: 4,
  },
})
