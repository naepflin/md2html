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
md2html <input.md> [output.html] [--stdout]
```

If `output.html` is omitted, the output file is named after the input (e.g. `example.md` → `example.html`).

Pass `--stdout` (or use `-` as the output file) to write the HTML to stdout instead of a file, so it can be piped or redirected. In this mode nothing else is printed to stdout.

### Examples

```bash
md2html example.md
md2html example.md index.html
md2html example.md - > index.html
md2html example.md --stdout | pbcopy
```

## Printing

The generated HTML includes print styles with `break-after: avoid` on headings to keep them with the following content. This works in Chrome but **not in Safari** — use Chrome for printing.
