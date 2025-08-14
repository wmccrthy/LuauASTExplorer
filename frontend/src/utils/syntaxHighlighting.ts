import hljs from 'highlight.js/lib/core';
// @ts-ignore - Package has no type definitions
import luau from 'highlightjs-luau';
// Import our custom CSS with both light and dark themes
import './syntaxHighlighting.css';

// Register the Luau language
hljs.registerLanguage('luau', luau);

/**
 * Applies the appropriate highlight.js theme class based on VS Code theme
 */
function applyThemeClass(): void {
  const theme = detectVSCodeTheme();
  console.log("Detected VS Code theme:", theme);
  
  // Remove existing theme classes
  document.body.classList.remove('dark', 'light');
  
  // Apply appropriate theme class
  const themeClass = theme === 'light' ? 'light' : 'dark';
  document.body.classList.add(themeClass);
  console.log("Applied theme class:", themeClass);
}

/**
 * Refreshes the highlight.js theme based on current VS Code theme
 * Call this when you detect a theme change
 */
export function refreshHighlightTheme(): void {
  applyThemeClass();
}

// Initialize theme on module load
applyThemeClass();

// Listen for theme changes
if (typeof window !== 'undefined') {
  // Listen for storage events (VS Code might use localStorage for theme changes)
  window.addEventListener('storage', refreshHighlightTheme);
  
  // Listen for color scheme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', refreshHighlightTheme);
}

/**
 * Detects if the current VS Code theme is dark or light
 * @returns 'dark' | 'light' | 'unknown'
 */
export function detectVSCodeTheme(): 'dark' | 'light' | 'unknown' {
  try {
    // Method 1: Check VS Code CSS variable for editor background
    const editorBg = getComputedStyle(document.documentElement)
      .getPropertyValue('--vscode-editor-background').trim();
    
    if (editorBg) {
      const luminance = getLuminanceFromColor(editorBg);
      return luminance < 0.5 ? 'dark' : 'light';
    }

    return 'unknown';
  } catch (error) {
    console.warn('Failed to detect VS Code theme:', error);
    return 'unknown';
  }
}

/**
 * Calculates the relative luminance of a color
 * @param color - CSS color string (hex, rgb, rgba)
 * @returns luminance value between 0 (dark) and 1 (light)
 */
function getLuminanceFromColor(color: string): number {
  try {
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    
    const computedColor = getComputedStyle(div).color;
    document.body.removeChild(div);
    
    const rgbMatch = computedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!rgbMatch) return 0.5;
    
    const [, r, g, b] = rgbMatch.map(Number);
    
    const getRGBLuminance = (val: number) => {
      const normalized = val / 255;
      return normalized <= 0.03928 
        ? normalized / 12.92 
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    
    return 0.2126 * getRGBLuminance(r) + 0.7152 * getRGBLuminance(g) + 0.0722 * getRGBLuminance(b);
  } catch (error) {
    return 0.5;
  }
}

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
    const result = hljs.highlight(code, { language: 'luau' });
    return result.value;
  } catch (error) {
    try {
      const result = hljs.highlightAuto(code, ['luau', 'lua', 'javascript']);
      return result.value;
    } catch (fallbackError) {
      return escapeHtml(code);
    }
  }
}