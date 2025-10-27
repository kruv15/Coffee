import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Product } from '../types';

interface AdminPanelProps {
  visible: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export function AdminPanel({
  visible,
  onClose,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
}: AdminPanelProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleAddProduct = () => {
    if (!name || !price || !image) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Por favor, ingresa un precio válido');
      return;
    }

    onAddProduct({
      name,
      price: priceNum,
      image,
    });

    setName('');
    setPrice('');
    setImage('');
    Alert.alert('Éxito', 'Producto agregado correctamente');
  };

  const handleUpdateProduct = () => {
    if (!editingProduct || !name || !price || !image) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Error', 'Por favor, ingresa un precio válido');
      return;
    }

    onUpdateProduct({
      ...editingProduct,
      name,
      price: priceNum,
      image,
    });

    setEditingProduct(null);
    setName('');
    setPrice('');
    setImage('');
    Alert.alert('Éxito', 'Producto actualizado correctamente');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setImage(product.image);
  };

  const handleDeleteProduct = (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDeleteProduct(id),
        },
      ]
    );
  };

  const resetForm = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setImage('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={styles.title}>Panel de Administración</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.scrollContainer}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>
                {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
              </Text>

              <Text style={styles.label}>Nombre del producto</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Café Espresso"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Precio</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 45"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />

              <Text style={styles.label}>URL de la imagen</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                value={image}
                onChangeText={setImage}
                autoCapitalize="none"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={editingProduct ? handleUpdateProduct : handleAddProduct}
                >
                  <Text style={styles.primaryButtonText}>
                    {editingProduct ? 'Actualizar' : 'Agregar'}
                  </Text>
                </TouchableOpacity>

                {editingProduct && (
                  <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
                    <Text style={styles.secondaryButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.productsSection}>
              <Text style={styles.sectionTitle}>Productos Existentes</Text>
              {products.map((product) => (
                <View key={product.id} style={styles.productItem}>
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productPrice}>Bs{product.price}</Text>
                  </View>
                  <View style={styles.productActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditProduct(product)}
                    >
                      <Ionicons name="pencil" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteProduct(product.id)}
                    >
                      <Ionicons name="trash" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '95%',
    height: '90%',
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  scrollContainer: {
    flex: 1,
  },
  formSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
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
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#795548',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productsSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 24,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#795548',
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 8,
  },
});

