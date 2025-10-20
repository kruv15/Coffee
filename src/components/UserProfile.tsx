import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface UserProfileProps {
  visible: boolean;
  onClose: () => void;
  onLoginPress: () => void;
}

interface UserProfileData {
  id: string;
  nombre: string;
  emailUsr: string;
  fechaRegistro?: string;
  telefono?: string;
  direccion?: string;
}

export function UserProfile({ visible, onClose, onLoginPress }: UserProfileProps) {
  const { state, logout } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    if (!state.isAuthenticated || !state.token) return;

    setLoading(true);
    try {
      const response = await fetch('/api/usuarios/perfil', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${state.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setProfileData(data.usuario || data);
      } else {
        console.error('Error fetching profile:', data);
        Alert.alert('Error', 'No se pudo cargar el perfil');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      Alert.alert('Error', 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && state.isAuthenticated) {
      fetchProfile();
    }
  }, [visible, state.isAuthenticated]);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            setProfileData(null);
            onClose();
          },
        },
      ]
    );
  };

  if (!state.isAuthenticated) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#222" />
              </TouchableOpacity>
              <Text style={styles.title}>Perfil de Usuario</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.notLoggedIn}>
              <Ionicons name="person-circle-outline" size={100} color="#ccc" />
              <Text style={styles.notLoggedInTitle}>No has iniciado sesión</Text>
              <Text style={styles.notLoggedInText}>
                Inicia sesión para ver tu perfil y realizar pedidos
              </Text>
              <TouchableOpacity style={styles.loginButton} onPress={() => {
                onClose();
                onLoginPress();
              }}>
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#222" />
            </TouchableOpacity>
            <Text style={styles.title}>Mi Perfil</Text>
            <TouchableOpacity onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={28} color="#f44336" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#795548" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
              </View>
            ) : (
              <>
                <View style={styles.profileHeader}>
                  <View style={styles.avatarContainer}>
                    <Ionicons name="person" size={50} color="#fff" />
                  </View>
                  <Text style={styles.userName}>
                    {profileData?.nombre || state.user?.name || 'Usuario'}
                  </Text>
                  <Text style={styles.userEmail}>
                    {profileData?.emailUsr || state.user?.email || ''}
                  </Text>
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Información Personal</Text>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="mail-outline" size={20} color="#666" />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>
                        {profileData?.emailUsr || state.user?.email || ''}
                      </Text>
                    </View>
                  </View>

                  {profileData?.telefono && (
                    <View style={styles.infoItem}>
                      <Ionicons name="call-outline" size={20} color="#666" />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Teléfono</Text>
                        <Text style={styles.infoValue}>{profileData.telefono}</Text>
                      </View>
                    </View>
                  )}

                  {profileData?.direccion && (
                    <View style={styles.infoItem}>
                      <Ionicons name="location-outline" size={20} color="#666" />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Dirección</Text>
                        <Text style={styles.infoValue}>{profileData.direccion}</Text>
                      </View>
                    </View>
                  )}

                  {profileData?.fechaRegistro && (
                    <View style={styles.infoItem}>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                      <View style={styles.infoTextContainer}>
                        <Text style={styles.infoLabel}>Miembro desde</Text>
                        <Text style={styles.infoValue}>
                          {new Date(profileData.fechaRegistro).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.actionsSection}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="heart-outline" size={20} color="#795548" />
                    <Text style={styles.actionButtonText}>Favoritos</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="time-outline" size={20} color="#795548" />
                    <Text style={styles.actionButtonText}>Historial de Pedidos</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="settings-outline" size={20} color="#795548" />
                    <Text style={styles.actionButtonText}>Configuración</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                  <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </>
            )}
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
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#795548',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  infoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  notLoggedIn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  notLoggedInTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  notLoggedInText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#795548',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
