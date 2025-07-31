import * as vscode from "vscode";
import { ASTParser } from "./astParser";

export function activate(context: vscode.ExtensionContext) {
  console.log("Luau AST Explorer is now active!");

  // Create AST parser instance with extension context
  const astParser = new ASTParser(context);

  // Register the command to show AST
  let disposable = vscode.commands.registerCommand(
    "luau-ast-explorer.showAST",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage("No active editor found");
        return;
      }

      const selection = editor.selection;
      if (selection.isEmpty) {
        vscode.window.showErrorMessage("Please select some code to analyze");
        return;
      }

      const selectedText = editor.document.getText(selection);
      const languageId = editor.document.languageId;

      try {
        // Show progress indicator
        const astResult = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "Parsing AST...",
            cancellable: false,
          },
          async (progress) => {
            progress.report({ increment: 0 });
            const result = await astParser.parseCode(selectedText, languageId);
            progress.report({ increment: 100 });
            return result;
          }
        );

        // Display the AST in a hover-like manner
        await showASTResult(
          astResult,
          editor,
          selection,
          context,
          selectedText
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Error parsing AST: ${error}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function showASTResult(
  astResult: string,
  editor: vscode.TextEditor,
  selection: vscode.Selection,
  context: vscode.ExtensionContext,
  selectedText: string
) {
  // Create a webview panel to display the AST
  const panel = vscode.window.createWebviewPanel(
    "astDisplay",
    "AST Representation",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, "frontend", "build"),
      ],
    }
  );

  // Set the HTML content for the webview
  panel.webview.html = getWebviewContent(
    panel,
    context,
    astResult,
    selectedText
  );

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case "parseAST":
          await handleParseAST(panel, message.code, context);
          break;
        case "parseDiff":
          await handleParseDiff(
            panel,
            message.beforeCode,
            message.afterCode,
            context
          );
          break;
        default:
          console.warn("Unknown message command:", message.command);
      }
    },
    undefined,
    context.subscriptions
  );

  // Optionally, we could also show it as a hover message for a quick preview
  const hoverMessage = new vscode.MarkdownString();
  hoverMessage.appendCodeblock(astResult, "json");

  // Create a decoration to show hover on the selected text
  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: "rgba(255, 255, 0, 0.2)",
    border: "1px solid yellow",
  });

  editor.setDecorations(decorationType, [selection]);

  // Remove decoration after 3 seconds
  setTimeout(() => {
    decorationType.dispose();
  }, 3000);
}

function findBuildFiles(context: vscode.ExtensionContext): {
  jsFile: string | null;
  cssFile: string | null;
} {
  const fs = require("fs");
  const path = require("path");

  try {
    const jsDir = path.join(
      context.extensionPath,
      "frontend",
      "build",
      "static",
      "js"
    );
    const cssDir = path.join(
      context.extensionPath,
      "frontend",
      "build",
      "static",
      "css"
    );

    let jsFile = null;
    let cssFile = null;

    // Find main JS file (starts with "main." and ends with ".js")
    if (fs.existsSync(jsDir)) {
      const jsFiles = fs.readdirSync(jsDir);
      jsFile = jsFiles.find(
        (file: string) =>
          file.startsWith("main.") &&
          file.endsWith(".js") &&
          !file.endsWith(".map")
      );
    }

    // Find main CSS file (starts with "main." and ends with ".css")
    if (fs.existsSync(cssDir)) {
      const cssFiles = fs.readdirSync(cssDir);
      cssFile = cssFiles.find(
        (file: string) =>
          file.startsWith("main.") &&
          file.endsWith(".css") &&
          !file.endsWith(".map")
      );
    }

    return { jsFile, cssFile };
  } catch (error) {
    console.error("Error finding build files:", error);
    return { jsFile: null, cssFile: null };
  }
}

function getWebviewContent(
  panel: vscode.WebviewPanel,
  context: vscode.ExtensionContext,
  astResult: string,
  selectedText: string
): string {
  const { jsFile, cssFile } = findBuildFiles(context);

  if (!jsFile || !cssFile) {
    return `<html><body style="font-family:monospace;padding:20px;background:var(--vscode-editor-background);color:var(--vscode-editor-foreground)">
        <div style="color:var(--vscode-errorForeground)">Build files not found. Run: npm run compile</div>
        <pre style="background:var(--vscode-textCodeBlock-background);padding:16px;margin-top:16px">${astResult}</pre>
        </body></html>`;
  }

  const scriptSrc = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(
      context.extensionUri,
      "frontend",
      "build",
      "static",
      "js",
      jsFile
    )
  );
  const cssSrc = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(
      context.extensionUri,
      "frontend",
      "build",
      "static",
      "css",
      cssFile
    )
  );

  return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
          panel.webview.cspSource
        } 'unsafe-inline'; script-src ${
    panel.webview.cspSource
  } 'unsafe-inline' 'unsafe-eval'; font-src ${
    panel.webview.cspSource
  }; img-src ${panel.webview.cspSource} data:;">
        <title>AST Explorer</title>
        <link rel="stylesheet" href="${cssSrc}" />
        <script>
          window.astData = ${JSON.stringify(astResult)};
          window.astMode = ${JSON.stringify(
            astResult.trim().startsWith("{") ? "json" : "text"
          )};
          window.selectedText = ${JSON.stringify(selectedText)};
        </script>
      </head>
      <body>
        <div id="root"></div>
        <script src="${scriptSrc}"></script>
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

async function handleParseAST(
  panel: vscode.WebviewPanel,
  code: string,
  context: vscode.ExtensionContext
) {
  try {
    // Send loading state to webview
    panel.webview.postMessage({
      command: "parseResult",
      status: "loading",
    });

    // Parse the code using existing ASTParser
    const astParser = new ASTParser(context);
    const astResult = await astParser.parseCode(code, "luau");

    // Send success result to webview
    panel.webview.postMessage({
      command: "parseResult",
      status: "success",
      astResult: astResult,
    });
  } catch (error) {
    // Send error result to webview
    panel.webview.postMessage({
      command: "parseResult",
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleParseDiff(
  panel: vscode.WebviewPanel,
  beforeCode: string,
  afterCode: string,
  context: vscode.ExtensionContext
) {
  try {
    // Send loading state to webview
    panel.webview.postMessage({
      command: "parseDiffResult",
      status: "loading",
    });

    // Parse both code snippets using existing ASTParser
    const astParser = new ASTParser(context);

    // Parse before and after code separately
    const beforeAST = await astParser.parseCode(beforeCode, "luau");
    const afterAST = await astParser.parseCode(afterCode, "luau");

    // Send success result with both ASTs to webview
    panel.webview.postMessage({
      command: "parseDiffResult",
      status: "success",
      beforeAST: beforeAST,
      afterAST: afterAST,
    });
  } catch (error) {
    // Send error result to webview
    panel.webview.postMessage({
      command: "parseDiffResult",
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function deactivate() {}
