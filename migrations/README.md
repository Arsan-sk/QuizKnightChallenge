This directory contains SQL migrations used to evolve the database schema.

0003_update_question_points_default.sql
- Sets the default `points` in `questions` to 2 and updates existing NULL values to 2.

How to apply:

- Preferred (no interactive password prompt): Use the included Node helper which uses `DATABASE_URL`.

  ```powershell
  # run from repository root
  node scripts/runMigrationFile.js migrations/0003_update_question_points_default.sql
  ```

- Alternative: use `psql` directly. If your `$env:DATABASE_URL` contains special characters/space in username, psql may prompt for password or fail. You can set `PGPASSWORD` temporarily in PowerShell:

  ```powershell
  $env:PGPASSWORD = 'your_password'
  psql -h localhost -p 5432 -U "YourUsername" -d YourDatabaseName -f migrations/0003_update_question_points_default.sql
  Remove-Item Env:PGPASSWORD
  ```

  Or use a URL-encoded connection string and quote it for PowerShell:

  ```powershell
  psql "$env:DATABASE_URL" -f migrations/0003_update_question_points_default.sql
  ```

If you use a migration runner in CI or other tooling, prefer that to keep migration bookkeeping consistent.

IMPORTANT: destructive cleanup migration
- The file `migrations/0004_remove_students.sql` permanently deletes all users with `role = 'student'` and related rows (results, friendships, user achievements). BACKUP your database before running.

Example backup (pg_dump):

```powershell
# create a SQL dump of the entire database (replace connection details as needed)
pg_dump "$env:DATABASE_URL" -F c -b -v -f backup_before_remove_students.dump
```

Run the destructive migration only if you have a verified backup.
