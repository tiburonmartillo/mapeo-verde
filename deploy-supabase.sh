#!/bin/bash

# Script para desplegar el servidor Supabase

echo "🚀 Desplegando servidor Supabase..."

# Verificar si Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado."
    echo "📦 Instalando Supabase CLI..."
    
    # Intentar instalar con brew (macOS)
    if command -v brew &> /dev/null; then
        brew install supabase/tap/supabase
    else
        echo "Por favor instala Supabase CLI manualmente:"
        echo "  npm install -g supabase"
        echo "  o"
        echo "  brew install supabase/tap/supabase"
        exit 1
    fi
fi

# Iniciar sesión (si no está logueado)
echo "🔐 Verificando sesión..."
supabase login

# Vincular proyecto
echo "🔗 Vinculando proyecto..."
supabase link --project-ref jvwtihesgbzixitfwxaf

# Desplegar función
echo "📤 Desplegando función 'server'..."
supabase functions deploy server

echo "✅ Despliegue completado!"
echo ""
echo "📝 No olvides configurar el secret NOTION_API_KEY:"
echo "   supabase secrets set NOTION_API_KEY=tu-api-key-de-notion"
