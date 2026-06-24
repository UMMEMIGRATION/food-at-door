const fs = require('fs');
const lines = fs.readFileSync('../restaurant-partner-app/src/App.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes("currentRoute === '/dashboard'")) console.log(i+1 + ': ' + l.trim());
});
