export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email.trim()) {
    errors.push('El email es requerido');
  } else if (!emailRegex.test(email)) {
    errors.push('El email no es válido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('La contraseña es requerida');
  } else {
    if (password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }
    if (password.length > 50) {
      errors.push('La contraseña no puede exceder 50 caracteres');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!value || !value.trim()) {
    errors.push(`${fieldName} es requerido`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];
  const phoneRegex = /^\d{10}$/;
  
  if (!phone.trim()) {
    errors.push('El teléfono es requerido');
  } else if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    errors.push('El teléfono debe tener 10 dígitos');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateProductName = (name: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!name.trim()) {
    errors.push('El nombre del producto es requerido');
  } else if (name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  } else if (name.trim().length > 100) {
    errors.push('El nombre no puede exceder 100 caracteres');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePrice = (price: string): ValidationResult => {
  const errors: string[] = [];
  const priceNum = parseFloat(price);
  
  if (!price.trim()) {
    errors.push('El precio es requerido');
  } else if (isNaN(priceNum) || priceNum <= 0) {
    errors.push('El precio debe ser un número positivo');
  } else if (priceNum > 999999) {
    errors.push('El precio es demasiado alto');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateStock = (stock: string): ValidationResult => {
  const errors: string[] = [];
  const stockNum = parseInt(stock);
  
  if (!stock.trim()) {
    errors.push('El stock es requerido');
  } else if (isNaN(stockNum) || stockNum < 0) {
    errors.push('El stock debe ser un número entero positivo o cero');
  } else if (!Number.isInteger(Number(stock))) {
    errors.push('El stock debe ser un número entero');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateImageUrl = (url: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!url.trim()) {
    errors.push('La URL de la imagen es requerida');
  } else {
    const trimmedUrl = url.trim();
    // Validar que sea una URL válida (más flexible)
    const urlPattern = /^https?:\/\/.+/i;
    
    if (!urlPattern.test(trimmedUrl)) {
      errors.push('Debe ser una URL válida que comience con http o https');
    } else if (trimmedUrl.length > 500) {
      errors.push('La URL es demasiado larga');
    }
    // Nota: No validamos la extensión específica ya que muchas URLs 
    // de servicios como Cloudinary no muestran la extensión
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
