<<<<<<< HEAD
import { useState } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { useActions, GlobalAction } from '@/contexts/ActionsContext';
import { contentTypes } from '@/utils/contentTypes';
import { ActionsHeader } from '@/components/actions/ActionsHeader';
import { ActionForm } from '@/components/actions/ActionForm';
import { ActionsList } from '@/components/actions/ActionsList';
import { ResetConfirmDialog } from '@/components/actions/ResetConfirmDialog';

const ActionsSettings = () => {
  const { actions, updateAction, deleteAction, addAction, toggleAction, resetToDefaults, reorderActions } = useActions();

=======
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Archive,
  ArrowLeft,
  Bookmark,
  Bot,
  Brain,
  Calculator,
  Calendar,
  Code,
  Copy,
  Edit,
  Edit3,
  ExternalLink,
  FileText,
  Folder,
  GitBranch,
  GripVertical,
  Hash,
  Key,
  Languages,
  Lock,
  Mail,
  MessageSquare,
  Music,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw as Reset,
  RotateCcw,
  Save,
  Scissors,
  Search,
  Shuffle,
  Sparkles,
  Terminal,
  Trash2,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { type GlobalAction, useActions } from "@/contexts/ActionsContext";

// アイコンマッピング
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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

const ActionsSettings = () => {
  const navigate = useNavigate();
  const { actions, updateAction, deleteAction, addAction, toggleAction, resetToDefaults, reorderActions } =
    useActions();

  // コンテンツタイプ定義（クリップボードから取得可能なタイプに基づく）
  const contentTypes = [
    { value: "text", label: "テキスト", description: "通常のテキストデータ" },
    { value: "url", label: "URL", description: "URLとして認識されたテキスト" },
    { value: "html", label: "HTML", description: "HTMLフォーマットのデータ" },
    { value: "image", label: "画像", description: "画像データ" },
    { value: "files", label: "ファイル", description: "ファイルパスのリスト" },
  ];

>>>>>>> main
  const [editingAction, setEditingAction] = useState<GlobalAction | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveAction = (action: GlobalAction) => {
    if (isCreating) {
      // 新規作成時は最後の優先度に設定
      const maxPriority = Math.max(...actions.map((a) => a.priority), 0);
      addAction({ ...action, id: Date.now().toString(), priority: maxPriority + 1 });
      setIsCreating(false);
    } else {
      updateAction(action);
      setExpandedActionId(null);
    }
    setEditingAction(null);
  };

  const handleEditAction = (action: GlobalAction) => {
    if (expandedActionId === action.id) {
      setExpandedActionId(null);
      setEditingAction(null);
    } else {
      setExpandedActionId(action.id);
      setEditingAction(action);
    }
  };

  const handleResetToDefaults = () => {
    resetToDefaults();
    setShowResetConfirm(false);
    setEditingAction(null);
    setExpandedActionId(null);
    setIsCreating(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderActions(active.id as string, over.id as string);
    }
  };

<<<<<<< HEAD
  const handleCreateNew = () => {
    setIsCreating(true);
    setEditingAction({
      id: '',
      label: '',
      command: '',
      description: '',
      icon: 'Code',
      enabled: true,
      priority: Math.max(...actions.map(a => a.priority), 0) + 1,
      keywords: [],
      isCustom: true,
      type: 'url',
      allowedContentTypes: ['text', 'url', 'html', 'files'] // デフォルトは画像以外
    });
  };

  const handleCancelEdit = () => {
    if (isCreating) {
      setIsCreating(false);
    } else {
      setExpandedActionId(null);
    }
    setEditingAction(null);
=======
  const SortableActionItem = ({ action }: { action: GlobalAction }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: action.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const IconComponent = iconMap[action.icon] || Code;
    const isExpanded = expandedActionId === action.id;

    return (
      <div ref={setNodeRef} style={style} className={`border rounded-md ${isDragging ? "shadow-lg" : ""}`}>
        <div className="p-3 hover:bg-accent/50 transition-colors">
          {/* モバイル・小画面対応: 縦並びレイアウト */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded flex-shrink-0"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{action.label}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground whitespace-nowrap">
                    優先度: {action.priority}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded text-white whitespace-nowrap ${
                      action.type === "url"
                        ? "bg-blue-500"
                        : action.type === "command"
                          ? "bg-green-500"
                          : action.type === "code"
                            ? "bg-purple-500"
                            : "bg-gray-500"
                    }`}
                  >
                    {action.type === "url"
                      ? "URL"
                      : action.type === "command"
                        ? "コマンド"
                        : action.type === "code"
                          ? "コード"
                          : "組み込み"}
                  </span>
                  {action.isCustom && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded text-blue-700 dark:text-blue-300 whitespace-nowrap">
                      カスタム
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  <span className="text-xs text-muted-foreground">対応タイプ:</span>
                  {action.allowedContentTypes.map((type) => {
                    const contentType = contentTypes.find((ct) => ct.value === type);
                    return (
                      <span
                        key={type}
                        className="text-xs bg-accent px-1.5 py-0.5 rounded text-accent-foreground whitespace-nowrap"
                      >
                        {contentType?.label || type}
                      </span>
                    );
                  })}
                </div>
                {action.description && <div className="text-xs text-muted-foreground mb-1">{action.description}</div>}
                {action.command && (
                  <div className="text-xs font-mono text-muted-foreground break-all">
                    {action.command.length > 60 ? `${action.command.substring(0, 60)}...` : action.command}
                  </div>
                )}
              </div>
            </div>

            {/* ボタンエリア - 小画面では右寄せ、大画面では通常 */}
            <div className="flex items-center gap-2 justify-end sm:justify-start flex-shrink-0">
              <Switch checked={action.enabled} onCheckedChange={() => toggleAction(action.id)} />
              {action.isCustom && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => handleEditAction(action)} className="h-8 w-8">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAction(action.id)}
                    disabled={isExpanded}
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 編集フォーム */}
        {isExpanded && editingAction && editingAction.id === action.id && (
          <div className="border-t bg-muted/30">
            <div className="p-4">
              <ActionForm
                action={editingAction}
                onSave={handleSaveAction}
                onCancel={() => {
                  setExpandedActionId(null);
                  setEditingAction(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const ActionForm = ({
    action,
    onSave,
    onCancel,
  }: {
    action: GlobalAction;
    onSave: (action: GlobalAction) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState(action);

    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-sm">{isCreating ? "新しいアクション" : "アクション編集"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>アクション名</Label>
            <Input
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="アクション名を入力"
            />
          </div>

          <div className="space-y-2">
            <Label>アクションタイプ</Label>
            <Select
              value={formData.type}
              onValueChange={(value: "url" | "command" | "code" | "built-in") =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">URL - ウェブページを開く</SelectItem>
                <SelectItem value="command">コマンド - システムコマンドを実行</SelectItem>
                <SelectItem value="code">コード実行 - JavaScriptコードを実行</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {formData.type === "url" && "URL"}
              {formData.type === "command" && "コマンド"}
              {formData.type === "code" && "JavaScriptコード"}
            </Label>
            <Input
              value={formData.command || ""}
              onChange={(e) => setFormData({ ...formData, command: e.target.value })}
              placeholder={
                formData.type === "url"
                  ? "https://example.com/?q=CONTENT"
                  : formData.type === "command"
                    ? 'echo "CONTENT" | pbcopy'
                    : "navigator.clipboard.writeText(CONTENT.toUpperCase())"
              }
            />
          </div>

          <div className="space-y-2">
            <Label>説明（オプション）</Label>
            <Input
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="アクションの説明"
            />
          </div>

          <div className="space-y-2">
            <Label>アイコン</Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {iconMap[formData.icon] && React.createElement(iconMap[formData.icon], { className: "h-4 w-4" })}
                    {formData.icon}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.keys(iconMap).map((iconName) => {
                  const IconComponent = iconMap[iconName];
                  return (
                    <SelectItem key={iconName} value={iconName}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {iconName}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>キーワード（カンマ区切り）</Label>
            <Input
              value={formData.keywords.join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  keywords: e.target.value
                    .split(",")
                    .map((k) => k.trim())
                    .filter((k) => k),
                })
              }
              placeholder="search, 検索, google"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>対応コンテンツタイプ</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      allowedContentTypes: contentTypes.map((ct) => ct.value),
                    })
                  }
                  className="h-7 text-xs"
                >
                  全て選択
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      allowedContentTypes: [],
                    })
                  }
                  className="h-7 text-xs"
                >
                  選択解除
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {contentTypes.map((contentType) => (
                <div key={contentType.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={contentType.value}
                    checked={formData.allowedContentTypes.includes(contentType.value)}
                    onCheckedChange={(checked: boolean) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          allowedContentTypes: [...formData.allowedContentTypes, contentType.value],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          allowedContentTypes: formData.allowedContentTypes.filter((t) => t !== contentType.value),
                        });
                      }
                    }}
                  />
                  <Label htmlFor={contentType.value} className="text-sm font-normal">
                    <div>
                      <div className="font-medium">{contentType.label}</div>
                      <div className="text-xs text-muted-foreground">{contentType.description}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onSave(formData)} disabled={!formData.label} size="sm">
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
            <Button variant="outline" onClick={onCancel} size="sm">
              <X className="h-4 w-4 mr-2" />
              キャンセル
            </Button>
          </div>
        </CardContent>
      </Card>
    );
>>>>>>> main
  };

  return (
    <div className="min-h-screen bg-background">
<<<<<<< HEAD
      <ActionsHeader />
=======
      {/* Header */}
      <div className="border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">アクション設定</h1>
        </div>
      </div>
>>>>>>> main

      <div className="p-6 max-w-4xl mx-auto">
        {/* 新規作成フォーム */}
        {isCreating && editingAction && (
          <ActionForm
<<<<<<< HEAD
            action={editingAction}
            isCreating={isCreating}
            contentTypes={contentTypes}
=======
            action={
              editingAction || {
                id: "",
                label: "",
                command: "",
                description: "",
                icon: "Code",
                enabled: true,
                priority: Math.max(...actions.map((a) => a.priority), 0) + 1,
                keywords: [],
                isCustom: true,
                type: "url",
                allowedContentTypes: ["text", "url", "html", "files"], // デフォルトは画像以外
              }
            }
>>>>>>> main
            onSave={handleSaveAction}
            onCancel={handleCancelEdit}
          />
        )}

        {/* アクション一覧 */}
<<<<<<< HEAD
        <ActionsList
          actions={actions}
          editingAction={editingAction}
          isCreating={isCreating}
          expandedActionId={expandedActionId}
          contentTypes={contentTypes}
          onToggleAction={toggleAction}
          onEditAction={handleEditAction}
          onDeleteAction={deleteAction}
          onDragEnd={handleDragEnd}
          onCreateNew={handleCreateNew}
          onResetToDefaults={() => setShowResetConfirm(true)}
        >
          {editingAction && !isCreating && (
            <ActionForm
              action={editingAction}
              isCreating={false}
              contentTypes={contentTypes}
              onSave={handleSaveAction}
              onCancel={handleCancelEdit}
            />
          )}
        </ActionsList>

        {/* リセット確認ダイアログ */}
        <ResetConfirmDialog
          isOpen={showResetConfirm}
          onConfirm={handleResetToDefaults}
          onCancel={() => setShowResetConfirm(false)}
        />
=======
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>グローバルアクション</CardTitle>
                <CardDescription>コンテキストメニューに表示されるアクションの設定</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowResetConfirm(true)}
                  disabled={!!editingAction || isCreating}
                  variant="outline"
                  size="sm"
                >
                  <Reset className="h-4 w-4 mr-2" />
                  リセット
                </Button>
                <Button onClick={() => setIsCreating(true)} disabled={!!editingAction || isCreating} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  追加
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-250px)]">
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext items={actions.map((action) => action.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {actions
                      .sort((a, b) => a.priority - b.priority)
                      .map((action) => (
                        <SortableActionItem key={action.id} action={action} />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* リセット確認ダイアログ */}
        {showResetConfirm && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              role="button"
              tabIndex={0}
              onClick={() => setShowResetConfirm(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
                  setShowResetConfirm(false);
                }
              }}
              aria-label="ダイアログを閉じる"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle className="text-lg">設定をリセット</CardTitle>
                  <CardDescription>
                    すべてのアクション設定をデフォルトに戻します。
                    <br />
                    カスタムアクションは削除され、この操作は元に戻せません。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowResetConfirm(false)} size="sm">
                      キャンセル
                    </Button>
                    <Button variant="destructive" onClick={handleResetToDefaults} size="sm">
                      <Reset className="h-4 w-4 mr-2" />
                      リセット実行
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
>>>>>>> main
      </div>
    </div>
  );
};

export default ActionsSettings;
