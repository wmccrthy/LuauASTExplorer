local fs = require("@lute/fs")
local printer = require("./temp_vendor/lute_printer") -- temp vendoring printer until my updates to support printStatement are released
local json = require("./json")
local process = require("@lute/process")

-- Get the source file path from command line argument
local args = { ... }

if #args < 1 then
	error("Usage: lute run ast_json_to_code.luau <source_file_path>")
end

local sourceFilePath = args[2]

-- Read the source code from file
local sourceCode = fs.readfiletostring(sourceFilePath)

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
-- want to have nicely formatted code, so output to tmp file, run stylua on it, then output formatted contents
if success then
	-- stylua it
	fs.writestringtofile(sourceFilePath, code)
	process.run(`stylua {sourceFilePath}`, { shell = true })
	code = fs.readfiletostring(sourceFilePath)
end
print(code)
