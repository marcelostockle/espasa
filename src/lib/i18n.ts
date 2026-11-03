// Locales and interface strings. Free of `astro:*` imports so client scripts can use it too.
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export function toLocale(value: string | undefined | null): Locale {
  return (locales as readonly string[]).includes(value ?? '') ? (value as Locale) : defaultLocale;
}

/** Path for a locale; the default locale has no prefix. `path` must start with "/". */
export function localePath(locale: Locale, path: string): string {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

/** Removes a leading locale prefix: "/es/eras/" -> "/eras/". */
export function stripLocale(pathname: string): string {
  const m = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  return m && m[1] !== defaultLocale && (locales as readonly string[]).includes(m[1]) ? (m[2] ?? '/') : pathname;
}

/** Route params for pages under src/pages/[...lang]/: one path per locale. */
export function localeStaticPaths() {
  return locales.map((locale) => ({
    params: { lang: locale === defaultLocale ? undefined : locale },
    props: { locale },
  }));
}

export const localeNames: Record<Locale, string> = { en: 'English', es: 'Español' };

const categories: Record<Locale, Record<string, string>> = {
  en: {},
  es: {
    States: 'Estados',
    Figures: 'Personajes',
    Peoples: 'Pueblos',
    Places: 'Lugares',
    Society: 'Sociedad',
    Culture: 'Cultura',
    Knowledge: 'Conocimiento',
    'Material culture': 'Cultura material',
    Other: 'Otros',
  },
};

/** Categories are plain text in the content; this only translates how they are shown. */
export function categoryName(category: string, locale: Locale): string {
  return categories[locale][category] ?? category;
}

const en = {
  tagline: 'A cross-topic timeline of historical events.',
  eras: 'Eras',
  compare: 'Compare topics',
  language: 'Language',
  homeTitle: 'History, side by side',
  homeIntro:
    'Events from every field of human activity, set against one another in time. Explore a topic, or put several on the same timeline.',
  startHere: 'Start here',
  topics: 'Topics',
  byEra: 'By era',
  searchPlaceholder: 'Search entries…',
  searchLabel: 'Search entries',
  searchUnavailable: 'Search is available in the built site.',
  noMatches: 'No matches.',
  sources: 'Sources',
  nearby: 'Around that time…',
  fromWikipedia: 'From Wikipedia',
  readOnWikipedia: 'Read on Wikipedia',
  viewOnMap: 'View on map',
  placeLoadError: 'Could not load this place.',
  category: 'Category',
  compareWithOthers: 'Compare with other topics →',
  erasIntro: 'Every topic in one chronological stream, one era at a time.',
  compareIntro: 'Pick topics to see them in parallel. Rows follow shared chronological order.',
  compareDescription: 'See several topics side by side on one chronology.',
  fromYear: 'From year',
  toYear: 'To year',
  any: 'any',
  bceHint: 'Use negative numbers for BCE.',
  showSummaries: 'Show summaries',
  singleLane: 'Single lane',
  selectOne: 'Select at least one topic.',
  needsJs: 'This view needs JavaScript. The',
  needsJsLink: 'full timeline',
  needsJsEnd: 'works without it.',
  aboutTitle: 'About this site',
  about: [
    ['Not an authoritative source.', 'Espasa was built for educational purposes only. For anything that matters, check primary sources and scholarly references.'],
    ['Errors are possible.', 'Some facts, dates and interpretations may be inaccurate or incomplete, especially for ancient or disputed events.'],
    ['Made with AI.', 'Entries were drafted with the help of an AI model, checked against web sources, and reviewed by a human before publication.'],
    ['Corrections and new entries.', 'There is no public submission process yet.'],
  ],
  before: 'before',
};

export type Strings = typeof en;

const es: Strings = {
  tagline: 'Una cronología de eventos históricos que cruza temas.',
  eras: 'Épocas',
  compare: 'Comparar temas',
  language: 'Idioma',
  homeTitle: 'La historia, lado a lado',
  homeIntro:
    'Hechos de todos los ámbitos de la actividad humana, puestos unos junto a otros en el tiempo. Explora un tema o reúne varios en la misma cronología.',
  startHere: 'Para empezar',
  topics: 'Temas',
  byEra: 'Por época',
  searchPlaceholder: 'Buscar entradas…',
  searchLabel: 'Buscar entradas',
  searchUnavailable: 'La búsqueda está disponible en el sitio compilado.',
  noMatches: 'Sin resultados.',
  sources: 'Fuentes',
  nearby: 'Por aquellos años…',
  fromWikipedia: 'De Wikipedia',
  readOnWikipedia: 'Leer en Wikipedia',
  viewOnMap: 'Ver en el mapa',
  placeLoadError: 'No se pudo cargar este lugar.',
  category: 'Categoría',
  compareWithOthers: 'Comparar con otros temas →',
  erasIntro: 'Todos los temas en un solo flujo cronológico, una época a la vez.',
  compareIntro: 'Elige temas para verlos en paralelo. Las filas siguen un orden cronológico común.',
  compareDescription: 'Mira varios temas lado a lado en una misma cronología.',
  fromYear: 'Desde el año',
  toYear: 'Hasta el año',
  any: 'cualquiera',
  bceHint: 'Usa números negativos para años a. C.',
  showSummaries: 'Mostrar resúmenes',
  singleLane: 'Un solo carril',
  selectOne: 'Selecciona al menos un tema.',
  needsJs: 'Esta vista necesita JavaScript. La',
  needsJsLink: 'cronología completa',
  needsJsEnd: 'funciona sin él.',
  aboutTitle: 'Acerca de este sitio',
  about: [
    ['No es una fuente autorizada.', 'Espasa se creó con fines exclusivamente educativos. Para cualquier asunto importante, consulta fuentes primarias y obras académicas.'],
    ['Puede haber errores.', 'Algunos hechos, fechas e interpretaciones pueden ser inexactos o estar incompletos, sobre todo en eventos antiguos o discutidos.'],
    ['Hecho con IA.', 'Las entradas se redactaron con ayuda de un modelo de IA, se contrastaron con fuentes en la web y una persona las revisó antes de publicarlas. Los textos en español son traducciones del original en inglés.'],
    ['Correcciones y nuevas entradas.', 'Todavía no existe un proceso público de envío.'],
  ],
  before: 'antes de',
};

const ui: Record<Locale, Strings> = { en, es };
export const t = (locale: Locale): Strings => ui[locale];

const MONTHS: Record<Locale, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
};
export const monthName = (month: number, locale: Locale) => MONTHS[locale][month - 1];
