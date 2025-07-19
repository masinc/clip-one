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

  const [editingAction, setEditingAction] = useState<GlobalAction | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveAction = (action: GlobalAction) => {
    if (isCreating) {
      // 新規作成時は最後の優先度に設定
      const maxPriority = Math.max(...actions.map(a => a.priority), 0);
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
  };

  return (
    <div className="min-h-screen bg-background">
      <ActionsHeader />

      <div className="p-6 max-w-4xl mx-auto">
        
        {/* 新規作成フォーム */}
        {isCreating && editingAction && (
          <ActionForm
            action={editingAction}
            isCreating={isCreating}
            contentTypes={contentTypes}
            onSave={handleSaveAction}
            onCancel={handleCancelEdit}
          />
        )}

        {/* アクション一覧 */}
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
      </div>
    </div>
  );
};

export default ActionsSettings;