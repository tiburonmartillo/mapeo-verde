// Helper function to map boletines to projects
export const mapBoletinesToProjects = (boletinesSource: any): any[] => {
  if (!boletinesSource) return [];
  
  // Si es un objeto con propiedad boletines
  const boletines = Array.isArray(boletinesSource) 
    ? boletinesSource 
    : (boletinesSource.boletines || boletinesSource.data || []);
  
  if (!Array.isArray(boletines) || boletines.length === 0) {
    return [];
  }

  return boletines.flatMap((boletin: any) => {
    // Si tiene proyectos_ingresados, mapear esos
    if (boletin.proyectos_ingresados && Array.isArray(boletin.proyectos_ingresados)) {
      return boletin.proyectos_ingresados.map((p: any) => ({
        id: `${boletin.id || 'B'}-${p.numero || '0'}`,
        project: p.nombre_proyecto || boletin.title || 'Proyecto sin nombre',
        promoter: p.promovente || boletin.entity || 'Promovente no especificado',
        type: p.tipo_estudio || 'Sin tipo',
        date: p.fecha_ingreso || boletin.fecha_publicacion || boletin.date || '2025-01-01',
        year: (p.fecha_ingreso || boletin.fecha_publicacion || boletin.date || '2025').toString().slice(0, 4),
        status: 'Ingreso',
        lat: p.coordenadas_x || 21.8853,
        lng: p.coordenadas_y || -102.2916,
        description: p.naturaleza_proyecto || boletin.summary || '',
        impact: p.giro || ''
      }));
    }
    
    // Mapeo simple si no tiene proyectos_ingresados
    return {
      id: boletin.id || `B${boletin.link?.match(/\/(\d+)$/)?.[1] || Math.random()}`,
      year: boletin.date ? (boletin.date.split('/')[2] || boletin.date.split('-')[0] || new Date().getFullYear().toString()) : new Date().getFullYear().toString(),
      date: boletin.date || boletin.fecha_publicacion || '2025-01-01',
      project: boletin.title || boletin.nombre_proyecto || 'Proyecto sin nombre',
      promoter: boletin.entity || boletin.promovente || 'Gobierno',
      description: boletin.summary || boletin.naturaleza_proyecto || '',
      type: boletin.tipo_estudio || 'Manifestación de Impacto Ambiental',
      impact: boletin.giro || 'No especificado',
      status: boletin.status || 'Publicado',
      link: boletin.link || '#',
      lat: boletin.coordenadas_x || boletin.lat || 21.8853 + (Math.random() - 0.5) * 0.1,
      lng: boletin.coordenadas_y || boletin.lng || -102.2916 + (Math.random() - 0.5) * 0.1,
    };
  });
};

// Helper function to map gacetas to dataset
export const mapGacetasToDataset = (gacetasSource: any): any[] => {
  if (!gacetasSource) return [];
  
  // Si es un objeto con propiedad analyses o registros
  let items: any[] = [];
  
  if (gacetasSource.analyses && Array.isArray(gacetasSource.analyses)) {
    // Estructura con analyses
    gacetasSource.analyses.forEach((a: any) => {
      const registros = a.analisis_completo?.registros || [];
      registros.forEach((r: any) => {
        const date = r.fecha_ingreso || r.fecha_resolucion || a.fecha_publicacion || '2025-01-01';
        const year = (r.fecha_ingreso || r.fecha_resolucion || a.año || a.analisis_completo?.gaceta?.anio || '2025').toString().slice(0, 4);
        items.push({
          id: r.clave_proyecto || r.id || `GAC-${Math.random()}`,
          project: r.proyecto_nombre || a.title || 'Proyecto sin nombre',
          promoter: r.promovente || a.entity || 'Promovente no especificado',
          type: r.modalidad || 'Sin modalidad',
          date,
          year,
          status: r.estatus || 'En trámite',
          lat: r.lat || 21.8853,
          lng: r.lng || -102.2916,
          description: r.tipo_proyecto || a.summary || '',
          impact: r.seccion_documento || (a.secciones?.[0] || 'Federal')
        });
      });
    });
  } else if (Array.isArray(gacetasSource)) {
    // Array directo
    items = gacetasSource.map((gaceta: any) => ({
      id: gaceta.id || `G${gaceta.link?.match(/\/(\d+)$/)?.[1] || Math.random()}`,
      year: gaceta.date ? (gaceta.date.split('/')[2] || gaceta.date.split('-')[0] || new Date().getFullYear().toString()) : new Date().getFullYear().toString(),
      date: gaceta.date || '2025-01-01',
      project: gaceta.title || gaceta.project || 'Proyecto sin nombre',
      promoter: gaceta.entity || gaceta.promoter || 'Gobierno Federal',
      type: gaceta.type || 'Sin tipo',
      status: gaceta.status || 'En trámite',
      lat: gaceta.lat || 21.8853,
      lng: gaceta.lng || -102.2916,
      description: gaceta.summary || gaceta.description || '',
      impact: gaceta.impact || gaceta.classification || 'General',
    }));
  }
  
  return items;
};
