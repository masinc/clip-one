# CLAUDE.md

## 🚨 Critical Rules
- **NEVER push to `main`** - Use PRs only
- **Start with Issue** - `gh issue create --title "Japanese title" --label "priority: medium"`
- **Use TodoWrite** - Break down tasks and update status

## Workflow
1. `gh issue develop <issue-number> --checkout`
2. Update TODO (pending → in_progress → completed)  
3. `gh pr create --label "priority: medium"`
4. Update CHANGELOG+version before merge (package.json + Cargo.toml)
5. `gh pr merge <pr-number> --squash --delete-branch`

## Labels
- **Priority**: high/medium/low (required)
- **Area**: clipboard/ui/core
- **Type**: bug/enhancement/documentation

## Commands
```bash
pnpm tauri dev          # Development
npx biome check .       # Code quality
pnpm tsc --noEmit      # Type check
pnpm build             # Build
cargo check            # Rust check (from src-tauri)
```

## Tech Stack
**ClipOne** - Tauri + React + TypeScript + Rust clipboard manager

## Documentation
- [@README.md](/README.md) - Project overview
- [@docs/specification.md](/docs/specification.md) - Application spec
- [@docs/architecture.md](/docs/architecture.md) - Technical architecture
- [@docs/development-workflow.md](/docs/development-workflow.md) - Detailed workflow

## Documentation (Japanese)
- [@docs/specification.ja.md](/docs/specification.ja.md) - アプリケーション仕様書
- [@docs/architecture.ja.md](/docs/architecture.ja.md) - 技術アーキテクチャ
- [@docs/development-workflow.ja.md](/docs/development-workflow.ja.md) - 開発ワークフロー

## Pre-PR Checklist
- [ ] `npx biome check .` (0 errors)
- [ ] `pnpm tsc --noEmit`
- [ ] `cargo test`
- [ ] `pnpm build`

## Key Files
- `src/` - React components, hooks, types, utils
- `src-tauri/src/commands/` - Rust Tauri commands
- `package.json` + `src-tauri/Cargo.toml` - Dependencies/versions