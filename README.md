# md2html

A simple CLI tool that converts Markdown files to styled HTML with syntax highlighting and dark mode support.

## Features

- Converts `.md` files to standalone `.html` files
- GitHub-style CSS with light/dark mode support (`prefers-color-scheme`)
- Syntax highlighting via [highlight.js](https://highlightjs.org/)
- Responsive layout with 800px max-width container

## Installation

```bash
npm install
npm link   # makes `md2html` available globally
```

## Usage

```bash
md2html <input.md> [output.html]
```

If `output.html` is omitted, the output file is named after the input (e.g. `README.md` → `README.html`).

### Examples

```bash
md2html README.md
md2html README.md index.html
```

## Dependencies

- [marked](https://marked.js.org/) — Markdown parser
