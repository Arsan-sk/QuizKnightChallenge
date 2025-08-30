# PowerShell script to commit our changes
Set-Location -Path "client"
git add src/components/quiz/Question.tsx
git add src/components/ui/question-transition.tsx
git add src/pages/quiz-take.tsx
git add src/lib/utils.ts
git add src/pages/quiz-review.tsx
git commit -m "Fix quiz UI issues: implement focus retention, time formatting, and functional state updates"
git push origin image-upload-start 