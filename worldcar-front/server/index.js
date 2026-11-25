import express from 'express';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import createPageRouter from './routes/index.js';

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(serverDirectory, '..');
const indexPath = resolve(projectDirectory, 'index.html');
const distDirectory = resolve(projectDirectory, 'dist');
const app = express();
const isProduction = process.env.NODE_ENV === 'production'
  || process.argv.includes('--production');

if (isProduction) {
  app.use(express.static(distDirectory));
  app.use(createPageRouter(() => readFile(resolve(distDirectory, 'index.html'), 'utf8')));
} else {
  const vite = await createViteServer({
    root: projectDirectory,
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(createPageRouter(async (url) => {
    const template = await readFile(indexPath, 'utf8');
    return vite.transformIndexHtml(url, template);
  }));
  app.use(vite.middlewares);
}

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Worldcar está disponible en http://localhost:${port}`);
});
