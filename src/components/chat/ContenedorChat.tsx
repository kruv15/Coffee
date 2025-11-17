import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native"
import React from "react"

interface ContenedorChatProps {
  children: React.ReactNode
}

export function ContenedorChat({ children }: ContenedorChatProps) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {children}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
