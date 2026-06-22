const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === 'out' || file === '.next') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('/restaurant/')) {
          console.log(`Found in ${fullPath}:${index+1} -> ${line.trim()}`);
        }
      });
    }
  }
}

searchDir('C:/Users/DELL 7390 2in1/.gemini/antigravity/scratch/food-at-door/app');
