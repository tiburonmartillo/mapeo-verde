import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  type?: string;
}

const defaultSEO: SEOData = {
  title: 'Mapeo Verde - Plataforma Ciudadana para el Cuidado Ambiental',
  description: 'Combatimos la desigualdad ambiental con datos abiertos. Una herramienta para visibilizar, proteger y expandir nuestras áreas verdes en Aguascalientes.',
  keywords: 'mapeo verde, medio ambiente, áreas verdes, aguascalientes, datos abiertos, participación ciudadana, reforestación, justicia ambiental',
  image: '/favicon.svg',
  type: 'website'
};

const seoByRoute: Record<string, SEOData> = {
  '/': {
    title: 'Mapeo Verde - Plataforma Ciudadana para el Cuidado Ambiental',
    description: 'Combatimos la desigualdad ambiental con datos abiertos. Una herramienta para visibilizar, proteger y expandir nuestras áreas verdes en Aguascalientes.',
    keywords: 'mapeo verde, medio ambiente, áreas verdes, aguascalientes, datos abiertos, participación ciudadana, reforestación, justicia ambiental',
    type: 'website'
  },
  '/agenda': {
    title: 'Agenda Ambiental - Mapeo Verde',
    description: 'Encuentra actividades, talleres y voluntariados cerca de ti. Agenda ambiental con eventos de educación y participación ciudadana.',
    keywords: 'agenda ambiental, eventos ambientales, voluntariado, talleres ambientales, actividades ecológicas, aguascalientes',
    type: 'website'
  },
  '/areas-verdes': {
    title: 'Inventario Verde - Áreas Verdes de Aguascalientes | Mapeo Verde',
    description: 'Explora el catálogo vivo de nuestros parques y jardines. Conoce su estado de salud, necesidades de mantenimiento y valor ambiental.',
    keywords: 'áreas verdes, parques, jardines, inventario verde, aguascalientes, espacios públicos, reforestación',
    type: 'website'
  },
  '/boletines': {
    title: 'Boletines de Impacto - Monitor Ambiental Local | Mapeo Verde',
    description: 'Vigilancia ciudadana sobre los nuevos proyectos de construcción en Aguascalientes. Analizamos las Manifestaciones de Impacto Ambiental (MIA) para detectar riesgos a tiempo.',
    keywords: 'boletines ambientales, MIA, impacto ambiental, proyectos construcción, aguascalientes, alertas ciudadanas',
    type: 'website'
  },
  '/gacetas': {
    title: 'Gacetas Ecológicas - Monitor Federal SEMARNAT | Mapeo Verde',
    description: 'Seguimiento semanal de los proyectos federales que afectan nuestro territorio. Infraestructura carretera, energética e industrial bajo la lupa pública.',
    keywords: 'gacetas semarnat, proyectos federales, impacto ambiental federal, SEMARNAT, infraestructura, aguascalientes',
    type: 'website'
  },
  '/participacion': {
    title: 'Participación Ciudadana - Únete a la Brigada | Mapeo Verde',
    description: 'No somos una empresa. Somos una red descentralizada de ciudadanos construyendo la base de datos ambiental más grande de la región.',
    keywords: 'participación ciudadana, voluntariado ambiental, mapeo colaborativo, datos abiertos, aguascalientes, brigada ambiental',
    type: 'website'
  },
  '/manifiesto': {
    title: 'Manifiesto Mapeo Verde - Nuestros Principios y Valores',
    description: 'Nuestros principios, valores y compromisos en la lucha por la justicia ambiental urbana. Datos abiertos, inteligencia colectiva y acción local.',
    keywords: 'manifiesto ambiental, justicia ambiental, datos abiertos, transparencia, participación ciudadana, aguascalientes',
    type: 'website'
  }
};

export const useSEO = (customSEO?: Partial<SEOData>) => {
  const location = useLocation();
  const baseUrl = import.meta.env.BASE_URL || '/';
  
  // Normalizar el pathname removiendo el base path si existe
  const normalizedPath = location.pathname.replace(baseUrl === '/' ? '' : baseUrl, '') || '/';
  
  const siteUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}${baseUrl === '/' ? '' : baseUrl}`
    : 'https://www.mapeoverde.org';

  useEffect(() => {
    const routeSEO = seoByRoute[normalizedPath] || defaultSEO;
    const seo = { ...routeSEO, ...customSEO };
    
    const fullTitle = seo.title.includes('Mapeo Verde') ? seo.title : `${seo.title} | Mapeo Verde`;
    const fullImage = seo.image 
      ? (seo.image.startsWith('http') ? seo.image : `${siteUrl}${seo.image}`)
      : `${siteUrl}/favicon.svg`;
    
    // Construir URL completa con base path
    const fullUrl = `${siteUrl}${normalizedPath === '/' ? '' : normalizedPath}`;

    // Actualizar title
    document.title = fullTitle;

    // Meta description
    updateMetaTag('description', seo.description);
    
    // Meta keywords
    if (seo.keywords) {
      updateMetaTag('keywords', seo.keywords);
    }

    // Open Graph tags
    updateMetaTag('og:title', fullTitle, 'property');
    updateMetaTag('og:description', seo.description, 'property');
    updateMetaTag('og:type', seo.type || 'website', 'property');
    updateMetaTag('og:url', fullUrl, 'property');
    updateMetaTag('og:image', fullImage, 'property');
    updateMetaTag('og:site_name', 'Mapeo Verde', 'property');
    updateMetaTag('og:locale', 'es_MX', 'property');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', seo.description);
    updateMetaTag('twitter:image', fullImage);

    // Canonical URL
    updateLinkTag('canonical', fullUrl);

    // Schema.org structured data - solo actualizar si no existe o es diferente
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Mapeo Verde',
      url: siteUrl,
      description: seo.description,
      logo: `${siteUrl}/favicon.svg`,
      sameAs: []
    };
    
    if (!existingScript || existingScript.textContent !== JSON.stringify(structuredData)) {
      updateStructuredData(structuredData);
    }
  }, [normalizedPath, customSEO, siteUrl]);
};

const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
};

const updateLinkTag = (rel: string, href: string) => {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  
  element.setAttribute('href', href);
};

const updateStructuredData = (data: any) => {
  let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
  
  if (!script) {
    script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }
  
  script.textContent = JSON.stringify(data);
};

