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
export default function buildMermaidConfig(options?: {
    stockTheme?: boolean;
}): MermaidConfig;
