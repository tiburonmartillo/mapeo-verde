import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogoMap } from '../../../components/common/LogoMap';
import { PasswordField } from '../../../components/common/PasswordField';
import { getSupabaseAuthClient } from '../../../lib/supabase/client';
import { getAuthEmailRedirectUrl } from '../../../utils/auth/authRedirect';
import type { Session } from '@supabase/supabase-js';

type IngresoMode = 'magic' | 'password';

function mapPasswordSignInError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid_credentials') || m.includes('invalid grant')) {
    return 'Correo o contraseña incorrectos. Si tu cuenta solo usa enlace mágico (sin contraseña), usa «Enlace por correo».';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirma tu correo antes de entrar con contraseña, o usa el enlace mágico.';
  }
  return message;
}

/**
 * Enlace mágico (entrada o alta) o inicio de sesión con contraseña solo para cuentas que ya la tengan en Supabase.
 */
const IngresoPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<IngresoMode>('magic');
  const [authError, setAuthError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState<string | null>(null);
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [signingInPassword, setSigningInPassword] = useState(false);

  const supabase = getSupabaseAuthClient();
  const [sessionChecked, setSessionChecked] = useState(() => !supabase);

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'INITIAL_SESSION') {
        setSessionChecked(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleMagicLinkLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    if (!supabase) return;
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    if (!email) return;

    setSendingMagicLink(true);
    const redirectTo = getAuthEmailRedirectUrl();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
    setSendingMagicLink(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    setMagicLinkEmail(email);
    setMagicLinkSent(true);
  };

  const handlePasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    if (!supabase) return;
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;
    if (!email || !password) return;

    setSigningInPassword(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSigningInPassword(false);

    if (error) {
      setAuthError(mapPasswordSignInError(error.message));
      return;
    }
    // La sesión llega por onAuthStateChange → Navigate a /admin
  };

  if (session) {
    return <Navigate to="/admin" replace />;
  }

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex items-center justify-center">
        <span className="font-mono text-sm">Cargando...</span>
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-6 py-10">
        <p className="text-sm text-red-600">No hay cliente de Supabase configurado.</p>
        <Link to="/" className="mt-4 text-sm underline">Volver al inicio</Link>
      </div>
    );
  }

  if (magicLinkSent && magicLinkEmail) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <Link to="/" className="block mb-6 mx-auto w-48 md:w-56" aria-label="Mapeo Verde, inicio">
            <LogoMap className="w-full h-auto" />
          </Link>
          <h1 className="text-xl font-bold mb-4">Revisa tu correo</h1>
          <p className="text-sm text-gray-700 mb-2">
            Enviamos un enlace a <span className="font-mono break-all">{magicLinkEmail}</span>.
          </p>
          <p className="text-xs text-gray-600 mb-6">
            Al abrirlo entrarás en <span className="font-mono">/admin</span> para gestionar tus eventos. Revisa spam si no lo ves.
          </p>
          <button
            type="button"
            className="mb-3 w-full text-center border-2 border-black bg-white px-4 py-2 font-medium hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              setMagicLinkSent(false);
              setMagicLinkEmail(null);
              setAuthError(null);
            }}
          >
            Usar otro correo
          </button>
          <Link to="/" className="block text-center text-sm underline">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <Link to="/" className="block mb-6 mx-auto w-52 md:w-64" aria-label="Mapeo Verde, inicio">
          <LogoMap className="w-full h-auto" />
        </Link>
        <h1 className="text-2xl font-bold mb-3 text-center">Ingreso para organizaciones</h1>

        <div className="flex border-2 border-black mb-6" role="tablist" aria-label="Forma de ingreso">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'magic'}
            className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
              mode === 'magic'
                ? 'bg-[#7FB800] text-black'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => {
              setMode('magic');
              setAuthError(null);
            }}
          >
            Enlace por correo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'password'}
            className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-wider border-l-2 border-black cursor-pointer transition-colors ${
              mode === 'password'
                ? 'bg-[#7FB800] text-black'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => {
              setMode('password');
              setAuthError(null);
            }}
          >
            Correo y contraseña
          </button>
        </div>

        {mode === 'magic' ? (
          <>
            <p className="text-sm text-gray-800 mb-2 text-center leading-relaxed">
              Escribe el correo de tu organización y recibirás un enlace para entrar o crear cuenta (sin contraseña).
              Después podrás administrar tus eventos en <span className="font-mono text-sm">/admin</span>.
            </p>
            <p className="text-xs font-mono uppercase tracking-widest text-[#7FB800] mb-6 text-center">
              Recomendado para cuentas nuevas
            </p>
            <form onSubmit={handleMagicLinkLogin} className="space-y-4">
              <div>
                <label htmlFor="ingreso-email-magic" className="block text-sm font-medium mb-1">Correo</label>
                <input
                  id="ingreso-email-magic"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full border-2 border-black px-3 py-2 bg-white"
                  placeholder="tu@email.com"
                />
              </div>
              {authError && (
                <p className="text-sm text-red-600" role="alert">{authError}</p>
              )}
              <button
                type="submit"
                disabled={sendingMagicLink}
                className="w-full bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {sendingMagicLink ? 'Enviando enlace…' : 'Enviar enlace al correo'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-800 mb-2 text-center leading-relaxed">
              Solo si tu cuenta <strong>ya tiene contraseña</strong> en Mapeo Verde (por ejemplo la configuraste antes o usaste recuperación de acceso).
              No se crean cuentas nuevas desde aquí: para eso usa <strong>Enlace por correo</strong>.
            </p>
            <p className="text-xs text-gray-600 mb-6 text-center">
              Las cuentas solo con enlace mágico no tienen contraseña hasta que definas una en el flujo de recuperación de Supabase.
            </p>
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="ingreso-email-password" className="block text-sm font-medium mb-1">Correo</label>
                <input
                  id="ingreso-email-password"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full border-2 border-black px-3 py-2 bg-white"
                  placeholder="tu@email.com"
                />
              </div>
              <PasswordField
                id="ingreso-password"
                name="password"
                label="Contraseña"
                autoComplete="current-password"
                required
                minLength={6}
                placeholder="••••••••"
              />
              {authError && (
                <p className="text-sm text-red-600" role="alert">{authError}</p>
              )}
              <button
                type="submit"
                disabled={signingInPassword}
                className="w-full bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {signingInPassword ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </>
        )}
      </div>
      <Link to="/" className="mt-6 text-sm underline">Volver al inicio</Link>
    </div>
  );
};

export default IngresoPage;
