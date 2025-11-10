"use client"

import { Ionicons } from "@expo/vector-icons"
import React, { useRef } from "react"
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import * as DocumentPicker from "expo-document-picker"
import * as ImagePicker from "expo-image-picker"
import { Colors } from "../constants/Colors"

interface SelectorArchivosProps {
  onArchivosSeleccionados: (archivos: File[]) => void
  deshabilitado?: boolean
}

export function SelectorArchivos({ onArchivosSeleccionados, deshabilitado = false }: SelectorArchivosProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const seleccionarImagenes = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: false,
        quality: 0.8,
      })

      if (!result.canceled) {
        const archivos: File[] = result.assets.map((asset) => {
          const fileName = asset.fileName || `imagen_${Date.now()}.jpg`
          return {
            uri: asset.uri,
            name: fileName,
            type: asset.type || "image/jpeg",
          } as any as File
        })

        onArchivosSeleccionados(archivos)
      }
    } catch (error) {
      console.error("[SelectorArchivos] Error seleccionando imágenes:", error)
      Alert.alert("Error", "No se pudieron seleccionar las imágenes")
    }
  }

  const seleccionarVideos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
      })

      if (!result.canceled) {
        const asset = result.assets[0]
        const fileName = asset.fileName || `video_${Date.now()}.mp4`

        const archivo = {
          uri: asset.uri,
          name: fileName,
          type: asset.type || "video/mp4",
        } as any as File

        onArchivosSeleccionados([archivo])
      }
    } catch (error) {
      console.error("[SelectorArchivos] Error seleccionando video:", error)
      Alert.alert("Error", "No se pudo seleccionar el video")
    }
  }

  const seleccionarArchivos = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "video/*"],
        copyToCacheDirectory: true,
        multiple: true,
      })

      if (result.assets && result.assets.length > 0) {
        const archivos: File[] = result.assets.map(
          (asset) =>
            ({
              uri: asset.uri,
              name: asset.name,
              type: asset.mimeType || "image/jpeg",
            }) as any as File,
        )

        onArchivosSeleccionados(archivos)
      }
    } catch (error) {
      console.error("[SelectorArchivos] Error seleccionando archivos:", error)
    }
  }

  return (
    <View style={styles.contenedor}>
      <TouchableOpacity
        style={[styles.boton, deshabilitado && styles.botonDeshabilitado]}
        onPress={seleccionarImagenes}
        disabled={deshabilitado}
      >
        <Ionicons name="image" size={20} color={deshabilitado ? "#ccc" : Colors.light.primary} />
        <Text style={[styles.textoBoton, deshabilitado && styles.textoDeshabilitado]}>Imagen</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.boton, deshabilitado && styles.botonDeshabilitado]}
        onPress={seleccionarVideos}
        disabled={deshabilitado}
      >
        <Ionicons name="videocam" size={20} color={deshabilitado ? "#ccc" : Colors.light.primary} />
        <Text style={[styles.textoBoton, deshabilitado && styles.textoDeshabilitado]}>Video</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.boton, deshabilitado && styles.botonDeshabilitado]}
        onPress={seleccionarArchivos}
        disabled={deshabilitado}
      >
        <Ionicons name="folder" size={20} color={deshabilitado ? "#ccc" : Colors.light.primary} />
        <Text style={[styles.textoBoton, deshabilitado && styles.textoDeshabilitado]}>Archivo</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  boton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  botonDeshabilitado: {
    borderColor: "#ccc",
    opacity: 0.5,
  },
  textoBoton: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  textoDeshabilitado: {
    color: "#ccc",
  },
})
