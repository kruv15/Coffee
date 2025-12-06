"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { Linking } from "react-native"
import { useAuth } from "../src/context/AuthContext"
import { orderService, type Order } from "../src/services/orderService"
import { Colors } from "../src/constants/Colors"
import { OrdersListItem } from "../src/components/OrdersListItem"

type OrderStatus = "todos" | "pendiente" | "confirmado" | "preparando" | "listo" | "entregado" | "cancelado"

const ORDER_STATUSES: Array<{ value: OrderStatus; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "preparando", label: "Preparando" },
  { value: "listo", label: "Listo" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
]

export default function OrdersScreen() {
  const { state } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("todos")
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const statusScrollRef = useRef<FlatList>(null)

  // Cargar pedidos del usuario
  const loadUserOrders = async () => {
    if (!state.token) {
      Alert.alert("Error", "No se encontró el token de autenticación")
      router.back()
      return
    }

    setLoading(true)
    try {
      console.log("📋 Cargando pedidos del usuario...")
      const response = await orderService.obtenerMisPedidos(state.token)

      if (response.success && response.data?.pedidos) {
        console.log("✅ Pedidos cargados:", response.data.pedidos.length)
        setOrders(response.data.pedidos)
      } else {
        console.log("⚠️ Sin pedidos encontrados:", response.message)
        setOrders([])
        if (response.message && response.message !== "Pedidos obtenidos exitosamente") {
          Alert.alert("Información", response.message)
        }
      }
    } catch (error) {
      console.error("❌ Error cargando pedidos:", error)
      Alert.alert("Error", "No se pudieron cargar los pedidos")
    } finally {
      setLoading(false)
    }
  }

  // Cargar pedidos al montar el componente
  useEffect(() => {
    loadUserOrders()
  }, [])

  // Filtrar pedidos por búsqueda y estado seleccionado
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchQuery.toLowerCase()
    const orderId = order._id?.toLowerCase() || ""
    const status = order.status?.toLowerCase() || ""
    const total = order.total?.toString() || ""

    return (
      (selectedStatus === "todos" || order.status === selectedStatus) &&
      (orderId.includes(searchLower) || status.includes(searchLower) || total.includes(searchLower))
    )
  })

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pendiente: "#FFA500",
      confirmado: "#4CAF50",
      preparando: "#2196F3",
      listo: "#9C27B0",
      entregado: "#4CAF50",
      cancelado: "#F44336",
    }
    return statusColors[status] || "#666"
  }

  const getStatusBgColor = (status: string) => {
    const statusBgColors: Record<string, string> = {
      pendiente: "#FFF3CD",
      confirmado: "#E8F5E9",
      preparando: "#E3F2FD",
      listo: "#F3E5F5",
      entregado: "#E8F5E9",
      cancelado: "#FFEBEE",
    }
    return statusBgColors[status] || "#f8f8f8"
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color={Colors.light.primary} />
      </TouchableOpacity>
      <Text style={styles.title}>Mis Pedidos</Text>
      <View style={{ width: 28 }} />
    </View>
  )

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={Colors.light.icon} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por ID o estado..."
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

  const renderStatusFilter = () => (
    <View style={styles.statusFilterWrapper}>
      <TouchableOpacity
        style={styles.statusDropdownButton}
        onPress={() => setStatusModalVisible(true)}
      >
        <Ionicons name="filter" size={18} color="#fff" />
        <Text style={styles.statusDropdownButtonText}>Estados</Text>
        <Ionicons name="chevron-down" size={18} color="#fff" />
      </TouchableOpacity>

      <FlatList
        ref={statusScrollRef}
        data={ORDER_STATUSES}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.statusFilterButton,
              selectedStatus === item.value && styles.statusFilterButtonActive,
            ]}
            onPress={() => setSelectedStatus(item.value)}
          >
            <Text
              style={[
                styles.statusFilterButtonText,
                selectedStatus === item.value && styles.statusFilterButtonTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        snapToInterval={110}
        decelerationRate="fast"
        contentContainerStyle={styles.statusScrollContent}
        style={styles.statusScroll}
      />
    </View>
  )

  const renderStatusModal = () => (
    <Modal
      visible={statusModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setStatusModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.statusModalContent}>
          <View style={styles.statusModalHeader}>
            <Text style={styles.statusModalTitle}>Filtrar por Estado</Text>
            <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
              <Ionicons name="close" size={28} color="#222" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.statusModalList}>
            {ORDER_STATUSES.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusModalItem,
                  selectedStatus === status.value && styles.statusModalItemActive,
                ]}
                onPress={() => {
                  setSelectedStatus(status.value)
                  setStatusModalVisible(false)
                }}
              >
                <View style={styles.statusModalItemContent}>
                  <Ionicons
                    name={selectedStatus === status.value ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={selectedStatus === status.value ? Colors.light.primary : "#ccc"}
                  />
                  <Text
                    style={[
                      styles.statusModalItemText,
                      selectedStatus === status.value && styles.statusModalItemTextActive,
                    ]}
                  >
                    {status.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.statusModalCloseButton}
            onPress={() => setStatusModalVisible(false)}
          >
            <Text style={styles.statusModalCloseButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  const renderOrderItem = ({ item }: { item: Order }) => (
    <OrdersListItem 
      order={item}
      onPress={() => setSelectedOrder(item)}
      statusColor={getStatusColor(item.status)}
      statusBgColor={getStatusBgColor(item.status)}
    />
  )

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color={Colors.light.icon} />
      <Text style={styles.emptyText}>No tienes pedidos</Text>
      <Text style={styles.emptySubtext}>Los pedidos que realices aparecerán aquí</Text>
      <TouchableOpacity
        style={styles.backToHomeButton}
        onPress={() => router.push("/")}
      >
        <Text style={styles.backToHomeButtonText}>Volver al Inicio</Text>
      </TouchableOpacity>
    </View>
  )

  const renderOrderDetail = () => (
    <Modal
      visible={!!selectedOrder}
      transparent
      animationType="slide"
      onRequestClose={() => setSelectedOrder(null)}
    >
      <View style={styles.detailModalOverlay}>
        <View style={styles.detailModalContent}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedOrder(null)}>
              <Ionicons name="close" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>Detalles del Pedido</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.detailScroll}>
            {/* Información del pedido */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Información del Pedido</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ID Pedido:</Text>
                <Text style={styles.detailValue}>{selectedOrder?._id?.substring(0, 24)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estado:</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(selectedOrder?.status || "") },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: getStatusColor(selectedOrder?.status || "") },
                    ]}
                  >
                    {selectedOrder?.status?.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha:</Text>
                <Text style={styles.detailValue}>
                  {selectedOrder?.createdAt
                    ? new Date(selectedOrder.createdAt).toLocaleDateString("es-ES")
                    : "N/A"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total:</Text>
                <Text style={styles.detailValueBold}>Bs {selectedOrder?.total?.toFixed(2)}</Text>
              </View>
            </View>

            {/* Productos */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Productos</Text>
              {selectedOrder?.productos?.map((producto, index) => (
                <View key={index} style={styles.productoItem}>
                  <Text style={styles.productoName}>{producto.productoId?.nomProd}</Text>
                  <View style={styles.productoDetails}>
                    <Text style={styles.productoInfo}>
                      Cantidad: {producto.cantidad}
                    </Text>
                    <Text style={styles.productoInfo}>
                      Bs {(producto.precio * producto.cantidad).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Dirección de entrega */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Dirección de Entrega</Text>
              {selectedOrder?.direccionEntrega && (
                <TouchableOpacity
                  onPress={() => {
                    const url = selectedOrder.direccionEntrega.trim();
                    if (url.startsWith("http") || url.startsWith("https")) {
                      Linking.openURL(url);
                    } else {
                      Alert.alert("Enlace inválido", "La dirección no es un enlace válido.");
                    }
                  }}
                >
                  <Text style={[styles.addressText, { color: "#1e90ff", textDecorationLine: "underline" }]}>
                    {selectedOrder.direccionEntrega}
                  </Text>
                </TouchableOpacity>
              )}
              {selectedOrder?.infoAdicional && (
                <>
                  <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Información Adicional</Text>
                  <Text style={styles.addressText}>{selectedOrder.infoAdicional}</Text>
                </>
              )}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.detailCloseButton}
            onPress={() => setSelectedOrder(null)}
          >
            <Text style={styles.detailCloseButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderSearchBar()}
      {renderStatusFilter()}
      {renderStatusModal()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadUserOrders}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {renderOrderDetail()}
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.light.text,
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
  statusFilterWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  statusDropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 16,
    justifyContent: "center",
  },
  statusDropdownButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  statusScroll: {
    flex: 1,
  },
  statusScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
  statusFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 4,
  },
  statusFilterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  statusFilterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  statusFilterButtonTextActive: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.light.icon,
  },
  listContainer: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.icon,
    marginTop: 8,
    marginBottom: 24,
  },
  backToHomeButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToHomeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  statusModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  statusModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  statusModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  statusModalList: {
    maxHeight: "70%",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statusModalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
  },
  statusModalItemActive: {
    backgroundColor: "#f0f8ff",
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  statusModalItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  statusModalItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  statusModalItemTextActive: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  statusModalCloseButton: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    alignItems: "center",
  },
  statusModalCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Detail Modal
  detailModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  detailModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%", 
    paddingBottom: 5,
    justifyContent: "space-between",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  detailScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    color: "#222",
    fontWeight: "500",
  },
  detailValueBold: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  productoItem: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  productoName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  productoDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  productoInfo: {
    fontSize: 13,
    color: "#666",
  },
  addressText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  detailCloseButton: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    alignItems: "center",
  },
  detailCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
