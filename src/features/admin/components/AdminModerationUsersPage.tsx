import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getSupabaseAuthClient } from '../../../lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import { resolveEventsModerator } from '../../../utils/auth/eventsModerator';
import { sessionDisplayLabel } from '../../../utils/auth/adminPasswordSetup';
import {
  moderatorListAuthUsers,
  moderatorGrantEventsModerator,
  moderatorRevokeEventsModerator,
  type ModeratorAuthUserRow,
} from '../../../lib/supabase/queries';

const AdminModerationUsersPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [moderator, setModerator] = useState(false);
  const [rows, setRows] = useState<ModeratorAuthUserRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const supabase = getSupabaseAuthClient();
  const [loading, setLoading] = useState(() => Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
      if (!s) {
        setModerator(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session || !supabase) return;
    let cancelled = false;
    void (async () => {
      const m = await resolveEventsModerator(supabase, session);
      if (!cancelled) setModerator(m);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, supabase]);

  const loadList = useCallback(async () => {
    if (!supabase || !moderator) return;
    setListLoading(true);
    setListError(null);
    const { data, error } = await moderatorListAuthUsers(supabase, {
      search: search.trim() || null,
    });
    setListLoading(false);
    if (error) {
      setListError(error);
      setRows([]);
      return;
    }
    setRows(data ?? []);
  }, [supabase, moderator, search]);

  useEffect(() => {
    if (!moderator || !supabase) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadList();
    });
    return () => {
      cancelled = true;
    };
  }, [moderator, supabase, loadList]);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  };

  const handleToggleModerator = async (row: ModeratorAuthUserRow, grant: boolean) => {
    if (!supabase) return;
    setActionUserId(row.user_id);
    setActionError(null);
    const err = grant
      ? await moderatorGrantEventsModerator(supabase, row.user_id)
      : await moderatorRevokeEventsModerator(supabase, row.user_id);
    setActionUserId(null);
    if (err) {
      setActionError(err);
      return;
    }
    void loadList();
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

  if (!moderator) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-6 py-10">
        <p className="text-sm text-gray-800 max-w-md text-center">
          Esta página es solo para cuentas con permiso de moderación de la agenda.
        </p>
        <Link to="/admin" className="mt-4 text-sm font-medium underline">
          Volver a mis eventos
        </Link>
      </div>
    );
  }

  const displayLabel = sessionDisplayLabel(session);
  const userEmail = session.user.email ?? '';

  return (
    <div className="min-h-screen bg-[#f3f4f0] text-black">
      <header className="border-b border-black bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Link to="/" className="font-bold hover:underline">Mapeo Verde</Link>
          <span className="text-gray-500 font-mono text-sm">/ Usuarios y permisos</span>
          <Link
            to="/admin"
            className="text-sm font-medium underline"
          >
            ← Eventos
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs max-w-[240px] truncate" title={userEmail || undefined}>
            {displayLabel ? (
              <>
                <span className="font-medium text-black">{displayLabel}</span>
                <span className="text-gray-500"> · </span>
              </>
            ) : null}
            <span className="text-gray-500">{userEmail || '—'}</span>
          </span>
          <Link
            to="/admin/cuenta"
            className="text-xs font-medium underline text-black hover:text-[#ff7e67]"
          >
            Mi cuenta
          </Link>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 border border-amber-700">
            Moderación
          </span>
          <button
            type="button"
            className="px-3 py-1.5 text-sm font-medium hover:underline cursor-pointer"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Usuarios y permisos</h1>
          <p className="text-sm text-gray-700 mt-2 max-w-2xl leading-relaxed">
            Gestiona quién puede moderar la agenda completa (tabla <span className="font-mono">event_moderators</span>).
            El rol JWT <span className="font-mono">app_metadata.role = admin</span> solo se muestra aquí; para asignarlo o quitarlo usa el panel de Supabase (Authentication → Users) o la Admin API.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3 border-2 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="mod-user-search" className="block text-xs font-mono uppercase tracking-widest mb-1">
              Buscar por correo
            </label>
            <input
              id="mod-user-search"
              type="search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSearch(searchDraft);
                }
              }}
              className="w-full border-2 border-black px-3 py-2 bg-white"
              placeholder="fragmento del correo…"
            />
          </div>
          <button
            type="button"
            className="bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-800 cursor-pointer"
            onClick={() => setSearch(searchDraft)}
          >
            Buscar
          </button>
          <button
            type="button"
            className="border-2 border-black px-4 py-2 font-medium hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              setSearchDraft('');
              setSearch('');
            }}
          >
            Limpiar
          </button>
        </div>

        {listError && (
          <div className="border-2 border-red-600 bg-red-50 p-4 text-sm text-red-900" role="alert">
            <p className="font-medium">No se pudo cargar la lista.</p>
            <p className="mt-1 font-mono text-xs break-words">{listError}</p>
            <p className="mt-2 text-xs">
              Si acabas de desplegar la app, ejecuta en Supabase el script{' '}
              <span className="font-mono">RUN_MODERATOR_USER_MANAGEMENT.sql</span>.
            </p>
          </div>
        )}

        {actionError && (
          <p className="text-sm text-red-600 font-mono" role="alert">{actionError}</p>
        )}

        <div className="border-2 border-black bg-white overflow-x-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {listLoading ? (
            <p className="p-6 font-mono text-sm">Cargando usuarios…</p>
          ) : rows.length === 0 && !listError ? (
            <p className="p-6 text-sm text-gray-600">No hay usuarios que coincidan.</p>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-[#eaf7da]">
                  <th className="p-3 font-mono text-xs uppercase tracking-wider">Correo</th>
                  <th className="p-3 font-mono text-xs uppercase tracking-wider">ID</th>
                  <th className="p-3 font-mono text-xs uppercase tracking-wider">Alta</th>
                  <th className="p-3 font-mono text-xs uppercase tracking-wider">Permisos</th>
                  <th className="p-3 font-mono text-xs uppercase tracking-wider">Moderación tabla</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isSelf = row.user_id === session.user.id;
                  const busy = actionUserId === row.user_id;
                  return (
                    <tr key={row.user_id} className="border-b border-black/20 hover:bg-gray-50">
                      <td className="p-3 align-top">
                        {row.email}
                        {isSelf && (
                          <span className="block text-[10px] font-mono text-gray-500 mt-1">(tú)</span>
                        )}
                      </td>
                      <td className="p-3 align-top font-mono text-[11px] break-all max-w-[140px]">
                        {row.user_id}
                      </td>
                      <td className="p-3 align-top whitespace-nowrap text-gray-700">
                        {row.user_created_at
                          ? new Date(row.user_created_at).toLocaleString('es-MX', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {row.jwt_admin && (
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-black bg-[#fccb4e]">
                              JWT admin
                            </span>
                          )}
                          {row.events_moderator && (
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-black bg-[#b4ff6f]">
                              Tabla moderador
                            </span>
                          )}
                          {!row.jwt_admin && !row.events_moderator && (
                            <span className="text-gray-500 text-xs">Organizador</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        {row.events_moderator ? (
                          <button
                            type="button"
                            disabled={busy || isSelf}
                            title={isSelf ? 'No puedes quitarte a ti mismo este permiso desde aquí.' : undefined}
                            className="text-xs font-mono uppercase border-2 border-black px-3 py-1.5 hover:bg-red-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                            onClick={() => void handleToggleModerator(row, false)}
                          >
                            {busy ? '…' : 'Quitar'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            className="text-xs font-mono uppercase border-2 border-black px-3 py-1.5 hover:bg-[#b4ff6f] disabled:opacity-40 cursor-pointer"
                            onClick={() => void handleToggleModerator(row, true)}
                          >
                            {busy ? '…' : 'Añadir moderador'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminModerationUsersPage;
