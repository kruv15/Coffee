import { Ionicons } from "@expo/vector-icons"
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from "react-native"
import { Colors } from "../../constants/Colors"
import React from "react"

interface BarraEntradaProps {
  valor: string
  onChangeTexto: (texto: string) => void
  onPresarEnviar: () => void
  onPresarAdjuntar: () => void
  deshabilitado?: boolean
  tieneArchivos?: boolean
  cargando?: boolean
}

export function BarraEntrada({
  valor,
  onChangeTexto,
  onPresarEnviar,
  onPresarAdjuntar,
  deshabilitado = false,
  tieneArchivos = false,
  cargando = false,
}: BarraEntradaProps) {
  const buttonDesabled = deshabilitado || cargando || (!valor.trim() && !tieneArchivos)

  return (
    <View style={styles.contenedor}>
      <TouchableOpacity
        style={[styles.botonAdjuntar, cargando && styles.botonDeshabilitado]}
        onPress={onPresarAdjuntar}
        disabled={cargando}
      >
        <Ionicons name="attach" size={20} color={Colors.light.primary} />
      </TouchableOpacity>

      <TextInput
        style={styles.entrada}
        placeholder="Escribe un mensaje..."
        value={valor}
        onChangeText={onChangeTexto}
        multiline
        maxLength={500}
        editable={!cargando}
      />

      <TouchableOpacity
        style={[styles.botonEnviar, buttonDesabled && styles.botonDeshabilitado]}
        onPress={onPresarEnviar}
        disabled={buttonDesabled}
      >
        <Ionicons
          name={tieneArchivos ? "cloud-upload" : "send"}
          size={24}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "android" ? 6 : 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
    gap: 6,
  },
  botonAdjuntar: {
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
  entrada: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  botonEnviar: {
    backgroundColor: Colors.light.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
})
