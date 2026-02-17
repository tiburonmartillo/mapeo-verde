import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { DataContext } from '../../context/DataContext';

const Footer = () => {
  const { supabaseConnected, supabaseError } = useContext(DataContext);

  return (
    <footer className="bg-[#f3f4f0] text-black pt-20 pb-10 px-6" aria-label="Pie de página">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 border-b border-black pb-16 mb-8">
        <div className="col-span-1 md:col-span-2">
          <h2 className="text-2xl font-bold mb-6">Mapeo Verde</h2>
          <p className="max-w-sm font-serif text-lg">
            Una plataforma ciudadana para visibilizar, proteger y expandir las áreas verdes de Aguascalientes. Datos abiertos para la justicia ambiental.
          </p>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase mb-6 tracking-widest">Explorar</h3>
          <ul className="space-y-3 font-medium">
            <li>
              <a
                href="/areas-verdes"
                className="hover:underline focus:outline-none focus:ring-1 focus:ring-black"
                aria-label="Explorar el inventario de áreas verdes"
              >
                Áreas verdes
              </a>
            </li>
            <li>
              <a
                href="/agenda"
                className="hover:underline focus:outline-none focus:ring-1 focus:ring-black"
                aria-label="Ver la agenda ambiental"
              >
                Agenda
              </a>
            </li>
            <li>
              <a
                href="/links"
                className="hover:underline focus:outline-none focus:ring-1 focus:ring-black"
                aria-label="Ver el panel de enlaces rápidos de Mapeo Verde"
              >
                Enlaces rápidos
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase mb-6 tracking-widest">Legal</h3>
          <ul className="space-y-3 font-medium">
            <li>
              <Link
                to="/aviso-de-privacidad"
                className="hover:underline focus:outline-none focus:ring-1 focus:ring-black"
                aria-label="Aviso de privacidad integral"
              >
                Aviso de privacidad
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-xs font-mono uppercase text-gray-500">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <p>© 2025 MAPEO VERDE. TODOS LOS DERECHOS RESERVADOS.</p>
          <span
            className="flex items-center gap-1.5"
            title={supabaseError ?? undefined}
            aria-label={supabaseConnected && !supabaseError ? 'Supabase conectado' : 'Supabase: ver detalle'}
          >
            <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${supabaseConnected && !supabaseError ? 'bg-green-600' : 'bg-amber-500'}`} />
            {supabaseConnected && !supabaseError ? 'Supabase conectado' : supabaseError ? 'Supabase: aviso' : 'Supabase: sin conexión'}
          </span>
        </div>
        <p className="mt-2 md:mt-0">DISEÑADO CON ♥ POR ORÉGANO STUDIO</p>
      </div>
    </footer>
  );
};

export default Footer;
