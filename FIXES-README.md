# QuizKnight Challenge Fixes

This document explains the fixes made to resolve multiple issues in the QuizKnight application.

## 1. Quiz Submission Issues

**Problem:** Quiz submission was failing with the error: `Error submitting quiz: TypeError: Failed to execute 'fetch' on 'Window': '/api/quizzes/9/results' is not a valid HTTP method.`

**Root Cause:**
- The `apiRequest` function in `queryClient.ts` expected parameters in one format, but was being called with a different format in `quiz-take.tsx`.
- The function signature had `method` as the first parameter and `url` as the second, but it was being called with the URL first and a full options object second.

**Fix:**
1. Updated the `apiRequest` function in `queryClient.ts` to accept parameters in a more intuitive order:
   ```typescript
   // New signature
   export async function apiRequest(
     url: string, 
     options: {
       method: string,
       data?: unknown | undefined,
     }
   ): Promise<Response>
   ```

2. Updated the `submitQuiz` function in `quiz-take.tsx` to call the function correctly:
   ```typescript
   const result = await apiRequest(
     `/api/quizzes/${id}/results`, 
     {
       method: 'POST',
       data: requestData
     }
   );
   ```

3. Added detailed logging to track the submission process and help with debugging.

## 2. Tab Switching Detection Issues

**Problem:** Tab switching detection wasn't working correctly - it wasn't showing the correct warning messages and wasn't counting tab switches properly.

**Root Cause:**
- Conflicts between the visibility change handling and the hotkey blocking
- Race conditions when updating state variables
- Improper ordering of event handling

**Fix:**
1. Completely rewrote the visibility change handler with better logging:
   ```typescript
   const handleVisibilityChange = () => {
     console.log("Visibility change detected, document.hidden:", document.hidden);
     
     // Exit early checks
     // ...
     
     if (document.hidden) {
       console.log("Tab hidden, storing timestamp");
       setIsProcessingVisibility(true);
       setTabSwitchTimestamp(Date.now());
     } else if (tabSwitchTimestamp) {
       // Tab visible again, process the switch
       // ...
     }
   };
   ```

2. Improved the warning messages to clearly indicate tab switching:
   ```typescript
   toast({
     title: `Tab Switching Warning ${newWarnings}/3`,
     description: `Tab switching detected. ${3 - newWarnings} warnings left before automatic submission.`,
     variant: "destructive",
   });
   ```

3. Used refs (`warningsRef`, `isActiveRef`, `submittingRef`) to prevent race conditions

4. Better separation between the visibility change handling and hotkey blocking:
   ```typescript
   // Skip this check if we're currently processing a visibility change
   if (isProcessingVisibility) {
     console.log("Skipping hotkey check during visibility processing");
     return;
   }
   ```

## 3. Database Schema Issues

**Problem:** Database queries were failing due to missing columns in the achievements table.

**Root Cause:**
- The database schema was missing the `icon_url`/`iconUrl` and `created_at`/`createdAt` columns
- Code was using camelCase names while database had snake_case

**Fix:**
1. Created a comprehensive migration script (`fix_achievements_schema_full.sql`) that:
   - Adds both `icon_url` and `iconUrl` columns if missing
   - Adds both `created_at` and `createdAt` columns if missing
   - Synchronizes values between snake_case and camelCase versions

2. Enhanced the schema fix script to automatically run during application startup

## 4. Client Build Issues

**Problem:** Client build was failing due to missing theme.json file.

**Fix:**
1. Improved the PowerShell startup script (`start-app.ps1`) to:
   - Automatically create the theme.json file if missing
   - Run database schema fixes
   - Handle port conflicts properly
   - Improve error handling and logging

## How to Use These Fixes

Simply run the `start-app.ps1` script to start the application with all fixes applied:

```powershell
.\start-app.ps1
```

The script will:
1. Create the theme.json file if it's missing
2. Run the database schema fixes
3. Close any processes using the required ports
4. Start both the server and client with proper delays

## Testing the Fixes

After applying these fixes:
1. The quiz submission should work correctly
2. Tab switching detection should properly count and display warnings
3. The database queries should work without errors
4. The client should build and run without issues

## Debugging

If issues persist, check the browser console for detailed logs that have been added to:
- The visibility change handler
- The quiz submission process
- The hotkey detection handler 