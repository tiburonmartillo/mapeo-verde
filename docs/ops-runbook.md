# Runbook Operativo — Mapeo Verde

## Backups y restore (Supabase)

1. **Activar PITR (Point-in-Time Recovery):**
   - Supabase Dashboard → Project → Database → Backups → Enable PITR (plan Pro+).
   - Retención recomendada: 7–14 días.
2. **Backup manual (SQL):**
   ```bash
   supabase db dump --linked > backup_$(date +%F).sql
   ```
3. **Probar restore (mensual):**
   - Crear proyecto temporal: `supabase projects create restore-test`.
   - Restaurar: `psql -h <host> -U postgres -d postgres -f backup_YYYY-MM-DD.sql`.
   - Verificar tablas críticas: `events`, `participation_submissions`, `newsletter_subscriptions`, `organization_profiles`.
   - Borrar proyecto de prueba.
4. **Documentar** fecha del último restore probado en este archivo (tabla abajo).

| Fecha restore probado | Responsable | Resultado |
|---|---|---|
| (pendiente) | — | — |

## MFA en cuentas admin

- **GitHub:** Settings → Password and authentication → Two-factor authentication (app TOTP, no SMS).
- **Vercel:** Account Settings → Security → Enable 2FA.
- **Supabase:** Account → Multi-factor authentication.
- **Correo del dominio (si aplica):** MFA en el proveedor.
- Revisar cada trimestre que siga activo.

## Alertas

### Vercel
- Project → Settings → Notifications → activar alertas de deployment failed y function errors.
- (Opcional) Integrar Sentry: `npm i @sentry/react @sentry/vite-plugin` y configurar DSN en env.

### Supabase
- Dashboard → Project → Reports → configurar alertas de CPU, conexiones, errores 5xx.
- (Opcional) Webhook a Slack/Teams para fallos de Edge Functions.

### Uptime
- Configurar monitor externo (UptimeRobot/BetterStack) sobre:
  - `https://www.mapeoverde.org`
  - `https://mapeo-verde.vercel.app/api/semarnat-proxy/health` (o endpoint ligero)
  - `https://<project>.supabase.co/functions/v1/server/health`

## Rate limiting

- Vercel Edge Middleware (`middleware.ts`): 30 req/min por IP en `/api/*`, 120 req/min general.
- Supabase Edge Functions (`_shared/rateLimit.ts`): límites por endpoint (subscribe 10/min, semarnat 20/min, compress 20/min, send-confirmation 10/min).
- Para enforcement global, migrar a Upstash/Redis cuando el tráfico lo requiera.

## Headers de seguridad

Configurados en `vercel.json` (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, CSP). Revisar CSP si se agregan nuevos dominios externos.

## Rotación de secretos

- `SEMARNAT_BEARER_TOKEN`: no rotatable por nosotros (pertenece a SEMARNAT). Si el proxy devuelve 401/403, capturar token fresco de la app de SEMARNAT y actualizar en Vercel + Supabase.
- `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: rotar cada 90 días o ante sospecha de filtración.
- Nunca commitear valores; solo nombres en `.env.example`.
