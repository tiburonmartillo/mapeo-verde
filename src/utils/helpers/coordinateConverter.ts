// Helper function to convert UTM coordinates to Lat/Lng
// Based on the logic from dashboard-json/components/map-modal.tsx

interface CoordinateResult {
  lat: number;
  lng: number;
  wasConverted: boolean;
  originalType: 'utm' | 'latlng' | 'unknown';
}

// Simple validation to determine if coordinates are UTM or Lat/Lng
function determineCoordinateType(x: number, y: number): 'utm' | 'latlng' {
  // UTM coordinates are typically large numbers (hundreds of thousands)
  // Lat/Lng are typically small numbers (around -180 to 180 for lng, -90 to 90 for lat)
  if (Math.abs(x) > 1000 || Math.abs(y) > 1000) {
    return 'utm';
  }
  if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
    return 'latlng';
  }
  return 'utm'; // Default to UTM if uncertain
}

// Convert UTM to Lat/Lng
function convertUTMToLatLong(x: number, y: number, zone: number = 13): CoordinateResult {
  // Parámetros del elipsoide WGS84
  const sm_a = 6378137; // Semieje mayor
  const sm_b = 6356752.314; // Semieje menor
  const UTMScaleFactor = 0.9996; // Factor de escala UTM
  
  // Función auxiliar para calcular la latitud del pie
  const calculateFootpointLatitude = (y: number): number => {
    const n = (sm_a - sm_b) / (sm_a + sm_b);
    const alpha_ = ((sm_a + sm_b) / 2) * (1 + (n ** 2) / 4) + (n ** 4) / 64;
    const y_ = y / alpha_;
    
    const beta_ = (3 * n / 2) + (-27 * (n ** 3) / 32) + (269 * (n ** 5) / 512);
    const gamma_ = (21 * (n ** 2) / 16) + (-55 * (n ** 4) / 32);
    const delta_ = (151 * (n ** 3) / 96) + (-417 * (n ** 5) / 128);
    const epsilon_ = (1097 * (n ** 4) / 512);
    
    return y_ + (beta_ * Math.sin(2 * y_)) + (gamma_ * Math.sin(4 * y_)) + 
           (delta_ * Math.sin(6 * y_)) + (epsilon_ * Math.sin(8 * y_));
  };
  
  // Ajustar coordenadas UTM
  let utmX = x - 500000; // Remover false easting
  utmX = utmX / UTMScaleFactor;
  const utmY = y / UTMScaleFactor;
  
  // Calcular meridiano central de la zona
  const lambda0 = ((-183 + (zone * 6)) / 180) * Math.PI;
  
  // Calcular latitud del pie
  const phif = calculateFootpointLatitude(utmY);
  
  // Precalcular valores auxiliares
  const ep2 = (sm_a ** 2 - sm_b ** 2) / (sm_b ** 2);
  const cf = Math.cos(phif);
  const nuf2 = ep2 * (cf ** 2);
  const Nf = (sm_a ** 2) / (sm_b * Math.sqrt(1 + nuf2));
  
  const tf = Math.tan(phif);
  const tf2 = tf * tf;
  const tf4 = tf2 * tf2;
  
  // Calcular coeficientes fraccionarios
  let Nfpow = Nf;
  const x1frac = 1 / (Nfpow * cf);
  
  Nfpow = Nfpow * Nf;
  const x2frac = tf / (2 * Nfpow);
  
  Nfpow = Nfpow * Nf;
  const x3frac = 1 / (6 * Nfpow * cf);
  
  Nfpow = Nfpow * Nf;
  const x4frac = tf / (24 * Nfpow);
  
  Nfpow = Nfpow * Nf;
  const x5frac = 1 / (120 * Nfpow * cf);
  
  Nfpow = Nfpow * Nf;
  const x6frac = tf / (720 * Nfpow);
  
  Nfpow = Nfpow * Nf;
  const x7frac = 1 / (5040 * Nfpow * cf);
  
  Nfpow = Nfpow * Nf;
  const x8frac = tf / (40320 * Nfpow);
  
  // Calcular coeficientes polinomiales
  const x2poly = -1 - nuf2;
  const x3poly = -1 - 2 * tf2 - nuf2;
  const x4poly = 5 + 3 * tf2 + 6 * nuf2 - 6 * tf2 * nuf2 - 3 * (nuf2 * nuf2) - 9 * tf2 * (nuf2 * nuf2);
  const x5poly = 5 + 28 * tf2 + 24 * tf4 + 6 * nuf2 + 8 * tf2 * nuf2;
  const x6poly = -61 - 90 * tf2 - 45 * tf4 - 107 * nuf2 + 162 * tf2 * nuf2;
  const x7poly = -61 - 662 * tf2 - 1320 * tf4 - 720 * (tf4 * tf2);
  const x8poly = 1385 + 3633 * tf2 + 4095 * tf4 + 1575 * (tf4 * tf2);
  
  // Calcular latitud y longitud
  const lat = phif + x2frac * x2poly * (utmX * utmX) + x4frac * x4poly * utmX ** 4 + 
              x6frac * x6poly * utmX ** 6 + x8frac * x8poly * utmX ** 8;
  const lng = lambda0 + x1frac * utmX + x3frac * x3poly * utmX ** 3 + 
              x5frac * x5poly * utmX ** 5 + x7frac * x7poly * utmX ** 7;
  
  // Convertir de radianes a grados
  const latDegrees = (lat / Math.PI) * 180;
  const lngDegrees = (lng / Math.PI) * 180;
  
  return {
    lat: latDegrees,
    lng: lngDegrees,
    wasConverted: true,
    originalType: 'utm'
  };
}

export function convertToLatLong(x: number | null, y: number | null): CoordinateResult | null {
  if (!x || !y || isNaN(x) || isNaN(y)) {
    return null;
  }

  const type = determineCoordinateType(x, y);
  
  if (type === 'latlng') {
    // Ya están en formato Lat/Lng, devolverlas directamente
    return {
      lat: y,
      lng: x,
      wasConverted: false,
      originalType: 'latlng'
    };
  }
  
  // Son coordenadas UTM, convertir
  // Determinar zona UTM (13 o 14 para México)
  // Para Aguascalientes, generalmente zona 13
  const zone = x > 500000 ? 13 : 14;
  
  return convertUTMToLatLong(x, y, zone);
}

