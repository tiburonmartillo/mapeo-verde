'use client'

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/features/investigacion/components/ui/button';
import { Input } from '@/features/investigacion/components/ui/input';
import { Textarea } from '@/features/investigacion/components/ui/textarea';
import { Label } from '@/features/investigacion/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/investigacion/components/ui/card';
import { Toaster } from '@/features/investigacion/components/ui/toaster';
import { Download, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/features/investigacion/hooks/use-toast';
import { FrogLoading } from '@/features/investigacion/components/frog-loading';
import { coordinateValidator } from '@/features/investigacion/lib/coordinate-validator';
import { getInvestigacionClient } from '@/features/investigacion/lib/supabase-data';

interface Project {
  name: string;
  promoter: string;
  municipality: string;
  entryDate: string;
  expedient: string;
  type: string;
  nature: string;
  imageUrl: string;
  latitude?: number;
  longitude?: number;
  publicConsultationDeadline?: string;
}

interface Resolution {
  name: string;
  promoter: string;
  municipality: string;
  expedient: string;
  resolutionType: string;
  date: string;
  giro: string;
  tipo: string;
  nature: string;
  noOficioResolutivo: string;
  entryBulletinUrl?: string;
  latitude?: number;
  longitude?: number;
}

interface BulletinData {
  date: string;
  projects: Project[];
  resolutions: Resolution[];
  deadlineDate: string;
  comments: string;
}

function fixCoordinateDigits(x: number, y: number): { x: number; y: number } {
  let correctedX = x;
  let correctedY = y;

  if (y > 10000000) {
    const yStr = y.toString();
    if (yStr.length === 8 && yStr.startsWith('24')) {
      correctedY = parseInt(yStr.substring(0, 7));
      console.log(`🔧 Coordenada Y corregida: ${y} -> ${correctedY}`);
    }
  }

  if (x < 10000 && x > 100) {
    correctedX = Math.round(x * 1000);
    console.log(`🔧 Coordenada X corregida: ${x} -> ${correctedX}`);
  }

  return { x: correctedX, y: correctedY };
}

function convertToLatLong(x: number | null, y: number | null): { lat: number; lng: number } | null {
  if (!x || !y) return null

  const { x: correctedX, y: correctedY } = fixCoordinateDigits(x, y);
  const validationResult = coordinateValidator.processCoordinates(correctedX, correctedY);

  if (!validationResult.success) {
    console.warn('Coordenadas inválidas después de corrección:', validationResult.error);
    return null;
  }

  const finalX = validationResult.corrected.x;
  const finalY = validationResult.corrected.y;

  if (validationResult.type === 'latlng') {
    return { lat: finalY, lng: finalX };
  }

  if (validationResult.type === 'utm' || validationResult.type === 'utm14') {
    const zone = validationResult.type === 'utm14' ? 14 : 13;

    const sm_a = 6378137;
    const sm_b = 6356752.314;
    const UTMScaleFactor = 0.9996;

    const calculateFootpointLatitude = (y: number): number => {
      const n = (sm_a - sm_b) / (sm_a + sm_b);
      const alpha_ = ((sm_a + sm_b) / 2) * (1 + (n ** 2) / 4) + (n ** 4) / 64;
      const y_ = y / alpha_;

      const beta_ = (3 * n / 2) + (-27 * (n ** 3) / 32) + (269 * (n ** 5) / 512);
      const gamma_ = (21 * (n ** 2) / 16) + (-55 * (n ** 4) / 32);
      const delta_ = (151 * (n ** 3) / 96) + (-417 * (n ** 5) / 128);
      const epsilon_ = (1097 * (n ** 4) / 512);

      return y_ + (beta_ * Math.sin(2 * y_)) + (gamma_ * Math.sin(4 * y_)) +
             (delta_ * Math.sin(6 * y_)) + (epsilon_ * Math.sin(8 * y_));
    };

    let x = finalX - 500000;
    x = x / UTMScaleFactor;
    const y = finalY / UTMScaleFactor;

    const lambda0 = ((-183 + (zone * 6)) / 180) * Math.PI;

    const phif = calculateFootpointLatitude(y);

    const ep2 = (sm_a ** 2 - sm_b ** 2) / (sm_b ** 2);
    const cf = Math.cos(phif);
    const nuf2 = ep2 * (cf ** 2);
    const Nf = (sm_a ** 2) / (sm_b * Math.sqrt(1 + nuf2));

    const tf = Math.tan(phif);
    const tf2 = tf * tf;
    const tf4 = tf2 * tf2;

    let Nfpow = Nf;
    const x1frac = 1 / (Nfpow * cf);

    Nfpow = Nfpow * Nf;
    const x2frac = tf / (2 * Nfpow);

    Nfpow = Nfpow * Nf;
    const x3frac = 1 / (6 * Nfpow * cf);

    Nfpow = Nfpow * Nf;
    const x4frac = tf / (24 * Nfpow);

    Nfpow = Nfpow * Nf;
    const x5frac = 1 / (120 * Nfpow * cf);

    Nfpow = Nfpow * Nf;
    const x6frac = tf / (720 * Nfpow);

    Nfpow = Nfpow * Nf;
    const x7frac = 1 / (5040 * Nfpow * cf);

    Nfpow = Nfpow * Nf;
    const x8frac = tf / (40320 * Nfpow);

    const x2poly = -1 - nuf2;
    const x3poly = -1 - 2 * tf2 - nuf2;
    const x4poly = 5 + 3 * tf2 + 6 * nuf2 - 6 * tf2 * nuf2 - 3 * (nuf2 * nuf2) - 9 * tf2 * (nuf2 * nuf2);
    const x5poly = 5 + 28 * tf2 + 24 * tf4 + 6 * nuf2 + 8 * tf2 * nuf2;
    const x6poly = -61 - 90 * tf2 - 45 * tf4 - 107 * nuf2 + 162 * tf2 * nuf2;
    const x7poly = -61 - 662 * tf2 - 1320 * tf4 - 720 * (tf4 * tf2);
    const x8poly = 1385 + 3633 * tf2 + 4095 * tf4 + 1575 * (tf4 * tf2);

    const lat = phif + x2frac * x2poly * (x * x) + x4frac * x4poly * x ** 4 +
                x6frac * x6poly * x ** 6 + x8frac * x8poly * x ** 8;
    const lng = lambda0 + x1frac * x + x3frac * x3poly * x ** 3 +
                x5frac * x5poly * x ** 5 + x7frac * x7poly * x ** 7;

    const latDegrees = (lat / Math.PI) * 180;
    const lngDegrees = (lng / Math.PI) * 180;

    console.log(`🗺️ UTM convertido a Lat/Lng: ${finalX}, ${finalY} -> ${latDegrees.toFixed(6)}, ${lngDegrees.toFixed(6)}`);

    return { lat: latDegrees, lng: lngDegrees };
  }

  return null;
}

export default function EmailGeneratorPage() {
  const { toast } = useToast();
  const [bulletinData, setBulletinData] = useState<BulletinData>({
    date: '',
    deadlineDate: '',
    projects: [],
    resolutions: [],
    comments: ''
  });
  const [bulletinId, setBulletinId] = useState('');
  const [bulletinUrl, setBulletinUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [previewHeight, setPreviewHeight] = useState<number>(1200);

  const previewHtml = useMemo(() => generateHTML(), [bulletinData, bulletinUrl]);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  useEffect(() => {
    fetchLatestBulletin();
  }, []);

  const fetchLatestBulletin = async () => {
    setHasAttemptedLoad(true);
    setIsLoading(true);

    try {
      const supabase = getInvestigacionClient();
      const { data: bulletin, error } = await supabase
        .from('boletines')
        .select('*, proyectos_ingresados(*), boletines_resolutivos(*)')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (error) throw new Error(error.message);
      if (!bulletin) throw new Error('No se encontró ningún boletín');

      const id = String(bulletin.id);
      setBulletinId(id);
      await loadBoletinData(id, bulletin);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error",
        description: `Error al cargar el boletín más reciente: ${errorMessage}`,
        variant: "destructive"
      });
      console.error('Error fetching latest bulletin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBoletinData = async (id: string, bulletin: any) => {
    const normalizeExpedient = (value: string) =>
      value
        .toString()
        .trim()
        .toUpperCase()
        .replace(/\s+/g, ' ');

    const entryBulletinByExpedient = new Map<string, string>();
    const promoterByExpedient = new Map<string, string>();

    console.log('Found bulletin:', bulletin);

    const transformedData: BulletinData = {
      date: bulletin.fecha_publicacion || '',
      deadlineDate: bulletin.fecha_limite_consulta || '',
      projects: [],
      resolutions: [],
      comments: ''
    };

    const projectsArray = bulletin.proyectos_ingresados || [];
    transformedData.projects = projectsArray.map((p: any) => {
      const originalX = p.coordenadas_x || p.latitude || p.lat;
      const originalY = p.coordenadas_y || p.longitude || p.lng;

      let latitude = originalX;
      let longitude = originalY;

      if (originalX && originalY && !isNaN(originalX) && !isNaN(originalY)) {
        try {
          const convertedCoords = convertToLatLong(originalX, originalY);
          if (convertedCoords && convertedCoords.lat && convertedCoords.lng) {
            if (convertedCoords.lat >= -90 && convertedCoords.lat <= 90 &&
                convertedCoords.lng >= -180 && convertedCoords.lng <= 180) {
              latitude = convertedCoords.lat;
              longitude = convertedCoords.lng;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Conversión omitida para "${p.nombre_proyecto}":`, error);
        }
      }

      return {
        name: p.nombre_proyecto || p.proyecto || p.name || '',
        promoter: p.promovente || p.promoter || '',
        municipality: p.municipio || p.municipality || '',
        entryDate: p.fecha_ingreso || p.fecha || p.entryDate || '',
        expedient: p.expediente || p.numero_expediente || '',
        type: p.tipo_estudio || p.tipo || p.type || '',
        nature: p.naturaleza_proyecto || p.naturaleza || p.nature || p.descripcion || '',
        imageUrl: p.imagen || p.image || '',
        latitude: latitude,
        longitude: longitude,
        publicConsultationDeadline: p.fecha_limite_consulta || p.publicConsultationDeadline || p.deadline || ''
      };
    });

    const resolutionsArray = bulletin.boletines_resolutivos || [];
    transformedData.resolutions = resolutionsArray.map((r: any) => {
      const originalX = r.coordenadas_x || r.latitude || r.lat;
      const originalY = r.coordenadas_y || r.longitude || r.lng;

      let latitude = originalX;
      let longitude = originalY;

      if (originalX && originalY && !isNaN(originalX) && !isNaN(originalY)) {
        try {
          const convertedCoords = convertToLatLong(originalX, originalY);
          if (convertedCoords && convertedCoords.lat && convertedCoords.lng) {
            if (convertedCoords.lat >= -90 && convertedCoords.lat <= 90 &&
                convertedCoords.lng >= -180 && convertedCoords.lng <= 180) {
              latitude = convertedCoords.lat;
              longitude = convertedCoords.lng;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Conversión omitida para resolutivo "${r.nombre_proyecto}":`, error);
        }
      }

      const expedientValue = r.expediente || r.numero_expediente || '';
      const normalizedExpedient = normalizeExpedient(expedientValue);
      const entryBulletinUrl = entryBulletinByExpedient.get(normalizedExpedient) || '';
      const entryPromoter = promoterByExpedient.get(normalizedExpedient) || '';

      return {
        name: r.nombre_proyecto || r.proyecto || r.name || '',
        promoter: r.promovente || r.promoter || entryPromoter || '',
        municipality: r.municipio || r.municipality || '',
        expedient: expedientValue,
        resolutionType: r.tipo_resolutivo || r.resolutivo || r.resolutionType || '',
        date: r.fecha_resolutivo || r.fecha || r.date || '',
        giro: r.giro || r.sector || r.activity || '',
        tipo: r.tipo_estudio || r.tipo || r.type || r.study_type || '',
        noOficioResolutivo: r.no_oficio_resolutivo || r.noOficioResolutivo || r.no_oficio || r.oficio || '',
        latitude: latitude,
        longitude: longitude,
        entryBulletinUrl: entryBulletinUrl,
        nature: r.naturaleza_proyecto || r.naturaleza || r.nature || r.descripcion || ''
      };
    });

    const bulletinUrlValue = bulletin.url || bulletin.filename || '';
    setBulletinUrl(bulletinUrlValue);

    setBulletinData(transformedData);
    toast({
      title: "Éxito",
      description: `Boletín ${id} cargado: ${transformedData.projects.length} proyectos, ${transformedData.resolutions.length} resolutivos`
    });
  };

  const fetchBulletinData = async (id: string) => {
    setHasAttemptedLoad(true);
    const requestedId = String(id || '').trim();

    if (!requestedId) {
      toast({
        title: "Error",
        description: "Por favor ingresa un ID de boletín",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getInvestigacionClient();
      const { data: bulletin, error } = await supabase
        .from('boletines')
        .select('*, proyectos_ingresados(*), boletines_resolutivos(*)')
        .eq('id', requestedId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error(`No se encontró el boletín con ID ${requestedId}`);
        }
        throw new Error(error.message);
      }

      if (!bulletin) {
        throw new Error(`No se encontró el boletín con ID ${requestedId}`);
      }

      await loadBoletinData(requestedId, bulletin);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      let userMessage = errorMessage;
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
        userMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet o que el servidor esté disponible.';
      } else if (errorMessage.includes('CORS')) {
        userMessage = 'Error de CORS. El servidor no permite el acceso desde este origen.';
      } else if (errorMessage.includes('timeout') || errorMessage.includes('tardó demasiado')) {
        userMessage = 'La petición tardó demasiado tiempo. Por favor, intenta de nuevo.';
      }

      toast({
        title: "Error",
        description: `Error al cargar los datos: ${userMessage}`,
        variant: "destructive"
      });
      console.error('Error fetching bulletin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addProject = () => {
    setBulletinData({
      ...bulletinData,
      projects: [
        ...bulletinData.projects,
        {
          name: '',
          promoter: '',
          municipality: '',
          entryDate: '',
          expedient: '',
          type: '',
          nature: '',
          imageUrl: '',
          latitude: undefined,
          longitude: undefined,
          publicConsultationDeadline: ''
        }
      ]
    });
  };

  const removeProject = (index: number) => {
    setBulletinData({
      ...bulletinData,
      projects: bulletinData.projects.filter((_, i) => i !== index)
    });
  };

  const updateProject = (index: number, field: keyof Project, value: string | number | undefined) => {
    const newProjects = [...bulletinData.projects];
    const currentProject = { ...newProjects[index] };

    (currentProject as any)[field] = value;

    if ((field === 'latitude' || field === 'longitude') && currentProject.latitude && currentProject.longitude) {
      try {
        const lat = currentProject.latitude;
        const lng = currentProject.longitude;

        if ((lat > 100000 || lng > 100000) && (lat < 10000000 && lng < 10000000)) {
          const convertedCoords = convertToLatLong(lat, lng);

          if (convertedCoords && convertedCoords.lat && convertedCoords.lng) {
            const latChanged = Math.abs(convertedCoords.lat - lat) > 0.01;
            const lngChanged = Math.abs(convertedCoords.lng - lng) > 0.01;

            if (latChanged || lngChanged) {
              currentProject.latitude = convertedCoords.lat;
              currentProject.longitude = convertedCoords.lng;

              toast({
                title: "🗺️ Coordenadas convertidas",
                description: "UTM convertidas automáticamente a Lat/Long"
              });
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error en conversión automática:', error);
      }
    }

    newProjects[index] = currentProject;
    setBulletinData({ ...bulletinData, projects: newProjects });
  };

  const addResolution = () => {
    setBulletinData({
      ...bulletinData,
      resolutions: [
        ...bulletinData.resolutions,
        {
          name: '',
          promoter: '',
          municipality: '',
          expedient: '',
          resolutionType: '',
          date: '',
          giro: '',
          tipo: '',
          noOficioResolutivo: '',
          nature: '',
          latitude: undefined,
          longitude: undefined
        }
      ]
    });
  };

  const removeResolution = (index: number) => {
    setBulletinData({
      ...bulletinData,
      resolutions: bulletinData.resolutions.filter((_, i) => i !== index)
    });
  };

  const updateResolution = (index: number, field: keyof Resolution, value: string | number | undefined) => {
    const newResolutions = [...bulletinData.resolutions];
    const currentResolution = { ...newResolutions[index] };

    (currentResolution as any)[field] = value;

    if ((field === 'latitude' || field === 'longitude') && currentResolution.latitude && currentResolution.longitude) {
      try {
        const lat = currentResolution.latitude;
        const lng = currentResolution.longitude;

        if ((lat > 100000 || lng > 100000) && (lat < 10000000 && lng < 10000000)) {
          const convertedCoords = convertToLatLong(lat, lng);

          if (convertedCoords && convertedCoords.lat && convertedCoords.lng) {
            const latChanged = Math.abs(convertedCoords.lat - lat) > 0.01;
            const lngChanged = Math.abs(convertedCoords.lng - lng) > 0.01;

            if (latChanged || lngChanged) {
              currentResolution.latitude = convertedCoords.lat;
              currentResolution.longitude = convertedCoords.lng;

              toast({
                title: "🗺️ Coordenadas convertidas",
                description: "UTM del resolutivo convertidas automáticamente a Lat/Long"
              });
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Error en conversión automática de resolutivo:', error);
      }
    }

    newResolutions[index] = currentResolution;
    setBulletinData({ ...bulletinData, resolutions: newResolutions });
  };

  function generateHTML() {
    const normalizedBulletinUrl = bulletinUrl || '';
    const platformBoletinesUrl = 'https://adn-a.vercel.app/boletines-ssmaa';

    const projectsHTML = bulletinData.projects.map(project => `
      <tr>
        <td style="padding: 10px 5px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 1px solid #9ca3af;">
            <tr>
              <td style="padding: 16px 12px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 8px 0;">
                        <tr>
                          <td style="padding: 0 5px 8px 5px;">
                            <span style="display: inline-block; background-color: #ff7e67; border: 2px solid #000000; padding: 8px 12px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #000000; margin-right: 10px; margin-bottom: 10px;">Fecha: ${project.entryDate}</span>
                            <span style="display: inline-block; background-color: #ff7e67; border: 2px solid #000000; padding: 8px 12px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #000000; margin-right: 10px; margin-bottom: 10px;">Tipo: ${project.type}</span>
                            <span style="display: inline-block; background-color: #ff7e67; border: 2px solid #000000; padding: 8px 12px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #000000; margin-bottom: 10px;">Municipio: ${project.municipality}</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 5px 16px 5px;">
                      <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.2; color: #111827; font-weight: bold;">Promovente</p>
                      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; line-height: 1.3; color: #111827;">${project.promoter}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 5px 12px 5px;">
                      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; line-height: 1.3; color: #111827; background-color: #f3f4f6; border: 1px solid #9ca3af; padding: 8px 10px;">Proyecto: ${project.name}</p>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="padding: 0 5px; vertical-align: top;">
                            <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.2; color: #111827; font-weight: bold;">Expediente</p>
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; line-height: 1.3; color: #111827;">${project.expedient}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  ${project.imageUrl ? `
                  <tr>
                    <td style="padding: 14px 5px 0 5px;">
                      <img src="${project.imageUrl}" alt="Proyecto" style="width: 100%; max-width: 100%; height: auto; border-radius: 4px; display: block;" />
                    </td>
                  </tr>
                  ` : ''}
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
                  <tr>
                    <td style="padding: 12px 12px; background: #ffffff; border: 1px solid #9ca3af;">
                      <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; line-height: 1.4; color: #111827;">Naturaleza del proyecto:</p>
                      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; line-height: 1.4; color: #111827;">${project.nature}</p>
                    </td>
                  </tr>
                </table>

                ${project.latitude && project.longitude ? `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
                  <tr>
                    <td style="padding: 0 5px; text-align: center;">
                      <a href="https://www.google.com/maps/search/?api=1&query=${project.latitude},${project.longitude}" target="_blank" style="display: block; width: 100%; max-width: 100%; box-sizing: border-box; margin: 0 auto; padding: 10px 12px; background-color: #fccb4e; color: #111827; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; text-align: center; cursor: pointer; border: 1px solid #9ca3af; border-radius: 9999px; box-shadow: 0 4px 0 #000000;">Ver ubicación en Google Maps</a>
                    </td>
                  </tr>
                </table>
                ` : ''}

                ${project.publicConsultationDeadline ? `
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
                  <tr>
                    <td style="padding: 12px 12px; background: #ffffff; border: 1px solid #9ca3af;">
                      <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; line-height: 1.4; color: #111827;">📅 Fecha límite para consulta pública</p>
                      <p style="margin: 0; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4; color: #111827;">${project.publicConsultationDeadline}</p>
                    </td>
                  </tr>
                </table>
                ` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('');

    const resolutionsHTML = bulletinData.resolutions.length > 0
      ? bulletinData.resolutions.map(resolution => `
        <tr>
          <td style="padding: 10px 5px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 1px solid #9ca3af;">
              <tr>
                <td style="padding: 16px 12px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 8px 0;">
                    <tr>
                      <td style="padding: 0 5px 8px 5px;">
                        <span style="display: inline-block; background-color: #ff7e67; border: 2px solid #000000; padding: 8px 12px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #000000; margin-right: 10px; margin-bottom: 10px;">Fecha: ${resolution.date}</span>
                        <span style="display: inline-block; background-color: #ff7e67; border: 2px solid #000000; padding: 8px 12px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #000000; margin-right: 10px; margin-bottom: 10px;">Tipo: ${resolution.tipo}</span>
                        <span style="display: inline-block; background-color: #ff7e67; border: 2px solid #000000; padding: 8px 12px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #000000; margin-right: 10px; margin-bottom: 10px;">Municipio: ${resolution.municipality}</span>
                        <span style="display: inline-block; background-color: #ff7e67; border: 2px solid #000000; padding: 8px 12px; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #000000; margin-bottom: 10px;">Giro: ${resolution.giro}</span>
                      </td>
                    </tr>
                  </table>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding: 0 5px 12px 5px;">
                        <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.2; color: #111827; font-weight: bold;">Promovente</p>
                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 15px; font-weight: bold; line-height: 1.3; color: #111827;">${resolution.promoter}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 5px 12px 5px;">
                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; line-height: 1.3; color: #111827; background-color: #f3f4f6; border: 1px solid #9ca3af; padding: 8px 10px;">Resolutivo: ${resolution.name}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 5px 12px 5px;">
                        <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.2; color: #111827; font-weight: bold;">Expediente</p>
                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; line-height: 1.3; color: #111827;">${resolution.expedient}</p>
                      </td>
                    </tr>
                    ${resolution.noOficioResolutivo ? `
                    <tr>
                      <td style="padding: 0 5px 12px 5px;">
                        <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.2; color: #111827; font-weight: bold;">No. de Oficio Resolutivo</p>
                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; line-height: 1.3; color: #111827;">${resolution.noOficioResolutivo}</p>
                      </td>
                    </tr>
                    ` : ''}
                  </table>

                  ${resolution.nature ? `
                  <div style="margin-top: 12px; padding: 12px 12px; background: #ffffff; border: 1px solid #9ca3af;">
                    <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; line-height: 1.4; color: #111827;">Naturaleza del proyecto:</p>
                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; line-height: 1.4; color: #111827;">${resolution.nature}</p>
                  </div>
                  ` : ''}

                  ${resolution.entryBulletinUrl ? `
                  <div style="text-align: center; margin-top: 10px;">
                    <a href="${resolution.entryBulletinUrl}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px 12px; background-color: #b4ff6f; color: #000000; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; text-align: center; cursor: pointer; border: 2px solid #000000; border-radius: 9999px; box-shadow: 0 4px 0 #000000;">Ver boletín donde se ingresó el proyecto</a>
                  </div>
                  ` : ''}

                  ${resolution.latitude && resolution.longitude ? `
                  <div style="text-align: center; margin-top: 10px;">
                    <a href="https://www.google.com/maps/search/?api=1&query=${resolution.latitude},${resolution.longitude}" target="_blank" style="display: block; width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px 12px; background-color: #fccb4e; color: #111827; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; text-align: center; cursor: pointer; border: 1px solid #9ca3af; border-radius: 9999px; box-shadow: 0 4px 0 #000000;">Ver ubicación en Google Maps</a>
                  </div>
                  ` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('')
      : `
        <tr>
          <td style="padding: 10px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding: 12px; background: #ffffff; border: 1px solid #9ca3af;">
                  <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; color: #111827; text-align: center;">No se emitieron resolutivos</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boletín Ambiental de SSMAA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f3ed; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f3ed;">
        <tr>
            <td align="center" style="padding: 0 20px;">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border: 2px solid #000000;">

                    <tr>
                        <td style="background-color: #ff9d9d; padding: 16px 20px; text-align: center; border-bottom: 2px solid #000000;">
                            <h1 style="margin: 0 0 8px 0; font-family: Arial, sans-serif; font-size: 26px; font-weight: bold; color: #000000; line-height: 1.1;">Resumen del Boletín<br>Ambiental de SSMAA</h1>
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; font-weight: normal; color: #000000; line-height: 1;">${bulletinData.date}</p>
                        </td>
                    </tr>

                    ${bulletinData.comments ? `
                    <tr>
                        <td style="padding: 10px 12px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 1px solid #9ca3af;">
                                <tr>
                                    <td style="padding: 12px 12px;">
                                        <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: #111827;">Comentarios del boletín</p>
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #111827; white-space: pre-line;">${bulletinData.comments}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    ` : ''}

                    <tr>
                        <td style="padding: 20px 12px; background: #ffffff;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding-bottom: 8px;">
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; color: #000000; text-align: center; line-height: 1.2; background-color: #9dcdff; border: 2px solid #000000; padding: 8px 10px; display: block; width: 100%; box-sizing: border-box;">${bulletinData.projects.length > 0 ? `Proyectos ingresados a impacto ambiental (${bulletinData.projects.length})` : 'No se publicaron proyectos ingresados'}</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0 0 6px 0; font-family: Arial, sans-serif; font-size: 11px; color: #6b7280; text-align: center; line-height: 1.2;">Fecha límite para solicitud de consulta pública</p>
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; color: #000000; text-align: center; line-height: 1.2;">${bulletinData.deadlineDate}</p>
                                    </td>
                                </tr>
                                ${projectsHTML}
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px 12px; background: #d89dff;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding-bottom: 12px;">
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; color: #000000; text-align: center; line-height: 1.2; background-color: #fccb4e; border: 2px solid #000000; padding: 8px 10px; display: block; width: 100%; box-sizing: border-box;">${bulletinData.resolutions.length > 0 ? `Resolutivos emitidos (${bulletinData.resolutions.length})` : 'No se publicaron resolutivos'}</p>
                                    </td>
                                </tr>
                                ${resolutionsHTML}
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 10px 15px 0 15px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border: 2px solid #000000;">
                                <tr>
                                    <td style="padding: 16px 16px 8px 16px;">
                                        <p style="margin: 0 0 10px 0; font-family: Arial, sans-serif; font-size: 12px; color: #4b5563; text-align: center; line-height: 1.4;">
                                            Puedes consultar más boletines, proyectos ingresados y resolutivos en nuestro sitio.
                                        </p>
                                        <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #111827; text-align: center; line-height: 1.5; word-break: break-word;">
                                            <a href="${platformBoletinesUrl}" target="_blank" rel="noopener noreferrer" style="color: #111827; text-decoration: underline;">${platformBoletinesUrl}</a>
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 16px 16px 16px; text-align: center;">
                                        <a href="${platformBoletinesUrl}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; max-width: 100%; box-sizing: border-box; margin: 0 auto; padding: 12px 16px; background-color:#9dcdff; color: #000000; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; text-align: center; cursor: pointer; border: 2px solid #000000; border-radius: 9999px; box-shadow: 0 4px 0 #000000;">
                                            Ver boletines en la plataforma
                                        </a>
                                    </td>
                                </tr>
                                ${bulletinUrl ? `
                                <tr>
                                    <td style="padding: 0 16px 16px 16px; text-align: center;">
                                        <a href="${normalizedBulletinUrl}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; max-width: 100%; box-sizing: border-box; margin: 0 auto; padding: 12px 16px; background-color:#b4ff6f; color: #000000; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; text-align: center; cursor: pointer; border: 2px solid #000000; border-radius: 9999px; box-shadow: 0 4px 0 #000000;">
                                            Ver boletín original
                                        </a>
                                    </td>
                                </tr>
                                ` : ''}
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px 15px;">
                            <p style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #6b7280; text-align: left;">
                                La información presentada es obtenida de <span style="text-decoration: underline;">https://www.aguascalientes.gob.mx/SSMAA/BoletinesSMA/usuario_webexplorer.asp</span><br><br>
                                La precisión de las ubicaciones y la calidad de la información son responsabilidad de la Secretaría de Sustentabilidad, Medio Ambiente y Agua.<br><br>
                                Mapeo Verde se limita a compartir información pública de interés para la sociedad.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="background-color: #f3f4f6; height: 12px; border-top: 2px solid #000000;"></td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
  }

  const sendToWebhook = async (html: string) => {
    const webhookUrl = 'https://hook.eu1.make.com/c2q0xyf1wdnankpdpugx7f8pgkkw4lxh';

    if (!apiKey) {
      throw new Error('API Key de Make.com no configurada. Por favor, ingresa la API Key en el campo correspondiente.');
    }

    const payload = {
      html: html,
      bulletin_id: bulletinId,
      date: bulletinData.date,
      projects_count: bulletinData.projects.length,
      resolutions_count: bulletinData.resolutions.length,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-make-apikey': apiKey,
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
    }

    return true;
  };

  const copyHTML = async () => {
    const html = generateHTML();

    try {
      await navigator.clipboard.writeText(html);
      console.log('✅ HTML copiado al portapapeles exitosamente');

      await sendToWebhook(html);

      toast({
        title: "✅ Éxito completo",
        description: "HTML copiado al portapapeles y enviado al webhook"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans" style={{ fontFamily: 'var(--font-sans), system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="mb-2 text-[32px]">Generador de Boletín Ambiental</h1>
          <p className="text-gray-600">Crea plantillas HTML para correo electrónico del boletín de SSMAA</p>

        </div>

        <div className="">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cargar Boletín</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor="bulletinId">ID del Boletín</Label>
                    <Input
                      id="bulletinId"
                      value={bulletinId}
                      onChange={(e) => setBulletinId(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          fetchBulletinData(bulletinId);
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      onClick={() => fetchBulletinData(bulletinId)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      Cargar
                    </Button>

                    <Button
                      onClick={async () => {
                        try {
                          console.log('🔍 Iniciando diagnóstico...');

                          const supabase = getInvestigacionClient();
                          const { data, error, status } = await supabase
                            .from('boletines')
                            .select('id, fecha_publicacion')
                            .order('id', { ascending: false })
                            .limit(5);

                          console.log('📡 Respuesta de Supabase:', { status, error });
                          console.log('📊 Boletines encontrados:', data?.length || 0);
                          if (data && data.length > 0) {
                            console.log('🎯 Primeros IDs:', data.map(b => b.id).join(', '));
                          }

                          toast({
                            title: "✅ Diagnóstico completado",
                            description: `Supabase responde OK. ${data?.length || 0} boletines encontrados. Revisa la consola (F12) para más detalles.`
                          });
                        } catch (error) {
                          console.error('❌ Error en diagnóstico:', error);
                          toast({
                            title: "❌ Error en diagnóstico",
                            description: error instanceof Error ? error.message : 'Error desconocido',
                            variant: "destructive"
                          });
                        }
                      }}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                    >
                      🔍
                    </Button>
                  </div>
                </div>
                {!isLoading && !hasAttemptedLoad && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    Ingresa un ID y presiona "Cargar" para obtener los datos del boletín
                  </div>
                )}
                {!isLoading && hasAttemptedLoad && bulletinData.projects.length === 0 && bulletinData.resolutions.length === 0 && (
                  <div className="text-sm text-amber-600 text-center py-2">
                    ⚠ No se encontraron datos. Verifica el ID del boletín o revisa la consola del navegador (F12) para más detalles.
                  </div>
                )}
                {!isLoading && (bulletinData.projects.length > 0 || bulletinData.resolutions.length > 0) && (
                  <div className="text-sm text-green-600 text-center py-2">
                    ✓ Boletín cargado: {bulletinData.projects.length} proyectos, {bulletinData.resolutions.length} resolutivos
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datos del Boletín</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date">Fecha del Boletín</Label>
                    <Input
                      id="date"
                      value={bulletinData.date}
                      onChange={(e) => setBulletinData({ ...bulletinData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadline">Fecha límite de consulta pública</Label>
                    <Input
                      id="deadline"
                      value={bulletinData.deadlineDate}
                      onChange={(e) => setBulletinData({ ...bulletinData, deadlineDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="comments">Comentarios del boletín</Label>
                    <Textarea
                      id="comments"
                      value={bulletinData.comments}
                      onChange={(e) => setBulletinData({ ...bulletinData, comments: e.target.value })}
                      placeholder="Agrega comentarios o notas adicionales del boletín"
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Make.com</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API Key de Make.com</Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Ingresa tu API Key de Make.com"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      La API Key se usa para autenticar las peticiones al webhook de Make.com
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
            <div className="space-y-3 my-4">
              <Button
                onClick={async () => {
                  const html = generateHTML();
                  try {
                    await sendToWebhook(html);
                    toast({
                      title: "Enviado exitosamente",
                      description: "HTML enviado al webhook de Make.com"
                    });
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                    toast({
                      title: "Error al enviar",
                      description: errorMessage,
                      variant: "destructive"
                    });
                  }
                }}
                variant="default"
                className="w-full"
                size="lg"
                disabled={!apiKey}
              >
                Enviar correo
              </Button>

            </div>

          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Vista Previa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <iframe
                    ref={previewIframeRef}
                    srcDoc={previewHtml}
                    sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                    style={{ width: '100%', border: 0, height: previewHeight }}
                    onLoad={() => {
                      try {
                        const iframe = previewIframeRef.current;
                        if (!iframe) return;
                        const doc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (!doc) return;
                        const body = doc.body;
                        if (!body) return;
                        const newHeight = Math.max(body.scrollHeight, 600);
                        if (newHeight !== previewHeight) setPreviewHeight(newHeight);
                      } catch {}
                    }}
                  />
                </div>
                {bulletinUrl && (
                  <div className="mt-4 pt-4 border-t">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      URL del Boletín:
                    </Label>
                    <a
                      href={bulletinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all block"
                    >
                      {bulletinUrl}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
