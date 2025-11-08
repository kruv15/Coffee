"use client"

import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
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
  const [dateRange, setDateRange] = useState("7dias") // 7dias, 30dias, 90dias
  const validStatuses = ["entregado", "delivered", "confirmado", "preparando", "listo"]

  const loadSalesData = async () => {
    if (!state.token) {
      Alert.alert("Error", "No tienes autorización para ver los reportes")
      router.back()
      return
    }

    setLoading(true)
    try {
      console.log("📊 Loading sales data from API...")

      // Obtener todos los pedidos (sin filtro de status aquí)
      const result = await orderService.getOrders(state.token, {
        limit: 1000, // Obtener muchos pedidos para el análisis
      })

      if (result.success && result.data) {
        console.log("📦 Raw API response:", result.data)

        // La respuesta viene en result.data.pedidos
        let orders = []
        if (result.data.pedidos && Array.isArray(result.data.pedidos)) {
          orders = result.data.pedidos
        } else {
          console.log("❌ No valid orders array found in response")
          setSalesData({
            totalSales: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            topProducts: [],
            dailySales: [],
          })
          return
        }

        console.log("📦 Orders array found:", orders.length)
        console.log("📋 Sample order:", orders[0])

        // Filtrar solo pedidos entregados para calcular ventas
        const deliveredOrders = orders.filter(
          (order: any) => validStatuses.includes(order.status?.toLowerCase())
        )

        console.log("✅ Delivered orders found:", deliveredOrders.length)

        // Calcular estadísticas de ventas
        const calculatedSalesData = calculateSalesData(deliveredOrders, dateRange)
        setSalesData(calculatedSalesData)
      } else {
        console.error("❌ Failed to load orders:", result.message)
        Alert.alert("Error", result.message || "No se pudieron cargar los datos de ventas")
        setSalesData({
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          topProducts: [],
          dailySales: [],
        })
      }
    } catch (error) {
      console.error("❌ Error loading sales data:", error)
      Alert.alert("Error", "Error de conexión al cargar los datos")
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
    // Filtrar pedidos por rango de fechas
    const now = new Date()
    const daysBack = range === "1dia" ? 1 : range === "7dias" ? 7 : range === "30dias" ? 30 : 90
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    const filteredOrders = orders.filter((order) => {
      const orderDate = new Date(order.createdAt || order.fecha || order.date)
      return orderDate >= startDate
    })

    // Calcular totales
    const totalSales = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const totalOrders = filteredOrders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    // Calcular productos más vendidos
    const productMap = new Map()
    filteredOrders.forEach((order) => {
      if (order.productos && Array.isArray(order.productos)) {
        order.productos.forEach((item: any) => {
          const name = item.productoId?.nomProd || item.name || item.nomProd || item.producto
          const quantity = item.cantidad || item.quantity || 1
          const price = item.precio || item.price || item.productoId?.precioProd || 0

          if (name && productMap.has(name)) {
            const existing = productMap.get(name)
            productMap.set(name, {
              quantity: existing.quantity + quantity,
              revenue: existing.revenue + price * quantity,
            })
          } else if (name) {
            productMap.set(name, {
              quantity: quantity,
              revenue: price * quantity,
            })
          }
        })
      }
    })

    const topProducts = Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Calcular ventas diarias
    const dailyMap = new Map()
    filteredOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt || order.fecha || order.date)
      const dateKey = orderDate.toISOString().split("T")[0]

      if (dailyMap.has(dateKey)) {
        const existing = dailyMap.get(dateKey)
        dailyMap.set(dateKey, {
          sales: existing.sales + (order.total || 0),
          orders: existing.orders + 1,
        })
      } else {
        dailyMap.set(dateKey, {
          sales: order.total || 0,
          orders: 1,
        })
      }
    })

    const dailySales = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7)

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      topProducts,
      dailySales,
    }
  }

  useEffect(() => {
    loadSalesData()
  }, [dateRange])

  const renderSummaryCard = (title: string, value: string, icon: string, color: string) => (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <View style={styles.summaryHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={styles.summaryTitle}>{title}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.title}>Reportes de Ventas</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#795548" />
          <Text style={styles.loadingText}>Cargando datos reales...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#222" />
        </TouchableOpacity>
        <Text style={styles.title}>Reportes de Ventas</Text>
        <TouchableOpacity onPress={loadSalesData} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#795548" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {!salesData ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No hay datos de ventas disponibles</Text>
            <TouchableOpacity onPress={loadSalesData} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Date Range Selector */}
            <View style={styles.dateRangeContainer}>
              <TouchableOpacity
                style={[styles.dateButton, dateRange === "1day" && styles.activeDateButton]}
                onPress={() => setDateRange("1day")}
              >
                <Text style={[styles.dateButtonText, dateRange === "1day" && styles.activeDateButtonText]}>1 día</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, dateRange === "7dias" && styles.activeDateButton]}
                onPress={() => setDateRange("7dias")}
              >
                <Text style={[styles.dateButtonText, dateRange === "7dias" && styles.activeDateButtonText]}>
                  7 días
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, dateRange === "30dias" && styles.activeDateButton]}
                onPress={() => setDateRange("30dias")}
              >
                <Text style={[styles.dateButtonText, dateRange === "30dias" && styles.activeDateButtonText]}>
                  30 días
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, dateRange === "90dias" && styles.activeDateButton]}
                onPress={() => setDateRange("90days")}
              >
                <Text style={[styles.dateButtonText, dateRange === "90dias" && styles.activeDateButtonText]}>
                  90 días
                </Text>
              </TouchableOpacity>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              {renderSummaryCard("Ventas Totales", `Bs${salesData.totalSales.toFixed(2)}`, "cash", "#4CAF50")}
              {renderSummaryCard("Pedidos Totales", salesData.totalOrders.toString(), "receipt", "#2196F3")}
              {renderSummaryCard(
                "Promedio por Pedido",
                `Bs${salesData.averageOrderValue.toFixed(2)}`,
                "trending-up",
                "#FF9800",
              )}
            </View>

            {/* Top Products */}
            <View style={styles.section}>
              {salesData.topProducts.map((product, index) => (
                <View key={index} style={styles.productItem}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productStats}>
                      {product.quantity} unidades • Bs{product.revenue.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Daily Sales */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ventas Diarias</Text>
              {salesData.dailySales.map((day, index) => (
                <View key={index} style={styles.dayItem}>
                  <Text style={styles.dayDate}>{day.date}</Text>
                  <View style={styles.dayStats}>
                    <Text style={styles.daySales}>Bs{day.sales.toFixed(2)}</Text>
                    <Text style={styles.dayOrders}>{day.orders} pedidos</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
    marginLeft: 16,
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
  dateRangeContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeDateButton: {
    backgroundColor: "#795548",
  },
  dateButtonText: {
    fontSize: 14,
    color: "#666",
  },
  activeDateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  summaryContainer: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productStats: {
    fontSize: 14,
    color: "#666",
  },
  rankBadge: {
    backgroundColor: "#795548",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  dayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dayDate: {
    fontSize: 14,
    color: "#666",
  },
  dayStats: {
    alignItems: "flex-end",
  },
  daySales: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  dayOrders: {
    fontSize: 12,
    color: "#666",
  },
  refreshButton: {
    padding: 8,
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
  retryButton: {
    backgroundColor: "#795548",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
})
