import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, RotateCcw as Reset } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import type { GlobalAction } from '@/contexts/ActionsContext';
import { ActionItem } from './ActionItem';

interface ActionsListProps {
  actions: GlobalAction[];
  editingAction: GlobalAction | null;
  isCreating: boolean;
  expandedActionId: string | null;
  contentTypes: Array<{ value: string; label: string; description: string }>;
  onToggleAction: (id: string) => void;
  onEditAction: (action: GlobalAction) => void;
  onDeleteAction: (id: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onCreateNew: () => void;
  onResetToDefaults: () => void;
  children?: React.ReactNode;
}

export function ActionsList({
  actions,
  editingAction,
  isCreating,
  expandedActionId,
  contentTypes,
  onToggleAction,
  onEditAction,
  onDeleteAction,
  onDragEnd,
  onCreateNew,
  onResetToDefaults,
  children,
}: ActionsListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>グローバルアクション</CardTitle>
            <CardDescription>
              コンテキストメニューに表示されるアクションの設定
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onResetToDefaults}
              disabled={!!editingAction || isCreating}
              variant="outline"
              size="sm"
            >
              <Reset className="h-4 w-4 mr-2" />
              リセット
            </Button>
            <Button
              onClick={onCreateNew}
              disabled={!!editingAction || isCreating}
              size="sm"
            >
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
            onDragEnd={onDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext 
              items={actions.map(action => action.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {actions
                  .sort((a, b) => a.priority - b.priority)
                  .map((action) => (
                    <ActionItem 
                      key={action.id} 
                      action={action}
                      isExpanded={expandedActionId === action.id}
                      onToggle={onToggleAction}
                      onEdit={onEditAction}
                      onDelete={onDeleteAction}
                      contentTypes={contentTypes}
                    >
                      {expandedActionId === action.id && editingAction && editingAction.id === action.id && children}
                    </ActionItem>
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}