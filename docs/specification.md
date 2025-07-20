# ClipOne - Specification

## Overview
Desktop clipboard history manager built with Tauri + React + TypeScript + Rust.

**Users**: Developers, writers, office workers

## Core Features
- Automatic clipboard monitoring
- History storage/display  
- Search (substring match)
- Favorites
- Export/Import (JSON, CSV)
- Local SQLite storage

## Data Schema
```sql
CREATE TABLE clipboard_items (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text/plain',
    timestamp INTEGER NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    source_app TEXT
);
```

## Types
```typescript
interface ClipboardItem {
  id: string;
  content: string;
  timestamp: number;
  is_favorite: boolean;
  source_app?: string;
}
```