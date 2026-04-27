import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ScormProvider } from '@studiolxd/react-scorm';
import App from './App.tsx';
import '@flaticon/flaticon-uicons/css/bold/rounded.css';
import '@flaticon/flaticon-uicons/css/thin/rounded.css';
import '@flaticon/flaticon-uicons/css/regular/rounded.css';
import './styles/main.scss';
import { courseContentSchema } from './schemas/content.schema';
import type { CourseContent } from './types';

// Solo letras, números, guiones y guiones bajos — previene path traversal
const COURSE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('course');

  if (!courseId) {
    renderError('No se ha especificado un curso. Usa ?course=<curso> en la URL.');
    return;
  }

  if (!COURSE_ID_PATTERN.test(courseId)) {
    renderError('El identificador de curso no es válido. Solo se permiten letras, números, guiones y guiones bajos.');
    return;
  }

  const url = `./contents/course-${courseId}/content.json`;

  let content: CourseContent;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const rawContent: unknown = await response.json();
    const parsed = courseContentSchema.safeParse(rawContent);
    if (!parsed.success) {
      const count = parsed.error.issues.length;
      console.error('Course validation errors:', parsed.error.issues);
      throw new Error(`Formato de contenido del curso inválido (${count} error${count !== 1 ? 'es' : ''})`);
    }
    content = parsed.data;
  } catch (err) {
    renderError(`No se pudo cargar el curso "${courseId}". Verifica que el ID sea correcto.`);
    console.error('Course load error:', err);
    return;
  }

  const slideRaw = params.get('slide');
  const slideParsed = slideRaw !== null ? parseInt(slideRaw, 10) : undefined;
  const initialSlide =
    slideParsed !== undefined
    && !Number.isNaN(slideParsed)
    && content.slides.some((s) => s.id === slideParsed)
      ? slideParsed
      : undefined;

  const scormVersion = content.config.scormVersion === '2004' ? '2004' : '1.2';

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ScormProvider
        version={scormVersion}
        options={{ noLmsBehavior: 'mock', debug: true }}
      >
        <App content={content} initialSlide={initialSlide} />
      </ScormProvider>
    </StrictMode>
  );
}

function renderError(message: string) {
  const root = document.getElementById('root')!;
  const div = document.createElement('div');
  div.className = 'app__loading';
  div.setAttribute('role', 'alert');
  div.textContent = message;
  root.innerHTML = '';
  root.appendChild(div);
}

bootstrap();
