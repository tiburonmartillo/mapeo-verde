import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import EventLocationField from '../../shared/components/EventLocationField';
import { EyeOff, Eye, LogOut, Trash2 } from 'lucide-react';
import { LogoMap } from '../../../components/common/LogoMap';
import { getSupabaseAuthClient } from '../../../lib/supabase/client';
import {
  getEventsAll,
  insertEvent,
  updateEvent,
  deleteEvent,
  type Event,
} from '../../../lib/supabase/queries';
import type { EventInsert } from '../../../lib/supabase/types';
import type { Session } from '@supabase/supabase-js';
import { resolveEventsModerator } from '../../../utils/auth/eventsModerator';
import {
  adminDisabled,
  adminGhostPressable,
  adminLiftShadow,
  adminOutlinePressable,
  adminPageHeader,
  adminPageHeaderActions,
  adminPageHeaderBrand,
  adminPageHeaderUser,
  adminPressableFocus,
  adminTabPressable,
} from '../../../utils/adminButtonClasses';
import {
  META_ADMIN_PASSWORD_DONE,
  sessionDisplayLabel,
  sessionUsedPasswordThisSession,
  shouldPromptAdminPasswordSetup,
} from '../../../utils/auth/adminPasswordSetup';
import { AdminPasswordSetupModal } from './AdminPasswordSetupModal';

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
};

type AdminEventFormProps = {
  idPrefix: string;
  submitLabel: string;
  form: EventInsert;
  updateForm: (updates: Partial<EventInsert>) => void;
  formError: string | null;
  formSaving: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
  imageUploading: boolean;
  imageUploadError: string | null;
  imageFileName: string | null;
  onImageFileSelected: (file: File | null) => void;
};

const AdminEventForm: React.FC<AdminEventFormProps> = ({
  idPrefix,
  submitLabel,
  form,
  updateForm,
  formError,
  formSaving,
  onCancel,
  onSubmit,
  imageUploading,
  imageUploadError,
  imageFileName,
  onImageFileSelected,
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
      <div>
        <label
          htmlFor={`${idPrefix}-image-url`}
          className="block text-sm font-medium mb-1"
        >
          Cartel del evento o imagen
        </label>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center justify-center px-4 py-2 border-2 border-black bg-[#d89dff] text-black font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:bg-[#ff7e67] hover:text-white transition-colors">
              Seleccionar imagen
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  onImageFileSelected(file || null);
                }}
              />
            </label>
            <span className="text-xs font-mono text-gray-600">
              {imageFileName ? `Archivo: ${imageFileName}` : 'Sin archivo seleccionado'}
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
            <p className="text-xs text-red-600" role="alert">
              {imageUploadError}
            </p>
          )}
        </div>
      </div>
      {formError && (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      )}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          className={`border-2 border-black px-4 py-2 font-medium hover:bg-gray-100 cursor-pointer ${adminOutlinePressable}`}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={formSaving}
          className={`bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-[#ff7e67] hover:text-black cursor-pointer ${adminPressableFocus} ${adminLiftShadow} ${adminDisabled}`}
        >
          {formSaving ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

function buildIso(date: string, time: string): string {
  if (!date || !time) return '';
  const d = date.slice(0, 10);
  const t = time.length >= 5 ? time.slice(0, 5) : time.padEnd(5, '0');
  return `${d}T${t}:00`;
}

function buildIsoFromTimeRange(date: string, timeStr: string): { iso_start: string; iso_end: string } {
  const d = date.slice(0, 10);
  const parts = timeStr.split(/[–-]/).map((s) => s.trim());
  const start = parts[0] && parts[0].length >= 5 ? parts[0].slice(0, 5) : '10:00';
  const end = parts[1] && parts[1].length >= 5 ? parts[1].slice(0, 5) : start;
  return {
    iso_start: `${d}T${start}:00`,
    iso_end: `${d}T${end}:00`,
  };
}

const AdminEventsPage = () => {
  type AdminTab = 'past' | 'active' | 'pending';
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
  const [moderator, setModerator] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('active');
  const [currentPage, setCurrentPage] = useState(1);

  const pendingEvents = moderator ? events.filter((e) => e.status === 'pending') : [];
  const publishedEvents = events.filter((e) => e.status !== 'pending');
  const todayDate = new Date().toISOString().slice(0, 10);
  const pastEvents = publishedEvents.filter((e) => e.date < todayDate);
  const activeVisibleEvents = publishedEvents.filter((e) => e.date >= todayDate && e.visible !== false);
  const activeHiddenEvents = publishedEvents.filter((e) => e.date >= todayDate && e.visible === false);
  const activeEvents = [...activeVisibleEvents, ...activeHiddenEvents];
  const tabEvents =
    activeTab === 'past'
      ? pastEvents
      : activeTab === 'pending'
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
      return;
    }
    setImageUploadError(null);
    setImageUploading(true);
    setImageFileName(file.name);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const safeExt = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const uid = session?.user?.id ?? 'anon';
      const path = `event-banners/${uid}/admin-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${safeExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event_banners')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        setImageUploadError(uploadError.message);
      } else if (uploadData?.path) {
        const { data: publicUrlData } = supabase.storage
          .from('event_banners')
          .getPublicUrl(uploadData.path);
        if (publicUrlData?.publicUrl) {
          setForm((prev) => ({ ...prev, image: publicUrlData.publicUrl }));
        } else {
          setImageUploadError('No se pudo obtener la URL pública de la imagen.');
        }
      } else {
        setImageUploadError('No se recibió información de la ruta de la imagen subida.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'sin mensaje de error';
      setImageUploadError('Error al subir la imagen: ' + msg);
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
    if (!moderator && activeTab === 'pending') {
      setActiveTab('active');
    }
  }, [moderator, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  };

  const openCreate = () => {
    setEditingId(null);
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      ...defaultForm,
      date: today,
      time: '10:00',
      iso_start: buildIso(today, '10:00'),
      iso_end: buildIso(today, '11:00'),
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
    });
    setFormError(null);
  };

  const updateForm = (updates: Partial<EventInsert>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const { iso_start, iso_end } = buildIsoFromTimeRange(form.date, form.time);
    setFormSaving(true);
    setFormError(null);
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
      ...(editingId !== null ? {} : { status: 'published' as const, source: 'admin' }),
    };
    if (editingId !== null) {
      const { error } = await updateEvent(supabase, editingId, payload);
      if (error) {
        setFormError(error);
        setFormSaving(false);
        return;
      }
      setEditingId(null);
      loadEvents();
    } else {
      const { data, error } = await insertEvent(supabase, payload);
      if (error) {
        setFormError(error);
        setFormSaving(false);
        return;
      }
      setFormOpen(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex items-center justify-center">
        <span className="font-mono text-sm">Cargando...</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/ingreso" replace />;
  }

  const showPasswordSetup = supabase && shouldPromptAdminPasswordSetup(session);
  const displayLabel = sessionDisplayLabel(session);
  const userEmail = session.user.email ?? '';

  return (
    <>
      {showPasswordSetup ? (
        <AdminPasswordSetupModal supabase={supabase} session={session} />
      ) : null}
    <div
      className="min-h-screen bg-[#f3f4f0] text-black"
      aria-hidden={showPasswordSetup ? true : undefined}
    >
      <header className={adminPageHeader}>
        <div className={adminPageHeaderBrand}>
          <Link
            to="/"
            className="block h-8 w-auto shrink-0 aspect-[835/383] hover:opacity-90 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            aria-label="Mapeo Verde, inicio"
          >
            <LogoMap className="h-full w-full" />
          </Link>
          <span className="text-gray-500 font-mono text-sm">/ Mis eventos</span>
        </div>
        <div className={adminPageHeaderActions}>
          <div className={adminPageHeaderUser}>
            {displayLabel ? (
              <span className="text-base font-semibold text-black leading-snug truncate w-full" title={displayLabel}>
                {displayLabel}
              </span>
            ) : null}
            <span className="text-xs text-gray-500 truncate w-full" title={userEmail || undefined}>
              {userEmail || '—'}
            </span>
          </div>
          <Link
            to="/admin/cuenta"
            className={`inline-flex shrink-0 items-center justify-center border-2 border-black bg-[#b4ff6f] px-4 py-2 text-sm font-bold uppercase tracking-wide text-black hover:bg-[#9adf55] ${adminPressableFocus} ${adminLiftShadow}`}
          >
            Mi cuenta
          </Link>
          {moderator && (
            <>
              <Link
                to="/admin/usuarios"
                className={`shrink-0 text-xs font-mono uppercase tracking-wider border-2 border-amber-800 bg-amber-100 text-amber-900 px-2 py-1 hover:bg-amber-200 ${adminPressableFocus} ${adminLiftShadow}`}
              >
                Usuarios y permisos
              </Link>
              <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 border border-amber-700">
                Moderación
              </span>
            </>
          )}
          <button
            type="button"
            className={`inline-flex items-center justify-center gap-1 border border-gray-400 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-600 cursor-pointer hover:border-gray-700 hover:bg-gray-50 hover:text-black ${adminGhostPressable}`}
            onClick={handleLogout}
          >
            <LogOut className="size-3 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10 sm:space-y-12 relative">
        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold">Gestión de eventos</h2>
              {!moderator && (
                <p className="text-sm text-gray-600 mt-1">Solo aparecen los que creaste con esta cuenta.</p>
              )}
            </div>
            <button
              type="button"
              className={`w-full sm:w-auto shrink-0 justify-center bg-black text-white border-2 border-black px-4 py-2.5 sm:py-2 font-medium hover:bg-[#ff7e67] hover:text-black inline-flex items-center gap-2 cursor-pointer ${adminPressableFocus} ${adminLiftShadow}`}
              onClick={openCreate}
            >
              <span>+ Nuevo evento</span>
            </button>
          </div>
          <div className="mt-8 mb-8">
            <div className="flex w-full flex-wrap border-2 border-black bg-[#eaf7da] p-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('past')}
                className={`flex-1 min-w-[min(100%,9rem)] sm:min-w-[140px] px-3 py-3 text-sm font-mono font-bold uppercase tracking-wider border-2 cursor-pointer ${adminTabPressable} ${
                  activeTab === 'past'
                    ? 'bg-[#ff7e67] text-black border-black ring-2 ring-black ring-offset-2'
                    : 'bg-[#d89dff] text-black border-black hover:bg-[#b4ff6f]'
                }`}
              >
                Pasados ({pastEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`flex-1 min-w-[min(100%,9rem)] sm:min-w-[140px] px-3 py-3 text-sm font-mono font-bold uppercase tracking-wider border-2 cursor-pointer ${adminTabPressable} ${
                  activeTab === 'active'
                    ? 'bg-[#ff7e67] text-black border-black ring-2 ring-black ring-offset-2'
                    : 'bg-[#d89dff] text-black border-black hover:bg-[#b4ff6f]'
                }`}
              >
                Activos visibles ({activeVisibleEvents.length})
              </button>
              {moderator && (
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className={`flex-1 min-w-[min(100%,9rem)] sm:min-w-[140px] px-3 py-3 text-sm font-mono font-bold uppercase tracking-wider border-2 cursor-pointer ${adminTabPressable} ${
                    activeTab === 'pending'
                      ? 'bg-[#ff7e67] text-black border-black ring-2 ring-black ring-offset-2'
                      : 'bg-[#d89dff] text-black border-black hover:bg-[#b4ff6f]'
                  }`}
                >
                  Por autorizar ({pendingEvents.length})
                </button>
              )}
            </div>
          </div>
          {eventsLoading ? (
            <p className="font-mono text-sm text-gray-500">Cargando eventos...</p>
          ) : (
            <ul className="space-y-4">
              {/* Acordeón: Nuevo evento */}
              <AnimatePresence>
                {formOpen && (
                  <motion.li
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-200 font-bold">Nuevo evento</div>
                    <div className="p-4">
                      <AdminEventForm
                        idPrefix="new"
                        submitLabel="Crear"
                        form={form}
                        updateForm={updateForm}
                        formError={formError}
                        formSaving={formSaving}
                        onCancel={() => setFormOpen(false)}
                        onSubmit={handleFormSubmit}
                        imageUploading={imageUploading}
                        imageUploadError={imageUploadError}
                        imageFileName={imageFileName}
                        onImageFileSelected={handleImageFileSelected}
                      />
                    </div>
                  </motion.li>
                )}
              </AnimatePresence>
              {activeTab === 'past' && pastEvents.length === 0 && !formOpen && (
                <p className="text-gray-600">
                  No hay eventos pasados todavía.
                </p>
              )}
              {activeTab === 'active' && activeVisibleEvents.length === 0 && activeHiddenEvents.length === 0 && !formOpen && (
                <p className="text-gray-600">
                  {moderator
                    ? 'No hay eventos activos. Puedes crear uno nuevo o revisar los pendientes por autorizar.'
                    : 'No tienes eventos activos aún. Usa «Nuevo evento» para añadir uno a la agenda.'}
                </p>
              )}
              {activeTab === 'pending' && moderator && pendingEvents.length === 0 && !formOpen && (
                <p className="text-gray-600">No hay eventos pendientes por autorizar.</p>
              )}
              <AnimatePresence>
                {activeTab === 'active' && paginatedActiveVisibleEvents.map((event) => (
                  <motion.li key={event.id} layout className="space-y-0">
                    <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center justify-between gap-4">
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
                          className={`text-gray-600 px-3 py-1.5 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center rounded-full cursor-pointer ${adminPressableFocus} ${adminOutlinePressable}`}
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
                            className={`border-2 border-amber-700 text-amber-700 px-3 py-1.5 text-sm font-medium hover:bg-amber-50 cursor-pointer ${adminOutlinePressable}`}
                            onClick={() => handleUnpublish(event)}
                          >
                            Pasar a pendiente
                          </button>
                        )}
                        <button
                          type="button"
                          className={`border-2 border-black px-3 py-1.5 text-sm font-medium rounded-full bg-white text-black hover:text-white hover:bg-black cursor-pointer ${adminPressableFocus} ${adminLiftShadow}`}
                          onClick={() => openEdit(event)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`text-red-600 px-3 py-1.5 text-sm font-medium bg-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-black ${adminPressableFocus} ${adminOutlinePressable}`}
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
                            className={`px-3 py-1 text-xs font-mono border border-black bg-white text-gray-800 rounded-full hover:bg-black hover:text-white cursor-pointer ${adminOutlinePressable}`}
                            onClick={() => setDeleteId(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 text-xs font-mono border border-black rounded-full bg-[#dc2626] text-white hover:text-black hover:bg-[#ff7e67] cursor-pointer ${adminPressableFocus} ${adminOutlinePressable} ${adminDisabled}`}
                            disabled={deleting}
                            onClick={handleDelete}
                          >
                            {deleting ? 'Borrando…' : 'Borrar'}
                          </button>
                        </div>
                      )}
                    </div>
                    <AnimatePresence>
                      {editingId === event.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-2 border-t-0 border-black bg-gray-50 overflow-hidden relative z-10"
                        >
                          <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                            <AdminEventForm
                              idPrefix={`edit-${event.id}`}
                              submitLabel="Guardar"
                              form={form}
                              updateForm={updateForm}
                              formError={formError}
                              formSaving={formSaving}
                              onCancel={() => setEditingId(null)}
                              onSubmit={handleFormSubmit}
                              imageUploading={imageUploading}
                              imageUploadError={imageUploadError}
                              imageFileName={imageFileName}
                              onImageFileSelected={handleImageFileSelected}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                ))}
              </AnimatePresence>
              {activeTab === 'active' && paginatedActiveHiddenEvents.length > 0 && (
                <>
                  <li className="list-none mt-8 mb-2">
                    <p className="text-sm font-mono uppercase tracking-widest text-gray-500">Ocultos (no se muestran en la agenda)</p>
                  </li>
                  {paginatedActiveHiddenEvents.map((event) => (
                    <motion.li key={event.id} layout className="space-y-0">
                      <div className="border-2 border-gray-400 bg-gray-100 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] flex flex-wrap items-center justify-between gap-4">
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
                            className={`border-2 border-green-700 text-green-700 px-3 py-1.5 text-sm font-medium hover:bg-green-50 disabled:opacity-50 flex items-center justify-center cursor-pointer ${adminOutlinePressable} ${adminDisabled}`}
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
                              className={`border-2 border-amber-700 text-amber-700 px-3 py-1.5 text-sm font-medium hover:bg-amber-50 cursor-pointer ${adminOutlinePressable}`}
                              onClick={() => handleUnpublish(event)}
                            >
                              Pasar a pendiente
                            </button>
                          )}
                          <button
                            type="button"
                            className={`border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100 cursor-pointer ${adminOutlinePressable}`}
                            onClick={() => openEdit(event)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={`border-2 border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-white ${adminPressableFocus} ${adminOutlinePressable}`}
                            onClick={() => openDeleteConfirm(event.id)}
                            aria-label="Borrar evento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {editingId === event.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-2 border-t-0 border-gray-400 bg-gray-50 overflow-hidden relative z-10"
                          >
                            <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                              <AdminEventForm
                                idPrefix={`edit-hidden-${event.id}`}
                                submitLabel="Guardar"
                                form={form}
                                updateForm={updateForm}
                                formError={formError}
                                formSaving={formSaving}
                                onCancel={() => setEditingId(null)}
                                onSubmit={handleFormSubmit}
                                imageUploading={imageUploading}
                                imageUploadError={imageUploadError}
                                imageFileName={imageFileName}
                                onImageFileSelected={handleImageFileSelected}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  ))}
                </>
              )}
              <AnimatePresence>
                {activeTab === 'past' && paginatedTabEvents.map((event) => (
                  <motion.li key={event.id} layout className="space-y-0">
                    <div className="border-2 border-gray-400 bg-gray-100 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] flex flex-wrap items-center justify-between gap-4">
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
                          className={`border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100 cursor-pointer ${adminOutlinePressable}`}
                          onClick={() => openEdit(event)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`border-2 border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-white ${adminPressableFocus} ${adminOutlinePressable}`}
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
                            className={`px-3 py-1 text-xs font-mono border border-black bg-white text-gray-800 rounded-full hover:bg-gray-100 cursor-pointer ${adminOutlinePressable}`}
                            onClick={() => setDeleteId(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 text-xs font-mono border border-black rounded-full bg-[#dc2626] text-white hover:text-black hover:bg-[#ff7e67] cursor-pointer ${adminPressableFocus} ${adminOutlinePressable} ${adminDisabled}`}
                            disabled={deleting}
                            onClick={handleDelete}
                          >
                            {deleting ? 'Borrando…' : 'Borrar'}
                          </button>
                        </div>
                      )}
                    </div>
                    <AnimatePresence>
                      {editingId === event.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-2 border-t-0 border-gray-400 bg-gray-50 overflow-hidden relative z-10"
                        >
                          <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                            <AdminEventForm
                              idPrefix={`edit-past-${event.id}`}
                              submitLabel="Guardar"
                              form={form}
                              updateForm={updateForm}
                              formError={formError}
                              formSaving={formSaving}
                              onCancel={() => setEditingId(null)}
                              onSubmit={handleFormSubmit}
                              imageUploading={imageUploading}
                              imageUploadError={imageUploadError}
                              imageFileName={imageFileName}
                              onImageFileSelected={handleImageFileSelected}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                ))}
              </AnimatePresence>
              <AnimatePresence>
                {activeTab === 'pending' && moderator && paginatedTabEvents.map((event) => (
                  <motion.li key={event.id} layout className="space-y-0">
                    <div className="border-2 border-amber-700/40 bg-amber-50/50 p-4 shadow-[4px_4px_0px_0px_rgba(180,83,9,0.3)] flex flex-wrap items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.date} · {event.time} · {event.location}</p>
                        {(event.contactName || event.contactEmail) && (
                          <p className="text-xs text-gray-500 mt-1">Contacto: {[event.contactName, event.contactEmail].filter(Boolean).join(' · ')}</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          className={`border-2 border-green-700 text-green-700 px-3 py-1.5 text-sm font-medium hover:bg-green-100 disabled:opacity-50 cursor-pointer ${adminOutlinePressable} ${adminDisabled}`}
                          disabled={publishingId !== null}
                          onClick={() => handlePublishPending(event)}
                        >
                          {publishingId === event.id ? 'Publicando...' : 'Publicar'}
                        </button>
                        <button
                          type="button"
                          className={`border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100 cursor-pointer ${adminOutlinePressable}`}
                          onClick={() => openEdit(event)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className={`border-2 border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-white ${adminPressableFocus} ${adminOutlinePressable}`}
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
                            className={`px-3 py-1 text-xs font-mono border border-black bg-white text-gray-800 rounded-full hover:bg-gray-100 cursor-pointer ${adminOutlinePressable}`}
                            onClick={() => setDeleteId(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className={`px-3 py-1 text-xs font-mono border border-black rounded-full bg-[#dc2626] text-white hover:text-black hover:bg-[#ff7e67] cursor-pointer ${adminPressableFocus} ${adminOutlinePressable} ${adminDisabled}`}
                            disabled={deleting}
                            onClick={handleDelete}
                          >
                            {deleting ? 'Borrando…' : 'Borrar'}
                          </button>
                        </div>
                      )}
                    </div>
                    <AnimatePresence>
                      {editingId === event.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
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
                              formSaving={formSaving}
                              onCancel={() => setEditingId(null)}
                              onSubmit={handleFormSubmit}
                              imageUploading={imageUploading}
                              imageUploadError={imageUploadError}
                              imageFileName={imageFileName}
                              onImageFileSelected={handleImageFileSelected}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
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
                  className={`border-2 border-black px-3 py-1.5 text-sm font-medium bg-white hover:bg-gray-100 cursor-pointer ${adminOutlinePressable} ${adminDisabled}`}
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
                  className={`border-2 border-black px-3 py-1.5 text-sm font-medium bg-white hover:bg-gray-100 cursor-pointer ${adminOutlinePressable} ${adminDisabled}`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

    </div>
    </>
  );
};

export default AdminEventsPage;
