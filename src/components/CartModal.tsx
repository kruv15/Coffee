import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CartItem } from '../types';

interface CartModalProps {
  visible: boolean;
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (item: CartItem, newQty: number) => void;
  onRemoveItem?: (item: CartItem) => void
}

export function CartModal({ visible, cart, onClose, onUpdateQuantity, onRemoveItem }: CartModalProps) {
  const items = cart.reduce((sum: number, item: CartItem) => sum + item.precioProd * item.cantidad, 0);
  const discounts = 0;
  const total = items - discounts;
  const totalItems = cart.reduce((sum: number, item: CartItem) => sum + item.cantidad, 0);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = (callback: () => void) => {
    intervalRef.current = setTimeout(() => {
      intervalRef.current = setInterval(callback, 120)
    }, 300)
  };

  const stopHold = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      return;
    }
    
    // Cerrar el modal primero
    onClose();
    
    // Navegar a la pantalla de checkout con los datos del carrito
    router.push({
      pathname: '/checkout',
      params: {
        cart: JSON.stringify(cart),
        total: total.toString(),
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { minHeight: 420 }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={styles.title}>Mi Carrito</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.infoBanner}>
            <Ionicons name="lock-closed-outline" size={18} color="#FF9800" />
            <Text style={styles.infoText}>
              {`Tienes ${totalItems} artículos en tu carrito`}
            </Text>
          </View>

          <ScrollView style={styles.cartList}>
            {cart.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Tu carrito está vacío.</Text>
              </View>
            ) : (
              cart.map((item: CartItem) => (
                <View key={`${item._id}-${item.tamano}`} style={styles.cartItem}>
                  <Image source={{ uri: item.imagen }} style={styles.itemImage} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>{item.nomProd}</Text>
                    <Text style={styles.itemDetails}>{`${item.tamano} • Granos`}</Text>
                    <Text style={styles.itemPrice}>{`Bs${item.precioProd.toFixed(2)}`}</Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={[
                        styles.qtyButton,
                        item.cantidad === 1 && { opacity: 0.4 }
                      ]}
                      disabled={item.cantidad === 1}
                      onPress={() => onUpdateQuantity(item, Math.max(1, item.cantidad - 1))}
                      onPressIn={() => {
                        if (item.cantidad > 1)
                          startHold(() => onUpdateQuantity(item, item.cantidad - 1));
                      }}
                      onPressOut={stopHold}
                    >
                      <Ionicons name="remove" size={18} color="#222" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.cantidad}</Text>
                    <TouchableOpacity
                      style={[
                        styles.qtyButton,
                        item.cantidad >= item.stock && { opacity: 0.4 }
                      ]}
                      disabled={item.cantidad >= item.stock}
                      onPress={() => onUpdateQuantity(item, item.cantidad + 1)}
                      onPressIn={() => {
                        if (item.cantidad < item.stock)
                          startHold(() => onUpdateQuantity(item, item.cantidad + 1));
                      }}
                      onPressOut={stopHold}
                    >
                      <Ionicons name="add" size={18} color="#222" />
                    </TouchableOpacity>
                  </View>
                  {onRemoveItem && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => onRemoveItem(item)}
                      >
                        <Ionicons name="trash-outline" size={22} color="#e53935" />
                      </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Artículos</Text>
              <Text style={styles.summaryValue}>Bs{items.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Descuentos</Text>
              <Text style={styles.discountValue}>- Bs{discounts.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Bs{total.toFixed(2)}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.checkoutButton, cart.length === 0 && styles.disabledButton]} 
              onPress={handleCheckout}
              disabled={cart.length === 0}
            >
              <Text style={styles.checkoutButtonText}>Pagar</Text>
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
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  infoBanner: {
    backgroundColor: '#FFE0B2',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: '#FF9800',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  cartList: {
    flexGrow: 0,
    maxHeight: 220,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 24,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  itemDetails: {
    color: '#888',
    fontSize: 13,
  },
  itemPrice: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginHorizontal: 10,
    fontSize: 16,
  },
    deleteButton: {
    marginLeft: 8,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    borderTopWidth: 1,
    borderColor: '#eee',
    marginTop: 8,
    paddingTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#888',
  },
  summaryValue: {
    fontWeight: 'bold',
  },
  discountValue: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkoutButton: {
    backgroundColor: '#222',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
