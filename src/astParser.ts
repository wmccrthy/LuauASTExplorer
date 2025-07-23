import { exec } from 'child_process';
import { promisify } from 'util';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export class ASTParser {
    private luteExecutable: string;
    private extensionPath: string;

    constructor(context: vscode.ExtensionContext) {
        this.extensionPath = context.extensionPath;
        
        // Get the Lute executable path from configuration
        const config = vscode.workspace.getConfiguration('astHighlightHelper');
        const configuredPath = config.get('luteExecutable') as string;
        
        if (configuredPath) {
            this.luteExecutable = configuredPath;
        } else {
            // Auto-detect Lute executable
            this.luteExecutable = this.detectLuteExecutable();
        }
        
        console.log(`ASTParser: Using Lute executable at: ${this.luteExecutable}`);
        console.log(`ASTParser: Extension path: ${this.extensionPath}`);
    }

    private detectLuteExecutable(): string {
        const homeDir = os.homedir();
        const possiblePaths = [
            // Foreman installation paths
            path.join(homeDir, '.foreman', 'bin', 'lute'),
            path.join(homeDir, '.foreman', 'bin', 'lute.exe'), // Windows
            // System paths (fallback)
            'lute',
            '/usr/local/bin/lute',
            '/opt/homebrew/bin/lute'
        ];

        for (const luteePath of possiblePaths) {
            try {
                if (fs.existsSync(luteePath)) {
                    console.log(`Found Lute executable at: ${luteePath}`);
                    return luteePath;
                }
            } catch (error) {
                // Continue to next path
            }
        }

        console.log('Using fallback path: lute');
        return 'lute'; // Fallback to PATH
    }

    async parseCode(code: string, languageId: string): Promise<string> {
        // Check if the language is supported (Luau/Lua)
        if (!this.isLuauCode(languageId)) {
            return this.createUnsupportedLanguageAST(languageId);
        }

        try {
            // Create a temporary file with the code
            const tempFilePath = await this.createTempFile(code);
            
            try {
                // Run Lute to parse the AST
                const astResult = await this.runLuteParser(tempFilePath);
                return astResult;
            } finally {
                // Clean up the temporary file
                await this.deleteTempFile(tempFilePath);
            }
        } catch (error) {
            throw new Error(`Failed to parse AST: ${error}`);
        }
    }

    private isLuauCode(languageId: string): boolean {
        const supportedLanguages = ['lua', 'luau'];
        return supportedLanguages.includes(languageId.toLowerCase());
    }

    private async createTempFile(code: string): Promise<string> {
        const tempDir = os.tmpdir();
        const tempFileName = `ast_temp_${Date.now()}.luau`;
        const tempFilePath = path.join(tempDir, tempFileName);
        
        await fs.promises.writeFile(tempFilePath, code, 'utf8');
        return tempFilePath;
    }

    private async deleteTempFile(filePath: string): Promise<void> {
        try {
            await fs.promises.unlink(filePath);
        } catch (error) {
            // Ignore errors when deleting temp files
            console.warn(`Failed to delete temp file ${filePath}:`, error);
        }
    }

    private async runLuteParser(filePath: string): Promise<string> {
        try {
            // First, check if Lute is available
            await this.checkLuteAvailability();

            // Create a Luau script that uses Lute's syntax parser to parse the AST
            const { scriptPath: parserScriptPath, parserPath: tempParserPath } = await this.createParserScript(filePath);
            
            try {
                // Run the parser script with Lute
                const command = `${this.luteExecutable} run ${parserScriptPath}`;
                console.log(`ASTParser: Running command: ${command}`);
                
                // Get the workspace root directory for foreman.toml
                const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
                console.log(`ASTParser: Using working directory: ${workspaceRoot}`);
                
                const { stdout, stderr } = await execAsync(command, {
                    timeout: 10000, // 10 second timeout
                    maxBuffer: 1024 * 1024, // 1MB buffer
                    cwd: workspaceRoot // Set working directory to workspace root
                });

                if (stderr && !stdout) {
                    throw new Error(`Lute error: ${stderr}`);
                }

                return stdout || this.createErrorAST('No output from Lute');
            } finally {
                // Clean up both temp files
                await this.deleteTempFile(parserScriptPath);
                await this.deleteTempFile(tempParserPath);
            }

        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('command not found') || error.message.includes('not recognized')) {
                    throw new Error(`Lute executable not found at: ${this.luteExecutable}. Please install Lute using foreman or ensure it's in your PATH.`);
                }
                throw new Error(`Lute execution failed: ${error.message}`);
            }
            throw error;
        }
    }

    private async checkLuteAvailability(): Promise<void> {
        try {
            console.log(`ASTParser: Checking Lute availability at: ${this.luteExecutable}`);
            
            // Get the workspace root directory for foreman.toml
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
            console.log(`ASTParser: Checking from working directory: ${workspaceRoot}`);
            
            await execAsync(`${this.luteExecutable} --help`, { 
                timeout: 5000,
                cwd: workspaceRoot // Set working directory to workspace root
            });
            console.log(`ASTParser: Lute is available`);
        } catch (error) {
            console.error(`ASTParser: Lute check failed:`, error);
            throw new Error(`Lute is not available at: ${this.luteExecutable}. Please install it using foreman or ensure it's in your PATH.`);
        }
    }

    private async createParserScript(sourceFilePath: string): Promise<{ scriptPath: string; parserPath: string }> {
        const tempDir = os.tmpdir();
        const timestamp = Date.now();
        const scriptFileName = `ast_parser_${timestamp}.luau`;
        const parserFileName = `parser_${timestamp}.luau`;
        const scriptFilePath = path.join(tempDir, scriptFileName);
        const tempParserPath = path.join(tempDir, parserFileName);
        
        // Copy the parser library from the extension directory to the temp directory
        const sourceParserPath = path.join(this.extensionPath, 'lute_std', 'parser.luau');
        
        try {
            // Copy parser file to temp directory
            const parserContent = await fs.promises.readFile(sourceParserPath, 'utf8');
            await fs.promises.writeFile(tempParserPath, parserContent, 'utf8');
            console.log(`ASTParser: Copied parser to temp: ${tempParserPath}`);
        } catch (error) {
            throw new Error(`Failed to copy parser library: ${error}`);
        }
        
        // Create a Luau script that uses our custom parser library (now using relative path)
        const luauScript = `
-- AST Parser Script using our custom parser library
local fs = require("@lute/fs")
local parser = require("./${parserFileName.replace('.luau', '')}")

-- Read the source file
local sourceCode = fs.readfiletostring("${sourceFilePath.replace(/\\/g, '\\\\')}")

-- Parse the AST using our custom parser
local success, ast = pcall(function()
    return parser.parse(sourceCode)
end)

local result
if success then
    result = ast
else
    result = {
        type = "Error",
        parser = "Lute-Official-AST",
        timestamp = os.date("%Y-%m-%d %H:%M:%S"),
        error = "Parse Error",
        message = tostring(ast)
    }
end

-- Serialize to JSON-like format with circular reference protection and prioritized fields
local function serialize(obj, indent, seen)
    indent = indent or 0
    seen = seen or {}
    local indentStr = string.rep("  ", indent)
    
    if seen[obj] then
        return '"<circular reference>"'
    end
    
    if type(obj) == "table" then
        seen[obj] = true
        local result = "{\\n"
        
        -- Priority fields to show first (most important AST identifiers)
        local priorityFields = {"tag", } -- maybe others later...?
        
        -- First, output priority fields
        for _, priorityField in ipairs(priorityFields) do
            if obj[priorityField] ~= nil then
                result = result .. indentStr .. "  " .. priorityField .. ": " .. serialize(obj[priorityField], indent + 1, seen) .. ",\\n"
            end
        end
        
        -- Then output remaining fields
        for key, value in pairs(obj) do
            if type(key) == "string" or type(key) == "number" then
                local keyStr = type(key) == "string" and key or tostring(key)
                local isPriority = false
                for _, priorityField in ipairs(priorityFields) do
                    if keyStr == priorityField then
                        isPriority = true
                        break
                    end
                end
                if not isPriority then
                    result = result .. indentStr .. "  " .. keyStr .. ": " .. serialize(value, indent + 1, seen) .. ",\\n"
                end
            end
        end
        
        seen[obj] = nil
        result = result .. indentStr .. "}"
        return result
    elseif type(obj) == "string" then
        return '"' .. obj:gsub('"', '\\"') .. '"'
    elseif type(obj) == "number" or type(obj) == "boolean" then
        return tostring(obj)
    elseif obj == nil then
        return "null"
    else
        return '"' .. tostring(obj) .. '"'
    end
end

print(serialize(result))
`;

        await fs.promises.writeFile(scriptFilePath, luauScript, 'utf8');
        return {
            scriptPath: scriptFilePath,
            parserPath: tempParserPath
        };
    }

    private createUnsupportedLanguageAST(languageId: string): string {
        return JSON.stringify({
            error: "Unsupported Language",
            message: `AST parsing is currently only supported for Luau/Lua files. Detected language: ${languageId}`,
            supportedLanguages: ["lua", "luau"],
            suggestion: "Please select Luau/Lua code to parse its AST."
        }, null, 2);
    }

    private createErrorAST(errorMessage: string): string {
        return JSON.stringify({
            error: "Parsing Error",
            message: errorMessage,
            timestamp: new Date().toISOString()
        }, null, 2);
    }

    // Alternative method for parsing without external dependency (fallback)
    private createFallbackAST(code: string): string {
        // This is a simple fallback that creates a basic representation
        // In a real implementation, you might want to use a JavaScript-based Lua parser
        const lines = code.split('\n');
        const ast = {
            type: "Program",
            body: lines.map((line, index) => ({
                type: "Statement",
                line: index + 1,
                content: line.trim(),
                tokens: line.trim().split(/\s+/).filter(token => token.length > 0)
            })),
            metadata: {
                totalLines: lines.length,
                parser: "Fallback AST Generator",
                note: "This is a simplified AST. Install Lute for full AST parsing capabilities."
            }
        };

        return JSON.stringify(ast, null, 2);
    }
} 