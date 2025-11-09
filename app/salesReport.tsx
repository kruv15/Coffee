"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native"
import { useAuth } from "../src/context/AuthContext"
import { orderService } from "../src/services/orderService"

interface SalesData {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topProducts: { name: string; quantity: number; revenue: number }[]
  dailySales: { date: string; sales: number; orders: number }[]
}

export default function SalesReportScreen() {
  const { state } = useAuth()
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("7dias")
  const validStatuses = ["entregado", "delivered", "confirmado", "preparando", "listo"]

  const loadSalesData = async () => {
    if (!state.token) {
      Alert.alert("Error", "No tienes autorización para ver los reportes")
      router.back()
      return
    }
    setLoading(true)
    try {
      const result = await orderService.getOrders(state.token, { limit: 1000 })
      if (result.success && result.data) {
        const orders = Array.isArray(result.data.pedidos) ? result.data.pedidos : []
        const deliveredOrders = orders.filter((o: any) =>
          validStatuses.includes(o.status?.toLowerCase())
        )
        const data = calculateSalesData(deliveredOrders, dateRange)
        setSalesData(data)
      } else {
        setSalesData({
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          topProducts: [],
          dailySales: [],
        })
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar la información de ventas.")
      setSalesData({
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topProducts: [],
        dailySales: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateSalesData = (orders: any[], range: string): SalesData => {
    const now = new Date()
    const daysBack =
      range === "1dia" ? 1 : range === "7dias" ? 7 : range === "30dias" ? 30 : 90
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt || order.fecha || order.date)
      return orderDate >= startDate
    })

    const totalSales = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    const totalOrders = filteredOrders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    const productMap = new Map()
    filteredOrders.forEach((order) => {
      order.productos?.forEach((item: any) => {
        const name = item.productoId?.nomProd || item.name || "Producto"
        const q = item.cantidad || 1
        const p = item.precio || item.productoId?.precioProd || 0
        if (productMap.has(name)) {
          const e = productMap.get(name)
          productMap.set(name, { quantity: e.quantity + q, revenue: e.revenue + p * q })
        } else productMap.set(name, { quantity: q, revenue: p * q })
      })
    })

    const topProducts = Array.from(productMap.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const dailyMap = new Map()
    filteredOrders.forEach((order) => {
      const d = new Date(order.createdAt || order.fecha || order.date)
      const key = d.toISOString().split("T")[0]
      if (dailyMap.has(key)) {
        const e = dailyMap.get(key)
        dailyMap.set(key, { sales: e.sales + (order.total || 0), orders: e.orders + 1 })
      } else {
        dailyMap.set(key, { sales: order.total || 0, orders: 1 })
      }
    })

    const dailySales = Array.from(dailyMap.entries())
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return { totalSales, totalOrders, averageOrderValue, topProducts, dailySales }
  }

  useEffect(() => {
    loadSalesData()
  }, [dateRange])

  const renderSummaryCard = (title: string, value: string, icon: string, color: string) => (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <View style={styles.summaryHeader}>
        <Ionicons name={icon as any} size={22} color={color} />
        <Text style={styles.summaryTitle}>{title}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5D4037" />
      {/* Barra superior */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Reportes de Ventas</Text>
        <TouchableOpacity onPress={loadSalesData}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#795548" />
          <Text style={styles.loadingText}>Cargando datos reales...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Selector de rango */}
          <View style={styles.dateRangeContainer}>
            {[
              { key: "1dia", label: "1 día" },
              { key: "7dias", label: "7 días" },
              { key: "30dias", label: "30 días" },
              { key: "90dias", label: "90 días" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.dateButton,
                  dateRange === opt.key && styles.activeDateButton,
                ]}
                onPress={() => setDateRange(opt.key)}
              >
                <Text
                  style={[
                    styles.dateButtonText,
                    dateRange === opt.key && styles.activeDateButtonText,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tarjetas resumen */}
          <View style={styles.summaryContainer}>
            {renderSummaryCard(
              "Ventas Totales",
              `Bs${salesData?.totalSales.toFixed(2)}`,
              "cash",
              "#4CAF50"
            )}
            {renderSummaryCard(
              "Pedidos Totales",
              `${salesData?.totalOrders}`,
              "receipt",
              "#2196F3"
            )}
            {renderSummaryCard(
              "Promedio por Pedido",
              `Bs${salesData?.averageOrderValue.toFixed(2)}`,
              "trending-up",
              "#FF9800"
            )}
          </View>

          {/* Productos más vendidos */}
          {salesData?.topProducts?.length ? (
            <View style={styles.section}>
              {salesData.topProducts.map((p, i) => (
                <View key={i} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productStats}>
                      {p.quantity} unidades • Bs{p.revenue.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{i + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Ventas diarias */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ventas Diarias</Text>
            {salesData?.dailySales?.map((d, i) => (
              <View key={i} style={styles.dayItem}>
                <Text style={styles.dayDate}>{d.date}</Text>
                <View style={styles.dayStats}>
                  <Text style={styles.daySales}>Bs{d.sales.toFixed(2)}</Text>
                  <Text style={styles.dayOrders}>{d.orders} pedidos</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#5D4037",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  appBarTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  content: { paddingHorizontal: 16, marginTop: 10 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#666" },
  dateRangeContainer: {
    flexDirection: "row",
    backgroundColor: "#f3f3f3",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  dateButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  activeDateButton: { backgroundColor: "#795548" },
  dateButtonText: { fontSize: 14, color: "#555" },
  activeDateButtonText: { color: "#fff", fontWeight: "bold" },
  summaryContainer: { marginBottom: 20 },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
  },
  summaryHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  summaryTitle: { fontSize: 14, color: "#555", marginLeft: 8 },
  summaryValue: { fontSize: 22, fontWeight: "bold", color: "#333" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 10 },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "600" },
  productStats: { fontSize: 13, color: "#666" },
  rankBadge: {
    backgroundColor: "#795548",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  dayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dayDate: { fontSize: 14, color: "#666" },
  dayStats: { alignItems: "flex-end" },
  daySales: { color: "#4CAF50", fontWeight: "bold" },
  dayOrders: { color: "#777", fontSize: 12 },
})
