import type {
	OperationNode as KyselyOperationNode,
	SelectQueryBuilder,
} from 'kysely';
import type { QuerySchema } from '../core/index';
import type { SchemaShape } from '../core/schema';
import type { FieldPath, FieldPathByShape } from '../core/schema.ts';
import type { QueryWhere } from '../core/where';
import type { TSelectQueryBuilder } from './types.ts';

const opReverseMap = {
	'=': '=',
	'>': '>',
	'>=': '>=',
	'<': '<',
	'<=': '<=',
	like: 'like',
	ilike: 'ilike',
	in: 'in',
} as const;
export type KyselyNodeUnaryOp =
	| '='
	| '>'
	| '>='
	| '<'
	| '<='
	// | 'not'
	| 'like'
	| 'ilike';

type IdentifierNode = {
	kind: 'IdentifierNode';
	name: string;
};
type ColumnNode = {
	kind: 'ColumnNode';
	column: IdentifierNode;
};
type ReferenceNode = {
	kind: 'ReferenceNode';
	column: ColumnNode;
};
type BinaryOperationNode =
	| {
			kind: 'BinaryOperationNode';
			leftOperand: ReferenceNode;
			operator: OperatorNode;
			rightOperand: ValueNode;
	  }
	| {
			kind: 'BinaryOperationNode';
			leftOperand: ReferenceNode;
			operator: {
				kind: 'OperatorNode';
				operator: 'in';
			};
			rightOperand: PrimitiveValueListNode;
	  };
type OperatorNode = {
	kind: 'OperatorNode';
	operator: KyselyNodeUnaryOp;
};
type ValueNode = {
	kind: 'ValueNode';
	value: any;
};
type PrimitiveValueListNode = {
	kind: 'PrimitiveValueListNode';
	values: any[];
};
type AndNode = {
	kind: 'AndNode';
	left: BinaryOperationNode | AndNode | ParensNode;
	right: BinaryOperationNode;
};
type OrNode = {
	kind: 'OrNode';
	left: BinaryOperationNode;
	right: BinaryOperationNode;
};
type ParensNode = {
	kind: 'ParensNode';
	node: OrNode | AndNode;
};

type RawNode = {
	kind: 'RawNode';
	sqlFragments: string[];
	parameters: any[];
};
type UnaryOperationNode = {
	kind: 'UnaryOperationNode';
	operator: {
		kind: 'OperatorNode';
		operator: 'not';
	};
	operand: BinaryOperationNode;
};
export type OperationNode =
	| ParensNode
	| OrNode
	| UnaryOperationNode
	| BinaryOperationNode
	| AndNode
	| ReferenceNode
	| RawNode;

const parseRawSqlField = (sql: string): FieldPath => {
	const rootMatch = sql.match(/^"((?:[^"]|"")*)"(.*)$/);
	if (!rootMatch) return ['unknown_path'];

	const root = rootMatch[1].replace(/""/g, '"');
	const tail = rootMatch[2];

	if (!tail) return [root];

	if (/^\[\d+\]/.test(tail)) {
		const indices = [...tail.matchAll(/\[(\d+)\]/g)].map(
			(m) => Number(m[1]) - 1,
		);
		return [root, ...indices];
	}

	const segments: (string | number)[] = [];
	for (const m of tail.matchAll(/->>?(?:'((?:[^']|'')*)'|(\d+))/g)) {
		if (m[1] !== undefined) segments.push(m[1].replace(/''/g, "'"));
		else if (m[2] !== undefined) segments.push(Number(m[2]));
	}

	if (segments.length === 0) return ['unknown_path'];
	return [root, ...segments];
};

const parseFieldFromNode = <TShape extends SchemaShape>(
	node: OperationNode,
): FieldPathByShape<TShape> => {
	if (node?.kind === 'ReferenceNode' && node.column?.kind === 'ColumnNode') {
		return [node.column.column.name] as FieldPathByShape<TShape>;
	}
	if (node?.kind === 'RawNode' && node.sqlFragments.length === 1) {
		return parseRawSqlField(node.sqlFragments[0]) as FieldPathByShape<TShape>;
	}

	return ['unknown_path'] as FieldPathByShape<TShape>;
};

const parseWhere = <TShape extends SchemaShape>(
	node?: OperationNode,
): QueryWhere<TShape> | undefined => {
	if (!node) return;
	// console.log('type parseWhereNode =', JSON.stringify(node, null, 2));

	if (node.kind === 'AndNode' || node.kind === 'OrNode') {
		const left = parseWhere(node.left);
		const right = parseWhere(node.right);
		const conditions = [left, right].filter(
			(c): c is QueryWhere<TShape> => !!c,
		);
		if (conditions.length === 0) return;
		if (conditions.length === 1) return conditions[0];
		return { op: node.kind === 'AndNode' ? 'and' : 'or', conditions };
	}

	if (node.kind === 'ParensNode') {
		return parseWhere<TShape>(node.node);
	}

	if (node.kind === 'UnaryOperationNode' && node.operator?.operator === 'not') {
		const inner = parseWhere<TShape>(node.operand);
		if (!inner) return;
		return { op: 'not', condition: inner };
	}

	if (node.kind === 'BinaryOperationNode') {
		const field = parseFieldFromNode<TShape>(node.leftOperand);
		if (field.length === 0) return;

		if (!node.operator?.operator) return;

		if (node.operator?.operator === 'in') {
			return {
				field: field,
				op: 'in',
				values: (node.rightOperand as PrimitiveValueListNode)?.values ?? [],
			};
		}

		return {
			field,
			op: opReverseMap[node.operator.operator],
			value: (node.rightOperand as ValueNode)?.value,
		};
	}

	return;
};

const flattenLogic = <TShape extends SchemaShape>(
	where: QueryWhere<TShape>,
): QueryWhere<TShape> => {
	if (where.op === 'and' || where.op === 'or') {
		const flat: QueryWhere<TShape>[] = [];
		for (const c of where.conditions) {
			const flattened = flattenLogic<TShape>(c);
			if (flattened.op === where.op) {
				flat.push(...flattened.conditions);
			} else {
				flat.push(flattened);
			}
		}
		return { op: where.op, conditions: flat };
	}
	if (where.op === 'not') {
		return { op: 'not', condition: flattenLogic(where.condition) };
	}
	return where;
};

export const fromKysely = <
	TShape extends SchemaShape,
	TableName extends string,
>(
	queryBuilder: TSelectQueryBuilder<TShape, TableName>,
): QuerySchema<TShape> => {
	const node = queryBuilder.toOperationNode();
	const result: QuerySchema<TShape> = {};

	if (node.limit) {
		const limitValue = (node.limit.limit as any).value;
		if (typeof limitValue === 'number') result.limit = limitValue;
	}
	if (node.offset) {
		const offsetValue = (node.offset.offset as any).value;
		if (typeof offsetValue === 'number') result.offset = offsetValue;
	}

	if (node.orderBy && node.orderBy.items.length > 0) {
		result.orderBy = node.orderBy.items.map((item) => {
			const field = parseFieldFromNode<TShape>(item.orderBy as OperationNode);
			return {
				field,
				direction:
					(item.direction as RawNode)?.sqlFragments?.[0] === 'desc'
						? 'desc'
						: 'asc',
			};
		});
	}

	const parsed = parseWhere<TShape>(node.where?.where as OperationNode);
	if (parsed) {
		result.where = flattenLogic<TShape>(parsed);
	}

	return result;
};
