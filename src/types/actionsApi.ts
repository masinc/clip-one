import { invoke } from "@tauri-apps/api/core";
import type { ContentCategory } from "@/utils/contentTypeMapper";

// Rustのバックエンドと同期するアクション型
export interface BackendGlobalAction {
  id: string;
  label: string;
  command?: string;
  description?: string;
  icon: string;
  enabled: boolean;
  priority: number;
  keywords: string[];
  is_custom: boolean;
  action_type: "url" | "command" | "code" | "built-in";
  allowed_content_types: ContentCategory[];
}

// フロントエンドのGlobalAction型からバックエンド型への変換
export function frontendToBackend(action: import("@/contexts/ActionsContext").GlobalAction): BackendGlobalAction {
  return {
    id: action.id,
    label: action.label,
    command: action.command,
    description: action.description,
    icon: action.icon,
    enabled: action.enabled,
    priority: action.priority,
    keywords: action.keywords,
    is_custom: action.isCustom,
    action_type: action.type,
    allowed_content_types: action.allowedContentTypes,
  };
}

// バックエンド型からフロントエンドのGlobalAction型への変換
export function backendToFrontend(action: BackendGlobalAction): import("@/contexts/ActionsContext").GlobalAction {
  return {
    id: action.id,
    label: action.label,
    command: action.command,
    description: action.description,
    icon: action.icon,
    enabled: action.enabled,
    priority: action.priority,
    keywords: action.keywords,
    isCustom: action.is_custom,
    type: action.action_type,
    allowedContentTypes: action.allowed_content_types,
  };
}

// Tauriコマンド呼び出し関数
export async function getActions(): Promise<BackendGlobalAction[]> {
  return await invoke<BackendGlobalAction[]>("get_actions");
}

export async function saveActions(actions: BackendGlobalAction[]): Promise<void> {
  return await invoke<void>("save_actions", { actions });
}

export async function resetActions(): Promise<BackendGlobalAction[]> {
  return await invoke<BackendGlobalAction[]>("reset_actions");
}