# md2html

A simple CLI tool that converts Markdown files to styled and print-ready HTML, and back again.

## Features

- Converts `.md` files to standalone `.html` files
- Converts HTML back to Markdown with `-r` (via [Turndown](https://github.com/mixmark-io/turndown))
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
md2html -r <input.html> [output.md] [--stdout]
```

If the output file is omitted, it is named after the input (e.g. `example.md` → `example.html`, and `example.html` → `example.md` in reverse).

### Options

- `--stdout` (or `-` as the output file) — write the output to stdout instead of a file, so it can be piped or redirected. In this mode nothing else is printed to stdout.
- `--fragment` — emit only the converted content tags (`<h1>`, `<p>`, `<pre>`, …), without the `<!DOCTYPE>`, `<html>`/`<head>`/`<body>` wrapper, the embedded CSS and the highlight.js/Mermaid scripts. Useful for embedding the result into an existing page or template. GitHub-style alerts still render as `<div class="markdown-alert …">`, but you need to supply your own styles for them. Cannot be combined with `-r`.
- `-r`, `--reverse` — convert the other way, from HTML to Markdown. An `.html` or `.htm` input is converted in reverse automatically, so the flag is only needed for inputs with another extension.

### Examples

```bash
md2html example.md
md2html example.md index.html
md2html example.md - > index.html
md2html example.md --stdout | pbcopy
md2html example.md --fragment --stdout
md2html example.md partial.html --fragment
md2html example.html            # reverse, writes example.md
md2html -r page.htm notes.md
md2html -r page.html --stdout
```

## HTML to Markdown

Reverse conversion produces GitHub-flavored Markdown: ATX headings, fenced code blocks (keeping the `language-*` class as the fence info string), tables, strikethrough and task lists. `<script>`, `<style>` and `<noscript>` are dropped, and for a full document only the `<body>` is converted so `<head>` content does not leak into the output.

Alerts round-trip: a `<div class="markdown-alert markdown-alert-note">` becomes a `> [!NOTE]` blockquote again, and a blockquote that is not an alert stays a plain blockquote.

Converting `md → html → md` returns the original document apart from whitespace normalisation (table cell padding, blank lines after headings). Converting that result back to HTML reproduces the original HTML exactly.

## Printing

The generated HTML includes print styles with `break-after: avoid` on headings to keep them with the following content. This works in Chrome but **not in Safari** — use Chrome for printing.
