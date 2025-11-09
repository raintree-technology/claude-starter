Generate and validate Supabase TypeScript types.

Run the following workflow:

1. Generate types from Supabase remote schema:
   ```bash
   bun run types:generate
   ```

2. Verify the generated types match the remote schema:
   ```bash
   bun run types:check
   ```

3. Run TypeScript type checking on the entire codebase:
   ```bash
   bun run typecheck
   ```

4. If there are type errors:
   - Show the errors clearly
   - Identify which files need updating
   - Suggest fixes for common type drift issues

5. If types are out of sync:
   - Run `bun run types:generate` again
   - Re-run `bun run typecheck`
   - Report the results

Report:
- Whether types are in sync
- Any type errors that need fixing
- Files that need manual updates
