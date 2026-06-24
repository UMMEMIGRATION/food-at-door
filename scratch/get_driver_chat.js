const fs = require('fs');
const lines = fs.readFileSync('../driver-app/src/App.tsx', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('supportStep === \'chat\'')) {
    console.log("Found at line: " + (i+1));
    for(let j = Math.max(0, i-5); j < Math.min(lines.length, i+50); j++) {
      console.log(`${j+1}: ${lines[j]}`);
    }
    break;
  }
}
