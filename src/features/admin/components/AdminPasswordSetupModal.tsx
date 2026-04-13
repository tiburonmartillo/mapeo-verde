import React, { useState } from 'react';
import { PasswordField } from '../../../components/common/PasswordField';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';
import { META_ADMIN_PASSWORD_DONE, META_SKIP_ADMIN_PASSWORD } from '../../../utils/auth/adminPasswordSetup';
import {
  adminDisabled,
  adminLiftShadow,
  adminOutlinePressable,
  adminPressableFocus,
} from '../../../utils/adminButtonClasses';

type AdminPasswordSetupModalProps = {
  supabase: SupabaseClient;
  session: Session;
};

const MIN_LEN = 8;

/**
 * Primera visita al admin tras enlace mágico: pedir definir contraseña (opción de omitir).
 */
export function AdminPasswordSetupModal({ supabase, session }: AdminPasswordSetupModalProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LEN) {
      setError(`La contraseña debe tener al menos ${MIN_LEN} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: {
        ...session.user.user_metadata,
        [META_ADMIN_PASSWORD_DONE]: true,
      },
    });
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword('');
    setConfirm('');
  };

  const handleSkip = async () => {
    setError(null);
    setSkipping(true);
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...session.user.user_metadata,
        [META_SKIP_ADMIN_PASSWORD]: true,
      },
    });
    setSkipping(false);
    if (updateError) {
      setError(updateError.message);
    }
  };

  return (
    <div
      className="admin-password-setup-overlay fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-password-setup-title"
    >
      <div className="w-full max-w-md border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 id="admin-password-setup-title" className="text-xl font-bold mb-2">
          Define una contraseña para tu cuenta
        </h2>
        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
          Entraste con enlace mágico. Para proteger el acceso a la gestión de eventos, te recomendamos
          añadir una contraseña. Podrás usarla en <span className="font-mono text-xs">/ingreso</span>{' '}
          en «Correo y contraseña».
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            id="admin-setup-password"
            name="new_password"
            label="Nueva contraseña"
            autoComplete="new-password"
            required
            minLength={MIN_LEN}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(ev) => {
              setPassword(ev.target.value);
              setError(null);
            }}
          />
          <PasswordField
            id="admin-setup-password-confirm"
            name="confirm_password"
            label="Confirmar contraseña"
            autoComplete="new-password"
            required
            minLength={MIN_LEN}
            placeholder="Repite la contraseña"
            value={confirm}
            onChange={(ev) => {
              setConfirm(ev.target.value);
              setError(null);
            }}
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || skipping}
            className={`w-full bg-black text-white border-2 border-black px-4 py-2 font-medium hover:bg-[#ff7e67] hover:text-black cursor-pointer disabled:cursor-not-allowed ${adminPressableFocus} ${adminLiftShadow} ${adminDisabled}`}
          >
            {saving ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
        <button
          type="button"
          disabled={saving || skipping}
          className={`mt-3 w-full text-center text-sm text-gray-700 underline hover:text-black disabled:cursor-not-allowed py-2 rounded-sm ${adminOutlinePressable} ${adminDisabled}`}
          onClick={() => void handleSkip()}
        >
          {skipping ? 'Guardando preferencia…' : 'Seguir solo con enlace mágico por ahora'}
        </button>
      </div>
    </div>
  );
}
