import { useCallback } from "react";

/**
 * 画像をクリック位置にポップアップウィンドウで表示するカスタムフック
 */
export function useImageWindow() {
  const showImageWindow = useCallback((imageData: string, clickEvent: React.MouseEvent) => {
    console.log("🖼️ 画像表示:", `${imageData.substring(0, 50)}...`);

    // 画像サイズを取得するための一時的なImage要素を作成
    const tempImg = new Image();
    tempImg.onload = () => {
      const imgWidth = tempImg.width;
      const imgHeight = tempImg.height;

      // デスクトップサイズを取得
      const screenWidth = window.screen.availWidth;
      const screenHeight = window.screen.availHeight;

      // ウィンドウサイズを計算（画像サイズに合わせる、ただしデスクトップサイズを超える場合は縮小）
      let windowWidth = imgWidth;
      let windowHeight = imgHeight;

      // デスクトップサイズの90%を最大値とする
      const maxWidth = screenWidth * 0.9;
      const maxHeight = screenHeight * 0.9;

      // 縦横どちらかがデスクトップサイズを超える場合、アスペクト比を維持して縮小
      if (windowWidth > maxWidth || windowHeight > maxHeight) {
        const scaleWidth = maxWidth / windowWidth;
        const scaleHeight = maxHeight / windowHeight;
        const scale = Math.min(scaleWidth, scaleHeight); // より小さいスケールを選択

        windowWidth = windowWidth * scale;
        windowHeight = windowHeight * scale;
      }

      // クリック位置を基準とした表示位置を計算
      const clickX = clickEvent.screenX;
      const clickY = clickEvent.screenY;
      
      // ウィンドウがデスクトップ範囲外に出ないよう調整
      let windowX = clickX - windowWidth / 2; // クリック位置を中央とする
      let windowY = clickY - windowHeight / 2;
      
      // 画面境界チェック
      if (windowX < 0) windowX = 0;
      if (windowY < 0) windowY = 0;
      if (windowX + windowWidth > screenWidth) {
        windowX = screenWidth - windowWidth;
      }
      if (windowY + windowHeight > screenHeight) {
        windowY = screenHeight - windowHeight;
      }
      
      // 調整後もデスクトップ範囲外になる場合は中央表示にフォールバック
      if (windowX < 0 || windowY < 0) {
        windowX = (screenWidth - windowWidth) / 2;
        windowY = (screenHeight - windowHeight) / 2;
      }

      const newWindow = window.open(
        "",
        "_blank",
        `width=${Math.round(windowWidth)},height=${Math.round(windowHeight)},left=${Math.round(windowX)},top=${Math.round(windowY)},scrollbars=no,resizable=yes`,
      );
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>ClipOne - 画像表示</title>
            <style>
              body { 
                margin: 0; 
                background: #000; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh;
                overflow: hidden;
              }
              img { 
                max-width: 100vw; 
                max-height: 100vh; 
                object-fit: contain;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <img src="${imageData}" alt="クリップボード画像" onclick="window.close()" />
            <script>
              document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                  window.close();
                }
              });
              
              document.addEventListener('click', function(event) {
                window.close();
              });
            </script>
          </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        console.error("❌ 別ウィンドウを開けませんでした（ポップアップブロックされた可能性があります）");
      }
    };

    tempImg.src = imageData;
  }, []);

  return { showImageWindow };
}