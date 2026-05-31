#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const productsDir = path.join(__dirname, 'products');
const files = fs.readdirSync(productsDir).filter(f => f.endsWith('.html'));

const chromiumPath = '/Users/agentparadise/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

// Serve locally
const server = http.createServer((req, res) => {
  const filePath = path.join(productsDir, req.url);
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end(); return; }
  const content = fs.readFileSync(filePath, 'utf-8');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(content);
});

server.listen(18002, async () => {
  console.log('Serving on port 18002');
  
  for (const f of files) {
    const name = f.replace('.html', '');
    const outPath = path.join(productsDir, `${name}.pdf`);
    const url = `http://127.0.0.1:18002/${f}`;
    
    console.log(`[${files.indexOf(f)+1}/${files.length}] ${name}...`);
    
    // Use chromiums headless PDF printing
    const cmd = `"${chromiumPath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outPath}" "${url}" 2>/dev/null`;
    execSync(cmd, { timeout: 30000, stdio: 'pipe' });
    
    if (fs.existsSync(outPath)) {
      console.log(`  → ${name}.pdf (${Math.round(fs.statSync(outPath).size / 1024)} KB)`);
    } else {
      console.log(`  → Failed to generate ${name}.pdf`);
    }
  }
  
  server.close();
  console.log('\nAll done!');
});
