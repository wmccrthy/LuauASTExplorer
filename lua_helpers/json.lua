local stdJson = require("@std/json")

-- Transforms lute's new Punctuated format (array + .separators field)
-- into the frontend-compatible [{node, separator?}] Pair format before encoding.
local function transformPunctuated(node)
	if type(node) ~= "table" then
		return node
	end

	local separators = rawget(node, "separators")
	if separators and rawget(node, 1) ~= nil then
		local pairs = {}
		for i, item in ipairs(node) do
			local pair = { node = transformPunctuated(item) }
			if separators[i] then
				pair.separator = transformPunctuated(separators[i])
			end
			table.insert(pairs, pair)
		end
		return pairs
	end

	local result = {}
	for k, v in pairs(node) do
		result[k] = transformPunctuated(v)
	end
	for i = 1, #node do
		result[i] = transformPunctuated(node[i])
	end
	return result
end

local function encode(value)
	return stdJson.serialize(transformPunctuated(value))
end

local function stripNulls(node)
	if type(node) ~= "table" then
		return node
	end
	local result = {}
	for k, v in pairs(node) do
		if type(k) == "string" and v ~= stdJson.null then
			result[k] = stripNulls(v)
		elseif type(k) == "number" and v ~= stdJson.null then
			result[k] = stripNulls(v)
		end
		-- Skip userdata keys (object/array markers from @std/json)
	end
	return result
end

local function decode(str)
	return stripNulls(stdJson.deserialize(str))
end

return {
	encode = encode,
	decode = decode,
}
