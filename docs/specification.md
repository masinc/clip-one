# ClipOne - Application Specification

## Overview
ClipOne is a desktop clipboard history management application built with Tauri + React + TypeScript + Rust.

**Target Users**: Developers, writers, office workers who frequently use copy & paste

## Core Features

### Clipboard Monitoring & History
- Automatic clipboard change detection
- History storage and display
- Real-time synchronization

### History Management
- Timeline-based history view
- Search functionality (substring match)
- Delete individual items or clear all
- Favorites feature

### Data Operations
- Local SQLite storage
- Export/Import (JSON, CSV)
- Settings persistence

## Technical Architecture

### Data Storage
```
~/.clipone/
├── clipone.db       # SQLite (clipboard history)
└── settings.json    # App settings
```

### Database Schema
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

### Core Data Types
```typescript
interface ClipboardItem {
  id: string;
  content: string;
  timestamp: number;
  is_favorite: boolean;
  source_app?: string;
}

interface AppSettings {
  max_history_items: number;
  auto_start: boolean;
  theme: 'light' | 'dark';
  hotkeys: Record<string, string>;
}
```