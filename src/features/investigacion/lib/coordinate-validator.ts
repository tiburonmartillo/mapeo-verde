// Sistema de validación y corrección de coordenadas UTM/Lat-Lng
// Para zona UTM 13 México

interface CoordinateRanges {
  norte: { min: number; max: number };
  este: { min: number; max: number };
  norte14: { min: number; max: number };
  este14: { min: number; max: number };
}

interface LatLngRanges {
  lat: { min: number; max: number };
  lng: { min: number; max: number };
}

interface ValidationResult {
  valid: boolean;
  norteInRange?: boolean;
  esteInRange?: boolean;
  latInRange?: boolean;
  lngInRange?: boolean;
  ranges?: CoordinateRanges | LatLngRanges;
  reason?: string;
}

interface CoordinateProcessResult {
  success: boolean;
  original: { x: any; y: any };
  normalized: { x: number | null; y: number | null };
  corrected: { x: number; y: number };
  type: string;
  wasCorrected: boolean;
  validation: ValidationResult;
  identification: any;
  error?: string;
}

export class CoordinateValidator {
  private utmRanges: CoordinateRanges;
  private latLngRanges: LatLngRanges;

  constructor() {
    // Rangos válidos para zona UTM 13 México
    this.utmRanges = {
      // Zona 13 México (Aguascalientes)
      norte: { min: 2392000.00, max: 2485000.00 },
      este: { min: 719000.00, max: 810000.00 },
      // Zona 14 México (parte de Aguascalientes) - rangos más amplios
      norte14: { min: 1000000.00, max: 2500000.00 },
      este14: { min: 200000.00, max: 300000.00 }
    };
    
    // Rangos válidos para Lat/Lng en México (ampliados para incluir todas las coordenadas válidas de Aguascalientes)
    this.latLngRanges = {
      lat: { min: 21.50, max: 22.50 }, // Ampliado desde 21.619133
      lng: { min: -103.0, max: -101.5 } // Ampliado desde -102.884216
    };
  }

  // Función para normalizar números (limpiar caracteres extra)
  private normalizeNumber(value: any): number | null {
    if (typeof value === 'number') return value;
    if (value === null || value === undefined) return null;
    
    // Convertir a string y limpiar
    let str = String(value).trim();
    
    // Remover caracteres no numéricos excepto punto decimal y signo negativo
    str = str.replace(/[^\d.-]/g, '');
    
    // Manejar múltiples puntos decimales (mantener solo el último)
    const parts = str.split('.');
    if (parts.length > 2) {
      str = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Manejar múltiples signos negativos
    if (str.startsWith('-')) {
      str = '-' + str.slice(1).replace(/-/g, '');
    }
    
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
  }

  // Identificar si las coordenadas son UTM o Lat/Lng
  private identifyCoordinateType(x: any, y: any): any {
    const normalizedX = this.normalizeNumber(x);
    const normalizedY = this.normalizeNumber(y);
    
    if (normalizedX === null || normalizedY === null) {
      return { type: 'invalid', reason: 'No se pudieron normalizar las coordenadas' };
    }
    
    // UTM tiene valores grandes (cientos de miles o millones)
    // Para zona 13 México: Este 719000-810000, Norte 2392000-2485000
    const isUtmX = normalizedX >= 700000 && normalizedX <= 900000;
    const isUtmY = normalizedY >= 2300000 && normalizedY <= 2500000;
    
    // Para zona 14 México: Este 200000-300000, Norte 1000000-2500000
    const isUtm14X = normalizedX >= 200000 && normalizedX <= 300000;
    const isUtm14Y = normalizedY >= 1000000 && normalizedY <= 2500000;
    
    // Lat/Lng tiene valores pequeños
    // Lat: 21.619133 - 22.447841, Lng: -102.884216 - -101.850128
    const isLatLngX = Math.abs(normalizedX) <= 180;
    const isLatLngY = Math.abs(normalizedY) <= 90;
    
    // Verificar si ambos valores están en rango UTM zona 13
    if (isUtmX && isUtmY) {
      return { type: 'utm', x: normalizedX, y: normalizedY };
    }
    
    // Verificar si ambos valores están en rango UTM zona 14
    if (isUtm14X && isUtm14Y) {
      return { type: 'utm14', x: normalizedX, y: normalizedY };
    }
    
    // Verificar si ambos valores están en rango Lat/Lng
    if (isLatLngX && isLatLngY) {
      // Para Lat/Lng, asumimos que el primer valor es lng y el segundo es lat
      return { type: 'latlng', x: normalizedX, y: normalizedY };
    }
    
    // Casos donde los valores están invertidos pero siguen siendo del mismo tipo
    // UTM invertido: Norte primero, Este segundo
    const isUtmYFirst = normalizedY >= 700000 && normalizedY <= 900000;
    const isUtmXSecond = normalizedX >= 2300000 && normalizedX <= 2500000;
    
    if (isUtmYFirst && isUtmXSecond) {
      return { type: 'utm_inverted', x: normalizedX, y: normalizedY };
    }
    
    // Lat/Lng invertido: Lat primero, Lng segundo
    // Detectar si X parece latitud (20-25) y Y parece longitud (100-105 en valor absoluto)
    const isLatFirst = Math.abs(normalizedX) >= 20 && Math.abs(normalizedX) <= 25;
    const isLngSecond = Math.abs(normalizedY) >= 100 && Math.abs(normalizedY) <= 105;
    
    // También verificar si están en los rangos correctos pero invertidos
    const xCouldBeLat = normalizedX >= this.latLngRanges.lat.min && normalizedX <= this.latLngRanges.lat.max;
    const yCouldBeLng = normalizedY >= this.latLngRanges.lng.min && normalizedY <= this.latLngRanges.lng.max;
    
    if ((isLatFirst && isLngSecond) || (xCouldBeLat && yCouldBeLng)) {
      return { type: 'latlng_inverted', x: normalizedX, y: normalizedY };
    }
    
    // Casos especiales: un valor UTM y otro Lat/Lng (posible inversión)
    if ((isUtmX && isLatLngY) || (isLatLngX && isUtmY)) {
      return { type: 'mixed', x: normalizedX, y: normalizedY };
    }
    
    // Intentar identificar por patrones más amplios para corrección posterior
    // UTM: valores muy grandes (millones o cientos de miles)
    const looksLikeUtm = (normalizedX > 100000 || normalizedY > 1000000) && 
                        (normalizedX < 10000000000000 && normalizedY < 10000000000000);
    
    // UTM truncado: valores pequeños que podrían ser UTM con dígitos faltantes
    // Patrones como 774.51, 2.43399 (PSM AUTOMOTIVE case)
    const looksLikeUtmTruncated = (normalizedX > 100 && normalizedX < 10000 && normalizedY > 1 && normalizedY < 100);
    
    // Lat/Lng: valores pequeños pero en rangos razonables
    const looksLikeLatLng = Math.abs(normalizedX) < 1000 && Math.abs(normalizedY) < 1000 && !looksLikeUtmTruncated;
    
    if (looksLikeUtm) {
      return { type: 'utm_potential', x: normalizedX, y: normalizedY };
    } else if (looksLikeUtmTruncated) {
      return { type: 'utm_potential', x: normalizedX, y: normalizedY };
    } else if (looksLikeLatLng) {
      return { type: 'latlng_potential', x: normalizedX, y: normalizedY };
    }
    
    return { type: 'unknown', reason: 'No se pudo identificar el tipo de coordenadas' };
  }

  // Validar si las coordenadas están en el rango correcto
  private validateRange(coords: { x: number; y: number }, type: string): ValidationResult {
    if (type === 'utm') {
      const norteInRange = coords.y >= this.utmRanges.norte.min && coords.y <= this.utmRanges.norte.max;
      const esteInRange = coords.x >= this.utmRanges.este.min && coords.x <= this.utmRanges.este.max;
      
      return {
        valid: norteInRange && esteInRange,
        norteInRange,
        esteInRange,
        ranges: this.utmRanges
      };
    }
    
    if (type === 'utm14') {
      const norteInRange = coords.y >= this.utmRanges.norte14.min && coords.y <= this.utmRanges.norte14.max;
      const esteInRange = coords.x >= this.utmRanges.este14.min && coords.x <= this.utmRanges.este14.max;
      
      return {
        valid: norteInRange && esteInRange,
        norteInRange,
        esteInRange,
        ranges: this.utmRanges
      };
    } else if (type === 'latlng') {
      const latInRange = coords.y >= this.latLngRanges.lat.min && coords.y <= this.latLngRanges.lat.max;
      const lngInRange = coords.x >= this.latLngRanges.lng.min && coords.x <= this.latLngRanges.lng.max;
      
      return {
        valid: latInRange && lngInRange,
        latInRange,
        lngInRange,
        ranges: this.latLngRanges
      };
    }
    
    return { valid: false, reason: 'Tipo de coordenadas no válido' };
  }

  // Intentar corregir coordenadas UTM que parecen tener dígitos faltantes
  private tryDigitCorrection(coords: { x: number; y: number }, type: string): { x: number; y: number } | null {
    if (type === 'utm') {
      // Si el Y está muy por debajo del rango UTM, intentar agregar dígitos
      if (coords.y < 1000000 && coords.x > 700000) {
        // Posibles correcciones para Y (agregar dígitos faltantes)
        const possibleYValues = [
          coords.y * 10,      // Ejemplo: 240667.8 → 2406678
          coords.y + 2000000, // Ejemplo: 240667.8 → 2240667.8
          coords.y + 2100000, // Ejemplo: 240667.8 → 2140667.8
          coords.y + 2200000, // Ejemplo: 240667.8 → 2240667.8
          coords.y + 2300000, // Ejemplo: 240667.8 → 2340667.8
          coords.y + 2400000, // Ejemplo: 240667.8 → 2440667.8
        ];
        
        for (const testY of possibleYValues) {
          const validation = this.validateRange({ x: coords.x, y: testY }, 'utm');
          if (validation.valid) {
            return { x: coords.x, y: testY };
          }
        }
      }
      
      // Caso 2: X muy pequeño pero Y en rango UTM (dígito faltante en X)
      if (coords.x < 1000000 && coords.y > 2300000) {
        const possibleXValues = [
          coords.x * 1000,    // Example: 774.51 → 774510
          coords.x * 100,     // Example: 774.51 → 77451
          coords.x + 700000,  // Example: 774.51 → 700774.51
        ];
        
        for (const testX of possibleXValues) {
          const validation = this.validateRange({ x: testX, y: coords.y }, 'utm');
          if (validation.valid) {
            return { x: testX, y: coords.y };
          }
        }
      }
      
      // Caso 3: Ambos muy pequeños (PSM AUTOMOTIVE case)
      if (coords.x < 10000 && coords.y < 100) {
        const possibleCorrections = [
          { x: coords.x * 1000, y: coords.y * 1000000 }, // 774.51 → 774510, 2.43399 → 2433990
          { x: coords.x * 1000, y: coords.y + 2430000 }, // 774.51 → 774510, 2.43399 → 2430002.43399
        ];
        
        for (const correction of possibleCorrections) {
          const validation = this.validateRange(correction, 'utm');
          if (validation.valid) {
            return correction;
          }
        }
      }
    }
    return null;
  }

  // Intentar corregir coordenadas Lat/Lng que están fuera de rango por signo incorrecto
  private trySignCorrection(coords: { x: number; y: number }, type: string): { x: number; y: number } | null {
    if (type === 'latlng') {
      // Intentar corregir el signo de la longitud para México
      if (coords.x > 0 && coords.x > 100) {
        const correctedX = -coords.x;
        const validation = this.validateRange({ x: correctedX, y: coords.y }, 'latlng');
        if (validation.valid) {
          return { x: correctedX, y: coords.y };
        }
      }
      
      // Intentar invertir X e Y si están fuera de rango
      const invertedValidation = this.validateRange({ x: coords.y, y: coords.x }, 'latlng');
      if (invertedValidation.valid) {
        return { x: coords.y, y: coords.x };
      }
    }
    return null;
  }

  // Intentar corregir coordenadas moviendo el punto decimal
  private tryDecimalCorrection(coords: { x: number; y: number }, type: string): { x: number; y: number } | null {
    if (type === 'utm') {
      // Para UTM, intentar diferentes posiciones del punto decimal
      // Incluir factores para casos extremos como PLAZA NOAH
      const correctionFactors = [
        10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000,
        0.1, 0.01, 0.001, 0.0001, 0.00001, 0.000001, 0.0000001, 0.00000001
      ];
      
      for (const factor of correctionFactors) {
        const correctedX = coords.x / factor;
        const correctedY = coords.y / factor;
        
        const validation = this.validateRange({ x: correctedX, y: correctedY }, 'utm');
        if (validation.valid) {
          return { x: correctedX, y: correctedY };
        }
      }

      // Si dividir no funciona, intentar multiplicar
      for (const factor of [10, 100, 1000]) {
        const correctedX = coords.x * factor;
        const correctedY = coords.y * factor;
        
        const validation = this.validateRange({ x: correctedX, y: correctedY }, 'utm');
        if (validation.valid) {
          return { x: correctedX, y: correctedY };
        }
      }
    } else if (type === 'latlng') {
      // Para Lat/Lng, intentar correcciones más conservadoras
      const correctionFactors = [10, 100, 0.1, 0.01];
      
      for (const factor of correctionFactors) {
        const correctedX = coords.x / factor;
        const correctedY = coords.y / factor;
        
        const validation = this.validateRange({ x: correctedX, y: correctedY }, 'latlng');
        if (validation.valid) {
          return { x: correctedX, y: correctedY };
        }
      }

      // Intentar multiplicar para Lat/Lng
      for (const factor of [10, 100]) {
        const correctedX = coords.x * factor;
        const correctedY = coords.y * factor;
        
        const validation = this.validateRange({ x: correctedX, y: correctedY }, 'latlng');
        if (validation.valid) {
          return { x: correctedX, y: correctedY };
        }
      }
    }

    return null;
  }

  // Detectar si las coordenadas están invertidas
  private detectInversion(x: any, y: any, type: string): boolean {
    const normalizedX = this.normalizeNumber(x);
    const normalizedY = this.normalizeNumber(y);
    
    if (normalizedX === null || normalizedY === null) return false;
    
    if (type === 'utm') {
      // En UTM zona 13 México: Este (X) 719000-810000, Norte (Y) 2392000-2485000
      // Si X > 1000000, probablemente es Norte en lugar de Este
      const possibleInversion = normalizedX > 1000000 || normalizedY < 1000000;
      
      if (possibleInversion) {
        const swappedValidation = this.validateRange({ x: normalizedY, y: normalizedX }, 'utm');
        const originalValidation = this.validateRange({ x: normalizedX, y: normalizedY }, 'utm');
        
        return swappedValidation.valid && !originalValidation.valid;
      }
    } else if (type === 'latlng') {
      // Para esta región: Lat ~21-22, Lng ~-102 a -101
      // Si el primer valor está en rango de lat y el segundo en rango de lng, están invertidos
      const firstIsLat = Math.abs(normalizedX) >= 20 && Math.abs(normalizedX) <= 25;
      const secondIsLng = Math.abs(normalizedY) >= 100 && Math.abs(normalizedY) <= 105;
      
      if (firstIsLat && secondIsLng) {
        const swappedValidation = this.validateRange({ x: normalizedY, y: normalizedX }, 'latlng');
        const originalValidation = this.validateRange({ x: normalizedX, y: normalizedY }, 'latlng');
        
        return swappedValidation.valid && !originalValidation.valid;
      }
    } else if (type === 'mixed') {
      // Si tenemos un valor UTM y otro Lat/Lng, probablemente están mezclados
      // Intentar intercambiarlos y ver si tiene más sentido
      const swappedValidation = this.validateRange({ x: normalizedY, y: normalizedX }, 'utm');
      const originalValidation = this.validateRange({ x: normalizedX, y: normalizedY }, 'utm');
      
      return swappedValidation.valid && !originalValidation.valid;
    }
    
    return false;
  }

  // Procesar coordenadas con validación y corrección completa
  public processCoordinates(x: any, y: any): CoordinateProcessResult {
    // Paso 1: Normalizar
    const normalizedX = this.normalizeNumber(x);
    const normalizedY = this.normalizeNumber(y);
    
    if (normalizedX === null || normalizedY === null) {
      return {
        success: false,
        error: 'No se pudieron normalizar las coordenadas',
        original: { x, y },
        normalized: { x: normalizedX, y: normalizedY },
        corrected: { x: 0, y: 0 },
        type: 'invalid',
        wasCorrected: false,
        validation: { valid: false, reason: 'No se pudieron normalizar las coordenadas' },
        identification: { type: 'invalid' }
      };
    }
    
    // Paso 2: Identificar tipo
    const identification = this.identifyCoordinateType(normalizedX, normalizedY);
    
    if (identification.type === 'invalid' || identification.type === 'unknown') {
      return {
        success: false,
        error: identification.reason || 'Tipo de coordenadas no reconocido',
        original: { x, y },
        normalized: { x: normalizedX, y: normalizedY },
        corrected: { x: normalizedX, y: normalizedY },
        type: identification.type,
        wasCorrected: false,
        validation: { valid: false, reason: identification.reason },
        identification
      };
    }
    
    let coords = { x: identification.x, y: identification.y };
    
    // Paso 3: Manejar tipos especiales y correcciones automáticas
    let finalType = identification.type;
    let wasCorrected = false;
    
    if (identification.type === 'utm_inverted') {
      // UTM invertido: intercambiar X e Y
      coords = { x: identification.y, y: identification.x };
      finalType = 'utm';
      wasCorrected = true;
    } else if (identification.type === 'latlng_inverted') {
      // Lat/Lng invertido: intercambiar X e Y
      coords = { x: identification.y, y: identification.x };
      finalType = 'latlng';
      wasCorrected = true;
    } else if (identification.type === 'mixed') {
      // Intentar como UTM primero
      const utmValidation = this.validateRange(coords, 'utm');
      const latlngValidation = this.validateRange(coords, 'latlng');
      
      if (utmValidation.valid) {
        finalType = 'utm';
      } else if (latlngValidation.valid) {
        finalType = 'latlng';
      }
    } else if (identification.type === 'utm_potential') {
      // Intentar corrección de punto decimal para UTM potencial
      finalType = 'utm';
    } else if (identification.type === 'latlng_potential') {
      // Intentar corrección de punto decimal para Lat/Lng potencial
      finalType = 'latlng';
    }
    
    // Paso 4: Detectar inversión adicional si es necesario
    const isInverted = this.detectInversion(normalizedX, normalizedY, finalType);
    
    if (isInverted && !wasCorrected) {
      coords = { x: identification.y, y: identification.x };
      wasCorrected = true;
    }
    
    // Paso 5: Validar rangos y intentar corrección de punto decimal si es necesario
    let validation = this.validateRange(coords, finalType);
    
    // Si no es válido, intentar correcciones
    if (!validation.valid && (finalType === 'utm' || finalType === 'latlng')) {
      // Primero intentar corrección de dígitos faltantes para UTM
      if (finalType === 'utm') {
        const digitCorrected = this.tryDigitCorrection(coords, finalType);
        if (digitCorrected) {
          coords = digitCorrected;
          validation = this.validateRange(coords, finalType);
          wasCorrected = true;
        }
      }
      
      // Si aún no es válido, intentar corrección de signo para Lat/Lng
      if (!validation.valid && finalType === 'latlng') {
        const signCorrected = this.trySignCorrection(coords, finalType);
        if (signCorrected) {
          coords = signCorrected;
          validation = this.validateRange(coords, finalType);
          wasCorrected = true;
        }
      }
      
      // Si aún no es válido, intentar corrección de punto decimal
      if (!validation.valid) {
        const decimalCorrected = this.tryDecimalCorrection(coords, finalType);
        if (decimalCorrected) {
          coords = decimalCorrected;
          validation = this.validateRange(coords, finalType);
          wasCorrected = true;
        }
      }
    }
    
    return {
      success: validation.valid,
      original: { x, y },
      normalized: { x: normalizedX, y: normalizedY },
      corrected: coords,
      type: finalType,
      wasCorrected: wasCorrected || isInverted,
      validation,
      identification
    };
  }
}

// Instancia singleton para uso en la aplicación
export const coordinateValidator = new CoordinateValidator();
