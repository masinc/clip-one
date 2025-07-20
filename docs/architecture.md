# ClipOne - Architecture

## Stack
**Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui + Vite + Biome  
**Backend**: Tauri v2 + Rust + SQLx + Tokio

## Structure
```
Frontend (React) ↔ Tauri Core ↔ Backend (Rust) ↔ SQLite
```

## Directories
```
src/
├── components/         # React components
├── hooks/              # Custom hooks
├── types/              # TypeScript types
└── utils/              # Utilities

src-tauri/src/
├── commands/           # Tauri commands
│   ├── clipboard.rs
│   ├── history.rs
│   └── settings.rs
└── main.rs
```

## Key Commands
```rust
get_clipboard_text() -> String
set_clipboard_text(text: String)
start_clipboard_monitoring()
get_clipboard_history(limit: Option<usize>) -> Vec<ClipboardItem>
save_clipboard_item(item: ClipboardItem)
search_history(query: String) -> Vec<ClipboardItem>
```

## Data Flow
```
Clipboard Change → Rust Monitor → SQLite → Event → React Update
```

## Build Targets
- Windows (x86_64-pc-windows-msvc)
- macOS (x86_64-apple-darwin) 
- Linux (x86_64-unknown-linux-gnu)