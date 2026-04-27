#!/usr/bin/env tsx
/**
 * Optimiza las imágenes JPEG/PNG de los cursos in-place.
 *
 * Para cada imagen:
 *   1. Redimensiona a un ancho máximo (default 1920px) sin ampliar.
 *   2. Re-codifica JPEG con mozjpeg (calidad 82 por defecto).
 *   3. Re-codifica PNG con compresión máxima.
 *   4. Sobrescribe el original solo si la versión optimizada pesa menos.
 *
 * Uso:
 *   pnpm optimize:images                          # todos los cursos + assets compartidos
 *   pnpm optimize:images -- --course bloque-1     # solo un curso
 *   pnpm optimize:images -- --max-width 1600      # cambia el ancho máximo
 *   pnpm optimize:images -- --quality 75          # cambia la calidad JPEG
 *   pnpm optimize:images -- --dry-run             # no escribe, solo reporta
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, extname, relative } from 'path';
import sharp from 'sharp';

// ─── Args ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getFlag(name: string): string | undefined {
  const idx = args.indexOf(`--${name}`);
  if (idx >= 0) return args[idx + 1];
  const prefix = `--${name}=`;
  return args.find((a) => a.startsWith(prefix))?.slice(prefix.length);
}

const courseArg = getFlag('course');
const maxWidthArg = getFlag('max-width');
const qualityArg = getFlag('quality');
const dryRun = args.includes('--dry-run');

const MAX_WIDTH = maxWidthArg ? parseInt(maxWidthArg, 10) : 1920;
const QUALITY = qualityArg ? parseInt(qualityArg, 10) : 82;

if (!Number.isFinite(MAX_WIDTH) || MAX_WIDTH < 100) {
  console.error('✗ --max-width inválido (mínimo 100)');
  process.exit(1);
}
if (!Number.isFinite(QUALITY) || QUALITY < 1 || QUALITY > 100) {
  console.error('✗ --quality debe estar entre 1 y 100');
  process.exit(1);
}

// ─── Paths ───────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public');
const CONTENTS = join(PUBLIC, 'contents');
const SHARED = join(PUBLIC, 'assets', 'images');

const RASTER_EXT = new Set(['.jpg', '.jpeg', '.png']);

// ─── Resolve target directories ───────────────────────────────────────────────

const targets: string[] = [];

if (courseArg) {
  const dir = join(CONTENTS, `course-${courseArg}`, 'images');
  if (!existsSync(dir)) {
    console.error(`✗ No existe ${relative(ROOT, dir)}`);
    process.exit(1);
  }
  targets.push(dir);
} else {
  if (existsSync(CONTENTS)) {
    for (const e of readdirSync(CONTENTS, { withFileTypes: true })) {
      if (e.isDirectory() && e.name.startsWith('course-')) {
        const imgs = join(CONTENTS, e.name, 'images');
        if (existsSync(imgs)) targets.push(imgs);
      }
    }
  }
  if (existsSync(SHARED)) targets.push(SHARED);
}

if (targets.length === 0) {
  console.log('No se encontraron carpetas de imágenes.');
  process.exit(0);
}

// ─── Walk ────────────────────────────────────────────────────────────────────

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile()) yield full;
  }
}

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ─── Optimize ────────────────────────────────────────────────────────────────

interface Result {
  file: string;
  before: number;
  after: number;
  saved: boolean;
  error?: string;
}

const results: Result[] = [];

console.log(
  `${dryRun ? '[dry-run] ' : ''}Optimizando ${targets.length} carpeta${
    targets.length !== 1 ? 's' : ''
  } (max-width: ${MAX_WIDTH}px, calidad JPEG: ${QUALITY})\n`,
);

for (const dir of targets) {
  for (const file of walk(dir)) {
    const ext = extname(file).toLowerCase();
    if (!RASTER_EXT.has(ext)) continue;

    const before = statSync(file).size;
    const rel = relative(ROOT, file);

    try {
      // Read into a Buffer first so sharp never holds a file handle on the
      // path we're about to overwrite (avoids EBUSY/UNKNOWN on Windows).
      const inputBuf = readFileSync(file);
      const pipeline = sharp(inputBuf, { failOn: 'none' })
        .rotate() // applies EXIF orientation and strips it
        .resize({ width: MAX_WIDTH, withoutEnlargement: true });

      const buf =
        ext === '.png'
          ? await pipeline.png({ compressionLevel: 9, effort: 10 }).toBuffer()
          : await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();

      const after = buf.length;

      if (after < before) {
        if (!dryRun) writeFileSync(file, buf);
        const pct = ((1 - after / before) * 100).toFixed(0);
        console.log(`  ✓ ${rel}  ${fmt(before)} → ${fmt(after)}  (-${pct}%)`);
        results.push({ file, before, after, saved: true });
      } else {
        results.push({ file, before, after, saved: false });
      }
    } catch (err) {
      const msg = (err as Error).message;
      console.log(`  ✗ ${rel}: ${msg}`);
      results.push({ file, before, after: before, saved: false, error: msg });
    }
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

const saved = results.filter((r) => r.saved);
const errors = results.filter((r) => r.error);
const totalBefore = results.reduce((s, r) => s + r.before, 0);
const totalAfter = results.reduce((s, r) => s + r.after, 0);
const totalSaved = totalBefore - totalAfter;
const totalPct = totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : '0';

console.log('');
console.log(
  `Total: ${results.length} ${results.length !== 1 ? 'imágenes' : 'imagen'}, ` +
    `${saved.length} optimizada${saved.length !== 1 ? 's' : ''}` +
    (errors.length ? `, ${errors.length} con error` : '') +
    '.',
);
console.log(`Antes:   ${fmt(totalBefore)}`);
console.log(`Después: ${fmt(totalAfter)}  (ahorro: ${fmt(totalSaved)}, -${totalPct}%)`);
if (dryRun) console.log('\n(dry-run: ningún archivo se ha modificado)');
