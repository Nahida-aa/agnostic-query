import type { Expect, Equal, ExpectExtends } from './test-utils.ts';
import type {
	ComparisonWhereValue,
	PredicateWhere,
	QueryWhere,
	SetComparisonWhere,
	ToMultiComparisonWhere,
	UnaryComparisonWhere,
} from './where.ts';

type DemoShape = {
	id: number;
	name: string;
	age: number;
	status: string;
	role: string;
	tags: { id: number; name: string }[];
	category: string[];
	address: {
		city: {
			name: string;
		};
	};
};

// === UnaryComparisonWhere: value 推断 ===
type _t_unary_address = Expect<
	Equal<
		UnaryComparisonWhere<DemoShape, ['address']>['value'],
		{ city: { name: string } }
	>
>;
type _t_unary_name = Expect<Equal<UnaryComparisonWhere<DemoShape, ['name']>['value'], string>>;
type _t_unary_age = Expect<Equal<UnaryComparisonWhere<DemoShape, ['age']>['value'], number>>;
type _t_unary_tags = Expect<
	Equal<
		UnaryComparisonWhere<DemoShape, ['tags']>['value'],
		{ id: number; name: string }[]
	>
>;

// === SetComparisonWhere: value 推断（保留数组类型） ===
type _t_set_tags = Expect<
	Equal<
		SetComparisonWhere<DemoShape, ['tags']>['value'],
		{ id: number; name: string }[]
	>
>;
type _t_set_category = Expect<Equal<SetComparisonWhere<DemoShape, ['category']>['value'], string[]>>;
type _t_set_id = Expect<Equal<SetComparisonWhere<DemoShape, ['id']>['value'], number>>;

// === PredicateWhere: 没有 value 字段 ===
type _t_predicate_key = Expect<
	Equal<keyof PredicateWhere<DemoShape, ['name']>, 'field' | 'op'>
>;
type _t_predicate_op = Expect<
	Equal<PredicateWhere<DemoShape, ['name']>['op'], 'is null'>
>;

// === ToMultiComparisonWhere: values 推断 ===
type _t_multi_name = Expect<Equal<ToMultiComparisonWhere<DemoShape, ['name']>['values'], string[]>>;
type _t_multi_id = Expect<Equal<ToMultiComparisonWhere<DemoShape, ['id']>['values'], number[]>>;

// === ComparisonWhereValue: in 在数组字段上 → 错误信息 ===
type _t_cv_in_tags = Expect<
	Equal<
		ComparisonWhereValue<DemoShape, 'tags', 'in'>,
		'in is not allowed on array fields'
	>
>;
type _t_cv_in_category = Expect<
	Equal<
		ComparisonWhereValue<DemoShape, 'category', 'in'>,
		'in is not allowed on array fields'
	>
>;

// === ComparisonWhereValue: in 在标量字段上 → 值数组 ===
type _t_cv_in_name = Expect<Equal<ComparisonWhereValue<DemoShape, 'name', 'in'>, string[]>>;
type _t_cv_in_id = Expect<Equal<ComparisonWhereValue<DemoShape, 'id', 'in'>, number[]>>;

// === ComparisonWhereValue: is null → never（禁止传值） ===
type _t_cv_isnull = Expect<Equal<ComparisonWhereValue<DemoShape, 'name', 'is null'>, never>>;

// === ComparisonWhereValue: 一元操作符 → 原始值 ===
type _t_cv_eq = Expect<Equal<ComparisonWhereValue<DemoShape, 'name', '='>, string>>;
type _t_cv_gt = Expect<Equal<ComparisonWhereValue<DemoShape, 'age', '>'>, number>>;
type _t_cv_like = Expect<Equal<ComparisonWhereValue<DemoShape, 'name', 'like'>, string>>;
type _t_cv_ilike = Expect<Equal<ComparisonWhereValue<DemoShape, 'name', 'ilike'>, string>>;

// === ComparisonWhereValue: 集合操作符 → 原始字段类型（含数组） ===
type _t_cv_contains = Expect<
	Equal<
		ComparisonWhereValue<DemoShape, 'tags', '@>'>,
		{ id: number; name: string }[]
	>
>;
type _t_cv_contained = Expect<
	Equal<
		ComparisonWhereValue<DemoShape, 'category', '<@'>,
		string[]
	>
>;
type _t_cv_overlaps = Expect<
	Equal<
		ComparisonWhereValue<DemoShape, 'category', '&&'>,
		string[]
	>
>;

// === QueryWhere 可区分联合 ===
// 'is null' 从 QueryWhere 中提取 → PredicateWhere
type _t_qw_isnull_op = Expect<
	Equal<Extract<QueryWhere<DemoShape>, { op: 'is null' }>['op'], 'is null'>
>;
type _t_qw_isnull_no_value = Expect<
	ExpectExtends<keyof Extract<QueryWhere<DemoShape>, { op: 'is null' }>, 'field' | 'op'>
>;
// 'in' → ToMultiComparisonWhere（有 values）
type _t_qw_in_values_keys = Expect<
	ExpectExtends<'values' | 'field' | 'op', keyof Extract<QueryWhere<DemoShape>, { op: 'in' }>>
>;
// '@>' → SetComparisonWhere（有 value）
type _t_qw_contains_value_keys = Expect<
	ExpectExtends<'value' | 'field' | 'op', keyof Extract<QueryWhere<DemoShape>, { op: '@>' }>>
>;
// '@>' → SetComparisonWhere（有 value）
type _t_qw_contains_value = Expect<
	ExpectExtends<
		Extract<QueryWhere<DemoShape>, { op: '@>' }>['value'],
		{ id: number; name: string }[]
	>
>;


