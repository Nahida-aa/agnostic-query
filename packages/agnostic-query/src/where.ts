export const baseWhereOps = [
	'eq',
	'gt',
	'gte',
	'lt',
	'lte',
	'like',
	'ilike',
	'in',
] as const;
export type BaseWhereOp = (typeof baseWhereOps)[number];
export const multiWhereOps = ['and', 'or'] as const;
export type MultiWhereOp = (typeof multiWhereOps)[number];
export const unaryWhereOps = ['not'] as const;
export type UnaryWhereOp = (typeof unaryWhereOps)[number];

export type SchemaShape = Record<string, any>;

export type BaseWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends keyof TShape = keyof TShape,
> = {
	[K in TField]: {
		field: K;
		operator: BaseWhereOp;
		conditions: TShape[K];
	};
}[TField];

export type UnaryWhere<
	TShape extends SchemaShape,
	TField extends keyof TShape = keyof TShape,
> = {
	operator: UnaryWhereOp;
	conditions: QueryWhere<TShape, TField>;
};

export type MultiWhere<
	TShape extends SchemaShape,
	TField extends keyof TShape = keyof TShape,
> = {
	operator: MultiWhereOp;
	conditions: QueryWhere<TShape, TField>[];
};

export type QueryWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends keyof TShape = keyof TShape,
> =
	| BaseWhere<TShape, TField>
	| MultiWhere<TShape, TField>
	| UnaryWhere<TShape, TField>;

export const findValueInWhere =
	<TShape extends SchemaShape, TEnabled extends string>(
		where: QueryWhere<TShape, TEnabled> | null,
	) =>
		<TField extends TEnabled>(
			field: TField,
		): TShape[TField] | undefined => {
			if (!where) return;
			const search = (
				node: QueryWhere<TShape, TEnabled>,
			): TShape[TField] | undefined => {
				if ('field' in node && node.field === field) {
					return node.conditions as TShape[TField];
				}
				if ('conditions' in node) {
					if (Array.isArray(node.conditions) && ('operator' in node && (node.operator === 'and' || node.operator === 'or'))) {
						for (const sub of node.conditions) {
							const found = search(sub);
							if (found !== undefined) return found;
						}
					} else if (node.operator === 'not') {
						return search(node.conditions);
					}
				}
			};
			return search(where);
		};
