type QuerySchema<TShape extends SchemaShape> = {
	where?: QueryWhere<TShape>;
	orderBy?: QueryOrderBy<TShape>[];
	limit?: number;
	offset?: number;
	// cursor TODO:
};
