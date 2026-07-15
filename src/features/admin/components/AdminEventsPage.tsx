import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { EyeOff, Eye, Trash2 } from 'lucide-react';
import { LogoMap } from '../../../components/common/LogoMap';
import { SafeImage } from '../../../components/common/SafeImage';
import { PasswordField } from '../../../components/common/PasswordField';
import { getSupabaseAuthClient } from '../../../lib/supabase/client';
import {
  getEventsAll,
  insertEvent,
  updateEvent,
  deleteEvent,
  type Event,
} from '../../../lib/supabase/queries';
import type { EventInsert } from '../../../lib/supabase/types';
import { fetchOrganizationProfileByOwner } from '../../../lib/supabase/organizationProfileQueries';
import { OrganizationProfileForm } from './OrganizationProfileForm';
import EventLocationField from '../../shared/components/EventLocationField';
import type { Session } from '@supabase/supabase-js';
import { resolveEventsModerator } from '../../../utils/auth/eventsModerator';
import { uploadAndCompressImage } from '../../../utils/image-upload';
import {
  META_ADMIN_PASSWORD_DONE,
  META_DISPLAY_NAME,
  sessionDisplayLabel,
  sessionUsedPasswordThisSession,
} from '../../../utils/auth/adminPasswordSetup';

const defaultForm: EventInsert = {
  title: '',
  date: '',
  time: '',
  iso_start: '',
  iso_end: '',
  location: '',
  category: '',
  image: null,
  description: null,
  event_url: '',
  place_name: '',
  organizers: '',
};

const BTN_TAB =
  'px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2';
const BTN_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2';

type AdminEventFormProps = {
  idPrefix: string;
  submitLabel: string;
  form: EventInsert;
  updateForm: (updates: Partial<EventInsert>) => void;
  formError: string | null;
  formSuccess: string | null;
  formSaving: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  imageUploading: boolean;
  imageUploadError: string | null;
  imageFileName: string | null;
  imagePreview: string | null;
  onImageFileSelected: (file: File | null) => void;
  session: { user: { id: string } } | null;
};

const AdminEventForm: React.FC<AdminEventFormProps> = ({
  idPrefix,
  submitLabel,
  form,
  updateForm,
  formError,
  formSuccess,
  formSaving,
  onCancel,
  onSubmit,
  imageUploading,
  imageUploadError,
  imageFileName,
  imagePreview,
  onImageFileSelected,
  session,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-title`} className="block text-sm font-medium mb-1">
          Título del evento
        </label>
        <input
          id={`${idPrefix}-title`}
          value={form.title}
          onChange={(e) => updateForm({ title: e.target.value })}
          required
          className="w-full border-2 border-black px-3 py-2 bg-white"
          placeholder="Ej. Jornada de reforestación..."
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-date`} className="block text-sm font-medium mb-1">
            Fecha
          </label>
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={form.date}
            onChange={(e) => updateForm({ date: e.target.value })}
            required
            className="w-full border-2 border-black px-3 py-2 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Horario (inicio y fin)</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              id={`${idPrefix}-time-start`}
              type="time"
              value={form.time.split(/[–-]/)[0]?.trim() || ''}
              onChange={(e) => {
                const start = e.target.value;
                const [, endPartRaw] = form.time.split(/[–-]/);
                const endPart = endPartRaw?.trim() || '';
                const timeLabel = endPart ? `${start}–${endPart}` : start;
                updateForm({ time: timeLabel });
              }}
              required
              className="w-full border-2 border-black px-3 py-2 bg-white"
            />
            <input
              id={`${idPrefix}-time-end`}
              type="time"
              value={form.time.split(/[–-]/)[1]?.trim() || ''}
              onChange={(e) => {
                const end = e.target.value;
                const [startPartRaw] = form.time.split(/[–-]/);
                const startPart = startPartRaw?.trim() || '';
                const timeLabel = startPart ? `${startPart}–${end}` : end;
                updateForm({ time: timeLabel });
              }}
              className="w-full border-2 border-black px-3 py-2 bg-white"
            />
          </div>
        </div>
      </div>
      <EventLocationField
        value={form.location}
        onChange={(next) => updateForm({ location: next })}
      />
      <div>
        <label htmlFor={`${idPrefix}-category`} className="block text-sm font-medium mb-1">
          Categoría
        </label>
        <input
          id={`${idPrefix}-category`}
          value={form.category}
          onChange={(e) => updateForm({ category: e.target.value })}
          className="w-full border-2 border-black px-3 py-2 bg-white"
          placeholder="Ej. Taller, Charla, Recorrido…"
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-description`} className="block text-sm font-medium mb-1">
          Descripción breve
        </label>
        <textarea
          id={`${idPrefix}-description`}
          value={form.description ?? ''}
          onChange={(e) => updateForm({ description: e.target.value || null })}
          rows={4}
          className="w-full border-2 border-black bg-white px-3 py-2"
          placeholder="¿Qué se hará? ¿Quién convoca? ¿Hay requisitos para asistir?"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${idPrefix}-place-name`} className="block text-sm font-medium mb-1">
            Nombre del lugar
          </label>
          <input
            id={`${idPrefix}-place-name`}
            value={form.place_name ?? ''}
            onChange={(e) => updateForm({ place_name: e.target.value || null })}
            className="w-full border-2 border-black px-3 py-2 bg-white"
            placeholder="Ej. Parque de la Ciudad"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-organizers`} className="block text-sm font-medium mb-1">
            Organiza
          </label>
          <input
            id={`${idPrefix}-organizers`}
            value={form.organizers ?? ''}
            onChange={(e) => updateForm({ organizers: e.target.value || null })}
            className="w-full border-2 border-black px-3 py-2 bg-white"
            placeholder="Ej. Colectivo Ambiental"
          />
        </div>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-event-url`} className="block text-sm font-medium mb-1">
          URL del evento (opcional)
        </label>
        <input
          id={`${idPrefix}-event-url`}
          type="url"
          value={form.event_url ?? ''}
          onChange={(e) => updateForm({ event_url: e.target.value || null })}
          className="w-full border-2 border-black px-3 py-2 bg-white"
          placeholder="https://..."
        />
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}-image-url`}
          className="block text-sm font-medium mb-1"
        >
          Cartel del evento o imagen
        </label>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center justify-center px-4 py-2 border-2 border-black bg-purple-300 text-black font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:bg-orange-300 hover:text-white transition-colors opacity-50"
              style={{ opacity: session?.user ? 1 : 0.5, pointerEvents: session?.user ? 'auto' : 'none' }}
            >
              Seleccionar imagen
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!session?.user}
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  onImageFileSelected(file || null);
                }}
              />
            </label>
            <span className="text-xs font-mono text-gray-600">
              {imageFileName ? `Archivo: ${imageFileName}` : session?.user ? 'Sin archivo seleccionado' : 'Iniciando sesión...'}
            </span>
          </div>
          <input
            id={`${idPrefix}-image-url`}
            type="url"
            value={form.image ?? ''}
            onChange={(e) => updateForm({ image: e.target.value || null })}
            className="w-full border-2 border-black px-3 py-2 bg-white"
            placeholder="O pega aquí una URL https://..."
          />
          {imageUploading && (
            <p className="text-xs font-mono text-gray-600">Subiendo imagen…</p>
          )}
          {imageUploadError && (
            <p className="text-sm text-red-700 bg-red-100 border-2 border-red-400 px-3 py-2 font-medium" role="alert">
              Error al cargar imagen: {imageUploadError}
            </p>
          )}
          {imagePreview && (
            <div className="mt-2 border border-black bg-gray-100 w-full max-w-xs overflow-hidden">
              <SafeImage
                src={imagePreview}
                alt="Vista previa del cartel"
                className="w-full h-32 object-contain bg-white"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </div>
      {formSuccess && (
        <p className="text-sm text-green-800 bg-green-100 border-2 border-green-500 px-3 py-2 font-medium" role="status">
          {formSuccess}
        </p>
      )}
      {formError && (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          className={`border-2 border-black px-4 py-2 font-medium hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={formSaving}
          className={`bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-orange-300 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none`}
        >
          {formSaving ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

/** Offset de Ciudad de México respecto a UTC (sin horario de verano). */
const CDMX_OFFSET = '-06:00';

function buildIso(date: string, time: string): string {
  if (!date || !time) return '';
  const d = date.slice(0, 10);
  const t = time.length >= 5 ? time.slice(0, 5) : time.padEnd(5, '0');
  return `${d}T${t}:00${CDMX_OFFSET}`;
}

function buildIsoFromTimeRange(date: string, timeStr: string): { iso_start: string; iso_end: string } {
  const d = date.slice(0, 10);
  const parts = timeStr.split(/[–-]/).map((s) => s.trim());
  const start = parts[0] && parts[0].length >= 5 ? parts[0].slice(0, 5) : '10:00';
  const end = parts[1] && parts[1].length >= 5 ? parts[1].slice(0, 5) : start;
  return {
    iso_start: `${d}T${start}:00${CDMX_OFFSET}`,
    iso_end: `${d}T${end}:00${CDMX_OFFSET}`,
  };
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

const AdminEventsPage = () => {
  type AdminTab = 'events' | 'account';
  const PAGE_SIZE = 10;
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<EventInsert>(defaultForm);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingVisibleId, setTogglingVisibleId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [moderator, setModerator] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('events');
  const [currentPage, setCurrentPage] = useState(1);
  const [orgProfileId, setOrgProfileId] = useState<string | null>(null);
  const [accountDisplayName, setAccountDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  type CsvPeriod = 'all' | 'this-month' | 'this-year' | 'custom';
  const [csvPeriod, setCsvPeriod] = useState<CsvPeriod>('all');
  const [csvDateFrom, setCsvDateFrom] = useState('');
  const [csvDateTo, setCsvDateTo] = useState('');
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [eventFilter, setEventFilter] = useState<'past' | 'active' | 'pending'>('active');

  const pendingEvents = events.filter((e) => e.status === 'pending');
  const publishedEvents = events.filter((e) => e.status !== 'pending');
  const todayDate = new Date().toISOString().slice(0, 10);
  const pastEvents = publishedEvents.filter((e) => e.date < todayDate);
  const activeVisibleEvents = publishedEvents.filter((e) => e.date >= todayDate && e.visible !== false);
  const activeHiddenEvents = publishedEvents.filter((e) => e.date >= todayDate && e.visible === false);
  const activeEvents = [...activeVisibleEvents, ...activeHiddenEvents];
  const tabEvents =
    eventFilter === 'past'
      ? pastEvents
      : eventFilter === 'pending'
        ? pendingEvents
        : activeEvents;
  const totalPages = Math.max(1, Math.ceil(tabEvents.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const paginatedTabEvents = tabEvents.slice(pageStart, pageEnd);
  const paginatedActiveVisibleEvents = paginatedTabEvents.filter((e) => e.visible !== false);
  const paginatedActiveHiddenEvents = paginatedTabEvents.filter((e) => e.visible === false);

  const supabase = getSupabaseAuthClient();

  const notifyEventsUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mapeo-verde:events-updated'));
    }
  };

  const handleImageFileSelected = async (file: File | null) => {
    if (!supabase || !file) {
      setImageFileName(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      return;
    }
    if (!session?.user) {
      setImageUploadError('La sesión no está lista. Espera unos segundos e inténtalo de nuevo.');
      setImageFileName(null);
      return;
    }
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageUploadError('Formato no válido. Usa JPEG, PNG, WebP o GIF.');
      setImageFileName(null);
      return;
    }
    if (file.size > MAX_SIZE) {
      setImageUploadError('La imagen excede 5 MB.');
      setImageFileName(null);
      return;
    }
    setImageUploadError(null);
    setImageUploading(true);
    setImageFileName(file.name);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    try {
      const url = await uploadAndCompressImage(file, 80)
      setForm((prev) => ({ ...prev, image: url }))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'sin mensaje de error';
      console.error('Image upload error:', err);
      setImageUploadError(msg);
    } finally {
      setImageUploading(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Evita redirigir a /ingreso antes de que se procese #access_token en la URL (enlace mágico).
      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  /** Quien entró con contraseña no debe ver el modal; marcamos metadata para futuras sesiones OTP. */
  useEffect(() => {
    if (!session?.user || !supabase) return;
    if (!sessionUsedPasswordThisSession(session)) return;
    const meta = session.user.user_metadata ?? {};
    if (meta[META_ADMIN_PASSWORD_DONE]) return;
    void supabase.auth.updateUser({
      data: { ...meta, [META_ADMIN_PASSWORD_DONE]: true },
    });
  }, [session, supabase]);

  const loadEvents = useCallback(async () => {
    if (!supabase || !session) return;
    setEventsLoading(true);
    const list = await getEventsAll(supabase);
    setEvents(list);
    setEventsLoading(false);
  }, [supabase, session]);

  useEffect(() => {
    if (session && supabase) {
      loadEvents();
    }
  }, [session, supabase, loadEvents]);

  useEffect(() => {
    if (!supabase || !session?.user) return;
    let cancelled = false;
    void (async () => {
      const profile = await fetchOrganizationProfileByOwner(supabase, session.user.id);
      if (!cancelled) setOrgProfileId(profile?.id ?? null);
    })();
    return () => { cancelled = true; };
  }, [supabase, session]);

  useEffect(() => {
    if (!session || !supabase) {
      setModerator(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const m = await resolveEventsModerator(supabase, session);
      if (!cancelled) setModerator(m);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, supabase]);

  useEffect(() => {
    setCurrentPage(1);
  }, [eventFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!session?.user) return;
    const meta = session.user.user_metadata ?? {};
    const fromMeta =
      typeof meta[META_DISPLAY_NAME] === 'string' ? (meta[META_DISPLAY_NAME] as string) : '';
    setAccountDisplayName(fromMeta.trim() || (typeof meta.full_name === 'string' ? meta.full_name : ''));
  }, [session]);

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !session?.user) return;
    setNameError(null);
    setNameMessage(null);
    setSavingName(true);
    const trimmed = accountDisplayName.trim();
    const meta = { ...session.user.user_metadata };
    if (trimmed) {
      meta[META_DISPLAY_NAME] = trimmed;
    } else {
      delete meta[META_DISPLAY_NAME];
    }
    const { error } = await supabase.auth.updateUser({ data: meta });
    setSavingName(false);
    if (error) {
      setNameError(error.message);
      return;
    }
    setNameMessage('Nombre guardado.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !session?.user) return;
    setPasswordError(null);
    setPasswordMessage(null);
    if (!newPassword && !confirmPassword) {
      setPasswordError('Escribe una contraseña nueva.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage('Contraseña actualizada.');
  };

  const handleDeleteAccount = async () => {
    if (!supabase || !session?.user) return;
    setDeleteAccountError(null);
    setDeletingAccount(true);
    const { error } = await supabase.rpc('delete_user_account');
    setDeletingAccount(false);
    if (error) {
      setDeleteAccountError(error.message);
      return;
    }
    await supabase.auth.signOut();
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  };

  const openCreate = () => {
    setEditingId(null);
    setFormSuccess(null);
    setImageUploadError(null);
    setImageFileName(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      ...defaultForm,
      date: today,
      time: '10:00',
      iso_start: buildIso(today, '10:00'),
      iso_end: buildIso(today, '11:00'),
      organization_id: orgProfileId ?? undefined,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (event: Event) => {
    if (editingId === event.id) {
      setEditingId(null);
      return;
    }
    setFormOpen(false);
    setFormSuccess(null);
    setImageUploadError(null);
    setImageFileName(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setEditingId(event.id);
    setForm({
      title: event.title,
      date: event.date.slice(0, 10),
      time: event.time,
      iso_start: event.isoStart,
      iso_end: event.isoEnd,
      location: event.location,
      category: event.category,
      image: event.image || null,
      description: event.description || null,
      event_url: event.eventUrl ?? undefined,
      place_name: event.placeName ?? undefined,
      organizers: event.organizers ?? undefined,
    });
    setFormError(null);
  };

  const updateForm = (updates: Partial<EventInsert>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (imageUploading) {
      setFormError('Espera a que termine de subir la imagen.');
      return;
    }
    const { iso_start, iso_end } = buildIsoFromTimeRange(form.date, form.time);
    setFormSaving(true);
    setFormError(null);
    setFormSuccess(null);
    const payload = {
      title: form.title,
      date: form.date,
      time: form.time,
      iso_start,
      iso_end,
      location: form.location,
      category: form.category,
      image: form.image || null,
      description: form.description || null,
      event_url: form.event_url || null,
      place_name: form.place_name || null,
      organizers: form.organizers || null,
      ...(editingId !== null ? {} : { status: 'published' as const, source: 'admin', created_by: session?.user?.id, organization_id: form.organization_id || null }),
      contact_name: session?.user?.user_metadata?.[META_DISPLAY_NAME] || session?.user?.user_metadata?.full_name || null,
      contact_email: session?.user?.email || null,
    };
    if (editingId !== null) {
      const { error } = await updateEvent(supabase, editingId, payload);
      if (error) {
        setFormError(error);
        setFormSaving(false);
        return;
      }
      setFormSuccess('Evento actualizado correctamente.');
      loadEvents();
    } else {
      const { data, error } = await insertEvent(supabase, payload);
      if (error) {
        setFormError(error);
        setFormSaving(false);
        return;
      }
      setFormSuccess('Evento creado correctamente.');
      setForm({ ...defaultForm, date: form.date, time: form.time, iso_start: form.iso_start, iso_end: form.iso_end, organization_id: orgProfileId ?? undefined });
      if (data) setEvents((prev) => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)));
      else loadEvents();
    }
    notifyEventsUpdated();
    setFormSaving(false);
  };

  const openDeleteConfirm = (id: number) => {
    setDeleteId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async () => {
    if (deleteId === null || !supabase) return;
    setDeleting(true);
    const { error } = await deleteEvent(supabase, deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (error) return;
    setEvents((prev) => prev.filter((e) => e.id !== deleteId));
    notifyEventsUpdated();
  };

  const handleToggleVisible = async (event: Event) => {
    if (!supabase) return;
    const nextVisible = event.visible === false;
    setTogglingVisibleId(event.id);
    const { error } = await updateEvent(supabase, event.id, { visible: nextVisible });
    setTogglingVisibleId(null);
    if (error) return;
    setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, visible: nextVisible } : e)));
    loadEvents();
    notifyEventsUpdated();
  };

  const handlePublishPending = async (event: Event) => {
    if (!supabase) return;
    setPublishingId(event.id);
    const { error } = await updateEvent(supabase, event.id, { status: 'published' });
    setPublishingId(null);
    if (error) return;
    loadEvents();
    notifyEventsUpdated();
  };

  const handleUnpublish = async (event: Event) => {
    if (!supabase) return;
    const { error } = await updateEvent(supabase, event.id, { status: 'pending' });
    if (error) return;
    loadEvents();
    notifyEventsUpdated();
  };

  const handleOpenCsvModal = () => {
    setCsvModalOpen(true);
  };

  const handleCsvExport = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const rows = events
      .slice()
      .filter((event) => {
        if (csvPeriod === 'all') return true;
        const d = new Date(event.date + 'T00:00:00');
        if (csvPeriod === 'this-month') {
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        }
        if (csvPeriod === 'this-year') {
          return d.getFullYear() === currentYear;
        }
        if (csvPeriod === 'custom') {
          if (csvDateFrom && d < new Date(csvDateFrom + 'T00:00:00')) return false;
          if (csvDateTo) {
            const toEnd = new Date(csvDateTo + 'T23:59:59');
            if (d > toEnd) return false;
          }
          return true;
        }
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((event) => [
        event.id,
        event.title,
        (() => { const d = new Date(event.date + 'T12:00:00'); const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']; return `${meses[d.getMonth()]}-${String(d.getDate()).padStart(2,'0')}-${d.getFullYear()}`; })(),
        new Date(event.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long' }),
        event.time,
        event.organizers ?? '',
        event.location,
        event.category,
        event.visible === false ? 'no' : 'si',
        event.status ?? 'published',
        event.source ?? '',
        event.contactName ?? '',
        event.contactEmail ?? '',
        event.image ?? '',
        event.description ?? '',
      ]);

    const headers = [
      'id',
      'titulo',
      'fecha',
      'dia_semana',
      'horario',
      'organiza',
      'ubicacion',
      'categoria',
      'visible',
      'estatus',
      'origen',
      'contacto_nombre',
      'contacto_email',
      'imagen_url',
      'descripcion',
    ];

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `eventos-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setCsvModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <span className="font-mono text-sm">Cargando...</span>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <p className="text-sm text-gray-700">Supabase no está configurado en este entorno.</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/ingreso" replace />;
  }

  const displayLabel = sessionDisplayLabel(session);
  const userEmail = session.user.email ?? '';

  return (
    <div
      className="min-h-screen bg-stone-100 text-black"
    >
      <header className="border-b border-black bg-white px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/"
            className="block h-8 w-auto shrink-0 aspect-[835/383] hover:opacity-90 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            aria-label="Mapeo Verde, inicio"
          >
            <LogoMap className="h-full w-full" />
          </Link>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {displayLabel && (
            <span className="text-sm font-semibold text-black truncate max-w-[140px] hidden sm:block" title={displayLabel}>
              {displayLabel}
            </span>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAvatarMenuOpen((p) => !p)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setAvatarMenuOpen(false);
              }}
              style={{ width: 40, height: 40 }}
              className="rounded-full border-2 border-black bg-white text-sm font-bold flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              aria-label="Menú de cuenta"
            >
              {(displayLabel || userEmail).charAt(0).toUpperCase()}
            </button>
            {avatarMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 border-2 border-black bg-white z-50"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold truncate">{displayLabel || 'Usuario'}</p>
                  <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                </div>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-300 cursor-pointer"
                  onClick={() => { handleLogout(); setAvatarMenuOpen(false); }}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10 sm:space-y-12 relative">
        <section className="mt-8">
          <div className="flex flex-wrap items-center gap-2 mb-8 border-b-2 border-black pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 text-sm font-mono font-bold uppercase tracking-wider border-2 border-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                activeTab === 'events' && (editingId !== null || formOpen)
                  ? 'bg-lime-300 text-black'
                  : activeTab === 'events'
                    ? 'bg-orange-300 text-black'
                    : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              Administrar mis eventos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2 text-sm font-mono font-bold uppercase tracking-wider border-2 border-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                activeTab === 'account'
                  ? 'bg-orange-300 text-black'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              Mi cuenta
            </button>
            {moderator && (
              <Link
                to="/admin/usuarios"
                className="ml-auto px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider border-2 border-amber-800 bg-amber-100 text-amber-900 hover:bg-amber-200 cursor-pointer"
              >
                Usuarios y permisos
              </Link>
            )}
          </div>
          {activeTab === 'account' ? (
            <div className="space-y-6">

              <section className="bg-white p-6">
                <h2 className="font-mono text-xs uppercase tracking-widest text-purple-700 mb-4">
                  Perfil de organización
                </h2>
                <OrganizationProfileForm supabase={supabase} userId={session.user.id} authEmail={userEmail} />
              </section>

              <section className="bg-white p-6">
                <h2 className="font-mono text-xs uppercase tracking-widest text-gray-600 mb-4">Correo</h2>
                <input
                  type="email"
                  value={session.user.email ?? ''}
                  readOnly
                  className="w-full border-2 border-gray-300 px-3 py-2 bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </section>

              <section className="bg-white p-6">
                <h2 className="font-mono text-xs uppercase tracking-widest text-gray-600 mb-4">Nombre en el panel</h2>
                <form onSubmit={handleSaveDisplayName} className="space-y-4">
                  <input
                    id="account-display-name"
                    type="text"
                    value={accountDisplayName}
                    onChange={(e) => setAccountDisplayName(e.target.value)}
                    className="w-full border-2 border-black px-3 py-2 bg-white"
                    placeholder="Ej. Mariana López"
                    maxLength={120}
                    autoComplete="name"
                  />
                  {nameError && <p className="text-sm text-red-600">{nameError}</p>}
                  {nameMessage && <p className="text-sm text-green-700">{nameMessage}</p>}
                  <button
                    type="submit"
                    disabled={savingName}
                    className="bg-lime-300 text-black border-2 border-black px-4 py-2 text-sm font-bold uppercase tracking-wider hover:bg-lime-400 disabled:opacity-45 cursor-pointer"
                  >
                    {savingName ? 'Guardando…' : 'Guardar'}
                  </button>
                </form>
              </section>

              <section className="bg-white p-6">
                <h2 className="font-mono text-xs uppercase tracking-widest text-gray-600 mb-4">Contraseña</h2>
                <p className="text-sm text-gray-600 mb-3">
                  Si entraste con enlace mágico, define una contraseña para usar en /ingreso.
                </p>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <PasswordField
                    id="account-new-password"
                    name="new_password"
                    label="Nueva contraseña"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <PasswordField
                    id="account-confirm-password"
                    name="confirm_password"
                    label="Confirmar contraseña"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                  {passwordMessage && <p className="text-sm text-green-700">{passwordMessage}</p>}
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="bg-black text-white border-2 border-black px-4 py-2 text-sm font-bold uppercase tracking-wider hover:bg-orange-300 hover:text-black disabled:opacity-45 cursor-pointer"
                  >
                    {savingPassword ? 'Actualizando…' : 'Actualizar'}
                  </button>
                </form>
              </section>

              <section className="bg-white p-6">
                <h2 className="font-mono text-xs uppercase tracking-widest text-red-700 mb-4">Eliminar cuenta</h2>
                <p className="text-sm text-gray-600 mb-3">
                  Esta acción borrará tu cuenta. Tus eventos se conservarán.
                </p>
                {!deleteConfirm ? (
                  <button
                    type="button"
                    className="bg-red-600 text-white px-4 py-2 text-sm font-bold uppercase tracking-wider hover:bg-red-700 cursor-pointer"
                    onClick={() => setDeleteConfirm(true)}
                  >
                    Eliminar mi cuenta
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-red-700">¿Estás seguro? Es irreversible.</p>
                    {deleteAccountError && <p className="text-sm text-red-600">{deleteAccountError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="border-2 border-black bg-white px-3 py-1.5 text-xs font-medium cursor-pointer hover:bg-gray-100"
                        onClick={() => { setDeleteConfirm(false); setDeleteAccountError(null); }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={deletingAccount}
                        className="bg-red-600 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-45 cursor-pointer"
                        onClick={handleDeleteAccount}
                      >
                        {deletingAccount ? 'Eliminando…' : 'Sí, eliminar'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setEventFilter('active')}
                    className={`${BTN_TAB} ${
                      eventFilter === 'active'
                        ? 'bg-orange-300 text-black border-black'
                        : 'bg-white text-black border-black hover:bg-lime-300'
                    }`}
                  >
                    Activos ({activeEvents.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setEventFilter('past')}
                    className={`${BTN_TAB} ${
                      eventFilter === 'past'
                        ? 'bg-orange-300 text-black border-black'
                        : 'bg-white text-black border-black hover:bg-lime-300'
                    }`}
                  >
                    Pasados ({pastEvents.length})
                  </button>
                  {pendingEvents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEventFilter('pending')}
                      className={`${BTN_TAB} ${
                        eventFilter === 'pending'
                          ? 'bg-orange-300 text-black border-black'
                          : 'bg-white text-black border-black hover:bg-lime-300'
                      }`}
                    >
                      Por autorizar ({pendingEvents.length})
                    </button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  {moderator && (
                    <button
                      type="button"
                      className={`border-2 border-black bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-lime-300 cursor-pointer ${BTN_FOCUS}`}
                      onClick={handleOpenCsvModal}
                    >
                      Exportar CSV
                    </button>
                  )}
                  <button
                    type="button"
                    className={`bg-black text-white border-2 border-black px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-orange-300 hover:text-black cursor-pointer ${BTN_FOCUS}`}
                    onClick={openCreate}
                  >
                    + Nuevo evento
                  </button>
                </div>
              </div>

              {eventsLoading ? (
                <p className="font-mono text-sm text-gray-500">Cargando eventos...</p>
              ) : (
                <div>
                  <ul className="space-y-4">
              {/* Acordeón: Nuevo evento */}
              {formOpen && (
                  <li className="border-2 border-black bg-white overflow-hidden">
                    <div className="p-4 border-b border-gray-200 font-bold">Nuevo evento</div>
                    <div className="p-4">
                      <AdminEventForm
                        idPrefix="new"
                        submitLabel="Crear"
                        form={form}
                        updateForm={updateForm}
                        formError={formError}
                        formSuccess={formSuccess}
                        formSaving={formSaving}
                        onCancel={() => setFormOpen(false)}
                        onSubmit={handleFormSubmit}
                        imageUploading={imageUploading}
                        imageUploadError={imageUploadError}
                        imageFileName={imageFileName}
                        imagePreview={imagePreview}
                        onImageFileSelected={handleImageFileSelected}
                        session={session}
                      />
                    </div>
                  </li>
                )}
              {eventFilter === 'past' && pastEvents.length === 0 && !formOpen && (
                <p className="text-gray-600">
                  No hay eventos pasados todavía.
                </p>
              )}
              {eventFilter === 'active' && activeVisibleEvents.length === 0 && activeHiddenEvents.length === 0 && !formOpen && (
                <p className="text-gray-600">
                  {moderator
                    ? 'No hay eventos activos. Puedes crear uno nuevo o revisar los pendientes por autorizar.'
                    : 'No tienes eventos activos aún. Usa «Nuevo evento» para añadir uno a la agenda.'}
                </p>
              )}
              {eventFilter === 'pending' && pendingEvents.length === 0 && !formOpen && (
                <p className="text-gray-600">No hay eventos pendientes por autorizar.</p>
              )}
              {eventFilter === 'active' && paginatedActiveVisibleEvents.map((event) => (
                  <li key={event.id} className="space-y-0">
                    <div className="border-2 border-black bg-white p-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.date} · {event.time} · {event.location}</p>
                        {moderator && event.source === 'participation' && (
                          <p className="text-xs text-amber-700 mt-1">Desde formulario de participación</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className={`text-gray-600 px-3 py-1.5 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                          disabled={togglingVisibleId !== null}
                          onClick={() => handleToggleVisible(event)}
                          aria-label="Ocultar en agenda"
                        >
                          {togglingVisibleId === event.id ? (
                            <span className="inline-block w-4 text-center">…</span>
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>
                        {moderator && event.source === 'participation' && (
                          <button
                            type="button"
                            className={`border-2 border-amber-700 text-amber-700 px-3 py-1.5 text-sm font-medium hover:bg-amber-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                            onClick={() => handleUnpublish(event)}
                          >
                            Pasar a pendiente
                          </button>
                        )}
                        <button
                          type="button"
                          className={`border-2 border-black px-3 py-1.5 text-sm font-medium rounded-full bg-white text-black hover:text-white hover:bg-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                          onClick={() => openEdit(event)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`text-red-500 px-3 py-1.5 text-sm font-medium flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:text-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                          onClick={() => openDeleteConfirm(event.id)}
                          aria-label="Borrar evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {deleteId === event.id && (
                        <div className="w-full flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            className={`px-3 py-1 text-xs font-mono border border-black bg-white text-gray-800 rounded-full hover:bg-black hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                            onClick={() => setDeleteId(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 text-xs font-mono border border-black rounded-full bg-red-600 text-white hover:text-black hover:bg-orange-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none`}
                            disabled={deleting}
                            onClick={handleDelete}
                          >
                            {deleting ? 'Borrando…' : 'Borrar'}
                          </button>
                        </div>
                      )}
                    </div>
                    {editingId === event.id && (
                        <div
                          className="border-2 border-t-0 border-black bg-gray-50 overflow-hidden relative z-10"
                        >
                          <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                            <AdminEventForm
                              idPrefix={`edit-${event.id}`}
                              submitLabel="Guardar"
                              form={form}
                              updateForm={updateForm}
                              formError={formError}
                              formSuccess={formSuccess}
                              formSaving={formSaving}
                              onCancel={() => setEditingId(null)}
                              onSubmit={handleFormSubmit}
                              imageUploading={imageUploading}
                              imageUploadError={imageUploadError}
                              imageFileName={imageFileName}
                              imagePreview={imagePreview}
                              onImageFileSelected={handleImageFileSelected}
                              session={session}
                            />
                          </div>
                        </div>
                      )}
                  </li>
                ))}
              {eventFilter === 'active' && paginatedActiveHiddenEvents.length > 0 ? (
                <React.Fragment>
                  <li className="list-none mt-8 mb-2">
                    <p className="text-sm font-mono uppercase tracking-widest text-gray-500">Ocultos (no se muestran en la agenda)</p>
                  </li>
                  {paginatedActiveHiddenEvents.map((event) => (
                    <li key={event.id} className="space-y-0">
                      <div className="border-2 border-gray-400 bg-gray-100 p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate text-gray-700">{event.title}</p>
                          <p className="text-sm text-gray-600">{event.date} · {event.time} · {event.location}</p>
                          <p className="text-xs text-gray-500 mt-1 font-medium">Oculto en la agenda</p>
                          {moderator && event.source === 'participation' && (
                            <p className="text-xs text-amber-700 mt-0.5">Desde formulario de participación</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className={`border-2 border-green-700 text-green-700 px-3 py-1.5 text-sm font-medium hover:bg-green-50 disabled:opacity-50 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none`}
                            disabled={togglingVisibleId !== null}
                            onClick={() => handleToggleVisible(event)}
                            aria-label="Mostrar en agenda"
                          >
                            {togglingVisibleId === event.id ? (
                              <span className="inline-block w-4 text-center">…</span>
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          {moderator && event.source === 'participation' && (
                            <button
                              type="button"
                              className={`border-2 border-amber-700 text-amber-700 px-3 py-1.5 text-sm font-medium hover:bg-amber-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                              onClick={() => handleUnpublish(event)}
                            >
                              Pasar a pendiente
                            </button>
                          )}
                          <button
                            type="button"
                            className={`border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                            onClick={() => openEdit(event)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={`border-2 border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                            onClick={() => openDeleteConfirm(event.id)}
                            aria-label="Borrar evento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    {editingId === event.id && (
                        <div
                          className="border-2 border-t-0 border-gray-400 bg-gray-50 overflow-hidden relative z-10"
                        >
                          <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                            <AdminEventForm
                              idPrefix={`edit-hidden-${event.id}`}
                              submitLabel="Guardar"
                              form={form}
                              updateForm={updateForm}
                              formError={formError}
                              formSuccess={formSuccess}
                              formSaving={formSaving}
                              onCancel={() => setEditingId(null)}
                              onSubmit={handleFormSubmit}
                              imageUploading={imageUploading}
                              imageUploadError={imageUploadError}
                              imageFileName={imageFileName}
                              imagePreview={imagePreview}
                              onImageFileSelected={handleImageFileSelected}
                              session={session}
                            />
                          </div>
                        </div>
                      )}
                  </li>
                ))}
              </React.Fragment>
            ) : null}
              {eventFilter === 'past' && paginatedTabEvents.map((event) => (
                  <li key={event.id} className="space-y-0">
                    <div className="border-2 border-gray-400 bg-gray-100 p-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate text-gray-700">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.date} · {event.time} · {event.location}</p>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Evento pasado</p>
                        {event.visible === false && (
                          <p className="text-xs text-gray-500 mt-0.5">Oculto en la agenda</p>
                        )}
                        {moderator && event.source === 'participation' && (
                          <p className="text-xs text-amber-700 mt-0.5">Desde formulario de participación</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className={`border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                          onClick={() => openEdit(event)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`border-2 border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                          onClick={() => openDeleteConfirm(event.id)}
                          aria-label="Borrar evento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {deleteId === event.id && (
                        <div className="w-full flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            className={`px-3 py-1 text-xs font-mono border border-black bg-white text-gray-800 rounded-full hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                            onClick={() => setDeleteId(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 text-xs font-mono border border-black rounded-full bg-red-600 text-white hover:text-black hover:bg-orange-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none`}
                            disabled={deleting}
                            onClick={handleDelete}
                          >
                            {deleting ? 'Borrando…' : 'Borrar'}
                          </button>
                        </div>
                      )}
                    </div>
                    {editingId === event.id && (
                        <div
                          className="border-2 border-t-0 border-gray-400 bg-gray-50 overflow-hidden relative z-10"
                        >
                          <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                            <AdminEventForm
                              idPrefix={`edit-past-${event.id}`}
                              submitLabel="Guardar"
                              form={form}
                              updateForm={updateForm}
                              formError={formError}
                              formSuccess={formSuccess}
                              formSaving={formSaving}
                              onCancel={() => setEditingId(null)}
                              onSubmit={handleFormSubmit}
                              imageUploading={imageUploading}
                              imageUploadError={imageUploadError}
                              imageFileName={imageFileName}
                              imagePreview={imagePreview}
                              onImageFileSelected={handleImageFileSelected}
                              session={session}
                            />
                          </div>
                        </div>
                      )}
                  </li>
                ))}
              {eventFilter === 'pending' && paginatedTabEvents.map((event) => (
                  <li key={event.id} className="space-y-0">
                    <div className="border-2 border-amber-700/40 bg-amber-50/50 p-4 flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.date} · {event.time} · {event.location}</p>
                        {(event.contactName || event.contactEmail) && (
                          <p className="text-xs text-gray-500 mt-1">Contacto: {[event.contactName, event.contactEmail].filter(Boolean).join(' · ')}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                      {moderator && (
                        <button
                          type="button"
                          className={`border-2 border-green-700 text-green-700 px-3 py-1.5 text-sm font-medium hover:bg-green-100 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none`}
                          disabled={publishingId !== null}
                          onClick={() => handlePublishPending(event)}
                        >
                          {publishingId === event.id ? 'Publicando...' : 'Publicar'}
                        </button>
                      )}
                        <button
                          type="button"
                          className={`border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                          onClick={() => openEdit(event)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`border-2 border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                          onClick={() => openDeleteConfirm(event.id)}
                          aria-label="Eliminar evento pendiente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {deleteId === event.id && (
                        <div className="w-full flex justify-end gap-2 mt-2">
                          <button
                            type="button"
                            className={`px-3 py-1 text-xs font-mono border border-black bg-white text-gray-800 rounded-full hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                            onClick={() => setDeleteId(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 text-xs font-mono border border-black rounded-full bg-red-600 text-white hover:text-black hover:bg-orange-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none`}
                            disabled={deleting}
                            onClick={handleDelete}
                          >
                            {deleting ? 'Borrando…' : 'Borrar'}
                          </button>
                        </div>
                      )}
                    </div>
                    {editingId === event.id && (
                        <div
                          className="border-2 border-t-0 border-amber-700/40 bg-amber-50/30 overflow-hidden relative z-10"
                        >
                          <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                            <p className="font-bold text-sm">Editar evento pendiente</p>
                            <AdminEventForm
                              idPrefix={`edit-pending-${event.id}`}
                              submitLabel="Guardar"
                              form={form}
                              updateForm={updateForm}
                              formError={formError}
                              formSuccess={formSuccess}
                              formSaving={formSaving}
                              onCancel={() => setEditingId(null)}
                              onSubmit={handleFormSubmit}
                              imageUploading={imageUploading}
                              imageUploadError={imageUploadError}
                              imageFileName={imageFileName}
                              imagePreview={imagePreview}
                              onImageFileSelected={handleImageFileSelected}
                              session={session}
                            />
                          </div>
                        </div>
                      )}
                  </li>
                ))}
            </ul>
            {!eventsLoading && tabEvents.length > 0 && (
              <div className="mt-8 mb-8 flex flex-wrap items-center justify-between gap-3 border-2 border-black bg-white px-3 py-3">
                <p className="text-xs font-mono text-gray-700">
                  Mostrando {pageStart + 1}-{Math.min(pageEnd, tabEvents.length)} de {tabEvents.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safePage <= 1}
                    className={`border-2 border-black px-3 py-1.5 text-sm font-medium bg-white hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none`}
                  >
                    Anterior
                  </button>
                  <span className="text-xs font-mono text-gray-700">
                    Página {safePage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safePage >= totalPages}
                    className={`border-2 border-black px-3 py-1.5 text-sm font-medium bg-white hover:bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
            </div>
            )}
          </>
        )}
        </section>
      </main>

      {csvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="bg-white border-2 border-black w-full max-w-sm mx-4 p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="csv-modal-title"
          >
            <h2 id="csv-modal-title" className="font-mono text-xs uppercase tracking-widest text-gray-700 mb-4">
              Exportar CSV — periodo
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {(['all', 'this-month', 'this-year', 'custom'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCsvPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-black cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${
                    csvPeriod === p
                      ? 'bg-orange-300 text-black'
                      : 'bg-white text-black hover:bg-lime-300'
                  }`}
                >
                  {p === 'all' ? 'Todo' : p === 'this-month' ? 'Este mes' : p === 'this-year' ? 'Este año' : 'Rango'}
                </button>
              ))}
            </div>
            {csvPeriod === 'custom' && (
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="date"
                  value={csvDateFrom}
                  onChange={(e) => setCsvDateFrom(e.target.value)}
                  className="flex-1 border-2 border-black px-2 py-1.5 text-sm bg-white"
                />
                <span className="text-sm">→</span>
                <input
                  type="date"
                  value={csvDateTo}
                  onChange={(e) => setCsvDateTo(e.target.value)}
                  className="flex-1 border-2 border-black px-2 py-1.5 text-sm bg-white"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100 cursor-pointer"
                onClick={() => setCsvModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="bg-black text-white border-2 border-black px-3 py-1.5 text-sm font-bold uppercase tracking-wider hover:bg-orange-300 hover:text-black cursor-pointer"
                onClick={handleCsvExport}
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage;
