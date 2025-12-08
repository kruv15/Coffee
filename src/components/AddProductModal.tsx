"use client"

import React, { useState, useEffect } from "react"
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Product, Category } from "../types"
import { productService, type CreateProductData } from "../services/api"
import { categoriaService } from "../services/categoriaService"
import { AddCategoryModal } from "./AddCategoryModal"
import { useAuth } from "../context/AuthContext"
import {
  validateProductName,
  validatePrice,
  validateStock,
  validateImageUrl,
  validateRequired,
} from "../utils/validation"

interface AddProductModalProps {
  visible: boolean
  onClose: () => void
  onProductCreated: () => void
  onAddProduct?: (product: Omit<Product, "_id">) => void
  onUpdateProduct?: (product: Product) => void
  editingProduct?: Product | null
}

interface FormTamano {
  nombre: string
  precio: string
}

export function AddProductModal({
  visible,
  onClose,
  onProductCreated,
  onAddProduct,
  onUpdateProduct,
  editingProduct,
}: AddProductModalProps) {
  const { state } = useAuth()
  const [loading, setLoading] = useState(false)
  const [cargandoCategorias, setCargandoCategorias] = useState(false)
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false)
  const [categorias, setCategorias] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    nomProd: "",
    descripcionProd: "",
    precioProd: "",
    stock: "",
    categoria: "" as string,
    imagen: "",
  })
  const [tamanos, setTamanos] = useState<FormTamano[]>([])
  const [nuevoTamano, setNuevoTamano] = useState<FormTamano>({
    nombre: "",
    precio: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [unidadTamano, setUnidadTamano] = useState<"gr" | "kg">("gr")

  useEffect(() => {
    if (visible) {
      cargarCategorias()
    }
  }, [visible])

  const cargarCategorias = async () => {
    setCargandoCategorias(true)
    try {
      const resultado = await categoriaService.obtenerCategoriasBasicas()
      if (resultado.success && resultado.data) {
        setCategorias(resultado.data)
      } else {
        Alert.alert("Error", "No se pudieron cargar las categorías")
      }
    } catch (error) {
      console.error("Error cargando categorías:", error)
      Alert.alert("Error", "Error al cargar categorías")
    } finally {
      setCargandoCategorias(false)
    }
  }

  const handleCategoryCreated = (nuevoCategoria: { _id: string; nombre: string }) => {
    setCategorias([...categorias, nuevoCategoria])
    updateField("categoria", nuevoCategoria._id)
    setMostrarModalCategoria(false)
  }

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        nomProd: editingProduct.nomProd,
        descripcionProd: editingProduct.descripcionProd || "",
        precioProd: editingProduct.precioProd.toString(),
        stock: editingProduct.stock?.toString() || "10",
        categoria:
          typeof editingProduct.categoria === "string" ? editingProduct.categoria : editingProduct.categoria._id,
        imagen: editingProduct.imagen,
      })
      if (editingProduct.tamanos && editingProduct.tamanos.length > 0) {
        setTamanos(
          editingProduct.tamanos.map((t) => ({
            nombre: t.nombre,
            precio: t.precio.toString(),
          })),
        )
      }
    } else {
      resetForm()
    }
  }, [editingProduct])

  const resetForm = () => {
    setFormData({
      nomProd: "",
      descripcionProd: "",
      precioProd: "",
      stock: "",
      categoria: "",
      imagen: "",
    })
    setTamanos([])
    setNuevoTamano({ nombre: "", precio: "" })
    setErrors({})
  }

  const agregarTamano = () => {
    if (!nuevoTamano.nombre.trim()) {
      Alert.alert("Error", "Ingresa el nombre del tamaño");
      return;
    }

    if (!nuevoTamano.precio || Number(nuevoTamano.precio) <= 0) {
      Alert.alert("Error", "Ingresa un precio válido para el tamaño");
      return;
    }

    const nombreCompleto = nuevoTamano.nombre + unidadTamano;

    setTamanos([
      ...tamanos,
      { nombre: nombreCompleto, precio: nuevoTamano.precio }
    ]);

    setNuevoTamano({ nombre: "", precio: "" });
  };

  const eliminarTamano = (index: number) => {
    setTamanos(tamanos.filter((_, i) => i !== index))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    const nameValidation = validateProductName(formData.nomProd)
    if (!nameValidation.isValid) {
      newErrors.nomProd = nameValidation.errors[0]
    }

    const descValidation = validateRequired(formData.descripcionProd, "Descripción")
    if (!descValidation.isValid) {
      newErrors.descripcionProd = descValidation.errors[0]
    } else if (formData.descripcionProd.trim().length < 10) {
      newErrors.descripcionProd = "La descripción debe tener al menos 10 caracteres"
    } else if (formData.descripcionProd.trim().length > 500) {
      newErrors.descripcionProd = "La descripción no puede exceder 500 caracteres"
    }

    const priceValidation = validatePrice(formData.precioProd)
    if (!priceValidation.isValid) {
      newErrors.precioProd = priceValidation.errors[0]
    }

    const stockValidation = validateStock(formData.stock)
    if (!stockValidation.isValid) {
      newErrors.stock = stockValidation.errors[0]
    }

    const imageValidation = validateImageUrl(formData.imagen)
    if (!imageValidation.isValid) {
      newErrors.imagen = imageValidation.errors[0]
    }

    if (!formData.categoria) {
      newErrors.categoria = "Selecciona una categoría"
    }

    if (tamanos.length === 0) {
      newErrors.tamanos = "Agrega al menos un tamaño"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Error de validación", "Por favor, corrige los errores antes de continuar.")
      return
    }

    if (state.isAuthenticated && state.user?.rol === "admin" && state.token) {
      console.log("🔑 Admin detected - using API mode")
      setLoading(true)

      try {
        const tamanosFormateados = tamanos.map((t) => ({
          nombre: t.nombre.trim(),
          precio: Number(t.precio),
        }))

        const productData: CreateProductData = {
          nomProd: formData.nomProd.trim(),
          descripcionProd: formData.descripcionProd.trim(),
          precioProd: Number.parseFloat(formData.precioProd),
          stock: Number.parseInt(formData.stock),
          categoria: formData.categoria,
          imagen: formData.imagen.trim(),
          tamanos: tamanosFormateados,
        }

        if (editingProduct) {
          console.log("📝 Editando producto existente:", editingProduct._id)
          const result = await productService.updateProduct(editingProduct._id, productData, state.token)

          if (result.success) {
            Alert.alert("Éxito", "Producto actualizado correctamente")
            if (onUpdateProduct) {
              onUpdateProduct(result.data || editingProduct)
            }
            if (onProductCreated) {
              onProductCreated()
            }
            resetForm()
            onClose()
          } else {
            Alert.alert("Error", result.message || "No se pudo actualizar el producto")
            console.error("❌ Error en respuesta:", result)
          }
        } else {
          console.log("✨ Creando nuevo producto")
          const result = await productService.createProduct(productData, state.token)

          if (result.success) {
            Alert.alert("Éxito", "Producto creado correctamente")
            if (onProductCreated) {
              onProductCreated()
            }
            resetForm()
            onClose()
          } else {
            Alert.alert("Error", result.message || "No se pudo crear el producto")
            console.error("❌ Error en respuesta:", result)
          }
        }
      } catch (error) {
        console.error("❌ Network Error:", error)
        Alert.alert("Error de Conexión", "No se pudo conectar con el servidor.")
      } finally {
        setLoading(false)
      }
      return
    }

    console.log("⚠️ No admin token - using local mode")
    handleLocalSave()
  }

  const handleLocalSave = () => {
    const tamanosFormateados = tamanos.map((t) => ({
      nombre: t.nombre.trim(),
      precio: Number(t.precio),
    }))

    if (onAddProduct && !editingProduct) {
      const newProduct: Omit<Product, "_id"> = {
        nomProd: formData.nomProd.trim(),
        descripcionProd: formData.descripcionProd.trim(),
        precioProd: Number(formData.precioProd),
        stock: Number(formData.stock),
        categoria: formData.categoria,
        imagen: formData.imagen.trim(),
        tamanos: tamanosFormateados,
      }
      onAddProduct(newProduct)
      resetForm()
      onClose()
      Alert.alert("Información", "Producto guardado localmente (no en base de datos)")
      return
    }

    if (onUpdateProduct && editingProduct) {
      const updatedProduct: Product = {
        ...editingProduct,
        nomProd: formData.nomProd.trim(),
        precioProd: Number(formData.precioProd),
        imagen: formData.imagen.trim(),
        descripcionProd: formData.descripcionProd.trim(),
        stock: Number(formData.stock),
        categoria: formData.categoria,
        tamanos: tamanosFormateados,
      }
      onUpdateProduct(updatedProduct)
      resetForm()
      onClose()
      Alert.alert("Información", "Producto actualizado localmente (no en base de datos)")
      return
    }

    Alert.alert("Error", "No se puede guardar el producto. Inicia sesión como administrador.")
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#222" />
                </TouchableOpacity>
                <Text style={styles.title}>{editingProduct ? "Editar Producto" : "Agregar Producto"}</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nombre del producto</Text>
                    <TextInput
                      style={[styles.input, errors.nomProd && styles.inputError]}
                      placeholder="Ej: Café Colombiano Premium"
                      value={formData.nomProd}
                      onChangeText={(value) => updateField("nomProd", value)}
                    />
                    {errors.nomProd && <Text style={styles.errorText}>{errors.nomProd}</Text>}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Descripción</Text>
                    <TextInput
                      style={[styles.input, styles.textArea, errors.descripcionProd && styles.inputError]}
                      placeholder="Ej: Tostado medio con notas de chocolate..."
                      value={formData.descripcionProd}
                      onChangeText={(value) => updateField("descripcionProd", value)}
                      multiline
                      numberOfLines={3}
                    />
                    {errors.descripcionProd && <Text style={styles.errorText}>{errors.descripcionProd}</Text>}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Precio Base</Text>
                    <TextInput
                      style={[styles.input, errors.precioProd && styles.inputError]}
                      placeholder="Ej: 25000"
                      value={formData.precioProd}
                      onChangeText={(value) => updateField("precioProd", value)}
                      keyboardType="numeric"
                    />
                    {errors.precioProd && <Text style={styles.errorText}>{errors.precioProd}</Text>}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Stock</Text>
                    <TextInput
                      style={[styles.input, errors.stock && styles.inputError]}
                      placeholder="Ej: 50"
                      value={formData.stock}
                      onChangeText={(value) => updateField("stock", value)}
                      keyboardType="numeric"
                    />
                    {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.categoryHeaderContainer}>
                      <Text style={styles.label}>Categoría</Text>
                      {state.isAuthenticated && state.user?.rol === "admin" && (
                        <TouchableOpacity
                          style={styles.addCategoryButton}
                          onPress={() => setMostrarModalCategoria(true)}
                        >
                          <Ionicons name="add-circle" size={20} color="#795548" />
                          <Text style={styles.addCategoryButtonText}>Nueva</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {cargandoCategorias ? (
                      <ActivityIndicator size="small" color="#795548" />
                    ) : (
                      <View style={styles.categoryContainer}>
                        {categorias.length > 0 ? (
                          categorias.map((category) => (
                            <TouchableOpacity
                              key={category._id}
                              style={[
                                styles.categoryOption,
                                formData.categoria === category._id && styles.categorySelected,
                              ]}
                              onPress={() => updateField("categoria", category._id)}
                            >
                              <Text
                                style={[
                                  styles.categoryText,
                                  formData.categoria === category._id && styles.categoryTextSelected,
                                ]}
                              >
                                {category.nombre}
                              </Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <Text style={styles.errorText}>No hay categorías disponibles</Text>
                        )}
                      </View>
                    )}
                    {errors.categoria && <Text style={styles.errorText}>{errors.categoria}</Text>}
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Tamaños y Precios</Text>
                    {tamanos.length > 0 && (
                      <View style={styles.tamanosList}>
                        {tamanos.map((tamano, index) => (
                          <View key={index} style={styles.tamanoItem}>
                            <View style={styles.tamanoInfo}>
                              <Text style={styles.tamanoNombre}>{tamano.nombre}</Text>
                              <Text style={styles.tamanoPrecio}>${"Bs " + tamano.precio}</Text>
                            </View>
                            <TouchableOpacity onPress={() => eliminarTamano(index)}>
                              <Ionicons name="trash" size={20} color="#e74c3c" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                    {errors.tamanos && <Text style={styles.errorText}>{errors.tamanos}</Text>}

                    <View style={styles.addTamanoSection}>
                      <Text style={styles.subLabel}>Agregar Tamaño</Text>
                      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                        <TouchableOpacity
                          style={{
                            borderWidth: 1,
                            borderColor: unidadTamano === "gr" ? "#795548" : "#ddd",
                            backgroundColor: unidadTamano === "gr" ? "#795548" : "#fff",
                            padding: 10,
                            borderRadius: 8,
                            width: 60,
                            alignItems: "center",
                          }}
                          onPress={() => setUnidadTamano("gr")}
                        >
                          <Text style={{ color: unidadTamano === "gr" ? "#fff" : "#333" }}>gr</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            borderWidth: 1,
                            borderColor: unidadTamano === "kg" ? "#795548" : "#ddd",
                            backgroundColor: unidadTamano === "kg" ? "#795548" : "#fff",
                            padding: 10,
                            borderRadius: 8,
                            width: 60,
                            alignItems: "center",
                          }}
                          onPress={() => setUnidadTamano("kg")}
                        >
                          <Text style={{ color: unidadTamano === "kg" ? "#fff" : "#333" }}>kg</Text>
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={styles.tamanoInput}
                        placeholder="Ej: 250"
                        keyboardType="numeric"
                        value={nuevoTamano.nombre}
                        onChangeText={(value) => {
                          let soloNumeros = value.replace(/[^0-9]/g, "");

                          if (!soloNumeros) {
                            setNuevoTamano({ ...nuevoTamano, nombre: "" });
                            return;
                          }

                          let num = Number(soloNumeros);

                          // Conversión automática de unidades
                          if (unidadTamano === "gr" && num >= 1000) {
                            // convertir gr → kg
                            const kg = num / 1000;
                            setUnidadTamano("kg"); // cambia visualmente el botón
                            soloNumeros = kg.toString();
                          }

                          if (unidadTamano === "kg" && num < 1) {
                            // convertir kg → gr
                            const gramos = num * 1000;
                            setUnidadTamano("gr");
                            soloNumeros = gramos.toString();
                          }

                          setNuevoTamano({ ...nuevoTamano, nombre: soloNumeros });
                        }}
                      />
                      <TextInput
                        style={styles.tamanoInput}
                        placeholder="Precio"
                        value={nuevoTamano.precio}
                        onChangeText={(value) => {
                          const soloNumeros = value.replace(/[^0-9.]/g, "")
                          setNuevoTamano({ ...nuevoTamano, precio: soloNumeros })
                        }}
                        keyboardType="numeric"
                      />
                      <TouchableOpacity style={styles.addTamanoButton} onPress={agregarTamano}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.addTamanoButtonText}>Agregar Tamaño</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>URL de la imagen</Text>
                    <TextInput
                      style={[styles.input, errors.imagen && styles.inputError]}
                      placeholder="https://example.com/imagen.jpg"
                      value={formData.imagen}
                      onChangeText={(value) => updateField("imagen", value)}
                      autoCapitalize="none"
                    />
                    {errors.imagen && <Text style={styles.errorText}>{errors.imagen}</Text>}
                  </View>

                  <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>{editingProduct ? "Actualizar" : "Agregar"}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AddCategoryModal
        visible={mostrarModalCategoria}
        onClose={() => setMostrarModalCategoria(false)}
        onCategoryCreated={handleCategoryCreated}
        adminToken={state.token || ""}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  categoryHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  addCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  addCategoryButtonText: {
    color: "#795548",
    fontSize: 13,
    fontWeight: "600",
  },
  subLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#e74c3c",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 14,
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f8f8f8",
  },
  categorySelected: {
    backgroundColor: "#795548",
    borderColor: "#795548",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  categoryTextSelected: {
    color: "#fff",
  },
  tamanosList: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tamanoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tamanoInfo: {
    flex: 1,
  },
  tamanoNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  tamanoPrecio: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  addTamanoSection: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tamanoInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  addTamanoButton: {
    backgroundColor: "#795548",
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addTamanoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#795548",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
})
