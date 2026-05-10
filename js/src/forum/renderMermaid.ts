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
  initialize(config: Record<string, unknown>): void;
  parse(source: string, opts: { suppressErrors: true }): Promise<ParseResult | false>;
  render(id: string, source: string): Promise<{ svg: string }>;
}

declare global {
  interface Window {
    mermaid?: MermaidLib;
  }
}

export default async function renderMermaidIn(root: ParentNode): Promise<void> {
  const blocks = root.querySelectorAll<HTMLElement>('code.language-mermaid:not([data-mermaid-rendered])');
  if (blocks.length === 0) return;

  const mermaid = await getMermaid();

  for (const block of Array.from(blocks)) {
    block.setAttribute('data-mermaid-rendered', '1');
    await renderBlock(mermaid, block);
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

  const id = `mermaid-${diagramId()}`;
  try {
    const { svg } = await mermaid.render(id, source);
    const wrapper = document.createElement('div');
    wrapper.className = 'MermaidDiagram';
    wrapper.innerHTML = svg;
    (block.closest('pre') ?? block).replaceWith(wrapper);
  } catch (err) {
    block.setAttribute('data-mermaid-error', '1');
    block.setAttribute('title', err instanceof Error ? err.message : String(err));
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
    mermaidPromise = loadMermaidScript().then(initializeMermaid);
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
  lib.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: detectTheme(),
  });
  return lib;
}

function detectTheme(): 'default' | 'dark' {
  const explicitDark =
    document.documentElement.classList.contains('dark-mode') ||
    document.body.classList.contains('dark-mode') ||
    document.documentElement.getAttribute('data-theme') === 'dark';
  if (explicitDark) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default';
}

function diagramId(): string {
  // crypto.randomUUID is available in every browser that supports WebAuthn,
  // which is a strict superset of every browser that runs Flarum 2.x. The
  // string is namespaced into the SVG id so it can never collide.
  return crypto.randomUUID();
}
