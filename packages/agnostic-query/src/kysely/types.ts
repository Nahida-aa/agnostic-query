import type { SelectQueryBuilder } from 'kysely';

export type TSelectQueryBuilder<
	TShape,
	TableName extends string,
> = SelectQueryBuilder<{ [k in TableName]: TShape }, TableName, TShape>;
