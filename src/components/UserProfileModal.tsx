import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function UserProfileModal({ visible, onClose }: UserProfileModalProps) {
  const { state, logout, forceRefresh } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            console.log('🎯 Logout button pressed - starting process...');
            
            try {
              // Cerrar modal inmediatamente
              onClose();
              
              // Ejecutar logout
              await logout();
              
              // Forzar refresh después de un breve delay
              setTimeout(() => {
                console.log('🔄 Forcing app refresh after logout...');
                forceRefresh();
              }, 200);
              
              Alert.alert('Éxito', 'Sesión cerrada correctamente');
              
            } catch (error) {
              console.error('❌ Error in logout process:', error);
              
              // En caso de error, forzar refresh de todas formas
              forceRefresh();
              Alert.alert('Información', 'Sesión cerrada');
            }
          },
        },
      ]
    );
  };

  // No renderizar si no está visible
  if (!visible) {
    return null;
  }

  // No renderizar si el usuario no está autenticado
  if (!state.isAuthenticated || !state.user) {
    console.log('⚠️ UserProfileModal: No authenticated user, not rendering');
    return null;
  }

  console.log('✅ UserProfileModal: Rendering for user:', state.user.email);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={styles.title}>Mi Perfil</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="log-out-outline" size={28} color="#795548" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            <View style={styles.emailContainer}>
              <Ionicons name="mail-outline" size={24} color="#666" />
              <View style={styles.emailInfo}>
                <Text style={styles.emailLabel}>Email</Text>
                <Text style={styles.emailText}>{state.user.email}</Text>
              </View>
            </View>

            {state.user.name && (
              <View style={styles.emailContainer}>
                <Ionicons name="person-outline" size={24} color="#666" />
                <View style={styles.emailInfo}>
                  <Text style={styles.emailLabel}>Nombre</Text>
                  <Text style={styles.emailText}>
                    {state.user.lastName ? `${state.user.name} ${state.user.lastName}` : state.user.name}
                  </Text>
                </View>
              </View>
            )}

            {state.user.phone && (
              <View style={styles.emailContainer}>
                <Ionicons name="call-outline" size={24} color="#666" />
                <View style={styles.emailInfo}>
                  <Text style={styles.emailLabel}>Teléfono</Text>
                  <Text style={styles.emailText}>{state.user.phone}</Text>
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '60%',
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  profileSection: {
    marginBottom: 32,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  emailInfo: {
    marginLeft: 12,
    flex: 1,
  },
  emailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4444',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});


