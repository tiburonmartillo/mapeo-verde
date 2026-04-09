/**
 * Copia el logo para correos (magic link, etc.) desde src/assets a public/.
 * Así Vite lo publica en la raíz del sitio: {SiteURL}/mapeov.jpg
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src/assets/mapeov.jpg');
const dest = path.join(root, 'public/mapeov.jpg');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Email logo: copiado src/assets/mapeov.jpg → public/mapeov.jpg');
} else {
  console.warn(
    'Email logo: no existe src/assets/mapeov.jpg; omite copia. Añade el archivo y vuelve a ejecutar el build.',
  );
}
