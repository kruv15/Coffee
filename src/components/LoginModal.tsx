"use client"

import { Ionicons } from "@expo/vector-icons"
import React, { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useAuth } from "../context/AuthContext"

interface LoginModalProps {
  visible: boolean
  onClose: () => void
  onNavigateToRegister: () => void
}

export function LoginModal({ visible, onClose, onNavigateToRegister }: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { loginWithApi, loginAsAdmin } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor, completa todos los campos.")
      return
    }

    setLoading(true)

    try {
      const trimmedEmail = email.trim().toLowerCase()

      // Mantener el login hardcodeado de admin como fallback
      if (trimmedEmail === "admin@gmail.com" && password === "admin123") {
        await loginAsAdmin()
        resetFields()
        onClose()
        Alert.alert("Éxito", "Bienvenido Administrador (Hardcoded)")
        return
      }

      // Intentar login con API
      const success = await loginWithApi(email, password)

      if (success) {
        resetFields()
        onClose()

        // Obtener el estado actualizado del contexto para mostrar mensaje apropiado
        // Nota: Esto se ejecutará después de que el contexto se actualice
        setTimeout(() => {
          // El contexto debería estar actualizado ahora
        }, 100)
        Alert.alert("Éxito", "Has iniciado sesión correctamente.")
      } else {
        Alert.alert("Error", "Correo o contraseña incorrectos.")
      }
    } catch (error) {
      console.error("Error en login:", error)
      Alert.alert("Error", "Error de conexión. Verifica tu internet.")
    } finally {
      setLoading(false)
    }
  }

  const resetFields = () => {
    setEmail("")
    setPassword("")
  }

  const handleClose = () => {
    resetFields()
    onClose()
  }

  const handleNavigateToRegister = () => {
    resetFields()
    onNavigateToRegister()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={28} color="#222" />
              </TouchableOpacity>
              <Text style={styles.title}>Iniciar Sesión.</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  textContentType="password"
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>{loading ? "Iniciando sesión..." : "Iniciar Sesión"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.registerLink} onPress={handleNavigateToRegister} disabled={loading}>
                <Text style={styles.registerLinkText}>¿No tienes cuenta? Regístrate aquí</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    minHeight: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  formContainer: {
    flexGrow: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
    minHeight: 48,
    color: "#333",
  },
  loginButton: {
    backgroundColor: "#795548",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: "#bbb",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  registerLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  registerLinkText: {
    color: "#795548",
    fontSize: 14,
    textDecorationLine: "underline",
  },
})
