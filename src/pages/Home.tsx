import { listen } from "@tauri-apps/api/event";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ClipboardItemList } from "@/components/home/ClipboardItemList";
import { ContextMenu } from "@/components/home/ContextMenu";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActions } from "@/contexts/ActionsContext";
import { useClipboard } from "@/hooks/useClipboard";
// import type { ClipboardItem } from "@/types/clipboard"; // 使用しない
import type { ClipboardAction, ContextMenuState, DisplayClipboardItem } from "@/types/clipboardActions";
import { convertToClipboardAction, searchActions } from "@/utils/clipboard/actionUtils";
import { calculateMenuPosition } from "@/utils/menuPosition";
import { historyApi } from "@/utils/tauri-api";

export default function Home() {
  const navigate = useNavigate();
  const { actions } = useActions();
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 状態管理
  const [clipboardItems, setClipboardItems] = useState<DisplayClipboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // クリップボード監視
  const clipboard = useClipboard();

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    originalX: 0,
    originalY: 0,
    item: null,
  });
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActionIndex, setSelectedActionIndex] = useState(-1);
  const [showAllActions, setShowAllActions] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 履歴データを取得（単純化）
  const loadClipboardHistory = useCallback(async () => {
    try {
      console.log("履歴データ取得開始...");
      setLoading(true);
      setError(null);

      const items = await historyApi.getHistory(100);
      console.log("取得したアイテム数:", items.length);
      console.log("最初のアイテムのデータ:", items[0]); // デバッグ情報

      // DisplayClipboardItemを直接使用（変換不要）
      setClipboardItems(items);
    } catch (err) {
      console.error("履歴取得エラー:", err);
      setError("履歴の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  // 履歴アイテムをフィルタリング
  const filteredClipboardItems = clipboardItems.filter((item) => {
    if (!historySearchQuery.trim()) return true;
    return item.content.toLowerCase().includes(historySearchQuery.toLowerCase());
  });

  // 初期化（一度だけ実行）
  useEffect(() => {
    console.log("Home コンポーネント初期化開始");

    // データ読み込み
    loadClipboardHistory();

    // 直接clipboard-updatedイベントをリッスンして履歴リストを即座に更新
    let unlistenClipboardUpdated: (() => void) | null = null;
    let unlistenTrayEvents: (() => void) | null = null;
    let unlistenNavigationEvents: (() => void) | null = null;

    const setupDirectEventListener = async () => {
      try {
        unlistenClipboardUpdated = await listen<DisplayClipboardItem>("clipboard-updated", (event) => {
          console.log("📨 直接受信: clipboard-updatedイベント:", event.payload);
          const newItem = event.payload; // 既にDisplayClipboardItem形式

          // 履歴リストの先頭に新しいアイテムを追加
          setClipboardItems((prevItems) => {
            // 重複チェック（同じIDまたは同じ内容）
            const isDuplicate = prevItems.some((item) => item.id === newItem.id || item.content === newItem.content);

            if (isDuplicate) {
              console.log("⚠️ 重複アイテムのため履歴更新をスキップ");
              return prevItems;
            }

            console.log("✅ 履歴リストに新しいアイテムを追加:", newItem.content.substring(0, 50));
            return [newItem, ...prevItems];
          });
        });
        console.log("✅ 直接clipboard-updatedイベントリスナー設定完了");
      } catch (err) {
        console.error("❌ 直接イベントリスナー設定エラー:", err);
      }
    };

    setupDirectEventListener();

    // トレイイベントリスナーを設定（現在は使用していない）
    const setupTrayEventListener = async () => {
      // 将来の拡張用に保持
      console.log("✅ トレイイベントリスナー準備完了");
    };

    setupTrayEventListener();

    // トレイナビゲーションイベントリスナーを設定
    const setupNavigationEventListener = async () => {
      try {
        unlistenNavigationEvents = await listen("tray-navigate-settings", () => {
          console.log("⚙️ トレイから設定画面遷移要求を受信");
          navigate("/settings");
        });
        
        // アバウト情報表示イベント
        const unlistenAbout = await listen<string>("tray-show-about", (event) => {
          console.log("ℹ️ トレイからアバウト情報表示要求を受信");
          alert(event.payload);
        });
        
        console.log("✅ ナビゲーションイベントリスナー設定完了");
      } catch (err) {
        console.error("❌ ナビゲーションイベントリスナー設定エラー:", err);
      }
    };

    setupNavigationEventListener();

    // クリップボード監視開始（遅延）
    const timer = setTimeout(() => {
      console.log("🚀 クリップボード監視開始処理開始...");
      console.log("📋 現在の監視状態:", clipboard.isMonitoring);

      clipboard
        .startMonitoring((newText: string) => {
          console.log("🔄 onUpdateコールバック: クリップボード変更検出:", newText.substring(0, 50));
          // このコールバックはバックアップとして保持（直接イベントリスナーが機能しない場合用）
        })
        .then(async () => {
          console.log("✅ クリップボード監視が正常に開始されました");
          // 状態を同期
          await clipboard.syncMonitoringStatus();
          console.log("📊 監視状態:", clipboard.isMonitoring);
        })
        .catch((err) => {
          console.error("❌ クリップボード監視開始エラー:", err);
          console.error("❌ エラー詳細:", err.toString());
        });
    }, 1000);

    // クリーンアップ
    return () => {
      clearTimeout(timer);
      if (unlistenClipboardUpdated) {
        unlistenClipboardUpdated();
      }
      if (unlistenTrayEvents) {
        unlistenTrayEvents();
      }
      if (unlistenNavigationEvents) {
        unlistenNavigationEvents();
      }
      console.log("Home コンポーネントクリーンアップ");
      clipboard.stopMonitoring().catch(console.error);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 初期化時のみ実行（意図的に空の依存配列を使用）

  // コンテキストからアクションを取得して変換する関数
  const getClipboardActions = () => {
    return actions.filter((action) => action.enabled).map((action) => convertToClipboardAction(action));
  };

  // メニュー位置を調整する関数
  const getMenuPosition = (clientX: number, clientY: number) => {
    let menuWidth = 200;
    let menuHeight = 300;

    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      menuWidth = rect.width;
      menuHeight = rect.height;
    }

    return calculateMenuPosition(clientX, clientY, menuWidth, menuHeight);
  };

  // コンテキストメニューを開く
  const handleContextMenu = (e: React.MouseEvent, item: DisplayClipboardItem) => {
    e.preventDefault();

    if (contextMenu.visible) {
      setContextMenu({ visible: false, x: 0, y: 0, originalX: 0, originalY: 0, item: null });
      setTimeout(() => {
        const { x, y } = getMenuPosition(e.clientX, e.clientY);
        setContextMenu({
          visible: true,
          x,
          y,
          originalX: e.clientX,
          originalY: e.clientY,
          item,
        });
      }, 50);
    } else {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        originalX: e.clientX,
        originalY: e.clientY,
        item,
      });

      setTimeout(() => {
        const { x, y } = getMenuPosition(e.clientX, e.clientY);
        setContextMenu((prev) => ({
          ...prev,
          x,
          y,
        }));
      }, 0);
    }
  };

  // コンテキストメニューを閉じる
  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
    setSearchQuery("");
    setSelectedActionIndex(-1);
    setShowAllActions(false);
  };

  // 「その他のアクション」をクリックした時の処理
  const handleShowAllActions = () => {
    setShowAllActions(true);
    setTimeout(() => {
      if (contextMenu.visible && contextMenu.item) {
        const { x, y } = getMenuPosition(contextMenu.originalX, contextMenu.originalY);
        setContextMenu((prev) => ({
          ...prev,
          x,
          y,
        }));
      }
    }, 0);
  };

  // アイテムの展開/縮小をトグル
  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // アクションを実行
  const executeAction = (action: ClipboardAction, item: DisplayClipboardItem) => {
    action.execute(item.content, navigate, item.id);
    closeContextMenu();
  };

  // アイテムに対して利用可能なアクションを取得
  const getAvailableActions = (item: DisplayClipboardItem) => {
    const clipboardActions = getClipboardActions();

    const availableActions = clipboardActions.filter(
      (action) => !action.condition || action.condition(item.content, item.content_type),
    );

    const filteredActions = searchActions(availableActions, searchQuery);
    const sortedActions = filteredActions.sort((a, b) => (a.priority || 999) - (b.priority || 999));

    if (searchQuery.trim() || showAllActions) {
      return {
        actions: sortedActions,
        hasMore: false,
        allActions: sortedActions,
      };
    }

    const topActions = sortedActions.slice(0, 3);
    const hasMore = sortedActions.length > 3;

    return {
      actions: topActions,
      hasMore,
      allActions: sortedActions,
    };
  };

  return (
    <div
      role="application"
      className="flex flex-col h-screen bg-background"
      onContextMenu={(e) => {
        if (contextMenu.visible) {
          e.preventDefault();
          closeContextMenu();
        }
      }}
    >
      <HomeHeader
        searchQuery={historySearchQuery}
        onSearchChange={setHistorySearchQuery}
        onHistoryReload={loadClipboardHistory}
      />

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <ClipboardItemList
            clipboardItems={filteredClipboardItems}
            loading={loading}
            error={error}
            expandedItems={expandedItems}
            onItemClick={toggleItemExpansion}
            onHistoryReload={loadClipboardHistory}
            onContextMenu={handleContextMenu}
          />
        </ScrollArea>
      </div>

      <ContextMenu
        contextMenu={contextMenu}
        searchQuery={searchQuery}
        selectedActionIndex={selectedActionIndex}
        searchInputRef={searchInputRef}
        availableActions={contextMenu.item ? getAvailableActions(contextMenu.item) : { actions: [], hasMore: false }}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setSelectedActionIndex(-1);
        }}
        onExecuteAction={executeAction}
        onShowAllActions={handleShowAllActions}
      />
      {contextMenu.visible && (
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 z-40"
          onClick={closeContextMenu}
          onKeyDown={(e) => e.key === "Escape" && closeContextMenu()}
        />
      )}

      <HomeFooter
        clipboardItems={filteredClipboardItems}
        loading={loading}
        clipboard={clipboard}
        onHistoryReload={loadClipboardHistory}
      />
    </div>
  );
}
