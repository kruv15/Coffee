import { Text, View, StyleSheet } from "react-native"
import React from "react"

interface EstadoConexionProps {
  conectado: boolean
  texto?: string
}

export function EstadoConexion({ conectado, texto }: EstadoConexionProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.punto,
          conectado ? styles.puntoConectado : styles.puntoDesconectado,
        ]}
      />
      <Text style={styles.texto}>
        {texto || (conectado ? "Conectado" : "Desconectado")}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  puntoConectado: {
    backgroundColor: "#4CAF50",
  },
  puntoDesconectado: {
    backgroundColor: "#f44336",
  },
  texto: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
  },
})
