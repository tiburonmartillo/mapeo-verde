import { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';

interface FilterOptions {
  year?: string;
  type?: string;
  status?: string;
  municipality?: string;
}

interface AdvancedFiltersProps {
  projects: any[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  resultsCount: number;
}

export const AdvancedFilters = ({ projects, filters, onFiltersChange, resultsCount }: AdvancedFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Obtener opciones únicas
  const years = Array.from(new Set(projects.map(p => p.year))).sort((a, b) => b.localeCompare(a));
  const types = Array.from(new Set(projects.map(p => p.type))).filter(Boolean);
  const statuses = Array.from(new Set(projects.map(p => p.status))).filter(Boolean);
  const municipalities = Array.from(new Set(projects.map(p => p.municipality || p.promoter?.split(',')[0]))).filter(Boolean);

  const hasActiveFilters = Object.values(localFilters).some(v => v && v !== 'all');

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleClear = () => {
    const cleared = { year: undefined, type: undefined, status: undefined, municipality: undefined };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  return (
    <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="border-b-2 border-black p-4 flex items-center justify-between bg-black text-white">
        <div className="flex items-center gap-2">
          <Filter size={18} />
          <span className="font-mono text-sm uppercase tracking-widest font-bold">FILTROS</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="px-3 py-1 bg-white text-black hover:bg-gray-200 transition-colors border-2 border-white font-mono text-xs uppercase font-bold"
          >
            <X size={14} className="inline mr-1" />
            LIMPIAR
          </button>
        )}
      </div>

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro: Año */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest font-bold mb-2 text-gray-600">
              AÑO
            </label>
            <select
              value={localFilters.year || 'all'}
              onChange={(e) => setLocalFilters({ ...localFilters, year: e.target.value === 'all' ? undefined : e.target.value })}
              className="w-full border-2 border-black p-2 bg-white font-mono text-sm focus:outline-none focus:ring-0 focus:border-black"
            >
              <option value="all">TODOS LOS AÑOS</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Filtro: Tipo */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest font-bold mb-2 text-gray-600">
              TIPO
            </label>
            <select
              value={localFilters.type || 'all'}
              onChange={(e) => setLocalFilters({ ...localFilters, type: e.target.value === 'all' ? undefined : e.target.value })}
              className="w-full border-2 border-black p-2 bg-white font-mono text-sm focus:outline-none focus:ring-0 focus:border-black"
            >
              <option value="all">TODOS LOS TIPOS</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Filtro: Estado */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest font-bold mb-2 text-gray-600">
              ESTADO
            </label>
            <select
              value={localFilters.status || 'all'}
              onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value === 'all' ? undefined : e.target.value })}
              className="w-full border-2 border-black p-2 bg-white font-mono text-sm focus:outline-none focus:ring-0 focus:border-black"
            >
              <option value="all">TODOS LOS ESTADOS</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Filtro: Municipio */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest font-bold mb-2 text-gray-600">
              MUNICIPIO
            </label>
            <select
              value={localFilters.municipality || 'all'}
              onChange={(e) => setLocalFilters({ ...localFilters, municipality: e.target.value === 'all' ? undefined : e.target.value })}
              className="w-full border-2 border-black p-2 bg-white font-mono text-sm focus:outline-none focus:ring-0 focus:border-black"
            >
              <option value="all">TODOS LOS MUNICIPIOS</option>
              {municipalities.map(municipality => (
                <option key={municipality} value={municipality}>{municipality}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones y contador */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-black">
          <div className="font-mono text-xs text-gray-600">
            {resultsCount} {resultsCount === 1 ? 'RESULTADO' : 'RESULTADOS'} ENCONTRADOS
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              disabled={!hasActiveFilters}
              className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono text-xs uppercase font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:shadow-none"
            >
              LIMPIAR
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 border-2 border-black bg-black text-white hover:bg-gray-800 transition-colors font-mono text-xs uppercase font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              APLICAR FILTROS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

