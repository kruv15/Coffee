import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { productService, CreateProductData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  validateProductName,
  validatePrice,
  validateStock,
  validateImageUrl,
  validateRequired,
} from '../utils/validation';

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onProductCreated: () => void;
  onAddProduct?: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct?: (product: Product) => void;
  editingProduct?: Product | null;
}

const CATEGORIES = [
  { value: 'café-grano', label: 'Café-Grano' },
  { value: 'café-molido', label: 'Café-Molido' },
  { value: 'capsulas', label: 'Capsulas' },
  { value: 'Café-Instantaneo', label: 'Café-Instantaneo' },
];

export function AddProductModal({
  visible,
  onClose,
  onProductCreated,
  onAddProduct,
  onUpdateProduct,
  editingProduct,
}: AddProductModalProps) {
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomProd: '',
    descripcionProd: '',
    precioProd: '',
    stock: '',
    categoria: 'cafe',
    imagen: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        nomProd: editingProduct.name,
        descripcionProd: editingProduct.description || '',
        precioProd: editingProduct.price.toString(),
        stock: editingProduct.stock?.toString() || '10',
        categoria: editingProduct.category || 'cafe-grano',
        imagen: editingProduct.image,
      });
    } else {
      resetForm();
    }
  }, [editingProduct, visible]);

  const resetForm = () => {
    setFormData({
      nomProd: '',
      descripcionProd: '',
      precioProd: '',
      stock: '',
      categoria: 'cafe',
      imagen: '',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Usar funciones de validación
    const nameValidation = validateProductName(formData.nomProd);
    if (!nameValidation.isValid) {
      newErrors.nomProd = nameValidation.errors[0];
    }

    const descValidation = validateRequired(formData.descripcionProd, 'Descripción');
    if (!descValidation.isValid) {
      newErrors.descripcionProd = descValidation.errors[0];
    } else if (formData.descripcionProd.trim().length < 10) {
      newErrors.descripcionProd = 'La descripción debe tener al menos 10 caracteres';
    } else if (formData.descripcionProd.trim().length > 500) {
      newErrors.descripcionProd = 'La descripción no puede exceder 500 caracteres';
    }

    const priceValidation = validatePrice(formData.precioProd);
    if (!priceValidation.isValid) {
      newErrors.precioProd = priceValidation.errors[0];
    }

    const stockValidation = validateStock(formData.stock);
    if (!stockValidation.isValid) {
      newErrors.stock = stockValidation.errors[0];
    }

    const imageValidation = validateImageUrl(formData.imagen);
    if (!imageValidation.isValid) {
      newErrors.imagen = imageValidation.errors[0];
    }

    // Validar que la categoría sea una de las permitidas
    const allowedCategories = CATEGORIES.map(c => c.value);
    if (!allowedCategories.includes(formData.categoria)) {
      newErrors.categoria = 'Categoría inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error de validación', 'Por favor, corrige los errores antes de continuar.');
      return;
    }

    if (state.isAuthenticated && state.user?.role === 'admin' && state.token) {
      setLoading(true);
      
      try {
        const productData: CreateProductData = {
          nomProd: formData.nomProd.trim(),
          descripcionProd: formData.descripcionProd.trim(),
          precioProd: parseFloat(formData.precioProd),
          stock: parseInt(formData.stock),
          categoria: formData.categoria,
          imagen: formData.imagen.trim(),
        };

        console.log('Sending to API (categoria forced to "cafe"):', JSON.stringify(productData, null, 2));
        console.log('Using admin token:', state.token.substring(0, 30) + '...');

        const result = editingProduct 
          ? await productService.updateProduct(editingProduct.id, productData, state.token)
          : await productService.createProduct(productData, state.token);

        if (result.success) {
          Alert.alert(
            'Éxito',
            `${result.message}\n\n¡El producto se ha guardado en la base de datos!`,
            [
              {
                text: 'OK',
                onPress: () => {
                  resetForm();
                  onClose();
                  onProductCreated();
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Error de Base de Datos', 
            `No se pudo guardar en la base de datos:\n${result.message}\n\n¿Quieres guardarlo localmente?`,
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Guardar Local', 
                onPress: () => handleLocalSave()
              }
            ]
          );
        }
      } catch (error) {
        console.error('Network Error:', error);
        Alert.alert(
          'Error de Conexión', 
          'No se pudo conectar con el servidor.\n¿Quieres guardarlo localmente?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Guardar Local', 
              onPress: () => handleLocalSave()
            }
          ]
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // Si no hay token de admin válido, usar modo local
    handleLocalSave();
  };

  const handleLocalSave = () => {
    // Si hay funciones locales de manejo (para modo local)
    if (onAddProduct && !editingProduct) {
      const newProduct = {
        name: formData.nomProd.trim(),
        price: parseFloat(formData.precioProd),
        image: formData.imagen.trim(),
        description: formData.descripcionProd.trim(),
        stock: parseInt(formData.stock),
        category: formData.categoria,
      };
      onAddProduct(newProduct);
      resetForm();
      onClose();
      Alert.alert('Información', 'Producto guardado localmente (no en base de datos)');
      return;
    }

    if (onUpdateProduct && editingProduct) {
      const updatedProduct = {
        ...editingProduct,
        name: formData.nomProd.trim(),
        price: parseFloat(formData.precioProd),
        image: formData.imagen.trim(),
        description: formData.descripcionProd.trim(),
        stock: parseInt(formData.stock),
        category: formData.categoria,
      };
      onUpdateProduct(updatedProduct);
      resetForm();
      onClose();
      Alert.alert('Información', 'Producto actualizado localmente (no en base de datos)');
      return;
    }

    Alert.alert('Error', 'No se puede guardar el producto. Inicia sesión como administrador.');
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#222" />
              </TouchableOpacity>
              <Text style={styles.title}>
                {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
              </Text>
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
                    onChangeText={(value) => updateField('nomProd', value)}
                  />
                  {errors.nomProd && <Text style={styles.errorText}>{errors.nomProd}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Descripción</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, errors.descripcionProd && styles.inputError]}
                    placeholder="Ej: Tostado medio con notas de chocolate..."
                    value={formData.descripcionProd}
                    onChangeText={(value) => updateField('descripcionProd', value)}
                    multiline
                    numberOfLines={3}
                  />
                  {errors.descripcionProd && <Text style={styles.errorText}>{errors.descripcionProd}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Precio</Text>
                  <TextInput
                    style={[styles.input, errors.precioProd && styles.inputError]}
                    placeholder="Ej: 25000"
                    value={formData.precioProd}
                    onChangeText={(value) => updateField('precioProd', value)}
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
                    onChangeText={(value) => updateField('stock', value)}
                    keyboardType="numeric"
                  />
                  {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Categoría</Text>
                  <View style={styles.categoryContainer}>
                    {CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category.value}
                        style={[
                          styles.categoryOption,
                          formData.categoria === category.value && styles.categorySelected
                        ]}
                        onPress={() => updateField('categoria', category.value)}
                      >
                        <Text style={[
                          styles.categoryText,
                          formData.categoria === category.value && styles.categoryTextSelected
                        ]}>
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.categoria && <Text style={styles.errorText}>{errors.categoria}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>URL de la imagen</Text>
                  <TextInput
                    style={[styles.input, errors.imagen && styles.inputError]}
                    placeholder="https://example.com/imagen.jpg"
                    value={formData.imagen}
                    onChangeText={(value) => updateField('imagen', value)}
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
                    <Text style={styles.submitButtonText}>
                      {editingProduct ? 'Actualizar' : 'Agregar'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  categorySelected: {
    backgroundColor: '#795548',
    borderColor: '#795548',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#795548',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

