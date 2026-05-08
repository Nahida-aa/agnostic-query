import { createWhereSchema } from '../zod.ts';
import type { SchemaShape } from './schema.ts';
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

export const multiWhereOps = ['and', 'or'] as const;
export type MultiWhereOp = (typeof multiWhereOps)[number];
export const unaryWhereOp = 'not';
export type UnaryWhereOp = typeof unaryWhereOp;

export type UnaryComparisonWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends keyof TShape = keyof TShape,
> = {
	[K in TField]: {
		field: K;
		operator: UnaryComparisonOp;
		conditions: TShape[K];
	};
}[TField];
export type MultiComparisonWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends keyof TShape = keyof TShape,
> = {
	[K in TField]: {
		field: K;
		operator: 'in';
		conditions: TShape[K][];
	};
}[TField];

export type ComparisonWhere<
	TShape extends SchemaShape = SchemaShape,
	TField extends keyof TShape = keyof TShape,
> = UnaryComparisonWhere<TShape, TField> | MultiComparisonWhere<TShape, TField>;

export type UnaryWhere<
	TShape extends SchemaShape,
	TField extends keyof TShape = keyof TShape,
> = {
	operator: 'not';
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
	| UnaryComparisonWhere<TShape, TField>
	| MultiComparisonWhere<TShape, TField>
	| MultiWhere<TShape, TField>
	| UnaryWhere<TShape, TField>;

const isFieldNode = <TShape extends SchemaShape, TField extends keyof TShape>(
	node: QueryWhere<TShape, any>,
	field: TField,
): node is ComparisonWhere<TShape, TField> =>
	'field' in node && node.field === field;

export const findWhereByField =
	<TShape extends SchemaShape, TEnabled extends string>(
		where: QueryWhere<TShape, TEnabled> | null,
	) =>
	<TField extends TEnabled>(
		field: TField,
	): ComparisonWhere<TShape, TField> | undefined => {
		if (!where) return;
		const search = (
			node: QueryWhere<TShape, TEnabled>,
		): ComparisonWhere<TShape, TField> | undefined => {
			if (isFieldNode(node, field)) {
				return node;
			}
			if ('conditions' in node) {
				if (
					Array.isArray(node.conditions) &&
					'operator' in node &&
					(node.operator === 'and' || node.operator === 'or')
				) {
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

// demo
type UserShape = {
	id: string;
	name: string;
	address: {
		street: string;
		zip: string;
		country: string;
	};
	tags: {
		name: string;
	}[];
};
const demoIn = {
	field: ['address', 'city'],
	operator: 'in',
	conditions: ['New York', 'Los Angeles'],
};
const userWhereSchema = createWhereSchema<UserShape>()(['address']);
const demoOut = userWhereSchema.parse(demoIn);

const address = findWhereByField(demoOut)('address');
address?.conditions;
