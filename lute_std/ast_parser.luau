-- AST Parser Script using our custom parser library
local fs = require("@lute/fs")
local parser = require("./parser")

-- Get the source file path from command line argument
local args = {...}

if #args < 1 then
    error("Usage: lute run ast_parser.luau <source_file_path>")
end

local sourceFilePath = args[2]

-- Read the source code from file
local sourceCode = fs.readfiletostring(sourceFilePath)

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
        timestamp = os.date("%Y-%m-%d %H:%M:%S"),
        error = "Parse Error",
        message = tostring(ast)
    }
end

-- Print AST in a clean, readable format
local function printAST(obj, indent)
    indent = indent or 0
    local indentStr = string.rep("  ", indent)
    
    if type(obj) == "table" then
        -- First, output tag field if it exists (priority field)
        if obj.tag ~= nil then
            print(indentStr .. "tag: " .. tostring(obj.tag))
        end
        
        -- Then output remaining fields
        for key, value in pairs(obj) do
            local keyStr = tostring(key)
            if keyStr ~= "tag" then -- Skip tag since we already printed it
                if type(value) == "table" then
                    print(indentStr .. keyStr .. ":")
                    printAST(value, indent + 1)
                else
                    print(indentStr .. keyStr .. ": " .. tostring(value))
                end
            end
        end
    else
        print(indentStr .. tostring(obj))
    end
end

printAST(result) 