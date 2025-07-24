import * as vscode from 'vscode';
import { ASTParser } from './astParser';

export function activate(context: vscode.ExtensionContext) {
    console.log('AST Highlight Helper is now active!');

    // Create AST parser instance with extension context
    const astParser = new ASTParser(context);

    // Register the command to show AST
    let disposable = vscode.commands.registerCommand('ast-highlight-helper.showAST', async () => {
        const editor = vscode.window.activeTextEditor;
        
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('Please select some code to analyze');
            return;
        }

        const selectedText = editor.document.getText(selection);
        const languageId = editor.document.languageId;

        try {
            // Show progress indicator
            const astResult = await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Parsing AST...",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0 });
                const result = await astParser.parseCode(selectedText, languageId);
                progress.report({ increment: 100 });
                return result;
            });

            // Display the AST in a hover-like manner
            await showASTResult(astResult, editor, selection);

        } catch (error) {
            vscode.window.showErrorMessage(`Error parsing AST: ${error}`);
        }
    });

    context.subscriptions.push(disposable);
}

async function showASTResult(astResult: string, editor: vscode.TextEditor, selection: vscode.Selection) {
    // Create a webview panel to display the AST
    const panel = vscode.window.createWebviewPanel(
        'astDisplay',
        'AST Representation',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            localResourceRoots: []
        }
    );

    // Set the HTML content for the webview
    panel.webview.html = getWebviewContent(astResult);

    // Optionally, we could also show it as a hover message for a quick preview
    const hoverMessage = new vscode.MarkdownString();
    hoverMessage.appendCodeblock(astResult, 'json');
    
    // Create a decoration to show hover on the selected text
    const decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 255, 0, 0.2)',
        border: '1px solid yellow'
    });
    
    editor.setDecorations(decorationType, [selection]);
    
    // Remove decoration after 3 seconds
    setTimeout(() => {
        decorationType.dispose();
    }, 3000);
}

function getWebviewContent(astResult: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AST Representation</title>
        <style>
            body {
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                line-height: 1.4;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--vscode-panel-border);
            }
            .title {
                font-size: 18px;
                font-weight: bold;
                color: var(--vscode-titleBar-activeForeground);
            }
            .controls {
                display: flex;
                gap: 8px;
            }
            .btn {
                background: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 6px 12px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            }
            .btn:hover {
                background: var(--vscode-button-hoverBackground);
            }
            .ast-container {
                background-color: var(--vscode-textCodeBlock-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                padding: 16px;
                overflow: auto;
                max-height: 80vh;
                position: relative;
            }
            .ast-content {
                margin: 0;
                white-space: pre;
                font-size: 13px;
                line-height: 1.5;
            }
            /* Search highlighting */
            mark.search-match {
                background-color: var(--vscode-editor-findMatchHighlightBackground);
                color: var(--vscode-editor-findMatchHighlightForeground);
                padding: 1px 2px;
                border-radius: 2px;
                transition: background-color 0.2s ease;
            }
            
            mark.search-match.current-match {
                background-color: var(--vscode-editor-findMatchBackground, #ea5c00);
                color: var(--vscode-editor-findMatchForeground, #ffffff);
                border: 2px solid var(--vscode-editor-findMatchBorder, #f38518);
            }
            
            .search-info {
                font-size: 12px;
                color: var(--vscode-descriptionForeground);
                margin: 0 8px;
                min-width: 60px;
                text-align: center;
            }
            .search-box {
                width: 200px;
                padding: 4px 8px;
                border: 1px solid var(--vscode-input-border);
                background: var(--vscode-input-background);
                color: var(--vscode-input-foreground);
                border-radius: 3px;
                font-size: 12px;
            }
            .stats {
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                margin-top: 8px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">🌳 AST Explorer</div>
            <div class="controls">
                <input type="text" class="search-box" placeholder="Search nodes (Enter to cycle)..." id="searchBox">
                <button class="btn" onclick="previousMatch()" id="prevBtn" disabled>⬆️ Prev</button>
                <button class="btn" onclick="nextMatch()" id="nextBtn" disabled>⬇️ Next</button>
                <span class="search-info" id="searchInfo"></span>
                <button class="btn" onclick="copyToClipboard()">📋 Copy</button>
            </div>
        </div>
        <div class="ast-container">
            <pre class="ast-content" id="astContent">${escapeHtml(astResult)}</pre>
        </div>
        <div class="stats" id="stats"></div>
        
        <script>
            // Initialize stats display
            function initializeStats() {
                const content = document.getElementById('astContent');
                updateStats(content.textContent);
            }
            
            function updateStats(text) {
                const lines = text.split('\\n').length;
                const nodes = (text.match(/tag:|type:|kind:/g) || []).length;
                document.getElementById('stats').textContent = 
                    \`\${lines} lines, ~\${nodes} AST nodes\`;
            }
            
            function copyToClipboard() {
                // Get the original text content without any HTML markup
                const content = document.getElementById('astContent');
                const plainText = content.textContent || content.innerText;
                navigator.clipboard.writeText(plainText).then(() => {
                    const btn = event.target;
                    const originalText = btn.textContent;
                    btn.textContent = '✅ Copied!';
                    setTimeout(() => btn.textContent = originalText, 2000);
                });
            }
            
            // Search functionality - visual highlighting with auto-scroll and navigation
            let originalContent = '';
            let currentMatchIndex = 0;
            let totalMatches = 0;
            
            function updateSearchInfo() {
                const info = document.getElementById('searchInfo');
                const prevBtn = document.getElementById('prevBtn');
                const nextBtn = document.getElementById('nextBtn');
                
                if (totalMatches > 0) {
                    info.textContent = \`\${currentMatchIndex + 1} of \${totalMatches}\`;
                    prevBtn.disabled = false; // Always enabled for cycling
                    nextBtn.disabled = false; // Always enabled for cycling
                } else {
                    info.textContent = '';
                    prevBtn.disabled = true;
                    nextBtn.disabled = true;
                }
            }
            
            function scrollToMatch(index) {
                const match = document.getElementById(\`match-\${index + 1}\`);
                if (match) {
                    match.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'nearest'
                    });
                    
                    // Highlight current match
                    document.querySelectorAll('.search-match').forEach(m => m.classList.remove('current-match'));
                    match.classList.add('current-match');
                }
            }
            
            function nextMatch() {
                if (totalMatches > 0) {
                    currentMatchIndex = (currentMatchIndex + 1) % totalMatches; // Cycle to first after last
                    scrollToMatch(currentMatchIndex);
                    updateSearchInfo();
                }
            }
            
            function previousMatch() {
                if (totalMatches > 0) {
                    currentMatchIndex = (currentMatchIndex - 1 + totalMatches) % totalMatches; // Cycle to last before first
                    scrollToMatch(currentMatchIndex);
                    updateSearchInfo();
                }
            }
            
            const searchBox = document.getElementById('searchBox');
            
            // Search input functionality
            searchBox.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const content = document.getElementById('astContent');
                
                // Store original content on first search
                if (!originalContent) {
                    originalContent = content.textContent;
                }
                
                if (!searchTerm) {
                    // Restore original content without HTML tags
                    content.textContent = originalContent;
                    totalMatches = 0;
                    currentMatchIndex = 0;
                    updateSearchInfo();
                    return;
                }
                
                // Simple text-based search highlighting with unique IDs for navigation
                const regex = new RegExp(searchTerm, 'gi');
                let matchCount = 0;
                let highlighted = originalContent.replace(regex, function(match) {
                    matchCount++;
                    return \`<mark id="match-\${matchCount}" class="search-match">\${match}</mark>\`;
                });
                content.innerHTML = highlighted;
                
                totalMatches = matchCount;
                currentMatchIndex = 0;
                updateSearchInfo();
                
                // Auto-scroll to first match if any matches found
                if (totalMatches > 0) {
                    scrollToMatch(0);
                }
            });
            
            // Enter key navigation
            searchBox.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent form submission
                    nextMatch(); // Cycle to next match
                }
            });
            
            // Initialize
            initializeStats();
        </script>
    </body>
    </html>`;
}

function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function deactivate() {} 