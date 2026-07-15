export interface Proyecto {
  numero: number
  tipo_estudio: string
  promovente: string
  nombre_proyecto: string
  giro: string
  municipio: string
  coordenadas_x: number | null
  coordenadas_y: number | null
  expediente: string
  fecha_ingreso: string
  boletin_id: number
  coord_valida: boolean | null
  naturaleza_proyecto: string
}

export interface Resolutivo {
  numero: number
  tipo_estudio: string
  promovente: string
  nombre_proyecto: string
  giro: string
  municipio: string
  coordenadas_x: number | null
  coordenadas_y: number | null
  expediente: string
  fecha_ingreso: string
  fecha_resolutivo: string
  no_oficio_resolutivo: string
  boletin_id: number
  naturaleza_proyecto: string
}

export interface Boletin {
  id: number
  secretario: string
  director: string
  fecha_publicacion: string
  cantidad_ingresados: number
  cantidad_resolutivos: number
  filename: string
  url: string
  proyectos_ingresados: Proyecto[]
  resolutivos_emitidos: Resolutivo[]
  año: number
  mes: string
  procesado: boolean
  fecha_limite_consulta?: string | null
}

export interface BoletinesData {
  boletines: Boletin[]
}
