"use client"

import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import { FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Colors } from "../constants/Colors"

interface ArchivoPrevisualizado {
  uri: string
  nombre: string
  tipo: "imagen" | "video"
  tamaño?: number
}

interface PrevisualizadorArchivosProps {
  archivos: ArchivoPrevisualizado[]
  onRemover: (indice: number) => void
  onEnviar: () => void
  enviando?: boolean
}

export function PrevisualizadorArchivos({
  archivos,
  onRemover,
  onEnviar,
  enviando = false,
}: PrevisualizadorArchivosProps) {
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null)

  if (archivos.length === 0) return null

  const formatearTamaño = (bytes?: number): string => {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const renderizarArchivo = ({ item, index }: { item: ArchivoPrevisualizado; index: number }) => (
    <View style={styles.itemArchivo}>
      {item.tipo === "imagen" ? (
        <TouchableOpacity onPress={() => setImagenAmpliada(item.uri)}>
          <Image source={{ uri: item.uri }} style={styles.miniaturaImagen} />
        </TouchableOpacity>
      ) : (
        <View style={styles.previsualizadorVideo}>
          <Ionicons name="videocam" size={32} color={Colors.light.primary} />
        </View>
      )}

      <View style={styles.infoArchivo}>
        <Text style={styles.nombreArchivo} numberOfLines={2}>
          {item.nombre}
        </Text>
        {item.tamaño && <Text style={styles.tamaño}>{formatearTamaño(item.tamaño)}</Text>}
      </View>

      <TouchableOpacity style={styles.botonRemover} onPress={() => onRemover(index)}>
        <Ionicons name="close-circle" size={24} color="#f44336" />
      </TouchableOpacity>
    </View>
  )

  return (
    <>
      <View style={styles.contenedor}>
        <View style={styles.encabezado}>
          <Ionicons name="attach" size={18} color={Colors.light.primary} />
          <Text style={styles.textoEncabezado}>{archivos.length} archivo(s) seleccionado(s)</Text>
        </View>

        <FlatList
          data={archivos}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderizarArchivo}
          scrollEnabled={false}
        />
      </View>

      <Modal visible={!!imagenAmpliada} transparent animationType="fade" onRequestClose={() => setImagenAmpliada(null)}>
        <View style={styles.modalContenedor}>
          <TouchableOpacity style={styles.fondoModal} onPress={() => setImagenAmpliada(null)}>
            {imagenAmpliada && <Image source={{ uri: imagenAmpliada }} style={styles.imagenAmpliada} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonCerrar} onPress={() => setImagenAmpliada(null)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    backgroundColor: "#f5f5f5",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    padding: 12,
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  textoEncabezado: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  itemArchivo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  miniaturaImagen: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 8,
  },
  previsualizadorVideo: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  infoArchivo: {
    flex: 1,
  },
  nombreArchivo: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  tamaño: {
    fontSize: 11,
    color: "#999",
  },
  botonRemover: {
    padding: 4,
  },
  botonEnviar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  botonEnviando: {
    opacity: 0.6,
  },
  textoBotonEnviar: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  textoEnviando: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalContenedor: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fondoModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagenAmpliada: {
    width: "90%",
    height: "80%",
    resizeMode: "contain",
  },
  botonCerrar: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
})
