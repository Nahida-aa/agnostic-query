type Primitive = string | number | boolean | undefined | null;
export type SqlResult = {
	sql: string;
	params: Primitive[];
};
