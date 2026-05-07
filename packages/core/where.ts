export const baseWhereOps = [
	'eq', // 没有提供 <> (ne, !=) 操作符 虽然 sql 中存在, 但是 sql 也会将 <> 解析为 not + eq 这样的基础算子来执行
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
		// 利用映射类型，确保每个 field 对应的 conditions 必须符合 TShape[field]
		field: K;
		operator: BaseWhereOp;
		conditions: TShape[K]; // 基础值或数组(用于 in)
	};
}[TField];
// 2. 递归类型携带 TShape
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

// 助手函数: 提取器：从复杂查询条件中 找出 指定字段的值
export const findValueInWhere =
	<TShape extends SchemaShape, TEnabled extends string>(
		where: QueryWhere<TShape, TEnabled> | null, // 接收携带 Shape 的对象
	) =>
		<TField extends TEnabled>(
			field: TField,
		): TShape[TField] | undefined => {
			if (!where) return;
			// 内部递归逻辑
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