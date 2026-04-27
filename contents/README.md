# SCORM E-Learning Course Builder

Aplicacion React + TypeScript para crear cursos e-learning con soporte SCORM. Cada curso se define en un archivo `content.json` dentro de `public/contents/course-{id}/`. El ID del curso se pasa por URL (`?course=nz1`) y la app carga el JSON correspondiente en tiempo de ejecucion. Opcionalmente se puede pasar `?course=nz1&slide=3` para navegar directamente a una slide concreta. La URL se actualiza automaticamente al navegar entre slides.

## Estructura de carpetas por curso

```
public/contents/course-{id}/
  content.json          ← definicion del curso (config, indice, slides)
  images/               ← imagenes especificas del curso
  videos/               ← videos especificos del curso
```

- **Assets del curso**: se guardan en `contents/course-{id}/images/` o `contents/course-{id}/videos/`. En el JSON se referencian como `./contents/course-{id}/images/foto.jpg`.
- **Assets compartidos**: imagenes comunes como `bg_carousel.jpg` e `icon_closing.png` estan en `public/assets/images/`. Se referencian como `./assets/images/bg_carousel.jpg`.

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `pnpm run dev` | Servidor de desarrollo |
| `pnpm run build` | TypeScript check + build de produccion → `dist/` |
| `pnpm validate:content` | Valida todos los cursos (schema Zod + existencia de assets) |
| `pnpm validate:content --course bloque-1` | Valida un curso concreto |
| `pnpm validate:content --schema-only` | Solo validacion de schema, sin comprobar archivos |
| `pnpm build:scorm` | Build Vite + empaqueta todos los cursos como SCORM → `dist-scorm/` |
| `pnpm build:scorm -- --course bloque-1` | Empaqueta solo un curso |
| `pnpm build:scorm -- --skip-build` | Reutiliza `dist/` existente, no lanza Vite |
| `pnpm optimize:images` | Optimiza imagenes JPEG/PNG de todos los cursos + assets compartidos in-place |
| `pnpm optimize:images -- --course bloque-1` | Optimiza solo las imagenes de un curso |
| `pnpm optimize:images -- --max-width 1600` | Cambia el ancho maximo (default `1920`, minimo `100`) |
| `pnpm optimize:images -- --quality 75` | Cambia la calidad JPEG (default `82`, rango 1-100) |
| `pnpm optimize:images -- --dry-run` | Reporta ahorros sin sobrescribir archivos |

## Empaquetado SCORM

`pnpm build:scorm` genera un ZIP independiente por curso en `dist-scorm/`. Cada ZIP incluye los assets compilados, solo las imagenes/videos de ese curso, el `imsmanifest.xml` generado desde los datos de `meta`, y el `index.html` con el titulo parcheado.

```
dist-scorm/
  course-bloque-1/          ← carpeta descomprimida (para inspeccionar)
    assets/                 ← JS + CSS + fuentes compilados
    contents/course-bloque-1/   ← imagenes y videos solo de este curso
    imsmanifest.xml         ← generado desde meta.title, meta.identifier, meta.masteryScore
    index.html              ← parcheado con el titulo del curso
    *.xsd                   ← archivos de schema SCORM
  course-bloque-1.zip       ← listo para subir al LMS
```

El manifest apunta a `index.html?course={id}` para que el LMS cargue el curso correcto.

## Optimizacion de imagenes

`pnpm optimize:images` recorre `public/contents/course-*/images/` y `public/assets/images/`, y para cada `.jpg`/`.jpeg`/`.png`:

1. Redimensiona a un ancho maximo (default `1920px`) sin ampliar imagenes mas pequenas.
2. Re-codifica los JPEG con **mozjpeg** (calidad `82` por defecto) y los PNG con compresion maxima (`compressionLevel: 9`, `effort: 10`).
3. Aplica la orientacion EXIF y la elimina del metadata.
4. **Sobrescribe el original solo si la version optimizada pesa menos** — si no hay ahorro, el archivo no se toca.

Al terminar imprime un resumen con los archivos modificados, el peso antes/despues y el ahorro total. Usar `--dry-run` para ver los ahorros estimados sin escribir nada y `--course <id>` para limitar el barrido a un curso concreto.

Requiere la dependencia `sharp` (ya incluida en `devDependencies`).

## Agentes Claude

El proyecto incluye dos subagentes de Claude Code para trabajo de contenido:

- **`slide-builder`** — crea y edita slides en un curso existente. Tras cada escritura ejecuta `pnpm validate:content` y corrige todos los errores antes de reportar el resultado.
- **`course-creator`** — crea un nuevo curso desde cero: pregunta por el titulo, ID, metadata SCORM y configuracion; genera la carpeta y el `content.json` base (portada + cierre).

Ambos agentes son solo de contenido y no pueden modificar codigo fuente.

## Estructura del JSON

```jsonc
{
  "meta": {
    "title": "Nombre del curso",           // titulo en el manifest SCORM y el <title> del HTML
    "identifier": "curso-bloque-1",        // identificador SCORM (letras, numeros, guiones, puntos)
    "masteryScore": 100,                   // porcentaje minimo para marcar como completado (0-100)
    "description": "Descripcion opcional"  // descripcion para el manifest
  },
  "config": {
    "lockIndex": false,       // bloquear navegacion por indice
    "scormVersion": "1.2"     // "1.2" o "2004"
  },
  "index": [ /* entradas del indice */ ],
  "slides": [ /* diapositivas */ ]
}
```

## Indice (`index`)

Cada entrada del indice representa un item en el panel lateral de navegacion.

```jsonc
{
  "title": "Nombre de la seccion",
  "numbered": true,       // true = numerado, false = sin numero (portadas)
  "level": 1,             // 1 = seccion principal, 2 = subseccion
  "slideId": 5            // id de la slide asociada, null si es solo titulo
}
```

- Las entradas con `level: 1` actuan como cabeceras de seccion.
- Las entradas con `level: 2` son hijas de la seccion anterior de nivel 1.
- `slideId` conecta la entrada con una slide concreta (por su `id`).
- El orden del array define el orden de aparicion en el sidebar.

## Diapositivas (`slides`)

Cada slide tiene esta estructura base:

```jsonc
{
  "id": 5,                    // identificador unico (entero)
  "layout": "image-text",     // tipo de layout
  "showTitle": true,          // mostrar titulo en la cabecera
  "showPagination": true,     // mostrar paginacion
  "data": { /* configuracion especifica del layout */ }
}
```

### Propiedades comunes

Varios layouts comparten estas propiedades en `data`:

| Propiedad | Tipo | Default | Descripcion |
|-----------|------|---------|-------------|
| `title` | `string` | — | Titulo de la slide |
| `text` | `string` | — | Contenido HTML de la slide |
| `titleAnimation` | `ElementAnimation` | — | Animacion del titulo |
| `textAnimation` | `ElementAnimation` | — | Animacion del texto (soporta stagger) |
| `contentAlign` | `"start" \| "middle" \| "end"` | `"middle"` | Alineacion vertical del contenido |
| `blocking` | `boolean` | `true` | Bloquea el avance hasta completar todas las interacciones. Poner `false` explicitamente para desactivar |

### Sistema de animaciones (`ElementAnimation`)

```jsonc
{
  "type": "fadeIn",      // "fadeIn" | "slideUp" | "slideDown" | "slideLeft" | "slideRight"
  "delay": 0.2,          // segundos antes de iniciar (default: 0)
  "duration": 0.6,       // duracion en segundos (default: 0.6)
  "stagger": 0.15        // solo textAnimation: delay entre cada p/li (opcional)
}
```

Cuando `stagger` esta presente en `textAnimation`, cada parrafo (`<p>`) y elemento de lista (`<li>`) se anima individualmente con delay incremental.

### Sistema de bloqueo

Los layouts interactivos bloquean la navegacion por defecto. El usuario debe interactuar con todos los elementos antes de poder avanzar. El boton "Siguiente" se deshabilita hasta completar todas las interacciones. Para desactivar el bloqueo hay que poner `"blocking": false` explicitamente. El progreso se persiste via SCORM.

Layouts que soportan bloqueo: `interactive-text` (siempre bloqueante, sin propiedad `blocking`), `interactive-image`, `popup`, `carousel`, `icon-tabs`, `accordion`, `tabs`.

---

## Layouts disponibles

### 1. `cover` — Portada del curso

Slide a pantalla completa con imagen o video de fondo.

```jsonc
{
  "layout": "cover",
  "data": {
    "unitTitle": "Unidad 1: <b>Fundamentos</b>",
    "backgroundImage": "https://...",
    "backgroundVideo": "https://...mp4"
  }
}
```

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `unitTitle` | `string` | Si | Titulo de la unidad (soporta HTML: `<b>`, `<strong>`) |
| `backgroundImage` | `string` | No | URL de imagen de fondo |
| `backgroundVideo` | `string` | No | URL de video (loop, muted, autoplay) |

---

### 2. `section-cover` — Portada de seccion

Imagen de fondo con fade-in y titulo centrado.

```jsonc
{
  "layout": "section-cover",
  "data": {
    "sectionTitle": "Modulo 1. Introduccion",
    "image": "https://...",
    "imagePosition": "left",
    "imageFadeDelay": 0.2,
    "imageFadeDuration": 1.2
  }
}
```

| Propiedad | Tipo | Requerido | Default | Descripcion |
|-----------|------|-----------|---------|-------------|
| `sectionTitle` | `string` | Si | — | Titulo de la seccion |
| `image` | `string` | Si | — | URL de la imagen de fondo |
| `imagePosition` | `"left" \| "right"` | No | `"left"` | Posicion de la imagen |
| `imageFadeDelay` | `number` | No | `0` | Delay del fade-in (segundos) |
| `imageFadeDuration` | `number` | No | `1` | Duracion del fade-in (segundos) |

---

### 3. `image-text` — Imagen con texto

Layout dividido en dos zonas: imagen y contenido de texto.

```jsonc
{
  "layout": "image-text",
  "data": {
    "imagePosition": "left",
    "image": "https://...",
    "imageSize": 50,
    "contentAlign": "middle",
    "showInlineTitle": true,
    "imageAnimation": { "type": "fadeIn", "delay": 0, "duration": 0.8 },
    "titleAnimation": { "type": "slideUp", "delay": 0.2 },
    "textAnimation": { "type": "fadeIn", "delay": 0.4, "stagger": 0.15 },
    "title": "Titulo de la seccion",
    "text": "<p>Contenido HTML...</p>"
  }
}
```

| Propiedad | Tipo | Requerido | Default | Descripcion |
|-----------|------|-----------|---------|-------------|
| `imagePosition` | `"top" \| "bottom" \| "left" \| "right"` | Si | — | Posicion de la imagen |
| `image` | `string` | Si | — | URL de la imagen |
| `imageSize` | `number` | No | `50` | Porcentaje del espacio para la imagen |
| `contentAlign` | `ContentAlign` | No | `"middle"` | Alineacion vertical |
| `showInlineTitle` | `boolean` | No | `true` | Mostrar titulo en el contenido |
| `imageAnimation` | `ElementAnimation` | No | — | Animacion de la imagen |
| `titleAnimation` | `ElementAnimation` | No | — | Animacion del titulo |
| `textAnimation` | `ElementAnimation` | No | — | Animacion del texto (soporta stagger) |
| `title` | `string` | Si | — | Titulo |
| `text` | `string` | Si | — | Contenido HTML |

---

### 4. `interactive-image` — Imagenes interactivas

Imagenes clicables que revelan contenido overlay. Bloqueante por defecto.

```jsonc
{
  "layout": "interactive-image",
  "data": {
    "imagePosition": "right",
    "imageSize": 60,
    "contentAlign": "middle",
    "showInlineTitle": true,
    "blocking": true,
    "helpTooltip": "Pulsa sobre cada imagen para ver su contenido",
    "titleAnimation": { "type": "slideUp", "delay": 0.2 },
    "textAnimation": { "type": "fadeIn", "delay": 0.4 },
    "title": "Titulo",
    "text": "<p>Descripcion...</p>",
    "images": [
      {
        "id": "img-1",
        "image": "https://...",
        "overlayContent": "<p><strong>Titulo</strong></p><p>Contenido...</p>",
        "hoverScale": 1.05,
        "imageAnimation": { "type": "fadeIn", "delay": 0.2 }
      }
    ]
  }
}
```

| Propiedad | Tipo | Requerido | Default | Descripcion |
|-----------|------|-----------|---------|-------------|
| `imagePosition` | `ImagePosition` | Si | — | Posicion de las imagenes |
| `imageSize` | `number` | No | `50` | Porcentaje del espacio |
| `contentAlign` | `ContentAlign` | No | `"middle"` | Alineacion vertical |
| `showInlineTitle` | `boolean` | No | `true` | Mostrar titulo en el contenido |
| `titleAnimation` | `ElementAnimation` | No | — | Animacion del titulo |
| `textAnimation` | `ElementAnimation` | No | — | Animacion del texto (soporta stagger) |
| `title` | `string` | Si | — | Titulo |
| `text` | `string` | Si | — | Contenido HTML |
| `blocking` | `boolean` | No | `true` | Bloquear hasta pulsar todas |
| `helpTooltip` | `string` | No | `"Pulsa sobre cada imagen..."` | Texto de ayuda |
| `images` | `InteractiveImageItem[]` | Si | — | Array de imagenes |

**`InteractiveImageItem`:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `id` | `string` | Si | Identificador unico |
| `image` | `string` | Si | URL de la imagen |
| `title` | `string` | No | Titulo visible sobre la imagen |
| `titleTheme` | `"dark" \| "light"` | No | Tema del titulo (`"dark"` para fondos claros) |
| `overlayContent` | `string` | Si | HTML del contenido revelado |
| `hoverScale` | `number` | No | Escala en hover |
| `imageAnimation` | `ElementAnimation` | No | Animacion individual |

---

### 5. `interactive-text` — Texto interactivo

Imagen clicable que revela contenido overlay. Siempre bloqueante: el usuario debe pulsar la imagen una vez para poder avanzar.

```jsonc
{
  "layout": "interactive-text",
  "data": {
    "imagePosition": "right",
    "image": "https://...",
    "imageSize": 50,
    "contentAlign": "middle",
    "showInlineTitle": true,
    "imageAnimation": { "type": "fadeIn", "delay": 0, "duration": 0.8 },
    "titleAnimation": { "type": "slideUp", "delay": 0.2 },
    "textAnimation": { "type": "fadeIn", "delay": 0.4 },
    "title": "Titulo de la seccion",
    "text": "<p>Contenido HTML...</p>",
    "overlayContent": "<p><strong>Contenido revelado</strong> al pulsar la imagen.</p>",
    "overlayAlignX": "left",
    "overlayAlignY": "bottom",
    "hoverScale": 0.95,
    "helpTooltip": "Pulsa sobre la imagen para ver el contenido"
  }
}
```

| Propiedad | Tipo | Requerido | Default | Descripcion |
|-----------|------|-----------|---------|-------------|
| `imagePosition` | `ImagePosition` | Si | — | Posicion de la imagen |
| `image` | `string` | Si | — | URL de la imagen |
| `imageSize` | `number` | No | `50` | Porcentaje del espacio para la imagen |
| `contentAlign` | `ContentAlign` | No | `"middle"` | Alineacion vertical |
| `showInlineTitle` | `boolean` | No | `true` | Mostrar titulo en el contenido |
| `imageAnimation` | `ElementAnimation` | No | — | Animacion de la imagen |
| `titleAnimation` | `ElementAnimation` | No | — | Animacion del titulo |
| `textAnimation` | `ElementAnimation` | No | — | Animacion del texto (soporta stagger) |
| `title` | `string` | Si | — | Titulo |
| `text` | `string` | Si | — | Contenido HTML |
| `overlayContent` | `string` | Si | — | HTML del contenido revelado al pulsar |
| `overlayAlignX` | `"left" \| "center" \| "right"` | No | `"left"` | Alineacion horizontal del overlay |
| `overlayAlignY` | `"top" \| "center" \| "bottom"` | No | `"bottom"` | Alineacion vertical del overlay |
| `hoverScale` | `number` | No | `0.95` | Escala de la imagen en hover |
| `helpTooltip` | `string` | No | `"Pulsa sobre la imagen..."` | Texto del tooltip de ayuda |

**Comportamiento:**
- Siempre bloqueante (registra 1 interaccion requerida). No tiene propiedad `blocking`.
- Al pulsar la imagen se revela el overlay con el contenido.
- Una vez abierto, el overlay permanece visible y no se puede cerrar.
- El tooltip de ayuda se muestra hasta que el usuario pulsa la imagen.

---

### 6. `popup` — Imagenes con modal

Imagenes clicables que abren un modal con contenido detallado. Bloqueante por defecto.

```jsonc
{
  "layout": "popup",
  "data": {
    "imagePosition": "right",
    "imageSize": 60,
    "contentAlign": "middle",
    "showInlineTitle": true,
    "blocking": true,
    "helpTooltip": "Pulsa sobre cada imagen para ver su contenido",
    "titleAnimation": { "type": "slideUp", "delay": 0.2 },
    "textAnimation": { "type": "fadeIn", "delay": 0.4 },
    "title": "Titulo",
    "text": "<p>Descripcion...</p>",
    "items": [
      {
        "id": "popup-1",
        "image": "https://...",
        "title": "Titulo visible",
        "titleTheme": "light",
        "popupTitle": "Titulo del modal",
        "popupContent": "<p>Contenido detallado del <strong>modal</strong>.</p>",
        "hoverScale": 0.95,
        "imageAnimation": { "type": "fadeIn", "delay": 0.2 }
      }
    ]
  }
}
```

| Propiedad | Tipo | Requerido | Default | Descripcion |
|-----------|------|-----------|---------|-------------|
| `imagePosition` | `ImagePosition` | Si | — | Posicion de las imagenes |
| `imageSize` | `number` | No | `50` | Porcentaje del espacio |
| `contentAlign` | `ContentAlign` | No | `"middle"` | Alineacion vertical |
| `showInlineTitle` | `boolean` | No | `true` | Mostrar titulo en el contenido |
| `titleAnimation` | `ElementAnimation` | No | — | Animacion del titulo |
| `textAnimation` | `ElementAnimation` | No | — | Animacion del texto (soporta stagger) |
| `title` | `string` | Si | — | Titulo |
| `text` | `string` | Si | — | Contenido HTML |
| `blocking` | `boolean` | No | `true` | Bloquear hasta pulsar todas |
| `helpTooltip` | `string` | No | `"Pulsa sobre cada imagen..."` | Texto de ayuda |
| `items` | `PopupItem[]` | Si | — | Array de items |

**`PopupItem`:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `id` | `string` | Si | Identificador unico |
| `image` | `string` | Si | URL de la imagen |
| `title` | `string` | No | Titulo visible sobre la imagen |
| `titleTheme` | `"dark" \| "light"` | No | Tema del titulo |
| `popupTitle` | `string` | No | Titulo dentro del modal |
| `popupContent` | `string` | Si | HTML del contenido del modal |
| `hoverScale` | `number` | No | Escala en hover |
| `imageAnimation` | `ElementAnimation` | No | Animacion individual |

**Comportamiento:**
- Similar a `interactive-image` pero abre un **dialogo modal** en lugar de overlay inline.
- El modal tiene boton de cerrar y se cierra al pulsar el backdrop.
- Cada item se marca como completado al abrirlo.

---

### 7. `carousel` — Carrusel

Carrusel de slides con navegacion por flechas y puntos. Dos modos de renderizado: **estandar** (carrusel + panel de contenido como hermanos) y **bordered** (carrusel dentro del area de contenido, con borde y puntos debajo).

```jsonc
{
  "layout": "carousel",
  "data": {
    "imagePosition": "top",
    "imageSize": 65,
    "contentAlign": "middle",
    "showInlineTitle": true,
    "titleAnimation": { "type": "fadeIn", "delay": 0, "duration": 0.5 },
    "textAnimation": { "type": "slideUp", "delay": 0.2, "duration": 0.4 },
    "title": "Fundamentos del diseno",
    "text": "<p>Los <strong>principios basicos</strong> del diseno centrado en el usuario.</p>",
    "bordered": true,
    "numbered": true,
    "blocking": true,
    "helpTooltip": "Navega por todas las slides del carrusel",
    "backgroundImage": "/assets/images/bg_carousel.jpg",
    "autoPlay": false,
    "items": [
      {
        "title": "Visibilidad del estado",
        "text": "<p>El sistema debe mantener <strong>informados a los usuarios</strong>.</p>"
      }
    ]
  }
}
```

| Propiedad | Tipo | Requerido | Default | Descripcion |
|-----------|------|-----------|---------|-------------|
| `imagePosition` | `ImagePosition` | Si | — | Posicion del carrusel respecto al contenido |
| `imageSize` | `number` | No | `50` | Porcentaje para el carrusel |
| `contentAlign` | `ContentAlign` | No | `"middle"` | Alineacion vertical del contenido |
| `showInlineTitle` | `boolean` | No | `true` | Mostrar titulo en el contenido |
| `titleAnimation` | `ElementAnimation` | No | — | Animacion del titulo |
| `textAnimation` | `ElementAnimation` | No | — | Animacion del texto (soporta stagger) |
| `title` | `string` | No | — | Titulo (si hay, muestra panel de contenido) |
| `text` | `string` | No | — | Descripcion |
| `bordered` | `boolean` | No | `false` | Variante bordered: carrusel dentro del contenido con borde |
| `numbered` | `boolean` | No | `false` | Mostrar numeros padded (01, 02...) en cada slide |
| `backgroundImage` | `string` | No | — | Imagen de fondo del area del carrusel (o del contenido en bordered) |
| `autoPlay` | `boolean` | No | `false` | Avance automatico |
| `autoPlayInterval` | `number` | No | `5000` | Intervalo en ms |
| `blocking` | `boolean` | No | `true` | Bloquear hasta ver todas las slides |
| `helpTooltip` | `string` | No | `"Pulsa las flechas para ver todas las diapositivas"` | Texto de ayuda |
| `itemsAlignX` | `"left" \| "center" \| "right"` | No | — | Alineacion horizontal del contenido de cada slide |
| `itemsAlignY` | `"start" \| "middle" \| "end"` | No | — | Alineacion vertical del contenido de cada slide |
| `items` | `CarouselItem[]` | Si | — | Slides del carrusel |

**`CarouselItem`:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `image` | `string` | No | URL de imagen (si hay, texto se superpone con overlay oscuro) |
| `title` | `string` | No | Titulo del slide |
| `text` | `string` | No | Contenido HTML del slide |

**Modos de renderizado:**
- **Estandar**: el carrusel y el panel de texto son hermanos. `imagePosition` controla la disposicion.
- **Bordered** (`bordered: true`): el carrusel se incrusta dentro del panel de contenido, con un borde de color primary y los puntos debajo.
- **Full**: si no hay `title` ni `text` en data, el carrusel ocupa el 100%.
- **Numbered** (`numbered: true`): muestra un numero grande semitransparente (01, 02...) en cada slide.

---

### 8. `icon-tabs` — Iconos interactivos

Iconos clicables que revelan contenido. Tres modos: estandar horizontal, estandar vertical e inline. Bloqueante por defecto.

```jsonc
{
  "layout": "icon-tabs",
  "data": {
    "title": "Pilares de la estrategia",
    "text": "<p>Pulsa sobre cada icono...</p>",
    "contentAlign": "start",
    "titleAnimation": { "type": "slideUp", "delay": 0.2 },
    "textAnimation": { "type": "fadeIn", "delay": 0.4 },
    "iconDirection": "horizontal",
    "iconStyle": "filled",
    "iconJustify": "center",
    "inline": false,
    "closable": true,
    "exclusive": true,
    "blocking": true,
    "items": [
      {
        "id": "item-1",
        "icon": "fi fi-br-bullseye-arrow",
        "title": "Vision y liderazgo",
        "text": "<p>El primer paso...</p>"
      },
      {
        "id": "item-2",
        "image": "https://...?w=100",
        "title": "Otro item",
        "text": "<p>Contenido...</p>"
      }
    ]
  }
}
```

| Propiedad | Tipo | Requerido | Default | Descripcion |
|-----------|------|-----------|---------|-------------|
| `title` | `string` | No | — | Titulo de la cabecera |
| `text` | `string` | No | — | Descripcion de la cabecera (HTML) |
| `contentAlign` | `ContentAlign` | No | `"start"` | Alineacion vertical de la cabecera |
| `titleAnimation` | `ElementAnimation` | No | — | Animacion del titulo |
| `textAnimation` | `ElementAnimation` | No | — | Animacion del texto (soporta stagger) |
| `iconDirection` | `"horizontal" \| "vertical"` | Si | — | Disposicion de los iconos |
| `iconStyle` | `"filled" \| "outlined"` | No | `"outlined"` | Estilo: circulo solido o sin fondo |
| `iconJustify` | `"center" \| "space-around" \| "space-between" \| "space-evenly" \| "flex-start" \| "flex-end"` | No | — | CSS justify-content para los iconos |
| `inline` | `boolean` | No | `false` | Modo inline: icono y contenido en la misma fila |
| `closable` | `boolean` | No | `true` | Permite cerrar items abiertos |
| `exclusive` | `boolean` | No | `true` | Solo uno abierto a la vez |
| `blocking` | `boolean` | No | `true` | Bloquear hasta pulsar todos |
| `helpTooltip` | `string` | No | `"Pulsa sobre cada icono..."` | Texto de ayuda |
| `items` | `IconTabItem[]` | Si | — | Array de items |

**`IconTabItem`:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `id` | `string` | Si | Identificador unico |
| `icon` | `string` | No | Clase CSS del icono (ej: `"fi fi-br-rocket"`) |
| `image` | `string` | No | URL de imagen (si no hay icon) |
| `title` | `string` | No | Titulo revelado |
| `text` | `string` | No | Contenido HTML revelado |

**Modos de funcionamiento:**
- **Estandar horizontal**: iconos en fila arriba, contenido revelado debajo.
- **Estandar vertical**: iconos en columna a la izquierda, contenido a la derecha.
- **Inline** (`inline: true`): cada item es una fila con icono + contenido al lado.
- **Exclusive** (`exclusive: true`): solo un item abierto a la vez.
- **Multi-abierto** (`exclusive: false`): varios items abiertos simultaneamente.
- **Closable** (`closable: true`): pulsar un item abierto lo cierra.
- **No closable** (`closable: false`): una vez abierto no se cierra.

---

### 9. `accordion` — Acordeon

Lista de items colapsables con cabecera clicable y animacion de expansion. Bloqueante por defecto.

```jsonc
{
  "layout": "accordion",
  "data": {
    "title": "Principios de gestion del tiempo",
    "text": "<p>Descubre las tecnicas...</p>",
    "contentAlign": "start",
    "titleAnimation": { "type": "slideUp", "delay": 0.2 },
    "textAnimation": { "type": "fadeIn", "delay": 0.4 },
    "exclusive": true,
    "closable": true,
    "blocking": true,
    "items": [
      {
        "id": "item-1",
        "icon": "fi fi-br-grid",
        "title": "Matriz de Eisenhower",
        "text": "<p>Clasifica tareas en cuatro cuadrantes...</p>"
      }
    ]
  }
}
```

| Propiedad | Tipo | Requerido | Default | Descripcion |
|-----------|------|-----------|---------|-------------|
| `title` | `string` | No | — | Titulo de la cabecera |
| `text` | `string` | No | — | Descripcion de la cabecera (HTML) |
| `contentAlign` | `ContentAlign` | No | `"start"` | Alineacion vertical de la cabecera |
| `titleAnimation` | `ElementAnimation` | No | — | Animacion del titulo |
| `textAnimation` | `ElementAnimation` | No | — | Animacion del texto (soporta stagger) |
| `closable` | `boolean` | No | `true` | Permite cerrar items abiertos |
| `exclusive` | `boolean` | No | `true` | Solo uno abierto a la vez |
| `blocking` | `boolean` | No | `true` | Bloquear hasta abrir todos |
| `helpTooltip` | `string` | No | `"Pulsa sobre cada elemento..."` | Texto de ayuda |
| `items` | `AccordionItem[]` | Si | — | Array de items |

**`AccordionItem`:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `id` | `string` | Si | Identificador unico |
| `title` | `string` | Si | Texto de la cabecera |
| `icon` | `string` | No | Clase CSS del icono en la cabecera |
| `text` | `string` | Si | Contenido HTML revelado |

**Comportamiento visual:**
- Cada item tiene cabecera con icono (opcional), titulo y flecha (chevron).
- El chevron rota 180 grados al abrir.
- El contenido se expande con animacion de `max-height`.
- Misma logica de exclusive/closable que icon-tabs.

---

### 10. `tabs` — Pestanas

Barra de pestanas horizontales con panel de contenido debajo. Bloqueante por defecto.

```jsonc
{
  "layout": "tabs",
  "data": {
    "title": "Canales de comunicacion",
    "text": "<p>Elige el canal adecuado...</p>",
    "contentAlign": "start",
    "titleAnimation": { "type": "slideUp", "delay": 0.2 },
    "textAnimation": { "type": "fadeIn", "delay": 0.4 },
    "blocking": true,
    "items": [
      {
        "id": "tab-1",
        "label": "Email",
        "icon": "fi fi-br-envelope",
        "title": "Correo electronico",
        "text": "<p>El email es ideal para comunicaciones formales...</p>"
      }
    ]
  }
}
```

| Propiedad | Tipo | Requerido | Default | Descripcion |
|-----------|------|-----------|---------|-------------|
| `title` | `string` | No | — | Titulo de la cabecera |
| `text` | `string` | No | — | Descripcion de la cabecera (HTML) |
| `contentAlign` | `ContentAlign` | No | `"start"` | Alineacion vertical de la cabecera |
| `titleAnimation` | `ElementAnimation` | No | — | Animacion del titulo |
| `textAnimation` | `ElementAnimation` | No | — | Animacion del texto (soporta stagger) |
| `blocking` | `boolean` | No | `true` | Bloquear hasta visitar todas las pestanas |
| `helpTooltip` | `string` | No | `"Pulsa sobre cada pestana..."` | Texto de ayuda |
| `items` | `TabItem[]` | Si | — | Array de pestanas |

**`TabItem`:**

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `id` | `string` | Si | Identificador unico |
| `label` | `string` | Si | Texto visible en la pestana |
| `icon` | `string` | No | Clase CSS del icono en la pestana |
| `title` | `string` | No | Titulo dentro del panel |
| `text` | `string` | Si | Contenido HTML del panel |

**Comportamiento:**
- Siempre exclusivo: solo una pestana activa.
- La primera pestana se abre por defecto al cargar y se marca como completada.
- La pestana activa tiene borde inferior de color primary.
- El panel de contenido se anima con fadeIn al cambiar.
- Accesibilidad: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`.

---

### 11. `closing` — Cierre del curso

Slide de cierre con mensaje de felicitacion. Soporta imagen o video de fondo.

```jsonc
{
  "layout": "closing",
  "data": {
    "backgroundImage": "https://...",
    "backgroundVideo": "https://...mp4"
  }
}
```

| Propiedad | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `backgroundImage` | `string` | No | URL de imagen de fondo |
| `backgroundVideo` | `string` | No | URL de video (loop, muted, autoplay) |

**Comportamiento:**
- Muestra un mensaje fijo: "Enhorabuena! Has finalizado este contenido."
- Incluye un icono decorativo (`/assets/images/icon_closing.png`).
- No tiene bloqueo ni contenido configurable.

---

## Iconos

El proyecto usa **Flaticon UIcons** en tres variantes:

| Variante | Prefijo | Ejemplo |
|----------|---------|---------|
| Bold Rounded | `fi fi-br-` | `fi fi-br-rocket` |
| Thin Rounded | `fi fi-tr-` | `fi fi-tr-angle-left` |
| Regular Rounded | `fi fi-rr-` | `fi fi-rr-check` |

Ejemplos: `fi fi-br-check`, `fi fi-br-clock`, `fi fi-br-calendar`, `fi fi-br-target`, `fi fi-br-grid`, `fi fi-br-rocket`, `fi fi-br-envelope`, `fi fi-br-comment-alt`, `fi fi-br-video-camera-alt`, `fi fi-br-users`, `fi fi-br-graduation-cap`, `fi fi-br-bullseye-arrow`, `fi fi-br-bank`, `fi fi-br-lightbulb-on`, `fi fi-br-angle-down`.

## Reglas de estilo

- **Fondos de slide**: siempre blanco puro `#FFF` (variable `$color-bg-slide`). Nunca usar `$color-bg` ni `$color-bg-dark`.
- **Color primary**: `#1e979f` (teal).
- **Textos HTML**: usar `<p>`, `<ul>`, `<ol>`, `<li>`, `<strong>`.
- **IDs de items**: unicos dentro de cada slide (ej: `"time-1"`, `"chan-2"`).
- **IDs de slides**: enteros unicos en todo el curso.

## Estructura de archivos

```
public/
  assets/images/                    # Assets compartidos (bg_carousel.jpg, icon_closing.png)
  contents/course-{id}/
    content.json                    # Contenido del curso (JSON)
    images/                         # Imagenes del curso
    videos/                         # Videos del curso
src/
  schemas/content.schema.ts         # Schemas Zod (fuente de verdad unica)
  types/index.ts                    # Tipos TypeScript derivados de los schemas via z.infer<>
  layouts/
    CoverLayout/                    # Layout cover
    SectionCoverLayout/             # Layout section-cover
    ImageTextLayout/                # Layout image-text
    InteractiveTextLayout/          # Layout interactive-text
    InteractiveImageLayout/         # Layout interactive-image + HelpTooltip compartido
    PopupLayout/                    # Layout popup (cards + modal)
    CarouselLayout/                 # Layout carousel
    IconTabsLayout/                 # Layout icon-tabs
    AccordionLayout/                # Layout accordion
    TabsLayout/                     # Layout tabs
    ClosingLayout/                  # Layout closing
  components/
    SlideViewer/SlideViewer.tsx      # Renderiza el layout segun slide.layout
    Navigation/Navigation.tsx        # Botones anterior/siguiente
    Sidebar/Sidebar.tsx              # Panel lateral con indice
    SlideHeader/SlideHeader.tsx      # Cabecera con titulo y paginacion
  contexts/
    SlideInteractionContext.ts       # Contexto para interacciones y bloqueo
  hooks/
    useScormProgress.ts              # Persistencia SCORM
  styles/
    _variables.scss                  # Variables de diseno
    _mixins.scss                     # Mixins SCSS
    layouts/                         # SCSS por layout
    main.scss                        # Punto de entrada de estilos
  App.tsx                            # Logica principal, bloqueo, provider
```
