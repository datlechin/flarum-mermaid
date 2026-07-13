import buildMermaidConfig, { type MermaidConfig } from './mermaidConfig';

// Mermaid is loaded from a CDN on first use. Bundling it through Flarum's
// webpack pipeline conflicts with two of its registry plugins (mermaid splits
// internal chunks per diagram type that flarum-webpack-config can't register),
// so a CDN fetch keeps the entry bundle tiny and lets jsdelivr handle caching
// across forums.
const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

interface ParseResult {
  diagramType: string;
}

interface MermaidLib {
  initialize(config: MermaidConfig): void;
  parse(source: string, opts: { suppressErrors: true }): Promise<ParseResult | false>;
  render(id: string, source: string): Promise<{ svg: string }>;
}

declare global {
  interface Window {
    mermaid?: MermaidLib;
  }
}

// Every diagram on the page, keyed by the wrapper that replaced its code block.
// Mermaid bakes the palette and the font into each SVG, so a diagram never
// restyles itself. Its source is kept here to draw it again when the colour
// scheme changes.
const diagrams = new Map<HTMLElement, string>();

// Bumped on every colour scheme change so a redraw that is already running can
// stop instead of racing a newer one to the same wrapper.
let generation = 0;

export default async function renderMermaidIn(root: ParentNode): Promise<void> {
  const blocks = root.querySelectorAll<HTMLElement>('code.language-mermaid:not([data-mermaid-rendered])');
  if (blocks.length === 0) return;

  forgetDetachedDiagrams();

  const mermaid = await getMermaid();

  for (const block of Array.from(blocks)) {
    block.setAttribute('data-mermaid-rendered', '1');
    await renderBlock(mermaid, block);
  }
}

/**
 * Draw the diagrams again when the reader switches colour scheme, so a diagram
 * rendered in light mode doesn't stay light on a dark page.
 */
export function watchColorScheme(): void {
  // Flarum resolves the scheme onto `<html data-theme>`, including `auto` and
  // any later change to the OS setting, so that one attribute is the whole
  // signal.
  const observer = new MutationObserver(() => void reconfigure());

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

async function reconfigure(): Promise<void> {
  // Nothing is on screen yet, and the new scheme gets picked up anyway when the
  // config is built on first use.
  if (!mermaidPromise) return;

  const current = ++generation;

  let mermaid: MermaidLib;

  try {
    mermaid = await mermaidPromise;
  } catch {
    // Mermaid never loaded, so there is nothing on screen to redraw.
    return;
  }

  if (current !== generation) return;

  applyConfig(mermaid);

  for (const [wrapper, source] of diagrams) {
    if (current !== generation) return;

    if (!wrapper.isConnected) {
      diagrams.delete(wrapper);
      continue;
    }

    // A diagram that rendered once won't fail on a restyle, but if it somehow
    // does, keep the SVG that is on screen rather than blanking it.
    await draw(mermaid, wrapper, source).catch(() => {});
  }
}

/**
 * Mithril throws a post's DOM away when the reader moves on. Drop the diagrams
 * that went with it, so the map doesn't grow for the whole session.
 */
function forgetDetachedDiagrams(): void {
  for (const wrapper of diagrams.keys()) {
    if (!wrapper.isConnected) diagrams.delete(wrapper);
  }
}

async function renderBlock(mermaid: MermaidLib, block: HTMLElement): Promise<void> {
  const source = block.textContent ?? '';

  // Validate first so a malformed diagram never reaches render(), which would
  // otherwise leave mermaid's bomb error SVG stranded in <body>.
  const valid = await mermaid.parse(source, { suppressErrors: true }).catch(() => false);
  if (!valid) {
    block.setAttribute('data-mermaid-error', '1');
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'MermaidDiagram';

  try {
    await draw(mermaid, wrapper, source);
  } catch (err) {
    block.setAttribute('data-mermaid-error', '1');
    block.setAttribute('title', err instanceof Error ? err.message : String(err));
    return;
  }

  // Only take the code block away once there is a diagram to put in its place.
  (block.closest('pre') ?? block).replaceWith(wrapper);
  diagrams.set(wrapper, source);
}

async function draw(mermaid: MermaidLib, wrapper: HTMLElement, source: string): Promise<void> {
  const id = `mermaid-${diagramId()}`;

  try {
    const { svg } = await mermaid.render(id, source);
    wrapper.innerHTML = svg;
  } finally {
    // mermaid.render() builds a temporary container at id `d<svgId>` and
    // attaches it to <body>. On failure that container can stick around with
    // the bomb graphic; remove it explicitly.
    document.getElementById(`d${id}`)?.remove();
  }
}

let mermaidPromise: Promise<MermaidLib> | null = null;

function getMermaid(): Promise<MermaidLib> {
  if (!mermaidPromise) {
    mermaidPromise = loadMermaidScript()
      .then(initializeMermaid)
      .catch((err) => {
        // Don't cache the rejection: a transient CDN failure would otherwise
        // disable the extension for the rest of the page session.
        mermaidPromise = null;
        throw err;
      });
  }

  return mermaidPromise;
}

function loadMermaidScript(): Promise<MermaidLib> {
  if (window.mermaid) return Promise.resolve(window.mermaid);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = MERMAID_CDN;
    script.async = true;
    script.onload = () => (window.mermaid ? resolve(window.mermaid) : reject(new Error('Mermaid library failed to attach to window.')));
    script.onerror = () => reject(new Error(`Failed to load mermaid from ${MERMAID_CDN}.`));
    document.head.appendChild(script);
  });
}

function initializeMermaid(lib: MermaidLib): MermaidLib {
  applyConfig(lib);
  return lib;
}

function applyConfig(lib: MermaidLib): void {
  try {
    lib.initialize(buildMermaidConfig());
  } catch (err) {
    // Mermaid parses the palette up front and throws on a colour it doesn't
    // recognise. A forum can put anything in its custom properties, and one
    // colour mermaid dislikes must not take every diagram down with it, so fall
    // back to a stock theme and still render.
    console.error('[datlechin-mermaid] Could not apply the forum palette, using a stock mermaid theme instead.', err);

    lib.initialize(buildMermaidConfig({ stockTheme: true }));
  }
}

let diagramCounter = 0;

function diagramId(): string {
  // Not crypto.randomUUID(): that is gated to secure contexts, so it is absent
  // on forums served over plain HTTP. A counter is enough, the id only has to
  // be unique within the document.
  return `${++diagramCounter}`;
}
