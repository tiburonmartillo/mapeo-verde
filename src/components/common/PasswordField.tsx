import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  helperText?: string;
  /** Modo controlado (opcional). Si defines value y onChange, el input es controlado. */
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Muestra borde rojo y texto bajo el campo (p. ej. validación). */
  errorMessage?: string | null;
  /**
   * Visibilidad del texto (opcional). Si pasas ambos, el padre controla si se muestran puntos o texto
   * (útil para sincronizar varios campos de contraseña en el mismo formulario).
   */
  showPassword?: boolean;
  onShowPasswordChange?: (show: boolean) => void;
};

/**
 * Contraseña con toggle dentro del borde del campo: ojo abierto (Eye) cuando solo hay puntos;
 * ojo tachado (EyeOff) cuando el texto es visible.
 */
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  required,
  minLength,
  placeholder,
  helperText,
  value,
  onChange,
  onBlur,
  errorMessage,
  showPassword,
  onShowPasswordChange,
}: PasswordFieldProps) {
  const [internalShow, setInternalShow] = useState(false);
  const visibilityControlled =
    showPassword !== undefined && onShowPasswordChange !== undefined;
  const visible = visibilityControlled ? showPassword : internalShow;
  const masked = !visible;
  const controlled = value !== undefined && onChange !== undefined;
  const hasError = Boolean(errorMessage);

  const toggleVisibility = () => {
    if (visibilityControlled) {
      onShowPasswordChange(!showPassword);
    } else {
      setInternalShow((v) => !v);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <div
        className={`flex w-full min-h-[42px] items-stretch border-2 bg-white focus-within:ring-1 focus-within:ring-offset-0 ${
          hasError
            ? 'border-red-600 focus-within:ring-red-600'
            : 'border-black focus-within:ring-black'
        }`}
      >
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          aria-invalid={hasError}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          {...(controlled ? { value: value ?? '', onChange, onBlur } : { onBlur })}
        />
        <button
          type="button"
          className="flex shrink-0 items-center justify-center border-l border-black/15 px-2.5 text-gray-600 hover:bg-black/[0.04] hover:text-black cursor-pointer"
          onClick={toggleVisibility}
          aria-label={masked ? 'Mostrar contraseña' : 'Ocultar contraseña'}
          aria-pressed={visible}
        >
          {masked ? (
            <Eye className="h-5 w-5" strokeWidth={2} aria-hidden />
          ) : (
            <EyeOff className="h-5 w-5" strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
      {errorMessage ? (
        <p className="text-sm text-red-600 mt-1" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {!errorMessage && helperText ? (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
