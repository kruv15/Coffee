import { useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validation';

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const { loginWithApi, loginAsAdmin } = useAuth();

  const login = async (email: string, password: string): Promise<boolean> => {
    // Validaciones
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.isValid) {
      Alert.alert('Error', emailValidation.errors[0]);
      return false;
    }

    if (!passwordValidation.isValid) {
      Alert.alert('Error', passwordValidation.errors[0]);
      return false;
    }

    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      // Verificar si es login de administrador
      if (trimmedEmail === 'admin@gmail.com' && password === 'admin123') {
        await loginAsAdmin();
        Alert.alert('Éxito', 'Bienvenido Administrador');
        return true;
      }

      // Login normal
      const success = await loginWithApi(email, password);

      if (success) {
        Alert.alert('Éxito', 'Has iniciado sesión correctamente.');
        return true;
      } else {
        Alert.alert('Error', 'Correo o contraseña incorrectos.');
        return false;
      }
    } catch (error) {
      console.error('❌ Login hook error:', error);
      Alert.alert('Error', 'Error de conexión. Verifica tu internet.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading
  };
};
