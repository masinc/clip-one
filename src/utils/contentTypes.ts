/**
 * クリップボードコンテンツタイプ定義
 */
export const contentTypes: Array<{ value: string; label: string; description: string }> = [
  { value: 'text', label: 'テキスト', description: '通常のテキストデータ' },
  { value: 'url', label: 'URL', description: 'URLとして認識されたテキスト' },
  { value: 'html', label: 'HTML', description: 'HTMLフォーマットのデータ' },
  { value: 'image', label: '画像', description: '画像データ' },
  { value: 'files', label: 'ファイル', description: 'ファイルパスのリスト' }
];

export type ContentType = 'text' | 'url' | 'html' | 'image' | 'files';