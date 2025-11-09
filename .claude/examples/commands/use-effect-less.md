Refactor client components to minimize unnecessary `useEffect` and prefer derived values, event handlers, and modern subscriptions.

Steps:

1) Scan for Effects
   ```bash
   rg -n "useEffect\s*\(" app components hooks
   ```

2) Triage by category
   - Rendering transforms → derive during render
   - Event-specific logic (POST, navigation, notifications) → move to handlers
   - Expensive pure calcs → `useMemo` if profiling warrants
   - External subscriptions → prefer `useSyncExternalStore`
   - Data fetching → keep Effect but ensure cleanup to avoid races

3) Apply targeted refactors
   - Replace redundant state+Effect with derived values
   - Use `key` to reset subtrees on identity change
   - Lift state to parent to avoid cross-component sync
   - Collapse chained Effects; compute next state in handler

4) Validate
   - Typecheck: `bun run typecheck`
   - Lint: `bun run lint`
   - Build: `bun run build`

Notes:
- Reference the agent: `.claude/agents/use-effect-less.md`
- Reference guide: `.claude/agents/docs/use-effect-less-ref.md`

