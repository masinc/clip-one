/**
 * MIME type to content category mapping utilities
 *
 * This module provides a conversion layer between backend MIME types
 * and frontend content categories for UI filtering and action handling.
 */

/**
 * Content categories used in the frontend for action filtering
 */
export type ContentCategory = "text" | "url" | "html" | "image" | "files";

/**
 * Convert MIME type to content category
 *
 * Maps backend MIME types (e.g., "text/plain", "text/html") to
 * frontend content categories (e.g., "text", "html") for action filtering.
 *
 * @param mimeType - MIME type from backend (e.g., "text/plain", "image/png")
 * @returns ContentCategory for frontend filtering
 *
 * @example
 * ```typescript
 * mimeToCategory("text/plain")     // "text"
 * mimeToCategory("text/uri-list")  // "url"
 * mimeToCategory("text/html")      // "html"
 * mimeToCategory("image/png")      // "image"
 * ```
 */
export function mimeToCategory(mimeType: string): ContentCategory {
  // Handle text-based MIME types
  if (mimeType.startsWith("text/")) {
    if (mimeType === "text/uri-list") return "url";
    if (mimeType === "text/html") return "html";
    // text/plain, text/csv, text/markdown, etc.
    return "text";
  }

  // Handle image MIME types
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  // Handle file list (non-standard but used in clipboard context)
  if (mimeType === "files" || mimeType === "application/x-file-list") {
    return "files";
  }

  // Handle other application types that should be treated as files
  if (mimeType.startsWith("application/")) {
    // Special case for file paths
    if (mimeType === "application/x-file-path") {
      return "files";
    }
    // Other application types default to text for broad compatibility
    return "text";
  }

  // Fallback to text for unknown types
  return "text";
}

/**
 * Check if content should be treated as URL based on both MIME type and content
 *
 * This function provides enhanced URL detection by checking both the MIME type
 * and the actual content pattern, as some URLs might be stored as "text/plain".
 *
 * @param content - The actual content string
 * @param mimeType - The MIME type
 * @returns true if content should be treated as URL
 */
export function isUrlContent(content: string, mimeType: string): boolean {
  // Direct MIME type check
  if (mimeType === "text/uri-list") {
    return true;
  }

  // Pattern-based URL detection for text/plain content
  if (mimeType === "text/plain" || mimeType.startsWith("text/")) {
    return /^https?:\/\//.test(content.trim());
  }

  return false;
}

/**
 * Get display label for content category
 *
 * @param category - Content category
 * @returns Japanese display label
 */
export function getCategoryLabel(category: ContentCategory): string {
  const labels: Record<ContentCategory, string> = {
    text: "テキスト",
    url: "URL",
    html: "HTML",
    image: "画像",
    files: "ファイル",
  };

  return labels[category];
}
