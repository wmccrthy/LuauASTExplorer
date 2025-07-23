# AST Highlight Helper

A VSCode extension that shows AST (Abstract Syntax Tree) representation of highlighted Luau/Lua code using the Lute parser.

## Features

- 🌳 **AST Visualization**: View the AST representation of selected Luau/Lua code
- ⌨️ **Configurable Hotkeys**: Customize the hotkey to trigger AST display (default: `Ctrl+Alt+A` / `Cmd+Alt+A`)
- 🔧 **Lute Integration**: Uses the official Lute parser from the Luau team
- 🎨 **Clean UI**: Displays AST in a clean, formatted panel with VSCode theming
- ⚡ **Real-time Parsing**: Fast AST generation with progress indicators

## Prerequisites

Before using this extension, you need to install the required tools:

### 1. Install Foreman

Foreman is a package manager for Luau tools. Install it following the instructions at:
https://github.com/Roblox/foreman

### 2. Install Lute and Other Tools

Run the following command in your project directory to install Lute and StyLua:

```bash
foreman install
```

This will install the tools specified in `foreman.toml`:
- **Lute**: The Luau AST parser
- **StyLua**: Lua/Luau code formatter

## Installation

### From Source

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the TypeScript:
   ```bash
   npm run compile
   ```
4. Press `F5` in VSCode to launch a new Extension Development Host window

### From VSIX (Coming Soon)

Install the `.vsix` package file through VSCode's Extensions view.

## Usage

1. **Open a Luau/Lua file** in VSCode
2. **Select the code** you want to analyze
3. **Trigger AST display** using one of these methods:
   - Press `Ctrl+Alt+A` (Windows/Linux) or `Cmd+Alt+A` (Mac)
   - Open Command Palette (`Ctrl+Shift+P`) and run "Show AST of Selected Code"
4. **View the AST** in the panel that opens beside your editor

### Example

Select this Luau code:
```lua
local function greet(name)
    print("Hello, " .. name .. "!")
end

greet("World")
```

The extension will display the corresponding AST structure showing the function declaration, variable assignments, and function calls.

## Configuration

The extension can be configured through VSCode settings:

### `astHighlightHelper.hotkey`
- **Type**: `string`
- **Default**: `"ctrl+alt+a"`
- **Description**: Hotkey to trigger AST display

### `astHighlightHelper.luteExecutable`
- **Type**: `string`
- **Default**: `"lute"`
- **Description**: Path to the Lute executable

Example configuration in `settings.json`:
```json
{
    "astHighlightHelper.hotkey": "ctrl+shift+a",
    "astHighlightHelper.luteExecutable": "/path/to/custom/lute"
}
```

## Supported Languages

Currently supports:
- **Lua** (`.lua` files)
- **Luau** (`.luau` files)

## Development

### Building

```bash
npm run compile
```

### Watching for Changes

```bash
npm run watch
```

### Project Structure

```
├── src/
│   ├── extension.ts      # Main extension entry point
│   └── astParser.ts      # AST parsing logic with Lute integration
├── package.json          # Extension manifest and dependencies
├── tsconfig.json         # TypeScript configuration
├── foreman.toml          # Luau tools configuration
└── README.md            # This file
```

## Troubleshooting

### "Lute executable not found"

1. Ensure foreman is installed
2. Run `foreman install` in your project directory
3. Verify Lute is in your PATH: `lute --version`
4. Check the `astHighlightHelper.luteExecutable` setting

### "Please select some code to analyze"

Make sure you have:
1. Selected text in the editor (not just a cursor position)
2. The file is detected as Lua/Luau (check the language indicator in VSCode status bar)

### AST Not Displaying

1. Check the VSCode Developer Console (`Help > Toggle Developer Tools`) for error messages
2. Verify the selected code is valid Luau/Lua syntax
3. Try with a simple code snippet first

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Luau Team](https://luau-lang.org/) for the Luau language and Lute parser
- [Roblox](https://github.com/Roblox/foreman) for the Foreman package manager
- [VSCode Extension API](https://code.visualstudio.com/api) for the extension framework 