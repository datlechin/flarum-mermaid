/**
 * The themes an admin can pick, in the order they appear in the admin select.
 *
 * `flarum` and `auto` are ours. The rest are mermaid's own and get passed to
 * `mermaid.initialize()` as they are.
 *
 * - `flarum` uses mermaid's `base` theme with the colours worked out from the
 *   forum's own, so diagrams match the rest of the page.
 * - `auto` uses mermaid's stock `default` and `dark` themes, switching with the
 *   forum's colour scheme.
 */
export declare const MERMAID_THEMES: readonly ["flarum", "auto", "default", "dark", "neutral", "forest"];
export type MermaidTheme = (typeof MERMAID_THEMES)[number];
export declare const DEFAULT_MERMAID_THEME: MermaidTheme;
