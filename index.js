#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');

const pkg = require('./package.json');
const hljsVersion = pkg.dependencies['highlight.js'].replace(/^\^/, '');
const mermaidVersion = pkg.dependencies['mermaid'].replace(/^\^/, '');

const alertTypes = {
  NOTE: { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>', label: 'Note' },
  TIP: { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/></svg>', label: 'Tip' },
  IMPORTANT: { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>', label: 'Important' },
  WARNING: { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>', label: 'Warning' },
  CAUTION: { icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>', label: 'Caution' },
};

const alertExtension = {
  walkTokens(token) {
    if (token.type !== 'blockquote') return;
    const first = token.tokens?.[0];
    if (first?.type !== 'paragraph') return;
    const inline = first.tokens?.[0];
    if (inline?.type !== 'text') return;
    const match = inline.text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n?/);
    if (!match) return;
    const alertType = match[1];
    token.type = 'alert';
    token.meta = { alertType };
    // Remove the [!TYPE] prefix from the text
    inline.text = inline.text.slice(match[0].length);
    if (!inline.text && first.tokens.length > 1) {
      first.tokens.shift();
    }
  },
  extensions: [{
    name: 'alert',
    level: 'block',
    renderer(token) {
      const { alertType } = token.meta;
      const { icon, label } = alertTypes[alertType];
      const body = this.parser.parse(token.tokens);
      return `<div class="markdown-alert markdown-alert-${alertType.toLowerCase()}">
<p class="markdown-alert-title">${icon} ${label}</p>
${body}
</div>\n`;
    },
  }],
};

function convertMarkdownToFragment(markdownContent) {
  marked.use(alertExtension);
  return marked(markdownContent);
}

function convertMarkdownToHtml(markdownContent, title = 'Document') {
  const htmlContent = convertMarkdownToFragment(markdownContent);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${hljsVersion}/styles/github.min.css" media="(prefers-color-scheme: light)">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${hljsVersion}/styles/github-dark.min.css" media="(prefers-color-scheme: dark)">
    <style>
        ${getCSSStyles()}
    </style>
</head>
<body>
    <div class="container">
        ${htmlContent}
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${hljsVersion}/highlight.min.js"></script>
    <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@${mermaidVersion}/dist/mermaid.esm.min.mjs';
        mermaid.initialize({
            startOnLoad: false,
            theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default'
        });
        document.querySelectorAll('pre code.language-mermaid').forEach(el => {
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.textContent = el.textContent;
            el.closest('pre').replaceWith(div);
        });
        await mermaid.run();
        hljs.highlightAll();
    </script>
</body>
</html>`;
}

function hasClass(node, className) {
  return typeof node.className === 'string' && node.className.split(/\s+/).includes(className);
}

function createTurndownService() {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
  });

  turndownService.use(gfm);
  turndownService.remove(['script', 'style', 'noscript']);

  // gfm emits a single tilde; GitHub's canonical form is a double one.
  turndownService.addRule('strikethrough', {
    filter: ['del', 's'],
    replacement: (content) => `~~${content}~~`,
  });

  // Same as turndown's built-in list item, but indented by the marker width
  // instead of a fixed four spaces.
  turndownService.addRule('listItem', {
    filter: 'li',
    replacement(content, node, options) {
      const parent = node.parentNode;
      let prefix = `${options.bulletListMarker} `;
      if (parent.nodeName === 'OL') {
        const start = Number(parent.getAttribute('start') || 1);
        const index = Array.prototype.indexOf.call(parent.children, node);
        prefix = `${start + index}. `;
      }
      const text = content
        .replace(/^\n+/, '')
        .replace(/\n+$/, '\n')
        .replace(/^(\[[ x]\])\s+/, '$1 ')
        .replace(/\n/gm, `\n${' '.repeat(prefix.length)}`);
      return prefix + text + (node.nextSibling && !/\n$/.test(text) ? '\n' : '');
    },
  });

  // The alert title is re-emitted as the [!TYPE] marker by the rule below.
  turndownService.addRule('alertTitle', {
    filter: (node) => node.nodeName === 'P' && hasClass(node, 'markdown-alert-title'),
    replacement: () => '',
  });

  turndownService.addRule('alert', {
    filter: (node) => node.nodeName === 'DIV' && hasClass(node, 'markdown-alert'),
    replacement(content, node) {
      const alertType = Object.keys(alertTypes)
        .find((type) => hasClass(node, `markdown-alert-${type.toLowerCase()}`));
      const body = content.trim().split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n');
      if (!alertType) return `\n\n${body}\n\n`;
      return `\n\n> [!${alertType}]\n${body}\n\n`;
    },
  });

  return turndownService;
}

// A full document carries <head> content that turndown would render as stray
// text, so convert the body only. Fragments are passed through untouched.
function extractBody(htmlContent) {
  const match = htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1] : htmlContent;
}

function convertHtmlToMarkdown(htmlContent) {
  return `${createTurndownService().turndown(extractBody(htmlContent)).trim()}\n`;
}

function getCSSStyles() {
  return `
/* Modern CSS with dark mode support */
:root {
  --bg-color: #ffffff;
  --text-color: #333333;
  --border-color: #e1e5e9;
  --code-bg: #f6f8fa;
  --blockquote-bg: #f6f8fa;
  --blockquote-border: #d1d9e0;
  --link-color: #0969da;
  --link-hover: #0550ae;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #0d1117;
    --text-color: #e6edf3;
    --border-color: #30363d;
    --code-bg: #161b22;
    --blockquote-bg: #161b22;
    --blockquote-border: #30363d;
    --link-color: #58a6ff;
    --link-hover: #79c0ff;
  }
}

* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--bg-color);
  margin: 0;
  padding: 0;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1, h2, h3, h4, h5, h6 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  line-height: 1.25;
}

@media print {
  h1, h2, h3, h4, h5, h6 {
    break-after: avoid;
  }
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
h3 { font-size: 1.5rem; }
h4 { font-size: 1.25rem; }
h5 { font-size: 1rem; }
h6 { font-size: 0.875rem; }

p {
  margin-bottom: 1rem;
}

a {
  color: var(--link-color);
  text-decoration: none;
}

a:hover {
  color: var(--link-hover);
  text-decoration: underline;
}

code {
  background-color: var(--code-bg);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, 'Courier New', monospace;
  font-size: 0.875rem;
}

pre {
  background-color: var(--code-bg);
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1rem 0;
}

pre code {
  background-color: transparent;
  padding: 0;
  font-size: 0.875rem;
}

blockquote {
  margin: 1rem 0;
  padding: 1rem;
  border-left: 4px solid var(--blockquote-border);
  background-color: var(--blockquote-bg);
  border-radius: 0 4px 4px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

th {
  font-weight: 600;
  background-color: var(--code-bg);
}

ul, ol {
  padding-left: 2rem;
  margin: 1rem 0;
}

li {
  margin-bottom: 0.5rem;
}

img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1rem 0;
}

hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 2rem 0;
}

/* GitHub-style alerts */
.markdown-alert {
  margin: 1rem 0;
  padding: 0 1rem;
  border-left: 4px solid;
  border-radius: 0 4px 4px 0;
  break-inside: avoid;
}

.markdown-alert > :first-child {
  margin-top: 0;
}

.markdown-alert > :last-child {
  margin-bottom: 0;
}

.markdown-alert-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.markdown-alert-title svg {
  flex-shrink: 0;
}

.markdown-alert-note { border-left-color: #0969da; }
.markdown-alert-note .markdown-alert-title { color: #0969da; }

.markdown-alert-tip { border-left-color: #1a7f37; }
.markdown-alert-tip .markdown-alert-title { color: #1a7f37; }

.markdown-alert-important { border-left-color: #8250df; }
.markdown-alert-important .markdown-alert-title { color: #8250df; }

.markdown-alert-warning { border-left-color: #9a6700; }
.markdown-alert-warning .markdown-alert-title { color: #9a6700; }

.markdown-alert-caution { border-left-color: #cf222e; }
.markdown-alert-caution .markdown-alert-title { color: #cf222e; }

@media (prefers-color-scheme: dark) {
  .markdown-alert-note { border-left-color: #58a6ff; }
  .markdown-alert-note .markdown-alert-title { color: #58a6ff; }

  .markdown-alert-tip { border-left-color: #3fb950; }
  .markdown-alert-tip .markdown-alert-title { color: #3fb950; }

  .markdown-alert-important { border-left-color: #a371f7; }
  .markdown-alert-important .markdown-alert-title { color: #a371f7; }

  .markdown-alert-warning { border-left-color: #d29922; }
  .markdown-alert-warning .markdown-alert-title { color: #d29922; }

  .markdown-alert-caution { border-left-color: #f85149; }
  .markdown-alert-caution .markdown-alert-title { color: #f85149; }
}

/* Syntax highlighting adjustments for dark mode */
@media (prefers-color-scheme: dark) {
  .hljs {
    background: var(--code-bg) !important;
    color: var(--text-color) !important;
  }
}
`;
}

function takeFlag(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return false;
  args.splice(index, 1);
  return true;
}

function main() {
  const args = process.argv.slice(2);

  let toStdout = takeFlag(args, '--stdout');
  const fragmentOnly = takeFlag(args, '--fragment');
  const reverseLong = takeFlag(args, '--reverse');
  const reverseShort = takeFlag(args, '-r');

  if (args.length === 0) {
    console.log('Usage: md2html <input.md> [output.html] [--stdout] [--fragment]');
    console.log('       md2html -r <input.html> [output.md] [--stdout]');
    console.log('Example: md2html README.md index.html');
    console.log('Use "-" as the output file or pass --stdout to write the output to stdout.');
    console.log('Pass --fragment to emit only the converted content tags, without the');
    console.log('surrounding HTML document, CSS and scripts.');
    console.log('Pass -r/--reverse to convert the other way, from HTML back to Markdown.');
    console.log('An .html or .htm input is converted in reverse automatically.');
    process.exit(1);
  }

  const inputFile = args[0];
  const ext = path.extname(inputFile);
  const reverse = reverseLong || reverseShort || ['.html', '.htm'].includes(ext.toLowerCase());

  if (reverse && fragmentOnly) {
    console.error('Error: --fragment cannot be combined with --reverse.');
    process.exit(1);
  }

  const targetExt = reverse ? '.md' : '.html';
  if (args[1] === '-') toStdout = true;
  const outputFile = toStdout
    ? null
    : args[1] || (ext ? inputFile.replace(new RegExp(ext.replace('.', '\\.') + '$'), targetExt) : inputFile + targetExt);

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File "${inputFile}" not found`);
    process.exit(1);
  }

  if (outputFile && path.resolve(inputFile) === path.resolve(outputFile)) {
    console.error(`Error: Output file would overwrite input file "${inputFile}". Please specify a different output file.`);
    process.exit(1);
  }

  try {
    const inputContent = fs.readFileSync(inputFile, 'utf8');
    const title = path.basename(inputFile, ext);
    let outputContent;
    if (reverse) {
      outputContent = convertHtmlToMarkdown(inputContent);
    } else if (fragmentOnly) {
      outputContent = convertMarkdownToFragment(inputContent);
    } else {
      outputContent = convertMarkdownToHtml(inputContent, title);
    }

    if (toStdout) {
      process.stdout.write(outputContent);
    } else {
      fs.writeFileSync(outputFile, outputContent);
      console.log(`Successfully converted "${inputFile}" to "${outputFile}"`);
    }
  } catch (error) {
    console.error('Error converting file:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { convertMarkdownToHtml, convertMarkdownToFragment, convertHtmlToMarkdown };