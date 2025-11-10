"use client"

import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import React, { useEffect, useState } from "react"
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import MapView, { Marker, Region } from "react-native-maps"
import { Colors } from "../constants/Colors"

interface MapAddressSelectorProps {
  visible: boolean
  onClose: () => void
  onAddressSelect: (address: {
    address: string
    coordinates: {
      latitude: number
      longitude: number
    }
    additionalInfo: string
  }) => void
  initialAddress?: string
  initialAdditionalInfo?: string
}

interface LocationData {
  latitude: number
  longitude: number
  address: string
}

export function MapAddressSelector({
  visible,
  onClose,
  onAddressSelect,
  initialAddress = "",
  initialAdditionalInfo = "",
}: MapAddressSelectorProps) {
  const [region, setRegion] = useState<Region>({
    latitude: -17.7833, // La Paz, Bolivia coordinates
    longitude: -63.1821,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  })

  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [additionalInfo, setAdditionalInfo] = useState(initialAdditionalInfo)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (visible) {
      requestLocationPermission()
    }
  }, [visible])

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === "granted") {
        getCurrentLocation()
      } else {
        Alert.alert("Permisos de ubicación", "Para una mejor experiencia, permite el acceso a tu ubicación.", [
          { text: "Cancelar", style: "cancel" },
          { text: "Configurar", onPress: () => Location.requestForegroundPermissionsAsync() },
        ])
      }
    } catch (error) {
      console.error("Error requesting location permission:", error)
    }
  }

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }

      setRegion(newRegion)

      // Get address for current location
      const address = await reverseGeocode(location.coords.latitude, location.coords.longitude)
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address,
      })
    } catch (error) {
      console.error("Error getting current location:", error)
      Alert.alert("Error", "No se pudo obtener tu ubicación actual")
    } finally {
      setLoadingLocation(false)
    }
  }

  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude, longitude })
      if (result.length > 0) {
        const location = result[0]
        const addressParts = [
          location.street,
          location.streetNumber,
          location.district,
          location.city,
          location.region,
        ].filter(Boolean)

        return addressParts.join(", ") || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      }
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    } catch (error) {
      console.error("Error reverse geocoding:", error)
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    }
  }

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate
    setLoading(true)

    try {
      const address = await reverseGeocode(latitude, longitude)
      setSelectedLocation({
        latitude,
        longitude,
        address,
      })
    } catch (error) {
      console.error("Error handling map press:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchLocation = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const result = await Location.geocodeAsync(searchQuery)
      if (result.length > 0) {
        const location = result[0]
        const newRegion = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }

        setRegion(newRegion)
        const address = await reverseGeocode(location.latitude, location.longitude)
        setSelectedLocation({
          latitude: location.latitude,
          longitude: location.longitude,
          address,
        })
      } else {
        Alert.alert("No encontrado", "No se pudo encontrar la dirección especificada")
      }
    } catch (error) {
      console.error("Error searching location:", error)
      Alert.alert("Error", "Error al buscar la dirección")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmAddress = () => {
    if (!selectedLocation) {
      Alert.alert("Error", "Por favor selecciona una ubicación en el mapa")
      return
    }

    onAddressSelect({
      address: selectedLocation.address,
      coordinates: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      },
      additionalInfo: additionalInfo.trim(),
    })

    onClose()
  }

  const handleClose = () => {
    setAdditionalInfo(initialAdditionalInfo)
    setSearchQuery("")
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Seleccionar Dirección</Text>
          <TouchableOpacity onPress={getCurrentLocation} style={styles.locationButton}>
            {loadingLocation ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Ionicons name="locate" size={24} color={Colors.light.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar dirección..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchLocation}
          />
          <TouchableOpacity onPress={searchLocation} style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                title="Dirección seleccionada"
                description={selectedLocation.address}
              />
            )}
          </MapView>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <Text style={styles.loadingText}>Obteniendo dirección...</Text>
            </View>
          )}
        </View>

        {/* Selected Address Info */}
        {selectedLocation && (
          <View style={styles.addressInfo}>
            <Text style={styles.addressLabel}>Dirección seleccionada:</Text>
            <Text style={styles.addressText}>{selectedLocation.address}</Text>
          </View>
        )}

        {/* Additional Info Input */}
        <View style={styles.additionalInfoContainer}>
          <Text style={styles.additionalInfoLabel}>Información adicional (opcional):</Text>
          <TextInput
            style={styles.additionalInfoInput}
            placeholder="Ej: Apartamento 301, timbre azul, referencia..."
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmButton, !selectedLocation && styles.confirmButtonDisabled]}
          onPress={handleConfirmAddress}
          disabled={!selectedLocation}
        >
          <Text style={styles.confirmButtonText}>Confirmar Dirección</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  locationButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f8f8",
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
  },
  addressInfo: {
    padding: 16,
    backgroundColor: "#f8f8f8",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  additionalInfoContainer: {
    padding: 16,
  },
  additionalInfoLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  additionalInfoInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    textAlignVertical: "top",
    minHeight: 60,
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#ccc",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
