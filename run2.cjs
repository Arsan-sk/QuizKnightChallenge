const fs = require('fs');
const file = 'client/src/pages/quiz-take.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('import { QuizReview } from "@/components/quiz/QuizReview";', 'import { SharedQuizReview } from "@/components/shared/SharedQuizReview";');

content = content.replace(
  /<QuizReview\s*questions={questions[\s\S]*?onClose={\(\) => setShowReview\(false\)}\s*\/>/,
  `<SharedQuizReview
                 report={{
                   username: user ? (user.username || 'You') : 'You',
                   score: quizResult.score,
                   correctAnswers: quizResult.correctAnswers,
                   timeTaken: quizResult.timeTaken,
                   answers: answers,
                   tabSwitchCount: 0,
                   copyPasteAttempts: copyPasteAttempts,
                   proctoringFlags: warnings
                 }}
                 questions={questions as QuestionType[]}
                 onClose={() => setShowReview(false)}
               />`
);

fs.writeFileSync(file, content);
