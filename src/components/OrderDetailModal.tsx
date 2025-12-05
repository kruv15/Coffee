"use client"

import { Ionicons } from "@expo/vector-icons"
import React from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { Colors } from "../constants/Colors"
import { useAuth } from "../context/AuthContext"
import type { Order } from "../services/orderService"

interface OrderDetailsModalProps {
  visible: boolean
  order: Order | null
  onClose: () => void
  onUpdateStatus: (orderId: string, newStatus: string) => Promise<void>
  onCancelOrder: (orderId: string) => Promise<void>
  loadingUpdate: boolean
}

export function OrderDetailsModal({
  visible,
  order,
  onClose,
  onUpdateStatus,
  onCancelOrder,
  loadingUpdate,
}: OrderDetailsModalProps) {
  const { state } = useAuth()

  if (!visible || !order) {
    return null
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

  const handleUpdateStatus = (newStatus: string) => {
    Alert.alert("Confirmar cambio de estado", `¿Estás seguro de cambiar el estado a "${getStatusText(newStatus)}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: () => onUpdateStatus(order._id, newStatus) },
    ])
  }

  const handleCancelOrder = () => {
    Alert.alert("Confirmar cancelación", "¿Estás seguro de que quieres cancelar este pedido?", [
      { text: "No", style: "cancel" },
      { text: "Sí, Cancelar", style: "destructive", onPress: () => onCancelOrder(order._id) },
    ])
  }

  const renderStatusButton = (status: string, label: string, style: any) => {
    if (order.status === status) return null // Don't show button for current status
    return (
      <TouchableOpacity
        key={status}
        style={[style, loadingUpdate && styles.disabledButton]}
        onPress={() => handleUpdateStatus(status)}
        disabled={loadingUpdate}
      >
        {loadingUpdate ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{label}</Text>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardView}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="arrow-back" size={28} color="#222" />
              </TouchableOpacity>
              <Text style={styles.title}>Detalle del Pedido</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={{ paddingBottom: 50 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.orderSummaryHeader}>
                <Text style={styles.orderId}>Pedido #{order._id.slice(-6)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                </View>
              </View>
              <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información del Cliente</Text>
                <View style={styles.infoItem}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>
                    {order.userId?.nombreUsr || "N/A"} {order.userId?.apellidoUsr || ""}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="mail-outline" size={20} color="#666" />
                  <Text style={styles.infoText}>{order.userId?.emailUsr || "N/A"}</Text>
                </View>
                {order.userId?.celUsr && (
                  <View style={styles.infoItem}>
                    <Ionicons name="call-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>{order.userId.celUsr}</Text>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dirección de Entrega</Text>
                <View style={styles.infoItem}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <TouchableOpacity
                    onPress={() => {
                      if (order.direccionEntrega) {
                        Linking.openURL(order.direccionEntrega)
                      }
                    }}
                  >
                    <Text style={[styles.infoText, { color: Colors.light.primary, textDecorationLine: "underline" }]}>
                      Ver ubicación en Maps
                    </Text>
                  </TouchableOpacity>
                </View>
                {order.infoAdicional && (
                  <View style={styles.infoItem}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>Info adicional: {order.infoAdicional}</Text>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Productos ({order.productos.length})</Text>
                {order.productos.map((item, index) => (
                  <View key={index} style={styles.productItem}>
                    {item.productoId?.imagen && (
                      <Image
                        source={{ uri: item.productoId.imagen }}
                        style={styles.productImage}
                        onError={() => console.log("Error loading image:", item.productoId?.imagen)}
                      />
                    )}
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>
                        {item.cantidad}x {item.productoId?.nomProd || "Producto"}
                      </Text>
                      <Text style={styles.productPrice}>Bs{(item.precio * item.cantidad).toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resumen del Pedido</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal:</Text>
                  <Text style={styles.summaryValue}>Bs{order.total.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Descuentos:</Text>
                  <Text style={styles.summaryValue}>Bs0.00</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Envío:</Text>
                  <Text style={styles.summaryValue}>Bs0.00</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>Bs{order.total.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Estado del Pedido</Text>
                <View style={styles.statusTimelineItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.success} />
                  <Text style={styles.statusTimelineText}>Pedido Creado - {formatDate(order.createdAt)}</Text>
                </View>
                <View style={styles.statusTimelineItem}>
                  <Ionicons name="checkmark-circle" size={20} color={getStatusColor(order.status)} />
                  <Text style={styles.statusTimelineText}>Estado Actual: {getStatusText(order.status)}</Text>
                </View>
              </View>

              {state.user?.role === "admin" && order.status !== "cancelado" && order.status !== "entregado" && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Gestión de Estado</Text>
                  <View style={styles.statusManagement}>
                    <Text style={styles.currentStatusLabel}>Estado Actual:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.changeStatusLabel}>Cambiar a:</Text>
                  <View style={styles.actionButtons}>
                    {order.status === "pendiente" &&
                      renderStatusButton("confirmado", "Confirmar", styles.confirmButton)}
                    {order.status === "confirmado" &&
                      renderStatusButton("preparando", "Preparando", styles.preparingButton)}
                    {order.status === "preparando" && renderStatusButton("listo", "Listo", styles.readyButton)}
                    {order.status === "listo" && renderStatusButton("entregado", "Entregado", styles.deliveredButton)}
                  </View>
                  <TouchableOpacity
                    style={[styles.cancelOrderButton, loadingUpdate && styles.disabledButton]}
                    onPress={handleCancelOrder}
                    disabled={loadingUpdate}
                  >
                    {loadingUpdate ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="close-circle-outline" size={20} color="#fff" />
                        <Text style={styles.cancelButtonText}>Cancelar Pedido</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
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
    justifyContent: "flex-end",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "90%",
    minHeight: "70%",
    width: "100%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    flex: 1,
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  orderSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  orderDate: {
    fontSize: 13,
    color: "#888",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  section: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#555",
    flex: 1,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    marginHorizontal: 4,
  },
  productImage: {
    width: 35,
    height: 35,
    borderRadius: 6,
    marginRight: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: "bold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#666",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: Colors.light.success,
  },
  statusTimelineItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  statusTimelineText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#555",
  },
  statusManagement: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  currentStatusLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  changeStatusLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  preparingButton: {
    backgroundColor: "#9C27B0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  readyButton: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  deliveredButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  cancelOrderButton: {
    backgroundColor: "#f44336",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    marginHorizontal: 4,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
})
