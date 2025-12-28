/**
 * Script de prueba para verificar la conexión a Notion
 * Ejecutar con: npx tsx src/services/testNotion.ts
 */

import { fetchNotionPages, fetchNotionPageContent } from './notion';

async function testNotionConnection() {
  console.log('🔍 Verificando configuración de Notion...\n');

  // Verificar variables de entorno
  const databaseId = import.meta.env.VITE_NOTION_DATABASE_ID;
  const apiKey = import.meta.env.VITE_NOTION_API_KEY;
  const proxyUrl = import.meta.env.VITE_NOTION_PROXY_URL;

  console.log('📋 Variables de entorno:');
  console.log(`  VITE_NOTION_DATABASE_ID: ${databaseId ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`  VITE_NOTION_API_KEY: ${apiKey ? '✅ Configurado' : '❌ No configurado'}`);
  console.log(`  VITE_NOTION_PROXY_URL: ${proxyUrl ? '✅ Configurado' : '❌ No configurado'}`);
  console.log('');

  if (!databaseId && !proxyUrl) {
    console.log('⚠️  No hay configuración de Notion. Usando datos estáticos como fallback.');
    return;
  }

  if (databaseId && !apiKey) {
    console.log('❌ Error: VITE_NOTION_DATABASE_ID está configurado pero falta VITE_NOTION_API_KEY');
    return;
  }

  try {
    console.log('🔄 Intentando obtener páginas de Notion...\n');
    const pages = await fetchNotionPages();

    if (pages.length === 0) {
      console.log('⚠️  No se encontraron páginas en la base de datos de Notion.');
      console.log('   Verifica que:');
      console.log('   1. La base de datos tenga páginas');
      console.log('   2. La integración tenga acceso a la base de datos');
      console.log('   3. Las propiedades estén correctamente nombradas (title, date, category)');
      return;
    }

    console.log(`✅ Se encontraron ${pages.length} página(s) en Notion:\n`);

    for (const page of pages) {
      console.log(`📄 ${page.title}`);
      console.log(`   ID: ${page.id}`);
      console.log(`   Fecha: ${page.date}`);
      console.log(`   Categoría: ${page.category}`);
      if (page.stats) console.log(`   Stats: ${page.stats}`);
      console.log(`   URL: ${page.url || 'N/A'}`);
      console.log('');

      // Probar obtener contenido completo
      if (page.id) {
        console.log(`   🔄 Obteniendo contenido completo...`);
        try {
          const pageData = await fetchNotionPageContent(page.id);
          if (pageData.content) {
            console.log(`   ✅ Contenido obtenido: ${pageData.content.length} caracteres`);
            console.log(`   📝 Preview (primeros 100 caracteres): ${pageData.content.substring(0, 100)}...`);
            if (pageData.images && pageData.images.length > 0) {
              console.log(`   🖼️  Imágenes encontradas: ${pageData.images.length}`);
            }
          } else {
            console.log(`   ⚠️  No se pudo obtener contenido (página vacía o sin bloques)`);
          }
        } catch (contentError: any) {
          console.log(`   ❌ Error obteniendo contenido: ${contentError.message}`);
        }
        console.log('');
      }
    }

    console.log('✅ Conexión a Notion verificada exitosamente!');
  } catch (error: any) {
    console.error('❌ Error al conectar con Notion:');
    console.error(`   ${error.message}`);
    console.error('');
    console.error('🔧 Posibles soluciones:');
    console.error('   1. Verifica que VITE_NOTION_API_KEY sea correcto');
    console.error('   2. Verifica que VITE_NOTION_DATABASE_ID sea correcto');
    console.error('   3. Asegúrate de que la integración tenga acceso a la base de datos');
    console.error('   4. Verifica que la base de datos tenga las propiedades requeridas');
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testNotionConnection();
}

export { testNotionConnection };

