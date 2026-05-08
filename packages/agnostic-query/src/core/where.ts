import type { FieldPathByShape, GetPathType, SchemaShape } from './schema.ts';

export const unaryComparisonOps = [
	'eq',
	'gt',
	'gte',
	'lt',
	'lte',
	'like',
	'ilike',
] as const;
export type UnaryComparisonOp = (typeof unaryComparisonOps)[number];

export const multiComparisonOp = 'in';

export const multiLogicalWhereOps = ['and', 'or'] as const;
export type MultiLogicalWhereOp = (typeof multiLogicalWhereOps)[number];
export const unaryLogicalWhereOp = 'not';
export type UnaryLogicalWhereOp = typeof unaryLogicalWhereOp;

export type UnaryComparisonWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> = {
	field: TField;
	op: UnaryComparisonOp;
	value: GetPathType<TShape, TField>;
};

export type MultiComparisonWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> = {
	field: TField;
	op: 'in';
	values: GetPathType<TShape, TField>[];
};

export type ComparisonWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> = UnaryComparisonWhere<TShape, TField> | MultiComparisonWhere<TShape, TField>;

export type UnaryLogicalWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> = {
	op: 'not';
	condition: QueryWhere<TShape, TField>;
};

export type MultiLogicalWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> = {
	op: MultiLogicalWhereOp;
	conditions: QueryWhere<TShape, TField>[];
};

export type QueryWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> =
	| UnaryComparisonWhere<TShape, TField>
	| MultiComparisonWhere<TShape, TField>
	| MultiLogicalWhere<TShape, TField>
	| UnaryLogicalWhere<TShape, TField>;

const fieldEqual = (a: readonly any[], b: readonly any[]): boolean =>
	a.length === b.length && a.every((v, i) => v === b[i]);

const isComparisonNode = <TField extends readonly any[]>(
	node: QueryWhere,
	field: TField,
): node is ComparisonWhere =>
	'field' in node && fieldEqual(node.field as any, field);

export const findWhereByField = <TShape extends SchemaShape>(
	where: QueryWhere<TShape> | null,
) => {
	const search = <TField extends FieldPathByShape<TShape>>(
		field: TField,
		op?: UnaryComparisonOp | 'in',
	): ComparisonWhere<TShape, TField> | undefined => {
		if (!where) return;
		const walk = (
			node: QueryWhere<TShape>,
		): ComparisonWhere<TShape, TField> | undefined => {
			if (isComparisonNode(node, field)) {
				if (!op || node.op === op) return node as any;
			}
			if (node.op === 'not') return walk(node.condition);
			if (node.op === 'and' || node.op === 'or') {
				for (const sub of node.conditions) {
					const found = walk(sub);
					if (found) return found;
				}
			}
		};
		return walk(where);
	};

	return {
		eq: <TField extends FieldPathByShape<TShape>>(field: TField) =>
			search(field, 'eq'),
		in: <TField extends FieldPathByShape<TShape>>(field: TField) =>
			search(field, 'in'),
		find: <TField extends FieldPathByShape<TShape>>(
			field: TField,
			op?: UnaryComparisonOp | 'in',
		) => search(field, op),
	};
};
