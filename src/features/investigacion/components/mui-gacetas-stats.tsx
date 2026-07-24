interface StatsChipProps {
  label: string
}

function StatsChip({ label }: StatsChipProps) {
  return (
    <span className="inline-flex items-center rounded-lg border border-blue-900/15 bg-white px-4 py-1.5 text-sm font-semibold sm:text-base">
      {label}
    </span>
  )
}

interface MuiGacetasStatsProps {
  totalGacetas: number
  yearRange: string
  totalProyectos?: number
  totalResolutivos?: number
}

export function MuiGacetasStats({ totalGacetas, yearRange, totalProyectos, totalResolutivos }: MuiGacetasStatsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <StatsChip label={`${totalGacetas.toLocaleString()} gacetas con análisis disponible`} />
      {totalProyectos !== undefined && (
        <StatsChip label={`${totalProyectos.toLocaleString()} proyectos ingresados`} />
      )}
      {totalResolutivos !== undefined && (
        <StatsChip label={`${totalResolutivos.toLocaleString()} resolutivos emitidos`} />
      )}
      <StatsChip label={`Rango ${yearRange}`} />
    </div>
  )
}
