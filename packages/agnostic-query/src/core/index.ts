import type { QueryOrderBy } from './order-by.ts';
import type {
	FieldPath,
	FieldPathByShape,
	GetPathType,
	SchemaShape,
} from './schema.ts';
import type {
	QueryWhere,
	UnaryComparisonOp,
	WhereComparisonOp,
	WhereOp,
} from './where.ts';

export type QuerySchema<TShape extends SchemaShape = SchemaShape> = {
	where?: QueryWhere<TShape> | null;
	orderBy?: QueryOrderBy<TShape>[];
	limit?: number;
	offset?: number;
	cursor?: any; // TODO: 先不实现
};

interface WhereExpr<TShape extends SchemaShape> {
	_q: QueryWhere<TShape> | null;
	where<
		Col extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends WhereComparisonOp,
	>(
		col: Col,
		op: Op,
		value: Op extends 'in'
			? Col extends keyof TShape & string
				? TShape[Col][]
				: Col extends FieldPathByShape<TShape>
					? GetPathType<TShape, Col>[]
					: never
			: Col extends keyof TShape & string
				? TShape[Col]
				: Col extends FieldPathByShape<TShape>
					? GetPathType<TShape, Col>
					: never,
	): WhereExpr<TShape>;
	and(conditions: WhereExpr<TShape>[]): QueryWhere<TShape>;
	or(conditions: WhereExpr<TShape>[]): QueryWhere<TShape>;
	not(condition: WhereExpr<TShape>): QueryWhere<TShape>;
}
const createExpr = <TShape extends SchemaShape>(
	q?: QueryWhere<TShape> | null,
): WhereExpr<TShape> => {
	const expr = {
		_q: q,
		where<
			Col extends FieldPathByShape<TShape> | (keyof TShape & string),
			Op extends WhereComparisonOp,
		>(
			col: Col,
			op: Op,
			value: Op extends 'in'
				? Col extends keyof TShape & string
					? TShape[Col][]
					: Col extends FieldPathByShape<TShape>
						? GetPathType<TShape, Col>[]
						: never
				: Col extends keyof TShape & string
					? TShape[Col]
					: Col extends FieldPathByShape<TShape>
						? GetPathType<TShape, Col>
						: never,
		) {
			const field = Array.isArray(col) ? col : [col];
			const inputWhere =
				op === 'in' ? { field, op, values: value } : { field, op, value };
			return createExpr(inputWhere as QueryWhere<TShape>);
		},
		and(exprs: WhereExpr<TShape>[]) {
			return {
				op: 'and',
				conditions: exprs.map((e) => e._q).filter(Boolean),
			} as const;
		},
		or(exprs: WhereExpr<TShape>[]) {
			return {
				op: 'or',
				conditions: exprs.map((e) => e._q).filter(Boolean),
			} as const;
		},
		not(expr: WhereExpr<TShape>) {
			return { op: 'not', condition: expr._q } as const;
		},
	};
	return expr as WhereExpr<TShape>;
};
interface AgnosticQuery<TShape extends SchemaShape = SchemaShape> {
	toJSON(): QuerySchema<TShape>;
	where(
		cb: (eb: WhereExpr<TShape>) => QueryWhere<TShape>,
	): AgnosticQuery<TShape>;
	where<
		Col extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends WhereComparisonOp,
	>(
		col: Col,
		op: Op,
		value: Op extends 'in'
			? Col extends keyof TShape & string
				? TShape[Col][]
				: Col extends FieldPathByShape<TShape>
					? GetPathType<TShape, Col>[]
					: never
			: Col extends keyof TShape & string
				? TShape[Col]
				: Col extends FieldPathByShape<TShape>
					? GetPathType<TShape, Col>
					: never,
	): AgnosticQuery<TShape>;
	orderBy<Col extends FieldPathByShape<TShape> | (keyof TShape & string)>(
		col: Col,
		direction?: 'asc' | 'desc',
	): AgnosticQuery<TShape>;
	limit(value?: number): AgnosticQuery<TShape>;
	offset(value?: number): AgnosticQuery<TShape>;
}

export const aq = <TShape extends SchemaShape = SchemaShape>(
	initState?: QuerySchema<TShape>,
): AgnosticQuery<TShape> => {
	const state: QuerySchema<TShape> = initState || {};
	const where = <
		Col extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends WhereComparisonOp,
	>(
		col: Col,
		op: Op,
		value: Op extends 'in'
			? Col extends keyof TShape & string
				? TShape[Col][]
				: Col extends FieldPathByShape<TShape>
					? GetPathType<TShape, Col>[]
					: never
			: Col extends keyof TShape & string
				? TShape[Col]
				: Col extends FieldPathByShape<TShape>
					? GetPathType<TShape, Col>
					: never,
	) => {
		const field = Array.isArray(col) ? col : [col];
		const oldWheres =
			state.where?.op === 'and'
				? state.where.conditions || []
				: state.where
					? [state.where]
					: [];
		const inputWhere =
			op === 'in' ? { field, op, values: value } : { field, op, value };
		const newWhere = state.where
			? {
					op: 'and',
					conditions: [...oldWheres, inputWhere],
				}
			: inputWhere;
		return aq<TShape>({
			...state,
			where: newWhere as QueryWhere<TShape>,
		});
	};
	return {
		toJSON: () => state,
		where: (col: any, op?: any, value?: any) => {
			if (typeof col === 'function') {
				const cbWhere = col(createExpr());
				const newWhere = state.where
					? { op: 'and', conditions: [state.where, cbWhere] }
					: cbWhere;
				return aq<TShape>({ ...state, where: newWhere as QueryWhere<TShape> });
			}
			return where(col, op, value);
		},
		orderBy: <Col extends FieldPathByShape<TShape> | (keyof TShape & string)>(
			col: Col,
			direction: 'asc' | 'desc' = 'asc',
		): AgnosticQuery<TShape> => {
			const field = (
				Array.isArray(col) ? col : [col]
			) as FieldPathByShape<TShape>;
			const newOrderBy = state.orderBy
				? [...state.orderBy, { field, direction }]
				: [{ field, direction }];
			return aq<TShape>({ ...state, orderBy: newOrderBy });
		},
		limit: (value?: number) => aq<TShape>({ ...state, limit: value }),
		offset: (value?: number) => aq<TShape>({ ...state, offset: value }),
	};
};

type DemoShape = {
	id: number;
	name: string;
	tags: { id: number; name: string }[];
	category: string[];
	address: {
		city: {
			name: string;
		};
	};
};

aq<DemoShape>()
	.where(['address', 'city', 'name'], 'eq', '1')
	.where(['tags', 0, 'name'], 'eq', '2')
	.where('id', 'in', [1])
	.where(({ and, where, or, not }) =>
		or([where('name', 'eq', '3'), where('name', 'eq', '4')]),
	)
	.orderBy('name')
	.orderBy('id', 'desc')
	.limit(31)
	.offset(0);
