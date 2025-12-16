const Footer = () => {
  return (
    <footer className="bg-[#f3f4f0] text-black pt-20 pb-10 px-6">
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
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs font-mono uppercase text-gray-500">
        <p>© 2025 MAPEO VERDE. TODOS LOS DERECHOS RESERVADOS.</p>
        <p className="mt-2 md:mt-0">DISEÑADO CON ♥ POR ORÉGANO STUDIO</p>
      </div>
    </footer>
  );
};

export default Footer;
