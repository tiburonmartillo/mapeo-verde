import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#f3f4f0] border-t border-black py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 border-b border-black pb-16 mb-8">
        <div className="col-span-1 md:col-span-2">
           <h4 className="text-2xl font-bold mb-6">Mapeo Verde</h4>
           <p className="max-w-sm font-serif text-lg">
             Una plataforma ciudadana para visibilizar, proteger y expandir las áreas verdes de Aguascalientes. Datos abiertos para la justicia ambiental.
           </p>
        </div>
        
        <div>
          <h5 className="font-mono text-xs uppercase mb-6 tracking-widest">Explorar</h5>
          <ul className="space-y-3 font-medium">
            <li><a href="#" className="hover:underline">Datasets</a></li>
            <li><a href="#" className="hover:underline">Proyectos</a></li>
            <li><a href="#" className="hover:underline">Comunidad</a></li>
            <li><a href="#" className="hover:underline">Blog</a></li>
          </ul>
        </div>

        <div>
          <h5 className="font-mono text-xs uppercase mb-6 tracking-widest">Legal</h5>
          <ul className="space-y-3 font-medium">
            <li><a href="#" className="hover:underline">Privacidad</a></li>
            <li><a href="#" className="hover:underline">Términos</a></li>
            <li><a href="#" className="hover:underline">Cookies</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto text-center">
        <p className="font-mono text-xs text-gray-500">
          © 2025 Mapeo Verde. Datos abiertos bajo licencia CC BY 4.0
        </p>
      </div>
    </footer>
  );
};

