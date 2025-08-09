local luau = require("@lute/luau")
local visitor = require("@std/syntax/visitor")
local parser = require("@std/syntax/parser")
local annotateWithType = require("../../lua_helpers/type_annotations").annotateWithType

local typeAnnotationVisitor = visitor.createVisitor()

--[[
    In writing these tests, I realized we could have just used visitor to annotate types in the first place... (perhaps revisit later)
]]

-- hard to write super precise tests bc some visitor functions are generic/broad (our type assignment cud b more specific)
-- so only test visits that are already narrow
local validTokenTypes = {
	"AstExprConstantString",
	"AstExprConstantBool",
	"AstExprConstantNumber",
	"AstExprConstantNil",
	"Token",
	"AstAttribute",
	"AstTypeSingletonBool",
	"AstTypeSingletonString",
	"AstExprVarargs",
	"AstStatBreak",
	"AstStatContinue",
	"AstTypeOptional",
	"nil", -- avoid failing on nodes that don't have a type
}

local function verifyOutput(
	node: luau.AstNode,
	visitorFunction: string,
	verifier: ((node: luau.AstNode) -> boolean) | boolean
)
	assert(
		if type(verifier) == "function" then verifier(node) else verifier,
		`Incorrectly annotated node as {node._astType} in {visitorFunction}`
	)
	print(`Correctly annotated node as {node._astType} in {visitorFunction}\n`)
end

typeAnnotationVisitor.visitToken = function(token: luau.Token)
	verifyOutput(token, "visitToken", function(node)
		return table.find(validTokenTypes, node._astType)
	end)
	return true
end

typeAnnotationVisitor.visitString = function(token: luau.AstExprConstantString)
	verifyOutput(token, "visitString", token._astType == "AstExprConstantString")
	return true
end

typeAnnotationVisitor.visitBoolean = function(token: luau.AstExprConstantBool)
	verifyOutput(token, "visitBoolean", token._astType == "AstExprConstantBool")
	return true
end

typeAnnotationVisitor.visitNumber = function(token: luau.AstExprConstantNumber)
	verifyOutput(token, "visitNumber", token._astType == "AstExprConstantNumber")
	return true
end

-- we can add similar specific resolution as we use in type_annotations, in certain blocks to try and test precise things like Punctuated<generics>, Pari<generic> and so on

typeAnnotationVisitor.visitBlock = function(block: luau.AstStatBlock)
	verifyOutput(block, "visitBlock", block._astType == "AstStatBlock")
	return true
end

typeAnnotationVisitor.visitAssign = function(node: luau.AstStatAssign)
	verifyOutput(node, "visitAssign", node._astType == "AstStatAssign")
	return true
end

typeAnnotationVisitor.visitCompoundAssign = function(node: luau.AstStatCompoundAssign)
	verifyOutput(node, "visitCompoundAssign", node._astType == "AstStatCompoundAssign")
	return true
end

typeAnnotationVisitor.visitCall = function(node: luau.AstExprCall)
	verifyOutput(node, "visitCall", node._astType == "AstExprCall")
	return true
end

typeAnnotationVisitor.visitLocalFunction = function(node: luau.AstStatLocalFunction)
	verifyOutput(node, "visitLocalFunction", node._astType == "AstStatLocalFunction")
	return true
end

-- want a test for generics somehow...

typeAnnotationVisitor.visitIfExpression = function(node: luau.AstExprIfElse)
	verifyOutput(node, "visitIfExpression", node._astType == "AstExprIfElse")
	return true
end
typeAnnotationVisitor.visitIf = function(node: luau.AstStatIf)
	verifyOutput(node, "visitIf", node._astType == "AstStatIf")
	return true
end

-- Add more visitors for comprehensive coverage
typeAnnotationVisitor.visitLocal = function(node: luau.AstStatLocal)
	verifyOutput(node, "visitLocal", node._astType == "AstStatLocal")
	return true
end

typeAnnotationVisitor.visitFunction = function(node: luau.AstStatFunction)
	verifyOutput(node, "visitFunction", node._astType == "AstStatFunction")
	return true
end

typeAnnotationVisitor.visitAnonymousFunction = function(node: luau.AstExprFunction)
	verifyOutput(node, "visitAnonymousFunction", node._astType == "AstExprFunction")
	return true
end

typeAnnotationVisitor.visitReturn = function(node: luau.AstStatReturn)
	verifyOutput(node, "visitReturn", node._astType == "AstStatReturn")
	return true
end

typeAnnotationVisitor.visitBreak = function(node: luau.AstStatBreak)
	verifyOutput(node, "visitBreak", node._astType == "AstStatBreak")
	return true
end

typeAnnotationVisitor.visitContinue = function(node: luau.AstStatContinue)
	verifyOutput(node, "visitContinue", node._astType == "AstStatContinue")
	return true
end

typeAnnotationVisitor.visitWhile = function(node: luau.AstStatWhile)
	verifyOutput(node, "visitWhile", node._astType == "AstStatWhile")
	return true
end

typeAnnotationVisitor.visitRepeat = function(node: luau.AstStatRepeat)
	verifyOutput(node, "visitRepeat", node._astType == "AstStatRepeat")
	return true
end

typeAnnotationVisitor.visitFor = function(node: luau.AstStatFor)
	verifyOutput(node, "visitFor", node._astType == "AstStatFor")
	return true
end

typeAnnotationVisitor.visitForIn = function(node: luau.AstStatForIn)
	verifyOutput(node, "visitForIn", node._astType == "AstStatForIn")
	return true
end

-- Expression visitors
typeAnnotationVisitor.visitGroup = function(node: luau.AstExprGroup)
	verifyOutput(node, "visitGroup", node._astType == "AstExprGroup")
	return true
end

typeAnnotationVisitor.visitConstantNil = function(node: luau.AstExprConstantNil)
	verifyOutput(node, "visitConstantNil", node._astType == "AstExprConstantNil")
	return true
end

typeAnnotationVisitor.visitVarargs = function(node: luau.AstExprVarargs)
	verifyOutput(node, "visitVarargs", node._astType == "AstExprVarargs")
	return true
end

typeAnnotationVisitor.visitGlobal = function(node: luau.AstExprGlobal)
	verifyOutput(node, "visitGlobal", node._astType == "AstExprGlobal")
	return true
end

typeAnnotationVisitor.visitLocal = function(node: luau.AstLocal)
	verifyOutput(node, "visitLocal", node._astType == "AstLocal")
	return true
end

typeAnnotationVisitor.visitIndexName = function(node: luau.AstExprIndexName)
	verifyOutput(node, "visitIndexName", node._astType == "AstExprIndexName")
	return true
end

typeAnnotationVisitor.visitIndexExpr = function(node: luau.AstExprIndexExpr)
	verifyOutput(node, "visitIndexExpr", node._astType == "AstExprIndexExpr")
	return true
end

typeAnnotationVisitor.visitUnary = function(node: luau.AstExprUnary)
	verifyOutput(node, "visitUnary", node._astType == "AstExprUnary")
	return true
end

typeAnnotationVisitor.visitBinary = function(node: luau.AstExprBinary)
	verifyOutput(node, "visitBinary", node._astType == "AstExprBinary")
	return true
end

typeAnnotationVisitor.visitTypeAssertion = function(node: luau.AstExprTypeAssertion)
	verifyOutput(node, "visitTypeAssertion", node._astType == "AstExprTypeAssertion")
	return true
end

typeAnnotationVisitor.visitTable = function(node: luau.AstExprTable)
	verifyOutput(node, "visitTable", node._astType == "AstExprTable")
	return true
end

-- Type visitors
typeAnnotationVisitor.visitTypeReference = function(node: luau.AstTypeReference)
	verifyOutput(node, "visitTypeReference", node._astType == "AstTypeReference")
	return true
end

typeAnnotationVisitor.visitTypeTable = function(node: luau.AstTypeTable)
	verifyOutput(node, "visitTypeTable", node._astType == "AstTypeTable")
	return true
end

typeAnnotationVisitor.visitTypeFunction = function(node: luau.AstTypeFunction)
	verifyOutput(node, "visitTypeFunction", node._astType == "AstTypeFunction")
	return true
end

typeAnnotationVisitor.visitTypeTypeof = function(node: luau.AstTypeTypeof)
	verifyOutput(node, "visitTypeTypeof", node._astType == "AstTypeTypeof")
	return true
end

typeAnnotationVisitor.visitTypeUnion = function(node: luau.AstTypeUnion)
	verifyOutput(node, "visitTypeUnion", node._astType == "AstTypeUnion")
	return true
end

typeAnnotationVisitor.visitTypeIntersection = function(node: luau.AstTypeIntersection)
	verifyOutput(node, "visitTypeIntersection", node._astType == "AstTypeIntersection")
	return true
end

typeAnnotationVisitor.visitTypeError = function(node: luau.AstTypeError)
	verifyOutput(node, "visitTypeError", node._astType == "AstTypeError")
	return true
end

typeAnnotationVisitor.visitTypeSingletonBool = function(node: luau.AstTypeSingletonBool)
	verifyOutput(node, "visitTypeSingletonBool", node._astType == "AstTypeSingletonBool")
	return true
end

typeAnnotationVisitor.visitTypeSingletonString = function(node: luau.AstTypeSingletonString)
	verifyOutput(node, "visitTypeSingletonString", node._astType == "AstTypeSingletonString")
	return true
end

typeAnnotationVisitor.visitTypeOptional = function(node: luau.AstTypeOptional)
	verifyOutput(node, "visitTypeOptional", node._astType == "AstTypeOptional")
	return true
end

-- Type alias and generic visitors
typeAnnotationVisitor.visitStatTypeAlias = function(node: luau.AstStatTypeAlias)
	verifyOutput(node, "visitStatTypeAlias", node._astType == "AstStatTypeAlias")
	return true
end

typeAnnotationVisitor.visitGenericType = function(node: luau.AstGenericType)
	verifyOutput(node, "visitGenericType", node._astType == "AstGenericType")
	return true
end

typeAnnotationVisitor.visitGenericTypePack = function(node: luau.AstGenericTypePack)
	verifyOutput(node, "visitGenericTypePack", node._astType == "AstGenericTypePack")
	return true
end

-- Type pack visitors
typeAnnotationVisitor.visitTypePackExplicit = function(node: luau.AstTypePackExplicit)
	verifyOutput(node, "visitTypePackExplicit", node._astType == "AstTypePackExplicit")
	return true
end

typeAnnotationVisitor.visitTypePackVariadic = function(node: luau.AstTypePackVariadic)
	verifyOutput(node, "visitTypePackVariadic", node._astType == "AstTypePackVariadic")
	return true
end

typeAnnotationVisitor.visitTypePackGeneric = function(node: luau.AstTypePackGeneric)
	verifyOutput(node, "visitTypePackGeneric", node._astType == "AstTypePackGeneric")
	return true
end

-- Table type property visitors
typeAnnotationVisitor.visitTableTypeProperty = function(node: luau.AstTableTypeProperty)
	verifyOutput(node, "visitTableTypeProperty", node._astType == "AstTableTypeProperty")
	return true
end

typeAnnotationVisitor.visitTableTypeIndexer = function(node: luau.AstTableTypeIndexer)
	verifyOutput(node, "visitTableTypeIndexer", node._astType == "AstTableTypeIndexer")
	return true
end

-- Function type parameter visitors
typeAnnotationVisitor.visitTypeFunctionParameter = function(node: luau.AstTypeFunctionParameter)
	verifyOutput(node, "visitTypeFunctionParameter", node._astType == "AstTypeFunctionParameter")
	return true
end

function printTable(indent, tbl)
	for k, v in pairs(tbl) do
		if typeof(v) == "table" then
			print(indent .. k .. ":")
			printTable(indent .. " ", v)
		else
			print(indent .. k .. ": ", v)
		end
	end
end

local testSrc = [[
    local x = 1
    x += 1
    x = 2
    if x == 1 then print(1) end
    if x == 1 then print(1) else print(2) end
    local function f(x: number)
        return x + 1
    end
    f(1)
    local y = {
        a = 1,
        b = 2,
        ['a'] = 3
    }
    if y.a then print(y[a]) end
    for i=1, 10 do
        continue
    end
    type z = {
        a: number,
        b: string?,
        [string]: number,
    }
    function f(x: number)
        return x + 1
    end
    type t = z & {
        c: number,
    }
    type t2 = t | z
]]

return {
	typeAnnotationVisitor = typeAnnotationVisitor,
	testSrc = testSrc,
	printTable = printTable,
}
