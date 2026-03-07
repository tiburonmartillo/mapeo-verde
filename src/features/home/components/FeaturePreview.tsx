import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, TreePine } from 'lucide-react';
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
    const todayInCdmx = new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Mexico_City',
    });

    return (
        <AnimatePresence>
            {hoveredFeature && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full bg-[#f3f4f0] text-black border-b border-black overflow-hidden"
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                >
                    <div className="py-12 px-6">
                        <div className="max-w-7xl mx-auto">
                            <h2 className="text-3xl font-bold mb-8 text-center uppercase text-black">
                                {hoveredFeature === 'Agenda' && 'Próximos eventos'}
                                {hoveredFeature === 'Participación' && 'Contribuye con tu voz'}
                                {hoveredFeature === 'Áreas Verdes' && 'Explora nuestras áreas verdes'}
                            </h2>
                            <div className={hoveredFeature === 'Participación' ? 'flex justify-center' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}>
                                {hoveredFeature === 'Participación' ? (
                                    <div
                                        onClick={() => onNavigate('PARTICIPATION')}
                                        className="w-full max-w-2xl border-2 border-black bg-white cursor-pointer hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all group flex flex-col"
                                    >
                                        <div className="h-48 overflow-hidden border-b-2 border-black relative bg-[#d89dff] flex items-center justify-center p-6">
                                            <p className="text-lg font-serif text-center text-black">
                                                Usa este formulario para proponer una nueva área verde al inventario o sugerir un evento para la agenda ambiental.
                                            </p>
                                            <div className="absolute top-2 right-2 bg-white border border-black p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight size={16} />
                                            </div>
                                        </div>
                                        <div className="p-4 flex-grow flex items-center justify-between">
                                            <span className="font-bold text-lg">Ir a participación</span>
                                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                ) : (() => {
                                    let data: any[] = [];
                                    if (hoveredFeature === 'Áreas Verdes') data = GREEN_AREAS_DATA;
                                    else if (hoveredFeature === 'Agenda') {
                                        data = (EVENTS_DATA || []).filter((event: any) => {
                                            const date = (event?.date || '').toString().slice(0, 10);
                                            return date && date >= todayInCdmx;
                                        });
                                    }

                                    const sortedData = [...data].sort((a: any, b: any) => {
                                        if (hoveredFeature === 'Áreas Verdes') {
                                            if (a.need && !b.need) return -1;
                                            if (!a.need && b.need) return 1;
                                            return (b.id || 0) - (a.id || 0);
                                        } else {
                                            const dateA = (a.date || '').toString().slice(0, 10);
                                            const dateB = (b.date || '').toString().slice(0, 10);
                                            return dateA.localeCompare(dateB);
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
                                            <div className="p-4 flex-grow">
                                                <h3 className="font-bold text-lg mb-1 leading-tight line-clamp-2 text-black">
                                                    {item.name || item.project || item.title}
                                                </h3>
                                                <p className="text-xs font-mono text-gray-700 truncate">
                                                    {item.address || item.date}
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
