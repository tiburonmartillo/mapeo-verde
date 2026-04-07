import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import EventLocationField from '../../shared/components/EventLocationField';
import { EyeOff, Eye, Trash2 } from 'lucide-react';
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
import { isEventsModerator } from '../../../utils/auth/eventsModerator';

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
              value={form.time.split(/[–\-]/)[0]?.trim() || ''}
              onChange={(e) => {
                const start = e.target.value;
                const [, endPartRaw] = form.time.split(/[–\-]/);
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
              value={form.time.split(/[–\-]/)[1]?.trim() || ''}
              onChange={(e) => {
                const end = e.target.value;
                const [startPartRaw] = form.time.split(/[–\-]/);
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
          className="border-2 border-black px-4 py-2 font-medium hover:bg-gray-100 cursor-pointer"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={formSaving}
          className="bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
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
  const parts = timeStr.split(/[–\-]/).map((s) => s.trim());
  const start = parts[0] && parts[0].length >= 5 ? parts[0].slice(0, 5) : '10:00';
  const end = parts[1] && parts[1].length >= 5 ? parts[1].slice(0, 5) : start;
  return {
    iso_start: `${d}T${start}:00`,
    iso_end: `${d}T${end}:00`,
  };
}

const AdminEventsPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
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

  const moderator = session ? isEventsModerator(session.user) : false;
  const pendingEvents = moderator ? events.filter((e) => e.status === 'pending') : [];
  const publishedEvents = events.filter((e) => e.status !== 'pending');

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
    } catch (err: any) {
      setImageUploadError(
        'Error al subir la imagen: ' + (err?.message || 'sin mensaje de error')
      );
    } finally {
      setImageUploading(false);
    }
  };

  const loadSession = useCallback(async () => {
    if (!supabase) return;
    const { data: { session: s } } = await supabase.auth.getSession();
    setSession(s);
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, [supabase, loadSession]);

  useEffect(() => {
    if (!session || !supabase) {
      setLoading(false);
      return;
    }
    setLoading(false);
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

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;
    if (!email || !password || !supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

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
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-bold mb-6">Tus eventos en la agenda</h1>
          <p className="text-sm text-gray-600 mb-4">
            Inicia sesión con el correo y contraseña de tu cuenta en Supabase para gestionar solo los eventos que crees con esa cuenta.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Los usuarios se crean en Supabase → <span className="font-mono">Authentication → Users</span> (o registro por invitación, si lo activas). El proveedor Email debe estar habilitado.
          </p>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium mb-1">Correo</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full border-2 border-black px-3 py-2 bg-white"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium mb-1">Contraseña</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full border-2 border-black px-3 py-2 bg-white"
              />
            </div>
            {authError && (
              <p className="text-sm text-red-600" role="alert">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-800 cursor-pointer"
            >
              Entrar
            </button>
          </form>
        </div>
        <Link to="/" className="mt-6 text-sm underline">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f0] text-black">
      <header className="border-b border-black bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold hover:underline">Mapeo Verde</Link>
          <span className="text-gray-500 font-mono text-sm">/ Mis eventos</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 max-w-[200px] truncate" title={session.user.email ?? undefined}>
            {session.user.email}
          </span>
          {moderator && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 border border-amber-700">
              Moderación
            </span>
          )}
          <button
            type="button"
            className="px-3 py-1.5 text-sm font-medium hover:underline cursor-pointer"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-12 relative">
        <section>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold">Eventos publicados</h2>
              {!moderator && (
                <p className="text-sm text-gray-600 mt-1">Solo aparecen los que creaste con esta cuenta.</p>
              )}
            </div>
            <button
              type="button"
              className="bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-100 hover:text-black flex items-center gap-2 transition-transform hover:shadow-red-400 cursor-pointer"
              onClick={openCreate}
            >
              <span>+ Nuevo evento</span>
            </button>
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
              {publishedEvents.length === 0 && pendingEvents.length === 0 && !formOpen && (
                <p className="text-gray-600">
                  {moderator
                    ? 'No hay eventos en tu vista. Crea uno o revisa los pendientes del formulario de participación.'
                    : 'No tienes eventos publicados aún. Usa «Nuevo evento» para añadir uno a la agenda.'}
                </p>
              )}
              {publishedEvents.filter((e) => e.visible !== false).length > 0 && (
                <li className="list-none mt-6 mb-2">
                  <p className="text-sm font-mono uppercase tracking-widest text-gray-600">Visibles en la agenda</p>
                </li>
              )}
              <AnimatePresence>
                {publishedEvents.filter((e) => e.visible !== false).map((event) => (
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
                          className="text-gray-600 px-3 py-1.5 text-sm font-medium hover:bg-gray-200 disabled:opacity-50 flex items-center justify-cente rounded-full cursor-pointer"
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
                            className="border-2 border-amber-700 text-amber-700 px-3 py-1.5 text-sm font-medium hover:bg-amber-50 cursor-pointer"
                            onClick={() => handleUnpublish(event)}
                          >
                            Pasar a pendiente
                          </button>
                        )}
                        <button
                          type="button"
                          className="border-2 border-black px-3 py-1.5 text-sm font-medium rounded-full bg-white text-black hover:text-white hover:bg-black cursor-pointer"
                          onClick={() => openEdit(event)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-red-600 px-3 py-1.5 text-sm font-medium bg-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-black"
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
                            className="px-3 py-1 text-xs font-mono border border-black bg-white text-gray-800 rounded-full hover:bg-black hover:text-white cursor-pointer"
                            onClick={() => setDeleteId(null)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 text-xs font-mono border border-black rounded-full bg-[var(--card-foreground)] text-black hover:text-white hover:bg-[#ff7e67] cursor-pointer disabled:opacity-50"
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
              {publishedEvents.filter((e) => e.visible === false).length > 0 && (
                <>
                  <li className="list-none mt-8 mb-2">
                    <p className="text-sm font-mono uppercase tracking-widest text-gray-500">Ocultos (no se muestran en la agenda)</p>
                  </li>
                  {publishedEvents.filter((e) => e.visible === false).map((event) => (
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
                            className="border-2 border-green-700 text-green-700 px-3 py-1.5 text-sm font-medium hover:bg-green-50 disabled:opacity-50 flex items-center justify-center cursor-pointer"
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
                              className="border-2 border-amber-700 text-amber-700 px-3 py-1.5 text-sm font-medium hover:bg-amber-50 cursor-pointer"
                              onClick={() => handleUnpublish(event)}
                            >
                              Pasar a pendiente
                            </button>
                          )}
                          <button
                            type="button"
                            className="border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100 cursor-pointer"
                            onClick={() => openEdit(event)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="border-2 border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-white"
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
            </ul>
          )}
        </section>

        {moderator && (
          <section className="pt-4">
            <h2 className="text-xl font-bold mb-2">Eventos pendientes de aprobación</h2>
            <p className="text-sm text-gray-600 mb-4">
              Eventos que se recibieron desde el formulario de participación
            </p>
            {pendingEvents.length === 0 ? (
              <p className="text-gray-600">No hay eventos pendientes.</p>
            ) : (
              <ul className="space-y-4">
                <AnimatePresence>
                  {pendingEvents.map((event) => (
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
                            className="border-2 border-green-700 text-green-700 px-3 py-1.5 text-sm font-medium hover:bg-green-100 disabled:opacity-50 cursor-pointer"
                            disabled={publishingId !== null}
                            onClick={() => handlePublishPending(event)}
                          >
                            {publishingId === event.id ? 'Publicando...' : 'Publicar'}
                          </button>
                          <button
                            type="button"
                            className="border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100 cursor-pointer"
                            onClick={() => openEdit(event)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="border-2 border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 hover:text-white"
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
                              className="px-3 py-1 text-xs font-mono border border-black bg-white text-gray-800 rounded-full hover:bg-gray-100 cursor-pointer"
                              onClick={() => setDeleteId(null)}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="px-3 py-1 text-xs font-mono border border-black rounded-full bg-[var(--card-foreground)] text-white hover:bg-[#ff7e67] cursor-pointer disabled:opacity-50"
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
          </section>
        )}
      </main>

    </div>
  );
};

export default AdminEventsPage;
