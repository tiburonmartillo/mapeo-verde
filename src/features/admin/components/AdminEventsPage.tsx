import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingVisibleId, setTogglingVisibleId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const pendingEvents = events.filter((e) => e.status === 'pending');
  const publishedEvents = events.filter((e) => e.status !== 'pending');

  const supabase = getSupabaseAuthClient();

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

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    if (!email || !password || !supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      return;
    }
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
    setFormSaving(false);
  };

  const openDeleteConfirm = (id: number) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId === null || !supabase) return;
    setDeleting(true);
    const { error } = await deleteEvent(supabase, deleteId);
    setDeleting(false);
    setDeleteConfirmOpen(false);
    setDeleteId(null);
    if (error) return;
    setEvents((prev) => prev.filter((e) => e.id !== deleteId));
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
  };

  const handlePublishPending = async (event: Event) => {
    if (!supabase) return;
    setPublishingId(event.id);
    const { error } = await updateEvent(supabase, event.id, { status: 'published' });
    setPublishingId(null);
    if (error) return;
    loadEvents();
  };

  const handleUnpublish = async (event: Event) => {
    if (!supabase) return;
    const { error } = await updateEvent(supabase, event.id, { status: 'pending' });
    if (error) return;
    loadEvents();
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
          <h1 className="text-2xl font-bold mb-6">Administrar eventos</h1>
          <p className="text-sm text-gray-600 mb-6">Inicia sesión con tu cuenta de Supabase.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Correo</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full mt-1 border-2 border-black px-3 py-2 bg-white"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full mt-1 border-2 border-black px-3 py-2 bg-white"
              />
            </div>
            {authError && (
              <p className="text-sm text-red-600" role="alert">{authError}</p>
            )}
            <button type="submit" className="w-full bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-800">
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
          <span className="text-gray-500 font-mono text-sm">/ Admin eventos</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{session.user.email}</span>
          <button
            type="button"
            className="border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-12">
        <section>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold">Eventos publicados</h2>
            <button
              type="button"
              className="bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-800"
              onClick={openCreate}
            >
              Nuevo evento
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">Estos eventos se muestran en la agenda pública. Crear, editar o borrar aquí.</p>
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
                      <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div>
                          <label htmlFor="new-title" className="block text-sm font-medium mb-1">Título</label>
                          <input id="new-title" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="new-date" className="block text-sm font-medium mb-1">Fecha</label>
                            <input id="new-date" type="date" value={form.date} onChange={(e) => updateForm({ date: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                          </div>
                          <div>
                            <label htmlFor="new-time" className="block text-sm font-medium mb-1">Hora (ej. 10:00 o 10:00–12:00)</label>
                            <input id="new-time" value={form.time} onChange={(e) => updateForm({ time: e.target.value })} placeholder="10:00" required className="w-full border-2 border-black px-3 py-2 bg-white" />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="new-location" className="block text-sm font-medium mb-1">Lugar</label>
                          <input id="new-location" value={form.location} onChange={(e) => updateForm({ location: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                        </div>
                        <div>
                          <label htmlFor="new-category" className="block text-sm font-medium mb-1">Categoría</label>
                          <input id="new-category" value={form.category} onChange={(e) => updateForm({ category: e.target.value })} className="w-full border-2 border-black px-3 py-2 bg-white" placeholder="ej. Taller, Charla" />
                        </div>
                        <div>
                          <label htmlFor="new-image" className="block text-sm font-medium mb-1">URL imagen</label>
                          <input id="new-image" type="url" value={form.image ?? ''} onChange={(e) => updateForm({ image: e.target.value || null })} className="w-full border-2 border-black px-3 py-2 bg-white" placeholder="https://..." />
                        </div>
                        <div>
                          <label htmlFor="new-description" className="block text-sm font-medium mb-1">Descripción</label>
                          <textarea id="new-description" value={form.description ?? ''} onChange={(e) => updateForm({ description: e.target.value || null })} rows={3} className="w-full border-2 border-black bg-white px-3 py-2" />
                        </div>
                        {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}
                        <div className="flex gap-2 justify-end">
                          <button type="button" className="border-2 border-black px-4 py-2 font-medium hover:bg-gray-100" onClick={() => setFormOpen(false)}>Cancelar</button>
                          <button type="submit" disabled={formSaving} className="bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-800 disabled:opacity-50">{formSaving ? 'Guardando...' : 'Crear'}</button>
                        </div>
                      </form>
                    </div>
                  </motion.li>
                )}
              </AnimatePresence>
              {publishedEvents.length === 0 && pendingEvents.length === 0 && !formOpen && (
                <p className="text-gray-600">No hay eventos. Crea uno o revisa los pendientes del formulario de participación.</p>
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
                        {event.source === 'participation' && (
                          <p className="text-xs text-amber-700 mt-1">Desde formulario de participación</p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button type="button" className="border-2 border-gray-600 text-gray-600 px-3 py-1.5 text-sm font-medium hover:bg-gray-200 disabled:opacity-50" disabled={togglingVisibleId !== null} onClick={() => handleToggleVisible(event)}>
                          {togglingVisibleId === event.id ? '...' : 'Ocultar en agenda'}
                        </button>
                        {event.source === 'participation' && (
                          <button type="button" className="border-2 border-amber-700 text-amber-700 px-3 py-1.5 text-sm font-medium hover:bg-amber-50" onClick={() => handleUnpublish(event)}>Pasar a pendiente</button>
                        )}
                        <button type="button" className="border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100" onClick={() => openEdit(event)}>Editar</button>
                        <button type="button" className="border-2 border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-50" onClick={() => openDeleteConfirm(event.id)}>Borrar</button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {editingId === event.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-2 border-t-0 border-black bg-gray-50 overflow-hidden relative z-10">
                          <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                            <form key={`edit-form-${event.id}`} onSubmit={handleFormSubmit} className="space-y-4">
                              <div>
                                <label htmlFor={`edit-title-${event.id}`} className="block text-sm font-medium mb-1">Título</label>
                                <input id={`edit-title-${event.id}`} autoFocus type="text" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label htmlFor={`edit-date-${event.id}`} className="block text-sm font-medium mb-1">Fecha</label>
                                  <input id={`edit-date-${event.id}`} type="date" value={form.date} onChange={(e) => updateForm({ date: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                                </div>
                                <div>
                                  <label htmlFor={`edit-time-${event.id}`} className="block text-sm font-medium mb-1">Hora</label>
                                  <input id={`edit-time-${event.id}`} value={form.time} onChange={(e) => updateForm({ time: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                                </div>
                              </div>
                              <div>
                                <label htmlFor={`edit-location-${event.id}`} className="block text-sm font-medium mb-1">Lugar</label>
                                <input id={`edit-location-${event.id}`} value={form.location} onChange={(e) => updateForm({ location: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                              </div>
                              <div>
                                <label htmlFor={`edit-category-${event.id}`} className="block text-sm font-medium mb-1">Categoría</label>
                                <input id={`edit-category-${event.id}`} value={form.category} onChange={(e) => updateForm({ category: e.target.value })} className="w-full border-2 border-black px-3 py-2 bg-white" />
                              </div>
                              <div>
                                <label htmlFor={`edit-image-${event.id}`} className="block text-sm font-medium mb-1">URL imagen</label>
                                <input id={`edit-image-${event.id}`} type="url" value={form.image ?? ''} onChange={(e) => updateForm({ image: e.target.value || null })} className="w-full border-2 border-black px-3 py-2 bg-white" />
                              </div>
                              <div>
                                <label htmlFor={`edit-description-${event.id}`} className="block text-sm font-medium mb-1">Descripción</label>
                                <textarea id={`edit-description-${event.id}`} value={form.description ?? ''} onChange={(e) => updateForm({ description: e.target.value || null })} rows={3} className="w-full border-2 border-black bg-white px-3 py-2" />
                              </div>
                              {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}
                              <div className="flex gap-2 justify-end">
                                <button type="button" className="border-2 border-black px-4 py-2 font-medium hover:bg-gray-100" onClick={() => setEditingId(null)}>Cancelar</button>
                                <button type="submit" disabled={formSaving} className="bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-800 disabled:opacity-50">{formSaving ? 'Guardando...' : 'Guardar'}</button>
                              </div>
                            </form>
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
                          {event.source === 'participation' && (
                            <p className="text-xs text-amber-700 mt-0.5">Desde formulario de participación</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className="border-2 border-green-700 text-green-700 px-3 py-1.5 text-sm font-medium hover:bg-green-50 disabled:opacity-50"
                            disabled={togglingVisibleId !== null}
                            onClick={() => handleToggleVisible(event)}
                          >
                            {togglingVisibleId === event.id ? '...' : 'Mostrar en agenda'}
                          </button>
                          {event.source === 'participation' && (
                            <button type="button" className="border-2 border-amber-700 text-amber-700 px-3 py-1.5 text-sm font-medium hover:bg-amber-50" onClick={() => handleUnpublish(event)}>Pasar a pendiente</button>
                          )}
                          <button type="button" className="border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100" onClick={() => openEdit(event)}>Editar</button>
                          <button type="button" className="border-2 border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-50" onClick={() => openDeleteConfirm(event.id)}>Borrar</button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {editingId === event.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-2 border-t-0 border-gray-400 bg-gray-50 overflow-hidden relative z-10">
                          <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                            <form key={`edit-form-hidden-${event.id}`} onSubmit={handleFormSubmit} className="space-y-4">
                              <div>
                                <label htmlFor={`edit-title-${event.id}`} className="block text-sm font-medium mb-1">Título</label>
                                <input id={`edit-title-${event.id}`} autoFocus type="text" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label htmlFor={`edit-date-${event.id}`} className="block text-sm font-medium mb-1">Fecha</label>
                                    <input id={`edit-date-${event.id}`} type="date" value={form.date} onChange={(e) => updateForm({ date: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                                  </div>
                                  <div>
                                    <label htmlFor={`edit-time-${event.id}`} className="block text-sm font-medium mb-1">Hora</label>
                                    <input id={`edit-time-${event.id}`} value={form.time} onChange={(e) => updateForm({ time: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                                  </div>
                                </div>
                                <div>
                                  <label htmlFor={`edit-location-${event.id}`} className="block text-sm font-medium mb-1">Lugar</label>
                                  <input id={`edit-location-${event.id}`} value={form.location} onChange={(e) => updateForm({ location: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                                </div>
                                <div>
                                  <label htmlFor={`edit-category-${event.id}`} className="block text-sm font-medium mb-1">Categoría</label>
                                  <input id={`edit-category-${event.id}`} value={form.category} onChange={(e) => updateForm({ category: e.target.value })} className="w-full border-2 border-black px-3 py-2 bg-white" />
                                </div>
                                <div>
                                  <label htmlFor={`edit-image-${event.id}`} className="block text-sm font-medium mb-1">URL imagen</label>
                                  <input id={`edit-image-${event.id}`} type="url" value={form.image ?? ''} onChange={(e) => updateForm({ image: e.target.value || null })} className="w-full border-2 border-black px-3 py-2 bg-white" />
                                </div>
                                <div>
                                  <label htmlFor={`edit-description-${event.id}`} className="block text-sm font-medium mb-1">Descripción</label>
                                  <textarea id={`edit-description-${event.id}`} value={form.description ?? ''} onChange={(e) => updateForm({ description: e.target.value || null })} rows={3} className="w-full border-2 border-black bg-white px-3 py-2" />
                                </div>
                                {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}
                                <div className="flex gap-2 justify-end">
                                  <button type="button" className="border-2 border-black px-4 py-2 font-medium hover:bg-gray-100" onClick={() => setEditingId(null)}>Cancelar</button>
                                  <button type="submit" disabled={formSaving} className="bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-800 disabled:opacity-50">{formSaving ? 'Guardando...' : 'Guardar'}</button>
                                </div>
                              </form>
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

        <section>
          <h2 className="text-xl font-bold mb-2">Eventos pendientes</h2>
          <p className="text-sm text-gray-600 mb-4">
            Envíos del formulario de participación (una sola tabla). Edita, publica o elimina.
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
                        <button type="button" className="border-2 border-green-700 text-green-700 px-3 py-1.5 text-sm font-medium hover:bg-green-100 disabled:opacity-50" disabled={publishingId !== null} onClick={() => handlePublishPending(event)}>
                          {publishingId === event.id ? 'Publicando...' : 'Publicar'}
                        </button>
                        <button type="button" className="border-2 border-black px-3 py-1.5 text-sm font-medium hover:bg-gray-100" onClick={() => openEdit(event)}>Editar</button>
                        <button type="button" className="border-2 border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-50" onClick={() => openDeleteConfirm(event.id)}>Eliminar</button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {editingId === event.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-2 border-t-0 border-amber-700/40 bg-amber-50/30 overflow-hidden relative z-10">
                          <div className="p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                            <p className="font-bold text-sm">Editar evento pendiente</p>
                            <form key={`edit-form-pending-${event.id}`} onSubmit={handleFormSubmit} className="space-y-4">
                              <div>
                                <label htmlFor={`edit-title-${event.id}`} className="block text-sm font-medium mb-1">Título</label>
                                <input id={`edit-title-${event.id}`} type="text" value={form.title} onChange={(e) => updateForm({ title: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label htmlFor={`edit-date-${event.id}`} className="block text-sm font-medium mb-1">Fecha</label>
                                  <input id={`edit-date-${event.id}`} type="date" value={form.date} onChange={(e) => updateForm({ date: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                                </div>
                                <div>
                                  <label htmlFor={`edit-time-${event.id}`} className="block text-sm font-medium mb-1">Hora</label>
                                  <input id={`edit-time-${event.id}`} value={form.time} onChange={(e) => updateForm({ time: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                                </div>
                              </div>
                              <div>
                                <label htmlFor={`edit-location-${event.id}`} className="block text-sm font-medium mb-1">Lugar</label>
                                <input id={`edit-location-${event.id}`} value={form.location} onChange={(e) => updateForm({ location: e.target.value })} required className="w-full border-2 border-black px-3 py-2 bg-white" />
                              </div>
                              <div>
                                <label htmlFor={`edit-category-${event.id}`} className="block text-sm font-medium mb-1">Categoría</label>
                                <input id={`edit-category-${event.id}`} value={form.category} onChange={(e) => updateForm({ category: e.target.value })} className="w-full border-2 border-black px-3 py-2 bg-white" />
                              </div>
                              <div>
                                <label htmlFor={`edit-image-${event.id}`} className="block text-sm font-medium mb-1">URL imagen</label>
                                <input id={`edit-image-${event.id}`} type="url" value={form.image ?? ''} onChange={(e) => updateForm({ image: e.target.value || null })} className="w-full border-2 border-black px-3 py-2 bg-white" />
                              </div>
                              <div>
                                <label htmlFor={`edit-description-${event.id}`} className="block text-sm font-medium mb-1">Descripción</label>
                                <textarea id={`edit-description-${event.id}`} value={form.description ?? ''} onChange={(e) => updateForm({ description: e.target.value || null })} rows={3} className="w-full border-2 border-black bg-white px-3 py-2" />
                              </div>
                              {formError && <p className="text-sm text-red-600" role="alert">{formError}</p>}
                              <div className="flex gap-2 justify-end">
                                <button type="button" className="border-2 border-black px-4 py-2 font-medium hover:bg-gray-100" onClick={() => setEditingId(null)}>Cancelar</button>
                                <button type="submit" disabled={formSaving} className="bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-800 disabled:opacity-50">{formSaving ? 'Guardando...' : 'Guardar'}</button>
                              </div>
                            </form>
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
      </main>

      {/* Delete confirm */}
      <Dialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 border-2 border-black bg-[#f3f4f0] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <Dialog.Title className="text-xl font-bold mb-2">¿Borrar evento?</Dialog.Title>
            <p className="text-sm text-gray-600 mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <Dialog.Close asChild>
                <button type="button" className="border-2 border-black px-4 py-2 font-medium hover:bg-gray-100">
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="button"
                className="bg-red-600 text-white border-2 border-red-600 px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Borrando...' : 'Borrar'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
};

export default AdminEventsPage;
