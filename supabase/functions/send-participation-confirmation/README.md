# send-participation-confirmation

Envía un correo de confirmación al usuario cuando envía una propuesta desde el formulario de participación (evento o área verde). Usa [Resend](https://resend.com).

## Despliegue

1. Crea una API key en [Resend](https://resend.com/api-keys).
2. En el dashboard de Supabase: **Project → Edge Functions → send-participation-confirmation → Secrets**. Añade:
   - `RESEND_API_KEY`: tu API key de Resend.
   - (Opcional) `RESEND_FROM`: remitente, ej. `Mapeo Verde <participacion@tudominio.com>`. Por defecto usa `onboarding@resend.dev` (solo para pruebas; en producción verifica tu dominio en Resend).
3. Despliega la función:
   ```bash
   supabase functions deploy send-participation-confirmation
   ```

## Invocación

El frontend llama a la función tras guardar la propuesta en la base de datos. Body esperado:

- `to` (string): email del usuario.
- `type` (string): `"EVENT"` o `"GREEN_AREA"`.
- `title` (string, opcional): título del evento o nombre del área.
