"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { CartModal } from "../src/components/CartModal"
import { LoginModal } from "../src/components/LoginModal"
import { ProductDetailModal } from "../src/components/ProductDetailModal"
import { RegisterModal } from "../src/components/RegisterModal"
import { UserProfileModal } from "../src/components/UserProfileModal"
import { Colors } from "../src/constants/Colors"
import { useAuth } from "../src/context/AuthContext"
import { socialMediaService } from "../src/services/socialMediaService"
import type { CartItem, Product } from "../src/types"
import { ENV } from "../src/config/env"

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false)
  const categoryScrollRef = useRef<FlatList>(null)
  const [categories, setCategories] = useState<{ value: string; label: string; id: string }[]>([])
  const [loadingCategories, setLoadingCategories] = useState<boolean>(false)

  const loadCategoriesFromAPI = async () => {
    setLoadingCategories(true)

    try {
      const response = await fetch(`${ENV.API_BASE_URL}/categorias`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.log("Error al cargar categorías:", response.status)
        return
      }

      const data = await response.json()

      let categoryArray = []

      if (data?.data && Array.isArray(data.data)) {
        categoryArray = data.data
      } else if (Array.isArray(data)) {
        categoryArray = data
      } else {
        console.log("Estructura de categorías desconocida:", data)
        return
      }

      const formatted = categoryArray.map((c: any) => ({
        value: c._id,
        label: c.nombre,
        id: c._id,
      }))

      setCategories(formatted)
    } catch (error) {
      console.log("Error de conexión cargando categorías:", error)
    } finally {
      setLoadingCategories(false)
    }
  }

  useEffect(() => {
    loadCategoriesFromAPI()
  }, [])

  // Function to load ALL products from database
  const loadProductsFromAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/productos`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()

        // Extraer productos de la estructura correcta según las imágenes
        let productsArray = []

        if (data && data.data && data.data.productos && Array.isArray(data.data.productos)) {
          productsArray = data.data.productos
        } else if (data && data.productos && Array.isArray(data.productos)) {
          productsArray = data.productos
        } else if (Array.isArray(data)) {
          productsArray = data
        } else {
          console.log("No products array found in response structure")
          console.log("Available keys:", Object.keys(data || {}))
        }

        console.log("Products array to process:", productsArray)

        if (Array.isArray(productsArray) && productsArray.length > 0) {
          const formattedProducts: Product[] = productsArray.map((product: any, index: number) => {
            console.log(`Processing product ${index + 1}:`, product)

            const precioProd =
              product.tamanos && product.tamanos.length > 0
                ? Number(product.tamanos[0].precio)
                : Number(product.precioProd || product.precio || product.price || 0)

            const formattedProduct = {
              _id: product._id || product.id || `product_${Date.now()}_${index}`,
              nomProd: product.nomProd || product.nombre || product.name || "Producto sin nombre",
              precioProd: precioProd,
              imagen: product.imagen || product.image || "https://via.placeholder.com/300x200?text=Sin+Imagen",
              descripcionProd: product.descripcionProd || product.descripcion || product.description || "",
              stock: Number(product.stock || 0),
              categoria: product.categoria || product.category || "cafe",
              tamanos: Array.isArray(product.tamanos) ? product.tamanos : [],
            }
            return formattedProduct
          })
          setProducts(formattedProducts)

          // Force re-render
          setTimeout(() => {
            console.log("Products state after setting:", formattedProducts.length)
          }, 100)
        } else {
          setProducts([])
        }
      } else {
        console.log(`Home: API failed with status ${response.status}`)
        const errorText = await response.text()
        console.log("Home Error response:", errorText)
        setProducts([])
      }
    } catch (error) {
      console.error("Home: Error loading products:", error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProductsFromAPI()
  }, [])

  // Recargar productos cuando se cree un nuevo producto (si es admin)
  useEffect(() => {
    if (state.isAuthenticated && state.user?.rol === "admin") {
      loadProductsFromAPI()
    }
  }, [state.isAuthenticated, state.user?.rol])

  // Agregar este useEffect después de los existentes para monitorear cambios en el estado de autenticación
  React.useEffect(() => {
    console.log("Auth state changed in HomeScreen:", {
      isAuthenticated: state.isAuthenticated,
      userEmail: state.user?.emailUsr || "none",
      userRole: state.user?.rol || "none",
      timestamp: new Date().toISOString(),
    })

    if (state.isAuthenticated && state.user) {
      console.log("Current user details:", {
        _id: state.user._id,
        emailUsr: state.user.emailUsr,
        nombreUsr: state.user.nombreUsr,
        rol: state.user.rol,
        isAdmin: state.user.rol === "admin",
      })
    }
  }, [state.isAuthenticated, state.user])

  const handleAddToCart = (item: CartItem) => {
    setCart((prev: CartItem[]) => {
      const idx = prev.findIndex((p: CartItem) => p._id === item._id && p.tamano === item.tamano)
      if (idx !== -1) {
        const updated = [...prev]
        const currentQty = updated[idx].cantidad
        const newQty = currentQty + item.cantidad
        const maxStock = updated[idx].stock

        if (newQty > maxStock) {
          updated[idx] = { ...updated[idx], cantidad: maxStock }
          return updated
        }

        updated[idx] = { ...updated[idx], cantidad: newQty }
        return updated
      }
      return [...prev, item]
    })
  }

  const handleUpdateQuantity = (item: CartItem, newQty: number) => {
    setCart((prev: CartItem[]) =>
      prev
        .map((p: CartItem) => (p._id === item._id && p.tamano === item.tamano ? { ...p, cantidad: newQty } : p))
        .filter((p) => p.cantidad > 0),
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

  const handleGoToChat = () => {
    router.push("/chat")
  }

  const handleGoToOrders = () => {
    router.push("/orders")
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
      setUserProfileVisible(false)
    }
  }, [state.isAuthenticated, userProfileVisible])

  // Efecto para debug y forzar actualización visual
  useEffect(() => {
    console.log("Auth state changed:", {
      isAuthenticated: state.isAuthenticated,
      user: state.user?.emailUsr || "none",
      timestamp: new Date().toISOString(),
    })

    // Si no está autenticado, asegurar que todos los modals estén cerrados
    if (!state.isAuthenticated) {
      setUserProfileVisible(false)
    }
  }, [state.isAuthenticated, state.user])

  const filteredProducts = products
    .filter((product) => (product.stock ?? 0) > 0)
    .filter((product) => {
      const matchesSearch =
        product.nomProd.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.descripcionProd && product.descripcionProd.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory =
        !selectedCategory ||
        (typeof product.categoria === "object" && product.categoria?._id === selectedCategory) ||
        (typeof product.categoria === "string" && product.categoria === selectedCategory)

      return matchesSearch && matchesCategory
    })

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity onPress={() => setSelectedProduct(item)} style={styles.card}>
      <Image
        source={{ uri: item.imagen }}
        style={styles.image}
        onError={(e) => {
          console.log("Image load error for product:", item.nomProd, e.nativeEvent.error)
        }}
      />
      <View style={styles.info}>
        <Text style={styles.name}>
          {item.nomProd}{item.tamanos && item.tamanos.length > 0 ? ` (${item.tamanos[0].nombre})` : ""}
        </Text>
        <Text style={styles.price}>Bs{item.precioProd}</Text>
        {item.stock !== undefined && item.stock >= 0 && (
          <Text style={[styles.stock, item.stock === 0 && styles.outOfStock]}>
            {item.stock === 0 ? "Sin stock" : `Stock: ${item.stock}`}
          </Text>
        )}
        {item.categoria && (
          <Text style={styles.category}>
            {typeof item.categoria === "string" ? item.categoria : (item.categoria as any).nombre || "Café"}
          </Text>
        )}
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
        <Text style={styles.title}>COFFEE</Text>
        {/* Iconos de redes sociales */}
        <View style={styles.socialMediaContainer}>
          <TouchableOpacity onPress={() => socialMediaService.openTikTok()} style={styles.socialButton}>
            <Ionicons name="logo-tiktok" size={20} color="#ff0050" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => socialMediaService.openInstagram()} style={styles.socialButton}>
            <Ionicons name="logo-instagram" size={20} color="#E4405F" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.headerRight}>
        {state.isAuthenticated && state.user?.rol !== "admin" && (
          <TouchableOpacity onPress={handleGoToOrders} style={styles.ordersButton}>
            <Ionicons name="receipt-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        {state.isAuthenticated && state.user?.rol !== "admin" && (
          <TouchableOpacity onPress={handleGoToChat} style={styles.chatButton}>
            <Ionicons name="chatbubbles" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        {state.isAuthenticated && state.user?.rol === "admin" && (
          <TouchableOpacity onPress={handleGoToAdmin} style={styles.adminButton}>
            <Ionicons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setCartVisible(true)} style={styles.cartContainer}>
          <Ionicons name="cart-outline" size={32} color={Colors.light.primary} />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cart.reduce((sum: number, item: CartItem) => sum + item.cantidad, 0)}
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

  const renderCategoryFilter = () => (
    <View style={styles.categoryFilterWrapper}>
      {/* Botón Dropdown para ver todas las categorías */}
      <TouchableOpacity style={styles.categoryDropdownButton} onPress={() => setCategoryModalVisible(true)}>
        <Ionicons name="filter" size={18} color="#fff" />
        <Text style={styles.categoryDropdownButtonText}>Filtros</Text>
        <Ionicons name="chevron-down" size={18} color="#fff" />
      </TouchableOpacity>

      {/* Carrusel horizontal de categorías */}
      <FlatList
        ref={categoryScrollRef}
        data={[{ value: null, label: "Todos", id: null }, ...categories]}
        keyExtractor={(item) => item.value || "todos"}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryFilterButton, selectedCategory === item.value && styles.categoryFilterButtonActive]}
            onPress={() => setSelectedCategory(item.value)}
          >
            <Text
              style={[
                styles.categoryFilterButtonText,
                selectedCategory === item.value && styles.categoryFilterButtonTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        snapToInterval={120}
        decelerationRate="fast"
        contentContainerStyle={styles.categoryScrollContent}
        style={styles.categoryScroll}
      />
    </View>
  )

  const renderCategoryModal = () => (
    <Modal
      visible={categoryModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setCategoryModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.categoryModalContent}>
          <View style={styles.categoryModalHeader}>
            <Text style={styles.categoryModalTitle}>Selecciona una Categoría</Text>
            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
              <Ionicons name="close" size={28} color="#222" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.categoryModalList}>
            {/* Opción Todos */}
            <TouchableOpacity
              style={[styles.categoryModalItem, selectedCategory === null && styles.categoryModalItemActive]}
              onPress={() => {
                setSelectedCategory(null)
                setCategoryModalVisible(false)
              }}
            >
              <View style={styles.categoryModalItemContent}>
                <Ionicons
                  name={selectedCategory === null ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={selectedCategory === null ? Colors.light.primary : "#ccc"}
                />
                <Text
                  style={[
                    styles.categoryModalItemText,
                    selectedCategory === null && styles.categoryModalItemTextActive,
                  ]}
                >
                  Todos
                </Text>
              </View>
            </TouchableOpacity>

            {/* Opciones de categorías */}
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryModalItem,
                  selectedCategory === category.value && styles.categoryModalItemActive,
                ]}
                onPress={() => {
                  setSelectedCategory(category.value)
                  setCategoryModalVisible(false)
                }}
              >
                <View style={styles.categoryModalItemContent}>
                  <Ionicons
                    name={selectedCategory === category.value ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={selectedCategory === category.value ? Colors.light.primary : "#ccc"}
                  />
                  <Text
                    style={[
                      styles.categoryModalItemText,
                      selectedCategory === category.value && styles.categoryModalItemTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </View>
                {selectedCategory === category.value && (
                  <View style={styles.categoryModalItemCheckmark}>
                    <Ionicons name="checkmark" size={18} color={Colors.light.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.categoryModalCloseButton} onPress={() => setCategoryModalVisible(false)}>
            <Text style={styles.categoryModalCloseButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  const renderProductStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsText}>
        {loading ? "Cargando..." : `${filteredProducts.length} Productos Disponibles`}
      </Text>
      {!loading && (
        <TouchableOpacity onPress={loadProductsFromAPI} style={styles.refreshButton}>
          <Ionicons name="refresh" size={16} color={Colors.light.primary} />
        </TouchableOpacity>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
      {renderCategoryFilter()}
      {renderCategoryModal()}
      {renderProductStats()}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item: Product) => item._id}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadProductsFromAPI}
        keyboardShouldPersistTaps="handled"
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

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      )}

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
        onRemoveItem={(item) => setCart((prev) => prev.filter((i) => i._id !== item._id || i.tamano !== item.tamano))}
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  chatButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
  socialMediaContainer: {
    flexDirection: "row",
    gap: 8,
  },
  socialButton: {
    padding: 4,
  },
  cartContainer: {
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#f44336",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  stock: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  outOfStock: {
    color: "#f44336",
  },
  category: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    fontStyle: "italic",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  statsText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  refreshButton: {
    padding: 4,
  },
  categoryFilterWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  categoryDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    justifyContent: "center",
  },
  categoryDropdownButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  categoryScroll: {
    flex: 1,
  },
  categoryScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  categoryFilterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 4,
  },
  categoryFilterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryFilterButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  categoryFilterButtonTextActive: {
    color: "#fff",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  categoryModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  categoryModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  categoryModalList: {
    maxHeight: "70%",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  categoryModalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
  },
  categoryModalItemActive: {
    backgroundColor: "#f0f8ff",
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  categoryModalItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  categoryModalItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  categoryModalItemTextActive: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  categoryModalItemCheckmark: {
    marginLeft: 8,
  },
  categoryModalCloseButton: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    alignItems: "center",
  },
  categoryModalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  ordersButton: {
    backgroundColor: "#8B6F47",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
})
