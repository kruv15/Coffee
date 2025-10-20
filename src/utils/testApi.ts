// Función para probar la API directamente y ver qué devuelve
export const testProductsAPI = async () => {
  console.log('🧪 Testing API directly...');
  
  try {
    const response = await fetch('https://prueba-b5a7.onrender.com/api/productos?categoria=cafe');
    console.log('📡 Test response status:', response.status);
    console.log('📡 Test response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📦 Test raw response:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('📊 Test parsed JSON:', json);
      console.log('📊 Test JSON type:', typeof json);
      console.log('📊 Test JSON is array:', Array.isArray(json));
      
      if (Array.isArray(json)) {
        console.log('✅ Direct array with', json.length, 'items');
        return json;
      } else if (json && typeof json === 'object') {
        console.log('📋 Object keys:', Object.keys(json));
        return json;
      }
    } catch (e) {
      console.error('❌ Test JSON parse error:', e);
    }
  } catch (error) {
    console.error('❌ Test network error:', error);
  }
};

// Llamar esta función en el useEffect para debug
export const debugAPI = async () => {
  try {
    console.log('🧪 DEBUG: Testing API connection...');
    
    const response = await fetch('https://prueba-b5a7.onrender.com/api/productos', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🧪 DEBUG Response status:', response.status);
    console.log('🧪 DEBUG Response headers:', Object.fromEntries(response.headers.entries()));
    
    const rawText = await response.text();
    console.log('🧪 DEBUG Raw response:', rawText);
    
    try {
      const parsed = JSON.parse(rawText);
      console.log('🧪 DEBUG Parsed response:', JSON.stringify(parsed, null, 2));
      console.log('🧪 DEBUG Response type:', typeof parsed);
      console.log('🧪 DEBUG Is array:', Array.isArray(parsed));
      
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        console.log('🧪 DEBUG Object keys:', Object.keys(parsed));
        Object.keys(parsed).forEach(key => {
          const value = parsed[key];
          console.log(`🧪 DEBUG ${key}:`, typeof value, Array.isArray(value) ? `(array length: ${value.length})` : '');
        });
      }
    } catch (parseError) {
      console.error('🧪 DEBUG Parse error:', parseError);
    }
    
  } catch (error) {
    console.error('🧪 DEBUG Network error:', error);
  }
};
