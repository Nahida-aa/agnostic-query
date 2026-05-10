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

export type WhereComparisonOp = UnaryComparisonOp | 'in';

export const multiLogicalWhereOps = ['and', 'or'] as const;
export type MultiLogicalWhereOp = (typeof multiLogicalWhereOps)[number];
export const unaryLogicalWhereOp = 'not';
export type UnaryLogicalWhereOp = typeof unaryLogicalWhereOp;
export type WhereOp =
	| UnaryComparisonOp
	| 'in'
	| MultiLogicalWhereOp
	| UnaryLogicalWhereOp;

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

export type ComparisonWhereValue<
	TShape extends SchemaShape,
	Col extends (keyof TShape & string) | FieldPathByShape<TShape>,
	Op extends WhereComparisonOp,
> = Op extends 'in'
	? Col extends keyof TShape & string
		? TShape[Col][]
		: Col extends FieldPathByShape<TShape>
			? GetPathType<TShape, Col>[]
			: never
	: Col extends keyof TShape & string
		? TShape[Col]
		: Col extends FieldPathByShape<TShape>
			? GetPathType<TShape, Col>
			: never;
export const newComparisonWhere =
	<TShape extends SchemaShape>() =>
	<
		Col extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends WhereComparisonOp,
	>(
		col: Col,
		op: Op,
		value: ComparisonWhereValue<TShape, Col, Op>,
	) => {
		const field = Array.isArray(col) ? col : [col];
		const inputWhere =
			op === 'in' ? { field, op, values: value } : { field, op, value };
		return inputWhere as ComparisonWhere<TShape>;
	};

/**
 * 类型守卫：将 `QueryWhere` 收窄为 `ComparisonWhere`。
 *
 * TS 无法通过 `op === 'and' || op === 'or'` 的否定方向消除
 * `MultiLogicalWhere`（其 discriminant `op` 是 `'and' | 'or'` 联合类型），
 * 导致 `field` / `value` / `values` 在后继代码中不可被类型访问。
 * 此守卫通过显式排除逻辑运算符来绕过该限制。
 */
export const isComparisonWhere = (
	where: QueryWhere,
): where is ComparisonWhere =>
	where.op !== 'not' && where.op !== 'and' && where.op !== 'or';

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

export interface WhereExpr<TShape extends SchemaShape> {
	_q: QueryWhere<TShape> | null;
	where<
		Col extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends WhereComparisonOp,
	>(
		col: Col,
		op: Op,
		value: ComparisonWhereValue<TShape, Col, Op>,
	): WhereExpr<TShape>;
	where(where?: QueryWhere<TShape> | null): WhereExpr<TShape>;
	and(conditions: WhereExpr<TShape>[]): WhereExpr<TShape>;
	or(conditions: WhereExpr<TShape>[]): WhereExpr<TShape>;
	not(condition: WhereExpr<TShape>): WhereExpr<TShape>;
}
export const createExpr = <TShape extends SchemaShape>(
	q?: QueryWhere<TShape> | null,
): WhereExpr<TShape> => {
	const expr = {
		_q: q,
		where<
			Col extends FieldPathByShape<TShape> | (keyof TShape & string),
			Op extends WhereComparisonOp,
		>(col: Col, op: Op, value: ComparisonWhereValue<TShape, Col, Op>) {
			if (col === null || col === undefined) {
				return createExpr(q);
			}
			if (col && typeof col === 'object' && 'op' in col) {
				return createExpr(col as unknown as QueryWhere<TShape>);
			}
			const field = Array.isArray(col) ? col : [col];
			const inputWhere =
				op === 'in' ? { field, op, values: value } : { field, op, value };
			return createExpr(inputWhere as QueryWhere<TShape>);
		},
		and(exprs: WhereExpr<TShape>[]) {
			return createExpr({
				op: 'and',
				conditions: exprs
					.map((e) => e._q)
					.filter(Boolean) as QueryWhere<TShape>[],
			});
		},
		or(exprs: WhereExpr<TShape>[]) {
			return createExpr({
				op: 'or',
				conditions: exprs
					.map((e) => e._q)
					.filter(Boolean) as QueryWhere<TShape>[],
			});
		},
		not(expr: WhereExpr<TShape>) {
			if (expr._q === null || expr._q === undefined) {
				return createExpr();
			}
			return createExpr({ op: 'not', condition: expr._q });
		},
	};
	return expr as WhereExpr<TShape>;
};
export const newWhere = <TShape extends SchemaShape>(
	initState?: QueryWhere<TShape> | null,
) => {
	const state = initState ?? null;
	const where = <
		Col extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends WhereComparisonOp,
	>(
		col: Col,
		op: Op,
		value: ComparisonWhereValue<TShape, Col, Op>,
	) => {
		const field = Array.isArray(col) ? col : [col];
		const inputWhere =
			op === 'in' ? { field, op, values: value } : { field, op, value };
		const oldWheres =
			state?.op === 'and' ? state.conditions || [] : state ? [state] : [];

		const changedWhere = state
			? {
					op: 'and',
					conditions: [...oldWheres, inputWhere],
				}
			: inputWhere;
		return newWhere<TShape>(changedWhere as QueryWhere<TShape>);
	};
	return {
		toJSON: () => state,
		where: (col: any, op?: any, value?: any) => {
			if (col === null || col === undefined) {
				return newWhere<TShape>(state);
			}
			if (typeof col === 'function') {
				const cbWhere = (col as (eb: WhereExpr<TShape>) => WhereExpr<TShape>)(
					createExpr(),
				)._q;
				const changedWhere = state
					? { op: 'and', conditions: [state, cbWhere] }
					: cbWhere;
				return newWhere<TShape>(changedWhere as QueryWhere<TShape>);
			}
			// 新增：col 是 QueryWhere 对象
			if (col && typeof col === 'object' && 'op' in col) {
				const changedWhere: QueryWhere<TShape> = state
					? { op: 'and', conditions: [state, col] }
					: col;
				return newWhere<TShape>(changedWhere);
			}
			return where(col, op, value);
		},
	};
};

const fieldEqual = (a: readonly any[], b: readonly any[]): boolean =>
	a.length === b.length && a.every((v, i) => v === b[i]);

const isComparisonNode = <TField extends readonly any[]>(
	node: QueryWhere,
	field: TField,
): node is ComparisonWhere =>
	'field' in node && fieldEqual(node.field as any, field);

export const findWhere = <TShape extends SchemaShape>(
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
