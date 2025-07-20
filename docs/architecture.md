# ClipOne - Technical Architecture

## System Overview
ClipOne is built on Tauri framework combining React frontend with Rust backend for optimal performance and native OS integration.

```
Frontend (React + TypeScript) ↔ Tauri Core ↔ Backend (Rust)
                                      ↕
                              Local Storage (SQLite)
```

## Frontend Stack
- **React 18** + **TypeScript** - UI framework with type safety
- **React Router v7** - Routing with data loaders
- **Tailwind CSS** + **shadcn/ui** - Styling and components
- **Vite** - Build tool
- **Biome** - Linting and formatting

## Component Structure
```
src/
├── components/
│   ├── home/           # Home page components
│   ├── actions/        # Action settings components
│   └── ui/             # shadcn/ui components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── contexts/           # React contexts
```

## Backend Stack
- **Tauri v2** - Desktop app framework
- **Rust** - System programming language
- **SQLx** - Async SQLite driver
- **Serde** - Serialization
- **Tokio** - Async runtime

## Rust Command Structure
```
src-tauri/src/
├── commands/
│   ├── clipboard.rs    # Clipboard operations
│   ├── history.rs      # History management
│   └── settings.rs     # Settings management
├── lib.rs
└── main.rs
```

## Key Tauri Commands
```rust
// Clipboard operations
get_clipboard_text() -> String
set_clipboard_text(text: String)
start_clipboard_monitoring()
stop_clipboard_monitoring()

// History management
get_clipboard_history(limit: Option<usize>) -> Vec<ClipboardItem>
save_clipboard_item(item: ClipboardItem)
search_history(query: String) -> Vec<ClipboardItem>
clear_clipboard_history()

// Settings
get_app_settings() -> AppSettings
save_app_settings(settings: AppSettings)
```

## Data Flow
```
Clipboard Change → Rust Monitor → SQLite → Event → React Update
User Action → React → Tauri Command → Rust → SQLite
```

## Performance Optimizations
### Frontend
- React.memo for expensive components
- useCallback for event handlers
- Virtual scrolling for large lists
- Debounced search

### Backend
- Async file I/O
- Connection pooling
- Background cleanup
- Minimal memory usage

## Build Targets
- Windows (x86_64-pc-windows-msvc)
- macOS (x86_64-apple-darwin) 
- Linux (x86_64-unknown-linux-gnu)