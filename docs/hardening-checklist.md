# Checklist de Hardening — Mapeo Verde

Stack: Vite/React (frontend) + Vercel (serverless) + Supabase (Postgres + Edge Functions Deno).

Leyenda de estado: ✅ aplicado · ⚠️ parcial · ❌ pendiente · N/A no aplica.

---

## 1. Críticos (bloquean producción si fallan)

| # | Control | Regla AGENTS.md | Cómo verificar / aplicar | Estado |
|---|---|---|---|---|
| 1 | Secretos fuera del repositorio (token SEMARNAT, service role, Resend) | Seguridad | `git grep` no debe encontrar valores reales; deben estar en Vercel env / Supabase secrets. | ✅ |
| 2 | Sin SQL concatenado; consultas parametrizadas/ORM | Seguridad | Revisar `src/lib/supabase/*` y Edge Functions; usar cliente Supabase, no string interpolation. | ✅ (cliente Supabase) |
| 3 | Contraseñas hasheadas (bcrypt/argon2/scrypt), nunca texto plano | Seguridad | No hay login propio en este repo; si se agrega, usar `bcrypt`/`argon2` en Edge Function. | N/A |
| 4 | Rate limit en login | Seguridad | N/A hoy; implementar si se agrega auth propia. | N/A |
| 5 | Validación de todo lo que entra (params, body, headers, archivos) | Seguridad | Revisar cada endpoint; `semarnat-proxy`, `subscribe`, `compress-image`, `server` validan. | ✅ parcial (auditar nuevos endpoints) |
| 6 | Timeouts en toda llamada externa | Llamadas externas | `fetch` debe llevar `AbortController`/`signal`. | ✅ (semarnat, Resend, compress, middleware) |
| 7 | Reintentos solo en errores transitorios (502/503/504, timeout), no 4xx | Llamadas externas | Implementar backoff acotado si se agrega retry. Hoy no hay retries. | ⚠️ (sin retries; aceptable si no se necesitan) |
| 8 | Idempotencia en pagos | Llamadas externas | No hay pagos en este repo. | N/A |
| 9 | Transacciones cuando hay >1 escritura | Base de datos | Revisar seeds/migraciones; `seed` hace múltiples upserts sin transacción. | ⚠️ (seed no crítico; auditar si se usa en prod) |
| 10 | Health check verifica la BD | Operación | `/functions/v1/server/health` consulta `events`. | ✅ |
| 11 | Respuesta 429 (con `Retry-After`) ante saturación, no 500 | Operación | Implementar rate limiting + 429 en endpoints públicos si aplica. | ❌ (no implementado) |
| 12 | Backups y restore probado periódicamente | Operación | Activar PITR en Supabase; documentar y probar restore 1x/mes. | ❌ (configurar) |

## 2. Altos (riesgo serio si se omiten)

| # | Control | Regla AGENTS.md | Cómo verificar / aplicar | Estado |
|---|---|---|---|---|
| 13 | Índices en columnas filtradas/ordenadas/unidas | Base de datos | Revisar migraciones SQL; `events`, `participation_submissions`, `newsletter_subscriptions`. | ⚠️ (auditar) |
| 14 | Eliminar N+1 (joins/eager loading/batch) | Base de datos | Revisar `src/lib/supabase/queries.ts` y loaders; evitar queries en bucles. | ⚠️ (auditar frontend) |
| 15 | Pool de conexiones (no una conexión por request) | Base de datos | Supabase client reutilizado en Edge Functions; frontend crea cliente singleton. | ✅ |
| 16 | Migraciones versionadas | Base de datos | Carpeta `supabase/migrations` con archivos numerados; no editar migraciones aplicadas. | ⚠️ (verificar) |
| 17 | No borrar columnas en el mismo deploy | Base de datos | Proceso de 2 deploys: deprecar → eliminar después. | 📋 (proceso) |
| 18 | Request id en todos los logs | Operación | `X-Request-Id` en respuestas; logs incluyen id. | ✅ (server) ⚠️ (otras functions) |
| 19 | CORS estricto (no `*` con credenciales) | Seguridad | `server/index.ts` ya condiciona credentials al origin. Revisar otras functions. | ⚠️ |
| 20 | Headers de seguridad (CSP, HSTS, X-Frame-Options, nosniff) | Seguridad | Configurar en `vercel.json` / middleware. Vercel pone algunos por defecto. | ⚠️ (auditar) |
| 21 | Gestión de dependencias (SCA) y lockfile | Seguridad | `npm audit`, Dependabot, `package-lock.json` commiteado. | ⚠️ |
| 22 | MFA en cuentas admin (Vercel, Supabase, GitHub) | Seguridad | Activar MFA en cada proveedor. | ❌ (verificar) |

## 3. Medios (mejoran resiliencia y observabilidad)

| # | Control | Regla AGENTS.md | Cómo verificar / aplicar | Estado |
|---|---|---|---|---|
| 23 | Request id propagado en todas las Edge Functions | Operación | Agregar `X-Request-Id` a compress-image, subscribe, semarnat-proxy, send-confirmation. | ⚠️ |
| 24 | Health checks en todas las functions públicas | Operación | `/health` en semarnat-proxy ya existe; agregar a las demás. | ⚠️ |
| 25 | Logs sin secretos ni PII | Operación | Revisar `console.log/error` en functions y frontend. | ⚠️ (auditar) |
| 26 | Timeouts en TLS manual (semarnat raw TLS) | Llamadas externas | `fetchSemarnatRawTls` no tiene timeout; envolver con `Promise.race`. | ❌ |
| 27 | Manejo explícito de 401/403 de proveedores externos | Llamadas externas | Ya implementado en semarnat-proxy (token inválido → 502 claro). | ✅ |
| 28 | Validación de tipos (no solo presencia) en inputs | Seguridad | Revisar `clave`, `numBitacora`, `pdfPath`, emails. | ✅ parcial |
| 29 | Límite de tamaño de payload | Seguridad | `participation` ya tiene guard de 50KB; extender a otros endpoints. | ⚠️ |
| 30 | Rotación de secretos comprometidos | Seguridad | Token SEMARNAT estaba en git; externalizado (no rotatable por ser de SEMARNAT). | ⚠️ |

## 4. Operativos (proceso y gobernanza)

| # | Control | Regla AGENTS.md | Cómo verificar / aplicar | Estado |
|---|---|---|---|---|
| 31 | Entender el dominio antes de proponer cambios | Criterio | Documentar flujos de negocio; preguntar si algo no está claro. | 📋 |
| 32 | Diseñar “on-call ready” (no proponer lo que no operarías) | Criterio | Revisar cada cambio con esta lente. | 📋 |
| 33 | Restore probado y documentado | Operación | Runbook de restore en `docs/`. | ❌ |
| 34 | Monitoreo/alertas (errores 5xx, latencia) | Operación | Configurar alertas en Vercel + Supabase (o Sentry). | ❌ |
| 35 | Revisión de código con formato AGENTS.md (críticos primero) | Formato de respuesta | Usar `AGENTS.md` en revisiones. | ✅ |

---

## Prioridad de implementación sugerida

1. **Ahora (esta semana):** #11 (rate limit/429), #12 (backups/PITR), #19 (CORS), #22 (MFA), #34 (alertas).
2. **Corto plazo:** #13–17 (BD), #18/#23 (request id), #20 (headers), #21 (SCA).
3. **Mediano plazo:** #26 (TLS timeout), #29 (payload limits), #33 (runbook restore).

## Referencias

- ISO/IEC 27001:2022, 27002:2022, 27017, 27018.
- CIS Benchmarks (Node.js, PostgreSQL, Docker).
- NIST SP 800-53 Rev.5, SP 800-123.
- OWASP ASVS 4.0, OWASP Top 10 (2021/2025).
- `AGENTS.md` (reglas de backend del proyecto).
