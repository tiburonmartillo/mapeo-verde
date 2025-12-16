/**
 * Sistema de deduplicación de requests
 * Evita hacer múltiples requests idénticos simultáneamente
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private readonly DEDUP_WINDOW = 1000; // 1 segundo de ventana para deduplicar

  /**
   * Ejecuta una función solo si no hay una request idéntica en curso
   * Si hay una request pendiente, devuelve la misma promesa
   */
  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.pendingRequests.get(key);
    const now = Date.now();

    // Si hay una request reciente (dentro de la ventana), reutilizarla
    if (existing && (now - existing.timestamp) < this.DEDUP_WINDOW) {
      return existing.promise;
    }

    // Crear nueva request
    const promise = fn()
      .then(result => {
        // Limpiar después de completar
        this.pendingRequests.delete(key);
        return result;
      })
      .catch(error => {
        // Limpiar también en caso de error
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, {
      promise,
      timestamp: now,
    });

    return promise;
  }

  /**
   * Limpia requests pendientes antiguas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.DEDUP_WINDOW * 10) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Limpia todas las requests pendientes
   */
  clear(): void {
    this.pendingRequests.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Limpiar requests antiguas cada 30 segundos
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestDeduplicator.cleanup();
  }, 30 * 1000);
}

