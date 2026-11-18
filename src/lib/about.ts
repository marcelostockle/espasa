// Copy for the About page. Answers are trusted HTML written here (never user input), so the page may
// render them with set:html. Links to site pages are written as href="@/path/" and get the locale prefix.
import type { Locale } from './i18n';

export const groupIds = ['stack', 'content', 'search', 'i18n', 'security', 'quirks'] as const;
export type GroupId = (typeof groupIds)[number];

interface Item {
  id: string;
  group: GroupId;
  en: { q: string; a: string[] };
  es: { q: string; a: string[] };
}

export const items: Item[] = [
  // ───────────────────────── Stack
  {
    id: 'what-is-it',
    group: 'stack',
    en: {
      q: 'What is Espasa, technically?',
      a: [
        'A static site built with <a href="https://astro.build">Astro</a>. Every page is plain HTML generated ahead of time, so no code of mine runs when you visit. The output is served from Cloudflare as static assets: the whole deployment config is a ten-line <code>wrangler.jsonc</code> with no Worker script.',
      ],
    },
    es: {
      q: '¿Qué es Espasa, técnicamente?',
      a: [
        'Un sitio estático construido con <a href="https://astro.build">Astro</a>. Cada página es HTML simple generado de antemano, así que no se ejecuta código mío cuando lo visitas. El resultado se sirve desde Cloudflare como archivos estáticos: toda la configuración de despliegue es un <code>wrangler.jsonc</code> de diez líneas, sin ningún Worker.',
      ],
    },
  },
  {
    id: 'source-code',
    group: 'stack',
    en: {
      q: 'Is the source code public?',
      a: [
        'Yes: <a href="https://github.com/marcelostockle/espasa">github.com/marcelostockle/espasa</a>. It includes the site, the content itself, the admin tool, the Claude Code skills and the <code>docs/content-workflow.md</code> guide, so every claim on this page can be checked against the code.',
      ],
    },
    es: {
      q: '¿El código fuente es público?',
      a: [
        'Sí: <a href="https://github.com/marcelostockle/espasa">github.com/marcelostockle/espasa</a>. Incluye el sitio, el contenido mismo, la herramienta de administración, las skills de Claude Code y la guía <code>docs/content-workflow.md</code>, así que cada afirmación de esta página se puede contrastar con el código.',
      ],
    },
  },
  {
    id: 'why-static',
    group: 'stack',
    en: {
      q: 'Why static instead of a database and an API?',
      a: [
        'The content is read-only and changes when I publish, not when you click. That makes static the best trade: fast, cheap, almost nothing to attack, and it keeps working when JavaScript fails.',
        'The price is that any change is a rebuild. For a few hundred kilobytes of text per page, I will take that deal every time.',
      ],
    },
    es: {
      q: '¿Por qué estático y no una base de datos con una API?',
      a: [
        'El contenido es de solo lectura y cambia cuando publico, no cuando haces clic. Con eso, lo estático es el mejor trato: rápido, barato, casi sin nada que atacar, y sigue funcionando si JavaScript falla.',
        'El precio es que cualquier cambio exige reconstruir el sitio. Para páginas que son apenas texto, lo acepto siempre.',
      ],
    },
  },
  {
    id: 'frameworks',
    group: 'stack',
    en: {
      q: 'Which frontend framework does it use?',
      a: [
        'None on the client. Astro components render at build time and ship no JavaScript by themselves. The interactive parts (search, the Compare view, place popups, this page’s filters) are plain TypeScript that Astro bundles.',
        'The runtime dependencies are two: <code>astro</code> and its sitemap integration. <code>pagefind</code> and <code>wrangler</code> are build and deploy tools.',
      ],
    },
    es: {
      q: '¿Qué framework de frontend usa?',
      a: [
        'Ninguno en el cliente. Los componentes de Astro se renderizan al compilar y no envían JavaScript por sí solos. Las partes interactivas (búsqueda, la vista de comparación, los popups de lugares, los filtros de esta página) son TypeScript simple que Astro empaqueta.',
        'Las dependencias de ejecución son dos: <code>astro</code> y su integración de sitemap. <code>pagefind</code> y <code>wrangler</code> son herramientas de compilación y despliegue.',
      ],
    },
  },
  {
    id: 'routing',
    group: 'stack',
    en: {
      q: 'How does one file make both English and Spanish pages?',
      a: [
        'Pages live under <code>src/pages/[...lang]/</code>, an optional rest parameter. Each page exports <code>getStaticPaths</code> returning one path per language: English with no prefix, Spanish under <code>/es/</code>. Entry pages do the same for every entry, so each event gets its own URL in both languages.',
      ],
    },
    es: {
      q: '¿Cómo genera un solo archivo las páginas en inglés y en español?',
      a: [
        'Las páginas viven en <code>src/pages/[...lang]/</code>, un parámetro opcional. Cada página exporta <code>getStaticPaths</code> con una ruta por idioma: el inglés sin prefijo y el español bajo <code>/es/</code>. Las páginas de entradas hacen lo mismo con cada entrada, así que cada hecho tiene su propia URL en ambos idiomas.',
      ],
    },
  },

  // ───────────────────────── Content
  {
    id: 'no-database',
    group: 'content',
    en: {
      q: 'Is there a database?',
      a: [
        'No. Entries are Markdown files with frontmatter in <code>src/content/entries/</code>; tags, places and eras are JSON files next to them. Everything is in git, so history, diffs and review come for free, and a content change is a commit like any other.',
      ],
    },
    es: {
      q: '¿Hay una base de datos?',
      a: [
        'No. Las entradas son archivos Markdown con frontmatter en <code>src/content/entries/</code>; las etiquetas, lugares y épocas son archivos JSON a su lado. Todo está en git, así que el historial, las diferencias y la revisión vienen gratis, y un cambio de contenido es un commit como cualquier otro.',
      ],
    },
  },
  {
    id: 'validation',
    group: 'content',
    en: {
      q: 'What stops bad data from getting published?',
      a: [
        'Zod schemas, checked on every build. A day without a month fails. A source that is not an http(s) URL fails. An entry that names a tag or place that does not exist fails, so a typo becomes a build error rather than a dead link. A year outside every era fails too.',
        'In practice the build is the test suite: if it passes, the site’s data is internally consistent. It cannot tell you whether a date is <em>true</em>, which is what the review step is for.',
      ],
    },
    es: {
      q: '¿Qué impide publicar datos erróneos?',
      a: [
        'Esquemas de Zod, verificados en cada compilación. Un día sin mes falla. Una fuente que no sea una URL http(s) falla. Una entrada que nombra una etiqueta o un lugar inexistente falla, así que un error de tipeo se vuelve un error de compilación y no un enlace roto. Un año fuera de todas las épocas también falla.',
        'En la práctica, la compilación hace de suite de pruebas: si pasa, los datos del sitio son coherentes entre sí. No puede decirte si una fecha es <em>verdadera</em>; para eso está la revisión humana.',
      ],
    },
  },
  {
    id: 'ai',
    group: 'content',
    en: {
      q: 'How was the content made? Is it AI-written?',
      a: [
        'AI-drafted, source-checked and human-reviewed. Three <a href="https://claude.com/claude-code">Claude Code</a> skills do the legwork: one researches a topic and drafts dated events with source links, one proposes tags for older entries, and one links entries to places.',
        'Each produces a draft file, which is dry-run against the admin API (validation, and checks that Wikipedia articles exist). I read the draft before anything is written to the site. The skills never import on their own.',
        'That reduces mistakes, but it does not remove them. The About note at the bottom of every page says so, and meant it: for anything that matters, check a primary source.',
      ],
    },
    es: {
      q: '¿Cómo se hizo el contenido? ¿Lo escribió una IA?',
      a: [
        'Redactado con IA, contrastado con fuentes y revisado por una persona. Tres skills de <a href="https://claude.com/claude-code">Claude Code</a> hacen el trabajo pesado: una investiga un tema y redacta hechos fechados con enlaces a fuentes, otra propone etiquetas para entradas antiguas y otra vincula entradas con lugares.',
        'Cada una produce un borrador que se prueba en seco usando una API administrativa (validación y comprobación de que existan los artículos de Wikipedia). Leo el borrador antes de que se escriba nada en el sitio. Las skills nunca importan por su cuenta.',
        'Eso reduce los errores, pero no los elimina. La nota al pie de cada página lo dice en serio: para algo importante, consulta una fuente primaria.',
      ],
    },
  },
  {
    id: 'admin',
    group: 'content',
    en: {
      q: 'What is the admin tool?',
      a: [
        'A small Node server and a single-page UI, about a thousand lines of TypeScript in <code>admin/</code>, for browsing and editing entries, applying reviewed drafts and managing tags and places. Node 22 runs the TypeScript directly (type stripping), so there is no build step.',
        'It is not part of the site. It binds to <code>127.0.0.1</code>, has no authentication, and must never be deployed. That is only acceptable because it only ever runs on my machine.',
      ],
    },
    es: {
      q: '¿Qué es la herramienta de administración?',
      a: [
        'Un pequeño servidor Node con una interfaz de una sola página, unas mil líneas de TypeScript en <code>admin/</code>, para explorar y editar entradas, aplicar borradores revisados y gestionar etiquetas y lugares. Node 22 ejecuta el TypeScript directamente (eliminación de tipos), así que no hay paso de compilación.',
        'No forma parte del sitio. Solo para uso local, no tiene autenticación y jamás debe desplegarse. Eso solo es aceptable porque únicamente corre en mi máquina.',
      ],
    },
  },
  {
    id: 'places',
    group: 'content',
    en: {
      q: 'How do the place popups work?',
      a: [
        'A place is just a label and an English Wikipedia article title. When a place is created, the admin tool fetches the article’s summary, thumbnail and coordinates once and stores them as a snapshot in the repository. Builds never call Wikipedia, and neither do visitors for the text.',
        'In the browser, popups read a per-language <code>places.json</code> that is fetched only the first time you open one. Wikipedia text is CC BY-SA, so every popup credits and links the article.',
        'One caveat: a snapshot describes a place <em>today</em>, not as it was in the period of the entry.',
      ],
    },
    es: {
      q: '¿Cómo funcionan los popups de lugares?',
      a: [
        'Un lugar es solo una etiqueta y el título de un artículo de Wikipedia en inglés. Al crear un lugar, la herramienta de administración obtiene una sola vez el resumen, la miniatura y las coordenadas del artículo y los guarda como instantánea en el repositorio. Las compilaciones nunca llaman a Wikipedia, y los visitantes tampoco para el texto.',
        'En el navegador, los popups leen un <code>places.json</code> por idioma que se descarga solo la primera vez que abres uno. El texto de Wikipedia es CC BY-SA, así que cada popup acredita y enlaza el artículo.',
        'Una advertencia: la instantánea describe el lugar <em>hoy</em>, no como era en la época de la entrada.',
      ],
    },
  },

  // ───────────────────────── Search & speed
  {
    id: 'search-how',
    group: 'search',
    en: {
      q: 'How does search work without a server?',
      a: [
        'With <a href="https://pagefind.app">Pagefind</a>. After Astro builds the site, <code>pagefind --site dist</code> crawls the generated HTML and writes a static index into <code>dist/pagefind/</code>. Searching runs entirely in your browser: no search service, no API key, and your queries never leave your device.',
        'The index is split into small chunks, so the browser downloads only the pieces needed for what you typed rather than the whole thing.',
      ],
    },
    es: {
      q: '¿Cómo funciona la búsqueda sin servidor?',
      a: [
        'Con <a href="https://pagefind.app">Pagefind</a>. Después de que Astro construye el sitio, <code>pagefind --site dist</code> recorre el HTML generado y escribe un índice estático en <code>dist/pagefind/</code>. La búsqueda se ejecuta por completo en tu navegador: sin servicio de búsqueda, sin clave de API, y tus consultas nunca salen de tu dispositivo.',
        'El índice está dividido en fragmentos pequeños, así que el navegador descarga solo las piezas que necesita para lo que escribiste, no todo el índice.',
      ],
    },
  },
  {
    id: 'search-tuning',
    group: 'search',
    en: {
      q: 'What exactly gets indexed?',
      a: [
        'Only the body of each entry page, marked with <code>data-pagefind-body</code>. Within it, the source links and the “Around that time” list are excluded with <code>data-pagefind-ignore</code>, so searching for “Wikipedia” does not match every entry, and neighbors do not pollute each other’s results.',
        'Pagefind builds an index per page language and searches the one that matches the page you are on, so Spanish pages search Spanish text.',
      ],
    },
    es: {
      q: '¿Qué se indexa exactamente?',
      a: [
        'Solo el cuerpo de cada página de entrada, marcado con <code>data-pagefind-body</code>. Dentro de él, los enlaces a fuentes y la lista «Por aquellos años» se excluyen con <code>data-pagefind-ignore</code>, de modo que buscar «Wikipedia» no coincide con todas las entradas y las vecinas no contaminan los resultados de las demás.',
        'Pagefind crea un índice por idioma de página y busca en el que corresponde a la página donde estás, así que las páginas en español buscan en texto en español.',
      ],
    },
  },
  {
    id: 'search-lazy',
    group: 'search',
    en: {
      q: 'Does search slow down the home page?',
      a: [
        'No. The Pagefind library is not even requested until you type your first character, and typing is debounced by 150&nbsp;ms so it does not search on every keystroke. If you never search, you never pay for it.',
      ],
    },
    es: {
      q: '¿La búsqueda hace más lenta la página de inicio?',
      a: [
        'No. La librería de Pagefind ni siquiera se solicita hasta que escribes la primera letra, y se espera 150&nbsp;ms entre pulsaciones para no buscar en cada tecla. Si nunca buscas, nunca pagas por ella.',
      ],
    },
  },
  {
    id: 'search-dev',
    group: 'search',
    en: {
      q: 'Why does search say it is unavailable in development?',
      a: [
        'The index is produced after the build, and <code>astro dev</code> never builds. Rather than failing silently, the search box says so. To try it locally, run <code>npm run build</code> and then <code>npm run preview</code>.',
      ],
    },
    es: {
      q: '¿Por qué la búsqueda dice no estar disponible en desarrollo?',
      a: [
        'El índice se genera después de la compilación, y <code>astro dev</code> nunca compila. En lugar de fallar en silencio, el cuadro de búsqueda lo avisa. Para probarla en local, ejecuta <code>npm run build</code> y luego <code>npm run preview</code>.',
      ],
    },
  },
  {
    id: 'compare-perf',
    group: 'search',
    en: {
      q: 'How does the Compare view stay fast?',
      a: [
        'At build time, one lightweight <code>timeline.json</code> per language is generated: titles, summaries, dates and tag ids, but no page bodies. The Compare view fetches it once and does all the filtering and rendering in the browser, so toggling topics never touches the network.',
        'Your selection, year range and view options live in the URL query string, updated with <code>history.replaceState</code>. That makes any comparison bookmarkable and shareable, and the language switcher carries it over to the other language.',
        'The topic filter is accent- and case-insensitive (it normalizes text to Unicode NFD and strips the combining marks), so typing “persia” finds “Persia aqueménida”.',
      ],
    },
    es: {
      q: '¿Cómo se mantiene rápida la vista de comparación?',
      a: [
        'Al compilar se genera un <code>timeline.json</code> ligero por idioma: títulos, resúmenes, fechas e ids de etiquetas, pero sin el cuerpo de las páginas. La vista de comparación lo descarga una vez y hace todo el filtrado y el renderizado en el navegador, así que activar temas nunca toca la red.',
        'Tu selección, el rango de años y las opciones de vista viven en la cadena de consulta de la URL, actualizada con <code>history.replaceState</code>. Así cualquier comparación se puede guardar y compartir, y el selector de idioma la lleva al otro idioma.',
        'El filtro de temas ignora tildes y mayúsculas (normaliza el texto a Unicode NFD y quita las marcas combinadas), de modo que escribir «persia» encuentra «Persia aqueménida».',
      ],
    },
  },
  {
    id: 'related',
    group: 'search',
    en: {
      q: 'How are “related topics” suggested?',
      a: [
        'Among the entries currently shown, it counts how often each unselected tag appears and weighs that by how rare the tag is overall: <code>frequency × log(total entries ÷ entries with the tag)</code>. That is the classic tf-idf idea. Without the rarity term, huge generic tags such as war or politics would crowd out the specific, more interesting neighbors.',
      ],
    },
    es: {
      q: '¿Cómo se sugieren los «temas relacionados»?',
      a: [
        'Entre las entradas que se muestran en ese momento, cuenta cuántas veces aparece cada etiqueta no seleccionada y lo pondera por lo rara que es en el conjunto: <code>frecuencia × log(total de entradas ÷ entradas con la etiqueta)</code>. Es la idea clásica de tf-idf. Sin el término de rareza, etiquetas enormes y genéricas como guerra o política desplazarían a las vecinas específicas, que son más interesantes.',
      ],
    },
  },
  {
    id: 'nojs',
    group: 'search',
    en: {
      q: 'What works without JavaScript?',
      a: [
        'Reading: the home page, eras, tags and every entry are plain HTML and work with scripts off. Search, the Compare view and place popups need JavaScript. The Compare page says so in a <code>&lt;noscript&gt;</code> note that points to the full timeline, which does not need it.',
      ],
    },
    es: {
      q: '¿Qué funciona sin JavaScript?',
      a: [
        'La lectura: la página de inicio, las épocas, las etiquetas y todas las entradas son HTML simple y funcionan sin scripts. La búsqueda, la vista de comparación y los popups de lugares necesitan JavaScript. La página de comparación lo avisa en una nota <code>&lt;noscript&gt;</code> que apunta a la cronología completa, que no lo necesita.',
      ],
    },
  },
  {
    id: 'discoverability',
    group: 'search',
    en: {
      q: 'What about SEO and discoverability?',
      a: [
        'Each page gets its own title and description (an entry’s description is its summary), <code>hreflang</code> alternates between languages, and an i18n-aware sitemap from <code>@astrojs/sitemap</code>. The machine-readable JSON indexes are disallowed in <code>robots.txt</code>, since they are for the site’s own scripts.',
        'Honest gap: there are no canonical links or social preview (Open Graph) tags yet.',
      ],
    },
    es: {
      q: '¿Y el SEO y la visibilidad?',
      a: [
        'Cada página tiene su propio título y descripción (la de una entrada es su resumen), alternativas <code>hreflang</code> entre idiomas y un sitemap con soporte de idiomas gracias a <code>@astrojs/sitemap</code>. Los índices JSON legibles por máquina están excluidos en <code>robots.txt</code>, porque son para los scripts del propio sitio.',
        'Carencia honesta: todavía no hay enlaces canónicos ni etiquetas de vista previa social (Open Graph).',
      ],
    },
  },

  // ───────────────────────── Languages
  {
    id: 'translations',
    group: 'i18n',
    en: {
      q: 'How are translations stored?',
      a: [
        'Beside the English, in the same file. An entry carries a <code>translations</code> field with its Spanish title and summary; tags, eras and featured comparisons work the same way. English is the source of truth, and Spanish is drafted with AI, then reviewed by a person.',
      ],
    },
    es: {
      q: '¿Cómo se guardan las traducciones?',
      a: [
        'Junto al inglés, en el mismo archivo. Cada entrada lleva un campo <code>translations</code> con su título y resumen en español; las etiquetas, épocas y comparaciones destacadas funcionan igual. El inglés es la fuente de verdad, y el español se redacta con IA y entra a revisión manual.',
      ],
    },
  },
  {
    id: 'fallback',
    group: 'i18n',
    en: {
      q: 'What if something is not translated yet?',
      a: [
        'It still shows, in English, wrapped in <code>lang="en"</code>. A missing translation never hides content, and screen readers know to switch pronunciation for that passage.',
      ],
    },
    es: {
      q: '¿Qué pasa si algo aún no está traducido?',
      a: [
        'Se muestra igualmente, en inglés, envuelto en <code>lang="en"</code>. Una traducción faltante nunca oculta contenido, y los lectores de pantalla saben cambiar la pronunciación para ese pasaje.',
      ],
    },
  },
  {
    id: 'dates',
    group: 'i18n',
    en: {
      q: 'Are dates localized too?',
      a: [
        'Yes, by hand and not with <code>Intl</code>, because historical dates are not what <code>Intl</code> is for. English reads “March 15, 44 BCE”; Spanish reads “15 de marzo de 44 a.&nbsp;C.”, with non-breaking spaces so “a.&nbsp;C.” never splits across lines. A circa date gets a leading “c.” in both.',
      ],
    },
    es: {
      q: '¿También se localizan las fechas?',
      a: [
        'Sí, a mano y no con <code>Intl</code>, porque las fechas históricas no son para lo que sirve <code>Intl</code>. El inglés escribe “March 15, 44 BCE”; el español, “15 de marzo de 44 a.&nbsp;C.”, con espacios de no separación para que “a.&nbsp;C.” nunca se parta entre líneas. Una fecha aproximada lleva “c.” delante en ambos idiomas.',
      ],
    },
  },

  // ───────────────────────── Security & privacy
  {
    id: 'attack-surface',
    group: 'security',
    en: {
      q: 'What is the attack surface?',
      a: [
        'Small, by construction. There are no accounts, no sessions, no database and no server-side code that handles your input, so the usual suspects (SQL injection, session hijacking, credential stuffing) have nothing to attach to. What is left is static files on a CDN and a handful of client-side scripts.',
      ],
    },
    es: {
      q: '¿Cuál es la superficie de ataque?',
      a: [
        'Pequeña, por construcción. No hay cuentas, sesiones, base de datos ni código de servidor que procese lo que envías, así que los sospechosos habituales (inyección SQL, secuestro de sesión, relleno de credenciales) no tienen dónde engancharse. Lo que queda son archivos estáticos en una CDN y unos pocos scripts del lado del cliente.',
      ],
    },
  },
  {
    id: 'third-party-text',
    group: 'security',
    en: {
      q: 'How is third-party text handled safely?',
      a: [
        'Wikipedia text in popups is built with DOM APIs and <code>textContent</code>, never <code>innerHTML</code>, because it comes from outside. Source links must be http(s) URLs (the schema rejects <code>javascript:</code> and friends) and open with <code>rel="noopener noreferrer"</code>.',
        'The one <code>innerHTML</code> in the codebase renders search excerpts, because Pagefind returns them with <code>&lt;mark&gt;</code> highlights. That text comes from my own index, produced at build time, not from visitors.',
      ],
    },
    es: {
      q: '¿Cómo se maneja con seguridad el texto de terceros?',
      a: [
        'El texto de Wikipedia en los popups se construye con APIs del DOM y <code>textContent</code>, nunca con <code>innerHTML</code>, porque viene de fuera. Los enlaces a fuentes deben ser URL http(s) (el esquema rechaza <code>javascript:</code> y similares) y se abren con <code>rel="noopener noreferrer"</code>.',
        'El único <code>innerHTML</code> del código muestra los extractos de la búsqueda, porque Pagefind los devuelve con texto enriquecido <code>&lt;mark&gt;</code>. Ese texto viene de mi propio índice, generado al compilar, no de los visitantes.',
      ],
    },
  },
  {
    id: 'contact-form',
    group: 'security',
    en: {
      q: 'How does the contact form work with no backend?',
      a: [
        'It posts to <a href="https://web3forms.com">Web3Forms</a>, which forwards the message to my inbox. The access key in the page is public by design: it can only send to the address registered with it, so exposing it leaks nothing you can abuse.',
        'Spam is held back by a honeypot checkbox, moved off-screen, that people never see and bots happily tick. With scripts on, the form submits with <code>fetch</code> and keeps you on the page; with scripts off, it posts straight to Web3Forms. A honeypot stops lazy bots, not determined ones, and I am fine with that for a site this size.',
        'Your name, email and message are used only to reply to you. See <a href="@/privacy/">Privacy</a>.',
      ],
    },
    es: {
      q: '¿Cómo funciona el formulario de contacto sin backend?',
      a: [
        'Envía los datos a <a href="https://web3forms.com">Web3Forms</a>, que reenvía el mensaje a mi bandeja de entrada. La clave de acceso de la página es pública por diseño: solo puede enviar a la dirección registrada, así que exponerla no filtra nada aprovechable.',
        'El spam se frena con una casilla trampa (honeypot) fuera de pantalla que las personas nunca ven y los bots marcan sin dudar. Con scripts activos el formulario se envía con <code>fetch</code> y te deja en la página; sin scripts, envía directo a Web3Forms. Un honeypot detiene a los bots perezosos, no a los decididos, y para un sitio de este tamaño me basta.',
        'Tu nombre, correo y mensaje solo se usan para responderte. Ver <a href="@/privacy/">Privacidad</a>.',
      ],
    },
  },
  {
    id: 'privacy',
    group: 'security',
    en: {
      q: 'What does the site know about me?',
      a: [
        'Cloudflare Web Analytics counts page views, which pages, from which country and referrer, with no cookies and no profile of individual visitors. There are no ads and no other trackers.',
        'One third-party request to know about: when you open a place popup, its thumbnail loads from Wikimedia, with <code>referrerPolicy="no-referrer"</code> so it does not learn which page you came from. Full details on the <a href="@/privacy/">Privacy</a> page.',
      ],
    },
    es: {
      q: '¿Qué sabe el sitio de mí?',
      a: [
        'Cloudflare Web Analytics cuenta las visitas a páginas, qué páginas, desde qué país y desde qué sitio de referencia, sin cookies y sin perfiles de visitantes individuales. No hay publicidad ni otros rastreadores.',
        'Una petición a terceros que conviene saber: al abrir el popup de un lugar, su miniatura se carga desde Wikimedia con <code>referrerPolicy="no-referrer"</code>, para que no sepa desde qué página llegaste. Los detalles completos están en la página de <a href="@/privacy/">Privacidad</a>.',
      ],
    },
  },
  {
    id: 'human-in-the-loop',
    group: 'security',
    en: {
      q: 'Can the AI skills change the site on their own?',
      a: [
        'No, and that is a security property as much as a quality one. Skills write only draft files into a gitignored folder and stop after a dry run. Applying a draft is a separate step that I take after reading it, and the project’s rules forbid committing content files the AI did not create itself.',
      ],
    },
    es: {
      q: '¿Pueden las skills de IA modificar el sitio por sí solas?',
      a: [
        'No, y es tanto una propiedad de seguridad como de calidad. Las skills solo escriben borradores en una carpeta ignorada por git y se detienen tras una prueba en seco. Evaluar y aplicar un borrador es un paso aparte a cargo mío, y las reglas del proyecto prohíben confirmar archivos de contenido que la IA no haya creado ella misma.',
      ],
    },
  },

  // ───────────────────────── Quirks
  {
    id: 'no-year-zero',
    group: 'quirks',
    en: {
      q: 'Why can’t an entry be in year 0?',
      a: [
        'Because the calendar has no year 0: 1&nbsp;BCE is followed directly by 1&nbsp;CE. The schema stores BCE as negative numbers, so 1&nbsp;BCE is <code>-1</code>, and rejects <code>0</code> outright. The monk who devised the system in the 6th century worked in Roman numerals, which had no zero to offer.',
      ],
    },
    es: {
      q: '¿Por qué una entrada no puede estar en el año 0?',
      a: [
        'Porque el calendario no tiene año 0: el 1&nbsp;a.&nbsp;C. va seguido directamente del 1&nbsp;d.&nbsp;C. El esquema guarda los años a.&nbsp;C. como números negativos, así que el 1&nbsp;a.&nbsp;C. es <code>-1</code>, y rechaza el <code>0</code> sin más. El monje que ideó el sistema en el siglo VI trabajaba con numeración romana, que no tenía cero que ofrecer.',
      ],
    },
  },
  {
    id: 'sort-key',
    group: 'quirks',
    en: {
      q: 'How are events sorted when only some have a month or day?',
      a: [
        'Each date becomes a single number: <code>year + (month−1)/12 + (day−1)/372</code>. Why 372? It is 12 × 31: the largest possible day fraction, 30/372, is still smaller than one month step, 31/372, so a day can never spill into the next month. A missing month or day counts as the first.',
      ],
    },
    es: {
      q: '¿Cómo se ordenan los hechos si solo algunos tienen mes o día?',
      a: [
        'Cada fecha se convierte en un solo número: <code>año + (mes−1)/12 + (día−1)/372</code>. ¿Por qué 372? Es 12 × 31: la mayor fracción de día posible, 30/372, sigue siendo menor que un paso de mes, 31/372, así que un día nunca se desborda al mes siguiente. Un mes o día ausente cuenta como el primero.',
      ],
    },
  },
  {
    id: 'circa',
    group: 'quirks',
    en: {
      q: 'What about events nobody can date exactly?',
      a: [
        'They get <code>circa: true</code> and the summary says why. Legendary or traditional events are included too, labeled as such, because what people believed happened is part of history. Processes carry a start and an end date rather than a single point.',
      ],
    },
    es: {
      q: '¿Y los hechos que nadie sabe fechar con exactitud?',
      a: [
        'Llevan <code>circa: true</code> y el resumen explica por qué. También se incluyen los hechos legendarios o tradicionales, señalados como tales, porque lo que la gente creyó que ocurrió forma parte de la historia. Los procesos llevan fecha de inicio y de fin en lugar de un único punto.',
      ],
    },
  },
  {
    id: 'robots-note',
    group: 'quirks',
    en: {
      q: 'Is there anything for robots to read?',
      a: [
        'Yes: a polite note in <code>robots.txt</code> addressed to AI crawlers, asking them not to present the entries as established fact and to ask for a copy of the content instead of scraping page by page. It is a request, not a lock, but it costs nothing.',
      ],
    },
    es: {
      q: '¿Hay algo para que lean los robots?',
      a: [
        'Sí: una nota cortés en <code>robots.txt</code> dirigida a los rastreadores de IA, pidiéndoles que no presenten las entradas como hechos establecidos y que pidan una copia del contenido en lugar de extraerlo página por página. Es una petición, no un candado, pero no cuesta nada.',
      ],
    },
  },
];

export const ui: Record<
  Locale,
  {
    title: string;
    description: string;
    intro: string;
    groups: Record<GroupId, string>;
    all: string;
    filter: string;
    filterLabel: string;
    expand: string;
    collapse: string;
    noMatches: string;
    permalink: string;
    stats: { entries: string; topics: string; places: string; eras: string; languages: string };
    zeros: [number, string][];
    zerosLabel: string;
  }
> = {
  en: {
    title: 'About this site',
    description: 'How Espasa is built: the stack, search, performance, security and a few quirks.',
    intro:
      'Espasa is part encyclopedia, part portfolio piece. Here is how it works, in questions you can open, filter, search or have picked for you.',
    groups: {
      stack: 'The stack',
      content: 'Content & data',
      search: 'Search & speed',
      i18n: 'Languages',
      security: 'Security & privacy',
      quirks: 'Quirks & limits',
    },
    all: 'All',
    filter: 'Filter questions…',
    filterLabel: 'Filter questions',
    expand: 'Expand all',
    collapse: 'Collapse all',
    noMatches: 'No question matches. Try fewer words, or a different topic.',
    permalink: 'Link to this answer',
    stats: { entries: 'entries', topics: 'topics', places: 'places', eras: 'eras', languages: 'languages' },
    zeros: [
      [0, 'databases'],
      [0, 'cookies'],
      [0, 'client frameworks'],
      [0, 'webfonts'],
    ],
    zerosLabel: 'And, deliberately',
  },
  es: {
    title: 'Acerca de este sitio',
    description: 'Cómo está hecho Espasa: la pila tecnológica, búsqueda, rendimiento, seguridad y algunas rarezas.',
    intro:
      'Espasa es en parte enciclopedia y en parte pieza de portafolio. Así funciona, en preguntas que puedes abrir, filtrar, buscar o dejar que te elijan una.',
    groups: {
      stack: 'La pila',
      content: 'Contenido y datos',
      search: 'Búsqueda y velocidad',
      i18n: 'Idiomas',
      security: 'Seguridad y privacidad',
      quirks: 'Rarezas y límites',
    },
    all: 'Todo',
    filter: 'Filtrar preguntas…',
    filterLabel: 'Filtrar preguntas',
    expand: 'Abrir todo',
    collapse: 'Cerrar todo',
    noMatches: 'Ninguna pregunta coincide. Prueba con menos palabras o con otro tema.',
    permalink: 'Enlace a esta respuesta',
    stats: { entries: 'entradas', topics: 'temas', places: 'lugares', eras: 'épocas', languages: 'idiomas' },
    zeros: [
      [0, 'bases de datos'],
      [0, 'cookies'],
      [0, 'frameworks en el cliente'],
      [0, 'fuentes web'],
    ],
    zerosLabel: 'Y, a propósito',
  },
};
