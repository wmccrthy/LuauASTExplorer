local fs = require("@lute/fs")
local printer = require("./temp_vendor/lute_printer") -- temp vendoring printer until my updates to support printStatement are released
local json = require("./json")
local process = require("@lute/process")
local printTable = require("../lua_tests/helpers/typeAnnotationTestHelpers").printTable

-- Get the source file path from command line argument
local args = { ... }

if #args < 1 then
	error("Usage: lute run ast_json_to_code.luau <source_file_path>")
end

-- print("Calling ast json to code:", args)

local sourceFilePath = args[2]

-- print(sourceFilePath)

-- Read the source code from file
local sourceCode = fs.readfiletostring(sourceFilePath)

-- print(sourceCode)

local astNode = json.decode(sourceCode)

local code, success
success, code = pcall(function()
	return printer.printstatement(astNode)
end)
if not success then
	success, code = pcall(function()
		return printer.printexpr(astNode)
	end)
end
if not success then
	if astNode._astType and string.find(astNode._astType, "Token") then
		success, code = pcall(function()
			return printer.printtoken(astNode)
		end)
	else
		success, code = pcall(function()
			return printer.printlocal(astNode)
		end)
	end
end

if success then
	-- stylua it
	fs.writestringtofile(sourceFilePath, code)
	process.run(`stylua {sourceFilePath}`, { shell = true })
	code = fs.readfiletostring(sourceFilePath)
end
print(code)
