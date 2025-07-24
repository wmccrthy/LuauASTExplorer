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
        parser = "Lute-Official-AST",
        timestamp = os.date("%Y-%m-%d %H:%M:%S"),
        error = "Parse Error",
        message = tostring(ast)
    }
end

-- Serialize to clean JSON format with prioritized fields
local function serialize(obj, indent)
    indent = indent or 0
    local indentStr = string.rep("  ", indent)
    
    if type(obj) == "table" then
        local result = "\n"
        
        -- First, output tag field if it exists
        if obj.tag ~= nil then
            result = result .. indentStr .. "  tag: " .. serialize(obj.tag, indent + 1) .. "\n"
        end
        
        -- Then output remaining fields
        for key, value in pairs(obj) do
            if type(key) == "string" or type(key) == "number" then
                local keyStr = type(key) == "string" and key or tostring(key)
                if keyStr ~= "tag" then
                    result = result .. indentStr .. "  " .. keyStr .. ": " .. serialize(value, indent + 1) .. "\n"
                end
            end
        end
        
        result = result .. indentStr
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