// Global window interface for VSCode webview API and AST data
declare global {
    interface Window {
      acquireVsCodeApi?: () => any;
      astData?: string;
      astMode?: 'json' | 'text';
      selectedText?: string;
    }
}

export interface VSCodeAPI {
    postMessage(message: any): void;
    setState?(state: any): void;
    getState?(): any;
}

export interface ParseASTMessage {
    command: 'parseAST';
    code: string;
}

export interface ParseResultMessage {
    command: 'parseResult';
    status: 'loading' | 'success' | 'error';
    astResult?: string;
    error?: string;
}

export interface ASTNode {
    tag?: string;
    location?: {
        begin: { line: number; column: number };
        end: { line: number; column: number };
    };
    [key: string]: any;
}

export enum WindowMode {
    Explorer = 'explorer',      // Current AST viewer (default)
    LiveEditor = 'live-editor', // Window 1: Live code editor + AST
    DiffAnalyzer = 'diff-analyzer' // Window 2: Code transformation diff
}