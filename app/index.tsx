import { Ionicons } from "@expo/vector-icons"
import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { AuthProvider } from "../src/context/AuthContext"

import { LoginModal } from "../src/components/LoginModal"
import { RegisterModal } from "../src/components/RegisterModal"
import { UserProfileModal } from "../src/components/UserProfileModal"
import { Colors } from "../src/constants/Colors"
import { useAuth } from "../src/context/AuthContext"

export default function App() {
  return (
    <AuthProvider>
      <HomeScreen />
    </AuthProvider>
  )
}

function HomeScreen() {
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
  useEffect(() => {
    if (!state.isAuthenticated && userProfileVisible) {
      console.log("🔄 User logged out - closing profile modal")
      setUserProfileVisible(false)
    }
  }, [state.isAuthenticated, userProfileVisible])

  // Efecto para debug y forzar actualización visual
  useEffect(() => {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={handleUserIconPress}>
          <Ionicons name="person-circle-outline" size={32} color={Colors.light.text} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Inicio</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.adminButton}>
            <Ionicons name="settings-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.light.icon} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto..."
          placeholderTextColor={Colors.light.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={Colors.light.icon} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      ) : (
        <FlatList
          data={[]} // Aquí puedes colocar tu lista de productos
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={Colors.light.icon} />
              <Text style={styles.emptyText}>No hay productos disponibles</Text>
              <TouchableOpacity style={styles.retryButton} onPress={forceRefresh}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>${item.price}</Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Modales */}
      <LoginModal
        visible={loginVisible}
        onClose={handleCloseAuth}
        onNavigateToRegister={handleNavigateToRegister}
      />
      <RegisterModal
        visible={registerVisible}
        onClose={handleCloseAuth}
        onNavigateToLogin={handleNavigateToLogin}
      />
      <UserProfileModal visible={userProfileVisible} onClose={() => setUserProfileVisible(false)} />
    </View>
  )
}

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
})
