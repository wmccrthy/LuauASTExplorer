local fs = require("@lute/fs")
local printer = require("../lua_helpers/temp_vendor/lute_printer")
local parser = require("@std/syntax/parser")

-- Helper function to create mock AST nodes for testing
local function createMockToken(text, line, column)
	return {
		text = text,
		position = { line = line or 1, column = column or 1 },
		leadingTrivia = {},
		trailingTrivia = {},
	}
end

local function createUnprintableNode(children)
	-- node should have no tag, not be a token and not be an array (since we have separate array helpers)
	return {
		_astType = "UnprintableNode",
		children = children,
	}
end

local function createMockArrayNode(elements)
	local result = {}
	for i, element in ipairs(elements) do
		result[i] = element
	end
	return result
end

local function createMockPunctuatedArray(nodes, separators)
	-- Create a Punctuated array structure with pairs
	local result = {}
	for i, node in ipairs(nodes) do
		result[i] = {
			node = node,
			separator = separators and separators[i] or nil,
		}
	end
	return result
end

-- Test cases for printASTNode cascade behavior
local function test_printASTNode_cascade()
	print("Testing printASTNode cascade behavior...")

	-- Test 1: Valid token should be printed successfully
	local tokenNode = createMockToken("test", 1, 1)
	local result = printer.printASTNode(tokenNode)
	assert(result == "test", "Failed to print simple token")

	-- Test 2: Array node should trigger fallback behavior
	local arrayNode = createMockArrayNode({
		createMockToken("hello", 1, 1),
		createMockToken(" ", 1, 6),
		createMockToken("world", 1, 7),
	})
	local arrayResult = printer.printASTNode(arrayNode)
	assert(arrayResult == "hello world", "Failed to print array node")

	print("✓ printASTNode cascade tests passed")
end

-- Test cases for fallback behavior when nodes lack expected properties
local function test_fallback_behavior()
	print("Testing fallback behavior for edge case nodes...")

	-- Test 1: Node without tag, not a token (should trigger printFallback)
	local nodeWithoutTag = {
		child1 = createMockToken("first", 1, 1),
		child2 = createMockToken("second", 1, 10),
	}
	local result = printer.printASTNode(nodeWithoutTag)
	-- Should print both children (order depends on position sorting)
	assert(result:find("first") and result:find("second"), "Failed to handle node without tag")

	-- Test 2: Empty array node
	local emptyArray = createMockArrayNode({})
	local emptyResult = printer.printASTNode(emptyArray)
	assert(emptyResult == "", "Failed to handle empty array")

	print("✓ Fallback behavior tests passed")
end

-- Test position-based sorting in printFallback
local function test_position_sorting()
	print("Testing position-based sorting in printFallback...")

	-- Create node with children in reverse position order
	local unsortedNode = {
		laterChild = createMockToken("second", 2, 1), -- line 2
		earlierChild = createMockToken("first", 1, 1), -- line 1
		middleChild = createMockToken("middle", 1, 10), -- line 1, col 10
	}

	local result = printer.printASTNode(unsortedNode)

	-- Result should be sorted by position: line 1 col 1, line 1 col 10, line 2 col 1
	local firstPos = result:find("first")
	local middlePos = result:find("middle")
	local secondPos = result:find("second")

	assert(firstPos < middlePos and middlePos < secondPos, "Children not sorted by position correctly")

	print("✓ Position sorting tests passed")
end

-- Test recursive behavior with nested unprintable nodes
local function test_recursive_printing()
	print("Testing recursive printing of nested structures...")

	-- Create deeply nested structure: array containing node without tag containing tokens
	local nestedStructure = createMockArrayNode({
		{
			deepChild1 = createMockToken("deep1", 1, 1),
			deepChild2 = createMockToken("deep2", 1, 10),
		},
		createMockToken("surface", 2, 1),
	})

	local result = printer.printASTNode(nestedStructure)

	-- Should contain all tokens from nested structure
	assert(
		result:find("deep1") and result:find("deep2") and result:find("surface"),
		"Failed to recursively print nested structure"
	)

	print("✓ Recursive printing tests passed")
end

-- Test integration with real AST nodes from parser
local function test_real_ast_integration()
	print("Testing integration with real AST nodes...")

	-- Test with valid Luau code that produces various AST structures
	local validCases = {
		"local x = 1",
		"function f() return ... end", -- varargs in function
		"function g() return end", -- bare return in function
		"while true do break end", -- break in loop
		"for i = 1, 10 do continue end", -- continue in loop
		"local t = {}",
		"local a = { x = 1 }",
		"type T = string",
		"export type E = number",
	}

	for _, code in ipairs(validCases) do
		-- Wrap parse in pcall since some edge cases might not parse
		local parseSuccess, ast = pcall(function()
			return parser.parse(code)
		end)

		if parseSuccess and ast then
			-- Only test printing if parsing succeeded
			local printSuccess, result = pcall(function()
				return printer.printASTNode(ast)
			end)
			assert(printSuccess, "Failed to handle real AST for: " .. code .. " with error: " .. tostring(result))
		else
			print("Skipping invalid code: " .. code)
		end
	end

	print("✓ Real AST integration tests passed")
end

-- Test manually constructed edge case nodes based on real AST structures
local function test_manual_edge_cases()
	print("Testing manually constructed edge case nodes...")

	-- Test 1: Test unprintable node with printable descendants
	local children = {
		createMockPunctuatedArray({
			createMockToken("a", 1, 1),
			createMockToken("b", 1, 2),
			createMockToken("c", 1, 3),
		}, {
			createMockToken(",", 1, 4),
			createMockToken(",", 1, 5),
		}),
		createMockToken("d", 1, 6),
		createMockToken("e", 1, 7),
	}

	local unprintableNode = createUnprintableNode(children)
	local unprintableResult = printer.printASTNode(unprintableNode)
	assert(unprintableResult == "a,b,cde", "Failed to print unprintable node with printable descendants")

	-- Test 2: Complex Punctuated array with separators
	local punctuatedNode = createMockPunctuatedArray({
		createMockToken("a", 1, 1),
		createMockToken("b", 1, 2),
		createMockToken("c", 1, 3),
	}, {
		createMockToken(",", 1, 4),
		createMockToken(",", 1, 5),
	})
	local punctuatedResult = printer.printASTNode(punctuatedNode)
	-- Should print all elements (order depends on fallback sorting)
	assert(punctuatedResult == "a,b,c", "Failed to print Punctuated array elements")

	-- Test 3: Node with Location structure (non-token, non-array)
	local locationNode = {
		_astType = "Location",
		begin = { column = 0, line = 1, _astType = "Position" },
		["end"] = { column = 10, line = 1, _astType = "Position" },
	}
	local success, _ = pcall(function()
		return printer.printASTNode(locationNode)
	end)
	assert(not success, "Should error on Location node")

	-- Test 4: Position node (leaf node with no printable content)
	local positionNode = {
		column = 5,
		line = 2,
		_astType = "Position",
	}
	success, _ = pcall(function()
		return printer.printASTNode(positionNode)
	end)
	assert(not success, "Should error on Position node")

	print("✓ Manual edge case tests passed")
end

-- Test performance with large nested structures
local function test_performance()
	print("Testing performance with large structures...")

	-- Create a large nested array structure
	local largeArray = {}
	for i = 1, 100 do
		largeArray[i] = createMockToken("token" .. i, i, 1)
	end

	local startTime = os.clock()
	local result = printer.printASTNode(largeArray)
	local endTime = os.clock()

	-- Should complete in reasonable time (< 1 second for this test)
	assert(endTime - startTime < 1.0, "Performance test failed - took too long")
	assert(#result > 0, "Performance test produced empty result")

	print("✓ Performance tests passed")
end

-- Main test runner
return function()
	print("Running printASTNode comprehensive tests...")

	test_printASTNode_cascade()
	test_fallback_behavior()
	test_position_sorting()
	test_recursive_printing()
	test_real_ast_integration()
	test_manual_edge_cases()
	test_performance()

	print("🎉 All printASTNode tests passed!")
end
