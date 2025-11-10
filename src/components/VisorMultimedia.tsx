"use client"

import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import { Image, Modal, StyleSheet, TouchableOpacity, View } from "react-native"
import { Video } from "expo-av"
import type { Archivo } from "../types/chat"

interface VisorMultimediaProps {
  archivos: Archivo[]
}

export function VisorMultimedia({ archivos }: VisorMultimediaProps) {
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null)
  const [videoAmpliado, setVideoAmpliado] = useState<string | null>(null)

  if (!archivos || archivos.length === 0) return null

  const renderizarArchivo = (archivo: Archivo, indice: number) => {
    if (archivo.tipo === "imagen") {
      return (
        <TouchableOpacity key={indice} onPress={() => setImagenAmpliada(archivo.urlCloudinary)}>
          <Image source={{ uri: archivo.urlCloudinary }} style={styles.imagen} />
        </TouchableOpacity>
      )
    }

    if (archivo.tipo === "video") {
      return (
        <TouchableOpacity
          key={indice}
          style={styles.contenedorVideo}
          onPress={() => setVideoAmpliado(archivo.urlCloudinary)}
        >
          <Video source={{ uri: archivo.urlCloudinary }} style={styles.video} useNativeControls isLooping />
          <View style={styles.overlayPlay}>
            <Ionicons name="play-circle" size={48} color="#fff" />
          </View>
        </TouchableOpacity>
      )
    }

    return null
  }

  return (
    <>
      <View style={styles.contenedorArchivos}>
        {archivos.map((archivo, index) => renderizarArchivo(archivo, index))}
      </View>

      {/* Modal para imagen ampliada */}
      <Modal visible={!!imagenAmpliada} transparent animationType="fade" onRequestClose={() => setImagenAmpliada(null)}>
        <View style={styles.modalContenedor}>
          <TouchableOpacity style={styles.fondoModal} onPress={() => setImagenAmpliada(null)}>
            {imagenAmpliada && (
              <Image source={{ uri: imagenAmpliada }} style={styles.imagenAmpliada} onError={() => {}} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonCerrar} onPress={() => setImagenAmpliada(null)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal para video ampliado */}
      <Modal visible={!!videoAmpliado} transparent animationType="fade" onRequestClose={() => setVideoAmpliado(null)}>
        <View style={styles.modalContenedor}>
          <TouchableOpacity style={styles.fondoModal} onPress={() => setVideoAmpliado(null)}>
            {videoAmpliado && (
              <Video
                source={{ uri: videoAmpliado }}
                style={styles.videoAmpliado}
                useNativeControls
                isLooping
                onError={() => {}}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.botonCerrar} onPress={() => setVideoAmpliado(null)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  contenedorArchivos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  imagen: {
    width: 150,
    height: 150,
    borderRadius: 8,
    resizeMode: "cover",
  },
  contenedorVideo: {
    position: "relative",
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  video: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  videoAmpliado: {
    width: "100%",
    height: "100%",
  },
  overlayPlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
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
