import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { ArrowLeft, Download, BookOpen, TrendingUp, AlertTriangle, MapPin, Clock, Calendar, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const COLORS = {
  industria: '#ff7e67',
  fraccionamientos: '#b4ff6f',
  otros: '#fcd34d',
  gobierno: '#d89dff',
  anomaly: '#ff4444',
  anomalyBg: '#fff0f0',
  primary: '#0d0d0d',
  bg: '#f3f4f0',
  white: '#ffffff',
  border: '#e0e0e0',
  text: '#333333',
  textMuted: '#666666',
};

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const anomalyData = [
  { year: 2017, monthly: [0,9,4,7,5,4,5,8,4,6,7,11], coords: [0,9,4,7,5,4,5,8,4,6,7,11], campos: [0,0,0,0,0,0,0,0,0,0,1,2] },
  { year: 2018, monthly: [3,2,8,3,11,3,5,3,3,5,3,4], coords: [3,2,8,3,11,3,5,3,3,5,3,4], campos: [0,1,0,0,0,1,1,0,1,0,1,0] },
  { year: 2019, monthly: [6,3,2,5,4,4,13,10,7,3,4,13], coords: [6,3,2,5,4,4,13,10,7,3,4,13], campos: [0,0,0,0,1,0,1,0,0,0,1,1] },
  { year: 2020, monthly: [2,5,8,3,1,1,2,4,9,2,2,3], coords: [2,5,8,3,1,1,2,4,9,2,2,3], campos: [0,0,0,0,0,0,0,0,0,1,0,1] },
  { year: 2021, monthly: [1,7,3,3,9,2,4,7,1,5,11,13], coords: [1,7,3,3,9,2,4,7,1,5,11,13], campos: [0,0,1,1,2,0,0,0,0,0,0,0] },
  { year: 2022, monthly: [3,1,5,2,1,1,2,3,15,9,3,14], coords: [3,1,5,2,1,1,2,3,15,9,3,14], campos: [0,1,0,0,1,0,1,1,2,0,1,0] },
  { year: 2023, monthly: [9,0,3,10,11,12,15,11,14,13,8,11], coords: [9,0,3,10,11,12,15,11,14,13,8,11], campos: [1,2,0,1,2,1,0,0,0,1,0,0] },
  { year: 2024, monthly: [8,10,9,3,1,5,2,3,5,3,1,10], coords: [8,10,9,3,1,5,2,3,5,3,1,10], campos: [0,1,1,1,0,0,4,7,14,7,4,17] },
  { year: 2025, monthly: [3,2,9,4,1,1,7,6,4,5,2,10], coords: [3,2,9,4,1,1,7,6,4,5,2,10], campos: [5,5,16,9,7,16,13,6,2,3,1,1] },
  { year: 2026, monthly: [4,4,0,2,5,2,1,1,2,0,0,0], coords: [4,4,0,2,5,2,1,1,2,0,0,0], campos: [0,2,3,0,2,3,1,1,0,0,0,0] },
];

const coordsByCategory = [
  { category: 'Industria/Mina/Materiales', total: 587, sinCoords: 294, pct: 50.1, color: COLORS.industria },
  { category: 'Otros', total: 418, sinCoords: 197, pct: 47.1, color: COLORS.otros },
  { category: 'Fraccionamientos habitacionales', total: 330, sinCoords: 132, pct: 40.0, color: COLORS.fraccionamientos },
];

const resolutionByCategory = [
  { category: 'Industria/Mina/Materiales', casos: 504, promedio: 113.4, mediana: 69, color: COLORS.industria },
  { category: 'Otros', casos: 344, promedio: 99.4, mediana: 68, color: COLORS.otros },
  { category: 'Fraccionamientos habitacionales', casos: 287, promedio: 95.2, mediana: 64, color: COLORS.fraccionamientos },
];

const resolutionByYear = [
  { year: 2017, casos: 107, promedio: 167.6, mediana: 146 },
  { year: 2018, casos: 158, promedio: 104.0, mediana: 76 },
  { year: 2019, casos: 141, promedio: 80.1, mediana: 54 },
  { year: 2020, casos: 140, promedio: 68.0, mediana: 52.5 },
  { year: 2021, casos: 151, promedio: 80.2, mediana: 53 },
  { year: 2022, casos: 136, promedio: 71.3, mediana: 47 },
  { year: 2023, casos: 128, promedio: 76.8, mediana: 52.5 },
  { year: 2024, casos: 77, promedio: 176.4, mediana: 119 },
  { year: 2025, casos: 58, promedio: 193.6, mediana: 133 },
  { year: 2026, casos: 38, promedio: 181.2, mediana: 149.5 },
];

const reingresosNotables = [
  { proyecto: 'FRACCIONAMIENTO MIXTO "SAN VICENTE"', promovente: 'FERNANDO CEDILLO ESTRADA', original: 'SSMAA-DIRA-2918-2026', reingresos: ['SSMAA-DIRA-2853-2026'], categoria: 'Fraccionamientos' },
  { proyecto: 'BANCO DE MATERIALES LA LOMITA', promovente: 'C. JOSE PONSE ROMERO', original: 'SSMAA-DIRA-2934-2026', reingresos: ['SSMAA-DIRA-2192-2021', 'SSMAA-DIRA-2115-2021', 'SSMAA-DIRA-2116-2021'], categoria: 'Industria/Mina' },
  { proyecto: 'CENTRO DE ACOPIO RECUPERADORA PEÑUELAS', promovente: 'LUIS FRANCISCO MUÑOZ GONZALEZ', original: 'SSMAA-DIRA-2877-2026', reingresos: ['SSMAA-DIRA-2820-2025', 'SSMAA-DIRA-2772-2025', 'SSMAA-DIRA-2496-2023', 'SSMAA-DIRA-2486-2023', 'SSMAA-DIRA-2257-2021', 'SSMAA-DIRA-2194-2021', 'SSMAA-DIRA-2034-2020', 'SSMAA-DIRA-1984-2020', 'SSMAA-DIRA-1969-2020', 'SSMAA-DIRA-1923-19', 'SSMAA-DIRA-1909-19', 'SSMAA-DIRA-1835-19', 'SSMAA-DIRA-1791-18', 'SSMAA-DIRA-1780-18', 'SSMAA-DIRA-1712-18', 'SMAE-DIRA-1672-18', 'SMAE-DIRA-1669-18', 'SMAE-DIRA-1601-17'], categoria: 'Industria/Mina' },
  { proyecto: 'CONSTRUCCIÓN NAVE O\'REILLY', promovente: 'IMPULSORA DE REFACCIONARIAS', original: 'SSMAA-DIRA-2913/2026', reingresos: ['SSMAA-DIRA-2577-2023', 'SSMAA-DIRA-2480-2023', 'SSMAA-DIRA-2399-2022', 'SSMAA-DIRA-2287-2021', 'SSMAA-DIRA-2083-2020', 'SSMAA-DIRA-1863-19', 'SSMAA-DIRA-1811-18', 'SMAE-DIRA-1638-17', 'SMAE-DIRA-1627-17', 'SMAE-DIRA-1588-17'], categoria: 'Industria/Mina' },
  { proyecto: 'HOSPITAL GENERAL ZONA 70 CAMAS', promovente: 'IMSS / DR. MISAEL LEY MEJÍA', original: 'SSMAA-DIRA-2922/2026', reingresos: ['SSMAA-DIRA-2901-2026'], categoria: 'Gobierno/Entes públicos' },
];

const boletinesVacios = [
  { id: '202627', año: 2026, mes: 'Julio', fecha: '2026-07-07' },
  { id: '202614', año: 2026, mes: 'Abril', fecha: '2026-04-07' },
  { id: '202602', año: 2026, mes: 'Enero', fecha: '2026-01-13' },
  { id: '202537', año: 2025, mes: 'Septiembre', fecha: '2025-09-15' },
  { id: '202528', año: 2025, mes: 'Julio', fecha: '2025-07-15' },
  { id: '202520', año: 2025, mes: 'Mayo', fecha: '2025-05-20' },
  { id: '202503', año: 2025, mes: 'Enero', fecha: '2025-01-21' },
  { id: '202412', año: 2024, mes: 'Marzo', fecha: '2024-03-26' },
  { id: '202402', año: 2024, mes: 'Enero', fecha: '2024-01-16' },
  { id: '202401', año: 2024, mes: 'Enero', fecha: '2024-01-09' },
];

const fechasInconsistentesTop = [
  { id: '202621', pub: '2026-05-26', creacion: '2026-07-23', diff: 58 },
  { id: '202533', pub: '2025-08-18', creacion: '2025-09-01', diff: 14 },
  { id: '202435', pub: '2024-09-09', creacion: '2024-09-23', diff: 14 },
  { id: '202622', pub: '2026-05-26', creacion: '2026-06-02', diff: 7 },
  { id: '202620', pub: '2026-05-19', creacion: '2026-05-25', diff: 6 },
];

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        background: COLORS.white, 
        border: '2px solid ' + COLORS.primary, 
        borderRadius: '8px', 
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <p style={{ fontWeight: 'bold', fontSize: '12px', color: COLORS.textMuted, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ 
            margin: '4px 0', 
            fontSize: '14px', 
            color: entry.color,
            fontWeight: index === 0 ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
            {entry.name}: <strong>{entry.value}</strong> {entry.payload?.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

const KPICard = ({ icon: Icon, label, value, trend, color, highlight }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white border-2 border-black p-6 rounded-none hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-shadow duration-300"
    style={{ borderLeft: highlight ? `4px solid ${color}` : 'none' }}
  >
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 flex items-center justify-center ${color} border-2 border-black`}>
        <Icon className="w-5 h-5 text-black" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">{label}</p>
        <p className="text-2xl sm:text-3xl font-bold text-black">{value}</p>
        {trend && (
          <p className={`text-xs font-mono uppercase tracking-wider mt-1 ${trend.startsWith('+') || trend.startsWith('▲') ? 'text-[#ff7e67]' : 'text-[#b4ff6f]'}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  </motion.div>
);

const Section = ({ id, title, subtitle, icon: Icon, children, bgColor = COLORS.white }) => (
  <section 
    id={id} 
    className="py-16 sm:py-24 px-4 sm:px-6"
    style={{ backgroundColor: bgColor }}
  >
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#b4ff6f] border-2 border-black flex items-center justify-center">
            <Icon className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-black">{title}</h2>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {children}
      </div>
    </div>
  </section>
);

const ChartCard = ({ title, subtitle, children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={`bg-white border-2 border-black p-6 ${className}`}
  >
    <div className="mb-6">
      <h3 className="font-bold text-lg text-black mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 font-mono uppercase tracking-wider">{subtitle}</p>}
    </div>
    <div style={{ height: 320 }}>{children}</div>
  </motion.div>
);

const TableCard = ({ title, subtitle, headers, rows, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={`bg-white border-2 border-black p-6 ${className}`}
  >
    <div className="mb-4">
      <h3 className="font-bold text-lg text-black mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 font-mono uppercase tracking-wider">{subtitle}</p>}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-black bg-gray-50">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-bold text-black font-mono uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={`border-b border-gray-200 ${ri % 2 === 1 ? 'bg-gray-50' : ''} hover:bg-[#f3f4f0]`}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-gray-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);

const AnomalyHeatmap = ({ selectedYear, onYearChange }) => {
  const yearData = anomalyData.find(d => d.year === selectedYear);
  if (!yearData) return null;

  const heatmapData = MONTHS.map((month, i) => ({
    month,
    total: yearData.monthly[i],
    coords: yearData.coords[i],
    campos: yearData.campos[i],
    pctCoords: yearData.monthly[i] ? Math.round((yearData.coords[i] / yearData.monthly[i]) * 100) : 0,
  }));

  const maxTotal = Math.max(...heatmapData.map(d => d.total));

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <label className="font-mono text-xs uppercase tracking-wider text-gray-500">Año:</label>
        <select
          value={selectedYear}
          onChange={e => onYearChange(Number(e.target.value))}
          className="px-3 py-2 border-2 border-black bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          {anomalyData.map(d => <option key={d.year} value={d.year}>{d.year}</option>)}
        </select>
        <div className="flex gap-4 text-xs font-mono text-gray-500 ml-auto">
          <span>Total: <strong className="text-black">{yearData.monthly.reduce((a,b)=>a+b,0)}</strong></span>
          <span style={{color: COLORS.anomaly}}>Sin coords: <strong className="text-black">{yearData.coords.reduce((a,b)=>a+b,0)}</strong></span>
          <span style={{color: COLORS.anomaly}}>Campos faltantes: <strong className="text-black">{yearData.campos.reduce((a,b)=>a+b,0)}</strong></span>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-1 mb-2">
        {MONTHS.map((m, i) => (
          <div key={i} className="text-center text-xs font-mono text-gray-500 py-1">{m}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-12 gap-1">
        {heatmapData.map((d, i) => (
          <div
            key={i}
            className="relative aspect-square flex flex-col items-center justify-center cursor-pointer group"
            style={{ 
              backgroundColor: d.total > 0 
                ? `rgba(255, 68, 68, ${0.15 + (d.pctCoords / 100) * 0.7})` 
                : 'transparent',
              border: '1px solid ' + (d.total > 0 ? COLORS.border : 'transparent')
            }}
            title={`${d.month} ${selectedYear}: ${d.total} proyectos, ${d.coords} sin coords (${d.pctCoords}%), ${d.campos} campos faltantes`}
          >
            <span className="text-xs font-bold text-black z-10">{d.total}</span>
            {d.coords > 0 && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono" style={{color: COLORS.anomaly}}>{d.pctCoords}%</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center gap-4 text-xs font-mono text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4" style={{background: 'rgba(255,68,68,0.3)', border: '1px solid ' + COLORS.border}} />
          <span>Intensidad = % sin coordenadas</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 border border-black bg-white" />
          <span>Número = total proyectos</span>
        </div>
      </div>
    </div>
  );
};

const InformeAnalisisPage = () => {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [activeTab, setActiveTab] = useState('resumen');

  const tabs = [
    { id: 'resumen', label: 'Resumen Ejecutivo', icon: BookOpen },
    { id: 'anomalias', label: 'Anomalías por Mes/Año', icon: AlertTriangle },
    { id: 'coords', label: 'Coordenadas por Tipo', icon: MapPin },
    { id: 'resolucion', label: 'Tiempo de Resolución', icon: Clock },
    { id: 'extra', label: 'Hallazgos Extra', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f0] font-sans">
      {/* Header con breadcrumb y botón volver */}
      <div className="sticky top-0 z-40 bg-white border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/investigacion')}
              className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-black hover:bg-[#b4ff6f] transition-colors focus:outline-none focus:ring-2 focus:ring-black"
              aria-label="Volver a Investigación"
            >
              <ArrowLeft className="w-4 h-4 text-black" />
              <span className="font-mono text-xs uppercase tracking-wider text-black hidden sm:inline">Volver</span>
            </button>
            
            <div className="flex-1 text-center">
              <h1 className="font-bold text-lg sm:text-xl text-black">Informe de Análisis - Boletines Ambientales</h1>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">SSMAA Aguascalientes · 496 boletines · 1,335 proyectos · 1,161 resolutivos</p>
            </div>
            
            <div className="w-20" />
          </div>

          {/* Tab Navigation */}
          <div className="border-t border-black pb-4">
            <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="Secciones del informe">
              {tabs.map((tab, idx) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 border-2 transition-colors duration-200 font-mono text-xs uppercase tracking-wider ${activeTab === tab.id 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black hover:bg-gray-100'}`}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* KPIs Resumen */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8"
        >
          <KPICard icon={BookOpen} label="Boletines" value="496" color="bg-[#b4ff6f]" highlight />
          <KPICard icon={MapPin} label="Proyectos únicos" value="1,335" trend="+ dedup" color="bg-[#ff7e67]" />
          <KPICard icon={Clock} label="Resolutivos" value="1,161" color="bg-[#fcd34d]" />
          <KPICard icon={AlertTriangle} label="Sin coordenadas" value="52%" trend="Crítico" color="bg-[#ff7e67]" highlight />
          <KPICard icon={Zap} label="Re-ingresos" value="511" trend="Duplicados" color="bg-[#d89dff]" />
        </motion.div>

        {activeTab === 'resumen' && (
          <>
            <Section 
              id="resumen" 
              title="Conclusiones Clave" 
              subtitle="Patrones sistémicos detectados en 10 años de datos"
              icon={BookOpen}
            >
              <ChartCard 
                title="Ciclo por Administración: Calidad ↔ Velocidad" 
                subtitle="Correlación directa entre calidad de captura y eficiencia de resolución"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={resolutionByYear} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCalidad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b4ff6f" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#b4ff6f" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVelocidad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff7e67" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff7e67" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={{ stroke: COLORS.primary }}
                      tickLine={{ stroke: COLORS.primary }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fontFamily: 'monospace' }}
                      axisLine={{ stroke: COLORS.primary }}
                      tickLine={{ stroke: COLORS.primary }}
                      label={{ value: 'Días', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }}
                    />
                    <Tooltip content={CustomTooltip} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="promedio"
                      name="Promedio días resolución"
                      stroke="#ff7e67"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorVelocidad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="mediana"
                      name="Mediana días resolución"
                      stroke="#b4ff6f"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCalidad)"
                    />
                    <Line
                      type="monotone"
                      dataKey="promedio"
                      stroke="#ff7e67"
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2, stroke: '#ff7e67', fill: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="mediana"
                      stroke="#b4ff6f"
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2, stroke: '#b4ff6f', fill: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard 
                title="Hallazgos Principales" 
                subtitle="Tres patrones críticos que requieren acción inmediata"
              >
                <div className="space-y-4">
                  {[
                    { icon: AlertTriangle, color: '#ff7e67', title: 'COLAPSO 2023-2025', desc: 'Calidad de captura se degrada al 92% sin coordenadas (2023) y 53% campos faltantes (2025). Coincide con triplicación de tiempos de resolución (68 → 194 días).' },
                    { icon: MapPin, color: '#b4ff6f', title: 'INDUSTRIA = MAYOR RIESGO', desc: '50% de proyectos industriales/mineros sin coordenadas válidas. Son los de mayor impacto ambiental y los que más tardan en resolverse (113 días promedio).' },
                    { icon: Zap, color: '#fcd34d', title: '511 RE-INGRESOS DETECTADOS', desc: 'Mismos proyectos/promoventes re-ingresan con nuevos expedientes. Caso San Vicente: 2 expedientes. Recuperadora Peñuelas: 18+ expedientes en 8 años.' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="flex gap-4 p-4 bg-gray-50 border border-gray-200 hover:border-black hover:bg-white transition-colors"
                    >
                      <div className={`w-10 h-10 flex items-center justify-center border-2 border-black ${item.color}`}>
                        <item.icon className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <p className="font-bold text-black mb-1">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ChartCard>
            </Section>
          </>
        )}

        {activeTab === 'anomalias' && (
          <Section 
            id="anomalias" 
            title="Anomalías por Mes y Año" 
            subtitle="Calidad de captura: coordenadas y campos obligatorios por mes (2017-2026)"
            icon={AlertTriangle}
          >
            <ChartCard title="Mapa de Calor: Proyectos por Mes" subtitle="Intensidad roja = % proyectos sin coordenadas. Número = total proyectos/mes.">
              <AnomalyHeatmap selectedYear={selectedYear} onYearChange={setSelectedYear} />
            </ChartCard>

            <ChartCard title="Tendencia Anual: % Sin Coordenadas" subtitle="Porcentaje mensual promedio por año">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={anomalyData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} />
                  <YAxis dataKey="year" type="category" width={60} tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} />
                  <Tooltip content={CustomTooltip} />
                  <Legend />
                  {anomalyData.map((_, i) => (
                    <Bar key={i} dataKey={`coordsPct`} name="% Sin coords" fill="#ff7e67" radius={[0, 4, 4, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Section>
        )}

        {activeTab === 'coords' && (
          <Section 
            id="coords" 
            title="Proyectos Sin Coordenadas por Tipo de Proyecto" 
            subtitle="Categorización de giros: Industria/Mina/Materiales, Fraccionamientos, Gobierno, Otros"
            icon={MapPin}
          >
            <ChartCard title="Distribución por Categoría" subtitle="Total proyectos vs. sin coordenadas válidas">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coordsByCategory} layout="vertical" margin={{ top: 10, right: 30, left: 140, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} />
                  <YAxis dataKey="category" type="category" width={140} tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} />
                  <Tooltip content={CustomTooltip} />
                  <Legend />
                  <Bar dataKey="total" name="Total proyectos" fill="#e0e0e0" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="sinCoords" name="Sin coordenadas" fill="#ff7e67" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Porcentaje sin Coordenadas" subtitle="Industria/Mina/Materiales concentra el mayor riesgo geoespacial">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coordsByCategory} layout="vertical" margin={{ top: 10, right: 30, left: 140, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis type="number" domain={[0, 60]} tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} tickFormatter={v => `${v}%`} />
                  <YAxis dataKey="category" type="category" width={140} tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} />
                  <Tooltip content={CustomTooltip} />
                  {coordsByCategory.map((d, i) => (
                    <Bar key={i} dataKey="pct" name="% Sin coords" fill={d.color} radius={[0, 4, 4, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Section>
        )}

        {activeTab === 'resolucion' && (
          <Section 
            id="resolucion" 
            title="Tiempo de Resolución" 
            subtitle="Días calendario entre fecha de ingreso y fecha de resolutivo"
            icon={Clock}
          >
            <ChartCard title="Por Categoría de Giro" subtitle="Promedio vs Mediana (días) — La diferencia indica outliers">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resolutionByCategory} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} />
                  <YAxis type="number" tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} label={{ value: 'Días', angle: -90, position: 'insideLeft', offset: 10 }} />
                  <Tooltip content={CustomTooltip} />
                  <Legend />
                  <Bar dataKey="promedio" name="Promedio" fill="#ff7e67" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mediana" name="Mediana" fill="#b4ff6f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Evolución Anual (Por Año de Resolutivo)" subtitle="2020-2022: óptimo (mediana ~50 días). 2024-2026: colapso (mediana ~120-150 días)">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={resolutionByYear} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} label={{ value: 'Días', angle: -90, position: 'insideLeft', offset: 10 }} />
                  <Tooltip content={CustomTooltip} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="promedio" 
                    name="Promedio" 
                    stroke="#ff7e67" 
                    strokeWidth={3} 
                    dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 7 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mediana" 
                    name="Mediana" 
                    stroke="#b4ff6f" 
                    strokeWidth={3} 
                    dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Casos por Año (Volumen de Resolutivos)" subtitle="El volumen cae drásticamente 2024-2026 mientras los tiempos se disparan">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resolutionByYear} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: COLORS.primary }} />
                  <Tooltip content={CustomTooltip} />
                  <Bar dataKey="casos" name="Resolutivos" fill="#fcd34d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Section>
        )}

        {activeTab === 'extra' && (
          <Section 
            id="extra" 
            title="Hallazgos Adicionales" 
            subtitle="Re-ingresos, boletines vacíos y fechas inconsistentes"
            icon={Zap}
          >
            <ChartCard title="Top 5 Re-Ingresos Detectados" subtitle="Mismo proyecto/promovente, expediente distinto (511 casos totales)" className="lg:col-span-2">
              <div className="space-y-4">
                {reingresosNotables.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 bg-gray-50 border border-gray-200 hover:border-black hover:bg-white transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 flex items-center justify-center border-2 border-black text-xs font-mono ${item.categoria === 'Industria/Mina' ? 'bg-[#ff7e67]' : item.categoria === 'Fraccionamientos' ? 'bg-[#b4ff6f]' : 'bg-[#d89dff]'}`}>
                        {item.categoria === 'Industria/Mina' ? '🏭' : item.categoria === 'Fraccionamientos' ? '🏘️' : '🏛️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-black truncate">{item.proyecto}</p>
                        <p className="text-sm text-gray-500 font-mono">{item.promovente}</p>
                        <p className="text-xs text-gray-400 mt-1">Original: <span className="font-mono text-black">{item.original}</span></p>
                        <p className="text-xs text-gray-400 mt-1">Re-ingresos: <span className="font-mono text-[#ff7e67]">{item.reingresos.length} ({item.reingresos.slice(0,3).join(', ')}{item.reingresos.length > 3 ? '...' : ''})</span></p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Boletines Vacíos (Sin Contenido)" subtitle="14 boletines sin proyectos ni resolutivos — concentrados 2024-2026" className="lg:col-span-2">
              <TableCard 
                title="" 
                subtitle=""
                headers={['ID Boletín', 'Año', 'Mes', 'Fecha Publicación']}
                rows={boletinesVacios.map(b => [b.id, b.año, b.mes, b.fecha])}
              />
            </ChartCard>

            <ChartCard title="Fechas Inconsistentes: PDF Creado DESPUÉS de Publicación" subtitle="181 boletines con creación posterior (anómalo). Top 5 mayor retraso:" className="lg:col-span-2">
              <TableCard 
                title="" 
                subtitle=""
                headers={['ID Boletín', 'Fecha Publicación', 'Fecha Creación PDF', 'Días Retraso']}
                rows={fechasInconsistentesTop.map(f => [f.id, f.pub, f.creacion, `+${f.diff} días`])}
              />
            </ChartCard>
          </Section>
        )}

        {/* Footer del informe */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 py-12 border-t-2 border-black bg-white"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h4 className="font-bold text-black mb-3 font-mono uppercase tracking-wider text-sm">Metodología</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Deduplicación por expediente normalizado (claveExpediente)</li>
                  <li>• Matching ingreso-resolutivo: expediente + nombre/promovente (Jaccard ≥75%)</li>
                  <li>• Categorización giro: palabras clave en campo 'giro'</li>
                  <li>• Días calendario (UTC) entre fecha_ingreso y fecha_resolutivo</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-black mb-3 font-mono uppercase tracking-wider text-sm">Recomendaciones</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Validación obligatoria de coordenadas al ingreso (UI + backend)</li>
                  <li>• Auditoría boletines 2024-2025 con retraso PDF mayor a 30 días</li>
                  <li>• Alerta automática de re-ingreso (nombre+promovente duplicado)</li>
                  <li>• KPI mensual: % coords + tiempo resolución por categoría</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-black mb-3 font-mono uppercase tracking-wider text-sm">Fuente</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Datos: Supabase (tabla <code className="bg-gray-100 px-1 font-mono">boletines</code>)<br/>
                  Período: Dic 2016 – Oct 2026
                </p>
                <button
                  onClick={() => {
                    const markdown = `# Informe de Análisis - Boletines Ambientales SSMAA\n\n[Contenido completo en docs/informe-analisis-dashboard.md]`;
                    navigator.clipboard.writeText(markdown);
                    alert('Resumen copiado al portapapeles');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-white text-black font-bold font-mono text-xs uppercase tracking-wider hover:bg-[#b4ff6f] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Copiar Markdown
                </button>
              </div>
            </div>
            <div className="border-t border-gray-300 pt-4 text-center text-xs font-mono text-gray-500 uppercase tracking-widest">
              Mapeo Verde · Datos Abiertos · Licencia CC-BY-SA 4.0 · Aguascalientes, MX
            </div>
          </div>
        </motion.footer>
      </main>
    </div>
  );
};

export default InformeAnalisisPage;