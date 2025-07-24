-- we can write a separate script for getting the AST in JSON format for simplicity
local fs = require("@lute/fs")
local parser = require("./parser")
local json = require("./json")

-- Get the source file path from command line argument
local args = { ... }

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

local function trimResult(obj)
	if obj.tag == "block" and #obj.statements == 1 then
		-- if the block has only one statement, return the statement, as user is probably highlighting a single line of text
		-- and returning the full block is not useful and unecessarily verbose. Single line inspections are probably one of the most common use cases.
		return obj.statements[1]
	else
		return obj
	end
end


local result
if success then
	result = ast
else
	result = {
		type = "Error",
		timestamp = os.date("%Y-%m-%d %H:%M:%S"),
		error = "Parse Error",
		message = tostring(ast),
	}
end

print(json.encode(trimResult(result)))
