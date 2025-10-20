"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { CartModal } from "../src/components/CartModal"
import { LoginModal } from "../src/components/LoginModal"
import { ProductDetailModal } from "../src/components/ProductDetailModal"
import { RegisterModal } from "../src/components/RegisterModal"
import { UserProfileModal } from "../src/components/UserProfileModal"
import { Colors } from "../src/constants/Colors"
import { useAuth } from "../src/context/AuthContext"
import { socialMediaService } from "../src/services/socialMediaService"
import type { CartItem, Product } from "../src/types"
import { debugAPI } from "../src/utils/testApi"

export default function HomeScreen() {
  const { state, forceRefresh } = useAuth()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartVisible, setCartVisible] = useState<boolean>(false)
  const [loginVisible, setLoginVisible] = useState<boolean>(false)
  const [registerVisible, setRegisterVisible] = useState<boolean>(false)
  const [userProfileVisible, setUserProfileVisible] = useState<boolean>(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Function to load ALL products from database
  const loadProductsFromAPI = async () => {
    setLoading(true)
    try {
      console.log("🔄 Home: Loading ALL products from database...")

      const response = await fetch("https://prueba-b5a7.onrender.com/api/productos", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      console.log("📡 Home API Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📦 Home API response raw data:", JSON.stringify(data, null, 2))

        // Extraer productos de la estructura correcta según las imágenes
        let productsArray = []

        if (data && data.data && data.data.productos && Array.isArray(data.data.productos)) {
          productsArray = data.data.productos
          console.log("✅ Found products in data.data.productos:", productsArray.length)
        } else if (data && data.productos && Array.isArray(data.productos)) {
          productsArray = data.productos
          console.log("✅ Found products in data.productos:", productsArray.length)
        } else if (Array.isArray(data)) {
          productsArray = data
          console.log("✅ Found products as direct array:", productsArray.length)
        } else {
          console.log("❌ No products array found in response structure")
          console.log("📦 Available keys:", Object.keys(data || {}))
        }

        console.log("📋 Products array to process:", productsArray)

        if (Array.isArray(productsArray) && productsArray.length > 0) {
          const formattedProducts: Product[] = productsArray.map((product: any, index: number) => {
            console.log(`🔄 Processing product ${index + 1}:`, product)

            const formattedProduct = {
              id: product._id || product.id || `product_${Date.now()}_${index}`,
              name: product.nomProd || product.nombre || product.name || "Producto sin nombre",
              price: Number(product.precioProd || product.precio || product.price || 0),
              image: product.imagen || product.image || "https://via.placeholder.com/300x200?text=Sin+Imagen",
              description: product.descripcionProd || product.descripcion || product.description || "",
              stock: Number(product.stock || 0),
              category: product.categoria || product.category || "cafe",
            }

            console.log(`✅ Formatted product ${index + 1}:`, formattedProduct)
            return formattedProduct
          })

          console.log("✅ Home: Products loaded successfully:", formattedProducts.length)
          console.log("📊 All formatted products:", formattedProducts)
          setProducts(formattedProducts)

          // Force re-render
          setTimeout(() => {
            console.log("🔄 Products state after setting:", formattedProducts.length)
          }, 100)
        } else {
          console.log("⚠️ Home: No products found or invalid array structure")
          console.log("📦 Received data structure:", typeof data, data)
          setProducts([])
        }
      } else {
        console.log(`❌ Home: API failed with status ${response.status}`)
        const errorText = await response.text()
        console.log("❌ Home Error response:", errorText)
        setProducts([])
      }
    } catch (error) {
      console.error("❌ Home: Error loading products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar productos al montar el componente
  useEffect(() => {
    debugAPI() // Para debug
    loadProductsFromAPI()
  }, [])

  // Recargar productos cuando se cree un nuevo producto (si es admin)
  useEffect(() => {
    if (state.isAuthenticated && state.user?.role === "admin") {
      console.log("🔑 Admin logged in - reloading products")
      loadProductsFromAPI()
    }
  }, [state.isAuthenticated, state.user?.role])

  // Agregar este useEffect después de los existentes para monitorear cambios en el estado de autenticación
  React.useEffect(() => {
    console.log("🔍 Auth state changed in HomeScreen:", {
      isAuthenticated: state.isAuthenticated,
      userEmail: state.user?.email || "none",
      userRole: state.user?.role || "none",
      timestamp: new Date().toISOString(),
    })

    if (state.isAuthenticated && state.user) {
      console.log("👤 Current user details:", {
        id: state.user.id,
        email: state.user.email,
        name: state.user.name,
        role: state.user.role,
        isAdmin: state.user.role === "admin",
      })
    }
  }, [state.isAuthenticated, state.user])

  const handleAddToCart = (item: CartItem) => {
    setCart((prev: CartItem[]) => {
      const idx = prev.findIndex((p: CartItem) => p.id === item.id && p.pack === item.pack)
      if (idx !== -1) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity }
        return updated
      }
      return [...prev, item]
    })
  }

  const handleUpdateQuantity = (item: CartItem, newQty: number) => {
    setCart((prev: CartItem[]) =>
      prev
        .map((p: CartItem) => (p.id === item.id && p.pack === item.pack ? { ...p, quantity: newQty } : p))
        .filter((p) => p.quantity > 0),
    )
  }

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

  const handleGoToAdmin = () => {
    router.push("/admin")
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

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity onPress={() => setSelectedProduct(item)} style={styles.card}>
      <Image
        source={{ uri: item.image }}
        style={styles.image}
        onError={(e) => {
          console.log("❌ Image load error for product:", item.name, e.nativeEvent.error)
        }}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>Bs{item.price}</Text>
        {item.stock !== undefined && item.stock >= 0 && (
          <Text style={[styles.stock, item.stock === 0 && styles.outOfStock]}>
            {item.stock === 0 ? "Sin stock" : `Stock: ${item.stock}`}
          </Text>
        )}
        {item.category && <Text style={styles.category}>{item.category}</Text>}
      </View>
    </TouchableOpacity>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleUserIconPress} style={styles.iconButton}>
        <Ionicons
          name={state.isAuthenticated ? "person-circle" : "person-circle-outline"}
          size={32}
          color={Colors.light.primary}
        />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Amber Infusion</Text>
        {/* Iconos de redes sociales */}
        <View style={styles.socialMediaContainer}>
          <TouchableOpacity
            onPress={() => socialMediaService.openTikTok()}
            style={styles.socialButton}
          >
            <Ionicons name="logo-tiktok" size={20} color="#ff0050" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => socialMediaService.openInstagram()}
            style={styles.socialButton}
          >
            <Ionicons name="logo-instagram" size={20} color="#E4405F" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.headerRight}>
        {state.isAuthenticated && state.user?.role === "admin" && (
          <TouchableOpacity onPress={handleGoToAdmin} style={styles.adminButton}>
            <Ionicons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setCartVisible(true)} style={styles.cartContainer}>
          <Ionicons name="cart-outline" size={32} color={Colors.light.primary} />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={Colors.light.icon} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar productos..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={Colors.light.icon}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color={Colors.light.icon} />
        </TouchableOpacity>
      )}
    </View>
  )

  const renderProductStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsText}>{loading ? "Cargando..." : `${products.length} productos encontrados`}</Text>
      {!loading && (
        <TouchableOpacity onPress={loadProductsFromAPI} style={styles.refreshButton}>
          <Ionicons name="refresh" size={16} color={Colors.light.primary} />
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item: Product) => item.id}
        renderItem={renderProductItem}
        ListHeaderComponent={() => (
          <>
            {renderHeader()}
            {renderSearchBar()}
            {renderProductStats()}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.primary} />
                <Text style={styles.loadingText}>Cargando productos desde la base de datos...</Text>
              </View>
            )}
          </>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadProductsFromAPI}
        ListEmptyComponent={() =>
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe" size={64} color={Colors.light.icon} />
              <Text style={styles.emptyText}>No se encontraron productos</Text>
              <TouchableOpacity onPress={loadProductsFromAPI} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Intentar nuevamente</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      <ProductDetailModal
        visible={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartModal
        visible={cartVisible}
        cart={cart}
        onClose={() => setCartVisible(false)}
        onUpdateQuantity={handleUpdateQuantity}
      />

      <LoginModal visible={loginVisible} onClose={handleCloseAuth} onNavigateToRegister={handleNavigateToRegister} />

      <RegisterModal visible={registerVisible} onClose={handleCloseAuth} onNavigateToLogin={handleNavigateToLogin} />

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
})
