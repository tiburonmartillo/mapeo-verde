import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, TreePine, FileText, LayoutGrid } from 'lucide-react';
import { DataContext } from '../../../context/DataContext';

interface FeaturePreviewProps {
    hoveredFeature: string | null;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onNavigate: (path: string, id?: string | number) => void;
}

export const FeaturePreview = ({
    hoveredFeature,
    onMouseEnter,
    onMouseLeave,
    onNavigate,
}: FeaturePreviewProps) => {
    const {
        greenAreas: GREEN_AREAS_DATA,
        events: EVENTS_DATA,
    } = React.useContext(DataContext);

    return (
        <AnimatePresence>
            {hoveredFeature && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full bg-[#f3f4f0] border-b border-black overflow-hidden"
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                >
                    <div className="py-12 px-6">
                        <div className="max-w-7xl mx-auto">
                            <h2 className="text-3xl font-bold mb-8 text-center uppercase">
                                {hoveredFeature === 'Áreas Verdes' && 'Explora nuestras áreas verdes'}
                                {hoveredFeature === 'Agenda' && 'Próximos Eventos'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {(() => {
                                    let data: any[] = [];
                                    if (hoveredFeature === 'Áreas Verdes') data = GREEN_AREAS_DATA;
                                    else if (hoveredFeature === 'Agenda') data = EVENTS_DATA;

                                    // Ordenar por fecha (más recientes primero) y tomar los 4 más recientes
                                    const sortedData = [...data].sort((a: any, b: any) => {
                                        if (hoveredFeature === 'Áreas Verdes') {
                                            // Para áreas verdes: priorizar las que tienen denuncia (need), luego por ID descendente
                                            if (a.need && !b.need) return -1;
                                            if (!a.need && b.need) return 1;
                                            return (b.id || 0) - (a.id || 0); // IDs más altos primero
                                        } else {
                                            // Para otros: ordenar por fecha descendente (más reciente primero)
                                            const dateA = a.date ? new Date(a.date).getTime() : 0;
                                            const dateB = b.date ? new Date(b.date).getTime() : 0;
                                            return dateB - dateA;
                                        }
                                    });

                                    return sortedData.slice(0, 4).map((item, idx) => (
                                        <div
                                            key={item.id || idx}
                                            onClick={() => {
                                                if (hoveredFeature === 'Áreas Verdes') {
                                                    onNavigate('GREEN_AREAS', item.id);
                                                } else if (hoveredFeature === 'Agenda') {
                                                    onNavigate('AGENDA', item.id);
                                                }
                                            }}
                                            className="border-2 border-black bg-white cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all group h-full flex flex-col"
                                        >
                                            {/* Image or Icon Section */}
                                            <div className="h-48 overflow-hidden border-b-2 border-black relative bg-gray-100 flex items-center justify-center">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name || item.project || item.title}
                                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                ) : null}
                                                {(!item.image || item.image === '') && (
                                                    <div className="p-8 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <TreePine size={64} strokeWidth={1} />
                                                    </div>
                                                )}

                                                <div className="absolute top-2 right-2 bg-white border border-black p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <ArrowRight size={16} />
                                                </div>
                                            </div>

                                            {/* Content Section */}
                                            <div className="p-4 flex-grow">
                                                <h3 className="font-bold text-lg mb-1 leading-tight line-clamp-2">
                                                    {item.name || item.project || item.title}
                                                </h3>
                                                <p className="text-xs font-mono text-gray-500 truncate">
                                                    {item.address || item.status || item.date}
                                                </p>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
