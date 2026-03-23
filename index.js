#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const pkg = require('./package.json');
const hljsVersion = pkg.dependencies['highlight.js'].replace(/^\^/, '');
const mermaidVersion = pkg.dependencies['mermaid'].replace(/^\^/, '');

function convertMarkdownToHtml(markdownContent, title = 'Document') {
  const htmlContent = marked(markdownContent);

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

/* Syntax highlighting adjustments for dark mode */
@media (prefers-color-scheme: dark) {
  .hljs {
    background: var(--code-bg) !important;
    color: var(--text-color) !important;
  }
}
`;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: md2html <input.md> [output.html]');
    console.log('Example: md2html README.md index.html');
    process.exit(1);
  }
  
  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace(/\.md$/, '.html');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: File "${inputFile}" not found`);
    process.exit(1);
  }
  
  try {
    const markdownContent = fs.readFileSync(inputFile, 'utf8');
    const title = path.basename(inputFile, '.md');
    const htmlContent = convertMarkdownToHtml(markdownContent, title);
    
    fs.writeFileSync(outputFile, htmlContent);
    console.log(`Successfully converted "${inputFile}" to "${outputFile}"`);
  } catch (error) {
    console.error('Error converting file:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { convertMarkdownToHtml };