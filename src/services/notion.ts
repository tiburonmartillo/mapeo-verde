export interface NotionPage {
  id: string;
  title: string;
  date: string;
  category: string;
  stats?: string;
  portada?: string; // URL de la imagen de portada
  content: string; // Markdown content
  images?: string[]; // Array de URLs de imágenes
  url?: string;
}

/**
 * Obtiene páginas de Notion desde una base de datos
 * Usa la API pública de Notion o un endpoint proxy
 */
export async function fetchNotionPages(databaseId?: string): Promise<NotionPage[]> {
  try {
    const notionDatabaseId = databaseId || import.meta.env.VITE_NOTION_DATABASE_ID;
    const isDevelopment = import.meta.env.DEV;
    const notionApiKey = import.meta.env.VITE_NOTION_API_KEY;
    
    
    if (!notionDatabaseId) {
      return [];
    }
    
    // En desarrollo, usar proxy de Vite
    if (isDevelopment) {
      if (notionApiKey) {
        return await fetchFromNotionAPI(notionDatabaseId, notionApiKey, '/api/notion');
      } else {
        return [];
      }
    } else {
      // En producción, intentar múltiples estrategias
      if (notionApiKey) {
        // Estrategia 1: Usar API key directamente (sin servidor)
        return await fetchFromNotionAPI(notionDatabaseId, notionApiKey);
      }
      
      // Estrategia 2: Usar servidor Supabase si está configurado
      let serverUrl = import.meta.env.VITE_SERVER_URL;
      if (!serverUrl) {
        try {
          const { projectId } = await import('../utils/supabase/info');
          if (projectId) {
            serverUrl = `https://${projectId}.supabase.co`;
          }
        } catch (e) {
          // Ignorar si no hay Supabase
        }
      }
      
      if (serverUrl) {
        return await fetchFromNotionAPI(notionDatabaseId, '', `${serverUrl}/make-server-183eaf28/notion`);
      }
      
      // Si no hay API key ni servidor, mostrar error claro
    }
    
    // Fallback: retornar array vacío
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Obtiene páginas directamente de la API de Notion
 * Usa proxy en desarrollo o endpoint del servidor en producción, o API directamente
 */
async function fetchFromNotionAPI(databaseId: string, apiKey: string, baseUrl?: string): Promise<NotionPage[]> {
  try {
    
    // Si hay baseUrl, usar proxy/endpoint del servidor
    const url = baseUrl 
      ? `${baseUrl}/v1/databases/${databaseId}/query`
      : `https://api.notion.com/v1/databases/${databaseId}/query`;
    
    const headers: Record<string, string> = {
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };
    
    // Agregar Authorization si hay API key
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    // Intentar hacer la consulta con filtro de "publicar"
    let response: Response;
    let usePublicarFilter = true;
    
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: {
          property: 'publicar',
          checkbox: {
            equals: true,
          },
        },
        sorts: [
          {
            property: 'date',
            direction: 'descending',
          },
        ],
      }),
    });
    
    // Si el error es 400 y menciona "publicar", intentar sin el filtro
    if (!response.ok && response.status === 400) {
      const errorText = await response.text();
      if (errorText.includes('publicar') || errorText.includes('property')) {
        usePublicarFilter = false;
        // Reintentar sin el filtro de publicar
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            sorts: [
              {
                property: 'date',
                direction: 'descending',
              },
            ],
          }),
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401) {
        throw new Error('API Key inválida o no autorizada. Verifica VITE_NOTION_API_KEY');
      } else if (response.status === 404) {
        throw new Error('Base de datos no encontrada. Verifica VITE_NOTION_DATABASE_ID y que la integración tenga acceso');
      } else if (response.status === 400) {
        throw new Error('Solicitud inválida. Verifica que la propiedad "date" exista en la base de datos');
      }
      
      throw new Error(`Notion API error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    // Transformar los resultados de Notion a nuestro formato
    // Nota: El contenido completo se obtendrá después usando fetchNotionPageContent
    return data.results
      .map((page: any) => {
        const properties = page.properties || {};
        
        // Extraer propiedad "publicar" (checkbox) - intentar diferentes variantes del nombre
        const publicarProperty = properties.publicar || properties.Publicar || properties.PUBLICAR;
        const publicar = publicarProperty?.checkbox === true;
        
        // Si no se usó el filtro en la API (porque la propiedad no existe), filtrar aquí
        if (!usePublicarFilter) {
          // Si no hay filtro en la API, filtrar aquí manualmente
          if (!publicar) {
            return null;
          }
        } else {
          // Si el filtro se usó en la API, todas las páginas deberían tener publicar=true
          // Pero verificamos por seguridad
          if (!publicar) {
          }
        }
        
        // Extraer título
      const titleProperty = properties.title || properties.Name || properties.name;
      const title = titleProperty?.title?.[0]?.plain_text || 'Sin título';
      
      // Extraer fecha
      const dateProperty = properties.date || properties.Date;
      const date = dateProperty?.date?.start || dateProperty?.created_time || new Date().toISOString().split('T')[0];
      
      // Extraer categoría
      const categoryProperty = properties.category || properties.Category;
      const category = categoryProperty?.select?.name || categoryProperty?.rich_text?.[0]?.plain_text || 'Evento';
      
      // Extraer stats
      const statsProperty = properties.stats || properties.Stats;
      const stats = statsProperty?.rich_text?.[0]?.plain_text || statsProperty?.title?.[0]?.plain_text;
      
      // Extraer portada (puede ser files, url, o rich_text con URL)
      const portadaProperty = properties.portada || properties.Portada || properties.portada;
      let portada: string | undefined;
      
      if (portadaProperty) {
        // Si es tipo files (array de archivos)
        if (portadaProperty.files && portadaProperty.files.length > 0) {
          const file = portadaProperty.files[0];
          portada = file.external?.url || file.file?.url;
        }
        // Si es tipo url
        else if (portadaProperty.url) {
          portada = portadaProperty.url;
        }
        // Si es tipo rich_text con URL
        else if (portadaProperty.rich_text && portadaProperty.rich_text.length > 0) {
          const text = portadaProperty.rich_text[0];
          if (text.href) {
            portada = text.href;
          } else if (text.plain_text && text.plain_text.match(/^https?:\/\//)) {
            portada = text.plain_text;
          }
        }
      }
      
      // El contenido completo se obtendrá después desde los bloques de la página
      return {
        id: page.id,
        title,
        date,
        category,
        stats,
        portada,
        content: '', // Se llenará después con el contenido de los bloques
        url: page.url,
      };
      })
      .filter((page: any) => page !== null); // Filtrar nulls
  } catch (error) {
    throw error;
  }
}

/**
 * Obtiene el contenido completo de una página de Notion (markdown) y las imágenes
 * Obtiene todos los bloques de la página recursivamente
 */
export async function fetchNotionPageContent(pageId: string, apiKey?: string): Promise<{ content: string; images: string[] }> {
  try {
    const isDevelopment = import.meta.env.DEV;
    const notionApiKey = apiKey || import.meta.env.VITE_NOTION_API_KEY;
    
    // Obtener todos los bloques de la página (recursivamente)
    const allBlocks: any[] = [];
    let startCursor: string | undefined = undefined;
    
    do {
      let url: string;
      const headers: Record<string, string> = {
        'Notion-Version': '2022-06-28',
      };
      
      if (isDevelopment && notionApiKey) {
        // En desarrollo, usar proxy de Vite
        url = `/api/notion/v1/blocks/${pageId}/children${startCursor ? `?start_cursor=${startCursor}` : ''}`;
        headers['Authorization'] = `Bearer ${notionApiKey}`;
      } else if (notionApiKey) {
        // En producción, usar API key directamente (con proxy si es necesario)
        // Nota: Esto expone la API key en el cliente, pero es funcional para APIs de solo lectura
        url = `https://api.notion.com/v1/blocks/${pageId}/children${startCursor ? `?start_cursor=${startCursor}` : ''}`;
        headers['Authorization'] = `Bearer ${notionApiKey}`;
        headers['Content-Type'] = 'application/json';
      } else {
        // Intentar usar servidor Supabase si está disponible
        let serverUrl = import.meta.env.VITE_SERVER_URL;
        if (!serverUrl && !isDevelopment) {
          try {
            const { projectId } = await import('../utils/supabase/info');
            if (projectId) {
              serverUrl = `https://${projectId}.supabase.co`;
            }
          } catch (e) {
            // Ignorar si no hay Supabase
          }
        }
        
        if (serverUrl) {
          url = `${serverUrl}/make-server-183eaf28/notion/blocks/${pageId}${startCursor ? `?start_cursor=${startCursor}` : ''}`;
        } else {
          throw new Error('No hay API key ni servidor configurado para obtener contenido de Notion');
        }
      }
      
      const response = await fetch(url, {
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Notion API error! status: ${response.status}`);
      }

      const data = await response.json();
      allBlocks.push(...data.results);
      
      // Si hay más páginas, continuar
      startCursor = data.next_cursor || undefined;
    } while (startCursor);
    
    
    // Función helper para obtener bloques hijos de un bloque
    const fetchBlockChildren = async (blockId: string): Promise<any[]> => {
      try {
        const isDevelopment = import.meta.env.DEV;
        const notionApiKey = apiKey || import.meta.env.VITE_NOTION_API_KEY;
        
        let url: string;
        const headers: Record<string, string> = {
          'Notion-Version': '2022-06-28',
        };
        
        if (isDevelopment && notionApiKey) {
          url = `/api/notion/v1/blocks/${blockId}/children`;
          headers['Authorization'] = `Bearer ${notionApiKey}`;
        } else if (notionApiKey) {
          // En producción, usar API key directamente
          url = `https://api.notion.com/v1/blocks/${blockId}/children`;
          headers['Authorization'] = `Bearer ${notionApiKey}`;
          headers['Content-Type'] = 'application/json';
        } else {
          // Intentar usar servidor Supabase si está disponible
          let blockServerUrl = import.meta.env.VITE_SERVER_URL;
          if (!blockServerUrl && !isDevelopment) {
            try {
              const { projectId } = await import('../utils/supabase/info');
              if (projectId) {
                blockServerUrl = `https://${projectId}.supabase.co`;
              }
            } catch (e) {
              // Ignorar si no hay Supabase
            }
          }
          
          if (!blockServerUrl) {
            return [];
          }
          url = `${blockServerUrl}/make-server-183eaf28/notion/blocks/${blockId}`;
        }
        
        const response = await fetch(url, { headers });
        if (!response.ok) return [];
        
        const data = await response.json();
        return data.results || [];
      } catch (error) {
        return [];
      }
    };
    
    // Convertir bloques de Notion a markdown y extraer imágenes
    const { markdown, images } = await convertNotionBlocksToMarkdown(allBlocks, fetchBlockChildren);
    return { content: markdown, images };
  } catch (error) {
    return { content: '', images: [] };
  }
}

/**
 * Convierte bloques de Notion a markdown y extrae imágenes
 * Maneja diferentes tipos de bloques y formateo de texto
 * @param blocks - Array de bloques de Notion
 * @param fetchChildren - Función opcional para obtener bloques hijos (para columnas)
 */
async function convertNotionBlocksToMarkdown(blocks: any[], fetchChildren?: (blockId: string) => Promise<any[]>): Promise<{ markdown: string; images: string[] }> {
  const images: string[] = [];
  
  // Función helper para convertir rich_text a markdown con formato
  const richTextToMarkdown = (richText: any[]): string => {
    if (!richText || richText.length === 0) return '';
    
    return richText.map((text: any) => {
      let result = text.plain_text || '';
      
      // Aplicar formato
      if (text.annotations) {
        const annotations = text.annotations;
        if (annotations.bold) result = `**${result}**`;
        if (annotations.italic) result = `*${result}*`;
        if (annotations.strikethrough) result = `~~${result}~~`;
        if (annotations.code) result = `\`${result}\``;
        if (annotations.underline) result = `<u>${result}</u>`;
      }
      
      // Manejar enlaces
      if (text.href) {
        result = `[${result}](${text.href})`;
      }
      
      return result;
    }).join('');
  };
  
  // Función recursiva para procesar bloques
  const processBlocks = async (blockList: any[]): Promise<string> => {
    const results = await Promise.all(blockList.map(async (block) => {
      const type = block.type;
      const content = block[type];
      
      if (!content) return '';
      
      switch (type) {
      case 'paragraph':
        const paragraphText = richTextToMarkdown(content.rich_text);
        return paragraphText ? paragraphText + '\n\n' : '\n';
        
      case 'heading_1':
        return '# ' + richTextToMarkdown(content.rich_text) + '\n\n';
        
      case 'heading_2':
        return '## ' + richTextToMarkdown(content.rich_text) + '\n\n';
        
      case 'heading_3':
        return '### ' + richTextToMarkdown(content.rich_text) + '\n\n';
        
      case 'bulleted_list_item':
        return '- ' + richTextToMarkdown(content.rich_text) + '\n';
        
      case 'numbered_list_item':
        return '1. ' + richTextToMarkdown(content.rich_text) + '\n';
        
      case 'to_do':
        const checked = content.checked ? 'x' : ' ';
        return `- [${checked}] ` + richTextToMarkdown(content.rich_text) + '\n';
        
      case 'toggle':
        return '### ' + richTextToMarkdown(content.rich_text) + '\n';
        
      case 'quote':
        return '> ' + richTextToMarkdown(content.rich_text) + '\n\n';
        
      case 'callout':
        const emoji = content.icon?.emoji || '💡';
        return `> ${emoji} **${richTextToMarkdown(content.rich_text)}**\n\n`;
        
      case 'code':
        const codeText = richTextToMarkdown(content.rich_text);
        const language = content.language || '';
        return '```' + language + '\n' + codeText + '\n```\n\n';
        
      case 'divider':
        return '---\n\n';
        
      case 'image':
        const imageUrl = content.external?.url || content.file?.url || '';
        if (imageUrl) {
          // Agregar imagen al array de imágenes
          images.push(imageUrl);
          const imageCaption = content.caption?.length > 0 
            ? richTextToMarkdown(content.caption) 
            : '';
          return `![${imageCaption}](${imageUrl})\n\n`;
        }
        return '';
        
      case 'video':
        const videoUrl = content.external?.url || content.file?.url || '';
        if (videoUrl) {
          // Detectar si es YouTube, Vimeo, o un video directo
          const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
          const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
          
          const youtubeMatch = videoUrl.match(youtubeRegex);
          const vimeoMatch = videoUrl.match(vimeoRegex);
          
          if (youtubeMatch) {
            const videoId = youtubeMatch[1];
            return `<div class="notion-video notion-video-youtube w-full"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>\n\n`;
          } else if (vimeoMatch) {
            const videoId = vimeoMatch[1];
            return `<div class="notion-video notion-video-vimeo w-full"><iframe src="https://player.vimeo.com/video/${videoId}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>\n\n`;
          } else {
            // Video directo (MP4, etc.)
            return `<div class="notion-video notion-video-direct w-full"><video controls><source src="${videoUrl}" type="video/mp4">Tu navegador no soporta el elemento video.</video></div>\n\n`;
          }
        }
        return '';
        
      case 'bookmark':
        const bookmarkUrl = content.url || '';
        const bookmarkCaption = content.caption?.length > 0 
          ? richTextToMarkdown(content.caption) 
          : bookmarkUrl;
        return bookmarkUrl ? `[${bookmarkCaption}](${bookmarkUrl})\n\n` : '';
        
      case 'table':
        // Las tablas requieren procesamiento especial
        return '[Tabla]\n\n';
        
      case 'column_list':
        // Procesar columnas: obtener todas las columnas y procesarlas
        if (fetchChildren && block.has_children) {
          const columnBlocks = await fetchChildren(block.id);
          const columnContents = await Promise.all(
            columnBlocks
              .filter((b: any) => b.type === 'column')
              .map(async (columnBlock: any) => {
                if (fetchChildren && columnBlock.has_children) {
                  const columnChildren = await fetchChildren(columnBlock.id);
                  const columnMarkdown = await processBlocks(columnChildren);
                  return columnMarkdown;
                }
                return '';
              })
          );
          // Convertir columnas a HTML con el contenido markdown dentro
          // El markdown se procesará cuando ReactMarkdown procese el HTML
          const columnsHtml = columnContents
            .filter((content: string) => content.trim())
            .map((content: string) => {
              // Escapar el contenido markdown dentro del HTML para que se procese correctamente
              return `<div class="notion-column">\n\n${content}\n\n</div>`;
            })
            .join('\n');
          return columnsHtml ? `<div class="notion-column-list">\n\n${columnsHtml}\n\n</div>\n\n` : '';
        }
        return '';
        
      case 'column':
        // Las columnas individuales se procesan dentro de column_list
        return '';
        
      default:
        // Para otros tipos, intentar extraer texto
        if (content.rich_text) {
          return richTextToMarkdown(content.rich_text) + '\n\n';
        }
        return '';
      }
    }));
    
    return results.join('');
  };
  
  const markdown = await processBlocks(blocks);
  
  return { markdown: markdown.trim(), images };
}

