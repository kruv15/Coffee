"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { AddProductModal } from "../src/components/AddProductModal"
import { useAuth } from "../src/context/AuthContext"
import { productService } from "../src/services/api"
import type { Product } from "../src/types"
import { ENV } from "../src/config/env"

export default function AdminScreen() {
  const { state } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [dropdownVisible, setDropdownVisible] = useState(false)

  // Cargar productos desde la API
  const loadProducts = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    
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
        // Extraer productos de la estructura correcta según las imágenes del debug
        let productsArray = []

        if (data && data.data && data.data.productos && Array.isArray(data.data.productos)) {
          productsArray = data.data.productos
        } else if (data && data.productos && Array.isArray(data.productos)) {
          productsArray = data.productos
        } else if (Array.isArray(data)) {
          productsArray = data
        } else {
          setProducts([])
          return
        }

        if (Array.isArray(productsArray) && productsArray.length > 0) {
          const formattedProducts: Product[] = productsArray.map((product: any, index: number) => {
            const formattedProduct = {
              id: product._id || product.id || `temp_${Date.now()}_${index}`,
              name: product.nomProd || product.nombre || product.name || "Producto sin nombre",
              price: Number(product.precioProd || product.precio || product.price || 0),
              image: product.imagen || product.image || "https://via.placeholder.com/300x200?text=Sin+Imagen",
              description: product.descripcionProd || product.descripcion || product.description || "",
              stock: Number(product.stock || 0),
              category: product.categoria || product.category || "cafe",
            }
            return formattedProduct
          })

          setProducts(formattedProducts)
        } else {
          setProducts([])
        }
      } else {
        const errorText = await response.text()
        Alert.alert("Error", "No se pudieron cargar los productos de la base de datos")
        setProducts([])
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión con la base de datos")
      setProducts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadProducts(false)
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    Alert.alert("Confirmar eliminación", `¿Estás seguro de que quieres eliminar "${productName}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          if (!state.token) {
            Alert.alert("Error", "No tienes autorización para eliminar productos")
            return
          }

          try {
            const result = await productService.deleteProduct(productId, state.token)

            if (result.success) {
              Alert.alert("Éxito", "Producto eliminado correctamente")
              await loadProducts()
            } else {
              Alert.alert("Error", result.message || "No se pudo eliminar el producto")
            }
          } catch (error) {
            Alert.alert("Error", "Error de conexión al eliminar el producto")
          }
        },
      },
    ])
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setAddModalVisible(true)
  }

  const handleAddNewProduct = () => {
    setEditingProduct(null)
    setAddModalVisible(true)
  }

  const handleProductCreated = async () => {
    setAddModalVisible(false)
    setEditingProduct(null)
    // Recargar productos después de crear/actualizar
    await loadProducts(true)
  }

  const handleAddProduct = (productData: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...productData,
      category: productData.category || "cafe",
      id: Date.now().toString(),
    }
    setProducts((prev) => [...prev, newProduct])
    setAddModalVisible(false)
    Alert.alert("Éxito", "Producto agregado localmente")
  }

  const handleUpdateProduct = (updatedProduct: Product) => {
    const product = {
      ...updatedProduct,
      category: updatedProduct.category || "cafe",
    }
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)))
    setEditingProduct(null)
    setAddModalVisible(false)
    Alert.alert("Éxito", "Producto actualizado localmente")
  }

  const handleOpenSalesReport = () => {
    setDropdownVisible(false)
    router.push("/salesReport")
  }

  const handleOpenOrdersReport = () => {
    setDropdownVisible(false)
    router.push("/ordersReport")
  }

  const handleOpenAdminChat = () => {
    setDropdownVisible(false);
    router.push('/admin-chat');
  };

  // Debug para verificar el estado de productos
  useEffect(() => {
  }, [products])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>Panel de Administración</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.reportsButton} 
            onPress={() => setDropdownVisible(true)}
          >
            <Ionicons name="bar-chart" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNewProduct}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Menu */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
          <View style={styles.dropdownMenu}>
            <TouchableOpacity style={styles.dropdownItem} onPress={handleOpenSalesReport}>
              <Ionicons name="analytics" size={20} color="#795548" />
              <Text style={styles.dropdownText}>Reportes de Ventas</Text>
            </TouchableOpacity>
            <View style={styles.dropdownSeparator} />
            <TouchableOpacity style={styles.dropdownItem} onPress={handleOpenOrdersReport}>
              <Ionicons name="receipt" size={20} color="#795548" />
              <Text style={styles.dropdownText}>Pedidos</Text>
            </TouchableOpacity>
            <View style={styles.dropdownSeparator} />
            <TouchableOpacity style={styles.dropdownItem} onPress={handleOpenAdminChat}>
              <Ionicons name="chatbubbles" size={20} color="#795548" />
              <Text style={styles.dropdownText}>Chat de Administración</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>{loading ? "Cargando..." : `${products.length} Productos Encontrados`}</Text>
        <TouchableOpacity onPress={() => loadProducts(true)} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#795548" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#795548" />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.sectionTitle}>Productos ({products.length})</Text>
          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cafe" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No hay productos disponibles</Text>
              <TouchableOpacity onPress={handleAddNewProduct} style={styles.addFirstButton}>
                <Text style={styles.addFirstButtonText}>Agregar primer producto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            products.map((product, index) => (
              <View key={`${product.id}_${index}`} style={styles.productItem}>
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  onError={(e) => {
                    console.log("Image load error for product:", product.name, e.nativeEvent.error)
                  }}
                  onLoad={() => {
                    console.log("Image loaded for product:", product.name)
                  }}
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productPrice}>Bs{product.price.toFixed(2)}</Text>
                  <Text style={styles.productStock}>Stock: {product.stock}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                  {product.description ? (
                    <Text style={styles.productDescription} numberOfLines={1}>
                      {product.description}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity style={styles.editButton} onPress={() => handleEditProduct(product)}>
                    <Ionicons name="pencil" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteProduct(product.id, product.name)}
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <AddProductModal
        visible={addModalVisible}
        onClose={() => {
          setAddModalVisible(false)
          setEditingProduct(null)
        }}
        onProductCreated={handleProductCreated}
        editingProduct={editingProduct}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 48,
    paddingHorizontal: 16,
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
    flex: 1,
    textAlign: "center",
  },
  chatButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    backgroundColor: "#795548",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  reportsButton: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#795548",
  },
  productActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    borderRadius: 8,
    padding: 8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  addFirstButton: {
    backgroundColor: "#795548",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  productStock: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  productCategory: {
    fontSize: 12,
    color: "#795548",
    marginTop: 2,
    fontStyle: "italic",
  },
  productDescription: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
  },
  productId: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
    fontFamily: "monospace",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 80,
    paddingRight: 16,
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 180,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: 16,
  },
})
