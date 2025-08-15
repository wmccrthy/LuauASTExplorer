local fs = require("@lute/fs")
local test_path = "./lua_tests"

local function trim_luau_ext(path)
	local split = string.split(path, ".")
	return table.concat({ split[1], split[2] }, ".")
end

for m, file in fs.listdir(test_path) do
	if file.type ~= "file" or file.name == "runner.luau" then
		continue
	end
	local filePath = "./" .. trim_luau_ext(file.name)
	local test = require(filePath)
	assert(typeof(test) == "function", "Test suite is not a function")
	print(`\n======= Running {file.name} =======\n`)
	test()
	print(`\n======= ✓ {file.name} passed =======\n`)
end
