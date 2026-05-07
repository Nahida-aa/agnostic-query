export type SchemaShape = Record<string, any>;

export const orderByDirections = ['asc', 'desc'] as const;
export type OrderByDirection = (typeof orderByDirections)[number];

export type OrderByClause<
	TShape extends SchemaShape = SchemaShape,
	TField extends keyof TShape = keyof TShape,
> = {
	[K in TField]: {
		field: K;
		direction: OrderByDirection;
	};
}[TField];

export type OrderBy<
	TShape extends SchemaShape = SchemaShape,
	TField extends keyof TShape = keyof TShape,
> = OrderByClause<TShape, TField> | OrderByClause<TShape, TField>[];
