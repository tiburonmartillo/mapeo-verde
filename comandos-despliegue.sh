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

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "🔍 Verifica que funcione:"
echo "   curl https://jvwtihesgbzixitfwxaf.supabase.co/functions/v1/make-server-183eaf28/health"
