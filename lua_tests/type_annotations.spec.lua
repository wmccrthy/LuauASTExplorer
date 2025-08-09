local type_annotations = require("../lua_helpers/type_annotations")
local parser = require("@std/syntax/parser")
local visitor = require("@std/syntax/visitor")
local annotateWithType = type_annotations.annotateWithType
local resolveAmbiguousTags, resolveAmbiguousKeys =
	type_annotations.resolveAmbiguousTags, type_annotations.resolveAmbiguousKeys
local typeAnnotationHelpers = require("./helpers/typeAnnotationHelpers")

-- for testAnnotate, match snippets of src (perhaps many small, of each type) to expected output; i am curious how I will be able to generate expected outputs (without being extremely verbose)
local function annotateWithType_test()
	local testAST = annotateWithType(parser.parse(typeAnnotationHelpers.testSrc))
	local typeAnnotationChecker = typeAnnotationHelpers.typeAnnotationVisitor
	visitor.visitBlock(testAST, typeAnnotationChecker)
end
-- can we write a visitor to annotate the tree according to the type of visit function
-- super verbose but write a visitor that overrides each possible visit function
--[[typeAnnotater.visitNodeType = function(node)
        node._astType = NodeType
        return true
    end
]]

-- test function on manually created AstNodes that map to expected output
local function resolveAmbiguousTags_test()
	--[[
        call parseExpr on snippets of code; match type on outermost node against expectedResult
        for ex:
            local testNode = parser.parse('if true then return end')
            local testNodeType = annotateWithType(testNode)
            assert(testNodeType == "AstStatIf")

            local testNode = parser.parse('if true then return else print(1) end')
            local testNodeType = annotateWithType(testNode)
            assert(testNodeType == "AstStatIfElse")
    ]]
end

-- test function on manually created AstNodes that map to expected output
local function resolveAmbiguousKeys_test() end

local function runner()
	annotateWithType_test()
	resolveAmbiguousTags_test()
	resolveAmbiguousKeys_test()
end

runner()
