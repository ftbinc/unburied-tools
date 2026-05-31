#!/usr/bin/env node
/**
 * Convert toolkit markdown files to styled HTML + PDF.
 */
const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname);
const toolkitDir = path.join(baseDir, 'toolkit');
const outDir = path.join(baseDir, 'products');

fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(toolkitDir).filter(f => f.endsWith('.md') && f !== 'README.md');

const style = `
<style>
  @page { margin: 0.8in; }
  body {
    font-family: Georgia, 'Times New Roman', Times, serif;
    line-height: 1.5;
    color: #1a1a1a;
    max-width: 6.5in;
    margin: 0 auto;
    padding: 0;
  }
  h1 { font-size: 1.6em; margin-top: 0; }
  h2 { font-size: 1.2em; margin-top: 1.2em; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { font-size: 1.05em; margin-top: 1.2em; }
  p, li { font-size: 0.92em; color: #333; }
  ul { padding-left: 1.2em; }
  ol { padding-left: 1.5em; }
  li { margin-bottom: 4px; }
  hr { border: none; border-top: 1px solid #ccc; margin: 1em 0; }
  blockquote {
    border-left: 3px solid #2d6a4f;
    padding-left: 12px;
    margin-left: 0;
    color: #555;
    font-style: italic;
  }
  table { border-collapse: collapse; width: 100%; font-size: 0.88em; margin: 12px 0; }
  td, th { border: 1px solid #ccc; padding: 6px 10px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; }
  code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-size: 0.85em; }
  .footer {
    margin-top: 2em; font-size: 0.8em; color: #888;
    border-top: 1px solid #eee; padding-top: 0.5em;
  }
  .line { border-bottom: 1px solid #999; margin: 8px 0; }
  .sig-line { border-bottom: 1px solid #999; display: inline-block; min-width: 200px; padding-bottom: 2px; margin: 4px 0; }
</style>
`;

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mdToHtml(md) {
  const lines = md.split('\n');
  let html = '';
  let inList = false;
  let inTable = false;
  let tableHtml = '';

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Horizontal rules
    if (/^---+\s*$/.test(trimmed)) {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inTable) { html += '</table>\n'; inTable = false; }
      html += '<hr>';
      continue;
    }

    // Headings
    const hMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inTable) { html += '</table>\n'; inTable = false; }
      const level = hMatch[1].length;
      const text = escapeHtml(hMatch[2]);
      html += `<h${level}>${text}</h${level}>`;
      continue;
    }

    // Table rows
    if (trimmed.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        const cols = trimmed.split('|').filter(c => c.trim()).length;
        tableHtml = '<table>\n';
        // Header row
        const cells = trimmed.split('|').filter(c => c.trim());
        tableHtml += '<tr>' + cells.map(c => '<th>' + escapeHtml(c.trim()) + '</th>').join('') + '</tr>\n';
      } else if (/^\|[\s:-]+\|/.test(trimmed)) {
        // separator row - skip
        continue;
      } else {
        const cells = trimmed.split('|').filter(c => c.trim());
        tableHtml += '<tr>' + cells.map(c => {
          const cell = escapeHtml(c.trim());
          if (cell.match(/^___.*___$/)) return '<td style="border-bottom:1px solid #999;min-width:120px;">' + cell.replace(/^___/, '').replace(/___$/, '') + '</td>';
          return '<td>' + cell + '</td>';
        }).join('') + '</tr>\n';
      }
      // Check if next line is also a table row
      if (i + 1 >= lines.length || !lines[i+1].trim().startsWith('|')) {
        html += tableHtml + '</table>\n';
        tableHtml = '';
        inTable = false;
      }
      continue;
    }

    // Unordered list items
    if (trimmed.match(/^[-*]\s/)) {
      if (inTable) { html += '</table>\n'; inTable = false; }
      if (!inList) { html += '<ul>\n'; inList = true; }
      const text = escapeHtml(trimmed.replace(/^[-*]\s+/, ''));
      // Checkboxes
      if (text.match(/^\[.\]/)) {
        const checked = text.startsWith('[x') || text.startsWith('[X');
        const label = text.replace(/^\[.\]/, '').trim();
        html += `<li><span style="display:inline-block;width:12px;height:12px;border:1px solid #666;border-radius:2px;margin-right:6px;vertical-align:middle;${checked ? 'background:#2d6a4f;' : ''}"></span>${label}</li>\n`;
      } else {
        html += `<li>${text}</li>\n`;
      }
      continue;
    }

    // Ordered list items
    if (trimmed.match(/^\d+\.\s/)) {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inTable) { html += '</table>\n'; inTable = false; }
      const text = escapeHtml(trimmed.replace(/^\d+\.\s+/, ''));
      html += `<p>${text}</p>\n`;
      continue;
    }

    // Paragraph
    if (trimmed) {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inTable) { html += '</table>\n'; inTable = false; }
      // Bold/italic inline
      let text = escapeHtml(trimmed);
      text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/_(.+?)_/g, '<em>$1</em>');
      html += `<p>${text}</p>\n`;
      continue;
    }

    // Empty line
    if (!trimmed) {
      if (inList) { html += '</ul>\n'; inList = false; }
      if (inTable) { html += '</table>\n'; inTable = false; }
    }
  }

  if (inList) html += '</ul>\n';
  if (inTable) html += '</table>\n';

  return html;
}

files.forEach(file => {
  const md = fs.readFileSync(path.join(toolkitDir, file), 'utf-8');
  const name = file.replace('.md', '');
  
  const firstLine = md.split('\n')[0].replace(/^#+\s*/, '') || name;
  // Convert hyphenated filename to title
  const title = firstLine || name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const body = mdToHtml(md);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>${style}</head><body>${body}<div class="footer">Unburied Tools — Peer Support Operations Toolkit</div></body></html>`;

  const htmlPath = path.join(outDir, `${name}.html`);
  fs.writeFileSync(htmlPath, html);
  console.log(`✓ Created: products/${name}.html`);
});

console.log('\nDone. All HTML files generated.');
