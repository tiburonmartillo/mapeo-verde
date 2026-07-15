import { Box, Chip } from "@mui/material"

interface StatsChipProps {
  label: string
}

function StatsChip({ label }: StatsChipProps) {
  return (
    <Chip
      label={label}
      className="text-sm sm:text-base"
      sx={{
        fontWeight: 600,
        py: 1.5,
        px: 0.5,
        borderRadius: 2,
        border: '1px solid rgba(30, 58, 138, 0.15)',
        bgcolor: 'background.paper',
        '& .MuiChip-label': { px: 2 },
      }}
    />
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
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
      <StatsChip label={`${totalGacetas.toLocaleString()} gacetas con análisis disponible`} />
      {totalProyectos !== undefined && (
        <StatsChip label={`${totalProyectos.toLocaleString()} proyectos ingresados`} />
      )}
      {totalResolutivos !== undefined && (
        <StatsChip label={`${totalResolutivos.toLocaleString()} resolutivos emitidos`} />
      )}
      <StatsChip label={`Rango ${yearRange}`} />
    </Box>
  )
}

