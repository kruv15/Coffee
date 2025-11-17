import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Order } from "../services/orderService"
import { Colors } from "../constants/Colors"

interface OrdersListItemProps {
  order: Order
  onPress: () => void
  statusColor: string
  statusBgColor: string
}

export function OrdersListItem({
  order,
  onPress,
  statusColor,
  statusBgColor,
}: OrdersListItemProps) {
  const formattedDate = new Date(order.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.leftContent}>
        <View style={styles.titleRow}>
          <Text style={styles.orderId}>Pedido #{order._id?.substring(0, 8)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {order.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.detailText}>{formattedDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cube-outline" size={14} color="#666" />
            <Text style={styles.detailText}>
              {order.productos?.length || 0} {order.productos?.length === 1 ? "producto" : "productos"}
            </Text>
          </View>
        </View>

        <Text style={styles.totalPrice}>Bs {order.total?.toFixed(2)}</Text>
      </View>

      <View style={styles.rightContent}>
        <Ionicons name="chevron-forward" size={24} color={Colors.light.icon} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.primary,
  },
  rightContent: {
    justifyContent: "center",
  },
})
