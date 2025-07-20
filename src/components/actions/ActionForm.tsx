import { Save, X } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GlobalAction } from "@/contexts/ActionsContext";
import { getIconComponent, iconMap } from "@/utils/iconMapping";

interface ActionFormProps {
  action: GlobalAction;
  isCreating: boolean;
  contentTypes: Array<{ value: string; label: string; description: string }>;
  onSave: (action: GlobalAction) => void;
  onCancel: () => void;
}

export function ActionForm({ action, isCreating, contentTypes, onSave, onCancel }: ActionFormProps) {
  const [formData, setFormData] = useState(action);

  const handleSave = () => {
    onSave(formData);
  };

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
                  {React.createElement(getIconComponent(formData.icon), { className: "h-4 w-4" })}
                  {formData.icon}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.keys(iconMap).map((iconName) => {
                const IconComponent = getIconComponent(iconName);
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
            value={formData.keywords?.join(", ") || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                keywords: e.target.value
                  .split(",")
                  .map((k) => k.trim())
                  .filter((k) => k.length > 0),
              })
            }
            placeholder="検索, ウェブ, Google"
          />
        </div>

        <div className="space-y-3">
          <Label>対応コンテンツタイプ</Label>
          <div className="space-y-2">
            {contentTypes.map((contentType) => (
              <div key={contentType.value} className="flex items-center space-x-2">
                <Checkbox
                  id={contentType.value}
                  checked={formData.allowedContentTypes.includes(contentType.value)}
                  onCheckedChange={(checked) => {
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
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={contentType.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {contentType.label}
                  </label>
                  <p className="text-xs text-muted-foreground">{contentType.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={handleSave} size="sm">
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
}
