# Development Workflow

## Rules
- **NEVER push to `main`** - PRs only
- **Start with Issue** - `gh issue create --title "Japanese title" --label "priority: medium"`
- **Use TodoWrite** - Break down tasks

## Process
1. `gh issue develop <issue-number> --checkout`
2. Update TODO (pending → in_progress → completed)
3. `gh pr create --label "priority: medium"`
4. Update CHANGELOG+version before merge (package.json + Cargo.toml)
5. `gh pr merge <pr-number> --squash --delete-branch`

## Labels
- **Priority**: high/medium/low (required)
- **Area**: clipboard/ui/core
- **Type**: bug/enhancement/documentation

## Pre-PR Checklist
- [ ] `npx biome check .` (0 errors)
- [ ] `pnpm tsc --noEmit`
- [ ] `cargo test`
- [ ] `pnpm build`

## Commit Format
```
type(scope): Japanese description

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```