#!/usr/bin/env tsx
/**
 * Validates all course content.json files:
 *  1. Schema — checks structure and field types (Zod)
 *  2. Assets — checks that every ./path referenced in the JSON exists in public/
 *
 * Usage:
 *   pnpm validate:content                   # validate all courses
 *   pnpm validate:content --course bloque-1 # validate one course
 *   pnpm validate:content --schema-only     # skip asset existence check
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { courseContentSchema } from '../src/schemas/content.schema.ts';

// ─── Args ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const courseIdx = args.indexOf('--course');
const courseArg: string | undefined =
  courseIdx >= 0 ? args[courseIdx + 1]
  : args.find((a) => a.startsWith('--course='))?.slice('--course='.length);
const schemaOnly = args.includes('--schema-only');

// ─── Paths ───────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public');
const CONTENTS = join(PUBLIC, 'contents');

if (!existsSync(CONTENTS)) {
  console.error(`✗ Directorio no encontrado: ${CONTENTS}`);
  process.exit(1);
}

// ─── Course directories ───────────────────────────────────────────────────────

const courseDirs: string[] = courseArg
  ? [`course-${courseArg}`]
  : readdirSync(CONTENTS, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('course-'))
      .map((d) => d.name);

if (courseDirs.length === 0) {
  console.log('No se encontraron cursos en public/contents/');
  process.exit(0);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPath(path: (string | number)[]): string {
  return path
    .map((seg, i) => (typeof seg === 'number' ? `[${seg}]` : i === 0 ? seg : `.${seg}`))
    .join('');
}

function formatIssues(issues: z.ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = formatPath(issue.path as (string | number)[]);
    return `    ${path ? path + ': ' : ''}${issue.message}`;
  });
}

/** Recursively collect all strings starting with './' — these are local asset paths. */
function extractAssetPaths(obj: unknown, found = new Set<string>()): Set<string> {
  if (typeof obj === 'string') {
    if (obj.startsWith('./') && !obj.startsWith('//')) found.add(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach((v) => extractAssetPaths(v, found));
  } else if (obj !== null && typeof obj === 'object') {
    Object.values(obj as Record<string, unknown>).forEach((v) => extractAssetPaths(v, found));
  }
  return found;
}

// ─── Validate ─────────────────────────────────────────────────────────────────

let totalErrors = 0;
let totalCourses = 0;

for (const dir of courseDirs) {
  const jsonPath = join(CONTENTS, dir, 'content.json');

  if (!existsSync(jsonPath)) {
    console.log(`⚠  ${dir}: content.json no encontrado`);
    continue;
  }

  totalCourses++;
  const courseErrors: string[] = [];

  // 1. Parse JSON
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  } catch (err) {
    console.log(`✗ ${dir}: JSON malformado — ${(err as Error).message}`);
    totalErrors++;
    continue;
  }

  // 2. Schema validation
  const result = courseContentSchema.safeParse(raw);
  if (!result.success) {
    for (const line of formatIssues(result.error.issues)) courseErrors.push(line);
  }

  // 3. Asset existence check
  if (!schemaOnly) {
    const paths = extractAssetPaths(raw);
    for (const assetPath of paths) {
      // './contents/course-x/images/y.jpg' → 'public/contents/course-x/images/y.jpg'
      const fullPath = join(PUBLIC, assetPath.slice(2));
      if (!existsSync(fullPath)) {
        courseErrors.push(`    [asset] ${assetPath}: archivo no encontrado`);
      }
    }
  }

  // Report
  if (courseErrors.length === 0) {
    const slideCount = result.success ? result.data.slides.length : '?';
    console.log(`✓ ${dir}: ${slideCount} diapositiva${slideCount !== 1 ? 's' : ''} válida${slideCount !== 1 ? 's' : ''}`);
  } else {
    console.log(`✗ ${dir}: ${courseErrors.length} error${courseErrors.length !== 1 ? 'es' : ''}`);
    courseErrors.forEach((line) => console.log(line));
    totalErrors += courseErrors.length;
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('');
if (totalErrors === 0) {
  console.log(`✓ ${totalCourses} curso${totalCourses !== 1 ? 's' : ''} validado${totalCourses !== 1 ? 's' : ''} sin errores`);
} else {
  console.log(`✗ ${totalErrors} error${totalErrors !== 1 ? 'es' : ''} en ${totalCourses} curso${totalCourses !== 1 ? 's' : ''}`);
  process.exit(1);
}
