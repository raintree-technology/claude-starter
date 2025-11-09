Run the complete database migration workflow with Drizzle ORM and Supabase.

Execute the following migration steps:

1. **Review Current Schema**
   - Read `lib/db/schema/*.ts` files
   - Identify any pending changes
   - Show summary of tables that will be affected

2. **Generate Migration**
   ```bash
   bun run drizzle-kit generate
   ```
   - Drizzle will detect schema changes
   - Creates SQL migration file in `lib/db/migrations/`
   - Show the generated SQL for review

3. **Review Generated Migration**
   - Read the newly generated migration file
   - Check for:
     - Destructive operations (DROP, ALTER with data loss)
     - Missing indexes on foreign keys
     - Default values for NOT NULL columns
   - Warn about potential issues

4. **Ask for Confirmation**
   Display the migration SQL and ask:
   "This migration will be applied to the database. Review the changes above. Continue? (yes/no)"

5. **Apply Migration**
   If confirmed:
   ```bash
   bun run drizzle-kit migrate
   ```
   - Applies migration to database
   - Reports success/failure

6. **Sync TypeScript Types**
   ```bash
   bun run types:generate
   ```
   - Generates updated Supabase types
   - Ensures TypeScript types match database schema

7. **Verify Types**
   ```bash
   bun run typecheck
   ```
   - Checks for type errors after migration
   - Reports any issues

8. **Final Report**
   - Migration file created: `lib/db/migrations/<timestamp>_migration.sql`
   - Tables affected: [list]
   - Types synced: ✅/❌
   - Type check passed: ✅/❌

Safety notes:
- Always review generated SQL before applying
- Test migrations on development/staging first
- Back up production data before running migrations
- For production: use `supabase db push` with caution
