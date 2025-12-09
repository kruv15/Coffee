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
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { cloudinaryService } from "../services/cloudinaryService"
import type { Product, Category } from "../types"
import { productService, type CreateProductData } from "../services/api"
import { categoriaService } from "../services/categoriaService"
import { AddCategoryModal } from "./AddCategoryModal"
import { useAuth } from "../context/AuthContext"
import { validateProductName, validateStock, validateImageUrl, validateRequired } from "../utils/validation"

interface AddProductModalProps {
  visible: boolean
  onClose: () => void
  onProductCreated: () => void
  onAddProduct?: (product: Omit<Product, "_id">) => void
  onUpdateProduct?: (product: Product) => void
  editingProduct?: Product | null
  onReloadProducts?: () => void
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
  onReloadProducts,
}: AddProductModalProps) {
  const { state } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [cargandoCategorias, setCargandoCategorias] = useState(false)
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [categorias, setCategorias] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    nomProd: "",
    descripcionProd: "",
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
      } else {
        setTamanos([])
      }
      setNuevoTamano({ nombre: "", precio: "" })
      setUnidadTamano("gr")
    } else {
      resetForm()
    }
  }, [editingProduct])

  const resetForm = () => {
    setFormData({
      nomProd: "",
      descripcionProd: "",
      stock: "",
      categoria: "",
      imagen: "",
    })
    setTamanos([])
    setNuevoTamano({ nombre: "", precio: "" })
    setErrors({})
    setImagePreview("")
  }

  function convertirGrAKg(valorGr: number): number {
    if (valorGr >= 1000) {
      return valorGr / 1000
    }
    return valorGr
  }

  function convertirKgAGr(valorKg: number): number {
    if (valorKg < 1) {
      return valorKg * 1000
    }
    return valorKg
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

    let cantidad = Number(nuevoTamano.nombre);
    let nombreFinal = "";

    if (unidadTamano === "gr") {
      // si supera 1000gr → convertir a kg
      if (cantidad >= 1000) {
        const kg = convertirGrAKg(cantidad);
        nombreFinal = `${kg}kg`;
      } else {
        nombreFinal = `${cantidad}gr`;
      }
    }

    if (unidadTamano === "kg") {
      // si es menor a 1kg → convertir a gr
      if (cantidad < 1) {
        const gr = convertirKgAGr(cantidad);
        nombreFinal = `${gr}gr`;
      } else {
        nombreFinal = `${cantidad}kg`;
      }
    }

    setTamanos([...tamanos, { nombre: nombreFinal, precio: nuevoTamano.precio }]);

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
    } else if (formData.descripcionProd.trim().length < 5) {
      newErrors.descripcionProd = "La descripción debe tener al menos 5 caracteres"
    } else if (formData.descripcionProd.trim().length > 500) {
      newErrors.descripcionProd = "La descripción no puede exceder 500 caracteres"
    }

    const stockValidation = validateStock(formData.stock)
    if (!stockValidation.isValid) {
      newErrors.stock = stockValidation.errors[0]
    }

    // Validación de imagen
    if (!imagePreview) {
      // Caso URL → debe verificarse
      if (!formData.imagen.trim()) {
        newErrors.imagen = "Debes ingresar una URL o seleccionar una imagen."
      } else {
        const imageValidation = validateImageUrl(formData.imagen.trim())
        if (!imageValidation.isValid) newErrors.imagen = imageValidation.errors[0]
      }
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
    try {
      // and pass the correct image URL to the backend
      let imagenFinal = formData.imagen.trim()

      // Subir imagen si viene de la galería
      if (imagePreview && !imagenFinal) {
        setUploadingImage(true)

        const url = await cloudinaryService.subirImagen(imagePreview, `producto_${Date.now()}.jpg`)

        setUploadingImage(false)

        if (!url) {
          Alert.alert("Error", "No se pudo subir la imagen a Cloudinary.")
          return
        }

        imagenFinal = url
      }

      // Validar que tenemos una imagen válida
      if (!imagenFinal) {
        Alert.alert("Error", "Debes proporcionar una imagen (galería o URL)")
        return
      }

      // Validar el formulario
      const newErrors: Record<string, string> = {}

      const nameValidation = validateProductName(formData.nomProd)
      if (!nameValidation.isValid) {
        newErrors.nomProd = nameValidation.errors[0]
      }

      const descValidation = validateRequired(formData.descripcionProd, "Descripción")
      if (!descValidation.isValid) {
        newErrors.descripcionProd = descValidation.errors[0]
      } else if (formData.descripcionProd.trim().length < 5) {
        newErrors.descripcionProd = "La descripción debe tener al menos 5 caracteres"
      } else if (formData.descripcionProd.trim().length > 500) {
        newErrors.descripcionProd = "La descripción no puede exceder 500 caracteres"
      }

      const stockValidation = validateStock(formData.stock)
      if (!stockValidation.isValid) {
        newErrors.stock = stockValidation.errors[0]
      }

      if (!formData.categoria) {
        newErrors.categoria = "Selecciona una categoría"
      }

      if (tamanos.length === 0) {
        newErrors.tamanos = "Agrega al menos un tamaño"
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        Alert.alert("Formulario incompleto", "Corrige los campos resaltados.")
        return
      }

      if (!state.isAuthenticated || state.user?.rol !== "admin" || !state.token) {
        Alert.alert("Permiso denegado", "Debes iniciar sesión como administrador.")
        return
      }

      setLoading(true)

      const tamanosFormateados = tamanos.map((t) => ({
        nombre: t.nombre.trim(),
        precio: Number(t.precio),
      }))

      console.log("[v0] Tamaños formateados para enviar:", tamanosFormateados)
      console.log("[v0] Producto data completo:", {
        nomProd: formData.nomProd.trim(),
        descripcionProd: formData.descripcionProd.trim(),
        stock: Number(formData.stock),
        categoria: formData.categoria.trim(),
        imagen: imagenFinal,
        tamanos: tamanosFormateados,
      })

      const productData: CreateProductData = {
        nomProd: formData.nomProd.trim(),
        descripcionProd: formData.descripcionProd.trim(),
        stock: Number(formData.stock),
        categoria: formData.categoria.trim(),
        imagen: imagenFinal,
        tamanos: tamanosFormateados,
      }

      const result = editingProduct
        ? await productService.updateProduct(editingProduct._id, productData, state.token)
        : await productService.createProduct(productData, state.token)

      if (!result.success) {
        console.log("[v0] Error response from backend:", result)
        Alert.alert("Error", result.message || "No se pudo procesar el producto.")
        return
      }

      Alert.alert("Éxito", editingProduct ? "Producto actualizado correctamente" : "Producto creado correctamente")

      if (editingProduct) {
        onUpdateProduct?.(result.data)
      } else {
        onProductCreated?.()
      }

      onReloadProducts?.()

      resetForm()
      onClose()
    } catch (error) {
      console.error("[handleSubmit] Error crítico:", error)
      Alert.alert("Error inesperado", "Algo salió mal. Inténtalo nuevamente.")
    } finally {
      setLoading(false)
    }
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

  const seleccionarImagen = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permiso requerido", "Se requiere permiso para acceder a la galería")
        return
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (resultado.canceled) return

      const imageUri = resultado.assets[0].uri

      // Mostrar la imagen seleccionada
      setImagePreview(imageUri)

      // Limpiar URL si hubiera
      updateField("imagen", "")
    } catch (error) {
      console.error("Error seleccionando imagen:", error)
      Alert.alert("Error", "Ocurrió un error al seleccionar la imagen")
    }
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
                    {errors.tamanos && <Text style={styles.errorText}>{errors.tamanos}</Text>}

                    {/* Lista de tamaños agregados */}
                    {tamanos.length > 0 && (
                      <View style={styles.tamanosList}>
                        {tamanos.map((tamano, index) => (
                          <View key={index} style={styles.tamanoItem}>
                            <View>
                              <Text style={styles.tamanoNombre}>{tamano.nombre}</Text>
                              <Text style={styles.tamanoPrecio}>Bs {tamano.precio}</Text>
                            </View>

                            <TouchableOpacity onPress={() => eliminarTamano(index)}>
                              <Ionicons name="trash" size={20} color="#e74c3c" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Área para agregar tamaño */}
                    <View style={styles.addTamanoSection}>
                      <Text style={styles.subLabel}>Agregar Tamaño</Text>

                      {/* Unidad gr / kg como EDITAR */}
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

                      {/* Inputs EXACTOS de editar */}
                      <TextInput
                        style={styles.input}
                        placeholder="Ej: 250"
                        value={nuevoTamano.nombre}
                        onChangeText={(value) => {
                        let limpio = value;

                        if (unidadTamano === "gr") {
                          // Solo números permitidos
                          limpio = value.replace(/[^0-9]/g, "");
                        } else {
                          // Para kg permitir decimales
                          limpio = value
                            .replace(/,/g, ".")                // convertir coma a punto
                            .replace(/[^0-9.]/g, "")           // solo números y punto
                            .replace(/(\..*)\./g, "$1");       // evitar más de un punto
                        }

                        setNuevoTamano({ ...nuevoTamano, nombre: limpio });
                      }}
                        keyboardType="numeric"
                      />

                      <TextInput
                        style={[styles.input, { marginTop: 10 }]}
                        placeholder="Precio"
                        value={nuevoTamano.precio}
                        onChangeText={(value) => {
                          let sanitized = value.replace(/[^0-9.]/g, "")

                          // Evita múltiples puntos decimales
                          sanitized = sanitized.replace(/(\..*)\./g, "$1")

                          // Limita a 2 decimales mientras escribe
                          sanitized = sanitized.replace(/^(\d+)\.(\d{0,2}).*$/, "$1.$2")

                          setNuevoTamano({ ...nuevoTamano, precio: sanitized })
                        }}
                        onBlur={() => {
                          if (nuevoTamano.precio) {
                            const num = Number(nuevoTamano.precio)
                            setNuevoTamano({
                              ...nuevoTamano,
                              precio: num.toFixed(2),
                            })
                          }
                        }}
                        keyboardType="numeric"
                      />

                      {/* Botón igual a EDITAR */}
                      <TouchableOpacity style={styles.agregarTamanoButton} onPress={agregarTamano}>
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.agregarTamanoButtonText}>Agregar Tamaño</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Imagen del Producto</Text>

                    {imagePreview !== "" && (
                      <View style={styles.imagePreviewContainer}>
                        <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
                      </View>
                    )}

                    {/* BOTÓN ELIMINAR IMAGEN */}
                    {imagePreview !== "" && (
                      <TouchableOpacity
                        style={styles.deleteImageButton}
                        onPress={() => {
                          setImagePreview("")
                          if (!editingProduct) {
                            updateField("imagen", "")
                          }
                        }}
                      >
                        <Ionicons name="trash" size={20} color="#fff" />
                        <Text style={{ color: "#fff", marginLeft: 8 }}>Eliminar Imagen</Text>
                      </TouchableOpacity>
                    )}

                    {/* BOTÓN SUBIR IMAGEN */}
                    {!imagePreview && formData.imagen.trim() === "" && (
                      <>
                        <TouchableOpacity
                          style={[styles.selectImageButton, uploadingImage && styles.disabledButton]}
                          onPress={seleccionarImagen}
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="cloud-upload" size={20} color="#fff" />
                              <Text style={styles.selectImageButtonText}>Subir Imagen a Cloudinary</Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <Text style={styles.orText}>O pega una URL:</Text>
                      </>
                    )}

                    {!imagePreview && (
                      <TextInput
                        style={[styles.input, errors.imagen && styles.inputError]}
                        placeholder="https://example.com/imagen.jpg"
                        value={formData.imagen}
                        onChangeText={(value) => {
                          if (imagePreview !== "") setImagePreview("")
                          updateField("imagen", value)
                        }}
                        autoCapitalize="none"
                        editable={!uploadingImage}
                      />
                    )}
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
  addTamanoContainer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
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
  agregarTamanoButton: {
    backgroundColor: "#795548",
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minWidth: 100,
    paddingHorizontal: 10,
  },
  agregarTamanoButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
  selectImageButton: {
    backgroundColor: "#795548",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  selectImageButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  imagePreviewContainer: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePreviewText: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "#fff",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orText: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    marginBottom: 8,
    fontStyle: "italic",
  },
  deleteImageButton: {
    backgroundColor: "#e74c3c",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
})
