export type Primitive =
	| string
	| number
	| boolean
	| undefined
	| null
	| Primitive[];
export type SqlResult = {
	sql: string;
	params: Primitive[];
};
