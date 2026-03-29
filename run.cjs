const fs = require('fs');
const file = 'client/src/components/analytics/StudentReportTable.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');
const start = 184; // 0-based is 183 actually ? wait, grep showed 185, so 0-indexed is 184
lines.splice(183, 339 - 184 + 1, '              <SharedQuizReview ', '                report={selectedStudent} ', '                questions={questions} ', '                onClose={() => setSelectedStudent(null)} ', '              />');
lines.unshift('import { SharedQuizReview } from "@/components/shared/SharedQuizReview";');
fs.writeFileSync(file, lines.join('\n'));
