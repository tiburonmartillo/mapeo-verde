import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogoMap } from '../../../components/common/LogoMap';
import { PasswordField } from '../../../components/common/PasswordField';
import { getSupabaseAuthClient } from '../../../lib/supabase/client';
import { getAuthEmailRedirectUrl } from '../../../utils/auth/authRedirect';
import { getOrCreateProfile } from '../../../lib/supabase/organizationProfileQueries';
import type { Session } from '@supabase/supabase-js';

function mapPasswordSignInError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid_credentials') || m.includes('invalid grant')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (m.includes('email not confirmed')) {
    return 'Confirma tu correo antes de entrar con contraseña, o usa el enlace mágico.';
  }
  return message;
}

const AdminRegisterPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

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

  useEffect(() => {
    if (!supabase || !session?.user) return;
    const pendingOrgName = localStorage.getItem('pendingOrgName');
    if (!pendingOrgName) return;
    localStorage.removeItem('pendingOrgName');
    setCreatingProfile(true);
    let cancelled = false;
    void (async () => {
      await getOrCreateProfile(supabase, session.user.id, pendingOrgName);
      if (!cancelled) setCreatingProfile(false);
    })();
    return () => { cancelled = true; };
  }, [supabase, session]);

  const handleMagicLinkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    if (!supabase) {
      setAuthError('Supabase no está configurado en este entorno.');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    if (!email) return;

    if (orgName.trim()) {
      localStorage.setItem('pendingOrgName', orgName.trim());
    }

    setSubmitting(true);
    const redirectTo = getAuthEmailRedirectUrl();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
    setSubmitting(false);

    if (otpError) {
      localStorage.removeItem('pendingOrgName');
      setAuthError(otpError.message);
      return;
    }

    setSentTo(email);
    setLinkSent(true);
  };

  const handlePasswordLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    if (!supabase) return;
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = formData.get('password') as string;
    if (!email || !password) return;

    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (error) {
      setAuthError(mapPasswordSignInError(error.message));
      return;
    }
  };

  if (creatingProfile) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex items-center justify-center">
        <span className="font-mono text-sm">Configurando tu perfil…</span>
      </div>
    );
  }

  if (session && !localStorage.getItem('pendingOrgName')) {
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

  if (linkSent && sentTo) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm border-2 border-black bg-white p-8">
          <Link to="/" className="block mb-6 mx-auto w-48 md:w-56" aria-label="Mapeo Verde, inicio">
            <LogoMap className="w-full h-auto" />
          </Link>
          <h1 className="text-xl font-bold mb-4">Revisa tu correo</h1>
          <p className="text-sm text-gray-700 mb-2">
            Enviamos un enlace a <span className="font-mono break-all">{sentTo}</span>.
          </p>
          <p className="text-xs text-gray-600 mb-6">
            Al abrirlo entrarás en <span className="font-mono">/admin</span> para gestionar tus eventos. Revisa spam si no lo ves.
          </p>
          <button
            type="button"
            className={`mb-3 w-full text-center border-2 border-black bg-white px-4 py-2 font-medium hover:bg-gray-100 cursor-pointer cursor-pointer motion-reduce:transition-none transition-[transform,box-shadow,background-color,border-color,opacity,color,filter] duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
            onClick={() => {
              setLinkSent(false);
              setSentTo(null);
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

  if (showLogin) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-md border-2 border-black bg-white p-8">
          <Link to="/" className="block mb-6 mx-auto w-52 md:w-64" aria-label="Mapeo Verde, inicio">
            <LogoMap className="w-full h-auto" />
          </Link>
          <h1 className="text-2xl font-bold mb-3 text-center">Entrar</h1>
          <p className="text-sm text-gray-800 mb-6 text-center leading-relaxed">
            Ingresa con tu correo y contraseña.
          </p>
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-1">Correo</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full border-2 border-black px-3 py-2 bg-white"
                placeholder="tu@email.com"
              />
            </div>
            <PasswordField
              id="login-password"
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
              disabled={submitting}
              className={`w-full bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-[#ff7e67] hover:text-black cursor-pointer disabled:cursor-not-allowed cursor-pointer motion-reduce:transition-none transition-[transform,box-shadow,background-color,border-color,opacity,color,filter] duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:active:scale-100`}
            >
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
          <div className="mt-8 mb-4">
            <button
              type="button"
              className={`block w-full text-center border-2 border-black bg-white px-4 py-2 font-medium text-black hover:bg-gray-100 cursor-pointer cursor-pointer motion-reduce:transition-none transition-[transform,box-shadow,background-color,border-color,opacity,color,filter] duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
              onClick={() => {
                setShowLogin(false);
                setAuthError(null);
              }}
            >
              Crear cuenta nueva
            </button>
          </div>
        </div>
        <Link to="/" className="mt-6 text-sm underline">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md border-2 border-black bg-white p-8">
        <Link to="/" className="block mb-6 mx-auto w-52 md:w-64" aria-label="Mapeo Verde, inicio">
          <LogoMap className="w-full h-auto" />
        </Link>
        <h1 className="text-2xl font-bold mb-3 text-center">Registro para organizaciones</h1>
        <p className="text-sm text-gray-800 mb-6 text-center leading-relaxed">
          Escribe el correo de tu organización y recibirás un enlace para entrar.
          Después podrás administrar tus eventos en el panel.
        </p>
        <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
          <div>
            <label htmlFor="org-name" className="block text-sm font-medium mb-1">
              Nombre de la organización *
            </label>
            <input
              id="org-name"
              name="orgName"
              type="text"
              required
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                setAuthError(null);
              }}
              className="w-full border-2 border-black px-3 py-2 bg-white"
              placeholder="Ej. Colectivo Ambiental"
              autoComplete="organization"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium mb-1">Correo</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setAuthError(null);
              }}
              className="w-full border-2 border-black px-3 py-2 bg-white"
              placeholder="tu@email.com"
            />
          </div>
          {authError && (
            <p className="text-sm text-red-600" role="alert">{authError}</p>
          )}
          <button
            type="submit"
            disabled={submitting || !orgName.trim() || !email.trim()}
            className={`w-full bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-[#ff7e67] hover:text-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:translate-y-0 disabled:hover:scale-100 disabled:active:scale-100 cursor-pointer motion-reduce:transition-none transition-[transform,box-shadow,background-color,border-color,opacity,color,filter] duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
          >
            {submitting ? 'Enviando enlace…' : 'Crear cuenta y recibir enlace'}
          </button>
        </form>
        <div className="mt-8 mb-4">
          <button
            type="button"
            className={`block w-full text-center border-2 border-black bg-white px-4 py-2 font-medium text-black hover:bg-gray-100 cursor-pointer cursor-pointer motion-reduce:transition-none transition-[transform,box-shadow,background-color,border-color,opacity,color,filter] duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
            onClick={() => {
              setShowLogin(true);
              setAuthError(null);
            }}
          >
            ¿Ya tienes cuenta? Entrar
          </button>
        </div>
      </div>
      <Link to="/" className="mt-6 text-sm underline">Volver al inicio</Link>
    </div>
  );
};

export default AdminRegisterPage;
