# AST Highlight Helper - Usage Guide

## Quick Start

### 1. Prerequisites Check
Make sure you have these installed:
- **Foreman**: `foreman --version` (should show version info)
- **Lute**: `lute --version` (should work after `foreman install`)
- **Node.js**: `npm --version`

### 2. Setup (One-time)
```bash
# In the project directory
foreman install    # Installs Lute and StyLua
npm install        # Installs TypeScript dependencies
npm run compile    # Compiles the extension
```

### 3. Run the Extension
1. **Open VSCode** in the project directory: `code .`
2. **Press F5** (or Run → Start Debugging)
   - This opens a new "Extension Development Host" window
   - You should see "AST Highlight Helper is now active!" in the debug console

### 4. Test with Sample Code
In the new VSCode window:

1. **Create a test file**: `test.luau`
2. **Add some Luau code**:
   ```lua
   local function fibonacci(n: number): number
       if n <= 1 then
           return n
       end
       return fibonacci(n - 1) + fibonacci(n - 2)
   end
   
   local result = fibonacci(10)
   print(result)
   ```
3. **Select the code** (highlight it with your mouse)
4. **Trigger AST display**:
   - Press `Ctrl+Shift+A` (Windows/Linux) or `Cmd+Shift+A` (Mac)
   - OR Command Palette (`Ctrl+Shift+P`) → "Show AST of Selected Code"

### 5. View Results
- A new panel opens showing the detailed AST
- Selected code gets highlighted in yellow for 3 seconds
- AST shows complete syntax tree with types, locations, and structure

## Troubleshooting

### "Lute executable not found"
```bash
# Check if Lute is installed
lute --version

# If not found, install via foreman
foreman install

# Check your PATH includes foreman bin
echo $PATH | grep -o ".foreman/bin"
```

### "No active editor found"
- Make sure you have a file open in the Extension Development Host window
- Not the original VSCode window - the NEW one that opened when you pressed F5

### "Please select some code to analyze"
- You must **highlight/select** text, not just place cursor
- The file should be detected as Lua/Luau (check status bar)

### Extension not loading
- Check the Debug Console for errors
- Try recompiling: `npm run compile`
- Restart the Extension Development Host (press F5 again)

### AST panel not opening
- Check VSCode Developer Tools: Help → Toggle Developer Tools
- Look for JavaScript errors in the console

## File Types Supported
- `.lua` files
- `.luau` files
- Any file with Lua/Luau language mode

## Sample Output
The AST will show detailed information like:
```json
{
  "type": "Program",
  "parser": "Lute-Official-AST",
  "ast": {
    "statements": [...],
    "location": {...},
    // 15,000+ characters of detailed syntax information
  }
}
```

## Configuration
You can customize settings in VSCode:
- `astHighlightHelper.hotkey`: Change the trigger key combination
- `astHighlightHelper.luteExecutable`: Path to Lute executable 