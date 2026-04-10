import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogoMap } from '../../../components/common/LogoMap';
import { getSupabaseAuthClient } from '../../../lib/supabase/client';
import { getAuthEmailRedirectUrl } from '../../../utils/auth/authRedirect';
import {
  adminDisabled,
  adminLiftShadow,
  adminOutlinePressable,
  adminPressableFocus,
} from '../../../utils/adminButtonClasses';
import type { Session } from '@supabase/supabase-js';

const AdminRegisterPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!supabase) {
      setError('Supabase no está configurado en este entorno.');
      return;
    }

    const trimmed = email.trim();
    if (!trimmed) return;

    setSubmitting(true);
    const redirectTo = getAuthEmailRedirectUrl();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
    setSubmitting(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    setSentTo(trimmed);
    setLinkSent(true);
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
        <div className="w-full max-w-[240px] mb-6">
          <LogoMap className="w-full h-auto" />
        </div>
        <p className="text-sm text-red-600">No hay cliente de Supabase configurado.</p>
        <Link to="/" className="mt-4 text-sm underline">Volver al inicio</Link>
      </div>
    );
  }

  if (linkSent && sentTo) {
    return (
      <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <Link to="/" className="block mb-6 mx-auto w-48 md:w-56" aria-label="Mapeo Verde, inicio">
            <LogoMap className="w-full h-auto" />
          </Link>
          <h1 className="text-xl font-bold mb-4">Revisa tu correo</h1>
          <p className="text-sm text-gray-700 mb-2">
            Enviamos un enlace a <span className="font-mono break-all">{sentTo}</span>.
          </p>
          <p className="text-xs text-gray-600 mb-6">
            Ábrelo para validar tu cuenta y entrar a administrar tus eventos. Si no ves el mensaje, revisa spam.
          </p>
          <button
            type="button"
            className={`mb-3 w-full text-center border-2 border-black bg-white px-4 py-2 font-medium hover:bg-gray-100 cursor-pointer ${adminOutlinePressable}`}
            onClick={() => {
              setLinkSent(false);
              setSentTo(null);
            }}
          >
            Usar otro correo
          </button>
          <Link
            to="/admin"
            className={`inline-block w-full text-center bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-[#ff7e67] hover:text-black ${adminPressableFocus} ${adminLiftShadow}`}
          >
            Ir a iniciar sesión
          </Link>
        </div>
        <Link to="/" className="mt-6 text-sm underline">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f0] flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <Link to="/" className="block mb-6 mx-auto w-52 md:w-64" aria-label="Mapeo Verde, inicio">
          <LogoMap className="w-full h-auto" />
        </Link>
        <h1 className="text-2xl font-bold mb-3 text-center">Súmate a la agenda</h1>
        <p className="text-sm text-gray-800 mb-2 text-center leading-relaxed">
          Registro solo con correo: te enviaremos un enlace para validar la cuenta. Luego podrás publicar y gestionar tus eventos.
        </p>
        <p className="text-xs font-mono uppercase tracking-widest text-[#7FB800] mb-6 text-center">
          Sin contraseña · enlace mágico
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                setError(null);
              }}
              className="w-full border-2 border-black px-3 py-2 bg-white"
              placeholder="tu@email.com"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-[#ff7e67] hover:text-black cursor-pointer disabled:cursor-not-allowed ${adminPressableFocus} ${adminLiftShadow} ${adminDisabled}`}
          >
            {submitting ? 'Enviando enlace…' : 'Enviar enlace de registro'}
          </button>
        </form>
        <p className="text-sm text-gray-600 mt-6 text-center">
          ¿Ya tienes cuenta?{' '}
          <Link to="/ingreso" className="font-medium underline">Iniciar sesión</Link>
        </p>
      </div>
      <Link to="/" className="mt-6 text-sm underline">Volver al inicio</Link>
    </div>
  );
};

export default AdminRegisterPage;
