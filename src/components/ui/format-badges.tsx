// import React from "react"; // 未使用のためコメントアウト
import { getTypeIcon, getTypeName } from "@/utils/textUtils";

interface FormatBadgeProps {
  format: string;
  isActive: boolean;
  onClick: () => void;
  isMain?: boolean;
}

function FormatBadge({ format, isActive, onClick, isMain = false }: FormatBadgeProps) {
  return (
    <button
      className={`
        inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors
        ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
        }
        ${isMain ? "ring-1 ring-primary/20" : ""}
      `}
      onClick={onClick}
      title={`${getTypeName(format)}として表示`}
    >
      <span className="text-xs">{getTypeIcon(format)}</span>
      <span className="font-medium">{getTypeName(format)}</span>
    </button>
  );
}

interface FormatBadgesProps {
  availableFormats: string[];
  currentFormat: string;
  onFormatChange: (format: string) => void;
  mainFormat?: string;
}

export function FormatBadges({ availableFormats, currentFormat, onFormatChange, mainFormat }: FormatBadgesProps) {
  // 形式が1つしかない場合は表示しない
  if (availableFormats.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {availableFormats.map((format) => (
        <FormatBadge
          key={format}
          format={format}
          isActive={format === currentFormat}
          onClick={() => onFormatChange(format)}
          isMain={format === mainFormat}
        />
      ))}
    </div>
  );
}
