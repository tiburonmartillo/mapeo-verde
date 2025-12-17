const Footer = () => {
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
            <li><a href="#" className="hover:underline focus:outline-none focus:ring-1 focus:ring-black" aria-label="Ver conjuntos de datos">Datasets</a></li>
            <li><a href="#" className="hover:underline focus:outline-none focus:ring-1 focus:ring-black" aria-label="Explorar proyectos activos">Proyectos</a></li>
            <li><a href="#" className="hover:underline focus:outline-none focus:ring-1 focus:ring-black" aria-label="Unirse a la comunidad">Comunidad</a></li>
            <li><a href="#" className="hover:underline focus:outline-none focus:ring-1 focus:ring-black" aria-label="Leer nuestro blog">Blog</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase mb-6 tracking-widest">Legal</h3>
          <ul className="space-y-3 font-medium">
            <li><a href="#" className="hover:underline focus:outline-none focus:ring-1 focus:ring-black" aria-label="Política de privacidad">Privacidad</a></li>
            <li><a href="#" className="hover:underline focus:outline-none focus:ring-1 focus:ring-black" aria-label="Términos de servicio">Términos</a></li>
            <li><a href="#" className="hover:underline focus:outline-none focus:ring-1 focus:ring-black" aria-label="Conoce el uso de cookies">Cookies</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs font-mono uppercase text-gray-500">
        <p>© 2025 MAPEO VERDE. TODOS LOS DERECHOS RESERVADOS.</p>
        <p className="mt-2 md:mt-0">DISEÑADO CON ♥ POR ORÉGANO STUDIO</p>
      </div>
    </footer>
  );
};

export default Footer;
