local fs = require("@lute/fs")
local printer = require("../lua_helpers/temp_vendor/lute_printer") -- temp vendoring printer until my updates to support printStatement are released
local json = require("../lua_helpers/json")
local parser = require("@std/syntax/parser")
local process = require("@lute/process")
local testCases = require("./helpers/ast_json_to_code_test_cases")
local printLocalCases, e2eCases = testCases.printLocalCases, testCases.e2eCases

local function printer_printlocal_test()
	for expectedOutput, testCase in printLocalCases do
		local result = printer.printlocal(testCase)
		assert(result == expectedOutput, "Failed printlocal on node for src code: " .. expectedOutput)
	end
end

function trim(s)
	return s:gsub("^%s*(.-)%s*$", "%1")
end

local function ast_json_to_code_test()
    local tmpFilePath = "tmpastJsonPath.lua"
    process.run("touch tmp.txt", { shell = true })
	process.run(`touch {tmpFilePath}`, { shell = true })
	for _, code in pairs(e2eCases) do
		fs.writestringtofile(tmpFilePath, code)
		process.run(`stylua {tmpFilePath}`, { shell = true })
		local formattedCode = trim(fs.readfiletostring(tmpFilePath))
		local ast = parser.parse(fs.readfiletostring(tmpFilePath))
		local astJson = json.encode(ast)
		fs.writestringtofile(tmpFilePath, astJson)
		local cmd = process.run({ "lute", `{process.cwd()}/lua_helpers/ast_json_to_code.luau`, tmpFilePath })
		local formattedResult = trim(cmd.stdout)
		process.run(`rm {tmpFilePath}`, { shell = true })
		assert(
			formattedResult == formattedCode,
			"Incorrectly parsed:\n" .. formattedCode .. "\n as:\n" .. formattedResult
		)
	end
end

return function()
	printer_printlocal_test()
	ast_json_to_code_test()
end
