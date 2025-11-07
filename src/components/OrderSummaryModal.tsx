import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { CartItem } from '../types';

interface OrderSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  onSendToWhatsApp: () => void;
  cartItems: CartItem[];
  total: number;
  deliveryAddress: any;
  paymentMethod: string;
}

export function OrderSummaryModal({
  visible,
  onClose,
  onSendToWhatsApp,
  cartItems,
  total,
  deliveryAddress,
  paymentMethod
}: OrderSummaryModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Resumen del Pedido</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Productos:</Text>
            {cartItems.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDetails}>
                  {item.pack} × {item.quantity} = Bs{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total: Bs{total.toFixed(2)}</Text>
            </View>

            <Text style={styles.sectionTitle}>Dirección:</Text>
            <Text style={styles.addressText}>
              {deliveryAddress.street}, {deliveryAddress.city}
            </Text>

            <Text style={styles.sectionTitle}>Pago:</Text>
            <Text style={styles.paymentText}>
              {paymentMethod === 'qr' ? 'Pago con QR' : 'Tarjeta'}
            </Text>

            <View style={styles.whatsappInfo}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={styles.whatsappText}>
                Al continuar, se abrirá WhatsApp con el resumen de tu pedido
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.sendButton} onPress={onSendToWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.sendButtonText}>Enviar por WhatsApp</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  itemRow: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  itemDetails: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    marginTop: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  addressText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  paymentText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  whatsappInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  whatsappText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#2E7D32',
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  sendButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
