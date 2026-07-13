# Changelog

## 1.1.0

- Diagrams now use the font your forum uses for post text, so they match the writing around them. Nothing to configure.
- Add a **Font family** setting to use a different font stack instead.
- Add a **Diagram theme** setting. The new default, "Match forum theme", takes the diagram colours from your forum. Mermaid's own themes can still be picked.
- Draw diagrams again when the reader switches colour scheme, instead of leaving a light diagram on a dark page until the next reload.
- Fix diagrams rendering in light colours under the high contrast dark scheme.
- Fix no diagrams rendering at all on forums served over plain HTTP.

## 1.0.0

- Render fenced `mermaid` code blocks as diagrams.
- Lazy-load mermaid from jsDelivr on first use.
- Match Flarum's dark mode automatically.
- Fall back to the original code on parse errors.
