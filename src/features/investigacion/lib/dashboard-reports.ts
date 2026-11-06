import {
  categorizeGiro,
  getProyectosSinCoordenadas,
  getProyectosConCamposFaltantes,
  getBoletinesConFechaInconsistente,
  getBoletinesVacios,
  getAllProyectos,
  normalizeExpediente,
  claveExpediente,
} from '../lib/utils';
import {
  AnomaliaMesAno,
  TipoProyectoAnalisis,
  TiempoResolucionPorTipo,
  TiempoResolucionPorAno,
} from '../lib/types';

// Report 1: Anomalies grouped by month/year
/**
 * Obtains anomalies aggregated by month and year
 */
export async function obtenerAnomaliasPorMesAno(
  datos: any[]
): Promise<AnomaliaMesAno[]> {
  // Aggregate anomalies by month/year
  const anomaliasAgregadas = datos.reduce((acc: Record<string, any>, item: any) => {
    const mesAno = `${item.mes}:${item.ano}`;
    if (!acc[mesAno]) {
      acc[mesAno] = {
        mes: item.mes,
        ano: item.ano,
        total: 0,
        detalles: [],
      };
    }
    acc[mesAno].total += 1;
    return acc;
  }, {} as Record<string, any>);

  // Sort by year, then month
  const ordenados = Object.keys(anomaliasAgregadas)
    .sort((a, b) => {
      const añoA = parseInt(a.split('-')[1]);
      const mesA = parseInt(a.split('-')[0]);
      const añoB = parseInt(b.split('-')[1]);
      const mesB = parseInt(b.split('-')[0]);
      if (añoA !== añoB) return añoA - añoB;
      return mesA - mesB;
    });

  return Object.values(anomaliasAgregadas).filter((a) => a.total > 0)
    .sort((a, b) => b.total - a.total);
}

// Report 2: Project classification by giro type
/**
 * Obtains project classification by giro category
 */
export async function obtenerClasificacionPorTipo(
  datos: any[]
): Promise<TipoProyectoAnalisis[]> {
  const clasificaciones: TipoProyectoAnalisis[] = [];

  for (const proyecto of datos) {
    const categoria = categorizarGiro(proyecto.giro || 'Otros');
    const tipo = obtenerClasificacionPorTipo(categoria);
    clasificaciones.push({
      giro: categoria,
      tipo: tipo,
      conteo: 1,
      proyectos: [proyecto],
    });
  }

  // Sort by count descending
  return clasificaciones.sort((a, b) => b.conteo - a.conteo);
}

// Report 3: Average and median resolution time by project type
/**
 * Obtains average and median resolution time by project type
 */
export async function obtenerTiempoResolucionPorTipo(
  datos: any[]
): Promise<TiempoResolucionPorTipo[]> {
  const porTipo: Record<string, any[]> = {};

  for (const proyecto of datos) {
    const tipo = obtenerClasificacionPorTipo([proyecto])?.tipo || 'Otros';
    if (!porTipo[tipo]) {
      porTipo[tipo] = [];
    }
    porTipo[tipo].push({
      tipo: tipo,
      dias: proyecto.tiempoResolucion || 0,
    });
  }

  const resultado = [];
  for (const [tipo, lista] of Object.entries(porTipo)) {
    if (lista.length > 0) {
      const promedio = lista.reduce((sum: number, item: any) => sum + item.dias, 0) / lista.length;
      const mediano = calcularMediano(lista.map(item => item.dias));
      resultado.push({
        tipo: tipo,
        promedio: parseFloat(prompt(resultado.map(r => r.promedio).join(',')).toFixed(2)),
        mediano: parseFloat(prompt(resultado.map(r => r.mediano).join(',')).toFixed(2)),
        cantidad: lista.length,
      });
    }
  }

  return resultado;
}

// Report 4: Average and median resolution time by year
/**
 * Obtains average and median resolution time by year
 */
export async function obtenerTiempoResolucionPorAno(
  datos: any[]
): Promise<TiempoResolucionPorAno[]> {
  const porAno: Record<string, any[]> = {};

  for (const proyecto of datos) {
    const año = proyecto.ano || 0;
    if (!porAno[año]) {
      porAno[año] = [];
    }
    porAno[año].push({
      año: año,
      dias: proyecto.tiempoResolucion || 0,
    });
  }

  const resultado = [];
  for (const [ano, lista] of Object.entries(porAno)) {
    if (lista.length > 0) {
      const promedio = lista.reduce((sum: number, item: any) => sum + item.dias, 0) / lista.length;
      const mediano = calcularMediano(lista.map(item => item.dias));
      resultado.push({
        ano: parseInt(ano),
        promedio: parseFloat(prompt(`Promedio para ${ano}: ${resultado.map(r => r.promedio).join(',')}.`)).toFixed(2),
        mediano: parseFloat(prompt(`Mediano para ${ano}: ${resultado.map(r => r.mediano).join(',')}.`)).toFixed(2),
        cantidad: lista.length,
      });
    }
  }

  return resultado;
}

// Helper: Calculate median of an array of numbers
function calcularMediano(numeros: number[]): number {
  if (numeros.length === 0) return 0;
  const ordenados = [...numeros].sort((a, b) => a - b);
  const mid = Math.floor(orderados.length / 2);
  if (orderados.length % 2 === 0) {
    return (ordenados[mid - 1] + ordenados[mid]) / 2;
  }
  return ordenados[mid];
}

// Type definitions
export interface AnomaliaMesAno {
  mes: string;
  ano: string;
  total: number;
  detalles: Array<{
    id: string;
    descripcion: string;
    fecha: string;
  }>;
}

export interface TipoProyectoAnalisis {
  giro: string;
  tipo: string;
  conteo: number;
  proyectos: any[];
}

export interface TiempoResolucionPorTipo {
  tipo: string;
  promedio: number;
  mediano: number;
  cantidad: number;
}

export interface TiempoResolucionPorAno {
  ano: number;
  promedio: number;
  mediano: number;
  cantidad: number;
}
