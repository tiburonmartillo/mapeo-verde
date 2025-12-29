#!/bin/bash

echo "🚀 Despliegue del Servidor Supabase"
echo "===================================="
echo ""

# Paso 1: Login
echo "📝 Paso 1: Iniciar sesión en Supabase"
echo "Este comando abrirá tu navegador para autenticarte."
echo ""
echo "Ejecuta: supabase login"
echo ""
read -p "Presiona Enter cuando hayas completado el login..."

# Paso 2: Vincular proyecto
echo ""
echo "📝 Paso 2: Vincular proyecto"
echo "Ejecutando: supabase link --project-ref jvwtihesgbzixitfwxaf"
supabase link --project-ref jvwtihesgbzixitfwxaf

# Paso 3: Desplegar función
echo ""
echo "📝 Paso 3: Desplegar función 'server'"
echo "Ejecutando: supabase functions deploy server --project-ref jvwtihesgbzixitfwxaf"
supabase functions deploy server --project-ref jvwtihesgbzixitfwxaf

# Paso 4: Configurar secret
echo ""
echo "📝 Paso 4: Configurar NOTION_API_KEY"
echo "⚠️  IMPORTANTE: Necesitas tu API Key de Notion"
read -p "Ingresa tu NOTION_API_KEY: " notion_key
if [ ! -z "$notion_key" ]; then
    echo "Configurando secret..."
    supabase secrets set NOTION_API_KEY="$notion_key" --project-ref jvwtihesgbzixitfwxaf
    echo "✅ Secret configurado"
else
    echo "⚠️  No se configuró el secret. Configúralo manualmente con:"
    echo "   supabase secrets set NOTION_API_KEY=tu-api-key --project-ref jvwtihesgbzixitfwxaf"
fi

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "🔍 Verifica que funcione:"
echo "   curl https://jvwtihesgbzixitfwxaf.supabase.co/functions/v1/make-server-183eaf28/health"
