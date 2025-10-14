"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"

import { LoginModal } from "../src/components/LoginModal"

import { RegisterModal } from "../src/components/RegisterModal"
import { UserProfileModal } from "../src/components/UserProfileModal"
import { Colors } from "../src/constants/Colors"
import { useAuth } from "../src/context/AuthContext"




export default function HomeScreen() {
  const { state, forceRefresh } = useAuth()
 
  const [cartVisible, setCartVisible] = useState<boolean>(false)
  const [loginVisible, setLoginVisible] = useState<boolean>(false)
  const [registerVisible, setRegisterVisible] = useState<boolean>(false)
  const [userProfileVisible, setUserProfileVisible] = useState<boolean>(false)

  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")

  

  const handleNavigateToRegister = () => {
    setLoginVisible(false)
    setRegisterVisible(true)
  }

  const handleNavigateToLogin = () => {
    setRegisterVisible(false)
    setLoginVisible(true)
  }

  const handleCloseAuth = () => {
    setLoginVisible(false)
    setRegisterVisible(false)
  }

  

  const handleUserIconPress = () => {
    if (state.isAuthenticated) {
      setUserProfileVisible(true)
    } else {
      setLoginVisible(true)
    }
  }

  // Cerrar modal de perfil automáticamente si el usuario se desloguea
  React.useEffect(() => {
    if (!state.isAuthenticated && userProfileVisible) {
      console.log("🔄 User logged out - closing profile modal")
      setUserProfileVisible(false)
    }
  }, [state.isAuthenticated, userProfileVisible])

  // Efecto para debug y forzar actualización visual
  React.useEffect(() => {
    console.log("🔍 Auth state changed:", {
      isAuthenticated: state.isAuthenticated,
      user: state.user?.email || "none",
      timestamp: new Date().toISOString(),
    })

    // Si no está autenticado, asegurar que todos los modals estén cerrados
    if (!state.isAuthenticated) {
      setUserProfileVisible(false)
    }
  }, [state.isAuthenticated, state.user])


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  socialMediaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  socialButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  adminButton: {
    backgroundColor: "#795548",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  cartContainer: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.light.accent,
    borderRadius: 8,
    paddingHorizontal: 5,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  listContainer: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  image: {
    width: 90,
    height: 90,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
  },
  price: {
    fontSize: 16,
    color: Colors.light.primary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  clearButton: {
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: Colors.light.icon,
  },
  stock: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  refreshButton: {
    padding: 4,
  },
  category: {
    fontSize: 12,
    color: Colors.light.primary,
    marginTop: 2,
    fontStyle: "italic",
  },
  outOfStock: {
    color: Colors.light.error,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.icon,
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
}
