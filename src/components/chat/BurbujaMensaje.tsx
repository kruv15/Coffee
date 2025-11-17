import { Linking, Text, View, StyleSheet } from "react-native"
import type { Mensaje } from "../../types/chat"
import { VisorMultimedia } from "../VisorMultimedia"
import React from "react"

interface BurbujaMensajeProps {
  mensaje: Mensaje
  esPropio: boolean
}

export function BurbujaMensaje({ mensaje, esPropio }: BurbujaMensajeProps) {
  const linkStyle = esPropio ? styles.linkTextPropio : styles.linkTextOtro

  return (
    <View style={[styles.container, esPropio ? styles.contenedorPropio : styles.contenedorOtro]}>
      <View style={[styles.burbujaContenido, esPropio ? styles.burbujaPropia : styles.burbujaOtra]}>
        {mensaje.archivos && mensaje.archivos.length > 0 && (
          <VisorMultimedia archivos={mensaje.archivos} />
        )}

        {mensaje.contenido && (
          <Text style={[styles.texto, esPropio && styles.textoPropio]}>
            {mensaje.contenido.split(/(https?:\/\/[^\s]+)/g).map((parte, indice) =>
              parte.match(/^https?:\/\//) ? (
                <Text
                  key={indice}
                  style={linkStyle}
                  onPress={() => Linking.openURL(parte)}
                >
                  {parte}
                </Text>
              ) : (
                <Text key={indice}>{parte}</Text>
              )
            )}
          </Text>
        )}

        <Text style={[styles.hora, esPropio && styles.horaPropia]}>
          {new Date(mensaje.timestamp).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  contenedorPropio: {
    alignItems: "flex-end",
  },
  contenedorOtro: {
    alignItems: "flex-start",
  },
  burbujaContenido: {
    maxWidth: "75%",
    borderRadius: 16,
    padding: 12,
  },
  burbujaPropia: {
    backgroundColor: "#8B5E3C",
    borderBottomRightRadius: 4,
  },
  burbujaOtra: {
    backgroundColor: "#e0e0e0",
    borderBottomLeftRadius: 4,
  },
  texto: {
    fontSize: 16,
    color: "#333",
  },
  textoPropio: {
    color: "#fff",
  },
  hora: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  horaPropia: {
    color: "#fff",
    opacity: 0.8,
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
})
