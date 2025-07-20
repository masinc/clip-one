import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { GlobalAction } from "@/contexts/ActionsContext";
import { getIconComponent } from "@/utils/iconMapping";

interface ActionItemProps {
  action: GlobalAction;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onEdit: (action: GlobalAction) => void;
  onDelete: (id: string) => void;
  contentTypes: Array<{ value: string; label: string; description: string }>;
  children?: React.ReactNode;
}

export function ActionItem({
  action,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  contentTypes,
  children,
}: ActionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = getIconComponent(action.icon);

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
            <Switch checked={action.enabled} onCheckedChange={() => onToggle(action.id)} />
            {action.isCustom && (
              <>
                <Button variant="ghost" size="icon" onClick={() => onEdit(action)} className="h-8 w-8">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(action.id)}
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
      {isExpanded && children && (
        <div className="border-t bg-muted/30">
          <div className="p-4">{children}</div>
        </div>
      )}
    </div>
  );
}
