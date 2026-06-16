local luau = require("@lute/luau")
local visitor = require("@std/syntax/visitor")

local typeAnnotationVisitor = visitor.create()
local e2ecases = require("./astJsonToCodeHelpers").testCases.e2eCases

--[[
    In writing these tests, I realized we could have just used visitor to annotate types in the first place... (perhaps revisit later)
]]

local validTokenTypes = {
	"CstExprConstantString",
	"CstExprConstantBool",
	"CstExprConstantNumber",
	"CstExprConstantNil",
	"Token",
	"CstAttribute",
	"CstTypeSingletonBool",
	"CstTypeSingletonString",
	"CstExprVarargs",
	"CstStatBreak",
	"CstStatContinue",
	"CstTypeOptional",
}

local function verifyOutput(
	node: luau.AstNode,
	visitorFunction: string,
	verifier: ((node: luau.AstNode) -> boolean) | boolean
)
	if not node._astType then -- avoid failing on nodes that don't have a type
		return
	end
	assert(
		if type(verifier) == "function" then verifier(node) else verifier,
		`Incorrectly annotated node as {node._astType} in {visitorFunction}`
	)
end

typeAnnotationVisitor.visitToken = function(token: luau.Token)
	verifyOutput(token, "visitToken", function(node)
		return table.find(validTokenTypes, node._astType)
	end)
	return true
end

typeAnnotationVisitor.visitExprConstantString = function(token: luau.AstExprConstantString)
	verifyOutput(token, "visitString", token._astType == "CstExprConstantString")
	return true
end

typeAnnotationVisitor.visitExprConstantBool = function(token: luau.AstExprConstantBool)
	verifyOutput(token, "visitBoolean", token._astType == "CstExprConstantBool")
	return true
end

typeAnnotationVisitor.visitExprConstantNumber = function(token: luau.AstExprConstantNumber)
	verifyOutput(token, "visitNumber", token._astType == "CstExprConstantNumber")
	return true
end

typeAnnotationVisitor.visitStatBlock = function(block: luau.AstStatBlock)
	verifyOutput(block, "visitBlock", block._astType == "CstStatBlock")
	return true
end

typeAnnotationVisitor.visitStatAssign = function(node: luau.AstStatAssign)
	verifyOutput(node, "visitAssign", node._astType == "CstStatAssign")
	return true
end

typeAnnotationVisitor.visitStatCompoundAssign = function(node: luau.AstStatCompoundAssign)
	verifyOutput(node, "visitCompoundAssign", node._astType == "CstStatCompoundAssign")
	return true
end

typeAnnotationVisitor.visitExprCall = function(node: luau.AstExprCall)
	verifyOutput(node, "visitCall", node._astType == "CstExprCall")
	return true
end

typeAnnotationVisitor.visitStatLocalFunction = function(node: luau.AstStatLocalFunction)
	verifyOutput(node, "visitLocalFunction", node._astType == "CstStatLocalFunction")
	return true
end

typeAnnotationVisitor.visitExprIfElse = function(node: luau.AstExprIfElse)
	verifyOutput(node, "visitIfExpression", node._astType == "CstExprIfElse")
	return true
end
typeAnnotationVisitor.visitStatIf = function(node: luau.AstStatIf)
	verifyOutput(node, "visitIf", node._astType == "CstStatIf")
	return true
end

-- Add more visitors for comprehensive coverage
typeAnnotationVisitor.visitLocal = function(node: luau.AstStatLocal)
	verifyOutput(node, "visitLocal", node._astType == "CstStatLocal")
	return true
end

typeAnnotationVisitor.visitStatFunction = function(node: luau.AstStatFunction)
	verifyOutput(node, "visitFunction", node._astType == "CstStatFunction")
	return true
end

typeAnnotationVisitor.visitExprFunction = function(node: luau.AstExprFunction)
	verifyOutput(node, "visitExprFunction", node._astType == "CstExprFunction")
	return true
end

typeAnnotationVisitor.visitStatReturn = function(node: luau.AstStatReturn)
	verifyOutput(node, "visitReturn", node._astType == "CstStatReturn")
	return true
end

typeAnnotationVisitor.visitStatBreak = function(node: luau.AstStatBreak)
	verifyOutput(node, "visitBreak", node._astType == "CstStatBreak")
	return true
end

typeAnnotationVisitor.visitStatContinue = function(node: luau.AstStatContinue)
	verifyOutput(node, "visitContinue", node._astType == "CstStatContinue")
	return true
end

typeAnnotationVisitor.visitStatWhile = function(node: luau.AstStatWhile)
	verifyOutput(node, "visitWhile", node._astType == "CstStatWhile")
	return true
end

typeAnnotationVisitor.visitStatRepeat = function(node: luau.AstStatRepeat)
	verifyOutput(node, "visitRepeat", node._astType == "CstStatRepeat")
	return true
end

typeAnnotationVisitor.visitStatFor = function(node: luau.AstStatFor)
	verifyOutput(node, "visitFor", node._astType == "CstStatFor")
	return true
end

typeAnnotationVisitor.visitStatDo = function(node: luau.AstStatDo)
	verifyOutput(node, "visitDo", function(node)
		return node._astType == "CstStatDo" and node.body._astType == "CstStatBlock"
	end)
	return true
end

typeAnnotationVisitor.visitStatForIn = function(node: luau.AstStatForIn)
	verifyOutput(node, "visitForIn", node._astType == "CstStatForIn")
	return true
end

-- Expression visitors
typeAnnotationVisitor.visitExprGroup = function(node: luau.AstExprGroup)
	verifyOutput(node, "visitGroup", node._astType == "CstExprGroup")
	return true
end

typeAnnotationVisitor.visitConstantNil = function(node: luau.AstExprConstantNil)
	verifyOutput(node, "visitConstantNil", node._astType == "CstExprConstantNil")
	return true
end

typeAnnotationVisitor.visitExprVarargs = function(node: luau.AstExprVarargs)
	verifyOutput(node, "visitVarargs", node._astType == "CstExprVarargs")
	return true
end

typeAnnotationVisitor.visitExprGlobal = function(node: luau.AstExprGlobal)
	verifyOutput(node, "visitGlobal", node._astType == "CstExprGlobal")
	return true
end

typeAnnotationVisitor.visitLocal = function(node: luau.AstLocal)
	verifyOutput(node, "visitLocal", node._astType == "CstLocal")
	return true
end

typeAnnotationVisitor.visitExprIndexName = function(node: luau.AstExprIndexName)
	verifyOutput(node, "visitIndexName", node._astType == "CstExprIndexName")
	return true
end

typeAnnotationVisitor.visitExprIndexExpr = function(node: luau.AstExprIndexExpr)
	verifyOutput(node, "visitIndexExpr", node._astType == "CstExprIndexExpr")
	return true
end

typeAnnotationVisitor.visitExprUnary = function(node: luau.AstExprUnary)
	verifyOutput(node, "visitUnary", node._astType == "CstExprUnary")
	return true
end

typeAnnotationVisitor.visitExprBinary = function(node: luau.AstExprBinary)
	verifyOutput(node, "visitBinary", node._astType == "CstExprBinary")
	return true
end

typeAnnotationVisitor.visitExprTypeAssertion = function(node: luau.AstExprTypeAssertion)
	verifyOutput(node, "visitTypeAssertion", node._astType == "CstExprTypeAssertion")
	return true
end

typeAnnotationVisitor.visitExprTable = function(node: luau.AstExprTable)
	verifyOutput(node, "visitTable", node._astType == "CstExprTable")
	return true
end

typeAnnotationVisitor.visitExprInstantiate = function(node: luau.AstExprInstantiate)
	verifyOutput(node, "visitExprInstantiate", node._astType == "CstExprInstantiate")
	return true
end

-- Type visitors
typeAnnotationVisitor.visitTypeReference = function(node: luau.AstTypeReference)
	verifyOutput(node, "visitTypeReference", node._astType == "CstTypeReference")
	return true
end

typeAnnotationVisitor.visitTypeTable = function(node: luau.AstTypeTable)
	verifyOutput(node, "visitTypeTable", node._astType == "CstTypeTable")
	return true
end

typeAnnotationVisitor.visitTypeFunction = function(node: luau.AstTypeFunction)
	verifyOutput(node, "visitTypeFunction", node._astType == "CstTypeFunction")
	return true
end

typeAnnotationVisitor.visitTypeTypeof = function(node: luau.AstTypeTypeof)
	verifyOutput(node, "visitTypeTypeof", node._astType == "CstTypeTypeof")
	return true
end

typeAnnotationVisitor.visitTypeUnion = function(node: luau.AstTypeUnion)
	verifyOutput(node, "visitTypeUnion", node._astType == "CstTypeUnion")
	return true
end

typeAnnotationVisitor.visitTypeIntersection = function(node: luau.AstTypeIntersection)
	verifyOutput(node, "visitTypeIntersection", node._astType == "CstTypeIntersection")
	return true
end

typeAnnotationVisitor.visitTypeError = function(node: luau.AstTypeError)
	verifyOutput(node, "visitTypeError", node._astType == "CstTypeError")
	return true
end

typeAnnotationVisitor.visitTypeSingletonBool = function(node: luau.AstTypeSingletonBool)
	verifyOutput(node, "visitTypeSingletonBool", node._astType == "CstTypeSingletonBool")
	return true
end

typeAnnotationVisitor.visitTypeSingletonString = function(node: luau.AstTypeSingletonString)
	verifyOutput(node, "visitTypeSingletonString", node._astType == "CstTypeSingletonString")
	return true
end

typeAnnotationVisitor.visitTypeOptional = function(node: luau.AstTypeOptional)
	verifyOutput(node, "visitTypeOptional", node._astType == "CstTypeOptional")
	return true
end

-- Type alias and generic visitors
typeAnnotationVisitor.visitStatTypeAlias = function(node: luau.AstStatTypeAlias)
	verifyOutput(node, "visitStatTypeAlias", node._astType == "CstStatTypeAlias")
	return true
end

typeAnnotationVisitor.visitTypePackGeneric = function(node: luau.AstGenericTypePack)
	verifyOutput(node, "visitTypePackGeneric", node._astType == "CstGenericTypePack")
	return true
end

-- Type pack visitors
typeAnnotationVisitor.visitTypePackExplicit = function(node: luau.AstTypePackExplicit)
	verifyOutput(node, "visitTypePackExplicit", node._astType == "CstTypePackExplicit")
	return true
end

typeAnnotationVisitor.visitTypePackVariadic = function(node: luau.AstTypePackVariadic)
	verifyOutput(node, "visitTypePackVariadic", node._astType == "CstTypePackVariadic")
	return true
end

typeAnnotationVisitor.visitTypePackGeneric = function(node: luau.AstTypePackGeneric)
	verifyOutput(node, "visitTypePackGeneric", node._astType == "CstTypePackGeneric")
	return true
end

function printTable(indent, tbl)
	for k, v in pairs(tbl) do
		if typeof(v) == "table" then
			print(indent .. k .. ":")
			printTable(indent .. "  ", v)
		else
			print(indent .. k .. ": ", v)
		end
	end
end

local testSrc = table.concat(e2ecases, "\n")

local ambiguousTagTestCases = {
	-- {nodeTable, expectedType, description}
	{ { tag = "conditional", kind = "stat", endKeyword = {} }, "CstStatIf", "if statement" },
	{ { tag = "conditional", kind = "expr" }, "CstExprIfElse", "if expression" },
	{ { tag = "function", kind = "type", returnSpecifier = {} }, "CstTypeFunction", "type function" },
	{ { tag = "function", kind = "stat", name = {} }, "CstStatFunction", "function statement" },
	{ { tag = "function", kind = "expr" }, "CstExprFunction", "expression function" },
	{ { tag = "group", kind = "expr", expression = {} }, "CstExprGroup", "expression group" },
	{ { tag = "group", kind = "type", type = {} }, "CstTypeGroup", "type group" },
	{ { tag = "local", kind = "expr", token = {}, upvalue = false }, "CstExprLocal", "local expression" },
	{ { tag = "local", kind = "stat", localKeyword = {}, variables = {} }, "CstStatLocal", "local statement" },
	{ { tag = "generic", kind = "typepack", ellipsis = {} }, "CstTypePackGeneric", "generic type pack" },
	{ { tag = "generic" }, "CstGenericType", "generic type" },
}

local ambiguousKeyTestCases = {
	-- {key, node, parent, expectedType, description}
	{ "body", { functionKeyword = {}, openParens = {} }, {}, "CstExprFunction", "function body (CstStatTypeFunction)" },
	{ "body", { statements = {} }, { tag = "if" }, "CstStatBlock", "if body" },
	{ "operand", { tag = "call" }, { operator = {}, tag = "unary" }, "CstExpr", "unary operand" },
	{ "self", {}, {}, "CstLocal", "self parameter" },
	{ "self", {}, { tag = "call" }, "boolean", "no self parameter" },
	{ "condition", { tag = "binary" }, {}, "CstExpr", "condition expression" },
	{ "expression", { tag = "call" }, {}, "CstExpr", "expression" },
	{ "func", { tag = "function" }, {}, "CstExprFunction", "function expression" },
	{ "key", {}, { kind = "record", isTableItem = true }, "Token", "record key" },
	{ "key", {}, { kind = "indexer" }, "CstType", "indexer key" },
	{ "key", {}, { kind = "general", isTableItem = true }, "CstExpr", "general key" },
	{ "key", {}, { kind = "stringproperty" }, "CstTypeSingletonString", "string property key" },
	{ "key", {}, { kind = "property" }, "Token", "property key" },
	{ "value", {}, { colon = {} }, "CstType", "type value" },
	{ "value", {}, { isTableItem = true }, "CstExpr", "expression value" },
	{ "value", {}, { tag = "boolean" }, "boolean", "boolean value" },
	{ "value", {}, { tag = "number" }, "number", "number value" },
	{ "name", { text = "x", kind = "token" }, {}, "Token", "token name" },
	{ "name", { kind = "local", name = {} }, {}, "CstLocal", "local name" },
	{ "name", {}, {}, "CstExpr", "expr name" },
}

return {
	typeAnnotationVisitor = typeAnnotationVisitor,
	testSrc = testSrc,
	printTable = printTable,
	ambiguousTagTestCases = ambiguousTagTestCases,
	ambiguousKeyTestCases = ambiguousKeyTestCases,
}
