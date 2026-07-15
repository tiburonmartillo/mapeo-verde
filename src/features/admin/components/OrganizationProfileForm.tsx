import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Eye, Upload } from 'lucide-react';
import { SafeImage } from '../../../components/common/SafeImage';
import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadAndCompressImage } from '../../../utils/image-upload';
import {
  DEFAULT_FIELD_VISIBILITY,
  type OrgDirectoryLevel,
  type OrgFieldVisibilityLevel,
  type OrgFieldVisibilityMap,
  type OrgProfileLink,
  type OrganizationProfileRow,
  VISIBILITY_FIELD_KEYS,
  VISIBILITY_FIELD_LABELS,
  VISIBILITY_LABELS,
  type OrgVisibilityFieldKey,
} from '../../../lib/supabase/organizationProfileTypes';
import {
  fetchOrganizationProfileByOwner,
  fetchOrganizationProfileRevisions,
  insertOrganizationProfile,
  updateOrganizationProfile,
} from '../../../lib/supabase/organizationProfileQueries';

function mergeFieldVisibility(raw: unknown): OrgFieldVisibilityMap {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, string>;
  const out: OrgFieldVisibilityMap = { ...DEFAULT_FIELD_VISIBILITY };
  for (const k of VISIBILITY_FIELD_KEYS) {
    const v = o[k];
    if (v === 'public' || v === 'community' || v === 'private') {
      out[k] = v;
    }
  }
  return out;
}

function parseLinks(raw: unknown): OrgProfileLink[] {
  if (!Array.isArray(raw) || raw.length === 0) return [{ label: '', url: '' }];
  const rows = raw.map((x) => ({
    label: typeof (x as { label?: unknown })?.label === 'string' ? (x as { label: string }).label : '',
    url: typeof (x as { url?: unknown })?.url === 'string' ? (x as { url: string }).url : '',
  }));
  return [...rows, { label: '', url: '' }];
}

function normalizeLinksForSave(links: OrgProfileLink[]): OrgProfileLink[] {
  return links
    .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
    .filter((l) => l.url.length > 0);
}

/** Inputs normales con borde sólido */
const P_FIELD = 'space-y-1 mb-8';
const P_TEXT_ACCENT = 'text-gray-700';
const P_LABEL = 'block text-sm font-medium text-gray-700 mb-1';
const P_INPUT =
  'w-full border-2 border-black px-3 py-2 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400';
const P_TEXTAREA =
  'w-full border-2 border-black px-3 py-2 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400 min-h-[100px]';
const P_TEXTAREA_COMPACT =
  'w-full border-2 border-black px-3 py-2 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-black placeholder:text-gray-400 min-h-[80px]';
const P_SECTION_TITLE = 'text-sm font-semibold text-gray-700 mb-4';
const P_SUB_LABEL = 'block text-xs font-medium text-gray-600 mb-1';
const P_CALLOUT = 'border-l-4 border-gray-400 bg-gray-50 pl-4 pr-2 py-3 text-sm text-gray-700 leading-relaxed';
const P_BTN_SUBMIT = 'bg-lime-300 text-black border-2 border-black px-4 py-2 text-sm font-bold uppercase tracking-wider hover:bg-lime-400 disabled:opacity-45 cursor-pointer';
const P_BTN_FILE =
  'inline-flex cursor-pointer items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-medium hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
const P_LINK_DANGER =
  'text-xs font-medium text-red-700 underline underline-offset-2 hover:text-red-900';
const P_LINK_ACTION =
  'text-xs font-medium text-black underline underline-offset-2 hover:text-gray-700';

const VISIBILITY_LEVELS: OrgFieldVisibilityLevel[] = ['public', 'community', 'private'];

const VISIBILITY_SHORT: Record<OrgFieldVisibilityLevel, string> = {
  public: 'Público',
  community: 'Comunidad',
  private: 'Privado',
};

/** Select nativo sobre icono de ojo; fila horizontal para no alargar el bloque hacia el campo de abajo. */
function VisibilityEyeSelect({
  fieldKey,
  value,
  onChange,
  alignClass = 'pt-3',
}: {
  fieldKey: OrgVisibilityFieldKey;
  value: OrgFieldVisibilityLevel;
  onChange: (level: OrgFieldVisibilityLevel) => void;
  /** Alineación vertical respecto al campo (p. ej. `pt-1` junto a checkboxes). */
  alignClass?: string;
}) {
  const uid = useId();
  const selectId = `org-vis-${fieldKey}-${uid}`;
  const fullLabel = VISIBILITY_LABELS[value];
  return (
    <div
      className={`flex flex-row items-center gap-2 shrink-0 self-start min-w-0 ${alignClass}`}
      title={`Visibilidad: ${fullLabel}`}
    >
      <div className="relative size-9 shrink-0 rounded-md border-0 bg-transparent hover:bg-gray-100 flex items-center justify-center">
        <Eye
          className="size-5 pointer-events-none text-gray-600"
          strokeWidth={1.5}
          aria-hidden
        />
        <select
          id={selectId}
          className="absolute inset-0 cursor-pointer w-full h-full opacity-0 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value as OrgFieldVisibilityLevel)}
          aria-label={`Visibilidad: ${VISIBILITY_FIELD_LABELS[fieldKey]}`}
        >
          {VISIBILITY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {VISIBILITY_LABELS[level]}
            </option>
          ))}
        </select>
      </div>
      <span
        className="text-xs text-gray-600 font-medium leading-tight whitespace-nowrap truncate"
        title={fullLabel}
      >
        {VISIBILITY_SHORT[value]}
      </span>
    </div>
  );
}

function OrgAccordionPanel({
  sectionKey,
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
  sectionKey: string;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const headingId = `org-acc-${sectionKey}`;
  const panelId = `org-acc-panel-${sectionKey}`;
  return (
    <div className="bg-white">
      <button
        type="button"
        id={headingId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left bg-gray-100 text-black hover:bg-gray-200"
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-black block">{title}</span>
          {subtitle ? (
            <span className="text-xs text-gray-600 mt-0.5 block leading-snug">{subtitle}</span>
          ) : null}
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-black transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        hidden={!isOpen}
        className={isOpen ? 'block' : 'hidden'}
      >
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

type Props = {
  supabase: SupabaseClient;
  userId: string;
  authEmail: string;
};

export function OrganizationProfileForm({ supabase, userId, authEmail }: Props) {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [existing, setExisting] = useState<OrganizationProfileRow | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [themes, setThemes] = useState('');
  const [territory, setTerritory] = useState('');
  const [organizationType, setOrganizationType] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [seeks, setSeeks] = useState('');
  const [offers, setOffers] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [links, setLinks] = useState<OrgProfileLink[]>([{ label: '', url: '' }]);
  const [fieldVisibility, setFieldVisibility] = useState<OrgFieldVisibilityMap>({
    ...DEFAULT_FIELD_VISIBILITY,
  });
  const [directoryLevel, setDirectoryLevel] = useState<OrgDirectoryLevel>('off');
  const [consentShare, setConsentShare] = useState(false);
  const [consentContactReq, setConsentContactReq] = useState(false);
  const [consentNetworkVis, setConsentNetworkVis] = useState(false);
  const [consentSuggestions, setConsentSuggestions] = useState(false);
  const [willingContacts, setWillingContacts] = useState(false);
  const [participateNetwork, setParticipateNetwork] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [revisions, setRevisions] = useState<Awaited<ReturnType<typeof fetchOrganizationProfileRevisions>>>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const applyRow = useCallback((row: OrganizationProfileRow | null) => {
    if (!row) {
      setExisting(null);
      setName('');
      setDescription('');
      setThemes('');
      setTerritory('');
      setOrganizationType('');
      setContactName('');
      setContactEmail(authEmail);
      setContactWhatsapp('');
      setSeeks('');
      setOffers('');
      setLogoUrl('');
      setLogoFileName(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      setLinks([{ label: '', url: '' }]);
      setFieldVisibility({ ...DEFAULT_FIELD_VISIBILITY });
      setDirectoryLevel('off');
      setConsentShare(false);
      setConsentContactReq(false);
      setConsentNetworkVis(false);
      setConsentSuggestions(false);
      setWillingContacts(false);
      setParticipateNetwork(false);
      return;
    }
    setExisting(row);
    setName(row.name ?? '');
    setDescription(row.description ?? '');
    setThemes(row.themes ?? '');
    setTerritory(row.territory ?? '');
    setOrganizationType(row.organization_type ?? '');
    setContactName(row.contact_name ?? '');
    setContactEmail(row.contact_email ?? authEmail);
    setContactWhatsapp(row.contact_whatsapp ?? '');
    setSeeks(row.seeks ?? '');
    setOffers(row.offers ?? '');
    setLogoUrl(row.logo_url ?? '');
    setLogoFileName(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
    setLinks(parseLinks(row.links));
    setFieldVisibility(mergeFieldVisibility(row.field_visibility));
    setDirectoryLevel(row.directory_level ?? 'off');
    setConsentShare(row.consent_share_profile_with_orgs);
    setConsentContactReq(row.consent_receive_contact_requests);
    setConsentNetworkVis(row.consent_network_visualization);
    setConsentSuggestions(row.consent_connection_suggestions);
    setWillingContacts(row.willing_to_receive_contacts);
    setParticipateNetwork(row.participate_in_network_display);
  }, [authEmail]);

  const reload = useCallback(async () => {
    setLoadState('loading');
    setLoadError(null);
    try {
      const row = await fetchOrganizationProfileByOwner(supabase, userId);
      applyRow(row);
      setLoadState('ready');
      if (row?.id) {
        const rev = await fetchOrganizationProfileRevisions(supabase, row.id);
        setRevisions(rev);
      } else {
        setRevisions([]);
      }
    } catch (e) {
      setLoadState('error');
      setLoadError(e instanceof Error ? e.message : 'No se pudo cargar el perfil.');
    }
  }, [supabase, userId, applyRow]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setVisibility = (key: OrgVisibilityFieldKey, level: OrgFieldVisibilityLevel) => {
    setFieldVisibility((prev) => ({ ...prev, [key]: level }));
  };

  const updateLink = (index: number, patch: Partial<OrgProfileLink>) => {
    setLinks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const addLinkRow = () => setLinks((prev) => [...prev, { label: '', url: '' }]);
  const removeLinkRow = (index: number) =>
    setLinks((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const handleLogoFile = async (file: File | null) => {
    setLogoUploadError(null);
    if (!file) {
      setLogoFileName(null);
      return;
    }
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
    if (!ALLOWED_TYPES.includes(file.type)) {
      setLogoUploadError('Formato no válido. Usa JPEG, PNG, WebP o GIF.');
      setLogoFileName(null);
      return;
    }
    if (file.size > MAX_SIZE) {
      setLogoUploadError('La imagen excede 2 MB.');
      setLogoFileName(null);
      return;
    }
    setLogoFileName(file.name);
    setLogoUploading(true);
    try {
      const url = await uploadAndCompressImage(file, 80, { bucket: 'organization_logos' })
      setLogoUrl(url)
      setLogoFileName(null)
      if (logoInputRef.current) logoInputRef.current.value = ''
    } catch (err) {
      setLogoUploadError(err instanceof Error ? err.message : 'Error al subir');
    } finally {
      setLogoUploading(false);
    }
  };

  const buildPayload = (prev: OrganizationProfileRow | null) => {
    const now = new Date().toISOString();
    const nextShare = consentShare;
    const prevShare = prev?.consent_share_profile_with_orgs ?? false;
    const nextContact = consentContactReq;
    const prevContact = prev?.consent_receive_contact_requests ?? false;
    const nextNet = consentNetworkVis;
    const prevNet = prev?.consent_network_visualization ?? false;
    const nextSug = consentSuggestions;
    const prevSug = prev?.consent_connection_suggestions ?? false;

    const stamp = (on: boolean, wasOn: boolean, prevAt: string | null | undefined) =>
      on ? (wasOn ? (prevAt ?? now) : now) : null;

    return {
      name: name.trim() || 'Sin nombre',
      description: description.trim() || null,
      themes: themes.trim() || null,
      territory: territory.trim() || null,
      organization_type: organizationType.trim() || null,
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_whatsapp: contactWhatsapp.trim() || null,
      seeks: seeks.trim() || null,
      offers: offers.trim() || null,
      logo_url: logoUrl.trim() || null,
      links: normalizeLinksForSave(links),
      field_visibility: fieldVisibility,
      directory_level: directoryLevel,
      willing_to_receive_contacts: willingContacts,
      participate_in_network_display: participateNetwork,
      consent_share_profile_with_orgs: nextShare,
      consent_share_profile_with_orgs_at: stamp(
        nextShare,
        prevShare,
        prev?.consent_share_profile_with_orgs_at,
      ),
      consent_receive_contact_requests: nextContact,
      consent_receive_contact_requests_at: stamp(
        nextContact,
        prevContact,
        prev?.consent_receive_contact_requests_at,
      ),
      consent_network_visualization: nextNet,
      consent_network_visualization_at: stamp(nextNet, prevNet, prev?.consent_network_visualization_at),
      consent_connection_suggestions: nextSug,
      consent_connection_suggestions_at: stamp(
        nextSug,
        prevSug,
        prev?.consent_connection_suggestions_at,
      ),
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveOk(null);
    if (!name.trim()) {
      setSaveError('El nombre de la organización es obligatorio.');
      return;
    }
    if (directoryLevel !== 'off' && !consentShare) {
      setSaveError(
        'Para aparecer en el directorio (comunidad o público) debes aceptar «Compartir mi perfil con otras organizaciones».',
      );
      return;
    }

    setSaving(true);
    const payload = buildPayload(existing);
    let err: Error | null = null;
    if (existing) {
      const r = await updateOrganizationProfile(supabase, existing.id, payload);
      err = r.error;
      if (!err && r.data) applyRow(r.data);
    } else {
      const r = await insertOrganizationProfile(supabase, userId, payload);
      err = r.error;
      if (!err && r.data) applyRow(r.data);
    }
    setSaving(false);
    if (err) {
      if (err.message.includes('does not exist') || err.message.includes('schema cache')) {
        setSaveError(
          'La tabla de perfiles no existe en este proyecto. Ejecuta en Supabase el script RUN_ORGANIZATION_PROFILES_PHASE1.sql.',
        );
      } else {
        setSaveError(err.message);
      }
      return;
    }
    setSaveOk(existing ? 'Perfil actualizado.' : 'Perfil creado.');
    const refreshed = await fetchOrganizationProfileByOwner(supabase, userId);
    if (refreshed?.id) {
      const rev = await fetchOrganizationProfileRevisions(supabase, refreshed.id);
      setRevisions(rev);
    }
  };

  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <p className={`font-mono text-xs uppercase tracking-widest ${P_TEXT_ACCENT} py-10`}>Cargando perfil…</p>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="bg-red-50 px-4 py-3 text-sm text-red-900">
        {loadError ?? 'Error al cargar.'}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-6">
      <div className={P_CALLOUT}>
        <p className="font-mono text-xs uppercase tracking-widest text-gray-900 mb-2">Visibilidad y directorio</p>
        <p>
          El ícono de ojo al costado de cada campo abre un menú (público, comunidad o privado). El directorio solo lista
          quien lo activa y acepta compartir perfil; los visitantes anónimos solo ven lo público.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white p-6">
          <div className="space-y-0">
            <div className={P_FIELD}>
              <label htmlFor="org-name" className={P_LABEL}>
                Nombre de la organización <span className="text-red-600">*</span>
              </label>
              <input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={P_INPUT}
                required
                maxLength={200}
                placeholder="Ej. Colectivo..."
              />
            </div>
            <div className={P_FIELD}>
              <label htmlFor="org-desc" className={P_LABEL}>
                Descripción breve
              </label>
              <div className="flex gap-4 sm:gap-5 items-start">
                <div className="flex-1 min-w-0">
                  <textarea
                    id="org-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={P_TEXTAREA}
                    maxLength={2000}
                    rows={4}
                    placeholder="Quiénes son y qué hacen."
                  />
                </div>
                <VisibilityEyeSelect
                  fieldKey="description"
                  value={fieldVisibility.description}
                  onChange={(level) => setVisibility('description', level)}
                />
              </div>
            </div>
            <div className={P_FIELD}>
              <label htmlFor="org-themes" className={P_LABEL}>
                Temas que trabajas
              </label>
              <div className="flex gap-4 sm:gap-5 items-start">
                <div className="flex-1 min-w-0">
                  <input
                    id="org-themes"
                    value={themes}
                    onChange={(e) => setThemes(e.target.value)}
                    className={P_INPUT}
                    maxLength={500}
                    placeholder="Ej. agua, compostaje, educación ambiental"
                  />
                </div>
                <VisibilityEyeSelect
                  fieldKey="themes"
                  value={fieldVisibility.themes}
                  onChange={(level) => setVisibility('themes', level)}
                />
              </div>
            </div>
            <div className={P_FIELD}>
              <label htmlFor="org-territory" className={P_LABEL}>
                Territorio donde trabajas
              </label>
              <div className="flex gap-4 sm:gap-5 items-start">
                <div className="flex-1 min-w-0">
                  <input
                    id="org-territory"
                    value={territory}
                    onChange={(e) => setTerritory(e.target.value)}
                    className={P_INPUT}
                    maxLength={300}
                    placeholder="Ej. Aguascalientes, Ags."
                  />
                </div>
                <VisibilityEyeSelect
                  fieldKey="territory"
                  value={fieldVisibility.territory}
                  onChange={(level) => setVisibility('territory', level)}
                />
              </div>
            </div>
            <div className={P_FIELD}>
              <label htmlFor="org-type" className={P_LABEL}>
                Tipo de organización (opcional)
              </label>
              <input
                id="org-type"
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value)}
                className={P_INPUT}
                maxLength={120}
                placeholder="Ej. AC, colectivo, red"
              />
            </div>

            <div className="space-y-20">
              <section className="space-y-0" aria-labelledby="org-sub-contact">
                <h3 id="org-sub-contact" className={P_SECTION_TITLE}>
                  Contacto
                </h3>
                <div className={P_FIELD}>
                  <label htmlFor="org-contact-name" className={P_LABEL}>
                    Persona de contacto
                  </label>
                  <div className="flex gap-4 sm:gap-5 items-start">
                    <div className="flex-1 min-w-0">
                      <input
                        id="org-contact-name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className={P_INPUT}
                        maxLength={200}
                      />
                    </div>
                    <VisibilityEyeSelect
                      fieldKey="contact_name"
                      value={fieldVisibility.contact_name}
                      onChange={(level) => setVisibility('contact_name', level)}
                    />
                  </div>
                </div>
                <div className={P_FIELD}>
                  <label htmlFor="org-contact-email" className={P_LABEL}>
                    Correo de contacto
                  </label>
                  <div className="flex gap-4 sm:gap-5 items-start">
                    <div className="flex-1 min-w-0">
                      <input
                        id="org-contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className={P_INPUT}
                        maxLength={320}
                      />
                    </div>
                    <VisibilityEyeSelect
                      fieldKey="contact_email"
                      value={fieldVisibility.contact_email}
                      onChange={(level) => setVisibility('contact_email', level)}
                    />
                  </div>
                </div>
                <div className={P_FIELD}>
                  <label htmlFor="org-wa" className={P_LABEL}>
                    WhatsApp 
                  </label>
                  <div className="flex gap-4 sm:gap-5 items-start">
                    <div className="flex-1 min-w-0">
                      <input
                        id="org-wa"
                        value={contactWhatsapp}
                        onChange={(e) => setContactWhatsapp(e.target.value)}
                        className={P_INPUT}
                        maxLength={200}
                        placeholder="+52…"
                      />
                    </div>
                    <VisibilityEyeSelect
                      fieldKey="contact_whatsapp"
                      value={fieldVisibility.contact_whatsapp}
                      onChange={(level) => setVisibility('contact_whatsapp', level)}
                    />
                  </div>
                </div>
              </section>

              <section className="" aria-labelledby="org-sub-links">
                <h3 id="org-sub-links" className={P_SECTION_TITLE}>
                  Enlaces (redes o sitio web)
                </h3>
                <div className="flex gap-4 sm:gap-5 items-start">
                  <div className="flex-1 min-w-0 space-y-8">
                    {links.map((row, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row gap-3 sm:items-end border-b border-black/10 pb-8 sm:pb-10 last:border-0"
                      >
                        <div className="flex-1 space-y-3">
                          <label className={P_SUB_LABEL}>Etiqueta</label>
                          <input
                            value={row.label}
                            onChange={(e) => updateLink(i, { label: e.target.value })}
                            className={P_INPUT}
                            placeholder="Sitio web, Instagram…"
                            maxLength={80}
                          />
                        </div>
                        <div className="flex-[2] min-w-0 space-y-3">
                          <label className={P_SUB_LABEL}>URL</label>
                          <input
                            value={row.url}
                            onChange={(e) => updateLink(i, { url: e.target.value })}
                            className={P_INPUT}
                            placeholder="https://…"
                            maxLength={500}
                          />
                        </div>
                        {links.length > 1 ? (
                          <button
                            type="button"
                            className={`${P_LINK_DANGER} shrink-0`}
                            onClick={() => removeLinkRow(i)}
                          >
                            Quitar
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button
                      type="button"
                      className={`${P_LINK_ACTION} mt-2`}
                      onClick={addLinkRow}
                    >
                      + Añadir enlace
                    </button>
                  </div>
                  <VisibilityEyeSelect
                    fieldKey="links"
                    value={fieldVisibility.links}
                    onChange={(level) => setVisibility('links', level)}
                  />
                </div>
              </section>

              <section className="space-y-0 pt-16" aria-labelledby="org-sub-collab">
                <h3 id="org-sub-collab" className={P_SECTION_TITLE}>
                  Colaboración
                </h3>
                <div className={P_FIELD}>
                  <label htmlFor="org-seeks" className={P_LABEL}>
                    Qué buscas
                  </label>
                  <div className="flex gap-4 sm:gap-5 items-start">
                    <div className="flex-1 min-w-0">
                      <textarea
                        id="org-seeks"
                        value={seeks}
                        onChange={(e) => setSeeks(e.target.value)}
                        className={P_TEXTAREA_COMPACT}
                        maxLength={2000}
                        rows={3}
                      />
                    </div>
                    <VisibilityEyeSelect
                      fieldKey="seeks"
                      value={fieldVisibility.seeks}
                      onChange={(level) => setVisibility('seeks', level)}
                    />
                  </div>
                </div>
                <div className={P_FIELD}>
                  <label htmlFor="org-offers" className={P_LABEL}>
                    Qué ofreces
                  </label>
                  <div className="flex gap-4 sm:gap-5 items-start">
                    <div className="flex-1 min-w-0">
                      <textarea
                        id="org-offers"
                        value={offers}
                        onChange={(e) => setOffers(e.target.value)}
                        className={P_TEXTAREA_COMPACT}
                        maxLength={2000}
                        rows={3}
                      />
                    </div>
                    <VisibilityEyeSelect
                      fieldKey="offers"
                      value={fieldVisibility.offers}
                      onChange={(level) => setVisibility('offers', level)}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-12 pt-16" aria-labelledby="org-sub-logo">
                <h3 id="org-sub-logo" className={P_SECTION_TITLE}>
                  Logo o imagen
                </h3>
                <div className="flex gap-4 sm:gap-5 items-start">
                  <div className="flex-1 min-w-0 space-y-5">
                    {logoUrl ? (
                      <div className="flex flex-wrap items-end gap-4">
                        <SafeImage
                          src={logoUrl}
                          alt="Logo de la organización"
                          className="h-20 w-auto max-w-[200px] object-contain border border-gray-300"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          className={P_LINK_DANGER}
                          onClick={() => {
                            setLogoUrl('');
                            setLogoFileName(null);
                            if (logoInputRef.current) logoInputRef.current.value = '';
                          }}
                        >
                          Quitar imagen
                        </button>
                      </div>
                    ) : null}
                    <div className={`${P_FIELD} space-y-2`}>
                      <p className={P_LABEL}>Subir archivo</p>
                      <p id="org-logo-hint" className="text-[11px] font-mono text-gray-700 leading-relaxed">
                        Formatos (JPEG, PNG,
                        WebP o GIF, máx. recomendado 2&nbsp;MB).
                      </p>
                      <input
                        ref={logoInputRef}
                        id="org-logo-file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        tabIndex={-1}
                        disabled={logoUploading}
                        onChange={(e) => void handleLogoFile(e.target.files?.[0] ?? null)}
                      />
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          type="button"
                          disabled={logoUploading}
                          aria-describedby="org-logo-hint"
                          className={P_BTN_FILE}
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="size-5 shrink-0" strokeWidth={2.25} aria-hidden />
                          {logoUploading ? 'Subiendo…' : 'Elegir imagen'}
                        </button>
                        <span
                          className="text-[11px] sm:text-xs text-gray-700 font-mono max-w-[min(100%,280px)] truncate"
                          title={logoFileName ?? undefined}
                        >
                          {logoFileName
                            ? logoFileName
                            : logoUrl
                              ? 'Imagen guardada arriba'
                              : 'Ningún archivo nuevo elegido'}
                        </span>
                      </div>
                      {logoUploadError && <p className="text-sm text-red-600">{logoUploadError}</p>}
                    </div>
                  </div>
                  <VisibilityEyeSelect
                    fieldKey="logo_url"
                    value={fieldVisibility.logo_url}
                    onChange={(level) => setVisibility('logo_url', level)}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>

        {saveError && (
          <div
            className="px-4 py-3 text-sm font-mono text-red-900 bg-red-50"
            role="alert"
          >
            {saveError}
          </div>
        )}
        {saveOk && (
          <p className="text-sm font-mono text-green-800 px-4 py-3 bg-green-50">{saveOk}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className={P_BTN_SUBMIT}
        >
          {saving ? 'Guardando…' : 'Guardar perfil'}
        </button>
      </form>

      {existing && revisions.length > 0 ? (
        <OrgAccordionPanel
          sectionKey="history"
          title={`Historial de actualizaciones (${revisions.length})`}
          subtitle="Copias guardadas antes de cada cambio."
          isOpen={historyOpen}
          onToggle={() => setHistoryOpen((o) => !o)}
        >
          <ul className="space-y-5 text-sm">
            {revisions.map((r) => (
              <li key={r.id} className="border-b border-gray-100 pb-3 last:border-0">
                <p className="font-mono text-xs text-gray-500">
                  {new Date(r.revised_at).toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                <p className="text-xs text-gray-700 mt-1">
                  Copia anterior guardada antes de un cambio (nombre:{' '}
                  <span className="font-medium text-black">
                    {String((r.snapshot as { name?: string }).name ?? '—')}
                  </span>
                  ).
                </p>
              </li>
            ))}
          </ul>
        </OrgAccordionPanel>
      ) : null}
    </div>
  );
}
