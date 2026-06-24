const fs = require('fs');
const path = require('path');

function searchFiles(dir, query, excludeDirs = ['node_modules', '.next', '.git']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        results = results.concat(searchFiles(fullPath, query, excludeDirs));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(query.toLowerCase())) {
            results.push(`${fullPath}:${i + 1}: ${lines[i].trim()}`);
          }
        }
      }
    }
  }
  return results;
}

console.log("Searching in Admin Panel...");
console.log(searchFiles('../admin-panel', 'supportTickets').join('\n'));
console.log(searchFiles('../admin-panel', 'collection(db').filter(l => l.includes('support')).join('\n'));

