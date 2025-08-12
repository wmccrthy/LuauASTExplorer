local fs = require("@lute/fs")
local printer = require("@std/syntax/printer")
local json = require("./json")

-- Get the source file path from command line argument
local args = { ... }

if #args < 1 then
	error("Usage: lute run ast_json_to_code.luau <source_file_path>")
end

local sourceFilePath = args[2]

-- Read the source code from file
local sourceCode = fs.readfiletostring(sourceFilePath)

local astNode = json.decode(sourceCode)

local code
if astNode.tag == "block" then
    code = printer.print(astNode)
else
    code = printer.printexpr(astNode)
end
print(code)