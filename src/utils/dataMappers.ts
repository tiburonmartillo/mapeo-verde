// Mappers to transform external JSON datasets into the UI-friendly shape
export const mapBoletinesToProjects = (boletinesSource: any) => {
  const boletines = boletinesSource?.boletines ?? [];
  return boletines.flatMap((b: any) =>
    (b.proyectos_ingresados ?? []).map((p: any) => ({
      id: `${b.id}-${p.numero ?? '0'}`,
      project: p.nombre_proyecto ?? 'Proyecto sin nombre',
      promoter: p.promovente ?? 'Promovente no especificado',
      type: p.tipo_estudio ?? 'Sin tipo',
      date: p.fecha_ingreso ?? b.fecha_publicacion ?? '2025-01-01',
      year: (p.fecha_ingreso ?? b.fecha_publicacion ?? '2025').toString().slice(0, 4),
      status: 'Ingreso',
      lat: p.coordenadas_x ?? 21.8853,
      lng: p.coordenadas_y ?? -102.2916,
      description: p.naturaleza_proyecto ?? '',
      impact: p.giro ?? ''
    }))
  );
};

export const mapGacetasToDataset = (gacetasSource: any) => {
  const analyses = gacetasSource?.analyses ?? [];
  const items: any[] = [];
  analyses.forEach((a: any, idx: number) => {
    const registros = a.analisis_completo?.registros ?? [];
    registros.forEach((r: any, ri: number) => {
      const date = r.fecha_ingreso ?? r.fecha_resolucion ?? a.fecha_publicacion ?? '2025-01-01';
      const year = (r.fecha_ingreso ?? r.fecha_resolucion ?? a.año ?? a.analisis_completo?.gaceta?.anio ?? '2025').toString().slice(0, 4);
      items.push({
        id: r.clave_proyecto ?? r.id ?? `GAC-${idx}-${ri}`,
        project: r.proyecto_nombre ?? 'Proyecto sin nombre',
        promoter: r.promovente ?? 'Promovente no especificado',
        type: r.modalidad ?? 'Sin modalidad',
        date,
        year,
        status: r.estatus ?? 'En trámite',
        lat: r.lat ?? 21.8853,
        lng: r.lng ?? -102.2916,
        description: r.tipo_proyecto ?? '',
        impact: r.seccion_documento ?? (a.secciones?.[0] ?? 'Federal')
      });
    });
  });
  return items;
};

