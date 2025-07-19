/**
 * メニュー位置を画面境界に合わせて調整する
 */
export function calculateMenuPosition(
  clientX: number,
  clientY: number,
  menuWidth: number = 200,
  menuHeight: number = 300,
): { x: number; y: number } {
  const padding = 8;
  
  let x = clientX;
  let y = clientY;
  
  // 右端チェック
  if (x + menuWidth > window.innerWidth - padding) {
    x = Math.max(padding, clientX - menuWidth);
  }
  
  // 下端チェック
  if (y + menuHeight > window.innerHeight - padding) {
    y = Math.max(padding, clientY - menuHeight);
  }
  
  // 左端チェック
  if (x < padding) {
    x = padding;
  }
  
  // 上端チェック
  if (y < padding) {
    y = padding;
  }
  
  // 再度右端チェック（左端調整後）
  if (x + menuWidth > window.innerWidth - padding) {
    x = Math.max(padding, window.innerWidth - menuWidth - padding);
  }
  
  // 再度下端チェック（上端調整後）
  if (y + menuHeight > window.innerHeight - padding) {
    y = Math.max(padding, window.innerHeight - menuHeight - padding);
  }
  
  return { x, y };
}