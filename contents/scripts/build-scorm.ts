#!/usr/bin/env tsx
/**
 * Builds a SCORM package for one or all courses.
 *
 * For each course:
 *   1. Copies compiled assets (JS, CSS, fonts, shared images)
 *   2. Copies only that course's content folder
 *   3. Copies SCORM XSD schema files
 *   4. Generates imsmanifest.xml from course meta
 *   5. Patches index.html with the course title
 *   6. Creates a ZIP ready to upload to any LMS
 *
 * Output: dist-scorm/<course-dir>/ + dist-scorm/<course-dir>.zip
 *
 * Usage:
 *   pnpm build:scorm                        # build all courses (runs Vite first)
 *   pnpm build:scorm --course bloque-1      # build one course
 *   pnpm build:scorm --skip-build           # skip Vite build (reuse existing dist/)
 *
 * Requires: zip (macOS/Linux built-in)
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, cpSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { courseContentSchema } from '../src/schemas/content.schema.ts';

// ─── Args ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const courseIdx = args.indexOf('--course');
const courseArg: string | undefined =
  courseIdx >= 0 ? args[courseIdx + 1]
  : args.find((a) => a.startsWith('--course='))?.slice('--course='.length);
const skipBuild = args.includes('--skip-build');

// ─── Paths ───────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');
const CONTENTS = join(PUBLIC, 'contents');
const OUT = join(ROOT, 'dist-scorm');

const SCORM_XSD = ['imscp_rootv1p1p2.xsd', 'adlcp_rootv1p2.xsd', 'ims_xml.xsd', 'imsmd_rootv1p2p1.xsd'];

// ─── Build ───────────────────────────────────────────────────────────────────

if (!skipBuild) {
  console.log('→ Compilando aplicación...\n');
  execSync('pnpm run build', { stdio: 'inherit', cwd: ROOT });
  console.log('');
}

if (!existsSync(DIST)) {
  console.error('✗ dist/ no encontrado. Ejecuta pnpm run build primero.');
  process.exit(1);
}

if (!existsSync(CONTENTS)) {
  console.error(`✗ ${CONTENTS} no encontrado.`);
  process.exit(1);
}

// ─── Resolve course list ──────────────────────────────────────────────────────

const courseDirs: string[] = courseArg
  ? [`course-${courseArg}`]
  : readdirSync(CONTENTS, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith('course-'))
      .map((d) => d.name);

if (courseDirs.length === 0) {
  console.log('No se encontraron cursos en public/contents/');
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });

// ─── Package each course ──────────────────────────────────────────────────────

let packaged = 0;

for (const dir of courseDirs) {
  const courseId = dir.slice('course-'.length); // "bloque-1"
  const jsonPath = join(CONTENTS, dir, 'content.json');

  if (!existsSync(jsonPath)) {
    console.log(`⚠  ${dir}: sin content.json — omitido`);
    continue;
  }

  // Parse and validate
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  } catch (err) {
    console.log(`✗ ${dir}: JSON malformado — ${(err as Error).message}`);
    continue;
  }

  const result = courseContentSchema.safeParse(raw);
  if (!result.success) {
    console.log(`✗ ${dir}: schema inválido — ejecuta pnpm validate:content primero`);
    continue;
  }

  const { meta, config } = result.data;

  if (!meta) {
    console.log(`⚠  ${dir}: sin campo "meta" — añade meta.title e meta.identifier al content.json`);
    console.log(`   Usando valores por defecto: title="${dir}", identifier="${dir}"\n`);
  }

  const title       = meta?.title       ?? dir;
  const identifier  = meta?.identifier  ?? dir;
  const masteryScore = meta?.masteryScore ?? 100;
  const scormVersion = config.scormVersion;

  // ── Create output dir ──────────────────────────────────────────────────────
  const outDir = join(OUT, dir);
  if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  // ── 1. Compiled assets (JS, CSS, fonts) + shared images ───────────────────
  cpSync(join(DIST, 'assets'), join(outDir, 'assets'), { recursive: true });

  // ── 2. This course's content only ─────────────────────────────────────────
  const distCourseContents = join(DIST, 'contents', dir);
  const srcCourseContents  = join(CONTENTS, dir);
  const destCourseContents = join(outDir, 'contents', dir);

  // Prefer dist/ (already built) but fall back to public/ source
  const contentSrc = existsSync(distCourseContents) ? distCourseContents : srcCourseContents;
  cpSync(contentSrc, destCourseContents, { recursive: true });

  // ── 3. SCORM XSD schema files ──────────────────────────────────────────────
  for (const xsd of SCORM_XSD) {
    const src = join(PUBLIC, xsd);
    if (existsSync(src)) cpSync(src, join(outDir, xsd));
  }

  // ── 4. index.html — patch title, remove dev favicon ───────────────────────
  let html = readFileSync(join(DIST, 'index.html'), 'utf-8');
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<link rel="icon"[^>]*\/?>/, '');
  writeFileSync(join(outDir, 'index.html'), html);

  // ── 5. imsmanifest.xml ────────────────────────────────────────────────────
  const manifest = scormVersion === '2004'
    ? generateManifest2004({ identifier, title, masteryScore, courseId })
    : generateManifest12({ identifier, title, masteryScore, courseId });
  writeFileSync(join(outDir, 'imsmanifest.xml'), manifest);

  // ── 6. ZIP ────────────────────────────────────────────────────────────────
  const zipName = `${dir}.zip`;
  const zipPath = join(OUT, zipName);
  if (existsSync(zipPath)) rmSync(zipPath);

  try {
    execSync(`zip -r "${zipPath}" .`, { cwd: outDir, stdio: 'pipe' });
    console.log(`✓ ${dir} → dist-scorm/${zipName}  (SCORM ${scormVersion}, masteryscore ${masteryScore})`);
    packaged++;
  } catch (err) {
    console.log(`✗ ${dir}: error al crear ZIP — ${(err as Error).message}`);
    console.log('  Asegúrate de tener el comando "zip" disponible (macOS/Linux built-in).');
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('');
if (packaged > 0) {
  console.log(`✓ ${packaged} paquete${packaged !== 1 ? 's' : ''} SCORM en dist-scorm/`);
} else {
  console.log('✗ No se generó ningún paquete.');
  process.exit(1);
}

// ─── SCORM 1.2 manifest ───────────────────────────────────────────────────────

interface ManifestOpts {
  identifier: string;
  title: string;
  masteryScore: number;
  courseId: string;
}

function generateManifest12({ identifier, title, masteryScore, courseId }: ManifestOpts): string {
  const org = `org_${identifier}`;
  const sco = `sco_${identifier}`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(identifier)}" version="1"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="${org}">
    <organization identifier="${org}">
      <title>${escapeXml(title)}</title>
      <item identifier="item_1" identifierref="${sco}" isvisible="true">
        <title>${escapeXml(title)}</title>
        <adlcp:masteryscore>${masteryScore}</adlcp:masteryscore>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="${sco}" type="webcontent" adlcp:scormtype="sco"
      href="index.html?course=${courseId}">
      <file href="index.html" />
    </resource>
  </resources>
</manifest>
`;
}

// ─── SCORM 2004 manifest ──────────────────────────────────────────────────────

function generateManifest2004({ identifier, title, masteryScore, courseId }: ManifestOpts): string {
  const org = `org_${identifier}`;
  const sco = `sco_${identifier}`;
  const minMeasure = (masteryScore / 100).toFixed(2);
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(identifier)}"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3p2"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="${org}">
    <organization identifier="${org}">
      <title>${escapeXml(title)}</title>
      <item identifier="item_1" identifierref="${sco}">
        <title>${escapeXml(title)}</title>
        <imsss:sequencing>
          <imsss:objectives>
            <imsss:primaryObjective objectiveID="primary" satisfiedByMeasure="true">
              <imsss:minNormalizedMeasure>${minMeasure}</imsss:minNormalizedMeasure>
            </imsss:primaryObjective>
          </imsss:objectives>
        </imsss:sequencing>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="${sco}" type="webcontent" adlcp:scormType="sco"
      href="index.html?course=${courseId}">
      <file href="index.html" />
    </resource>
  </resources>
</manifest>
`;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
