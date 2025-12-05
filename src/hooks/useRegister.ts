import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { validateEmail, validatePassword, validateRequired, validatePhone } from '../utils/validation';
import { User } from '../types';

export interface RegisterData {
  name: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const register = async (data: RegisterData): Promise<boolean> => {
    // Validaciones
    const nameValidation = validateRequired(data.name, 'Nombre');
    const lastNameValidation = validateRequired(data.lastName, 'Apellido');
    const phoneValidation = validatePhone(data.phone);
    const emailValidation = validateEmail(data.email);
    const passwordValidation = validatePassword(data.password);

    if (!nameValidation.isValid) {
      Alert.alert('Error', nameValidation.errors[0]);
      return false;
    }

    if (!lastNameValidation.isValid) {
      Alert.alert('Error', lastNameValidation.errors[0]);
      return false;
    }

    if (!phoneValidation.isValid) {
      Alert.alert('Error', phoneValidation.errors[0]);
      return false;
    }

    if (!emailValidation.isValid) {
      Alert.alert('Error', emailValidation.errors[0]);
      return false;
    }

    if (!passwordValidation.isValid) {
      Alert.alert('Error', passwordValidation.errors[0]);
      return false;
    }

    if (data.password !== data.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }

    setLoading(true);

    try {
      const requestBody = {
        nombreUsr: data.name.trim(),
        apellidoUsr: data.lastName.trim(),
        celUsr: data.phone.trim(),
        emailUsr: data.email.toLowerCase().trim(),
        contraseña: data.password,
      };

      const response = await authService.register(requestBody);

      if (response.success) {
        // Crear usuario y hacer login automático
        const userData: User = {
          id: response.usuario?._id || response.data?.usuario?._id || response.usuario?.id || Date.now().toString(),
          name: response.usuario?.nombreUsr || data.name.trim(),
          lastName: response.usuario?.apellidoUsr || data.lastName.trim(),
          email: response.usuario?.emailUsr || data.email.toLowerCase().trim(),
          phone: response.usuario?.celUsr || data.phone.trim(),
          role: 'user',
        };

        const token = response.token || response.data?.token || 'registration-token-' + Date.now();

        await login(userData, token);

        Alert.alert('Éxito', 'Registro exitoso. ¡Bienvenido!');
        return true;
      } else {
        Alert.alert('Error', response.message || 'Error al registrar usuario');
        return false;
      }
    } catch (error) {
      console.error('Register hook error:', error);
      Alert.alert('Error', 'Error de conexión. Verifica tu internet y vuelve a intentar.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    loading
  };
};
