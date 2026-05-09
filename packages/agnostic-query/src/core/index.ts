import type { QueryOrderBy } from './order-by.ts';
import type { SchemaShape } from './schema.ts';
import type { QueryWhere } from './where.ts';

export type QuerySchema<TShape extends SchemaShape = SchemaShape> = {
	where?: QueryWhere<TShape> | null;
	orderBy?: QueryOrderBy<TShape>[];
	limit?: number;
	offset?: number;
	cursor?: any; // TODO: 先不实现
};
