# md2html

A simple CLI tool that converts Markdown files to styled and print-ready HTML.

## Features

- Converts `.md` files to standalone `.html` files
- GitHub-style CSS with light/dark mode support (`prefers-color-scheme`)
- Syntax highlighting via [highlight.js](https://highlightjs.org/)
- Mermaid.js support
- Responsive layout with 800px max-width container

## Installation

```bash
npm install
npm link   # makes `md2html` available globally
```

## Usage

```bash
md2html <input.md> [output.html] [--stdout] [--fragment]
```

If `output.html` is omitted, the output file is named after the input (e.g. `example.md` → `example.html`).

### Options

- `--stdout` (or `-` as the output file) — write the HTML to stdout instead of a file, so it can be piped or redirected. In this mode nothing else is printed to stdout.
- `--fragment` — emit only the converted content tags (`<h1>`, `<p>`, `<pre>`, …), without the `<!DOCTYPE>`, `<html>`/`<head>`/`<body>` wrapper, the embedded CSS and the highlight.js/Mermaid scripts. Useful for embedding the result into an existing page or template. GitHub-style alerts still render as `<div class="markdown-alert …">`, but you need to supply your own styles for them.

### Examples

```bash
md2html example.md
md2html example.md index.html
md2html example.md - > index.html
md2html example.md --stdout | pbcopy
md2html example.md --fragment --stdout
md2html example.md partial.html --fragment
```

## Printing

The generated HTML includes print styles with `break-after: avoid` on headings to keep them with the following content. This works in Chrome but **not in Safari** — use Chrome for printing.
