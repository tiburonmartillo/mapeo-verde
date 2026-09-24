'use client'

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/features/investigacion/components/ui/button';
import { Input } from '@/features/investigacion/components/ui/input';
import { Textarea } from '@/features/investigacion/components/ui/textarea';
import { Label } from '@/features/investigacion/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/features/investigacion/components/ui/card';
import { Toaster } from '@/features/investigacion/components/ui/toaster';
import { Download, Eye, EyeOff, Mail } from 'lucide-react';
import { useToast } from '@/features/investigacion/hooks/use-toast';
import { FrogLoading } from '@/features/investigacion/components/frog-loading';
import { getInvestigacionClient } from '@/features/investigacion/lib/supabase-data';
import { convertToLatLong } from '@/features/investigacion/components/projects-map';
import mapeoLogo from '@/assets/mapeov.jpg?inline';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/layout/NavBar';
import { TAB_ROUTES } from '@/constants/routes';

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

export default function EmailGeneratorPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
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
  const [debouncedPreviewHtml, setDebouncedPreviewHtml] = useState(previewHtml);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPreviewHtml(previewHtml), 2000);
    return () => clearTimeout(timer);
  }, [previewHtml]);

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

      let latitude: number | undefined;
      let longitude: number | undefined;

      if (originalX && originalY) {
        try {
          const convertedCoords = convertToLatLong(originalX, originalY);
          if (convertedCoords && convertedCoords.lat && convertedCoords.lng) {
            latitude = convertedCoords.lat;
            longitude = convertedCoords.lng;
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

      let latitude: number | undefined;
      let longitude: number | undefined;

      if (originalX && originalY) {
        try {
          const convertedCoords = convertToLatLong(originalX, originalY);
          if (convertedCoords && convertedCoords.lat && convertedCoords.lng) {
            latitude = convertedCoords.lat;
            longitude = convertedCoords.lng;
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
    const siteUrl = 'https://mapeoverde.org';
    const platformBoletinesUrl = `${siteUrl}/boletines`;
    const fontSans = "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
    const colorPrimary = '#ffffff';
    const colorSecondary = '#f5f5f5';
    const colorAccent = '#ff6b35';
    const colorText = '#333333';
    const colorTextSecondary = '#666666';
    const colorBorder = '#e0e0e0';

    const labelStyle = `margin:0 0 4px 0;font-family:${fontSans};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${colorTextSecondary};`;
    const bodyTextStyle = `margin:0;font-family:${fontSans};font-size:15px;font-weight:600;line-height:1.5;color:${colorText};`;
    const chipStyle = `display:inline-block;background-color:${colorPrimary};border:1px solid ${colorBorder};padding:4px 10px;border-radius:999px;font-family:${fontSans};font-size:12px;font-weight:600;color:${colorText};margin:0 8px 8px 0;`;

    const sectionTitle = (text: string) =>
      `<h2 style="margin:0 0 16px 0;font-family:${fontSans};font-size:22px;font-weight:800;line-height:1.2;color:${colorText};">${text}</h2>`;

    const emailButton = (href: string, label: string, variant: 'primary' | 'secondary' = 'primary') => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
        <tr>
          <td align="center">
            <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;border-radius:6px;text-decoration:none;font-family:${fontSans};font-size:15px;font-weight:700;color:${variant === 'primary' ? '#ffffff' : colorText};background-color:${variant === 'primary' ? colorAccent : colorPrimary};border:${variant === 'primary' ? 'none' : `1px solid ${colorBorder}`};">${label}</a>
          </td>
        </tr>
      </table>
    `;

    const projectsHTML = bulletinData.projects.map(project => `
      <tr>
        <td style="padding:0 0 20px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colorPrimary};border:1px solid ${colorBorder};border-radius:8px;">
            <tr>
              <td style="padding:20px;">
                <p style="margin:0 0 12px 0;">
                  ${project.entryDate ? `<span style="${chipStyle}">Fecha: ${project.entryDate}</span>` : ''}
                  ${project.type ? `<span style="${chipStyle}">Tipo: ${project.type}</span>` : ''}
                  ${project.municipality ? `<span style="${chipStyle}">Municipio: ${project.municipality}</span>` : ''}
                </p>
                <p style="${labelStyle}">Proyecto</p>
                <p style="margin:0 0 12px 0;font-family:${fontSans};font-size:16px;font-weight:800;line-height:1.35;color:${colorText};">${project.name}</p>
                <p style="${labelStyle}">Promovente</p>
                <p style="${bodyTextStyle}margin-bottom:12px;">${project.promoter}</p>
                <p style="${labelStyle}">Expediente</p>
                <p style="${bodyTextStyle}">${project.expedient}</p>
                ${project.imageUrl ? `
                <img src="${project.imageUrl}" alt="Proyecto" style="width:100%;max-width:100%;height:auto;display:block;margin-top:16px;border-radius:6px;" />
                ` : ''}
                ${project.nature ? `
                <div style="margin-top:16px;background-color:${colorSecondary};border-radius:6px;padding:14px 16px;">
                  <p style="${labelStyle}">Naturaleza del proyecto</p>
                  <p style="margin:0;font-family:${fontSans};font-size:14px;line-height:1.55;color:${colorTextSecondary};">${project.nature}</p>
                </div>
                ` : ''}
                ${project.publicConsultationDeadline ? `
                <div style="margin-top:16px;border-left:4px solid ${colorAccent};background-color:${colorSecondary};border-radius:0 6px 6px 0;padding:14px 16px;">
                  <p style="${labelStyle}">Fecha límite para consulta pública</p>
                  <p style="margin:0;font-family:${fontSans};font-size:15px;font-weight:700;color:${colorText};">${project.publicConsultationDeadline}</p>
                </div>
                ` : ''}
                ${project.latitude && project.longitude ? emailButton(`https://www.google.com/maps?q=${project.latitude},${project.longitude}`, 'Ver ubicación en Google Maps') : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('');

    const resolutionsHTML = bulletinData.resolutions.length > 0
      ? bulletinData.resolutions.map(resolution => `
        <tr>
          <td style="padding:0 0 20px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colorPrimary};border:1px solid ${colorBorder};border-radius:8px;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 12px 0;">
                    ${resolution.date ? `<span style="${chipStyle}">Fecha: ${resolution.date}</span>` : ''}
                    ${resolution.tipo ? `<span style="${chipStyle}">Tipo: ${resolution.tipo}</span>` : ''}
                    ${resolution.municipality ? `<span style="${chipStyle}">Municipio: ${resolution.municipality}</span>` : ''}
                    ${resolution.giro ? `<span style="${chipStyle}">Giro: ${resolution.giro}</span>` : ''}
                  </p>
                  <p style="${labelStyle}">Resolutivo</p>
                  <p style="margin:0 0 12px 0;font-family:${fontSans};font-size:16px;font-weight:800;line-height:1.35;color:${colorText};">${resolution.name}</p>
                  <p style="${labelStyle}">Promovente</p>
                  <p style="${bodyTextStyle}margin-bottom:12px;">${resolution.promoter}</p>
                  <p style="${labelStyle}">Expediente</p>
                  <p style="${bodyTextStyle}">${resolution.expedient}</p>
                  ${resolution.noOficioResolutivo ? `
                  <p style="${labelStyle}margin-top:12px;">No. de oficio resolutivo</p>
                  <p style="${bodyTextStyle}">${resolution.noOficioResolutivo}</p>
                  ` : ''}
                  ${resolution.nature ? `
                  <div style="margin-top:16px;background-color:${colorSecondary};border-radius:6px;padding:14px 16px;">
                    <p style="${labelStyle}">Naturaleza del proyecto</p>
                    <p style="margin:0;font-family:${fontSans};font-size:14px;line-height:1.55;color:${colorTextSecondary};">${resolution.nature}</p>
                  </div>
                  ` : ''}
                  ${resolution.entryBulletinUrl ? emailButton(resolution.entryBulletinUrl, 'Ver boletín de ingreso', 'secondary') : ''}
                  ${resolution.latitude && resolution.longitude ? emailButton(`https://www.google.com/maps?q=${resolution.latitude},${resolution.longitude}`, 'Ver ubicación en Google Maps') : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join('')
      : `
        <tr>
          <td style="padding:0 0 8px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colorPrimary};border:1px solid ${colorBorder};border-radius:8px;">
              <tr>
                <td align="center" style="padding:16px;">
                  <p style="margin:0;font-family:${fontSans};font-size:14px;font-weight:600;color:${colorTextSecondary};text-align:center;">No se emitieron resolutivos</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;

const statsHTML = `
      <tr>
        <td style="padding:0 0 4px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="50%" valign="top" style="padding:0 6px 0 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colorSecondary};border:1px solid ${colorBorder};border-radius:8px;">
                  <tr>
                    <td align="center" valign="middle" height="140" style="padding:20px;height:140px;">
                      <p style="margin:0;font-family:${fontSans};font-size:36px;font-weight:800;color:${colorAccent};">${bulletinData.projects.length}</p>
                      <p style="margin:8px 0 0 0;font-family:${fontSans};font-size:15px;font-weight:600;color:${colorTextSecondary};">Proyectos ingresados</p>
                    </td>
                  </tr>
                </table>
              </td>
              <td width="50%" valign="top" style="padding:0 0 0 6px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colorSecondary};border:1px solid ${colorBorder};border-radius:8px;">
                  <tr>
                    <td align="center" valign="middle" height="140" style="padding:20px;height:140px;">
                      <p style="margin:0;font-family:${fontSans};font-size:36px;font-weight:800;color:${colorAccent};">${bulletinData.resolutions.length}</p>
                      <p style="margin:8px 0 0 0;font-family:${fontSans};font-size:15px;font-weight:600;color:${colorTextSecondary};">Resolutivos emitidos</p>
                    </td>
                  </tr>
                </table>
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
<body style="margin:0;padding:0;background-color:${colorSecondary};font-family:${fontSans};line-height:1.55;color:${colorText};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colorSecondary};padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;background-color:${colorPrimary};border:1px solid ${colorBorder};border-radius:12px;overflow:hidden;">

          <tr>
            <td align="center" style="padding:32px 24px 28px 24px;border-bottom:1px solid ${colorBorder};">
              <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;">
                <img src="${mapeoLogo}" width="200" alt="Mapeo Verde" style="display:block;width:200px;height:auto;border:0;outline:none;" />
              </a>
              <h1 style="margin:20px 0 0 0;font-family:${fontSans};font-size:26px;font-weight:800;letter-spacing:-0.02em;line-height:1.2;color:${colorText};text-align:center;">Resumen del boletín ambiental de SSMAA</h1>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
                <tr>
                  <td align="center" valign="middle" width="50%" style="padding:12px;border:1px solid ${colorBorder};background-color:${colorSecondary};border-radius:8px 0 0 8px;">
                    <p style="margin:0;font-family:${fontSans};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${colorTextSecondary};">Fecha del boletín</p>
                    <p style="margin:4px 0 0 0;font-family:${fontSans};font-size:14px;font-weight:700;color:${colorText};">${bulletinData.date || 'Plataforma ciudadana de Aguascalientes'}</p>
                  </td>
                  <td align="center" valign="middle" width="50%" style="padding:12px;border:1px solid ${colorBorder};border-left:none;background-color:${colorSecondary};border-radius:0 8px 8px 0;">
                    <p style="margin:0;font-family:${fontSans};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${colorAccent};">Fecha límite consulta pública</p>
                    <p style="margin:4px 0 0 0;font-family:${fontSans};font-size:14px;font-weight:700;color:${colorText};">${bulletinData.deadlineDate}</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
                ${statsHTML}
              </table>
            </td>
          </tr>

          ${bulletinData.comments ? `
          <tr>
            <td style="padding:24px 24px 0 24px;">
              <div style="border-left:4px solid ${colorAccent};background-color:${colorSecondary};border-radius:0 6px 6px 0;padding:16px 20px;">
                <p style="${labelStyle}">Comentarios del boletín</p>
                <p style="margin:0;font-family:${fontSans};font-size:14px;line-height:1.55;color:${colorTextSecondary};white-space:pre-line;">${bulletinData.comments}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          <tr>
            <td style="padding:24px 24px 0 24px;">
              ${sectionTitle(bulletinData.projects.length > 0 ? `Proyectos ingresados a impacto ambiental (${bulletinData.projects.length})` : 'No se publicaron proyectos ingresados')}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${projectsHTML}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:24px;">
              ${sectionTitle(bulletinData.resolutions.length > 0 ? `Resolutivos emitidos (${bulletinData.resolutions.length})` : 'No se publicaron resolutivos')}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${resolutionsHTML}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 24px 24px 24px;">
              <div style="border:1px solid ${colorBorder};border-radius:8px;background-color:${colorSecondary};padding:20px 24px;text-align:center;">
                <p style="margin:0 0 4px 0;font-family:${fontSans};font-size:16px;font-weight:800;color:${colorText};">Más información</p>
                <p style="margin:0;font-family:${fontSans};font-size:14px;color:${colorTextSecondary};">Consulta más boletines, proyectos ingresados y resolutivos en mapeoverde.org</p>
                ${emailButton(platformBoletinesUrl, 'Ir al monitor ambiental')}
                ${bulletinUrl ? emailButton(normalizedBulletinUrl, 'Ver boletín original', 'secondary') : ''}
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 24px;border-top:1px solid ${colorBorder};background-color:${colorPrimary};">
              <p style="margin:0 0 6px 0;font-family:${fontSans};font-size:12px;color:${colorTextSecondary};">
                Datos de <a href="https://www.aguascalientes.gob.mx/SSMAA/BoletinesSMA/usuario_webexplorer.asp" style="color:${colorTextSecondary};text-decoration:underline;">SSMAA Aguascalientes</a> ·
                <a href="${siteUrl}" style="color:${colorAccent};text-decoration:none;font-weight:700;">Mapeo Verde</a>
              </p>
              <p style="margin:0;font-family:${fontSans};font-size:11px;line-height:1.5;color:${colorTextSecondary};">La precisión de las ubicaciones y la calidad de la información son responsabilidad de la Secretaría. Mapeo Verde se limita a compartir información pública.</p>
            </td>
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
    <>
      <NavBar
        activeTab="NEWSLETTERS"
        onNavigate={(tab) => navigate(TAB_ROUTES[tab as keyof typeof TAB_ROUTES] || '/')}
      />
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
            <div className="my-4">
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
                className="h-auto w-full cursor-pointer rounded-none border-2 border-foreground bg-[#b4ff6f] px-6 py-4 text-sm font-bold uppercase tracking-widest text-black shadow-[4px_4px_0_0_#000] transition-[transform,box-shadow,background-color,opacity] duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] motion-reduce:transition-none hover:bg-[#9adf55] hover:shadow-[6px_6px_0_0_#000] motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.01] motion-safe:active:translate-y-0.5 motion-safe:active:scale-[0.99] motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-[4px_4px_0_0_#000] disabled:hover:translate-y-0 disabled:hover:scale-100"
                size="lg"
                disabled={!apiKey}
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
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
                    srcDoc={debouncedPreviewHtml}
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
    </>
  );
}
