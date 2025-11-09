Create a pull request with auto-generated title and description from git commits.

Usage: `/create-pr [title]`
- Without arguments: Auto-generates PR title and description from commits
- With title: Uses provided title and auto-generates description

Execute the following workflow:

1. **Verify Git State**
   ```bash
   # Check current branch
   git branch --show-current

   # Check if branch has commits ahead of main
   git rev-list --count main..HEAD

   # Check if there are uncommitted changes
   git status --porcelain
   ```
   - Ensure we're not on main/master branch
   - Verify there are commits to create PR from
   - Warn if there are uncommitted changes

2. **Analyze Commits**
   ```bash
   # Get commit log from current branch divergence
   git log main..HEAD --oneline

   # Get detailed commit messages
   git log main..HEAD --pretty=format:"%h %s%n%b"

   # Get file change statistics
   git diff main...HEAD --stat
   ```
   - Extract commit messages
   - Identify patterns (feat, fix, refactor, docs, etc.)
   - Categorize file changes (frontend, backend, tests, docs)

3. **Generate PR Title**
   - If title provided: Use as-is
   - If not provided: Auto-generate from commits
     - Single commit: Use commit message
     - Multiple commits: Summarize purpose (e.g., "Add user authentication", "Fix payment processing bugs")
     - Use conventional commit format if commits follow convention
   - Keep title under 72 characters

4. **Generate PR Description**
   ```markdown
   ## Summary
   [1-3 sentence overview of what this PR does]

   ## Changes
   - [List of key changes, derived from commits]
   - [Organized by category if multiple areas affected]

   ## Type of Change
   - [ ] Bug fix (non-breaking change)
   - [ ] New feature (non-breaking change)
   - [ ] Breaking change
   - [ ] Documentation update
   - [ ] Refactoring
   - [ ] Performance improvement

   ## Testing
   - [ ] Tests added/updated
   - [ ] All tests passing
   - [ ] Manual testing completed

   ## Checklist
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No breaking changes (or documented)

   ## Related Issues
   [Auto-detect from commit messages: "Closes #123", "Fixes #456"]
   ```

5. **Detect Related Issues**
   - Scan commit messages for issue references
   - Look for: "fixes #N", "closes #N", "resolves #N", "#N"
   - Extract issue numbers for linking

6. **Push Branch to Remote**
   ```bash
   # Get current branch name
   BRANCH=$(git branch --show-current)

   # Check if remote branch exists
   git ls-remote --heads origin $BRANCH

   # Push to remote (create tracking branch if needed)
   git push -u origin $BRANCH
   ```
   - Create remote branch if it doesn't exist
   - Push all commits
   - Set up tracking

7. **Create Pull Request**
   ```bash
   # Create PR with gh CLI
   gh pr create \
     --title "$TITLE" \
     --body "$DESCRIPTION" \
     --base main
   ```
   - Use GitHub CLI (`gh`) to create PR
   - Set base branch (usually main)
   - Apply description with markdown formatting

8. **Auto-Label PR** (Optional)
   Based on file changes, suggest labels:
   ```bash
   # Add labels based on changes
   gh pr edit --add-label "frontend" # if UI files changed
   gh pr edit --add-label "backend"  # if API files changed
   gh pr edit --add-label "tests"    # if test files changed
   gh pr edit --add-label "docs"     # if docs changed
   ```
   - Analyze changed files
   - Apply relevant labels if they exist in repo

9. **Link Related Issues**
   ```bash
   # Link issues found in commits
   # GitHub auto-links "Closes #N" in description
   ```
   - Issues are auto-linked via description keywords

10. **Output PR Details**
    Display created PR information:
    ```markdown
    ✅ Pull Request Created

    **Title**: [PR Title]
    **URL**: [PR URL]
    **Branch**: [branch-name] → main
    **Commits**: X commits
    **Files Changed**: X files
    **Labels**: [list of applied labels]
    **Linked Issues**: #123, #456

    Next steps:
    - Request review with: gh pr review --request @reviewer
    - View PR: gh pr view
    - Edit PR: gh pr edit
    ```

**Error Handling**
- If on main branch: "Cannot create PR from main branch. Create a feature branch first."
- If no commits ahead: "No commits to create PR from. Make changes and commit first."
- If uncommitted changes: "Warning: You have uncommitted changes. Commit or stash them first."
- If gh CLI not installed: "GitHub CLI (gh) is required. Install with: brew install gh"
- If not authenticated: "Run 'gh auth login' to authenticate with GitHub"

**Best Practices**
- Follow conventional commit format for better auto-generated descriptions
- Keep commits focused and atomic for clearer PR descriptions
- Use commit message bodies for additional context that flows to PR description
- Reference issue numbers in commit messages (#123) for auto-linking
