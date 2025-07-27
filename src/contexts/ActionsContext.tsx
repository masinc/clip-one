import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import {
  backendToFrontend,
  frontendToBackend,
  getActions,
  resetActions as resetActionsBackend,
  saveActions as saveActionsBackend,
} from "@/types/actionsApi";
import type { ContentCategory } from "@/utils/contentTypeMapper";

// アクション型定義
export interface GlobalAction {
  id: string;
  label: string;
  command?: string;
  description?: string;
  icon: string;
  enabled: boolean;
  priority: number;
  keywords: string[];
  isCustom: boolean;
  type: "url" | "command" | "code" | "built-in";
  allowedContentTypes: ContentCategory[];
}

interface ActionsContextType {
  actions: GlobalAction[];
  isLoading: boolean;
  setActions: (actions: GlobalAction[]) => void;
  updateAction: (action: GlobalAction) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  addAction: (action: GlobalAction) => Promise<void>;
  toggleAction: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  reorderActions: (activeId: string, overId: string) => Promise<void>;
}

const ActionsContext = createContext<ActionsContextType | undefined>(undefined);

// デフォルトアクション（組み込み）
const defaultActions: GlobalAction[] = [
  // 基本アクション
  {
    id: "copy",
    label: "クリップボードにコピー",
    icon: "Copy",
    enabled: true,
    priority: 1,
    keywords: ["copy", "コピー", "clipboard"],
    isCustom: false,
    type: "built-in",
    allowedContentTypes: ["text", "url", "html", "image", "files"],
  },
  {
    id: "search",
    label: "Web検索",
    command: "https://www.google.com/search?q=CONTENT",
    icon: "Search",
    enabled: true,
    priority: 2,
    keywords: ["search", "検索", "google", "web"],
    isCustom: true,
    type: "url",
    allowedContentTypes: ["text", "url"],
  },
  {
    id: "translate",
    label: "翻訳",
    command: "https://translate.google.com/?text=CONTENT",
    icon: "Languages",
    enabled: true,
    priority: 3,
    keywords: ["translate", "翻訳", "language", "言語"],
    isCustom: true,
    type: "url",
    allowedContentTypes: ["text"],
  },

  // AI関連
  {
    id: "chatgpt",
    label: "ChatGPTに送信",
    command: "https://chat.openai.com/?q=CONTENT",
    icon: "Bot",
    enabled: true,
    priority: 4,
    keywords: ["chatgpt", "ai", "gpt", "openai", "人工知能"],
    isCustom: true,
    type: "url",
    allowedContentTypes: ["text"],
  },
  {
    id: "claude",
    label: "Claudeに送信",
    command: "https://claude.ai/?q=CONTENT",
    icon: "Brain",
    enabled: true,
    priority: 5,
    keywords: ["claude", "ai", "anthropic", "人工知能"],
    isCustom: true,
    type: "url",
    allowedContentTypes: ["text"],
  },
  {
    id: "summarize",
    label: "AI要約",
    description: "AIによるテキスト要約（未実装）",
    icon: "Sparkles",
    enabled: false,
    priority: 6,
    keywords: ["summarize", "要約", "summary", "ai"],
    isCustom: true,
    type: "built-in",
    allowedContentTypes: ["text"],
  },

  // Web・URL関連
  {
    id: "open-url",
    label: "URLを開く",
    icon: "ExternalLink",
    enabled: true,
    priority: 2,
    keywords: ["url", "open", "開く", "link", "リンク"],
    isCustom: true,
    type: "built-in",
    allowedContentTypes: ["url"],
  },
  {
    id: "qr-code",
    label: "QRコード生成",
    command: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=CONTENT",
    icon: "QrCode",
    enabled: true,
    priority: 8,
    keywords: ["qr", "qrcode", "barcode", "code"],
    isCustom: true,
    type: "url",
    allowedContentTypes: ["text", "url"],
  },

  // テキスト処理
  {
    id: "edit",
    label: "編集",
    description: "テキスト編集（未実装）",
    icon: "Edit3",
    enabled: false,
    priority: 11,
    keywords: ["edit", "編集", "modify", "変更"],
    isCustom: true,
    type: "built-in",
    allowedContentTypes: ["text"],
  },
  {
    id: "uppercase",
    label: "大文字に変換",
    command: "navigator.clipboard.writeText(CONTENT.toUpperCase())",
    icon: "RotateCcw",
    enabled: true,
    priority: 13,
    keywords: ["uppercase", "大文字", "caps", "upper"],
    isCustom: true,
    type: "code",
    allowedContentTypes: ["text"],
  },
  {
    id: "lowercase",
    label: "小文字に変換",
    command: "navigator.clipboard.writeText(CONTENT.toLowerCase())",
    icon: "RefreshCw",
    enabled: true,
    priority: 14,
    keywords: ["lowercase", "小文字", "lower"],
    isCustom: true,
    type: "code",
    allowedContentTypes: ["text"],
  },

  // メール・メッセージ
  {
    id: "send-email",
    label: "メール送信",
    command: "mailto:?body=CONTENT",
    icon: "Mail",
    enabled: true,
    priority: 21,
    keywords: ["email", "mail", "メール", "送信"],
    isCustom: true,
    type: "url",
    allowedContentTypes: ["text"],
  },

  // 変換・計算
  {
    id: "calculate",
    label: "計算実行",
    command:
      'try { const result = eval(CONTENT); navigator.clipboard.writeText(String(result)); } catch(e) { alert("計算エラー"); }',
    icon: "Calculator",
    enabled: true,
    priority: 26,
    keywords: ["calculate", "計算", "math", "数学"],
    isCustom: true,
    type: "code",
    allowedContentTypes: ["text"],
  },
  {
    id: "base64-encode",
    label: "Base64エンコード",
    command: "navigator.clipboard.writeText(btoa(CONTENT))",
    icon: "Lock",
    enabled: true,
    priority: 27,
    keywords: ["base64", "encode", "エンコード"],
    isCustom: true,
    type: "code",
    allowedContentTypes: ["text"],
  },
  {
    id: "base64-decode",
    label: "Base64デコード",
    command: 'try { navigator.clipboard.writeText(atob(CONTENT)); } catch(e) { alert("無効なBase64"); }',
    icon: "Key",
    enabled: true,
    priority: 28,
    keywords: ["base64", "decode", "デコード"],
    isCustom: true,
    type: "code",
    allowedContentTypes: ["text"],
  },

  // ファイル関連
  {
    id: "save-file",
    label: "ファイルに保存",
    command:
      'const blob = new Blob([CONTENT], {type: "text/plain"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "clipboard.txt"; a.click();',
    icon: "Folder",
    enabled: true,
    priority: 36,
    keywords: ["file", "save", "ファイル", "保存"],
    isCustom: true,
    type: "code",
    allowedContentTypes: ["text"],
  },

  // ユーティリティ
  {
    id: "word-count",
    label: "文字数カウント",
    command: 'alert("文字数: " + CONTENT.length + "文字\\n単語数: " + CONTENT.split(/\\s+/).length + "語")',
    icon: "Hash",
    enabled: true,
    priority: 42,
    keywords: ["count", "words", "文字数", "カウント"],
    isCustom: true,
    type: "code",
    allowedContentTypes: ["text"],
  },
  {
    id: "reverse-text",
    label: "テキスト反転",
    command: 'navigator.clipboard.writeText(CONTENT.split("").reverse().join(""))',
    icon: "Shuffle",
    enabled: true,
    priority: 44,
    keywords: ["reverse", "反転", "flip"],
    isCustom: true,
    type: "code",
    allowedContentTypes: ["text"],
  },
];

export function ActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<GlobalAction[]>(defaultActions);
  const [isLoading, setIsLoading] = useState(true);

  // 起動時にバックエンドからアクション設定を読み込み
  useEffect(() => {
    const loadActionsFromBackend = async () => {
      try {
        const backendActions = await getActions();
        const frontendActions = backendActions.map(backendToFrontend);
        setActions(frontendActions);
        console.log("✅ アクション設定をバックエンドから読み込み完了:", frontendActions.length, "件");
      } catch (error) {
        console.error("❌ アクション設定読み込みエラー:", error);
        console.log("⚠️ デフォルトアクションを使用します");
        setActions(defaultActions);
      } finally {
        setIsLoading(false);
      }
    };

    loadActionsFromBackend();
  }, []);

  // アクションをバックエンドに保存する共通関数
  const saveActionsToBackend = async (updatedActions: GlobalAction[]) => {
    try {
      const backendActions = updatedActions.map(frontendToBackend);
      await saveActionsBackend(backendActions);
      console.log("✅ アクション設定をバックエンドに保存完了");
    } catch (error) {
      console.error("❌ アクション設定保存エラー:", error);
    }
  };

  const updateAction = async (updatedAction: GlobalAction) => {
    const newActions = actions.map((action) => (action.id === updatedAction.id ? updatedAction : action));
    setActions(newActions);
    await saveActionsToBackend(newActions);
  };

  const deleteAction = async (id: string) => {
    const newActions = actions.filter((action) => action.id !== id);
    setActions(newActions);
    await saveActionsToBackend(newActions);
  };

  const addAction = async (newAction: GlobalAction) => {
    const newActions = [...actions, newAction];
    setActions(newActions);
    await saveActionsToBackend(newActions);
  };

  const toggleAction = async (id: string) => {
    const newActions = actions.map((action) => (action.id === id ? { ...action, enabled: !action.enabled } : action));
    setActions(newActions);
    await saveActionsToBackend(newActions);
  };

  const resetToDefaults = async () => {
    try {
      const backendActions = await resetActionsBackend();
      const frontendActions = backendActions.map(backendToFrontend);
      setActions(frontendActions);
      console.log("✅ アクション設定をデフォルトにリセット完了");
    } catch (error) {
      console.error("❌ アクションリセットエラー:", error);
      setActions([...defaultActions]);
    }
  };

  const reorderActions = async (activeId: string, overId: string) => {
    const oldIndex = actions.findIndex((action) => action.id === activeId);
    const newIndex = actions.findIndex((action) => action.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    // アクションを並び替え
    const reorderedActions = [...actions];
    const [movedAction] = reorderedActions.splice(oldIndex, 1);
    reorderedActions.splice(newIndex, 0, movedAction);

    // 優先度を更新（1から開始）
    const newActions = reorderedActions.map((action, index) => ({
      ...action,
      priority: index + 1,
    }));

    setActions(newActions);
    await saveActionsToBackend(newActions);
  };

  return (
    <ActionsContext.Provider
      value={{
        actions,
        isLoading,
        setActions,
        updateAction,
        deleteAction,
        addAction,
        toggleAction,
        resetToDefaults,
        reorderActions,
      }}
    >
      {children}
    </ActionsContext.Provider>
  );
}

export function useActions() {
  const context = useContext(ActionsContext);
  if (context === undefined) {
    throw new Error("useActions must be used within an ActionsProvider");
  }
  return context;
}
