# Flarum Mermaid

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)
[![Latest Stable Version](https://img.shields.io/packagist/v/datlechin/flarum-mermaid.svg)](https://packagist.org/packages/datlechin/flarum-mermaid)
[![Total Downloads](https://img.shields.io/packagist/dt/datlechin/flarum-mermaid.svg)](https://packagist.org/packages/datlechin/flarum-mermaid)
[![Sponsor](https://img.shields.io/github/sponsors/datlechin?logo=githubsponsors&label=Sponsor)](https://github.com/sponsors/datlechin)

A [Flarum](https://flarum.org) extension that renders [Mermaid](https://mermaid.js.org) diagrams inside posts.

![Mermaid diagram rendered inside a Flarum post](screenshots/example.png)

## Example

````
```mermaid
flowchart LR
    A[User clicks login] --> B{Has passkey?}
    B -- yes --> C[Verify with WebAuthn]
    B -- no --> D[Password form]
    C --> E[Signed in]
    D --> E
```
````

## Settings

Diagrams match your forum out of the box. They use the font your forum uses for post text, take their colours from your forum, and follow light and dark mode as the reader switches. Two settings change that:

| Setting | Default | Description |
| --- | --- | --- |
| Diagram theme | Match forum theme | Takes the diagram colours from your forum. Mermaid's own themes (default, dark, neutral, forest) can be picked instead. |
| Font family | _(empty)_ | Any CSS font stack, such as `"Inter", system-ui, sans-serif`. Leave empty to use the forum's post font. |

## Installation

```sh
composer require datlechin/flarum-mermaid:"*"
```

## Updating

```sh
composer update datlechin/flarum-mermaid:"*"
php flarum cache:clear
```

## Sponsors

If this extension is useful to you, you can sponsor the work via [GitHub Sponsors](https://github.com/sponsors/datlechin) or [Buy Me a Coffee](https://buymeacoffee.com/ngoquocdat).

## Links

- [Packagist](https://packagist.org/packages/datlechin/flarum-mermaid)
- [GitHub](https://github.com/datlechin/flarum-mermaid)
- [Discuss](https://discuss.flarum.org/d/39236)
- [Mermaid](https://mermaid.js.org)
