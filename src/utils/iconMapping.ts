import {
  Archive,
  Bookmark,
  Bot,
  Brain,
  Calculator,
  Calendar,
  Code,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  Folder,
  GitBranch,
  Hash,
  Key,
  Languages,
  Lock,
  Mail,
  MessageSquare,
  Music,
  QrCode,
  RefreshCw,
  RotateCcw,
  Scissors,
  Search,
  Shuffle,
  Sparkles,
  Terminal,
  Users,
} from "lucide-react";

/**
 * アイコンマッピング - Home.tsxとActionsSettings.tsxで共通利用
 */
export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Copy,
  Search,
  Languages,
  Bot,
  Brain,
  Sparkles,
  Code,
  Terminal,
  GitBranch,
  Mail,
  Calculator,
  Lock,
  Key,
  Shuffle,
  Hash,
  Music,
  Scissors,
  QrCode,
  ExternalLink,
  Edit3,
  Bookmark,
  FileText,
  Calendar,
  Users,
  Folder,
  Archive,
  MessageSquare,
  RotateCcw,
  RefreshCw,
};

/**
 * デフォルトアイコンを取得
 */
export const getDefaultIcon = () => Code;

/**
 * アイコンコンポーネントを安全に取得
 */
export const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || getDefaultIcon();
};