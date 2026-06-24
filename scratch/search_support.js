const fs = require('fs');
const path = require('path');

function searchFiles(dir, query, excludeDirs = ['node_modules', '.next', '.git']) {
  let results = [];
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

console.log("Searching for 'Initiating live chat support connection'...");
console.log(searchFiles('.', 'Initiating live chat support connection').join('\n'));

console.log("\nSearching for 'supportTickets'...");
console.log(searchFiles('.', 'supportTickets').join('\n'));

console.log("\nSearching for 'chat'...");
console.log(searchFiles('.', 'chat').filter(l => l.includes('components') || l.includes('support')).slice(0, 20).join('\n'));
