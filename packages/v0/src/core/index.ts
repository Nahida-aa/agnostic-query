import type { QueryOrderBy } from './order-by';
import type { SchemaShape } from './schema';
import type { QueryWhere } from './where';

export type QuerySchema<TShape extends SchemaShape> = {
	where?: QueryWhere<TShape>;
	orderBy?: QueryOrderBy<TShape>[];
	limit?: number;
	offset?: number;
	// cursor TODO:
};
