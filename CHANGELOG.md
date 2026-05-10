# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0]

Initial release.

### Added

- Render Mermaid diagrams from fenced ` ```mermaid ` code blocks in posts.
- Lazy-load the mermaid library from jsDelivr on first use, so pages without diagrams pay nothing.
- Auto theme: diagrams switch between mermaid's light and dark palette to match Flarum's mode.
- `securityLevel: 'strict'` so user-supplied diagram source can't escape into HTML.
- Pre-validate every block with `mermaid.parse()` so a malformed diagram quietly leaves the original code visible instead of injecting mermaid's bomb error graphic.

[1.0.0]: https://github.com/datlechin/flarum-mermaid/releases/tag/v1.0.0
