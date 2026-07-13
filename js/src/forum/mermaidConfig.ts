import app from 'flarum/forum/app';
import { DEFAULT_MERMAID_THEME, MERMAID_THEMES, type MermaidTheme } from '../common/themes';

export interface MermaidConfig {
  startOnLoad: false;
  securityLevel: 'strict';
  theme: string;
  fontFamily?: string;
  themeVariables?: Record<string, unknown>;
}

/**
 * Build the config for `mermaid.initialize()`.
 *
 * Mermaid bakes the palette and the font into every SVG it renders, so this is
 * built again, and the diagrams redrawn, whenever the colour scheme changes.
 * `initialize()` replaces the old config instead of merging into it, so the
 * config returned here always has to be complete.
 *
 * Pass `stockTheme` to skip the forum palette and use one of mermaid's own.
 * That is how the caller recovers if mermaid rejects the forum's colours.
 */
export default function buildMermaidConfig(options: { stockTheme?: boolean } = {}): MermaidConfig {
  const dark = isDarkMode();
  const config: MermaidConfig = {
    startOnLoad: false,
    securityLevel: 'strict',
    ...resolveTheme(options.stockTheme ? 'auto' : themeSetting(), dark),
  };

  const fontFamily = resolveFontFamily();

  if (fontFamily) {
    // This one option covers every diagram. Mermaid copies it into
    // `themeVariables.fontFamily` for the SVG stylesheet, and the sequence, C4
    // and ER renderers read it directly to set `font-family` on their text.
    // Without it those three keep mermaid's own Open Sans and trebuchet.
    config.fontFamily = fontFamily;
  }

  return config;
}

function resolveTheme(setting: MermaidTheme, dark: boolean): Pick<MermaidConfig, 'theme' | 'themeVariables'> {
  if (setting === 'flarum') {
    const themeVariables = flarumThemeVariables(dark);

    // `base` is the only mermaid theme that builds a whole palette out of the
    // variables it is given. The others hard-code most of their colours.
    if (themeVariables) return { theme: 'base', themeVariables };

    // The forum's colours could not be read, so use a stock theme rather than
    // render half a palette.
    setting = 'auto';
  }

  if (setting === 'auto') return { theme: dark ? 'dark' : 'default' };

  return { theme: setting };
}

function themeSetting(): MermaidTheme {
  const setting = app.forum.attribute<string | null>('mermaidTheme');

  return MERMAID_THEMES.includes(setting as MermaidTheme) ? (setting as MermaidTheme) : DEFAULT_MERMAID_THEME;
}

/**
 * Turn the forum's colours into the few variables mermaid's `base` theme builds
 * the rest of its palette from. Returns null if the forum's colours can't be
 * read.
 */
function flarumThemeVariables(dark: boolean): Record<string, unknown> | null {
  const styles = getComputedStyle(document.documentElement);
  const read = (property: string) => resolveColor(styles.getPropertyValue(property).trim());

  const background = read('--body-bg');
  const textColor = read('--text-color');
  const accent = read('--primary-color');
  const lineColor = read('--muted-color');

  if (!background || !textColor || !accent || !lineColor) return null;

  // `primaryColor` is mermaid's anchor colour. It rotates that hue to work out
  // node borders, cluster fills and the colour scales behind pie, journey and
  // quadrant charts, so it needs the accent at full strength. Rotating the hue
  // of a pale tint just gives a set of near-whites and an unreadable pie chart.
  const surface = mix(accent, background, 12);

  if (!surface) return null;

  return {
    // Tells mermaid which way to shift the colours it works out from these.
    darkMode: dark,
    background,
    primaryColor: accent,
    // A diagram is mostly nodes though, and a wall of solid accent-coloured
    // boxes is a lot. Paint the surfaces with a hint of the accent over the post
    // background instead. That also keeps the forum's text colour readable on
    // them, since it is the colour that background is already designed for.
    mainBkg: surface,
    nodeBkg: surface,
    clusterBkg: surface,
    primaryTextColor: textColor,
    textColor,
    lineColor,
    // Edge labels sit on the diagram itself, not on a node.
    edgeLabelBackground: background,
  };
}

/**
 * Blend two colours, weighting the first by `percentage`, and return something
 * mermaid can parse.
 *
 * Done by hand rather than with CSS `color-mix()` on purpose: browsers return a
 * `color-mix()` result as `color(srgb 0.91 0.92 0.94)`, which mermaid's colour
 * parser throws on, taking every diagram on the page down with it.
 */
function mix(color: string, base: string, percentage: number): string | null {
  const from = channels(color);
  const to = channels(base);

  if (!from || !to) return null;

  const weight = percentage / 100;
  const blend = (index: number) => Math.round(from[index] * weight + to[index] * (1 - weight));

  return `rgb(${blend(0)}, ${blend(1)}, ${blend(2)})`;
}

/**
 * Turn any colour the browser understands into the `rgb()` or `rgba()` syntax
 * mermaid accepts. A forum styled in a syntax mermaid has never heard of then
 * falls back to a stock theme instead of breaking.
 */
function resolveColor(color: string): string | null {
  const rgb = channels(color);

  if (!rgb) return null;

  const [red, green, blue, alpha] = rgb;

  return alpha < 1 ? `rgba(${red}, ${green}, ${blue}, ${alpha})` : `rgb(${red}, ${green}, ${blue})`;
}

/**
 * Let the browser resolve a CSS colour, in whatever syntax, into its channels.
 */
function channels(color: string): [number, number, number, number] | null {
  const probe = document.createElement('span');

  probe.style.color = color;

  // The browser drops values it can't parse, so an empty string means the colour
  // was malformed.
  if (!probe.style.color) return null;

  probe.style.display = 'none';
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();

  // Colours normally come back as `rgb()` or `rgba()`. Anything else, such as a
  // wide-gamut `color()`, is left for the caller to fall back on.
  if (!computed.startsWith('rgb')) return null;

  const parts = computed.match(/[\d.]+/g)?.map(Number);

  if (!parts || parts.length < 3) return null;

  return [parts[0], parts[1], parts[2], parts[3] ?? 1];
}

function resolveFontFamily(): string | null {
  const configured = app.forum.attribute<string | null>('mermaidFontFamily')?.trim();
  const fontFamily = configured || inheritedFontFamily();

  if (!fontFamily) return null;

  // Mermaid assigns this straight to `element.style.fontFamily` for sequence, C4
  // and ER text. A trailing semicolon makes that invalid and the browser drops
  // it without a word. Mermaid's own default ends in one, which is why its
  // sequence diagrams ignore it. Strip it so a CSS-style value still works.
  return fontFamily.replace(/;\s*$/, '').trim() || null;
}

/**
 * The font the forum uses for post text, so diagrams match the writing around
 * them without anyone configuring anything.
 */
function inheritedFontFamily(): string | null {
  // Read it from the post body. Not from the `<code>` block the diagram is
  // written in, which inherits the monospace code font, and not from `<body>`,
  // so a theme that restyles post text specifically is still picked up.
  const source = document.querySelector('.Post-body') ?? document.body;

  return getComputedStyle(source).fontFamily || null;
}

/**
 * Flarum puts the reader's colour scheme on `<html data-theme>`. It is one of
 * `light`, `dark`, `light-hc` or `dark-hc`. The high contrast ones matter here:
 * matching only `dark` renders a light diagram on a dark forum.
 */
function isDarkMode(): boolean {
  const scheme = document.documentElement.getAttribute('data-theme');

  if (scheme) return scheme.startsWith('dark');

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
