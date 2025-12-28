import { useContext, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, TreePine, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { DataContext } from '../../../context/DataContext';
import { getRandomUnsplashImage } from '../../../utils/helpers/imageHelpers';
import { findEventByIdentifier } from '../../../utils/helpers/slugHelpers';

interface ImpactDetailPageProps {
  eventId: string | number;
  onBack: () => void;
}

const ImpactDetailPage = ({ eventId, onBack }: ImpactDetailPageProps) => {
  const { pastEvents, loading } = useContext(DataContext) as any;
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  // Buscar el evento por slug o ID (compatibilidad con URLs antiguas)
  const event = findEventByIdentifier(pastEvents, eventId);
  
  
  // Extraer todas las URLs de imágenes del contenido markdown
  const extractImageUrls = (markdown: string): string[] => {
    if (!markdown) return [];
    // Buscar imágenes en formato markdown: ![alt](url) o <img src="url">
    const markdownImages = markdown.match(/!\[.*?\]\((.*?)\)/g) || [];
    const htmlImages = markdown.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
    
    const urls: string[] = [];
    
    // Extraer URLs de markdown
    markdownImages.forEach(match => {
      const urlMatch = match.match(/\((.*?)\)/);
      if (urlMatch && urlMatch[1]) {
        urls.push(urlMatch[1]);
      }
    });
    
    // Extraer URLs de HTML
    htmlImages.forEach(match => {
      const urlMatch = match.match(/src=["']([^"']+)["']/i);
      if (urlMatch && urlMatch[1]) {
        urls.push(urlMatch[1]);
      }
    });
    
    return urls;
  };
  
  // Obtener todas las imágenes: del contenido markdown y de event.images
  const contentImages = event?.content ? extractImageUrls(event.content) : [];
  const galleryImages = event?.images || [];
  const allImages = [...new Set([...contentImages, ...galleryImages])]; // Eliminar duplicados
  
  // Obtener el índice de la imagen actual y total de imágenes
  const currentImageIndex = selectedImageIndex !== null ? selectedImageIndex : null;
  const currentImage = currentImageIndex !== null && allImages.length > 0 ? allImages[currentImageIndex] : null;
  const totalImages = allImages.length;
  
  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentImageIndex === null) return;
      
      if (e.key === 'Escape') {
        setSelectedImageIndex(null);
      } else if (e.key === 'ArrowLeft' && currentImageIndex > 0) {
        setSelectedImageIndex(currentImageIndex - 1);
      } else if (e.key === 'ArrowRight' && currentImageIndex < totalImages - 1) {
        setSelectedImageIndex(currentImageIndex + 1);
      }
    };
    
    if (currentImageIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentImageIndex, totalImages]);
  
  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center p-6">
        <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Cargando evento...</h2>
            <p className="text-gray-600">Obteniendo información</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Solo mostrar "no encontrado" si ya terminó de cargar y no encontró el evento
  if (!event) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center p-6">
        <div className="bg-white border-2 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Evento no encontrado</h2>
          <p className="mb-6">No se pudo cargar la información del evento.</p>
          <button
            onClick={onBack}
            className="bg-black text-white px-6 py-3 font-bold uppercase hover:bg-[#ff7e67] transition-colors border-2 border-black"
          >
            Volver a la Bitácora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center pb-20">
      <div className="w-full h-[40vh] bg-black relative overflow-hidden border-b-4 border-black">
        <div className="absolute inset-0 opacity-60">
           <img 
             src={event.portada || getRandomUnsplashImage('impact-detail', 2000, 800)} 
             alt={event.title}
             className="w-full h-full object-cover"
             onError={(e) => {
               (e.target as HTMLImageElement).style.display = 'none';
               const fallback = (e.target as HTMLImageElement).nextElementSibling;
               if (fallback) (fallback as HTMLElement).style.display = 'flex';
             }}
           />
           <div className="absolute inset-0 bg-gray-800 flex items-center justify-center" style={{ display: 'none' }}>
             <TreePine size={64} className="opacity-30 text-white" />
           </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 bg-gradient-to-t from-black to-transparent">
           <button onClick={onBack} className="mb-6 flex items-center gap-2 bg-white text-black px-4 py-2 font-mono uppercase text-xs font-bold border-2 border-black hover:bg-[#ff7e67] hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <ChevronLeft size={16}/> Volver a la Bitácora
           </button>
           <span className="bg-[#b4ff6f] text-black px-3 py-1 font-mono text-xs font-bold uppercase border border-black shadow-[4px_4px_0px_0px_white]">
              {event.category}
           </span>
           <h1 className="text-4xl md:text-6xl font-black text-white mt-4 leading-none tracking-tighter">
              {event.title}
           </h1>
        </div>
      </div>

      <div className="w-full px-6 mt-8 md:mt-12 relative z-10">
         <div className="bg-white border-2 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start border-b border-dashed border-gray-300 pb-6 mb-6">
               <div>
                  <p className="font-mono text-xs uppercase text-gray-500 mb-1">Fecha de Ejecución</p>
                  <p className="font-bold text-xl">{event.date}</p>
               </div>
               <div className="text-right">
                  <p className="font-mono text-xs uppercase text-gray-500 mb-1">Impacto Directo</p>
                  <p className="font-black text-2xl text-[#ff7e67]">{event.stats}</p>
               </div>
            </div>
            
            <div className="markdown-content font-serif text-gray-800 leading-relaxed">
              {event.content ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    // Estilos para párrafos
                    p: ({ children }) => <p className="mb-4 text-base leading-relaxed">{children}</p>,
                    // Estilos para encabezados
                    h1: ({ children }) => <h1 className="text-3xl font-bold mb-4 mt-6 text-gray-900">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold mb-3 mt-5 text-gray-900">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-bold mb-2 mt-4 text-gray-900">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-lg font-bold mb-2 mt-3 text-gray-900">{children}</h4>,
                    // Estilos para listas
                    ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-2">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    // Estilos para texto fuerte y énfasis
                    strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    // Estilos para código
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900">{children}</code>
                      ) : (
                        <code className={className}>{children}</code>
                      );
                    },
                    pre: ({ children }) => (
                      <pre className="bg-gray-100 border-2 border-black p-4 rounded mb-4 overflow-x-auto">
                        {children}
                      </pre>
                    ),
                    // Estilos para enlaces
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#ff7e67] underline hover:text-black break-all"
                      >
                        {children}
                      </a>
                    ),
                    // Estilos para citas
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-400 pl-4 italic my-4 text-gray-700">
                        {children}
                      </blockquote>
                    ),
                    // Estilos para imágenes con navegación
                    img: ({ src, alt }) => {
                      const imageIndex = allImages.findIndex((url: string) => url === src);
                      return (
                        <img 
                          src={src} 
                          alt={alt || ''} 
                          className="max-w-full h-auto my-4 rounded border-2 border-black cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            if (imageIndex !== -1) {
                              setSelectedImageIndex(imageIndex);
                            }
                          }}
                        />
                      );
                    },
                    // Estilos para videos de Notion
                    div: ({ className, children, ...props }: any) => {
                      // Manejar columnas primero
                      if (className?.includes('notion-column-list')) {
                        return (
                          <div className="notion-column-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-6" {...props}>
                            {children}
                          </div>
                        );
                      }
                      if (className?.includes('notion-column')) {
                        // El contenido de la columna puede tener markdown que necesita procesarse
                        const hasMarkdown = typeof children === 'string' && (children.includes('![') || children.includes('\n\n'));
                        return (
                          <div className="notion-column" {...props}>
                            {hasMarkdown ? (
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                  p: ({ children }) => <p className="mb-4 text-base leading-relaxed">{children}</p>,
                                  img: ({ src, alt }) => (
                                    <img 
                                      src={src} 
                                      alt={alt || ''} 
                                      className="max-w-full h-auto my-4 rounded border-2 border-black"
                                    />
                                  ),
                                }}
                              >
                                {children as string}
                              </ReactMarkdown>
                            ) : (
                              children
                            )}
                          </div>
                        );
                      }
                      // Manejar videos de Notion
                      if (className?.includes('notion-video')) {
                        return (
                          <div className={`notion-video my-6 w-full relative ${className}`} style={{ paddingBottom: '56.25%', height: 0 }} {...props}>
                            <div className="absolute top-0 left-0 w-full h-full">
                              {children}
                            </div>
                          </div>
                        );
                      }
                      return <div {...props}>{children}</div>;
                    },
                    // Estilos para iframes (videos embebidos)
                    iframe: ({ src, ...props }: any) => (
                      <iframe 
                        src={src}
                        className="w-full h-full rounded border-2 border-black"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        allowFullScreen
                        {...props}
                      />
                    ),
                    // Estilos para elementos video
                    video: ({ src, ...props }: any) => (
                      <video 
                        src={src}
                        controls
                        className="w-full h-full rounded border-2 border-black"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                        {...props}
                      />
                    ),
                    // Estilos para líneas horizontales
                    hr: () => <hr className="my-6 border-t-2 border-gray-300" />,
                    // Estilos para tablas
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-black">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr className="border-b border-black">{children}</tr>,
                    th: ({ children }) => (
                      <th className="border border-black px-4 py-2 text-left font-bold bg-gray-100">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-black px-4 py-2">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {event.content}
                </ReactMarkdown>
              ) : (
               <p className="text-xl leading-relaxed text-gray-800">
                  {event.summary}
               </p>
              )}
            </div>


            {/* Modal para imagen ampliada */}
            {currentImageIndex !== null && currentImage && (
              <div 
                className="fixed inset-0 z-[100] bg-black bg-opacity-90 flex items-center justify-center p-4"
                onClick={() => setSelectedImageIndex(null)}
              >
                <div 
                  className="group relative w-[90vw] max-w-4xl h-[85vh] max-h-[600px] bg-black rounded-lg overflow-hidden flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Botón cerrar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(null);
                    }}
                    className="absolute top-4 right-4 text-white hover:bg-white hover:text-black transition-all z-[110] bg-black bg-opacity-90 rounded-full p-2 shadow-2xl border-2 border-white/30 hover:border-white"
                    aria-label="Cerrar"
                    style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={24} strokeWidth={3} />
                  </button>
                  
                  {/* Botón anterior */}
                  {currentImageIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(currentImageIndex - 1);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-all opacity-0 group-hover:opacity-100 z-10 bg-black bg-opacity-50 rounded-full p-2 flex items-center justify-center"
                      aria-label="Imagen anterior"
                      style={{ minWidth: '40px', minHeight: '40px' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                  )}
                  
                  {/* Botón siguiente */}
                  {currentImageIndex < totalImages - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(currentImageIndex + 1);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-all opacity-0 group-hover:opacity-100 z-10 bg-black bg-opacity-50 rounded-full p-2 flex items-center justify-center"
                      aria-label="Imagen siguiente"
                      style={{ minWidth: '40px', minHeight: '40px' }}
                    >
                      <ChevronRight size={24} />
                    </button>
                  )}
                  
                  {/* Contador de imágenes */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 rounded-full px-3 py-1 text-xs font-mono">
                    {currentImageIndex + 1} / {totalImages}
                  </div>
                  
                  {/* Imagen */}
                  <img
                    src={currentImage}
                    alt={`Imagen ${currentImageIndex + 1} de ${totalImages}`}
                    className="max-w-full max-h-full object-contain p-4"
                    onClick={(e) => e.stopPropagation()}
                  />
               </div>
            </div>
            )}
         </div>
      </div>

      <div className="fixed bottom-6 left-0 w-full px-6 z-50 flex justify-center pointer-events-none">
         <button className="pointer-events-auto w-[90vw] max-w-md bg-black text-white font-bold uppercase tracking-widest py-4 rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ff7e67] transition-all flex items-center justify-center gap-2 border-2 border-black">
            Participar en la Siguiente Misión <ArrowRight size={20}/>
         </button>
      </div>
    </div>
  );
};

export default ImpactDetailPage;
