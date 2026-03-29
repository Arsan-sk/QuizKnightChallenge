const fs = require('fs');
const file = 'client/src/components/shared/SharedQuizReview.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('return ${mins}m ${secs}s;', 'return `${mins}m ${secs}s`;');
content = content.replace('questions is missing, assuming unpassed parameter', '\"questions is missing, assuming unpassed parameter\"');

fs.writeFileSync(file, content);
