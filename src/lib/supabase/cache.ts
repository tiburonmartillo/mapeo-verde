/**
 * Sistema de caché simple en memoria para optimizar queries repetidas
 * Evita hacer múltiples requests idénticos en un corto período de tiempo
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutos por defecto

  /**
   * Obtiene un valor del caché si existe y no ha expirado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Guarda un valor en el caché
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Elimina una entrada del caché
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Genera una clave de caché a partir de una tabla y filtros
   */
  static generateKey(table: string, filters?: Record<string, any>): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `${table}:${filterStr}`;
  }
}

// Instancia singleton del caché
export const queryCache = new QueryCache();

// Limpiar caché expirado cada 10 minutos
if (typeof window !== 'undefined') {
  setInterval(() => {
    queryCache.cleanup();
  }, 10 * 60 * 1000);
}

