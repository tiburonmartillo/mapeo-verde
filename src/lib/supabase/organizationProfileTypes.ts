/** Nivel de visibilidad por campo (coincide con SQL). */
export type OrgFieldVisibilityLevel = 'public' | 'community' | 'private';

export type OrgDirectoryLevel = 'off' | 'community' | 'public';

/** Enlaces: etiqueta + URL (jsonb en BD). */
export type OrgProfileLink = { label: string; url: string };

export type OrgFieldVisibilityMap = Record<string, OrgFieldVisibilityLevel>;

export interface OrganizationProfileRow {
  id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string | null;
  themes: string | null;
  territory: string | null;
  organization_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  seeks: string | null;
  offers: string | null;
  logo_url: string | null;
  links: OrgProfileLink[] | unknown;
  willing_to_receive_contacts: boolean;
  participate_in_network_display: boolean;
  field_visibility: OrgFieldVisibilityMap | unknown;
  consent_share_profile_with_orgs: boolean;
  consent_share_profile_with_orgs_at: string | null;
  consent_receive_contact_requests: boolean;
  consent_receive_contact_requests_at: string | null;
  consent_network_visualization: boolean;
  consent_network_visualization_at: string | null;
  consent_connection_suggestions: boolean;
  consent_connection_suggestions_at: string | null;
  directory_level: OrgDirectoryLevel;
}

export interface OrganizationProfileRevisionRow {
  id: number;
  profile_id: string;
  revised_at: string;
  revised_by: string | null;
  snapshot: Record<string, unknown>;
}

/** Payload para insert/update (sin id ni owner_id en update parcial). */
export type OrganizationProfileUpsertPayload = {
  name: string;
  description?: string | null;
  themes?: string | null;
  territory?: string | null;
  organization_type?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_whatsapp?: string | null;
  seeks?: string | null;
  offers?: string | null;
  logo_url?: string | null;
  links?: OrgProfileLink[];
  willing_to_receive_contacts?: boolean;
  participate_in_network_display?: boolean;
  field_visibility?: OrgFieldVisibilityMap;
  consent_share_profile_with_orgs?: boolean;
  consent_share_profile_with_orgs_at?: string | null;
  consent_receive_contact_requests?: boolean;
  consent_receive_contact_requests_at?: string | null;
  consent_network_visualization?: boolean;
  consent_network_visualization_at?: string | null;
  consent_connection_suggestions?: boolean;
  consent_connection_suggestions_at?: string | null;
  directory_level?: OrgDirectoryLevel;
};

export const DEFAULT_FIELD_VISIBILITY: OrgFieldVisibilityMap = {
  description: 'community',
  themes: 'community',
  territory: 'community',
  contact_name: 'private',
  contact_email: 'private',
  contact_whatsapp: 'private',
  seeks: 'community',
  offers: 'community',
  logo_url: 'public',
  links: 'community',
  willing_to_receive_contacts: 'private',
  participate_in_network_display: 'private',
};

export const VISIBILITY_FIELD_KEYS = [
  'description',
  'themes',
  'territory',
  'contact_name',
  'contact_email',
  'contact_whatsapp',
  'seeks',
  'offers',
  'logo_url',
  'links',
  'willing_to_receive_contacts',
  'participate_in_network_display',
] as const;

export type OrgVisibilityFieldKey = (typeof VISIBILITY_FIELD_KEYS)[number];

export const VISIBILITY_LABELS: Record<OrgFieldVisibilityLevel, string> = {
  public: 'Público (web)',
  community: 'Comunidad (usuarios registrados)',
  private: 'Privado (solo tú y moderación)',
};

export const VISIBILITY_FIELD_LABELS: Record<OrgVisibilityFieldKey, string> = {
  description: 'Descripción',
  themes: 'Temas de trabajo',
  territory: 'Territorio / ubicación',
  contact_name: 'Persona de contacto',
  contact_email: 'Correo de contacto',
  contact_whatsapp: 'WhatsApp',
  seeks: 'Qué busca',
  offers: 'Qué ofrece',
  logo_url: 'Logo o imagen',
  links: 'Enlaces (redes / web)',
  willing_to_receive_contacts: 'Dispuesto a recibir contactos',
  participate_in_network_display: 'Participar en vista de red',
};
