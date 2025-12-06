import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
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
  const [selectedPack, setSelectedPack] = useState<string>('250g');
  const [quantity, setQuantity] = useState<number>(1);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedPack('250g');
      setQuantity(1);
    }
  }, [product, visible]);

  if (!product || !visible) return null;

  // Etiquetas legibles para categorías
  const CATEGORY_LABELS: Record<string, string> = {
    'cafe-grano': 'Café-Grano',
    'cafe-molido': 'Café-Molido',
    'capsulas': 'Capsulas',
    'instantaneo': 'Café-Instantaneo',
  };

  // Paquetes disponibles con sus precios relativos
  const PACK_OPTIONS: { label: string; grams: number }[] = [
    { label: '50g', grams: 50 },
    { label: '250g', grams: 250 },
    { label: '500g', grams: 500 },
    { label: '1kg', grams: 1000 },
  ];

  // Asumimos que product.price corresponde al precio para 250g
  const basePackGrams = 250;
  const priceNumber = Number(product.price) || 0;
  const pricePerGram = priceNumber && basePackGrams ? priceNumber / basePackGrams : 0;

  const packs: Pack[] = PACK_OPTIONS.map((p) => ({
    label: p.label,
    price: (pricePerGram ? pricePerGram * p.grams : priceNumber).toFixed(2),
  }));

  const getPrice = (): string => {
    const pack = packs.find((p: Pack) => p.label === selectedPack);
    return (parseFloat(pack?.price || '0') * quantity).toFixed(2);
  };

  const handleAddToCart = () => {
    const selectedPackData = packs.find((p: Pack) => p.label === selectedPack);
    if (selectedPackData) {
      onAddToCart({
        ...product,
        stock: product.stock ?? 0,
        pack: selectedPack,
        price: Number.parseFloat(selectedPackData.price),
        quantity,
      });
      onClose();
    }
  };

  const startHold = (callback: () => void) => {
    callback();
    intervalRef.current = setInterval(callback, 120); // Repite
  };

  const stopHold = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
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

          <Text style={styles.category}>{CATEGORY_LABELS[product.category || ''] || product.category || 'Café'}</Text>

          <Text style={styles.packLabel}>Tamaño del Paquete</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.packCarrusel}
            contentContainerStyle={styles.packContainer}
          >
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
                  {pack.label} - Bs{Number(pack.price).toFixed(2)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[
                styles.qtyButton,
                quantity === 1 && { opacity: 0.4 }
              ]}
              disabled={quantity === 1}
              onPress={() => setQuantity(q => Math.max(1, q - 1))}
              onPressIn={() => {
                if (quantity > 1) startHold(() => setQuantity(q => Math.max(1, q - 1)));
              }}
              onPressOut={stopHold}
            >
              <Ionicons name="remove" size={20} color="#222" />
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={[
                styles.qtyButton,
                quantity >= (product.stock ?? 0) && { opacity: 0.4 }
              ]}
              disabled={quantity >= (product.stock ?? 0)}
              onPress={() => setQuantity(q => Math.min(product.stock ?? 0, q + 1))}
              onPressIn={() => {
                if (quantity < (product.stock ?? 0))
                  startHold(() => setQuantity(q => Math.min(product.stock ?? 0, q + 1)));
              }}
              onPressOut={stopHold}
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
  packCarrusel: {
    marginBottom: 16,
  },
  packContainer: {
    flexDirection: "row",
    paddingRight: 12,
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
