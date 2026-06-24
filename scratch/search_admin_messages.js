const fs = require('fs');
const path = require('path');

const adminApp = fs.readFileSync('../admin-panel/src/App.jsx', 'utf8');
const lines = adminApp.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('messages') && (lines[i].includes('collection') || lines[i].includes('doc'))) {
    console.log(`admin-panel/src/App.jsx:${i + 1}: ${lines[i].trim()}`);
  }
}
