import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CartItem, Pack, Product } from '../types';

interface ProductDetailModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export function ProductDetailModal({ visible, product, onClose, onAddToCart }: ProductDetailModalProps) {
  const [selectedPack, setSelectedPack] = useState<string>('50g');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (visible) {
      setSelectedPack('50g');
      setQuantity(1);
    }
  }, [product, visible]);

  if (!product || !visible) return null;

  const packs: Pack[] = [
    { label: '50g', price: product.price.toFixed(2) }
  ];

  const getPrice = (): string => {
    const pack = packs.find((p: Pack) => p.label === selectedPack);
    return (parseFloat(pack?.price || '0') * quantity).toFixed(2);
  };

  const handleAddToCart = () => {
    const selectedPackData = packs.find((p: Pack) => p.label === selectedPack);
    if (selectedPackData) {
      onAddToCart({
        ...product,
        pack: selectedPack,
        price: parseFloat(selectedPackData.price),
        quantity,
      });
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={styles.title}>Detalle del Producto</Text>
            <Ionicons name="heart-outline" size={26} color="#222" />
          </View>

          <Image source={{ uri: product.image }} style={styles.modalImage} resizeMode="contain" />

          <View style={styles.productHeader}>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color="#fff" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>

          <Text style={styles.category}>Granos de Café</Text>

          <Text style={styles.packLabel}>Tamaño del Paquete</Text>
          <View style={styles.packContainer}>
            {packs.map((pack: Pack) => (
              <Pressable
                key={pack.label}
                onPress={() => setSelectedPack(pack.label)}
                style={[
                  styles.packButton,
                  selectedPack === pack.label && styles.packButtonSelected,
                ]}
              >
                <Text style={[
                  styles.packButtonText,
                  selectedPack === pack.label && styles.packButtonTextSelected
                ]}>
                  {pack.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => setQuantity((q: number) => Math.max(1, q - 1))}
            >
              <Ionicons name="remove" size={20} color="#222" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => setQuantity((q: number) => q + 1)}
            >
              <Ionicons name="add" size={20} color="#222" />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>Precio Total:</Text>
              <Text style={styles.totalPrice}>{`Bs${getPrice()}`}</Text>
            </View>
            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={handleAddToCart}
            >
              <Ionicons name="cart" size={20} color="#fff" />
              <Text style={styles.addToCartText}>Agregar al carrito</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 520,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalImage: {
    width: '100%',
    height: 180,
    marginVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFB300',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  ratingText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  category: {
    color: '#888',
    marginBottom: 8,
  },
  packLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  packContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  packButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 12,
  },
  packButtonSelected: {
    backgroundColor: '#222',
  },
  packButtonText: {
    color: '#888',
    fontWeight: 'bold',
  },
  packButtonTextSelected: {
    color: '#fff',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  quantityText: {
    marginHorizontal: 16,
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    color: '#888',
    fontSize: 14,
  },
  totalPrice: {
    fontWeight: 'bold',
    fontSize: 22,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  addToCartText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
