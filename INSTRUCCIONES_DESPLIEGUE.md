# 📋 Instrucciones para Desplegar el Servidor Supabase

## Método 1: Desde el Dashboard de Supabase (Más Fácil)

### Paso 1: Crear la Edge Function

1. Ve a: https://supabase.com/dashboard/project/jvwtihesgbzixitfwxaf/functions
2. Click en **Create a new function**
3. Nombre: `server`
4. Click **Create function**

### Paso 2: Copiar el código

1. Abre el editor de la función
2. Copia el contenido completo de `supabase/functions/server/index.ts`
3. Pega en el editor
4. Guarda (Ctrl+S o Cmd+S)

### Paso 3: Agregar archivos de dependencias

Necesitas crear estos archivos en la función:

**db.ts:**
- Copia el contenido de `supabase/functions/server/db.ts`

**data.ts:**
- Copia el contenido de `supabase/functions/server/data.ts`

**kv_store.tsx:**
- Copia el contenido de `supabase/functions/server/kv_store.tsx`

### Paso 4: Configurar NOTION_API_KEY

1. Ve a: https://supabase.com/dashboard/project/jvwtihesgbzixitfwxaf/settings/functions
2. En la sección **Secrets**, click **Add new secret**
3. Name: `NOTION_API_KEY`
4. Value: Tu API Key de Notion (empieza con `secret_`)
5. Click **Save**

### Paso 5: Desplegar

1. En el editor de la función, click **Deploy**
2. Espera a que termine el despliegue

## Método 2: Usando CLI (Requiere autenticación manual)

Ejecuta estos comandos en tu terminal:

```bash
cd "/Users/oergano/Projects/Mapeo Verde"

# 1. Iniciar sesión (abrirá tu navegador)
supabase login

# 2. Vincular proyecto
supabase link --project-ref jvwtihesgbzixitfwxaf

# 3. Desplegar función
supabase functions deploy server --project-ref jvwtihesgbzixitfwxaf

# 4. Configurar secret
supabase secrets set NOTION_API_KEY=tu-api-key-de-notion --project-ref jvwtihesgbzixitfwxaf
```

## Verificación

Después del despliegue, verifica que funcione:

```bash
curl https://jvwtihesgbzixitfwxaf.supabase.co/functions/v1/make-server-183eaf28/health
```

Deberías recibir: `{"status":"ok"}`

## URL de la función

Una vez desplegada, la función estará disponible en:
`https://jvwtihesgbzixitfwxaf.supabase.co/functions/v1/make-server-183eaf28/`
