local stdJson = require("@std/json")

-- Lute represents punctuated lists as arrays with a .separators sibling field.
-- JSON arrays can't have named properties, so we serialize these as objects
-- with numeric string keys for items and a "separators" key — matching lute's
-- actual data shape as closely as JSON allows.
local function prepareForJson(node)
	if type(node) ~= "table" then
		return node
	end

	local separators = rawget(node, "separators")
	if separators and rawget(node, 1) ~= nil then
		local result = {}
		for i, item in ipairs(node) do
			result[tostring(i)] = prepareForJson(item)
		end
		local preparedSeparators = {}
		for i, sep in ipairs(separators) do
			preparedSeparators[i] = prepareForJson(sep)
		end
		result.separators = preparedSeparators
		return result
	end

	if rawget(node, 1) ~= nil then
		local result = {}
		for i, v in ipairs(node) do
			result[i] = prepareForJson(v)
		end
		return result
	end

	local result = {}
	for k, v in pairs(node) do
		if type(k) == "string" then
			result[k] = prepareForJson(v)
		end
	end
	return result
end

local function stripMarkers(node)
	if type(node) ~= "table" then
		return node
	end
	local result = {}
	for k, v in pairs(node) do
		if type(k) == "string" and v ~= stdJson.null then
			result[k] = stripMarkers(v)
		elseif type(k) == "number" and v ~= stdJson.null then
			result[k] = stripMarkers(v)
		end
	end
	return result
end

local function encode(value)
	return stdJson.serialize(prepareForJson(value))
end

local function decode(str)
	return stripMarkers(stdJson.deserialize(str))
end

return {
	encode = encode,
	decode = decode,
}
