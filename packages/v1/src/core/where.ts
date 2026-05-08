import { createWhereSchema } from '../zod/where.ts';
import type { FieldPath, FieldPathByShape, SchemaShape } from './schema.ts';

export const unaryComparisonOps = [
	'eq',
	'gt', // ge 是 greater than or equal 的缩写
	'gte',
	'lt',
	'lte',
	'like',
	'ilike',
] as const;
export type UnaryComparisonOp = (typeof unaryComparisonOps)[number];

export const multiComparisonOp = 'in';
export type ComparisonOp = UnaryComparisonOp | 'in';

export const multiLogicalWhereOps = ['and', 'or'] as const;
export type MultiLogicalWhereOp = (typeof multiLogicalWhereOps)[number];
export const unaryLogicalWhereOp = 'not';
export type UnaryLogicalWhereOp = typeof unaryLogicalWhereOp;

// 1. 定义一个工具类型，根据路径获取深度属性的类型
type GetPathType<T, P extends readonly any[]> = P extends readonly [
	infer First,
	...infer Rest,
]
	? First extends keyof T
		? Rest extends []
			? T[First]
			: GetPathType<T[First], Rest>
		: First extends number // 处理数组索引
			? T extends (infer R)[]
				? Rest extends []
					? R
					: GetPathType<R, Rest>
				: never
			: never
	: T;

export type UnaryComparisonWhere<
	TShape extends SchemaShape = SchemaShape,
	// 默认直接使用该 Shape 的全量路径
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
	TShape extends SchemaShape,
	TField extends FieldPathByShape<TShape> = FieldPathByShape<TShape>,
> = {
	op: 'not';
	condition: QueryWhere<TShape, TField>;
};
export type MultiLogicalWhere<
	TShape extends SchemaShape,
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

const isFieldNode = <
	TShape extends SchemaShape,
	TField extends FieldPathByShape<TShape>,
>(
	node: any, // 降低此处约束以便内部检查
	field: TField,
): node is ComparisonWhere<TShape, TField> => {
	return (
		'field' in node &&
		node.field[0] === field[0] &&
		node.field.length === field.length &&
		node.field.every((val: any, i: number) => val === field[i])
	);
};

export const findWhereByField =
	<TShape extends SchemaShape, const TEnabled extends FieldPathByShape<TShape>>(
		where: QueryWhere<TShape, TEnabled> | null,
	) =>
	// 这里 TField 约束为 TEnabled，确保只能查找合法的路径
	<const TField extends TEnabled>(field: TField) => {
		if (!where) return;

		const search = (
			node: QueryWhere<TShape, TEnabled>,
		): ComparisonWhere<TShape, TField> | undefined => {
			// 注意：isFieldNode 需要准确的类型守卫
			if (isFieldNode<TShape, TField>(node, field)) {
				return node;
			}

			if ('op' in node) {
				if (node.op === 'and' || node.op === 'or') {
					for (const sub of node.conditions) {
						const found = search(sub as QueryWhere<TShape, TEnabled>);
						if (found) return found as ComparisonWhere<TShape, TField>;
					}
				} else if (node.op === 'not') {
					return search(node.condition as QueryWhere<TShape, TEnabled>);
				}
			}
			return undefined;
		};

		return search(where);
	};

// 定义查找选项
export type FindOptions<
	TShape extends SchemaShape,
	TField extends FieldPathByShape<TShape>,
> = {
	field?: TField;
	op?: UnaryComparisonOp | 'in';
};

export const _findWhere =
	<TShape extends SchemaShape, TEnabled extends FieldPathByShape<TShape>>(
		where: QueryWhere<TShape, TEnabled> | null,
	) =>
	<const TField extends TEnabled, TOp extends UnaryComparisonOp | 'in'>(
		options: FindOptions<TShape, TField> & { op?: TOp },
	) => {
		if (!where) return undefined;

		const { field, op } = options;

		const search = (node: QueryWhere<TShape, TEnabled>): any => {
			// 核心匹配逻辑：动态判断过滤条件
			if ('field' in node) {
				const fieldMatch = field ? isFieldNode(node, field) : true;
				const opMatch = op ? node.op === op : true;

				if (fieldMatch && opMatch) return node;
			}

			// 递归逻辑
			if ('op' in node) {
				if (node.op === 'and' || node.op === 'or') {
					for (const sub of node.conditions) {
						const found = search(sub);
						if (found) return found;
					}
				} else if (node.op === 'not') {
					return search(node.condition);
				}
			}
			return undefined;
		};

		// 复杂的类型推断：根据传入的 options 组合返回最精确的类型
		type Result = TOp extends 'in'
			? MultiComparisonWhere<TShape, TField>
			: TOp extends UnaryComparisonOp
				? UnaryComparisonWhere<TShape, TField>
				: ComparisonWhere<TShape, TField>;

		return search(where) as Result | undefined;
	};

export const findWhere = <TShape extends SchemaShape>(
	where: QueryWhere<TShape, FieldPathByShape<TShape>> | null,
) => {
	// 预定义常用的操作符方法
	return {
		eq: <const TField extends FieldPathByShape<TShape>>(field: TField) =>
			_findWhere(where)({ field, op: 'eq' }),
		in: <const TField extends FieldPathByShape<TShape>>(field: TField) =>
			_findWhere(where)({ field, op: 'in' }),

		// 也可以保留一个全能方法
		find: <const TField extends FieldPathByShape<TShape>>(
			options: FindOptions<TShape, TField>,
		) => _findWhere(where)(options),
	};
};
