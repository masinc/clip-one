# Development Workflow

This project follows **GitHub Flow** with strict branch protection and comprehensive Issue tracking.

## Branch Protection Rules
- **NEVER push directly to `main`**
- **ALL changes via pull requests**
- **Feature branches from `main`**

## Development Process

### 0. Pre-work Setup
```bash
git status
git pull origin main  # Ensure main is up-to-date
```

### 1. Create Issue
```bash
gh issue create --title "Japanese title" --body "Description" --label "priority: medium,enhancement,ui"
```

### 2. Create TODO List
Use TodoWrite tool to break down Issue into actionable tasks:
- Development workflow steps
- Feature implementation tasks
- Documentation updates
- Testing tasks

### 3. Create Branch
```bash
gh issue develop <issue-number> --checkout
```

### 4. Development Work
- Update TODO status (pending → in_progress → completed)
- Follow commit message format:
```
type(scope): Japanese description

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 5. Create Pull Request
```bash
gh pr create --title "Japanese title" --body "PR description" --label "priority: medium,enhancement"
```

**PR Template:**
```markdown
## 概要
Brief description in Japanese

## 関連 Issue
Closes #[issue-number]

## 変更内容
- Change 1
- Change 2

## テスト
- [ ] Code quality check
- [ ] Type check passed
- [ ] Build successful

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### 6. Pre-merge Requirements
**After review approval, before merge:**
- Update CHANGELOG.md
- Update version in both package.json AND Cargo.toml
- Ensure all tests pass

### 7. Merge
```bash
gh pr merge <pr-number> --squash --delete-branch
```

### 8. Post-merge Cleanup
```bash
git checkout main
git fetch origin
git reset --hard origin/main
```

## Required Labels
- **Priority**: high/medium/low (required)
- **Area**: clipboard/ui/core
- **Type**: bug/enhancement/documentation

## Language Requirements
- **All Issues, PRs, commit messages in Japanese**
- **Always create and update TODO tasks**

## Quality Checklist
**Before creating PR:**
- [ ] `npx biome check .` (0 errors)
- [ ] `pnpm tsc --noEmit`
- [ ] `cargo test` (from src-tauri)
- [ ] `pnpm build`
- [ ] Manual testing

## Version Management
- **PATCH (0.0.x)**: Bug fixes, docs
- **MINOR (0.x.0)**: New features, improvements  
- **MAJOR (x.0.0)**: Breaking changes (avoid during development)

## Area Label Usage
- **clipboard**: Clipboard features, history, monitoring
- **ui**: User interface, screens, usability
- **core**: App settings, file processing, system integration

## Emergency Procedures

### Hotfix Process
1. Create `priority: high` Issue
2. Create hotfix branch from `main`
3. Minimal fix implementation
4. Fast-track PR review
5. Immediate merge and deploy

### Rollback Process
1. Create rollback Issue
2. `git revert <commit-hash>`
3. Fast-track review
4. Immediate rollback deploy