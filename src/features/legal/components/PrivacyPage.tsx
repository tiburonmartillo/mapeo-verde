import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { getNavbarHeight } from '../../../utils/helpers/layoutHelpers';

const PrivacyPage = () => {
  const [navbarHeight, setNavbarHeight] = useState(64);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const update = () => setNavbarHeight(getNavbarHeight());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f4f0] text-black flex flex-col">
      <header
        className="bg-white border-b border-black sticky top-0 z-10"
        style={{ paddingTop: isMobile ? `${navbarHeight}px` : undefined }}
      >
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-black hover:text-[#2f855a] transition-colors"
          >
            <ChevronLeft size={18} /> Volver al inicio
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 pb-24">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
          Aviso de Privacidad Integral
        </h1>
        <p className="font-mono text-sm uppercase text-gray-500 mb-12">Proyecto Mapeo Verde</p>

        <article className="prose prose-lg max-w-none font-serif text-gray-800 space-y-10">
          <section>
            <h2 className="text-xl font-bold text-black mb-3">
              1. ¿Quién es responsable de tus datos?
            </h2>
            <p className="leading-relaxed">
              Mapeo Verde es una iniciativa comunitaria orientada al fortalecimiento de procesos de
              organización socioambiental y defensa del territorio. Para efectos de la legislación
              mexicana en materia de protección de datos personales, la organización responsable del
              tratamiento de los datos recabados a través del formulario de registro de eventos es:
            </p>
            <p className="leading-relaxed mt-4">
              <strong>Mapeo Verde</strong> 
              <br />
              Domicilio: 
              <br />
              Correo electrónico de contacto:{' '}
              <a
                href="mailto:mapeoverdeags@gmail.com"
                className="text-[#2f855a] underline hover:no-underline"
              >
                mapeoverdeags@gmail.com
              </a>
            </p>
            <p className="leading-relaxed mt-2">
              En adelante, “Mapeo Verde” o “la organización responsable”.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">
              2. ¿Qué datos personales recabamos?
            </h2>
            <p className="leading-relaxed mb-4">
              A través del formulario de registro de eventos recabamos los siguientes datos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Datos de identificación:</strong> Nombre de la persona organizadora. Nombre
                de la organización.
              </li>
              <li>
                <strong>Datos de contacto:</strong> Teléfono o forma de contacto proporcionada.
              </li>
              <li>
                <strong>Datos relacionados con la actividad:</strong> Nombre del evento. Fecha, hora
                y lugar. Descripción de la actividad. Tipo, alcance y propósito del evento.
                Información sobre a quién va dirigido.
              </li>
            </ul>
            <p className="leading-relaxed mt-4">No recabamos datos personales sensibles.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">3. ¿Para qué utilizamos tus datos?</h2>
            <p className="leading-relaxed mb-4">
              En Mapeo Verde entendemos que la información compartida forma parte de procesos
              organizativos que deben tratarse con responsabilidad y cuidado. Tus datos serán
              utilizados para las siguientes finalidades:
            </p>
            <p className="leading-relaxed font-semibold">Finalidades primarias (necesarias para el registro del evento):</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Registrar el evento dentro del proyecto Mapeo Verde.</li>
              <li>
                Publicar la información del evento en la{' '}
                <Link to="/agenda" className="text-[#2f855a] underline hover:no-underline">
                  agenda digital
                </Link>{' '}
                (https://mapeoverde.org/agenda).
              </li>
              <li>
                Difundir la información del evento en redes sociales, materiales impresos o medios
                físicos vinculados al proyecto.
              </li>
              <li>Verificar información del evento cuando sea necesario.</li>
            </ul>
            <p className="leading-relaxed font-semibold mt-6">Finalidades secundarias:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                Sistematizar información para comprender mejor los procesos de organización social,
                incidencia y lucha socioambiental.
              </li>
              <li>
                Elaborar reportes, análisis o materiales de reflexión colectiva sobre la actividad
                comunitaria.
              </li>
              <li>Fortalecer la articulación entre organizaciones y actores territoriales.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              En ningún caso los datos de contacto personales serán publicados de manera pública,
              salvo autorización expresa del titular.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">4. ¿Qué información se hace pública?</h2>
            <p className="leading-relaxed mb-4">Únicamente se publicará:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nombre del evento.</li>
              <li>Fecha, hora y lugar.</li>
              <li>Descripción de la actividad.</li>
              <li>Información sobre su propósito y público al que va dirigido.</li>
              <li>Nombre de la organización (cuando así se indique).</li>
              <li>Cartel del evento.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Los datos de contacto (teléfono o forma de contacto) serán utilizados exclusivamente
              para fines internos de verificación y coordinación, y no se harán públicos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">5. ¿Se transfieren tus datos a terceros?</h2>
            <p className="leading-relaxed">
              Para el funcionamiento del formulario y la agenda digital pueden utilizarse
              plataformas tecnológicas que implican almacenamiento en servidores externos (por
              ejemplo, servicios de formularios digitales, hosting web o herramientas de
              geolocalización). Estas transferencias se realizan únicamente para fines operativos y
              bajo estándares de seguridad razonables. No compartimos tus datos personales con
              terceros para fines comerciales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">6. ¿Cómo puedes ejercer tus derechos ARCO?</h2>
            <p className="leading-relaxed mb-4">
              Tienes derecho a: Acceder a tus datos personales. Rectificarlos si son inexactos o
              incompletos. Cancelarlos cuando consideres que no se requieren para las finalidades
              señaladas. Oponerte a su tratamiento para fines específicos.
            </p>
            <p className="leading-relaxed">
              Para ejercer cualquiera de estos derechos puedes enviar una solicitud al correo:{' '}
              <a
                href="mailto:mapeoverdeags@gmail.com"
                className="text-[#2f855a] underline hover:no-underline font-semibold"
              >
                mapeoverdeags@gmail.com
              </a>
            </p>
            <p className="leading-relaxed mt-4">Tu solicitud deberá incluir:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Nombre completo.</li>
              <li>Medio para comunicarte la respuesta.</li>
              <li>Descripción clara del derecho que deseas ejercer.</li>
              <li>Datos que permitan identificar tu registro.</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Responderemos en un plazo razonable conforme a la ley aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">7. Revocación del consentimiento</h2>
            <p className="leading-relaxed">
              En cualquier momento puedes solicitar que tu evento sea retirado de la agenda pública
              o que tus datos de contacto sean eliminados de nuestros registros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-black mb-3">8. Cambios al aviso de privacidad</h2>
            <p className="leading-relaxed">
              Este aviso puede actualizarse para reflejar cambios normativos o ajustes en el
              proyecto. Las modificaciones serán publicadas en el sitio web oficial de Mapeo Verde.
            </p>
          </section>

          <section className="border-l-4 border-[#2f855a] pl-6 py-4 bg-white/50">
            <h2 className="text-xl font-bold text-black mb-3">Nota comunitaria</h2>
            <p className="leading-relaxed">
              Mapeo Verde reconoce que la defensa del territorio y la organización socioambiental
              pueden implicar contextos sensibles. Por ello, nos comprometemos a tratar la
              información compartida con responsabilidad, transparencia y respeto por los procesos
              colectivos.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
};

export default PrivacyPage;
