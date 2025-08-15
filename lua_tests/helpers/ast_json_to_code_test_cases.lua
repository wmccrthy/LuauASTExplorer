return {
	printLocalCases = {
		["test"] = {
			name = {
				leadingTrivia = {},
				position = {
					line = 1,
					column = 1,
				},
				text = "test",
			},
		},
		["test2: number"] = {
			name = {
				leadingTrivia = {},
				trailingTrivia = {},
				position = {
					line = 1,
					column = 1,
				},
				text = "test2",
			},
			colon = {
				leadingTrivia = {},
				trailingTrivia = {
					{
						tag = "whitespace",
						text = " ",
						location = {
							line = 1,
							column = 1,
						},
					},
				},
				position = {
					line = 1,
					column = 1,
				},
				text = ":",
			},
			annotation = {
				tag = "reference",
				name = {
					leadingTrivia = {},
					trailingTrivia = {},
					position = {
						line = 1,
						column = 1,
					},
					text = "number",
				},
			},
		},
	},
	e2eCases = {
		"local x = 1",
		"x += 1",
		"x = 2",
		"if x == 1 then print(1) end",
		"if x == 1 then print(1) else print(2) end",
		"local function f(x: number) return x + 1 end",
		"f(1)",
		"local y = { a = 1, b = 2, ['a'] = 3 }",
		"if y.a then print(y[a]) end",
		"for i=1, 10 do continue end",
		"type z = { a: number, b: string?, [string]: number }",
		"function f(x: number) return x + 1 end",
		"type t = z & { c: number }",
		"type t2 = t | z",
		"for k, v in pairs(y) do print(k, v) end",
		"while x > 0 do x -= 1 end",
		"repeat x += 1 until x > 10",
		"type fn = (x: number, ...string) -> number",
		"type optional = string?",
		'type singleton = "literal" | true | false',
		"local g = function(x, y) return x + y end",
		'local h = if x > 0 then "positive" else "zero or negative"',
		'local tbl = { [1] = "one", two = 2, "three" }',
		"local idx = tbl[1] + tbl.two",
		"local unary = -x + not false",
		"local binary = x and y or false",
		"local cast = x :: number",
		"local group = (x + y) * 2",
		"local vararg = ...",
		"export type MyType = { value: number }",
		"type Generic<T> = { data: T }",
		"local nil_val = nil",
		"return",
	},
}
