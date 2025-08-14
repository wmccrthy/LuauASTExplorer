import hljs from 'highlight.js/lib/core';
// @ts-ignore - Package has no type definitions
import luau from 'highlightjs-luau';
import "highlight.js/styles/atom-one-dark.css"

// Register the Luau language
hljs.registerLanguage('luau', luau);

/**
 * Escapes HTML in a string
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Highlights Luau code using highlightjs-luau package
 * @param code - The Luau code to highlight
 * @returns HTML string with syntax highlighting
 */
export function highlightLuauCode(code: string): string {
  try {
    // Use proper Luau highlighting from highlightjs-luau package
    const result = hljs.highlight(code, { language: 'luau' });
    return result.value;
  } catch (error) {
    // Fallback to auto-detection if Luau highlighting fails
    try {
      const result = hljs.highlightAuto(code, ['luau', 'lua', 'javascript']);
      return result.value;
    } catch (fallbackError) {
      // If all highlighting fails, return the original code escaped
      return escapeHtml(code);
    }
  }
}
