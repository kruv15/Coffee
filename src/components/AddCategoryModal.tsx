"use client"

import React, { useState } from "react"
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { categoriaService } from "../services/categoriaService"

interface AddCategoryModalProps {
  visible: boolean
  onClose: () => void
  onCategoryCreated: (category: { _id: string; nombre: string }) => void
  adminToken: string
}

export function AddCategoryModal({ visible, onClose, onCategoryCreated, adminToken }: AddCategoryModalProps) {
  const [nombreCategoria, setNombreCategoria] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const validateForm = (): boolean => {
    if (!nombreCategoria.trim()) {
      setError("El nombre de la categoría es requerido")
      return false
    }

    if (nombreCategoria.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres")
      return false
    }

    if (nombreCategoria.trim().length > 50) {
      setError("El nombre no puede exceder 50 caracteres")
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    setError("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const resultado = await categoriaService.crearCategoria({ nombre: nombreCategoria.trim() }, adminToken)

      if (resultado.success && resultado.data) {
        Alert.alert("Éxito", "Categoría creada exitosamente")
        onCategoryCreated(resultado.data)
        handleClose()
      } else {
        setError(resultado.message || "Error al crear la categoría")
      }
    } catch (err) {
      console.error("Error creando categoría:", err)
      setError("Error de conexión. Por favor intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setNombreCategoria("")
    setError("")
    onClose()
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Nueva Categoría</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre de la Categoría</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  placeholder="Ej: Café Premium"
                  value={nombreCategoria}
                  onChangeText={(text) => {
                    setNombreCategoria(text)
                    setError("")
                  }}
                  editable={!loading}
                  maxLength={50}
                />
                {error && <Text style={styles.errorText}>{error}</Text>}
                <Text style={styles.characterCount}>{nombreCategoria.length}/50 caracteres</Text>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose} disabled={loading}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Crear</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modal: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "#333",
  },
  inputError: {
    borderColor: "#e74c3c",
    backgroundColor: "#fef5f5",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  characterCount: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
    textAlign: "right",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#795548",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
})
