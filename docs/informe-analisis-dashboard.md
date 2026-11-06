# Informe de Análisis del Dashboard de Boletines Ambientales

**Fecha de generación:** 2026-10-09  
**Fuente de datos:** Supabase (tabla `boletines`) — 496 boletines, 1,335 proyectos únicos (deduplicados), 1,161 resolutivos

---

## Resumen Ejecutivo

Este informe presenta 4 análisis principales sobre patrones en los boletines ambientales de la SSMAA (Aguascalientes), más hallazgos adicionales relevantes.

| Métrica | Valor |
|---------|-------|
| Boletines totales | 496 |
| Proyectos ingresados (únicos) | 1,335 |
| Resolutivos emitidos | 1,161 |
| Boletines vacíos (sin contenido) | 14 |
| Boletines con fecha inconsistente | 361 (72.8%) |
| Posibles re-ingresos detectados | 511 casos |

---

## 1. Anomalías por Mes y Año

**Objetivo:** Detectar si la calidad de captura (coordenadas, campos obligatorios) ha mejorado o empeorado por administración.

### Hallazgos Clave

| Período | Tendencia | % Sin Coordenadas | % Campos Faltantes |
|---------|-----------|-------------------|-------------------|
| **2017-2019** (Administración anterior) | **MALA** | 40-85% | 0-18% |
| **2020-2022** | **MEJORA** | 5-25% | 0-8% |
| **2023-2025** (Administración actual) | **EMPEORA DRÁSTICAMENTE** | **80-100%** | **0-100%** |
| **2026** (Actual) | **RECUPERACIÓN** | 0-50% | 0-57% |

### Detalle por Año (promedio mensual)

| Año | Proyectos/Mes | % Sin Coordenadas | % Campos Faltantes |
|-----|--------------|-------------------|-------------------|
| 2017 | 9.4 | 62% | 1% |
| 2018 | 13.0 | 31% | 3% |
| 2019 | 12.3 | 55% | 2% |
| 2020 | 10.8 | 17% | 1% |
| 2021 | 14.8 | 25% | 2% |
| 2022 | 12.5 | 26% | 4% |
| 2023 | 13.1 | **92%** | 3% |
| 2024 | 10.8 | **72%** | **24%** |
| 2025 | 8.7 | **53%** | **53%** |
| 2026 | 7.9 | **17%** | **11%** |

### Conclusión

> **Hay un patrón claro por administración:** La calidad de captura fue mala en 2017-2019, mejoró sustancialmente en 2020-2022, **colapsó en 2023-2025** (llegando a 100% de proyectos sin coordenadas en varios meses de 2023), y muestra señales de recuperación en 2026. El pico de campos faltantes en 2024-2025 sugiere problemas sistémicos en el proceso de captura durante ese período.

---

## 2. Proyectos Sin Coordenadas por Tipo de Proyecto

**Objetivo:** Clasificar por categorías agrupadas de giro para detectar qué sectores tienen peor captura geoespacial.

### Categorización de Giros

| Categoría | Giros Incluidos |
|-----------|----------------|
| **Fraccionamientos habitacionales** | Fraccionamiento, vivienda, habitacional, desarrollo habitacional |
| **Industria/Mina/Materiales** | Industria, industrial, mina, materiales, banco de materiales, cantera |
| **Gobierno/Entes públicos** | Gobierno, municipal, estatal, federal, ente público, dependencia, secretaría, comisión, instituto, organismo |
| **Otros** | Todo lo no clasificado arriba |

### Resultados

| Categoría | Total Proyectos | Sin Coordenadas | % Sin Coordenadas |
|-----------|----------------|-----------------|-------------------|
| **Industria/Mina/Materiales** | 587 | 294 | **50.1%** |
| **Otros** | 418 | 197 | **47.1%** |
| **Fraccionamientos habitacionales** | 330 | 132 | **40.0%** |
| **Gobierno/Entes públicos** | 0 | 0 | — |

> **Nota:** No se detectaron proyectos clasificados como "Gobierno/Entes públicos" en los datos actuales.

### Conclusión

> **Industria/Mina/Materiales es la categoría con peor captura geoespacial** (más de la mitad sin coordenadas válidas). Esto es crítico porque son proyectos de alto impacto ambiental (extracción, plantas industriales) donde la ubicación precisa es esencial para evaluación y monitoreo. Fraccionamientos, aunque mejor, aún tiene 40% sin coordenadas.

---

## 3. Tiempo de Resolución por Tipo de Proyecto

**Objetivo:** Medir eficiencia por categoría de giro (días entre ingreso y resolutivo).

### Resultados

| Categoría | Casos | Promedio (días) | Mediana (días) | Interpretación |
|-----------|-------|-----------------|----------------|----------------|
| **Industria/Mina/Materiales** | 504 | **113.4** | **69** | Más lentos en promedio |
| **Otros** | 344 | 99.4 | 68 | Intermedio |
| **Fraccionamientos habitacionales** | 287 | **95.2** | **64** | Ligeramente más rápidos |

### Distribución de Tiempos (Industria vs Fraccionamientos)

| Percentil | Industria/Mina/Materiales | Fraccionamientos |
|-----------|---------------------------|------------------|
| Mínimo | 0 | 0 |
| P25 (Q1) | ~25 | ~22 |
| **Mediana** | **69** | **64** |
| P75 (Q3) | ~150 | ~135 |
| Máximo | 1,000+ | 800+ |

### Conclusión

> **Los proyectos industriales/mineros tardan ~18% más en resolverse** que los fraccionamientos (promedio 113 vs 95 días). La mediana es similar (69 vs 64), lo que indica que la diferencia se debe a **casos atípicos muy largos** en industria (posiblemente por complejidad técnica, consulta pública, o requerimientos de información adicional). El 75% de fraccionamientos se resuelve en ~135 días vs ~150 en industria.

---

## 4. Tiempo de Resolución por Año

**Objetivo:** Detectar si alguna administración fue más "eficiente" (resolución más rápida).

### Resultados por Año (basado en fecha de resolutivo)

| Año | Casos | Promedio (días) | Mediana (días) | Tendencia |
|-----|-------|-----------------|----------------|-----------|
| 2016 | 1 | 148.0 | 148 | — |
| 2017 | 107 | **167.6** | **146** | 🔴 **MÁS LENTO** |
| 2018 | 158 | 104.0 | 76 | 🟡 Mejorando |
| 2019 | 141 | 80.1 | 54 | 🟢 Bien |
| 2020 | 140 | **68.0** | **52.5** | 🟢 **MÁS RÁPIDO** |
| 2021 | 151 | 80.2 | 53 | 🟢 Bueno |
| 2022 | 136 | 71.3 | 47 | 🟢 **Mejor mediano** |
| 2023 | 128 | 76.8 | 52.5 | 🟡 Estable |
| 2024 | 77 | **176.4** | **119** | 🔴 **COLAPSO** |
| 2025 | 58 | **193.6** | **133** | 🔴 **PEOR AÚN** |
| 2026 | 38 | 181.2 | 149.5 | 🔴 Sigue lento |

### Gráfico de Tendencia (Promedio y Mediana)

```
Días
200 ┤                    ╭──╮
180 ┤                   ╭╯  ╰──╮
160 ┤  ╭──╮            ╭╯        ╰──╮
140 ┤ ╭╯  ╰──╮         ╭╯           ╰╮    (Promedio)
120 ┤ ╯      ╰──╮      ╭╯             ╰╮
100 ┤         ╰──╮    ╭╯               ╰╮
 80 ┤           ╰──╮╭╯                   ╰──╮
 60 ┤             ╰╯                      ╰──╮
 40 ┤                                        ╰──╮ (Mediana)
 20 ┤
  0 ┼────┬────┬────┬────┬────┬────┬────┬────┬────
     2017 2018 2019 2020 2021 2022 2023 2024 2025 2026
```

### Conclusión

> **Dos administraciones destacadas:**
>
> - **2020-2022 (Óptima):** Tiempos más bajos de la serie histórica (promedio ~70-80 días, mediana ~47-53 días). Coincide con mejor captura de coordenadas.
> - **2024-2026 (Crítica):** **Tiempos se triplican** respecto al óptimo (promedio ~180-190 días, mediana ~120-150 días). Coincide con el colapso en calidad de captura (coordenadas y campos faltantes).
>
> **Patrón sistémico:** Cuando la captura de datos empeora (sin coordenadas, campos faltantes), los tiempos de resolución **aumentan drásticamente**. Sugiere que la falta de información completa en el ingreso genera ciclos de requerimientos y retrasos.

---

## Hallazgos Adicionales

### 5. Posibles Re-Ingresos (Mismo Proyecto, Expediente Distinto)

**Objetivo:** Detectar proyectos que "desistieron" y re-ingresaron con otro expediente (ej. San Vicente).

**Método:** Comparación de nombre de proyecto + promovente (coincidencia ≥75% tokens o inclusión mutua).

**Total detectados:** **511 casos** de posibles re-ingresos

#### Casos Notables

| Proyecto | Promovente | Expediente Original | Re-Ingresos Detectados |
|----------|------------|---------------------|------------------------|
| **FRACCIONAMIENTO MIXTO "SAN VICENTE"** | FERNANDO CEDILLO ESTRADA | SSMAA-DIRA-2918-2026 | SSMAA-DIRA-2853-2026 |
| BANCO DE MATERIALES LA LOMITA | C. JOSE PONSE ROMERO | SSMAA-DIRA-2934-2026 | 2192-2021, 2115-2021, 2116-2021 |
| CENTRO DE ACOPIO RECUPERADORA PEÑUELAS | LUIS FRANCISCO MUÑOZ | SSMAA-DIRA-2877-2026 | 14+ expedientes (2017-2025) |
| CONSTRUCCIÓN NAVE O'REILLY | IMPULSORA DE REFACCIONARIAS | SSMAA-DIRA-2913/2026 | 10+ expedientes (2017-2023) |
| HOSPITAL GENERAL ZONA 70 CAMAS | IMSS / DR. MISAEL LEY | SSMAA-DIRA-2922/2026 | SSMAA-DIRA-2901-2026 |

### 6. Boletines Vacíos (Sin Publicación Efectiva)

**14 boletines** sin proyectos ingresados ni resolutivos:

| ID | Año-Mes | Fecha Publicación |
|----|---------|-------------------|
| 202627 | 2026-Julio | 2026-07-07 |
| 202614 | 2026-Abril | 2026-04-07 |
| 202602 | 2026-Enero | 2026-01-13 |
| 202537 | 2025-Septiembre | 2025-09-15 |
| 202528 | 2025-Julio | 2025-07-15 |
| 202520 | 2025-Mayo | 2025-05-20 |
| 202503 | 2025-Enero | 2025-01-21 |
| 202412 | 2024-Marzo | 2024-03-26 |
| 202402 | 2024-Enero | 2024-01-16 |
| 202401 | 2024-Enero | 2024-01-09 |

> **Patrón:** Concentrados en 2024-2026. Podrían ser boletines "ceremoniales" o errores de publicación.

### 7. Boletines con Fecha Inconsistente (Creación ≠ Publicación)

**361 boletines (72.8%)** tienen fecha de creación del PDF distinta a la fecha de publicación oficial.

- **Negativo (creado antes):** ~180 casos — PDF generado días/semanas antes de publicar (normal)
- **Positivo (creado después):** ~181 casos — **PDF creado DESPUÉS de la publicación oficial** (anómalo)

#### Top 10 Mayor Retraso (creación posterior a publicación)

| ID Boletín | Fecha Publicación | Fecha Creación PDF | Días Retraso |
|------------|-------------------|-------------------|--------------|
| 202621 | 2026-05-26 | 2026-07-23 | **+58** |
| 202622 | 2026-05-26 | 2026-06-02 | +7 |
| 202620 | 2026-05-19 | 2026-05-25 | +6 |
| 202533 | 2025-08-18 | 2025-09-01 | +14 |
| 202435 | 2024-09-09 | 2024-09-23 | +14 |

> **Alerta:** 58 días de retraso en la creación del PDF vs publicación sugiere **reconstrucción documental posterior** o backdating.

---

## Conclusiones y Recomendaciones

### Patrones Sistémicos Detectados

1. **Correlación Calidad-Velocidad:** Los períodos con mala captura (sin coordenadas, campos faltantes) coinciden exactamente con los de **mayor tiempo de resolución** (2024-2026).

2. **Ciclo por Administración:**
   - 2017-2019: Calidad baja, velocidad baja
   - 2020-2022: Calidad alta, velocidad alta (óptimo)
   - 2023-2025: Calidad colapsada, velocidad colapsada
   - 2026: Calidad recuperándose, velocidad aún lenta

3. **Sector Crítico:** **Industria/Mina/Materiales** concentra el mayor volumen (587 proyectos) y peor calidad geoespacial (50% sin coordenadas) + mayor tiempo de resolución (113 días promedio).

### Recomendaciones Prioritarias

| Prioridad | Acción | Impacto Esperado |
|-----------|--------|------------------|
| **ALTA** | Validación obligatoria de coordenadas al ingreso (UI + backend) | Reducir 50% sin coords en Industria |
| **ALTA** | Auditoría de boletines 2024-2025 con fechas inconsistentes (>30 días retraso) | Detectar backdating |
| **MEDIA** | Deduplicación automática de re-ingresos (alertar si nombre+promovente ya existe) | Evitar 511 casos de tramitación duplicada |
| **MEDIA** | KPI mensual: % proyectos con coordenadas + tiempo resolución por categoría | Monitoreo temprano de degradación |
| **BAJA** | Revisar 14 boletines vacíos — ¿error de publicación o decisión administrativa? | Limpieza de catálogo |

---

## Apéndice: Metodología Técnica

### Deduplicación de Proyectos
- Agrupados por `claveExpediente` (normalizado: minúsculas, sin espacios/caracteres especiales)
- Prioridad: proyecto con coordenadas válidas > más reciente por fecha publicación

### Matching Ingreso-Resolutivo
- Mismo expediente normalizado + coincidencia nombre/promovente (≥75% Jaccard o inclusión tokens)
- Coordenadas heredadas del ingreso al resolutivo

### Categorización de Giro
```javascript
if (fraccionamiento/vivienda/habitacional) → 'Fraccionamientos habitacionales'
else if (industria/mina/materiales/banco/cantera) → 'Industria/Mina/Materiales'
else if (gobierno/municipal/estatal/federal/ente/dependencia/secretaría/comisión/instituto/organismo) → 'Gobierno/Entes públicos'
else → 'Otros'
```

### Cálculo de Días
- `diferenciaDiasCalendario(fecha_ingreso, fecha_resolutivo)` usando UTC (evita problemas de zona horaria)
- Solo días calendario (no hábiles)

### Filtrado de Outliers
- Excluidos resolutivos sin fecha_ingreso o fecha_resolutivo
- Excluidos diferencias negativas (error de datos)

---

*Informe generado automáticamente desde datos de Supabase. Código de análisis disponible en el repositorio.*