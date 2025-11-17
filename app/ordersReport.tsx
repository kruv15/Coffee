"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { OrderDetailsModal } from "../src/components/OrderDetailModal";
import { useAuth } from "../src/context/AuthContext"
import { orderService, type Order } from "../src/services/orderService"

export default function OrdersReportScreen() {
  const { state } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchUserName, setSearchUserName] = useState<string>("")
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  })
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false) 
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null) 
  const [loadingUpdate, setLoadingUpdate] = useState(false)

  const loadOrders = async (showLoading = true, page = 1) => {
    if (!state.isAuthenticated || !state.token) {
      Alert.alert("Error", "Debes estar autenticado para ver los pedidos")
      setLoading(false)
      return
    }

    if (showLoading) setLoading(true)

    try {
      console.log("🔄 Loading orders from API...")
      const params = {
        page,
        limit: 10,
        ...(filterStatus !== "all" && { status: filterStatus }),
      }

      const response = await orderService.getOrders(state.token, params)

      console.log("📡 Full API Response:", JSON.stringify(response, null, 2))

      if (response.success && response.data) {
        const { pedidos, totalPages, currentPage, total } = response.data

        console.log("✅ Orders loaded successfully:", pedidos.length)
        if (pedidos.length > 0) {
          console.log("📋 Sample order:", JSON.stringify(pedidos[0], null, 2))
        }

        setOrders(pedidos)
        setPagination({
          currentPage: Number(currentPage),
          totalPages: Number(totalPages),
          total: Number(total),
        })
      } else {
        console.log("❌ API response not successful:", response)
        Alert.alert("Error", response.message || "No se pudieron cargar los pedidos")
        setOrders([])
      }
    } catch (error) {
      console.error("❌ Error loading orders:", error)
      Alert.alert("Error", "Error de conexión al cargar los pedidos")
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [state.isAuthenticated, state.token, filterStatus])

  const onRefresh = () => {
    setRefreshing(true)
    loadOrders(false, 1)
  }

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      const fullName = `${order.userId?.nombreUsr || ""} ${order.userId?.apellidoUsr || ""}`.toLowerCase()
      return fullName.includes(searchUserName.toLowerCase())
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pendiente":
        return "#FF9800"
      case "confirmado":
        return "#2196F3"
      case "preparando":
        return "#9C27B0"
      case "listo":
        return "#4CAF50"
      case "entregado":
        return "#4CAF50"
      case "cancelado":
        return "#f44336"
      default:
        return "#666"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pendiente":
        return "Pendiente"
      case "confirmado":
        return "Confirmado"
      case "preparando":
        return "Preparando"
      case "listo":
        return "Listo"
      case "entregado":
        return "Entregado"
      case "cancelado":
        return "Cancelado"
      default:
        return status
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!state.token) {
      Alert.alert("Error", "No tienes autorización para actualizar pedidos")
      return
    }
    setLoadingUpdate(true)
    try {
      console.log("🔄 Updating order status:", orderId, newStatus)
      const response = await orderService.updateOrderStatus(orderId, newStatus, state.token)

      if (response.success) {
        Alert.alert("Éxito", "Estado del pedido actualizado")
        await loadOrders(false, pagination.currentPage) // Recargar pedidos
        // Update selected order in modal if it's the one being viewed
        setSelectedOrder((prev) =>
          prev && prev._id === orderId ? { ...prev, status: newStatus as Order["status"] } : prev,
        )
      } else {
        Alert.alert("Error", response.message || "No se pudo actualizar el estado")
      }
    } catch (error) {
      console.error("❌ Error updating order status:", error)
      Alert.alert("Error", "Error de conexión al actualizar el estado")
    } finally {
      setLoadingUpdate(false)
    }
  }

  const cancelOrder = async (orderId: string) => {
    if (!state.token) {
      Alert.alert("Error", "No tienes autorización para cancelar pedidos")
      return
    }
    setLoadingUpdate(true)
    Alert.alert("Confirmar Cancelación", "¿Estás seguro de que quieres cancelar este pedido?", [
      { text: "No", style: "cancel", onPress: () => setLoadingUpdate(false) },
      {
        text: "Sí, Cancelar",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await orderService.cancelOrder(orderId, state.token!)

            if (response.success) {
              Alert.alert("Éxito", "Pedido cancelado correctamente")
              await loadOrders(false, pagination.currentPage)
              setSelectedOrder((prev) => (prev && prev._id === orderId ? { ...prev, status: "cancelado" } : prev))
            } else {
              Alert.alert("Error", response.message || "No se pudo cancelar el pedido")
            }
          } catch (error) {
            console.error("❌ Error cancelling order:", error)
            Alert.alert("Error", "Error de conexión al cancelar el pedido")
          } finally {
            setLoadingUpdate(false)
          }
        },
      },
    ])
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return dateString
    }
  }

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailsModalVisible(true)
  }

  const handleCloseDetailsModal = () => {
    setIsDetailsModalVisible(false)
    setSelectedOrder(null)
  }

  if (!state.isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={styles.title}>Pedidos</Text>
          </View>
          <View style={styles.notAuthContainer}>
            <Ionicons name="lock-closed-outline" size={64} color="#ccc" />
            <Text style={styles.notAuthText}>Debes iniciar sesión para ver los pedidos</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.title}>Pedidos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#795548" />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      </View>
    )
  }

  const filteredOrders = getFilteredOrders()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>Pedidos ({filteredOrders.length})</Text>
        <TouchableOpacity onPress={() => loadOrders(true, pagination.currentPage)} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#795548" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre del usuario..."
          placeholderTextColor="#ccc"
          value={searchUserName}
          onChangeText={setSearchUserName}
        />
        {searchUserName !== "" && (
          <TouchableOpacity onPress={() => setSearchUserName("")} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {["all", "pendiente", "confirmado", "preparando", "listo", "entregado", "cancelado"].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterButton, filterStatus === status && styles.activeFilterButton]}
            onPress={() => setFilterStatus(status)}
          >
            <Text style={[styles.filterButtonText, filterStatus === status && styles.activeFilterButtonText]}>
              {status === "all" ? "Todos" : getStatusText(status)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {pagination.total > 0 && (
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Página {pagination.currentPage} de {pagination.totalPages} • Total: {pagination.total} pedidos
            {searchUserName && ` • Filtrados: ${filteredOrders.length}`}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredOrders.map((order) => (
          <View key={order._id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Pedido #{order._id.slice(-6)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
              </View>
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>
                {order.userId?.nombreUsr || "Cliente"}
                {order.userId?.apellidoUsr || ""}
              </Text>
              {order.userId?.emailUsr && <Text style={styles.customerPhone}>{order.userId.emailUsr}</Text>}
              {order.userId?.celUsr && <Text style={styles.customerPhone}>{order.userId.celUsr}</Text>}
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            </View>

            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryTitle}>Dirección de entrega:</Text>
              <Text style={styles.deliveryAddress}>{order.direccionEntrega}</Text>
              {order.infoAdicional && (
                <Text style={styles.deliveryAdditional}>Info adicional: {order.infoAdicional}</Text>
              )}
            </View>

            <View style={styles.orderItems}>
              <Text style={styles.itemsTitle}>Productos:</Text>
              {order.productos && order.productos.length > 0 ? (
                order.productos.map((item, index) => (
                  <View key={index} style={styles.orderItemRow}>
                    {item.productoId?.imagen && (
                      <Image
                        source={{ uri: item.productoId.imagen }}
                        style={styles.itemImage}
                        onError={() => console.log("Error loading image:", item.productoId?.imagen)}
                      />
                    )}
                    <View style={styles.itemDetails}>
                      <Text style={styles.orderItem}>
                        {item.cantidad}x {item.productoId?.nomProd || "Producto"}
                      </Text>
                      <Text style={styles.itemPrice}>Bs{(item.precio * item.cantidad).toFixed(2)}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noItems}>No hay productos en este pedido</Text>
              )}
            </View>

            <View style={styles.orderFooter}>
              <View>
                <Text style={styles.orderTotal}>Total: Bs{order.total.toFixed(2)}</Text>
              </View>

              {state.user?.role === "admin" && (
                <View style={styles.actionButtons}>
                  {order.status === "pendiente" && (
                    <>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => updateOrderStatus(order._id, "confirmado")}
                      >
                        <Text style={styles.buttonText}>Confirmar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelButton} onPress={() => cancelOrder(order._id)}>
                        <Text style={styles.buttonText}>Cancelar</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {order.status === "confirmado" && (
                    <TouchableOpacity
                      style={styles.preparingButton}
                      onPress={() => updateOrderStatus(order._id, "preparando")}
                    >
                      <Text style={styles.buttonText}>Preparando</Text>
                    </TouchableOpacity>
                  )}

                  {order.status === "preparando" && (
                    <TouchableOpacity style={styles.readyButton} onPress={() => updateOrderStatus(order._id, "listo")}>
                      <Text style={styles.buttonText}>Listo</Text>
                    </TouchableOpacity>
                  )}

                  {order.status === "listo" && (
                    <TouchableOpacity
                      style={styles.deliveredButton}
                      onPress={() => updateOrderStatus(order._id, "entregado")}
                    >
                      <Text style={styles.buttonText}>Entregado</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <TouchableOpacity style={styles.viewMoreButton} onPress={() => handleViewDetails(order)}>
                <Text style={styles.viewMoreButtonText}>Ver más</Text>
                <Ionicons name="chevron-forward" size={16} color="#795548" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredOrders.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchUserName
                ? `No hay pedidos para el usuario "${searchUserName}"`
                : `No hay pedidos ${filterStatus !== "all" ? `con estado "${getStatusText(filterStatus)}"` : ""}`}
            </Text>
            <TouchableOpacity onPress={() => loadOrders(true, 1)} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Recargar</Text>
            </TouchableOpacity>
          </View>
        )}

        {pagination.currentPage < pagination.totalPages && (
          <TouchableOpacity style={styles.loadMoreButton} onPress={() => loadOrders(true, pagination.currentPage + 1)}>
            <Text style={styles.loadMoreText}>Cargar más pedidos</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <OrderDetailsModal
        visible={isDetailsModalVisible}
        order={selectedOrder}
        onClose={handleCloseDetailsModal}
        onUpdateStatus={updateOrderStatus}
        onCancelOrder={cancelOrder}
        loadingUpdate={loadingUpdate}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  clearButton: {
    padding: 4,
  },
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
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
    textAlign: "center",
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
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
  notAuthContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notAuthText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
  },
  activeFilterButton: {
    backgroundColor: "#795548",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  paginationInfo: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  paginationText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  orderCard: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#795548",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  customerPhone: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  orderDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  orderItems: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  orderItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  itemDetails: {
    flex: 1,
  },
  orderItem: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  itemPrice: {
    fontSize: 14,
    color: "#795548",
    fontWeight: "bold",
    marginTop: 2,
  },
  noItems: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: "#f44336",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  preparingButton: {
    backgroundColor: "#9C27B0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  readyButton: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deliveredButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#795548",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  loadMoreButton: {
    backgroundColor: "#795548",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 16,
  },
  loadMoreText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  viewMoreButtonText: {
    color: "#795548",
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 4,
  },
  deliveryInfo: {
    marginBottom: 12,
    backgroundColor: "#f0f8ff",
    padding: 8,
    borderRadius: 6,
  },
  deliveryTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
  },
  deliveryAdditional: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingBottom: 24,
  }
})
