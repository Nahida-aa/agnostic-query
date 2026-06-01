import type {
	ArrayKeyOf,
	FieldPath,
	FieldPathByShape,
	GetPathType,
	SchemaShape,
} from './schema.ts';

export type { ArrayKeyOf };

export const unaryComparisonOps = [
	'=', // eq, equal
	'>', // gt, greater than
	'>=', // gte, greater than or equal
	'<', // lt, less than
	'<=', // lte, less than or equal
	'like',
	'ilike',
] as const;
export type UnaryComparisonOp = (typeof unaryComparisonOps)[number];

export const multiComparisonOps = ['in'] as const;

export const setComparisonOps = [
	'@>', // a contains b, eg: [1, 2, 3] @> [2, 3]; meta contains { "key": "value" }
	'<@', // b contains a eg: [2, 3] <@ [1, 2, 3]
	'&&', //overlap eg: [1, 2] && [2, 3]
] as const;
export type SetComparisonOp = (typeof setComparisonOps)[number];
export type WhereComparisonOp =
	| UnaryComparisonOp
	| 'is null'
	| 'in'
	| SetComparisonOp;

export const predicateOps = ['is null'] as const;
export type PredicateOp = (typeof predicateOps)[number];

export const multiLogicalWhereOps = ['and', 'or'] as const;
export type MultiLogicalWhereOp = (typeof multiLogicalWhereOps)[number];
export const unaryLogicalWhereOp = 'not';
export type UnaryLogicalWhereOp = typeof unaryLogicalWhereOp;
export type WhereOp =
	| UnaryComparisonOp
	| SetComparisonOp
	| 'in'
	| PredicateOp
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
export type SetComparisonWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> = {
	field: TField;
	op: SetComparisonOp;
	value: GetPathType<TShape, TField>;
};

export type ToMultiComparisonWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> = {
	field: TField;
	op: 'in';
	values: GetPathType<TShape, TField>[];
};
export type PredicateWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> = {
	field: TField;
	op: PredicateOp;
};

export type ComparisonWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> =
	| PredicateWhere<TShape, TField>
	| UnaryComparisonWhere<TShape, TField>
	| SetComparisonWhere<TShape, TField>
	| ToMultiComparisonWhere<TShape, TField>;

export type ComparisonWhereValue<
	TShape extends SchemaShape,
	Col extends (keyof TShape & string) | FieldPathByShape<TShape>,
	Op extends WhereComparisonOp,
> = Op extends 'in'
	? Col extends keyof TShape & string
		? TShape[Col] extends readonly any[]
			? 'in is not allowed on array fields'
			: TShape[Col][]
		: Col extends FieldPathByShape<TShape>
			? GetPathType<TShape, Col> extends readonly any[]
				? 'in is not allowed on array fields'
				: GetPathType<TShape, Col>[]
			: never
	: Op extends SetComparisonOp
		? Col extends keyof TShape & string
			? TShape[Col] extends readonly any[]
				? TShape[Col]
				: 'set ops require array fields'
			: Col extends FieldPathByShape<TShape>
				? GetPathType<TShape, Col> extends readonly any[]
					? GetPathType<TShape, Col>
					: 'set ops require array fields'
				: never
		: Op extends PredicateOp
			? never
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
	) =>
		buildInputWhere<TShape>(col, op, value);

export const buildInputWhere = <TShape extends SchemaShape>(
	col: string | readonly any[],
	op: string,
	value: unknown,
): ComparisonWhere<TShape> => {
	const field = (Array.isArray(col) ? col : [col]) as FieldPath;
	if (op === 'in')
		return { field, op, values: value } as ComparisonWhere<TShape>;
	if (op === 'is null') return { field, op } as ComparisonWhere<TShape>;
	return { field, op, value } as ComparisonWhere<TShape>;
};

export const mergeWhere = <TShape extends SchemaShape>(
	existing: QueryWhere<TShape> | null | undefined,
	next: ComparisonWhere<TShape>,
): QueryWhere<TShape> => {
	if (!existing) return next;
	if (existing.op === 'and') {
		return {
			op: 'and',
			conditions: [...(existing.conditions || []), next],
		} as QueryWhere<TShape>;
	}
	return { op: 'and', conditions: [existing, next] } as QueryWhere<TShape>;
};

/**
 * 类型守卫：将 `QueryWhere` 收窄为 `ComparisonWhere`。
 *
 * TS 无法通过 `op === 'and' || op === 'or'` 的否定方向消除
 * `MultiLogicalWhere`（其 discriminant `op` 是 `'and' | 'or'` 联合类型），
 * 导致 `field` / `value` / `values` 在后继代码中不可被类型访问。
 * 此守卫通过显式排除逻辑运算符来绕过该限制。
 */
export const isComparisonWhere = <TShape extends SchemaShape>(
	where: QueryWhere<TShape>,
): where is ComparisonWhere<TShape> =>
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
	| SetComparisonWhere<TShape, TField>
	| ToMultiComparisonWhere<TShape, TField>
	| PredicateWhere<TShape, TField>
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
	where<
		Col extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends PredicateOp,
	>(col: Col, op: Op): WhereExpr<TShape>;
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
				op === 'in'
					? { field, op, values: value }
					: op === 'is null'
						? { field, op }
						: { field, op, value };
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
interface NewWhere<TShape extends SchemaShape = SchemaShape> {
	toJSON(): QueryWhere<TShape> | null | undefined;
	where(cb: (eb: WhereExpr<TShape>) => WhereExpr<TShape>): NewWhere<TShape>;
	where<
		Col extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends WhereComparisonOp,
	>(
		col: Col,
		op: Op,
		value: ComparisonWhereValue<TShape, Col, Op>,
	): NewWhere<TShape>;
	where<
		Col extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends PredicateOp,
	>(col: Col, op: Op): NewWhere<TShape>;
	where(where?: QueryWhere<TShape> | null): NewWhere<TShape>;
}
export const newWhere = <TShape extends SchemaShape>(
	state?: QueryWhere<TShape> | null | undefined,
): NewWhere<TShape> => {
	const where = <
		Col extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends WhereComparisonOp,
	>(
		col: Col,
		op: Op,
		value: ComparisonWhereValue<TShape, Col, Op>,
	) => {
		const inputWhere = buildInputWhere<TShape>(col, op, value);
		const changedWhere = mergeWhere(state, inputWhere);
		return newWhere<TShape>(changedWhere);
	};
	return {
		toJSON: () => state,
		where: (col: unknown, op?: unknown, value?: unknown) => {
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
				const whereObj = col as QueryWhere<TShape>;
				const changedWhere: QueryWhere<TShape> = state
					? { op: 'and', conditions: [state, whereObj] }
					: whereObj;
				return newWhere<TShape>(changedWhere);
			}
			return where(
				col as FieldPathByShape<TShape> | (keyof TShape & string),
				op as WhereComparisonOp,
				value as ComparisonWhereValue<
					TShape,
					FieldPathByShape<TShape> | (keyof TShape & string),
					WhereComparisonOp
				>,
			);
		},
	};
};

const fieldEqual = (a: readonly any[], b: readonly any[]): boolean =>
	a.length === b.length && a.every((v, i) => v === b[i]);

const isComparisonNode = <TField extends readonly any[]>(
	node: QueryWhere,
	field: TField,
): node is ComparisonWhere => 'field' in node && fieldEqual(node.field, field);

export const findWhere = <TShape extends SchemaShape>(
	where?: QueryWhere<TShape> | null,
) => {
	const search = <
		TField extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends WhereComparisonOp,
	>(
		field: TField,
		op?: Op,
	) => {
		if (!where) return;
		const fieldPath = Array.isArray(field) ? field : [field];
		type NormalizeField<
			TShape extends SchemaShape,
			Col extends (keyof TShape & string) | FieldPathByShape<TShape>,
		> = (Col extends FieldPathByShape<TShape>
			? Col
			: [Col] & FieldPathByShape<TShape>) &
			FieldPathByShape<TShape>;
		type ReturnNode<
			TShape extends SchemaShape,
			Col extends (keyof TShape & string) | FieldPathByShape<TShape>,
			Op extends WhereComparisonOp,
		> = Op extends 'in'
			? ToMultiComparisonWhere<TShape, NormalizeField<TShape, Col>>
			: Op extends SetComparisonOp
				? SetComparisonWhere<TShape, NormalizeField<TShape, Col>>
				: Op extends PredicateOp
					? PredicateWhere<TShape, NormalizeField<TShape, Col>>
					: UnaryComparisonWhere<TShape, NormalizeField<TShape, Col>>;
		const walk = (
			node: QueryWhere<TShape>,
		): ReturnNode<TShape, TField, Op> | undefined => {
			if (isComparisonNode(node, fieldPath)) {
				if (!op || node.op === op)
					return node as ReturnNode<TShape, TField, Op>;
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
			search(field, '='),
		in: <TField extends FieldPathByShape<TShape>>(field: TField) =>
			search(field, 'in'),
		find: search,
	};
};

// type DemoShape = {
// 	id: number;
// 	name: string;
// 	tags: { id: number; name: string }[];
// 	category: string[];
// 	address: {
// 		city: {
// 			name: string;
// 		};
// 	};
// };
// const where = {} as QueryWhere<DemoShape>;
// findWhere(where).find('address', '=')?.value;
