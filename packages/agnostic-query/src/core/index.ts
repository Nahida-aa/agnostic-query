import type { QueryOrderBy } from './order-by.ts';
import type {
	FieldPath,
	FieldPathByShape,
	GetPathType,
	SchemaShape,
} from './schema.ts';
import {
	type ComparisonWhere,
	type ComparisonWhereValue,
	createExpr,
	newComparisonWhere,
	type QueryWhere,
	type UnaryComparisonOp,
	type WhereComparisonOp,
	type WhereExpr,
	type WhereOp,
} from './where.ts';

export interface QuerySchema<TShape extends SchemaShape = SchemaShape> {
	where?: QueryWhere<TShape> | null;
	orderBy?: QueryOrderBy<TShape>[];
	limit?: number;
	offset?: number;
	cursor?: any; // TODO: 先不实现
	table?: string; // 表名, 是可选的, 因为 QuerySchema 只是数据模型, 不帮你执行操作
}

interface AgnosticQuery<TShape extends SchemaShape = SchemaShape> {
	toJSON(): QuerySchema<TShape>;
	where(
		cb: (eb: WhereExpr<TShape>) => WhereExpr<TShape>,
	): AgnosticQuery<TShape>;
	where<
		Col extends FieldPathByShape<TShape> | (keyof TShape & string),
		Op extends WhereComparisonOp,
	>(
		col: Col,
		op: Op,
		value: ComparisonWhereValue<TShape, Col, Op>,
	): AgnosticQuery<TShape>;
	where(where?: QueryWhere<TShape> | null): AgnosticQuery<TShape>;
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
		value: ComparisonWhereValue<TShape, Col, Op>,
	) => {
		const field = Array.isArray(col) ? col : [col];
		const inputWhere =
			op === 'in' ? { field, op, values: value } : { field, op, value };
		const oldWheres =
			state.where?.op === 'and'
				? state.where.conditions || []
				: state.where
					? [state.where]
					: [];

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
			if (col === null || col === undefined) {
				return aq<TShape>(state);
			}
			if (typeof col === 'function') {
				const cbWhere = (col as (eb: WhereExpr<TShape>) => WhereExpr<TShape>)(
					createExpr(),
				)._q;
				const changedWhere = state.where
					? { op: 'and', conditions: [state.where, cbWhere] }
					: cbWhere;
				return aq<TShape>({
					...state,
					where: changedWhere as QueryWhere<TShape>,
				});
			}
			// 新增：col 是 QueryWhere 对象
			if (col && typeof col === 'object' && 'op' in col) {
				const changedWhere: QueryWhere<TShape> = state.where
					? { op: 'and', conditions: [state.where, col] }
					: col;
				return aq<TShape>({ ...state, where: changedWhere });
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
const where5 = newComparisonWhere<DemoShape>()('name', 'eq', '5');
aq<DemoShape>()
	.where(['address', 'city', 'name'], 'eq', '1')
	.where(['tags', 0, 'name'], 'eq', '2')
	.where('id', 'in', [1])
	.where(({ and, where, or, not }) =>
		or([where('name', 'eq', '3'), where('name', 'eq', '4'), where(where5)]),
	)
	.where()
	.orderBy('name')
	.orderBy('id', 'desc')
	.limit(31)
	.offset(0);
