import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { PasswordField } from '../../../components/common/PasswordField';
import { getSupabaseAuthClient } from '../../../lib/supabase/client';
import { META_DISPLAY_NAME, sessionDisplayLabel } from '../../../utils/auth/adminPasswordSetup';
import { OrganizationProfileForm } from './OrganizationProfileForm';
import {
  adminAccountPrimaryButtonLayout,
  adminDisabled,
  adminGhostPressable,
  adminLiftShadow,
  adminPressableFocus,
} from '../../../utils/adminButtonClasses';
import type { Session } from '@supabase/supabase-js';

const MIN_PASSWORD_LEN = 8;

/**
 * Cuenta: perfil de organización (tabla organization_profiles), datos de panel en metadata y contraseña.
 */
const AdminAccountPage = () => {
  const supabase = getSupabaseAuthClient();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionChecked, setSessionChecked] = useState(() => !supabase);
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'INITIAL_SESSION') {
        setSessionChecked(true);
      }
      if (s?.user) {
        const meta = s.user.user_metadata ?? {};
        const fromMeta =
          typeof meta[META_DISPLAY_NAME] === 'string' ? (meta[META_DISPLAY_NAME] as string) : '';
        setDisplayName(fromMeta.trim() || (typeof meta.full_name === 'string' ? meta.full_name : ''));
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !session?.user) return;
    setNameError(null);
    setNameMessage(null);
    setSavingName(true);
    const trimmed = displayName.trim();
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
    if (newPassword.length < MIN_PASSWORD_LEN) {
      setPasswordError(`La contraseña debe tener al menos ${MIN_PASSWORD_LEN} caracteres.`);
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
    setPasswordMessage('Contraseña actualizada. Usa la nueva en /ingreso si cierras sesión.');
  };

  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex items-center justify-center p-6">
        <p className="text-sm text-gray-700">Supabase no está configurado en este entorno.</p>
      </div>
    );
  }

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex items-center justify-center p-6">
        <p className="font-mono text-xs uppercase tracking-widest">Cargando…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/ingreso" replace />;
  }

  const displayLabel = sessionDisplayLabel(session);
  const userEmail = session.user.email ?? '';

  return (
    <div className="min-h-screen bg-[#f3f4f0] text-black">
      <header className="border-b border-black bg-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Link to="/" className="font-bold hover:underline">
            Mapeo Verde
          </Link>
          <span className="text-gray-500 font-mono text-sm">/ Mi cuenta</span>
          <Link to="/admin" className="text-sm font-medium underline">
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
          <button
            type="button"
            className={`inline-flex items-center justify-center gap-1 border border-gray-400 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-600 cursor-pointer hover:border-gray-700 hover:bg-gray-50 hover:text-black ${adminGhostPressable}`}
            onClick={handleLogout}
          >
            <LogOut className="size-3 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="admin-account-main mx-auto max-w-4xl px-6 py-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi cuenta</h1>
          <p className="text-sm text-gray-600 mt-2 max-w-2xl leading-relaxed">
            Perfil público/comunidad de tu organización (directorio y visibilidad por campo), más ajustes solo del
            panel. El correo de acceso a Supabase no se cambia aquí.
          </p>
        </div>

        <section className="border-2 border-black bg-white p-6 sm:p-8 md:p-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[#5b21b6] mb-6">
            Perfil de organización
          </h2>
          <OrganizationProfileForm supabase={supabase} userId={session.user.id} authEmail={userEmail} />
        </section>

        <section className="border-2 border-black bg-white p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-gray-600">Correo</h2>
            <p className="font-mono text-sm break-all">{session.user.email ?? '—'}</p>
          </div>
          <div className="admin-account-mail-name-gap space-y-4">
            <h2 className="font-mono text-xs uppercase tracking-widest text-gray-600">
              Nombre en el panel
            </h2>
            <form onSubmit={handleSaveDisplayName} className="space-y-4">
              <div>
                <label htmlFor="account-display-name" className="block text-sm font-medium mb-1">
                  Cómo te mostramos en el panel (opcional)
                </label>
                <input
                  id="account-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border-2 border-black px-3 py-2 bg-white"
                  placeholder="Ej. Mariana López"
                  maxLength={120}
                  autoComplete="name"
                />
              </div>
              {nameError && <p className="text-sm text-red-600">{nameError}</p>}
              {nameMessage && <p className="text-sm text-green-700">{nameMessage}</p>}
              <button
                type="submit"
                disabled={savingName}
                className={`${adminAccountPrimaryButtonLayout} bg-[#b4ff6f] text-black hover:bg-[#9adf55] ${adminPressableFocus} ${adminLiftShadow} ${adminDisabled}`}
              >
                {savingName ? 'Guardando…' : 'Guardar nombre'}
              </button>
            </form>
          </div>
        </section>

        <section className="border-2 border-black bg-white p-6 sm:p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-mono text-xs uppercase tracking-widest text-gray-600 mb-2">Contraseña</h2>
          <p className="text-sm text-gray-600 mb-4">
            Si entraste solo con enlace mágico, aquí puedes definir o cambiar una contraseña para usar «Correo y
            contraseña» en /ingreso.
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
              className={`${adminAccountPrimaryButtonLayout} bg-black text-white hover:bg-[#ff7e67] hover:text-black ${adminPressableFocus} ${adminLiftShadow} ${adminDisabled}`}
            >
              {savingPassword ? 'Actualizando…' : 'Actualizar contraseña'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default AdminAccountPage;
